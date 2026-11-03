
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
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

type RangeInput = {
  start: string;
  end: string;
};

const PLAN_STORAGE_KEY = "anki-study-plans-v1";

const line = "#E7E8E3";
const muted = "#858A82";
const accent = "var(--anki-theme-color)";
const accentDark = "var(--anki-theme-dark)";

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
    planManage: "計画を管理",
    noPlans: "今日の学習計画はありません",
    noPlansDescription: "学習計画から教材と学習期間を設定できます。",
    createPlan: "学習計画を作成",
    deadline: "期限",
    round: "周",
    dailyGoal: "今日の目標",
    actual: "今日の実績",
    record: "学習範囲を記録",
    start: "開始",
    end: "終了",
    save: "記録する",
    saving: "保存中...",
    progress: "達成状況",
    achieved: "今日の目標を達成しました",
    notAchieved: "目標まであと",
    over: "目標達成",
    materialMissing: "教材が見つかりません",
    materialMissingDescription: "教材管理で教材を登録し、学習計画から選択してください。",
    materials: "教材管理",
    invalidRange: "教材の範囲内で、開始と終了を正しく入力してください。",
    saved: "学習範囲を記録しました。",
    saveError: "記録できませんでした。もう一度お試しください。",
    tasks: "今日やること",
    allTasks: "すべてのタスク",
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
    materialStudy: "教材の学習",
    vocabulary: "単語の暗記・復習",
    words: "単語",
    pages: "ページ",
    minutes: "分",
    chapters: "章",
    times: "回",
    untitled: "名称未設定",
    footer: "YOUR ANKI / PERSONAL LEARNING SYSTEM",
    footerRight: "学習範囲を記録すると教材の進捗にも反映されます。",
    items: "件",
    days: "学習日",
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
    planManage: "Manage plans",
    noPlans: "No study plans for today",
    noPlansDescription: "Create a plan to set your materials and study period.",
    createPlan: "Create a study plan",
    deadline: "Deadline",
    round: "rounds",
    dailyGoal: "Today's goal",
    actual: "Today's progress",
    record: "Record study range",
    start: "From",
    end: "To",
    save: "Save record",
    saving: "Saving...",
    progress: "Progress",
    achieved: "Today's goal achieved",
    notAchieved: "Remaining",
    over: "Goal achieved",
    materialMissing: "Material not found",
    materialMissingDescription: "Add a material and select it in your study plan.",
    materials: "Materials",
    invalidRange: "Enter a valid range within the material's limits.",
    saved: "Study range recorded.",
    saveError: "Could not save. Please try again.",
    tasks: "Today's Tasks",
    allTasks: "All tasks",
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
    materialStudy: "Study materials",
    vocabulary: "Vocabulary review",
    words: "words",
    pages: "pages",
    minutes: "min",
    chapters: "chapters",
    times: "times",
    untitled: "Untitled",
    footer: "YOUR ANKI / PERSONAL LEARNING SYSTEM",
    footerRight: "Recorded ranges are also reflected in material progress.",
    items: "tasks",
    days: "study days",
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
    planManage: "Pläne verwalten",
    noPlans: "Keine Lernpläne für heute",
    noPlansDescription: "Erstelle einen Lernplan mit Material und Zeitraum.",
    createPlan: "Lernplan erstellen",
    deadline: "Frist",
    round: "Durchgänge",
    dailyGoal: "Heutiges Ziel",
    actual: "Heutiger Fortschritt",
    record: "Lernbereich speichern",
    start: "Von",
    end: "Bis",
    save: "Speichern",
    saving: "Speichern...",
    progress: "Fortschritt",
    achieved: "Heutiges Ziel erreicht",
    notAchieved: "Noch offen",
    over: "Ziel erreicht",
    materialMissing: "Lernmaterial nicht gefunden",
    materialMissingDescription: "Füge Material hinzu und wähle es im Lernplan aus.",
    materials: "Materialien",
    invalidRange: "Gib einen gültigen Bereich innerhalb des Materials ein.",
    saved: "Lernbereich gespeichert.",
    saveError: "Speichern fehlgeschlagen. Bitte erneut versuchen.",
    tasks: "Heutige Aufgaben",
    allTasks: "Alle Aufgaben",
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
    materialStudy: "Lernmaterial",
    vocabulary: "Vokabeln lernen",
    words: "Wörter",
    pages: "Seiten",
    minutes: "Min.",
    chapters: "Kapitel",
    times: "Mal",
    untitled: "Ohne Titel",
    footer: "YOUR ANKI / PERSONAL LEARNING SYSTEM",
    footerRight: "Gespeicherte Bereiche werden im Materialfortschritt berücksichtigt.",
    items: "Aufgaben",
    days: "Lerntage",
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
    planManage: "管理计划",
    noPlans: "今天没有学习计划",
    noPlansDescription: "创建学习计划，设置教材和学习期间。",
    createPlan: "创建学习计划",
    deadline: "截止日期",
    round: "轮",
    dailyGoal: "今日目标",
    actual: "今日进度",
    record: "记录学习范围",
    start: "开始",
    end: "结束",
    save: "保存记录",
    saving: "保存中...",
    progress: "完成进度",
    achieved: "已完成今日目标",
    notAchieved: "还差",
    over: "已达成目标",
    materialMissing: "找不到教材",
    materialMissingDescription: "请先在教材管理中添加教材，再从学习计划中选择。",
    materials: "教材管理",
    invalidRange: "请输入教材范围内的有效起止位置。",
    saved: "已记录学习范围。",
    saveError: "保存失败，请重试。",
    tasks: "今日任务",
    allTasks: "全部任务",
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
    materialStudy: "教材学习",
    vocabulary: "单词记忆与复习",
    words: "个单词",
    pages: "页",
    minutes: "分钟",
    chapters: "章",
    times: "次",
    untitled: "未命名",
    footer: "YOUR ANKI / PERSONAL LEARNING SYSTEM",
    footerRight: "记录的学习范围也会同步到教材进度。",
    items: "项",
    days: "学习日",
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
    planManage: "管理計畫",
    noPlans: "今天沒有學習計畫",
    noPlansDescription: "建立學習計畫，設定教材和學習期間。",
    createPlan: "建立學習計畫",
    deadline: "截止日期",
    round: "輪",
    dailyGoal: "今日目標",
    actual: "今日進度",
    record: "記錄學習範圍",
    start: "開始",
    end: "結束",
    save: "儲存記錄",
    saving: "儲存中...",
    progress: "完成進度",
    achieved: "已完成今日目標",
    notAchieved: "還差",
    over: "已達成目標",
    materialMissing: "找不到教材",
    materialMissingDescription: "請先在教材管理中新增教材，再從學習計畫中選擇。",
    materials: "教材管理",
    invalidRange: "請輸入教材範圍內有效的起始與結束位置。",
    saved: "已記錄學習範圍。",
    saveError: "儲存失敗，請重試。",
    tasks: "今日任務",
    allTasks: "全部任務",
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
    materialStudy: "教材學習",
    vocabulary: "單字記憶與複習",
    words: "個單字",
    pages: "頁",
    minutes: "分鐘",
    chapters: "章",
    times: "次",
    untitled: "未命名",
    footer: "YOUR ANKI / PERSONAL LEARNING SYSTEM",
    footerRight: "記錄的學習範圍也會同步到教材進度。",
    items: "項",
    days: "學習日",
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
    planManage: "Gestionar planes",
    noPlans: "No hay planes para hoy",
    noPlansDescription: "Crea un plan y configura el material y las fechas.",
    createPlan: "Crear un plan",
    deadline: "Fecha límite",
    round: "vueltas",
    dailyGoal: "Objetivo de hoy",
    actual: "Progreso de hoy",
    record: "Registrar rango de estudio",
    start: "Desde",
    end: "Hasta",
    save: "Guardar",
    saving: "Guardando...",
    progress: "Progreso",
    achieved: "Objetivo de hoy alcanzado",
    notAchieved: "Faltan",
    over: "Objetivo alcanzado",
    materialMissing: "No se encontró el material",
    materialMissingDescription: "Añade un material y selecciónalo en tu plan.",
    materials: "Materiales",
    invalidRange: "Introduce un rango válido dentro de los límites del material.",
    saved: "Rango de estudio registrado.",
    saveError: "No se pudo guardar. Inténtalo de nuevo.",
    tasks: "Tareas de hoy",
    allTasks: "Todas las tareas",
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
    materialStudy: "Estudio de materiales",
    vocabulary: "Repaso de vocabulario",
    words: "palabras",
    pages: "páginas",
    minutes: "min",
    chapters: "capítulos",
    times: "veces",
    untitled: "Sin título",
    footer: "YOUR ANKI / PERSONAL LEARNING SYSTEM",
    footerRight: "Los rangos registrados también actualizan el progreso del material.",
    items: "tareas",
    days: "días de estudio",
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

