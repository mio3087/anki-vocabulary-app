"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAppLanguage, type AppLanguage } from "@/app/component/AppLanguage";

type StudyRange = {
  start: number;
  end: number;
  date: string;
};

type Material = {
  id: string;
  name: string;
  language: string;
  type: "book" | "deck";
  total: number;
  studyRanges: StudyRange[];
};

type Plan = {
  id: string;
  deckName: string;
  materialId?: string;
  totalItems: number;
  startDate: string;
  deadline: string;
  rounds: number;
  weekdays: number[];
  createdAt: string;
  status?: "pending" | "completed" | "postponed";
};

type TaskStatus = "未着手" | "進行中" | "完了";
type TaskType = "教材の学習" | "単語の暗記・復習";
type TaskUnit = "単語" | "ページ" | "分" | "章" | "回";

type StudyTask = {
  id: string;
  title: string;
  type: TaskType;
  material: string;
  target: number;
  unit: TaskUnit;
  startDate: string;
  scheduledDate: string;
  dueDate: string;
  status: TaskStatus;
  repeat: "なし" | "毎日" | "毎週";
  repeatDays: number[];
};

type QuoteCard = {
  id: string;
  quote: string;
  author: string;
  translation: string;
  language: string;
  rarity: "Common" | "Rare" | "SSR";
};

type UserGamificationStats = {
  streak: number;
  xp: number;
  level: number;
  lastDate: string;
  freezeCount: number; // お休みチケット所持数
  unlockedCards: string[]; // 獲得した名言カードID
};

// ガチャで手に入る名言リスト
const QUOTE_DATABASE: QuoteCard[] = [
  {
    id: "de-1",
    quote: "Aller Anfang ist schwer.",
    author: "German Proverb",
    translation: "どんな始まりも難易度が高い（はじめの一歩が一番難しい）。",
    language: "Deutsch",
    rarity: "Common",
  },
  {
    id: "it-1",
    quote: "Chi va piano, va sano e va lontano.",
    author: "Italian Proverb",
    translation: "着実に進む者が、健全に遠くまで到達する。",
    language: "Italiano",
    rarity: "Common",
  },
  {
    id: "zh-1",
    quote: "千里之行，始於足下。",
    author: "老子 (Laozi)",
    translation: "千里の行も足元の一歩から始まる。",
    language: "中文",
    rarity: "Rare",
  },
  {
    id: "en-1",
    quote: "The limits of my language mean the limits of my world.",
    author: "Ludwig Wittgenstein",
    translation: "私の言語の限界が、私の世界の限界を意味する。",
    language: "English",
    rarity: "SSR",
  },
  {
    id: "de-2",
    quote: "Übung macht den Meister.",
    author: "German Proverb",
    translation: "練習が巨匠を作る（継続は力なり）。",
    language: "Deutsch",
    rarity: "Common",
  },
  {
    id: "it-2",
    quote: "La virtù è la sua propria ricompensa.",
    author: "Cicero",
    translation: "美徳それ自体がご褒美である。",
    language: "Italiano",
    rarity: "Rare",
  },
];

const PLAN_STORAGE_KEY = "anki-study-plans-v1";
const line = "#E7E8E3";
const muted = "#858A82";
const accent = "var(--anki-theme-color)";

const localeMap: Record<AppLanguage, string> = {
  ja: "ja-JP",
  en: "en-US",
  de: "de-DE",
  "zh-CN": "zh-CN",
  "zh-TW": "zh-TW",
  es: "es-ES",
  it: "it-IT",
};

