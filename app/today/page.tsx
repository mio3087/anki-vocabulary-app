
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
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import {
  useAppLanguage,
  type AppLanguage,
} from "@/app/component/AppLanguage";

type Plan = {
  id: string;
  deckName: string;
  totalItems: number;
  startDate: string;
  deadline: string;
  rounds: number;
  weekdays: number[];
  createdAt: string;
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

const PLAN_STORAGE_KEY = "anki-study-plans-v1";

const muted = "#777C74";
const line = "#DCDDD6";
const accent = "var(--anki-theme-color)";
const accentDark = "var(--anki-theme-dark)";

const localeMap: Record<AppLanguage, string> = {
  ja: "ja-JP",
  en: "en-US",
  de: "de-DE",
  "zh-CN": "zh-CN",
  "zh-TW": "zh-TW",
  es: "es-ES",
};

type Translation = {
  title: string;
  taskManagement: string;
  progress: string;
  taskRegister: string;
  studyPlan: string;
  achievement: string;
  completedTasks: string;
  completedOf: string;
  remaining: string;
  items: string;
  incompleteTasks: string;
  plans: string;
  dailyTarget: string;
  itemsPerDay: string;
  todayTasks: string;
  allTasks: string;
  loading: string;
  loginRequired: string;
  loginDescription: string;
  noTasks: string;
  noTasksDescription: string;
  addTask: string;
  taskError: string;
  updateLogin: string;
  updateError: string;
  tryAgain: string;
  noPlans: string;
  noPlansDescription: string;
  managePlans: string;
  createPlan: string;
  planError: string;
  todayPlan: string;
  deadline: string;
  rounds: string;
  target: string;
  scheduledEdit: string;
  taskCompleted: string;
  taskNotCompleted: string;
  statusNotStarted: string;
  statusInProgress: string;
  statusCompleted: string;
  typeMaterial: string;
  typeVocabulary: string;
  unitWord: string;
  unitPage: string;
  unitMinute: string;
  unitChapter: string;
  unitTime: string;
  untitled: string;
  footer: string;
  footerRight: string;
  todayLabel: string;
  weekdays: string[];
};

const translations: Record<AppLanguage, Translation> = {
  ja: {
    title: "今日のノルマ",
    taskManagement: "タスク管理",
    progress: "達成状況",
    taskRegister: "今日やること",
    studyPlan: "今日の学習計画",
    achievement: "達成率",
    completedTasks: "完了タスク",
    completedOf: "完了 / 全タスク",
    remaining: "残り",
    items: "件",
    incompleteTasks: "未完了のタスク",
    plans: "学習計画",
    dailyTarget: "目標",
    itemsPerDay: "項目 / 日",
    todayTasks: "今日やること",
    allTasks: "すべてのタスク",
    loading: "タスクを読み込んでいます...",
    loginRequired: "ログインが必要です",
    loginDescription: "ログインすると、登録したタスクがここに表示されます。",
    noTasks: "今日のタスクはありません",
    noTasksDescription: "タスク管理から予定を追加すると、ここに表示されます。",
    addTask: "タスクを追加する",
    taskError: "タスクを読み込めませんでした。",
    updateLogin: "タスクの更新にはログインが必要です。",
    updateError: "更新できませんでした。もう一度お試しください。",
    tryAgain: "もう一度お試しください。",
    noPlans: "今日対象の計画はありません",
    noPlansDescription: "学習計画で期間と学習曜日を設定してください。",
    managePlans: "学習計画を管理",
    createPlan: "計画を作成する",
    planError: "学習計画を読み込めませんでした。",
    todayPlan: "本日の目標",
    deadline: "期限",
    rounds: "周",
    target: "目標",
    scheduledEdit: "予定の編集はタスク管理・学習計画から行えます。",
    taskCompleted: "完了にする",
    taskNotCompleted: "未完了に戻す",
    statusNotStarted: "未着手",
    statusInProgress: "進行中",
    statusCompleted: "完了",
    typeMaterial: "教材の学習",
    typeVocabulary: "単語の暗記・復習",
    unitWord: "単語",
    unitPage: "ページ",
    unitMinute: "分",
    unitChapter: "章",
    unitTime: "回",
    untitled: "名称未設定",
    footer: "YOUR ANKI / PERSONAL LEARNING SYSTEM",
    footerRight: "予定の編集はタスク管理・学習計画から行えます。",
    todayLabel: "今日",
    weekdays: ["日", "月", "火", "水", "木", "金", "土"],
  },

  en: {
    title: "Today's Goals",
    taskManagement: "Task Management",
    progress: "PROGRESS",
    taskRegister: "Today's Tasks",
    studyPlan: "Today's Study Plan",
    achievement: "Completion",
    completedTasks: "Completed",
    completedOf: "Completed / Total",
    remaining: "Remaining",
    items: "tasks",
    incompleteTasks: "Incomplete tasks",
    plans: "Study Plans",
    dailyTarget: "Target",
    itemsPerDay: "items / day",
    todayTasks: "Today's Tasks",
    allTasks: "All Tasks",
    loading: "Loading tasks...",
    loginRequired: "Login Required",
    loginDescription: "Log in to see your registered tasks here.",
    noTasks: "No tasks for today",
    noTasksDescription: "Add a task in Task Management to see it here.",
    addTask: "Add a Task",
    taskError: "Could not load tasks.",
    updateLogin: "Please log in to update tasks.",
    updateError: "Could not update the task.",
    tryAgain: "Please try again.",
    noPlans: "No plans scheduled for today",
    noPlansDescription: "Set a study period and study days in Study Plan.",
    managePlans: "Manage Study Plans",
    createPlan: "Create a Plan",
    planError: "Could not load study plans.",
    todayPlan: "Today's Target",
    deadline: "DEADLINE",
    rounds: "rounds",
    target: "TARGET",
    scheduledEdit: "Edit your schedule in Task Management or Study Plan.",
    taskCompleted: "Mark as completed",
    taskNotCompleted: "Mark as incomplete",
    statusNotStarted: "Not Started",
    statusInProgress: "In Progress",
    statusCompleted: "Completed",
    typeMaterial: "Study Materials",
    typeVocabulary: "Vocabulary Memorization & Review",
    unitWord: "words",
    unitPage: "pages",
    unitMinute: "min",
    unitChapter: "chapters",
    unitTime: "times",
    untitled: "Untitled",
    footer: "YOUR ANKI / PERSONAL LEARNING SYSTEM",
    footerRight: "Edit schedules in Task Management or Study Plan.",
    todayLabel: "TODAY",
    weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  },

  de: {
    title: "Heutige Lernziele",
    taskManagement: "Aufgabenverwaltung",
    progress: "FORTSCHRITT",
    taskRegister: "Heutige Aufgaben",
    studyPlan: "Heutiger Lernplan",
    achievement: "Fortschritt",
    completedTasks: "Abgeschlossen",
    completedOf: "Erledigt / Gesamt",
    remaining: "Verbleibend",
    items: "Aufgaben",
    incompleteTasks: "Offene Aufgaben",
    plans: "Lernpläne",
    dailyTarget: "Ziel",
    itemsPerDay: "Einheiten / Tag",
    todayTasks: "Heutige Aufgaben",
    allTasks: "Alle Aufgaben",
    loading: "Aufgaben werden geladen...",
    loginRequired: "Anmeldung erforderlich",
    loginDescription: "Melde dich an, um deine Aufgaben hier zu sehen.",
    noTasks: "Keine Aufgaben für heute",
    noTasksDescription: "Füge in der Aufgabenverwaltung eine Aufgabe hinzu.",
    addTask: "Aufgabe hinzufügen",
    taskError: "Aufgaben konnten nicht geladen werden.",
    updateLogin: "Bitte melde dich an, um Aufgaben zu aktualisieren.",
    updateError: "Die Aufgabe konnte nicht aktualisiert werden.",
    tryAgain: "Bitte versuche es erneut.",
    noPlans: "Für heute sind keine Lernpläne vorgesehen",
    noPlansDescription: "Lege im Lernplan einen Zeitraum und Lerntage fest.",
    managePlans: "Lernpläne verwalten",
    createPlan: "Plan erstellen",
    planError: "Lernpläne konnten nicht geladen werden.",
    todayPlan: "Heutiges Ziel",
    deadline: "FRIST",
    rounds: "Durchgänge",
    target: "ZIEL",
    scheduledEdit: "Bearbeite deine Planung in der Aufgabenverwaltung oder im Lernplan.",
    taskCompleted: "Als erledigt markieren",
    taskNotCompleted: "Als offen markieren",
    statusNotStarted: "Nicht begonnen",
    statusInProgress: "In Bearbeitung",
    statusCompleted: "Abgeschlossen",
    typeMaterial: "Lernmaterial",
    typeVocabulary: "Vokabeln lernen und wiederholen",
    unitWord: "Wörter",
    unitPage: "Seiten",
    unitMinute: "Min.",
    unitChapter: "Kapitel",
    unitTime: "Mal",
    untitled: "Ohne Titel",
    footer: "YOUR ANKI / PERSONAL LEARNING SYSTEM",
    footerRight: "Bearbeite deine Planung in der Aufgabenverwaltung oder im Lernplan.",
    todayLabel: "HEUTE",
    weekdays: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
  },

  "zh-CN": {
    title: "今日目标",
    taskManagement: "任务管理",
    progress: "完成进度",
    taskRegister: "今日任务",
    studyPlan: "今日学习计划",
    achievement: "完成率",
    completedTasks: "已完成任务",
    completedOf: "已完成 / 总任务",
    remaining: "剩余",
    items: "项",
    incompleteTasks: "未完成的任务",
    plans: "学习计划",
    dailyTarget: "目标",
    itemsPerDay: "项目 / 天",
    todayTasks: "今日任务",
    allTasks: "全部任务",
    loading: "正在加载任务...",
    loginRequired: "需要登录",
    loginDescription: "登录后即可在这里查看已添加的任务。",
    noTasks: "今天没有任务",
    noTasksDescription: "在任务管理中添加计划后，就会显示在这里。",
    addTask: "添加任务",
    taskError: "无法加载任务。",
    updateLogin: "请登录后更新任务。",
    updateError: "无法更新任务，请重试。",
    tryAgain: "请重试。",
    noPlans: "今天没有安排学习计划",
    noPlansDescription: "请在学习计划中设置学习期间和学习星期。",
    managePlans: "管理学习计划",
    createPlan: "创建计划",
    planError: "无法加载学习计划。",
    todayPlan: "今日目标",
    deadline: "截止日期",
    rounds: "轮",
    target: "目标",
    scheduledEdit: "请在任务管理或学习计划中编辑安排。",
    taskCompleted: "标记为已完成",
    taskNotCompleted: "恢复为未完成",
    statusNotStarted: "未开始",
    statusInProgress: "进行中",
    statusCompleted: "已完成",
    typeMaterial: "教材学习",
    typeVocabulary: "单词记忆与复习",
    unitWord: "个单词",
    unitPage: "页",
    unitMinute: "分钟",
    unitChapter: "章",
    unitTime: "次",
    untitled: "未命名",
    footer: "YOUR ANKI / PERSONAL LEARNING SYSTEM",
    footerRight: "请在任务管理或学习计划中编辑安排。",
    todayLabel: "今日",
    weekdays: ["日", "一", "二", "三", "四", "五", "六"],
  },

  "zh-TW": {
    title: "今日目標",
    taskManagement: "任務管理",
    progress: "完成進度",
    taskRegister: "今日任務",
    studyPlan: "今日學習計畫",
    achievement: "完成率",
    completedTasks: "已完成任務",
    completedOf: "已完成 / 總任務",
    remaining: "剩餘",
    items: "項",
    incompleteTasks: "未完成的任務",
    plans: "學習計畫",
    dailyTarget: "目標",
    itemsPerDay: "項目 / 天",
    todayTasks: "今日任務",
    allTasks: "全部任務",
    loading: "正在載入任務...",
    loginRequired: "需要登入",
    loginDescription: "登入後即可在這裡查看已新增的任務。",
    noTasks: "今天沒有任務",
    noTasksDescription: "在任務管理中新增計畫後，就會顯示在這裡。",
    addTask: "新增任務",
    taskError: "無法載入任務。",
    updateLogin: "請登入後更新任務。",
    updateError: "無法更新任務，請重試。",
    tryAgain: "請重試。",
    noPlans: "今天沒有安排學習計畫",
    noPlansDescription: "請在學習計畫中設定學習期間和學習星期。",
    managePlans: "管理學習計畫",
    createPlan: "建立計畫",
    planError: "無法載入學習計畫。",
    todayPlan: "今日目標",
    deadline: "截止日期",
    rounds: "輪",
    target: "目標",
    scheduledEdit: "請在任務管理或學習計畫中編輯安排。",
    taskCompleted: "標記為已完成",
    taskNotCompleted: "恢復為未完成",
    statusNotStarted: "未開始",
    statusInProgress: "進行中",
    statusCompleted: "已完成",
    typeMaterial: "教材學習",
    typeVocabulary: "單字記憶與複習",
    unitWord: "個單字",
    unitPage: "頁",
    unitMinute: "分鐘",
    unitChapter: "章",
    unitTime: "次",
    untitled: "未命名",
    footer: "YOUR ANKI / PERSONAL LEARNING SYSTEM",
    footerRight: "請在任務管理或學習計畫中編輯安排。",
    todayLabel: "今日",
    weekdays: ["日", "一", "二", "三", "四", "五", "六"],
  },

  es: {
    title: "Objetivos de hoy",
    taskManagement: "Gestión de tareas",
    progress: "PROGRESO",
    taskRegister: "Tareas de hoy",
    studyPlan: "Plan de estudio de hoy",
    achievement: "Completado",
    completedTasks: "Tareas completadas",
    completedOf: "Completadas / Total",
    remaining: "Restantes",
    items: "tareas",
    incompleteTasks: "Tareas pendientes",
    plans: "Planes de estudio",
    dailyTarget: "Objetivo",
    itemsPerDay: "elementos / día",
    todayTasks: "Tareas de hoy",
    allTasks: "Todas las tareas",
    loading: "Cargando tareas...",
    loginRequired: "Es necesario iniciar sesión",
    loginDescription: "Inicia sesión para ver aquí tus tareas registradas.",
    noTasks: "No hay tareas para hoy",
    noTasksDescription: "Añade una tarea en Gestión de tareas para verla aquí.",
    addTask: "Añadir tarea",
    taskError: "No se pudieron cargar las tareas.",
    updateLogin: "Inicia sesión para actualizar las tareas.",
    updateError: "No se pudo actualizar la tarea.",
    tryAgain: "Inténtalo de nuevo.",
    noPlans: "No hay planes programados para hoy",
    noPlansDescription: "Configura el periodo y los días de estudio en Plan de estudio.",
    managePlans: "Gestionar planes",
    createPlan: "Crear un plan",
    planError: "No se pudieron cargar los planes de estudio.",
    todayPlan: "Objetivo de hoy",
    deadline: "FECHA LÍMITE",
    rounds: "vueltas",
    target: "OBJETIVO",
    scheduledEdit: "Edita tu planificación en Gestión de tareas o Plan de estudio.",
    taskCompleted: "Marcar como completada",
    taskNotCompleted: "Marcar como pendiente",
    statusNotStarted: "Sin empezar",
    statusInProgress: "En curso",
    statusCompleted: "Completada",
    typeMaterial: "Estudio de materiales",
    typeVocabulary: "Memorización y repaso de vocabulario",
    unitWord: "palabras",
    unitPage: "páginas",
    unitMinute: "min",
    unitChapter: "capítulos",
    unitTime: "veces",
    untitled: "Sin título",
    footer: "YOUR ANKI / PERSONAL LEARNING SYSTEM",
    footerRight: "Edita tu planificación en Gestión de tareas o Plan de estudio.",
    todayLabel: "HOY",
    weekdays: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
  },
};

const statusKeys: Record<TaskStatus, keyof Translation> = {
  未着手: "statusNotStarted",
  進行中: "statusInProgress",
  完了: "statusCompleted",
};

const typeKeys: Record<TaskType, keyof Translation> = {
  教材の学習: "typeMaterial",
  "単語の暗記・復習": "typeVocabulary",
};

const unitKeys: Record<TaskUnit, keyof Translation> = {
  単語: "unitWord",
  ページ: "unitPage",
  分: "unitMinute",
  章: "unitChapter",
  回: "unitTime",
};

function dateString(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function weekdayIndex(date = new Date()) {
  return (date.getDay() + 6) % 7;
}

function countStudyDays(start: string, end: string, weekdays: number[]) {
  if (!start || !end || start > end || weekdays.length === 0) return 0;

  const from = new Date(`${start}T12:00:00`);
  const to = new Date(`${end}T12:00:00`);
  let count = 0;

  for (
    const date = new Date(from);
    date <= to;
    date.setDate(date.getDate() + 1)
  ) {
    if (weekdays.includes((date.getDay() + 6) % 7)) count++;
  }

  return count;
}

function normalizeTask(
  id: string,
  data: Record<string, unknown>
): StudyTask {
  const units: TaskUnit[] = ["単語", "ページ", "分", "章", "回"];
  const statuses: TaskStatus[] = ["未着手", "進行中", "完了"];
  const repeats = ["なし", "毎日", "毎週"] as const;

  return {
    id,
    title: typeof data.title === "string" ? data.title : "",
    type:
      data.type === "教材の学習"
        ? "教材の学習"
        : "単語の暗記・復習",
    material: typeof data.material === "string" ? data.material : "",
    target: typeof data.target === "number" ? data.target : 0,
    unit: units.includes(data.unit as TaskUnit)
      ? (data.unit as TaskUnit)
      : "単語",
    startDate: typeof data.startDate === "string" ? data.startDate : "",
    scheduledDate:
      typeof data.scheduledDate === "string" ? data.scheduledDate : "",
    dueDate: typeof data.dueDate === "string" ? data.dueDate : "",
    status: statuses.includes(data.status as TaskStatus)
      ? (data.status as TaskStatus)
      : "未着手",
    repeat: repeats.includes(data.repeat as (typeof repeats)[number])
      ? (data.repeat as (typeof repeats)[number])
      : "なし",
    repeatDays: Array.isArray(data.repeatDays)
      ? data.repeatDays.filter(
          (value): value is number =>
            typeof value === "number" && value >= 0 && value <= 6
        )
      : [],
  };
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[10px] font-semibold uppercase tracking-[0.2em]"
      style={{ color: muted }}
    >
      {children}
    </p>
  );
}

export default function TodayPage() {
  const { language } = useAppLanguage();
  const tr = translations[language];

  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  const today = dateString();
  const todayWeekday = weekdayIndex();
  const now = new Date();

  const formattedDate = new Intl.DateTimeFormat(localeMap[language], {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(now);

  const englishDate = new Intl.DateTimeFormat(localeMap[language], {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(now)
    .toUpperCase();

  const formatNumber = (value: number) =>
    value.toLocaleString(localeMap[language]);

  const translatedStatus = (status: TaskStatus) =>
    tr[statusKeys[status]];

  const translatedType = (type: TaskType) =>
    tr[typeKeys[type]];

  const translatedUnit = (unit: TaskUnit) =>
    tr[unitKeys[unit]];

  useEffect(() => {
    function refreshPlans() {
      try {
        const saved = localStorage.getItem(PLAN_STORAGE_KEY);
        const parsed = saved ? JSON.parse(saved) : [];
        setPlans(Array.isArray(parsed) ? parsed : []);
        setErrorMessage("");
      } catch (error) {
        console.error("Study plan loading error:", error);
        setPlans([]);
        setErrorMessage(translations[language].planError);
      }
    }

    refreshPlans();
    window.addEventListener("storage", refreshPlans);
    window.addEventListener("focus", refreshPlans);

    return () => {
      window.removeEventListener("storage", refreshPlans);
      window.removeEventListener("focus", refreshPlans);
    };
  }, [language]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!authReady) return;

    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      collection(db, "users", user.uid, "tasks"),
      (snapshot) => {
        const nextTasks = snapshot.docs.map((taskDoc) =>
          normalizeTask(
            taskDoc.id,
            taskDoc.data() as Record<string, unknown>
          )
        );

        setTasks(nextTasks);
        setLoading(false);
        setErrorMessage("");
      },
      (error) => {
        console.error("Task loading error:", error);
        setErrorMessage(translations[language].taskError);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [authReady, user, language]);

  const todaysPlans = useMemo(
    () =>
      plans.filter(
        (plan) =>
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
          return a.title.localeCompare(b.title, localeMap[language]);
        }),
    [tasks, today, todayWeekday, language]
  );

  const completedCount = todaysTasks.filter(
    (task) => task.status === "完了"
  ).length;

  const totalCount = todaysTasks.length;
  const remainingCount = Math.max(0, totalCount - completedCount);

  const progress =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const plannedDailyTotal = todaysPlans.reduce((sum, plan) => {
    const studyDays = countStudyDays(
      plan.startDate,
      plan.deadline,
      plan.weekdays
    );

    if (studyDays === 0) return sum;

    return sum + Math.ceil((plan.totalItems * plan.rounds) / studyDays);
  }, 0);

  async function toggleTask(task: StudyTask) {
    if (!user) {
      setErrorMessage(tr.updateLogin);
      return;
    }

    setUpdatingTaskId(task.id);
    setErrorMessage("");

    const nextStatus: TaskStatus =
      task.status === "完了" ? "進行中" : "完了";

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

  return (
    <main className="min-h-screen bg-[#F7F7F5] text-[#20231F]">
      <div className="mx-auto max-w-6xl px-5 pb-12 pt-7 sm:px-8 md:px-12 md:pt-10">
        <header
          className="mb-10 border-b pb-7 sm:mb-12 sm:pb-9"
          style={{ borderColor: line }}
        >
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <SectionLabel>
                DAILY OVERVIEW / {englishDate}
              </SectionLabel>

              <h1 className="mt-4 text-3xl font-semibold tracking-[-0.045em] sm:text-5xl">
                {tr.title}
              </h1>

              <p className="mt-3 text-sm text-[#777C74]">
                {formattedDate}
              </p>
            </div>

            <Link
              href="/tasks"
              className="inline-flex items-center gap-3 border px-4 py-3 text-sm transition hover:bg-white"
              style={{ borderColor: line }}
            >
              {tr.taskManagement}
              <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </header>

        {errorMessage && (
          <div
            role="alert"
            className="mb-6 border-l-2 bg-white px-4 py-3 text-sm text-[#8A5145]"
            style={{ borderColor: "#A86B5C" }}
          >
            {errorMessage}
          </div>
        )}

        <section className="mb-12">
          <div className="mb-4 flex items-center justify-between">
            <SectionLabel>01 / {tr.progress}</SectionLabel>
            <span className="text-[10px] tracking-[0.12em] text-[#777C74]">
              {tr.todayLabel}
            </span>
          </div>

          <div
            className="grid grid-cols-2 border-l border-t sm:grid-cols-4"
            style={{ borderColor: line }}
          >
            <article
              className="min-h-[145px] border-b border-r p-4 sm:p-5"
              style={{ borderColor: line }}
            >
              <p className="text-xs text-[#777C74]">
                {tr.achievement}
              </p>

              <div className="mt-5 flex items-baseline gap-1">
                <span className="font-mono text-4xl font-medium tracking-[-0.06em] sm:text-5xl">
                  {progress}
                </span>
                <span className="text-sm text-[#777C74]">%</span>
              </div>

              <div
                className="mt-4 h-[3px] w-full"
                style={{ backgroundColor: "#E2E3DD" }}
                role="progressbar"
                aria-label={tr.achievement}
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${progress}%`,
                    backgroundColor: accent,
                  }}
                />
              </div>
            </article>

            <article
              className="min-h-[145px] border-b border-r p-4 sm:p-5"
              style={{ borderColor: line }}
            >
              <p className="text-xs text-[#777C74]">
                {tr.completedTasks}
              </p>

              <div className="mt-5 flex items-baseline gap-2">
                <span className="font-mono text-4xl font-medium tracking-[-0.06em] sm:text-5xl">
                  {String(completedCount).padStart(2, "0")}
                </span>
                <span className="text-xs text-[#777C74]">
                  / {String(totalCount).padStart(2, "0")}
                </span>
              </div>

              <p className="mt-4 text-[11px] text-[#777C74]">
                {tr.completedOf}
              </p>
            </article>

            <article
              className="min-h-[145px] border-b border-r p-4 sm:p-5"
              style={{ borderColor: line }}
            >
              <p className="text-xs text-[#777C74]">
                {tr.remaining}
              </p>

              <div className="mt-5 flex items-baseline gap-2">
                <span className="font-mono text-4xl font-medium tracking-[-0.06em] sm:text-5xl">
                  {String(remainingCount).padStart(2, "0")}
                </span>
                <span className="text-xs text-[#777C74]">
                  {tr.items}
                </span>
              </div>

              <p className="mt-4 text-[11px] text-[#777C74]">
                {tr.incompleteTasks}
              </p>
            </article>

            <article
              className="min-h-[145px] border-b border-r p-4 sm:p-5"
              style={{ borderColor: line }}
            >
              <p className="text-xs text-[#777C74]">
                {tr.plans}
              </p>

              <div className="mt-5 flex items-baseline gap-2">
                <span className="font-mono text-4xl font-medium tracking-[-0.06em] sm:text-5xl">
                  {String(todaysPlans.length).padStart(2, "0")}
                </span>
                <span className="text-xs text-[#777C74]">
                  {tr.items}
                </span>
              </div>

              <p className="mt-4 text-[11px] text-[#777C74]">
                {tr.target} {formatNumber(plannedDailyTotal)}{" "}
                {tr.itemsPerDay}
              </p>
            </article>
          </div>
        </section>

        <section className="mb-12">
          <div
            className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b pb-4"
            style={{ borderColor: line }}
          >
            <div>
              <SectionLabel>02 / {tr.taskRegister}</SectionLabel>
              <h2 className="mt-2 text-xl font-semibold tracking-tight">
                {tr.todayTasks}
              </h2>
            </div>

            <Link
              href="/tasks"
              className="text-xs hover:underline"
              style={{ color: accentDark }}
            >
              {tr.allTasks} ↗
            </Link>
          </div>

          {!authReady || loading ? (
            <p className="py-8 text-sm text-[#777C74]">
              {tr.loading}
            </p>
          ) : !user ? (
            <div className="border-y py-8">
              <p className="font-medium">{tr.loginRequired}</p>
              <p className="mt-2 text-sm text-[#777C74]">
                {tr.loginDescription}
              </p>
            </div>
          ) : todaysTasks.length === 0 ? (
            <div className="border-y py-10">
              <p className="text-lg font-medium">{tr.noTasks}</p>
              <p className="mt-2 text-sm text-[#777C74]">
                {tr.noTasksDescription}
              </p>

              <Link
                href="/tasks"
                className="mt-5 inline-flex items-center gap-2 border px-4 py-3 text-sm hover:bg-white"
                style={{ borderColor: line }}
              >
                {tr.addTask}
                <span aria-hidden="true">↗</span>
              </Link>
            </div>
          ) : (
            <div className="border-t" style={{ borderColor: line }}>
              {todaysTasks.map((task, index) => (
                <article
                  key={task.id}
                  className="grid grid-cols-[28px_32px_minmax(0,1fr)_auto] items-start gap-3 border-b py-4 sm:grid-cols-[40px_32px_minmax(0,1fr)_auto] sm:gap-4 sm:py-5"
                  style={{ borderColor: line }}
                >
                  <span className="pt-1 font-mono text-[11px] text-[#858A82]">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <button
                    type="button"
                    disabled={updatingTaskId === task.id}
                    onClick={() => toggleTask(task)}
                    aria-label={
                      task.status === "完了"
                        ? `${task.title}: ${tr.taskNotCompleted}`
                        : `${task.title}: ${tr.taskCompleted}`
                    }
                    className="mt-0.5 flex h-6 w-6 items-center justify-center border text-xs transition disabled:opacity-50"
                    style={
                      task.status === "完了"
                        ? {
                            borderColor: accent,
                            backgroundColor: accent,
                            color: "#FFFFFF",
                          }
                        : {
                            borderColor: "#BFC4BB",
                            color: "transparent",
                          }
                    }
                  >
                    ✓
                  </button>

                  <div className="min-w-0">
                    <p
                      className={`break-words text-sm font-medium ${
                        task.status === "完了"
                          ? "text-[#858A82] line-through"
                          : "text-[#20231F]"
                      }`}
                    >
                      {task.title || tr.untitled}
                    </p>

                    <p className="mt-1 text-xs text-[#777C74]">
                      {translatedType(task.type)}
                      {task.material ? ` / ${task.material}` : ""}
                    </p>

                    {task.target > 0 && (
                      <p
                        className="mt-2 font-mono text-xs"
                        style={{ color: accentDark }}
                      >
                        TARGET · {formatNumber(task.target)}{" "}
                        {translatedUnit(task.unit)}
                      </p>
                    )}
                  </div>

                  <span
                    className={`whitespace-nowrap pt-1 text-[10px] ${
                      task.status === "進行中"
                        ? "text-[#92783F]"
                        : task.status === "未着手"
                          ? "text-[#777C74]"
                          : ""
                    }`}
                    style={
                      task.status === "完了"
                        ? { color: accentDark }
                        : undefined
                    }
                  >
                    {translatedStatus(task.status)}
                  </span>
                </article>
              ))}
            </div>
          )}
        </section>

        <section>
          <div
            className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b pb-4"
            style={{ borderColor: line }}
          >
            <div>
              <SectionLabel>03 / {tr.studyPlan}</SectionLabel>
              <h2 className="mt-2 text-xl font-semibold tracking-tight">
                {tr.studyPlan}
              </h2>
            </div>

            <Link
              href="/plan"
              className="text-xs hover:underline"
              style={{ color: accentDark }}
            >
              {tr.managePlans} ↗
            </Link>
          </div>

          {todaysPlans.length === 0 ? (
            <div className="border-y py-8">
              <p className="font-medium">{tr.noPlans}</p>
              <p className="mt-2 text-sm text-[#777C74]">
                {tr.noPlansDescription}
              </p>

              <Link
                href="/plan"
                className="mt-5 inline-flex items-center gap-2 border px-4 py-3 text-sm hover:bg-white"
                style={{ borderColor: line }}
              >
                {tr.createPlan}
                <span aria-hidden="true">↗</span>
              </Link>
            </div>
          ) : (
            <div
              className="grid grid-cols-1 border-l border-t sm:grid-cols-2"
              style={{ borderColor: line }}
            >
              {todaysPlans.map((plan, index) => {
                const studyDays = countStudyDays(
                  plan.startDate,
                  plan.deadline,
                  plan.weekdays
                );

                const dailyTarget =
                  studyDays > 0
                    ? Math.ceil(
                        (plan.totalItems * plan.rounds) / studyDays
                      )
                    : 0;

                return (
                  <article
                    key={plan.id}
                    className="border-b border-r p-5 sm:p-6"
                    style={{ borderColor: line }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <SectionLabel>
                        PLAN {String(index + 1).padStart(2, "0")}
                      </SectionLabel>

                      <span className="text-[10px] text-[#777C74]">
                        {tr.deadline} / {plan.deadline}
                      </span>
                    </div>

                    <h3 className="mt-5 break-words text-base font-semibold">
                      {plan.deckName || tr.untitled}
                    </h3>

                    <p className="mt-2 text-xs text-[#777C74]">
                      {plan.rounds} {tr.rounds} ·{" "}
                      {formatNumber(plan.totalItems)} {tr.items}
                    </p>

                    <div
                      className="mt-6 flex items-end justify-between border-t pt-4"
                      style={{ borderColor: line }}
                    >
                      <div>
                        <p className="text-xs text-[#777C74]">
                          {tr.todayPlan}
                        </p>

                        <p
                          className="mt-2 font-mono text-3xl font-medium tracking-[-0.05em]"
                          style={{ color: accentDark }}
                        >
                          {formatNumber(dailyTarget)}

                          <span className="ml-2 font-sans text-xs tracking-normal text-[#777C74]">
                            {tr.items}
                          </span>
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <footer
          className="mt-12 flex flex-wrap justify-between gap-3 border-t pt-5"
          style={{ borderColor: line }}
        >
          <p className="text-[10px] tracking-[0.12em] text-[#777C74]">
            YOUR ANKI / PERSONAL LEARNING SYSTEM
          </p>

          <p className="text-xs text-[#777C74]">
            {tr.footerRight}
          </p>
        </footer>
      </div>
    </main>
  );
}