function countStudyDays(start: string, end: string, weekdays: number[]) {
  if (!start || !end || start > end || weekdays.length === 0) return 0;

  const from = new Date(`${start}T12:00:00`);
  const to = new Date(`${end}T12:00:00`);
  let count = 0;

  for (const date = new Date(from); date <= to; date.setDate(date.getDate() + 1)) {
    if (weekdays.includes((date.getDay() + 6) % 7)) count++;
  }

  return count;
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
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [savingPlanId, setSavingPlanId] = useState<string | null>(null);
  const [rangeInputs, setRangeInputs] = useState<Record<string, RangeInput>>({});
  const [rangeErrors, setRangeErrors] = useState<Record<string, string>>({});

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

  const formatNumber = (value: number) => value.toLocaleString(locale);

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
        setMaterials([]);
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

    const unsubscribeMaterials = onSnapshot(
      collection(db, "users", user.uid, "materials"),
      (snapshot) => {
        const nextMaterials: Material[] = snapshot.docs.map((materialDoc) => {
          const data = materialDoc.data();
          return {
            id: materialDoc.id,
            name: typeof data.name === "string" ? data.name : "",
            language: typeof data.language === "string" ? data.language : "",
            type: data.type === "deck" ? "deck" : "book",
            total: typeof data.total === "number" ? data.total : 0,
            studyRanges: Array.isArray(data.studyRanges)
              ? data.studyRanges.filter(
                  (range: unknown): range is StudyRange =>
                    typeof range === "object" &&
                    range !== null &&
                    typeof (range as StudyRange).start === "number" &&
                    typeof (range as StudyRange).end === "number" &&
                    typeof (range as StudyRange).date === "string"
                )
              : [],
          };
        });

        setMaterials(nextMaterials);
      },
      (error) => {
        console.error("Material loading error:", error);
      }
    );

    return () => {
      unsubscribeTasks();
      unsubscribeMaterials();
    };
  }, [authReady, user, tr.taskError]);

  // 旧データの計画も、教材名が完全一致する教材が1件だけなら自動で紐付ける
  useEffect(() => {
    if (materials.length === 0 || plans.length === 0) return;

    let changed = false;

    const migrated = plans.map((plan) => {
      if (plan.materialId) return plan;

      const matches = materials.filter((material) => material.name === plan.deckName);
      if (matches.length !== 1) return plan;

      changed = true;
      return {
        ...plan,
        materialId: matches[0].id,
        totalItems: matches[0].total,
      };
    });

    if (changed) {
      setPlans(migrated);
      localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(migrated));
    }
  }, [materials, plans]);

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

  function getPlanMaterial(plan: Plan) {
    if (plan.materialId) {
      return materials.find((material) => material.id === plan.materialId);
    }

    const matches = materials.filter((material) => material.name === plan.deckName);
    return matches.length === 1 ? matches[0] : undefined;
  }

  function getDailyTarget(plan: Plan, material?: Material) {
    const total = material?.total ?? plan.totalItems;
    const studyDays = countStudyDays(plan.startDate, plan.deadline, plan.weekdays);
    return studyDays > 0 ? Math.ceil((total * plan.rounds) / studyDays) : 0;
  }

  function getTodayActual(material?: Material) {
    if (!material) return 0;

    return material.studyRanges
      .filter((range) => range.date === today)
      .reduce((sum, range) => sum + Math.max(0, range.end - range.start + 1), 0);
  }

  function getUnit(material?: Material) {
    if (!material) return language === "ja" ? "項目" : "items";

    if (language === "ja") return material.type === "book" ? "ページ" : "単語";
    if (language === "de") return material.type === "book" ? "Seiten" : "Wörter";
    if (language === "es") return material.type === "book" ? "páginas" : "palabras";
    if (language === "zh-CN") return material.type === "book" ? "页" : "个单词";
    if (language === "zh-TW") return material.type === "book" ? "頁" : "個單字";
    return material.type === "book" ? "pages" : "words";
  }

  function getStatusLabel(status: TaskStatus) {
    return tr[statusLabel[status]];
  }

  async function toggleTask(task: StudyTask) {
    if (!user) return;

    setUpdatingTaskId(task.id);
    setErrorMessage("");

    const nextStatus: TaskStatus = task.status === "完了" ? "進行中" : "完了";

    try {
      await updateDoc(doc(db, "users", user.uid, "tasks", task.id), {
        status: nextStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Task update error:", error);
      setErrorMessage(tr.updateError);
    } finally {
      setUpdatingTaskId(null);
    }
  }

  async function recordStudyRange(plan: Plan) {
    if (!user) return;

    const material = getPlanMaterial(plan);
    const input = rangeInputs[plan.id] ?? { start: "", end: "" };
    const start = Number(input.start);
    const end = Number(input.end);

    if (
      !material ||
      !Number.isInteger(start) ||
      !Number.isInteger(end) ||
      start < 1 ||
      end < start ||
      end > material.total
    ) {
      setRangeErrors((current) => ({ ...current, [plan.id]: tr.invalidRange }));
      return;
    }

    setSavingPlanId(plan.id);
    setRangeErrors((current) => ({ ...current, [plan.id]: "" }));
    setNotice("");
    setErrorMessage("");

    try {
      const newRange: StudyRange = { start, end, date: today };

      await updateDoc(doc(db, "users", user.uid, "materials", material.id), {
        studyRanges: arrayUnion(newRange),
        updatedAt: serverTimestamp(),
      });

      setRangeInputs((current) => ({
        ...current,
        [plan.id]: { start: "", end: "" },
      }));
      setNotice(tr.saved);
    } catch (error) {
      console.error("Study range save error:", error);
      setRangeErrors((current) => ({ ...current, [plan.id]: tr.saveError }));
    } finally {
      setSavingPlanId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F8F6] text-[#242720]">
      <div className="mx-auto max-w-6xl px-5 pb-14 pt-7 sm:px-8 md:px-12 md:pt-10">
        <header className="mb-9 flex flex-wrap items-end justify-between gap-5">
          <div>
            <SectionLabel>{tr.today} / {englishDate}</SectionLabel>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.055em] sm:text-5xl">
              {tr.title}
            </h1>
            <p className="mt-3 text-sm text-[#858A82]">{formattedDate}</p>
          </div>

          <Link
            href="/tasks"
            className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-3 text-sm font-medium transition hover:bg-[#F1F2EF]"
            style={{ borderColor: line }}
          >
            {tr.taskManagement}
            <span aria-hidden="true">↗</span>
          </Link>
        </header>

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

            {notice && (
              <div role="status" className="mb-5 rounded-xl border border-[#D7E4D5] bg-[#F5FAF3] px-4 py-3 text-sm text-[#557451]">
                {notice}
              </div>
            )}

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
                  <div className="mt-4 h-1 overflow-hidden rounded-full bg-[#ECEDE9]">
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

            <section className="mb-11">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <SectionLabel>01 / {tr.plans}</SectionLabel>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{tr.plans}</h2>
                </div>

                <Link href="/plan" className="text-sm font-medium hover:underline" style={{ color: accentDark }}>
                  {tr.planManage} ↗
                </Link>
              </div>

              {todaysPlans.length === 0 ? (
                <div className="rounded-2xl border bg-white px-6 py-10" style={{ borderColor: line }}>
                  <p className="text-lg font-semibold">{tr.noPlans}</p>
                  <p className="mt-2 text-sm text-[#858A82]">{tr.noPlansDescription}</p>
                  <Link
                    href="/plan"
                    className="mt-5 inline-flex rounded-xl px-4 py-3 text-sm font-medium text-white transition hover:opacity-90"
                    style={{ backgroundColor: accent }}
                  >
                    {tr.createPlan} ↗
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {todaysPlans.map((plan, index) => {
                    const material = getPlanMaterial(plan);
                    const dailyTarget = getDailyTarget(plan, material);
                    const actual = getTodayActual(material);
                    const percentage = dailyTarget > 0 ? Math.min(100, Math.round((actual / dailyTarget) * 100)) : 0;
                    const isAchieved = dailyTarget > 0 && actual >= dailyTarget;
                    const unit = getUnit(material);
                    const input = rangeInputs[plan.id] ?? { start: "", end: "" };

                    return (
                      <article
                        key={plan.id}
                        className="overflow-hidden rounded-2xl border bg-white shadow-[0_2px_10px_rgba(30,35,25,0.025)]"
                        style={{ borderColor: line }}
                      >
                        <div className="p-5 sm:p-7">
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-semibold tracking-[0.16em] text-[#92978F]">
                                  PLAN {String(index + 1).padStart(2, "0")}
                                </span>
                                {isAchieved && (
                                  <span className="rounded-full bg-[#EFF5EC] px-2.5 py-1 text-[10px] font-medium text-[#557451]">
                                    {tr.achieved}
                                  </span>
                                )}
                              </div>

                              <h3 className="mt-3 break-words text-xl font-semibold tracking-[-0.035em] sm:text-2xl">
                                {material?.name || plan.deckName || tr.untitled}
                              </h3>

                              <p className="mt-2 text-xs text-[#858A82]">
                                {plan.rounds} {tr.round}
                                <span className="mx-2 text-[#C8CBC4]">·</span>
                                {tr.deadline}: {plan.deadline}
                              </p>
                            </div>

                            <Link href="/plan" className="shrink-0 rounded-lg border px-3 py-2 text-xs text-[#666C63] transition hover:bg-[#F7F8F6]" style={{ borderColor: line }}>
                              {tr.planManage}
                            </Link>
                          </div>

                          {material ? (
                            <>
                              <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-3">
                                <div className="rounded-xl bg-[#F7F8F6] p-4">
                                  <p className="text-xs text-[#858A82]">{tr.dailyGoal}</p>
                                  <p className="mt-2 font-mono text-3xl font-semibold tracking-[-0.05em]" style={{ color: accentDark }}>
                                    {formatNumber(dailyTarget)}
                                  </p>
                                  <p className="mt-1 text-xs text-[#858A82]">{unit}</p>
                                </div>

                                <div className="rounded-xl bg-[#F7F8F6] p-4">
                                  <p className="text-xs text-[#858A82]">{tr.actual}</p>
                                  <p className="mt-2 font-mono text-3xl font-semibold tracking-[-0.05em]">
                                    {formatNumber(actual)}
                                  </p>
                                  <p className="mt-1 text-xs text-[#858A82]">{unit}</p>
                                </div>

                                <div className="col-span-2 rounded-xl bg-[#F7F8F6] p-4 sm:col-span-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="text-xs text-[#858A82]">{tr.progress}</p>
                                    <span className="font-mono text-sm font-medium">{percentage}%</span>
                                  </div>
                                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#E5E8E1]">
                                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%`, backgroundColor: isAchieved ? "#77966F" : accent }} />
                                  </div>
                                  <p className="mt-2 text-xs text-[#858A82]">
                                    {isAchieved ? tr.over : `${tr.notAchieved} ${formatNumber(Math.max(0, dailyTarget - actual))} ${unit}`}
                                  </p>
                                </div>
                              </div>

                              <div className="mt-6 border-t pt-5" style={{ borderColor: line }}>
                                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                  <p className="text-sm font-semibold">{tr.record}</p>
                                  <Link href="/materials" className="text-xs text-[#858A82] hover:underline">
                                    {tr.materials} ↗
                                  </Link>
                                </div>

                                <div className="flex flex-wrap items-end gap-3">
                                  <label className="min-w-0 flex-1">
                                    <span className="mb-2 block text-xs text-[#858A82]">{tr.start}</span>
                                    <input
                                      type="number"
                                      min={1}
                                      max={material.total}
                                      value={input.start}
                                      onChange={(event) =>
                                        setRangeInputs((current) => ({
                                          ...current,
                                          [plan.id]: { ...input, start: event.target.value },
                                        }))
                                      }
                                      placeholder="1"
                                      className="h-11 w-full rounded-xl border bg-white px-3 text-sm outline-none transition focus:ring-2"
                                      style={{ borderColor: line, ["--tw-ring-color" as string]: accent }}
                                    />
                                  </label>

                                  <label className="min-w-0 flex-1">
                                    <span className="mb-2 block text-xs text-[#858A82]">{tr.end}</span>
                                    <input
                                      type="number"
                                      min={1}
                                      max={material.total}
                                      value={input.end}
                                      onChange={(event) =>
                                        setRangeInputs((current) => ({
                                          ...current,
                                          [plan.id]: { ...input, end: event.target.value },
                                        }))
                                      }
                                      placeholder={String(material.total)}
                                      className="h-11 w-full rounded-xl border bg-white px-3 text-sm outline-none transition focus:ring-2"
                                      style={{ borderColor: line, ["--tw-ring-color" as string]: accent }}
                                    />
                                  </label>

                                  <button
                                    type="button"
                                    onClick={() => recordStudyRange(plan)}
                                    disabled={savingPlanId === plan.id}
                                    className="h-11 w-full rounded-xl px-5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                                    style={{ backgroundColor: accent }}
                                  >
                                    {savingPlanId === plan.id ? tr.saving : tr.save}
                                  </button>
                                </div>

                                {rangeErrors[plan.id] && (
                                  <p role="alert" className="mt-3 text-xs text-[#A45D50]">
                                    {rangeErrors[plan.id]}
                                  </p>
                                )}
                                <p className="mt-3 text-[11px] text-[#92978F]">
                                  1 – {formatNumber(material.total)} {unit}
                                </p>
                              </div>
                            </>
                          ) : (
                            <div className="mt-6 rounded-xl border border-dashed p-5" style={{ borderColor: line }}>
                              <p className="text-sm font-medium">{tr.materialMissing}</p>
                              <p className="mt-1 text-xs text-[#858A82]">{tr.materialMissingDescription}</p>
                              <Link href="/materials" className="mt-3 inline-flex text-xs font-medium hover:underline" style={{ color: accentDark }}>
                                {tr.materials} ↗
                              </Link>
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <section>
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <SectionLabel>02 / {tr.tasks}</SectionLabel>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{tr.tasks}</h2>
                </div>
                <Link href="/tasks" className="text-sm font-medium hover:underline" style={{ color: accentDark }}>
                  {tr.allTasks} ↗
                </Link>
              </div>

              {todaysTasks.length === 0 ? (
                <div className="rounded-2xl border bg-white px-6 py-8" style={{ borderColor: line }}>
                  <p className="font-medium">{tr.noTasks}</p>
                  <p className="mt-2 text-sm text-[#858A82]">{tr.noTasksDescription}</p>
                  <Link
                    href="/tasks"
                    className="mt-4 inline-flex rounded-xl border px-4 py-2.5 text-sm transition hover:bg-[#F7F8F6]"
                    style={{ borderColor: line }}
                  >
                    {tr.addTask} ↗
                  </Link>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border bg-white" style={{ borderColor: line }}>
                  {todaysTasks.map((task, index) => (
                    <article
                      key={task.id}
                      className="flex items-center gap-3 px-4 py-4 sm:px-5"
                      style={{ borderBottom: index === todaysTasks.length - 1 ? "none" : `1px solid ${line}` }}
                    >
                      <button
                        type="button"
                        disabled={updatingTaskId === task.id}
                        onClick={() => toggleTask(task)}
                        aria-label={task.status === "完了" ? tr.markUndone : tr.markDone}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs transition disabled:opacity-50"
                        style={
                          task.status === "完了"
                            ? { borderColor: accent, backgroundColor: accent, color: "#fff" }
                            : { borderColor: "#C9CDC5", color: "transparent" }
                        }
                      >
                        ✓
                      </button>

                      <div className="min-w-0 flex-1">
                        <p className={`break-words text-sm font-medium ${task.status === "完了" ? "text-[#969B93] line-through" : ""}`}>
                          {task.title || tr.untitled}
                        </p>
                        <p className="mt-1 text-xs text-[#858A82]">
                          {task.type === "教材の学習" ? tr.materialStudy : tr.vocabulary}
                          {task.material ? ` · ${task.material}` : ""}
                          {task.target > 0 ? ` · ${formatNumber(task.target)} ${task.unit === "単語" ? tr.words : task.unit === "ページ" ? tr.pages : task.unit === "分" ? tr.minutes : task.unit === "章" ? tr.chapters : tr.times}` : ""}
                        </p>
                      </div>

                      <span className="shrink-0 text-xs text-[#858A82]">
                        {getStatusLabel(task.status)}
                      </span>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        <footer className="mt-12 flex flex-wrap justify-between gap-3 border-t pt-5" style={{ borderColor: line }}>
          <p className="text-[10px] font-medium tracking-[0.13em] text-[#92978F]">{tr.footer}</p>
          <p className="text-xs text-[#92978F]">{tr.footerRight}</p>
        </footer>
      </div>
    </main>
  );
}