const copy = {
  ja: {
    title: "今日のノルマ",
    today: "今日",
    taskManagement: "タスク管理",
    overview: "TODAY AT A GLANCE",
    completion: "タスク達成率",
    completed: "完了",
    remaining: "残り",
    plans: "今日の学習計画",
    tasks: "今日やること",
    noTasks: "今日のタスクはありません",
    noTasksDescription: "タスク管理から予定を追加できます。",
    addTask: "タスクを追加",
    loading: "読み込み中...",
    login: "ログインが必要です",
    loginDescription: "ログインすると学習計画とタスクが表示されます。",
    taskError: "タスクを読み込めませんでした。",
    updateError: "タスクを更新できませんでした。",
    markDone: "完了にする",
    markUndone: "未完了に戻す",
    notStarted: "未着手",
    inProgress: "進行中",
    done: "完了",
    untitled: "名称未設定",
    days: "学習日",
    streakTitle: "連続学習ストリーク",
    streakDays: "日連続",
    freezeLabel: "お休みチケット",
    drawGacha: "100 XPで名言ガチャを引く",
    gachaTitle: "🎁 名言カードGET！",
    gachaCostError: "XPが足りません！タスクを完了して100 XP貯めましょう。",
    close: "閉じる",
    levelLabel: "Lv.",
    xpLabel: "XP",
    allCompletedBonus: "🎁 今日のタスク全クリアボーナス！ +50 XP 獲得！",
    motivationCheer: "今日も一歩前進！あなたのペースで積み重ねましょう。",
    motivationHalf: "半分以上クリア！その調子です！",
    motivationDone: "今日の目標を完全制覇しました！素晴らしい集中力です！🎉",
  },
  en: {
    title: "Today's Goals",
    today: "TODAY",
    taskManagement: "Tasks",
    overview: "TODAY AT A GLANCE",
    completion: "Task completion",
    completed: "Completed",
    remaining: "Remaining",
    plans: "Today's Study Plan",
    tasks: "Today's Tasks",
    noTasks: "No tasks for today",
    noTasksDescription: "Add tasks in Task Management.",
    addTask: "Add a task",
    loading: "Loading...",
    login: "Login required",
    loginDescription: "Log in to see your study plans and tasks.",
    taskError: "Could not load tasks.",
    updateError: "Could not update the task.",
    markDone: "Mark as done",
    markUndone: "Mark as incomplete",
    notStarted: "Not started",
    inProgress: "In progress",
    done: "Completed",
    untitled: "Untitled",
    days: "study days",
    streakTitle: "Study Streak",
    streakDays: "days straight",
    freezeLabel: "Streak Freeze",
    drawGacha: "Draw Quote Card (100 XP)",
    gachaTitle: "🎁 Quote Card Unlocked!",
    gachaCostError: "Not enough XP! Complete tasks to earn 100 XP.",
    close: "Close",
    levelLabel: "Lv.",
    xpLabel: "XP",
    allCompletedBonus: "🎁 Daily Completion Bonus! Earned +50 XP!",
    motivationCheer: "One step forward today! Keep building your habit.",
    motivationHalf: "Over half way there! Keep going!",
    motivationDone: "All tasks completed! Amazing focus today! 🎉",
  },
  de: {
    title: "Heutige Lernziele",
    today: "HEUTE",
    taskManagement: "Aufgaben",
    overview: "TAGESÜBERSICHT",
    completion: "Aufgabenfortschritt",
    completed: "Erledigt",
    remaining: "Offen",
    plans: "Heutiger Lernplan",
    tasks: "Heutige Aufgaben",
    noTasks: "Keine Aufgaben für heute",
    noTasksDescription: "Füge Aufgaben in der Aufgabenverwaltung hinzu.",
    addTask: "Aufgabe hinzufügen",
    loading: "Wird geladen...",
    login: "Anmeldung erforderlich",
    loginDescription: "Melde dich an, um Lernpläne und Aufgaben zu sehen.",
    taskError: "Aufgaben konnten nicht geladen werden.",
    updateError: "Aufgabe konnte nicht aktualisiert werden.",
    markDone: "Erledigt",
    markUndone: "Wieder öffnen",
    notStarted: "Nicht begonnen",
    inProgress: "In Bearbeitung",
    done: "Erledigt",
    untitled: "Ohne Titel",
    days: "Lerntage",
    streakTitle: "Lernserie",
    streakDays: "Tage in Folge",
    freezeLabel: "Streak-Schutz",
    drawGacha: "Zitat-Karte ziehen (100 XP)",
    gachaTitle: "🎁 Zitat-Karte freigeschaltet!",
    gachaCostError: "Nicht genug XP! Schließe Aufgaben ab.",
    close: "Schließen",
    levelLabel: "Lv.",
    xpLabel: "XP",
    allCompletedBonus: "🎁 Tagesbonus erhalten! +50 XP!",
    motivationCheer: "Einen Schritt nach dem anderen. Bleib dran!",
    motivationHalf: "Über die Hälfte geschafft! Weiter so!",
    motivationDone: "Alle Aufgaben für heute abgeschlossen! Tolle Arbeit! 🎉",
  },
  "zh-CN": {
    title: "今日目标",
    today: "今日",
    taskManagement: "任务管理",
    overview: "今日概览",
    completion: "任务完成率",
    completed: "已完成",
    remaining: "剩余",
    plans: "今日学习计划",
    tasks: "今日任务",
    noTasks: "今天没有任务",
    noTasksDescription: "可以在任务管理中添加任务。",
    addTask: "添加任务",
    loading: "正在加载...",
    login: "需要登录",
    loginDescription: "登录后即可查看学习计划和任务。",
    taskError: "无法加载任务。",
    updateError: "无法更新任务。",
    markDone: "标记完成",
    markUndone: "恢复未完成",
    notStarted: "未开始",
    inProgress: "进行中",
    done: "已完成",
    untitled: "未命名",
    days: "学习日",
    streakTitle: "连续学习打卡",
    streakDays: "天连续",
    freezeLabel: "保命卡",
    drawGacha: "消耗 100 XP 抽取名言卡",
    gachaTitle: "🎁 获得名言卡片！",
    gachaCostError: "XP 不足！请先完成任务积累 100 XP。",
    close: "关闭",
    levelLabel: "Lv.",
    xpLabel: "XP",
    allCompletedBonus: "🎁 今日任务全勤通关！获得 +50 XP 奖励！",
    motivationCheer: "每天进步一点点，保持节奏！",
    motivationHalf: "已经完成过半啦，加油！",
    motivationDone: "太棒了！今日任务全部完美完成！🎉",
  },
  "zh-TW": {
    title: "今日目標",
    today: "今日",
    taskManagement: "任務管理",
    overview: "今日概覽",
    completion: "任務完成率",
    completed: "已完成",
    remaining: "剩餘",
    plans: "今日學習計畫",
    tasks: "今日任務",
    noTasks: "今天沒有任務",
    noTasksDescription: "可以在任務管理中新增任務。",
    addTask: "新增任務",
    loading: "載入中...",
    login: "需要登入",
    loginDescription: "登入後即可查看學習計畫和任務。",
    taskError: "無法載入任務。",
    updateError: "無法更新任務。",
    markDone: "標記完成",
    markUndone: "恢復未完成",
    notStarted: "未開始",
    inProgress: "進行中",
    done: "已完成",
    untitled: "未命名",
    days: "學習日",
    streakTitle: "連續學習打卡",
    streakDays: "天連續",
    freezeLabel: "保命卡",
    drawGacha: "消耗 100 XP 抽取名言卡",
    gachaTitle: "🎁 獲得名言卡片！",
    gachaCostError: "XP 不足！請先完成任務積累 100 XP。",
    close: "關閉",
    levelLabel: "Lv.",
    xpLabel: "XP",
    allCompletedBonus: "🎁 今日任務全勤通關！獲得 +50 XP 獎勵！",
    motivationCheer: "每天進步一點點，保持節奏！",
    motivationHalf: "已經完成過半啦，加油！",
    motivationDone: "太棒了！今日任務全部完美完成！🎉",
  },
  es: {
    title: "Objetivos de hoy",
    today: "HOY",
    taskManagement: "Tareas",
    overview: "RESUMEN DE HOY",
    completion: "Tareas completadas",
    completed: "Completadas",
    remaining: "Pendientes",
    plans: "Plan de estudio de hoy",
    tasks: "Tareas de hoy",
    noTasks: "No hay tareas para hoy",
    noTasksDescription: "Añade tareas en Gestión de tareas.",
    addTask: "Añadir tarea",
    loading: "Cargando...",
    login: "Es necesario iniciar sesión",
    loginDescription: "Inicia sesión para ver tus planes y tareas.",
    taskError: "No se pudieron cargar las tareas.",
    updateError: "No se pudo actualizar la tarea.",
    markDone: "Marcar como completada",
    markUndone: "Marcar como pendiente",
    notStarted: "Sin empezar",
    inProgress: "En curso",
    done: "Completada",
    untitled: "Sin título",
    days: "días de estudio",
    streakTitle: "Racha de estudio",
    streakDays: "días seguidos",
    freezeLabel: "Protector de racha",
    drawGacha: "Obtener tarjeta de cita (100 XP)",
    gachaTitle: "🎁 ¡Tarjeta desvelada!",
    gachaCostError: "¡XP insuficiente! Completa tareas primero.",
    close: "Cerrar",
    levelLabel: "Nivel",
    xpLabel: "XP",
    allCompletedBonus: "🎁 ¡Bono de tareas completadas! ¡+50 XP!",
    motivationCheer: "¡Un paso más hoy! Sigue construyendo tu hábito.",
    motivationHalf: "¡Más de la mitad completada! ¡Sigue así!",
    motivationDone: "¡Todas las tareas completadas! ¡Gran enfoque hoy! 🎉",
  },
};

const statusLabel: Record<TaskStatus, keyof typeof copy.ja> = {
  未着手: "notStarted",
  進行中: "inProgress",
  完了: "done",
};

function dateString(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function weekdayIndex(date = new Date()) {
  return (date.getDay() + 6) % 7;
}

function normalizeTask(id: string, data: Record<string, unknown>): StudyTask {
  const units: TaskUnit[] = ["単語", "ページ", "分", "章", "回"];
  const statuses: TaskStatus[] = ["未着手", "進行中", "完了"];
  const repeats = ["なし", "毎日", "毎週"] as const;

  return {
    id,
    title: typeof data.title === "string" ? data.title : "",
    type: data.type === "教材の学習" ? "教材の学習" : "単語の暗記・復習",
    material: typeof data.material === "string" ? data.material : "",
    target: typeof data.target === "number" ? data.target : 0,
    unit: units.includes(data.unit as TaskUnit) ? (data.unit as TaskUnit) : "単語",
    startDate: typeof data.startDate === "string" ? data.startDate : "",
    scheduledDate: typeof data.scheduledDate === "string" ? data.scheduledDate : "",
    dueDate: typeof data.dueDate === "string" ? data.dueDate : "",
    status: statuses.includes(data.status as TaskStatus) ? (data.status as TaskStatus) : "未着手",
    repeat: repeats.includes(data.repeat as (typeof repeats)[number])
      ? (data.repeat as (typeof repeats)[number])
      : "なし",
    repeatDays: Array.isArray(data.repeatDays)
      ? data.repeatDays.filter(
          (value): value is number => typeof value === "number" && value >= 0 && value <= 6
        )
      : [],
  };
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: muted }}>
      {children}
    </p>
  );
}

export default function TodayPage() {
  const { language } = useAppLanguage();
  const tr = copy[language as keyof typeof copy] ?? copy.ja;

  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [showBonusBanner, setShowBonusBanner] = useState(false);
  const [drawnCard, setDrawnCard] = useState<QuoteCard | null>(null);
  const [gachaError, setGachaError] = useState("");

  const [stats, setStats] = useState<UserGamificationStats>({
    streak: 1,
    xp: 0,
    level: 1,
    lastDate: "",
    freezeCount: 0,
    unlockedCards: [],
  });

  const today = dateString();
  const todayWeekday = weekdayIndex();
  const now = new Date();
  const locale = localeMap[language] ?? "ja-JP";

  const formattedDate = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(now);

  const englishDate = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(now).toUpperCase();

  useEffect(() => {
    const refreshPlans = () => {
      try {
        const saved = localStorage.getItem(PLAN_STORAGE_KEY);
        const parsed = saved ? JSON.parse(saved) : [];
        setPlans(Array.isArray(parsed) ? parsed : []);
      } catch (error) {
        console.error("Study plan loading error:", error);
        setPlans([]);
      }
    };

    refreshPlans();
    window.addEventListener("storage", refreshPlans);
    window.addEventListener("focus", refreshPlans);

    return () => {
      window.removeEventListener("storage", refreshPlans);
      window.removeEventListener("focus", refreshPlans);
    };
  }, []);

  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });
  }, []);

  useEffect(() => {
    if (!authReady || !user) {
      if (authReady) {
        setTasks([]);
        setLoading(false);
      }
      return;
    }

    setLoading(true);

    const unsubscribeTasks = onSnapshot(
      collection(db, "users", user.uid, "tasks"),
      (snapshot) => {
        setTasks(
          snapshot.docs.map((taskDoc) =>
            normalizeTask(taskDoc.id, taskDoc.data() as Record<string, unknown>)
          )
        );
        setLoading(false);
      },
      (error) => {
        console.error("Task loading error:", error);
        setErrorMessage(tr.taskError);
        setLoading(false);
      }
    );

    // ゲーミフィケーション（ストリーク・フリーズ・カード）の取得・更新
    const fetchAndSyncStats = async () => {
      try {
        const statsRef = doc(db, "users", user.uid, "stats", "gamification");
        const snap = await getDoc(statsRef);

        if (snap.exists()) {
          const data = snap.data();
          let currentStreak = typeof data.streak === "number" ? data.streak : 1;
          let freezeCount = typeof data.freezeCount === "number" ? data.freezeCount : 0;
          const lastDate = typeof data.lastDate === "string" ? data.lastDate : "";

          if (lastDate && lastDate !== today) {
            const last = new Date(lastDate);
            const current = new Date(today);
            const diffTime = Math.abs(current.getTime() - last.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // 1日以上空いた場合の判定（お休みチケット処理）
            if (diffDays > 1) {
              if (freezeCount > 0) {
                // チケットを消費してストリーク維持！
                freezeCount -= 1;
              } else {
                currentStreak = 1; // リセット
              }
            } else if (diffDays === 1) {
              // 毎日ログインの加算（7日ごとにフリーチケット1枚獲得：上限2枚）
              currentStreak += 1;
              if (currentStreak % 7 === 0 && freezeCount < 2) {
                freezeCount += 1;
              }
            }
          }

          const updatedStats: UserGamificationStats = {
            streak: currentStreak,
            xp: typeof data.xp === "number" ? data.xp : 0,
            level: typeof data.level === "number" ? data.level : 1,
            lastDate: today,
            freezeCount,
            unlockedCards: Array.isArray(data.unlockedCards) ? data.unlockedCards : [],
          };

          setStats(updatedStats);
          await setDoc(statsRef, updatedStats, { merge: true });
        } else {
          const initialStats: UserGamificationStats = {
            streak: 1,
            xp: 120, // ガチャ試せる初期経験値
            level: 1,
            lastDate: today,
            freezeCount: 1, // 初回プレゼント
            unlockedCards: [],
          };
          setStats(initialStats);
          await setDoc(statsRef, initialStats);
        }
      } catch (e) {
        console.error("Gamification stats error:", e);
      }
    };

    fetchAndSyncStats();

    return () => {
      unsubscribeTasks();
    };
  }, [authReady, user, tr.taskError, today]);

  const todaysPlans = useMemo(
    () =>
      plans.filter(
        (plan) =>
          plan.status !== "completed" &&
          plan.startDate <= today &&
          plan.deadline >= today &&
          plan.weekdays.includes(todayWeekday)
      ),
    [plans, today, todayWeekday]
  );

  const todaysTasks = useMemo(
    () =>
      tasks
        .filter((task) => {
          if (task.scheduledDate === today) return true;

          if (
            task.repeat === "毎日" &&
            task.startDate &&
            task.startDate <= today &&
            (!task.dueDate || task.dueDate >= today)
          ) {
            return true;
          }

          if (
            task.repeat === "毎週" &&
            task.startDate &&
            task.startDate <= today &&
            (!task.dueDate || task.dueDate >= today) &&
            task.repeatDays.includes(todayWeekday)
          ) {
            return true;
          }

          return false;
        })
        .sort((a, b) => {
          if (a.status === "完了" && b.status !== "完了") return 1;
          if (a.status !== "完了" && b.status === "完了") return -1;
          return a.title.localeCompare(b.title, locale);
        }),
    [tasks, today, todayWeekday, locale]
  );

  const completedCount = todaysTasks.filter((task) => task.status === "完了").length;
  const totalCount = todaysTasks.length;
  const remainingCount = Math.max(0, totalCount - completedCount);
  const taskProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const encouragementMessage = useMemo(() => {
    if (totalCount > 0 && completedCount === totalCount) {
      return tr.motivationDone;
    }
    if (taskProgress >= 50) {
      return tr.motivationHalf;
    }
    return tr.motivationCheer;
  }, [totalCount, completedCount, taskProgress, tr]);

  function getStatusLabel(status: TaskStatus) {
    return tr[statusLabel[status]];
  }

  // タスク完了処理
  async function toggleTask(task: StudyTask) {
    if (!user) return;

    setUpdatingTaskId(task.id);
    setErrorMessage("");

    const nextStatus: TaskStatus = task.status === "完了" ? "進行中" : "完了";
    const isNowCompleted = nextStatus === "完了";

    try {
      await updateDoc(doc(db, "users", user.uid, "tasks", task.id), {
        status: nextStatus,
        updatedAt: serverTimestamp(),
      });

      if (isNowCompleted) {
        const addedXP = 15;
        const newXP = stats.xp + addedXP;
        const newLevel = Math.floor(newXP / 100) + 1;

        const willAllBeCompleted = completedCount + 1 === totalCount;
        const finalXP = willAllBeCompleted ? newXP + 50 : newXP;
        const finalLevel = Math.floor(finalXP / 100) + 1;

        if (willAllBeCompleted) {
          setShowBonusBanner(true);
        }

        const newStats = {
          ...stats,
          xp: finalXP,
          level: finalLevel,
        };

        setStats(newStats);
        const statsRef = doc(db, "users", user.uid, "stats", "gamification");
        await setDoc(statsRef, { xp: finalXP, level: finalLevel }, { merge: true });
      }
    } catch (error) {
      console.error("Task update error:", error);
      setErrorMessage(tr.updateError);
    } finally {
      setUpdatingTaskId(null);
    }
  }

  // ガチャを引く処理（100 XP消費）
  async function drawQuoteGacha() {
    if (stats.xp < 100) {
      setGachaError(tr.gachaCostError);
      return;
    }

    setGachaError("");
    const randomIndex = Math.floor(Math.random() * QUOTE_DATABASE.length);
    const selectedCard = QUOTE_DATABASE[randomIndex];

    const nextXP = stats.xp - 100;
    const nextUnlocked = Array.from(new Set([...stats.unlockedCards, selectedCard.id]));

    const newStats = {
      ...stats,
      xp: nextXP,
      unlockedCards: nextUnlocked,
    };

    setStats(newStats);
    setDrawnCard(selectedCard);

    if (user) {
      try {
        const statsRef = doc(db, "users", user.uid, "stats", "gamification");
        await setDoc(statsRef, { xp: nextXP, unlockedCards: nextUnlocked }, { merge: true });
      } catch (e) {
        console.error("Gacha save error:", e);
      }
    }
  }

  const currentLevelProgress = stats.xp % 100;

  return (
    <main className="min-h-screen bg-[#F7F8F6] text-[#242720]">
      <div className="mx-auto max-w-6xl px-5 pb-14 pt-7 sm:px-8 md:px-12 md:pt-10">
        {/* ヘッダーエリア */}
        <header className="mb-9 flex flex-wrap items-end justify-between gap-5">
          <div>
            <SectionLabel>{tr.today} / {englishDate}</SectionLabel>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.055em] sm:text-5xl">
              {tr.title}
            </h1>
            <p className="mt-3 text-sm text-[#858A82]">{formattedDate}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* ストリーク（連続日数）カウンター */}
            <div className="inline-flex items-center gap-2.5 rounded-xl border bg-white px-4 py-2.5 shadow-xs" style={{ borderColor: line }}>
              <span className="text-xl" aria-hidden="true">🔥</span>
              <div className="text-xs">
                <p className="font-bold text-[#242720]">{stats.streak} {tr.streakDays}</p>
                <p className="text-[10px] text-[#858A82]">{tr.streakTitle}</p>
              </div>
            </div>

            {/* お休みチケット（フリーズ）所持数 */}
            <div className="inline-flex items-center gap-2 rounded-xl border bg-white px-3.5 py-2.5 shadow-xs" style={{ borderColor: line }}>
              <span className="text-lg" aria-hidden="true">🛡️</span>
              <div className="text-xs">
                <p className="font-bold text-[#242720]">{stats.freezeCount} 枚</p>
                <p className="text-[10px] text-[#858A82]">{tr.freezeLabel}</p>
              </div>
            </div>

            {/* レベル・XPゲージ */}
            <div className="inline-flex items-center gap-3 rounded-xl border bg-white px-4 py-2.5 shadow-xs" style={{ borderColor: line }}>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#242720] text-xs font-bold text-white">
                {stats.level}
              </span>
              <div className="w-24 text-xs">
                <div className="flex justify-between text-[10px] font-semibold text-[#858A82]">
                  <span>{tr.levelLabel}{stats.level}</span>
                  <span>{stats.xp} {tr.xpLabel}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#ECEDE9]">
                  <div className="h-full rounded-full transition-all duration-500 bg-amber-500" style={{ width: `${currentLevelProgress}%` }} />
                </div>
              </div>
            </div>

            <Link
              href="/tasks"
              className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-3 text-sm font-medium transition hover:bg-[#F1F2EF]"
              style={{ borderColor: line }}
            >
              {tr.taskManagement}
              <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </header>

        {/* ガチャで獲得したカードのダイアログ表示 */}
        {drawnCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-3xl border bg-white p-6 shadow-2xl animate-in zoom-in-95" style={{ borderColor: line }}>
              <div className="flex justify-between items-center mb-3">
                <span className="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-bold text-amber-800">
                  {drawnCard.rarity} · {drawnCard.language}
                </span>
                <span className="text-xs text-[#858A82]">名言カード</span>
              </div>
              <blockquote className="mt-4 text-lg font-serif italic text-[#242720]">
                “{drawnCard.quote}”
              </blockquote>
              <p className="mt-1 text-right text-xs font-semibold text-[#858A82]">— {drawnCard.author}</p>
              <div className="mt-4 rounded-xl bg-[#F7F8F6] p-3 text-xs text-[#555]">
                {drawnCard.translation}
              </div>
              <button
                type="button"
                onClick={() => setDrawnCard(null)}
                className="mt-6 w-full rounded-xl bg-[#242720] py-2.5 text-xs font-semibold text-white transition hover:opacity-90"
              >
                {tr.close}
              </button>
            </div>
          </div>
        )}

        {/* モチベーション＆ガチャボタンエリア */}
        <div className="mb-8 rounded-2xl border bg-gradient-to-r from-[#F2F5F0] via-white to-[#FAFAFA] p-5 shadow-xs" style={{ borderColor: line }}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-lg shadow-xs" style={{ borderColor: line }}>
                🎁
              </span>
              <div>
                <p className="text-xs font-bold tracking-wider text-[#557451]">DAILY INCENTIVE & REWARD</p>
                <p className="text-sm font-medium text-[#242720] mt-0.5">{encouragementMessage}</p>
              </div>
            </div>

            {/* ガチャボタン */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={drawQuoteGacha}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:opacity-95"
              >
                <span>🔮</span>
                {tr.drawGacha}
              </button>
            </div>
          </div>
          {gachaError && (
            <p className="mt-3 text-xs font-semibold text-red-600">{gachaError}</p>
          )}
        </div>

        {/* 全クリア記念バナー */}
        {showBonusBanner && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 shadow-xs">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold">{tr.allCompletedBonus}</p>
              <button type="button" onClick={() => setShowBonusBanner(false)} className="text-xs font-semibold underline">
                {tr.close}
              </button>
            </div>
          </div>
        )}

        {!authReady || loading ? (
          <div className="rounded-2xl border bg-white px-5 py-10 text-sm text-[#858A82]" style={{ borderColor: line }}>
            {tr.loading}
          </div>
        ) : !user ? (
          <div className="rounded-2xl border bg-white px-6 py-10" style={{ borderColor: line }}>
            <h2 className="text-lg font-semibold">{tr.login}</h2>
            <p className="mt-2 text-sm text-[#858A82]">{tr.loginDescription}</p>
          </div>
        ) : (
          <>
            {errorMessage && (
              <div role="alert" className="mb-5 rounded-xl border border-[#E7C9C2] bg-[#FFF8F6] px-4 py-3 text-sm text-[#925D51]">
                {errorMessage}
              </div>
            )}

            {/* ダッシュボード概要 */}
            <section className="mb-10">
              <div className="mb-4 flex items-center justify-between">
                <SectionLabel>{tr.overview}</SectionLabel>
                <span className="text-xs text-[#858A82]">{tr.today}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div className="rounded-2xl border bg-white p-5" style={{ borderColor: line }}>
                  <p className="text-xs text-[#858A82]">{tr.completion}</p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="font-mono text-4xl font-medium tracking-[-0.06em]">{taskProgress}</span>
                    <span className="text-sm text-[#858A82]">%</span>
                  </div>
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#ECEDE9]">
                    <div className="h-full rounded-full transition-all" style={{ width: `${taskProgress}%`, backgroundColor: accent }} />
                  </div>
                </div>

                <div className="rounded-2xl border bg-white p-5" style={{ borderColor: line }}>
                  <p className="text-xs text-[#858A82]">{tr.completed}</p>
                  <p className="mt-4 font-mono text-4xl font-medium tracking-[-0.06em]">
                    {String(completedCount).padStart(2, "0")}
                    <span className="ml-2 text-sm text-[#858A82]">/ {String(totalCount).padStart(2, "0")}</span>
                  </p>
                  <p className="mt-3 text-xs text-[#858A82]">{tr.tasks}</p>
                </div>

                <div className="rounded-2xl border bg-white p-5" style={{ borderColor: line }}>
                  <p className="text-xs text-[#858A82]">{tr.remaining}</p>
                  <p className="mt-4 font-mono text-4xl font-medium tracking-[-0.06em]">
                    {String(remainingCount).padStart(2, "0")}
                  </p>
                  <p className="mt-3 text-xs text-[#858A82]">{tr.tasks}</p>
                </div>

                <div className="rounded-2xl border bg-white p-5" style={{ borderColor: line }}>
                  <p className="text-xs text-[#858A82]">{tr.plans}</p>
                  <p className="mt-4 font-mono text-4xl font-medium tracking-[-0.06em]">
                    {String(todaysPlans.length).padStart(2, "0")}
                  </p>
                  <p className="mt-3 text-xs text-[#858A82]">{tr.days}</p>
                </div>
              </div>
            </section>

            {/* 今日のタスク一覧 */}
            <section className="mb-12">
              <div className="mb-4 flex items-center justify-between">
                <SectionLabel>{tr.tasks}</SectionLabel>
                <Link href="/tasks" className="text-xs text-[#858A82] hover:underline">
                  {tr.taskManagement} →
                </Link>
              </div>

              {todaysTasks.length === 0 ? (
                <div className="rounded-2xl border bg-white p-8 text-center" style={{ borderColor: line }}>
                  <p className="text-sm font-medium text-[#242720]">{tr.noTasks}</p>
                  <p className="mt-1 text-xs text-[#858A82]">{tr.noTasksDescription}</p>
                  <Link
                    href="/tasks"
                    className="mt-4 inline-block rounded-xl bg-[#242720] px-4 py-2 text-xs font-medium text-white transition hover:opacity-90"
                  >
                    {tr.addTask}
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {todaysTasks.map((task) => {
                    const isDone = task.status === "完了";
                    const isUpdating = updatingTaskId === task.id;

                    return (
                      <div
                        key={task.id}
                        className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-white p-5 transition ${
                          isDone ? "opacity-60 bg-[#FAFAFA]" : "hover:border-[#C5C8C0]"
                        }`}
                        style={{ borderColor: line }}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => toggleTask(task)}
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition ${
                              isDone ? "bg-emerald-600 border-emerald-600 text-white" : "border-[#C5C8C0] bg-white hover:border-[#242720]"
                            }`}
                            aria-label={isDone ? tr.markUndone : tr.markDone}
                          >
                            {isDone && <span className="text-xs font-bold">✓</span>}
                          </button>
                          <div>
                            <p className={`text-sm font-medium ${isDone ? "line-through text-[#858A82]" : "text-[#242720]"}`}>
                              {task.title || tr.untitled}
                            </p>
                            <p className="mt-0.5 text-xs text-[#858A82]">
                              {task.material} · {task.target} {task.unit}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {!isDone && (
                            <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                              +15 XP
                            </span>
                          )}
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                              isDone
                                ? "bg-[#EDF2EC] text-[#557451]"
                                : "bg-[#F1F2EF] text-[#858A82]"
                            }`}
                          >
                            {getStatusLabel(task.status)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}