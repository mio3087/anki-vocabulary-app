
"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
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

type TaskType = "教材の学習" | "単語の暗記・復習";
type TaskStatus = "未着手" | "進行中" | "完了";
type RepeatType = "なし" | "毎日" | "毎週";
type TaskUnit = "単語" | "ページ" | "分" | "章" | "回";
type FilterType = "all" | "today" | "open" | "done" | "overdue";

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
  repeat: RepeatType;
  repeatDays: number[];
};

const todayString = () => {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

const emptyForm = () => ({
  title: "",
  type: "教材の学習" as TaskType,
  material: "",
  target: 50,
  unit: "単語" as TaskUnit,
  startDate: todayString(),
  scheduledDate: todayString(),
  dueDate: todayString(),
  repeat: "なし" as RepeatType,
  repeatDays: [] as number[],
});

const weekdays = [0, 1, 2, 3, 4, 5, 6];

const translations: Record<
  AppLanguage,
  Record<string, string | string[]>
> = {
  ja: {
    title: "タスク管理",
    description: "学習タスクを整理して、毎日の勉強を少しずつ進めましょう。",
    checkingAuth: "ログイン状態を確認しています...",
    loginRequired: "タスクをFirestoreに保存するにはログインしてください。ログイン後、このページを再読み込みしてください。",
    firestoreError: "タスクを読み込めませんでした。Firestoreのルールを確認してください。",
    saveLogin: "タスクを保存するにはログインしてください。",
    enterTitle: "タスク名を入力してください。",
    targetError: "目標量は0以上にしてください。",
    startDateError: "実施予定日は開始日以降にしてください。",
    dueDateError: "期限は実施予定日以降にしてください。",
    repeatDaysError: "繰り返す曜日を1つ以上選んでください。",
    saveError: "保存できませんでした。Firestoreのルールや通信状態を確認してください。",
    statusError: "状態を更新できませんでした。",
    deleteError: "削除できませんでした。",
    confirmDelete: "「{title}」を削除しますか？",
    createOrganize: "CREATE & ORGANIZE",
    editTask: "タスクを編集",
    newTask: "新しいタスクを登録",
    taskName: "タスク名",
    required: "*",
    taskType: "タスクの種類",
    material: "教材・デッキ名",
    target: "目標量",
    unit: "単位",
    startDate: "開始日",
    scheduledDate: "実施予定日",
    dueDate: "期限",
    repeat: "繰り返し",
    typeMaterial: "教材の学習",
    typeVocabulary: "単語の暗記・復習",
    unitWord: "単語",
    unitPage: "ページ",
    unitMinute: "分",
    unitChapter: "章",
    unitTime: "回",
    repeatNone: "なし",
    repeatDaily: "毎日",
    repeatWeekly: "毎週",
    repeatDays: "繰り返す曜日",
    chooseDay: "曜日を1つ以上選んでください。",
    saving: "保存中...",
    saveChanges: "変更を保存",
    register: "＋ タスクを登録",
    cancel: "編集をキャンセル",
    yourStudyList: "YOUR STUDY LIST",
    taskList: "タスク一覧",
    taskCount: "{count} 件のタスク",
    filterStatus: "状態で絞り込み",
    all: "すべて",
    today: "今日のタスク",
    open: "未完了",
    done: "完了済み",
    overdue: "期限切れ",
    search: "タスク・教材を検索",
    keyword: "キーワードを入力",
    loading: "タスクを読み込んでいます...",
    loginToView: "ログインすると保存済みのタスクが表示されます。",
    noTasks: "該当するタスクはありません",
    noTasksDescription: "条件を変更するか、上のフォームから登録できます。",
    goal: "目標",
    scheduled: "実施日",
    deadline: "期限",
    unset: "未設定",
    repeatLabel: "繰り返し",
    statusNotStarted: "未着手",
    statusInProgress: "進行中",
    statusCompleted: "完了",
    edit: "編集",
    delete: "削除",
    loggedIn: "ログイン中 · Firestoreに保存",
    loggedOut: "未ログイン · タスクの保存にはログインが必要です",
    sunday: "日曜日",
    monday: "月曜日",
    tuesday: "火曜日",
    wednesday: "水曜日",
    thursday: "木曜日",
    friday: "金曜日",
    saturday: "土曜日",
    weekdays: ["日", "月", "火", "水", "木", "金", "土"],
    placeholderTitle: "例：中国語の単語復習",
    placeholderMaterial: "例：華文閱讀測驗 中級",
    notSet: "未設定",
  },

  en: {
    title: "Task Management",
    description: "Organize your study tasks and make steady progress every day.",
    checkingAuth: "Checking login status...",
    loginRequired: "Please log in to save tasks to Firestore. Reload this page after logging in.",
    firestoreError: "Could not load tasks. Please check your Firestore rules.",
    saveLogin: "Please log in to save tasks.",
    enterTitle: "Please enter a task name.",
    targetError: "The target must be zero or greater.",
    startDateError: "The scheduled date must be on or after the start date.",
    dueDateError: "The deadline must be on or after the scheduled date.",
    repeatDaysError: "Please select at least one weekday.",
    saveError: "Could not save. Please check your Firestore rules and connection.",
    statusError: "Could not update the status.",
    deleteError: "Could not delete the task.",
    confirmDelete: "Delete \"{title}\"?",
    createOrganize: "CREATE & ORGANIZE",
    editTask: "Edit Task",
    newTask: "Create a New Task",
    taskName: "Task Name",
    required: "*",
    taskType: "Task Type",
    material: "Material / Deck Name",
    target: "Target",
    unit: "Unit",
    startDate: "Start Date",
    scheduledDate: "Scheduled Date",
    dueDate: "Deadline",
    repeat: "Repeat",
    typeMaterial: "Study Materials",
    typeVocabulary: "Vocabulary Memorization & Review",
    unitWord: "Words",
    unitPage: "Pages",
    unitMinute: "Minutes",
    unitChapter: "Chapters",
    unitTime: "Times",
    repeatNone: "None",
    repeatDaily: "Daily",
    repeatWeekly: "Weekly",
    repeatDays: "Repeat on",
    chooseDay: "Please select at least one weekday.",
    saving: "Saving...",
    saveChanges: "Save Changes",
    register: "＋ Add Task",
    cancel: "Cancel Editing",
    yourStudyList: "YOUR STUDY LIST",
    taskList: "Task List",
    taskCount: "{count} tasks",
    filterStatus: "Filter by Status",
    all: "All",
    today: "Today's Tasks",
    open: "Incomplete",
    done: "Completed",
    overdue: "Overdue",
    search: "Search Tasks / Materials",
    keyword: "Enter a keyword",
    loading: "Loading tasks...",
    loginToView: "Log in to view your saved tasks.",
    noTasks: "No matching tasks",
    noTasksDescription: "Change the filters or create a task using the form above.",
    goal: "Target",
    scheduled: "Scheduled",
    deadline: "Deadline",
    unset: "Not set",
    repeatLabel: "Repeat",
    statusNotStarted: "Not Started",
    statusInProgress: "In Progress",
    statusCompleted: "Completed",
    edit: "Edit",
    delete: "Delete",
    loggedIn: "Logged in · Saved to Firestore",
    loggedOut: "Not logged in · Login required to save tasks",
    sunday: "Sunday",
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    placeholderTitle: "e.g. Review Chinese vocabulary",
    placeholderMaterial: "e.g. Intermediate Chinese Reading",
    notSet: "Not set",
  },

  de: {
    title: "Aufgabenverwaltung",
    description: "Organisiere deine Lernaufgaben und mache jeden Tag kleine Fortschritte.",
    checkingAuth: "Anmeldestatus wird überprüft...",
    loginRequired: "Bitte melde dich an, um Aufgaben in Firestore zu speichern. Lade diese Seite nach der Anmeldung neu.",
    firestoreError: "Aufgaben konnten nicht geladen werden. Bitte überprüfe die Firestore-Regeln.",
    saveLogin: "Bitte melde dich an, um Aufgaben zu speichern.",
    enterTitle: "Bitte gib einen Aufgabennamen ein.",
    targetError: "Das Ziel muss mindestens 0 betragen.",
    startDateError: "Das geplante Datum muss am oder nach dem Startdatum liegen.",
    dueDateError: "Die Frist muss am oder nach dem geplanten Datum liegen.",
    repeatDaysError: "Bitte wähle mindestens einen Wochentag aus.",
    saveError: "Speichern fehlgeschlagen. Bitte überprüfe die Firestore-Regeln und deine Verbindung.",
    statusError: "Der Status konnte nicht aktualisiert werden.",
    deleteError: "Die Aufgabe konnte nicht gelöscht werden.",
    confirmDelete: "Möchtest du „{title}“ löschen?",
    createOrganize: "ERSTELLEN & ORGANISIEREN",
    editTask: "Aufgabe bearbeiten",
    newTask: "Neue Aufgabe erstellen",
    taskName: "Aufgabenname",
    required: "*",
    taskType: "Aufgabentyp",
    material: "Lernmaterial / Deck",
    target: "Lernziel",
    unit: "Einheit",
    startDate: "Startdatum",
    scheduledDate: "Geplantes Datum",
    dueDate: "Frist",
    repeat: "Wiederholung",
    typeMaterial: "Lernmaterial bearbeiten",
    typeVocabulary: "Vokabeln lernen und wiederholen",
    unitWord: "Wörter",
    unitPage: "Seiten",
    unitMinute: "Minuten",
    unitChapter: "Kapitel",
    unitTime: "Mal",
    repeatNone: "Keine",
    repeatDaily: "Täglich",
    repeatWeekly: "Wöchentlich",
    repeatDays: "Wiederholungstage",
    chooseDay: "Bitte wähle mindestens einen Wochentag aus.",
    saving: "Wird gespeichert...",
    saveChanges: "Änderungen speichern",
    register: "＋ Aufgabe hinzufügen",
    cancel: "Bearbeitung abbrechen",
    yourStudyList: "DEINE LERNLISTE",
    taskList: "Aufgabenliste",
    taskCount: "{count} Aufgaben",
    filterStatus: "Nach Status filtern",
    all: "Alle",
    today: "Heutige Aufgaben",
    open: "Offen",
    done: "Abgeschlossen",
    overdue: "Überfällig",
    search: "Aufgaben / Materialien suchen",
    keyword: "Suchbegriff eingeben",
    loading: "Aufgaben werden geladen...",
    loginToView: "Melde dich an, um deine gespeicherten Aufgaben zu sehen.",
    noTasks: "Keine passenden Aufgaben",
    noTasksDescription: "Ändere die Filter oder erstelle oben eine neue Aufgabe.",
    goal: "Ziel",
    scheduled: "Geplant",
    deadline: "Frist",
    unset: "Nicht festgelegt",
    repeatLabel: "Wiederholung",
    statusNotStarted: "Nicht begonnen",
    statusInProgress: "In Bearbeitung",
    statusCompleted: "Abgeschlossen",
    edit: "Bearbeiten",
    delete: "Löschen",
    loggedIn: "Angemeldet · In Firestore gespeichert",
    loggedOut: "Nicht angemeldet · Anmeldung zum Speichern erforderlich",
    sunday: "Sonntag",
    monday: "Montag",
    tuesday: "Dienstag",
    wednesday: "Mittwoch",
    thursday: "Donnerstag",
    friday: "Freitag",
    saturday: "Samstag",
    weekdays: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
    placeholderTitle: "z. B. Chinesische Vokabeln wiederholen",
    placeholderMaterial: "z. B. Chinesischer Lesetest – Mittelstufe",
    notSet: "Nicht festgelegt",
  },

  "zh-CN": {
    title: "任务管理",
    description: "整理学习任务，每天稳步推进学习。",
    checkingAuth: "正在确认登录状态...",
    loginRequired: "请登录后将任务保存到 Firestore。登录后请重新加载此页面。",
    firestoreError: "无法加载任务，请检查 Firestore 规则。",
    saveLogin: "请登录后保存任务。",
    enterTitle: "请输入任务名称。",
    targetError: "目标数量必须大于或等于 0。",
    startDateError: "计划日期不能早于开始日期。",
    dueDateError: "截止日期不能早于计划日期。",
    repeatDaysError: "请至少选择一个星期几。",
    saveError: "保存失败，请检查 Firestore 规则或网络连接。",
    statusError: "无法更新任务状态。",
    deleteError: "无法删除任务。",
    confirmDelete: "确定要删除「{title}」吗？",
    createOrganize: "创建与整理",
    editTask: "编辑任务",
    newTask: "创建新任务",
    taskName: "任务名称",
    required: "*",
    taskType: "任务类型",
    material: "教材／单词卡组名称",
    target: "目标数量",
    unit: "单位",
    startDate: "开始日期",
    scheduledDate: "计划日期",
    dueDate: "截止日期",
    repeat: "重复",
    typeMaterial: "教材学习",
    typeVocabulary: "单词记忆与复习",
    unitWord: "个单词",
    unitPage: "页",
    unitMinute: "分钟",
    unitChapter: "章",
    unitTime: "次",
    repeatNone: "不重复",
    repeatDaily: "每天",
    repeatWeekly: "每周",
    repeatDays: "重复星期",
    chooseDay: "请至少选择一个星期几。",
    saving: "保存中...",
    saveChanges: "保存修改",
    register: "＋ 添加任务",
    cancel: "取消编辑",
    yourStudyList: "你的学习清单",
    taskList: "任务列表",
    taskCount: "{count} 项任务",
    filterStatus: "按状态筛选",
    all: "全部",
    today: "今日任务",
    open: "未完成",
    done: "已完成",
    overdue: "已逾期",
    search: "搜索任务／教材",
    keyword: "请输入关键词",
    loading: "正在加载任务...",
    loginToView: "登录后即可查看已保存的任务。",
    noTasks: "没有符合条件的任务",
    noTasksDescription: "请更改筛选条件，或使用上方表单添加任务。",
    goal: "目标",
    scheduled: "计划日期",
    deadline: "截止日期",
    unset: "未设置",
    repeatLabel: "重复",
    statusNotStarted: "未开始",
    statusInProgress: "进行中",
    statusCompleted: "已完成",
    edit: "编辑",
    delete: "删除",
    loggedIn: "已登录 · 已保存到 Firestore",
    loggedOut: "未登录 · 登录后才能保存任务",
    sunday: "星期日",
    monday: "星期一",
    tuesday: "星期二",
    wednesday: "星期三",
    thursday: "星期四",
    friday: "星期五",
    saturday: "星期六",
    weekdays: ["日", "一", "二", "三", "四", "五", "六"],
    placeholderTitle: "例如：复习中文单词",
    placeholderMaterial: "例如：华文阅读测验 中级篇",
    notSet: "未设置",
  },

  "zh-TW": {
    title: "任務管理",
    description: "整理學習任務，每天穩定推進學習。",
    checkingAuth: "正在確認登入狀態...",
    loginRequired: "請登入後將任務儲存至 Firestore。登入後請重新載入此頁面。",
    firestoreError: "無法載入任務，請檢查 Firestore 規則。",
    saveLogin: "請登入後儲存任務。",
    enterTitle: "請輸入任務名稱。",
    targetError: "目標數量必須大於或等於 0。",
    startDateError: "預定日期不能早於開始日期。",
    dueDateError: "截止日期不能早於預定日期。",
    repeatDaysError: "請至少選擇一個星期幾。",
    saveError: "儲存失敗，請檢查 Firestore 規則或網路連線。",
    statusError: "無法更新任務狀態。",
    deleteError: "無法刪除任務。",
    confirmDelete: "確定要刪除「{title}」嗎？",
    createOrganize: "建立與整理",
    editTask: "編輯任務",
    newTask: "建立新任務",
    taskName: "任務名稱",
    required: "*",
    taskType: "任務類型",
    material: "教材／單字卡組名稱",
    target: "目標數量",
    unit: "單位",
    startDate: "開始日期",
    scheduledDate: "預定日期",
    dueDate: "截止日期",
    repeat: "重複",
    typeMaterial: "教材學習",
    typeVocabulary: "單字記憶與複習",
    unitWord: "個單字",
    unitPage: "頁",
    unitMinute: "分鐘",
    unitChapter: "章",
    unitTime: "次",
    repeatNone: "不重複",
    repeatDaily: "每天",
    repeatWeekly: "每週",
    repeatDays: "重複星期",
    chooseDay: "請至少選擇一個星期幾。",
    saving: "儲存中...",
    saveChanges: "儲存變更",
    register: "＋ 新增任務",
    cancel: "取消編輯",
    yourStudyList: "你的學習清單",
    taskList: "任務列表",
    taskCount: "{count} 項任務",
    filterStatus: "依狀態篩選",
    all: "全部",
    today: "今日任務",
    open: "未完成",
    done: "已完成",
    overdue: "已逾期",
    search: "搜尋任務／教材",
    keyword: "請輸入關鍵字",
    loading: "正在載入任務...",
    loginToView: "登入後即可查看已儲存的任務。",
    noTasks: "沒有符合條件的任務",
    noTasksDescription: "請更改篩選條件，或使用上方表單新增任務。",
    goal: "目標",
    scheduled: "預定日期",
    deadline: "截止日期",
    unset: "未設定",
    repeatLabel: "重複",
    statusNotStarted: "未開始",
    statusInProgress: "進行中",
    statusCompleted: "已完成",
    edit: "編輯",
    delete: "刪除",
    loggedIn: "已登入 · 已儲存至 Firestore",
    loggedOut: "未登入 · 登入後才能儲存任務",
    sunday: "星期日",
    monday: "星期一",
    tuesday: "星期二",
    wednesday: "星期三",
    thursday: "星期四",
    friday: "星期五",
    saturday: "星期六",
    weekdays: ["日", "一", "二", "三", "四", "五", "六"],
    placeholderTitle: "例如：複習中文單字",
    placeholderMaterial: "例如：華文閱讀測驗 中級篇",
    notSet: "未設定",
  },

  es: {
    title: "Gestión de tareas",
    description: "Organiza tus tareas de estudio y avanza poco a poco cada día.",
    checkingAuth: "Comprobando el estado de inicio de sesión...",
    loginRequired: "Inicia sesión para guardar tareas en Firestore. Después, vuelve a cargar esta página.",
    firestoreError: "No se pudieron cargar las tareas. Comprueba las reglas de Firestore.",
    saveLogin: "Inicia sesión para guardar las tareas.",
    enterTitle: "Introduce el nombre de la tarea.",
    targetError: "El objetivo debe ser igual o superior a 0.",
    startDateError: "La fecha programada debe ser igual o posterior a la fecha de inicio.",
    dueDateError: "La fecha límite debe ser igual o posterior a la fecha programada.",
    repeatDaysError: "Selecciona al menos un día de la semana.",
    saveError: "No se pudo guardar. Comprueba las reglas de Firestore y tu conexión.",
    statusError: "No se pudo actualizar el estado.",
    deleteError: "No se pudo eliminar la tarea.",
    confirmDelete: "¿Quieres eliminar «{title}»?",
    createOrganize: "CREAR Y ORGANIZAR",
    editTask: "Editar tarea",
    newTask: "Crear una nueva tarea",
    taskName: "Nombre de la tarea",
    required: "*",
    taskType: "Tipo de tarea",
    material: "Material / Nombre del mazo",
    target: "Objetivo",
    unit: "Unidad",
    startDate: "Fecha de inicio",
    scheduledDate: "Fecha programada",
    dueDate: "Fecha límite",
    repeat: "Repetición",
    typeMaterial: "Estudio de materiales",
    typeVocabulary: "Memorización y repaso de vocabulario",
    unitWord: "Palabras",
    unitPage: "Páginas",
    unitMinute: "Minutos",
    unitChapter: "Capítulos",
    unitTime: "Veces",
    repeatNone: "Ninguna",
    repeatDaily: "Cada día",
    repeatWeekly: "Cada semana",
    repeatDays: "Repetir los días",
    chooseDay: "Selecciona al menos un día de la semana.",
    saving: "Guardando...",
    saveChanges: "Guardar cambios",
    register: "＋ Añadir tarea",
    cancel: "Cancelar edición",
    yourStudyList: "TU LISTA DE ESTUDIO",
    taskList: "Lista de tareas",
    taskCount: "{count} tareas",
    filterStatus: "Filtrar por estado",
    all: "Todas",
    today: "Tareas de hoy",
    open: "Pendientes",
    done: "Completadas",
    overdue: "Vencidas",
    search: "Buscar tareas / materiales",
    keyword: "Introduce una palabra clave",
    loading: "Cargando tareas...",
    loginToView: "Inicia sesión para ver tus tareas guardadas.",
    noTasks: "No hay tareas que coincidan",
    noTasksDescription: "Cambia los filtros o crea una tarea con el formulario de arriba.",
    goal: "Objetivo",
    scheduled: "Fecha programada",
    deadline: "Fecha límite",
    unset: "Sin establecer",
    repeatLabel: "Repetición",
    statusNotStarted: "Sin empezar",
    statusInProgress: "En curso",
    statusCompleted: "Completada",
    edit: "Editar",
    delete: "Eliminar",
    loggedIn: "Sesión iniciada · Guardado en Firestore",
    loggedOut: "Sin iniciar sesión · Inicia sesión para guardar tareas",
    sunday: "Domingo",
    monday: "Lunes",
    tuesday: "Martes",
    wednesday: "Miércoles",
    thursday: "Jueves",
    friday: "Viernes",
    saturday: "Sábado",
    weekdays: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
    placeholderTitle: "Ej.: Repasar vocabulario chino",
    placeholderMaterial: "Ej.: Lectura china de nivel intermedio",
    notSet: "Sin establecer",
  },
};

const statusKeys: Record<TaskStatus, string> = {
  未着手: "statusNotStarted",
  進行中: "statusInProgress",
  完了: "statusCompleted",
};

const typeKeys: Record<TaskType, string> = {
  教材の学習: "typeMaterial",
  "単語の暗記・復習": "typeVocabulary",
};

const repeatKeys: Record<RepeatType, string> = {
  なし: "repeatNone",
  毎日: "repeatDaily",
  毎週: "repeatWeekly",
};

const unitKeys: Record<TaskUnit, string> = {
  単語: "unitWord",
  ページ: "unitPage",
  分: "unitMinute",
  章: "unitChapter",
  回: "unitTime",
};

const localeMap: Record<AppLanguage, string> = {
  ja: "ja-JP",
  en: "en-US",
  de: "de-DE",
  "zh-CN": "zh-CN",
  "zh-TW": "zh-TW",
  es: "es-ES",
};

export default function TasksPage() {
  const { language } = useAppLanguage();
  const tr = translations[language];

  const msg = (key: string, values?: Record<string, string | number>) => {
    const raw = tr[key];
    if (typeof raw !== "string") return key;

    return Object.entries(values ?? {}).reduce(
      (result, [name, value]) =>
        result.replaceAll(`{${name}}`, String(value)),
      raw
    );
  };

  const dayLabels = tr.weekdays as string[];

  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [dateFilter, setDateFilter] = useState("");
  const [search, setSearch] = useState("");

  const formatDate = (date: string) => {
    if (!date) return msg("unset");

    const parsed = new Date(`${date}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return date;

    return new Intl.DateTimeFormat(localeMap[language], {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(parsed);
  };

  const translatedStatus = (status: TaskStatus) =>
    msg(statusKeys[status]);

  const translatedType = (type: TaskType) =>
    msg(typeKeys[type]);

  const translatedRepeat = (repeat: RepeatType) =>
    msg(repeatKeys[repeat]);

  const translatedUnit = (unit: TaskUnit) =>
    msg(unitKeys[unit]);

  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });
  }, []);

  useEffect(() => {
    if (!authReady) return;

    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const tasksRef = collection(db, "users", user.uid, "tasks");

    const unsubscribe = onSnapshot(
      tasksRef,
      (snapshot) => {
        const loadedTasks: StudyTask[] = snapshot.docs.map((item) => {
          const data = item.data();

          return {
            id: item.id,
            title: String(data.title ?? ""),
            type: (data.type ?? "教材の学習") as TaskType,
            material: String(data.material ?? ""),
            target: Number(data.target ?? 0),
            unit: (data.unit ?? "単語") as TaskUnit,
            startDate: String(data.startDate ?? ""),
            scheduledDate: String(data.scheduledDate ?? ""),
            dueDate: String(data.dueDate ?? ""),
            status: (data.status ?? "未着手") as TaskStatus,
            repeat: (data.repeat ?? "なし") as RepeatType,
            repeatDays: Array.isArray(data.repeatDays)
              ? data.repeatDays.map(Number)
              : [],
          };
        });

        setTasks(loadedTasks);
        setLoading(false);
      },
      (err) => {
        console.error("Task loading error:", err);
        setError(msg("firestoreError"));
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [authReady, user, language]);

  const visibleTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        if (filter === "today" && task.scheduledDate !== todayString()) {
          return false;
        }

        if (filter === "open" && task.status === "完了") return false;
        if (filter === "done" && task.status !== "完了") return false;

        if (
          filter === "overdue" &&
          (!task.dueDate ||
            task.dueDate >= todayString() ||
            task.status === "完了")
        ) {
          return false;
        }

        if (dateFilter && task.scheduledDate !== dateFilter) return false;

        const term = search.trim().toLowerCase();

        if (
          term &&
          !task.title.toLowerCase().includes(term) &&
          !task.material.toLowerCase().includes(term)
        ) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const dateA = a.dueDate || "9999-12-31";
        const dateB = b.dueDate || "9999-12-31";
        return dateA.localeCompare(dateB);
      });
  }, [tasks, filter, dateFilter, search]);

  const resetForm = () => {
    setForm(emptyForm());
    setEditingId(null);
  };

  const saveTask = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      setError(msg("saveLogin"));
      return;
    }

    if (!form.title.trim()) {
      setError(msg("enterTitle"));
      return;
    }

    if (form.target < 0) {
      setError(msg("targetError"));
      return;
    }

    if (
      form.startDate &&
      form.scheduledDate &&
      form.scheduledDate < form.startDate
    ) {
      setError(msg("startDateError"));
      return;
    }

    if (
      form.scheduledDate &&
      form.dueDate &&
      form.dueDate < form.scheduledDate
    ) {
      setError(msg("dueDateError"));
      return;
    }

    if (form.repeat === "毎週" && form.repeatDays.length === 0) {
      setError(msg("repeatDaysError"));
      return;
    }

    setSaving(true);
    setError("");

    const taskData = {
      title: form.title.trim(),
      type: form.type,
      material: form.material.trim(),
      target: Number(form.target),
      unit: form.unit,
      startDate: form.startDate,
      scheduledDate: form.scheduledDate,
      dueDate: form.dueDate,
      repeat: form.repeat,
      repeatDays: form.repeat === "毎週" ? form.repeatDays : [],
      updatedAt: serverTimestamp(),
    };

    try {
      const tasksRef = collection(db, "users", user.uid, "tasks");

      if (editingId) {
        await updateDoc(doc(tasksRef, editingId), taskData);
      } else {
        await addDoc(tasksRef, {
          ...taskData,
          status: "未着手",
          createdAt: serverTimestamp(),
        });
      }

      resetForm();
    } catch (err) {
      console.error("Task save error:", err);
      setError(msg("saveError"));
    } finally {
      setSaving(false);
    }
  };

  const editTask = (task: StudyTask) => {
    setEditingId(task.id);

    setForm({
      title: task.title,
      type: task.type,
      material: task.material,
      target: task.target,
      unit: task.unit,
      startDate: task.startDate || todayString(),
      scheduledDate: task.scheduledDate || todayString(),
      dueDate: task.dueDate || task.scheduledDate || todayString(),
      repeat: task.repeat,
      repeatDays: task.repeatDays,
    });

    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const changeStatus = async (task: StudyTask, status: TaskStatus) => {
    if (!user) return;

    try {
      await updateDoc(doc(db, "users", user.uid, "tasks", task.id), {
        status,
        updatedAt: serverTimestamp(),
      });
      setError("");
    } catch (err) {
      console.error("Status update error:", err);
      setError(msg("statusError"));
    }
  };

  const removeTask = async (task: StudyTask) => {
    if (!user) return;

    const confirmation = msg("confirmDelete", { title: task.title });
    if (!window.confirm(confirmation)) return;

    try {
      await deleteDoc(doc(db, "users", user.uid, "tasks", task.id));

      if (editingId === task.id) resetForm();

      setError("");
    } catch (err) {
      console.error("Task deletion error:", err);
      setError(msg("deleteError"));
    }
  };

  const toggleDay = (day: number) => {
    setForm((current) => ({
      ...current,
      repeatDays: current.repeatDays.includes(day)
        ? current.repeatDays.filter((item) => item !== day)
        : [...current.repeatDays, day].sort((a, b) => a - b),
    }));
  };

  const pageStyle: React.CSSProperties = {
    maxWidth: 1000,
    margin: "0 auto",
    padding: "36px 24px 48px",
    color: "#332d25",
    minHeight: "100vh",
    boxSizing: "border-box",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    padding: 10,
    border: "1px solid #e5e9e5",
    borderRadius: 10,
    background: "#fffdf9",
    color: "#332d25",
    fontSize: 14,
    marginTop: 6,
    accentColor: "var(--anki-theme-color)",
  };

  const buttonStyle: React.CSSProperties = {
    padding: "9px 14px",
    border: "1px solid var(--anki-theme-soft)",
    borderRadius: 10,
    background: "var(--anki-theme-light)",
    color: "var(--anki-theme-dark)",
    cursor: "pointer",
    fontSize: 13,
    transition: "background 0.2s ease",
  };

  const sectionStyle: React.CSSProperties = {
    border: "1px solid #eee8df",
    borderRadius: 18,
    padding: 22,
    marginBottom: 24,
    background: "#fffdf9",
    boxShadow: "0 4px 20px rgba(55, 43, 29, 0.025)",
  };

  const eyebrowStyle: React.CSSProperties = {
    color: "var(--anki-theme-dark)",
    fontSize: 10,
    letterSpacing: 2,
    margin: "0 0 7px",
    fontWeight: 600,
  };

  const primaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    padding: "11px 20px",
    background: "var(--anki-theme-color)",
    color: "#ffffff",
    borderColor: "var(--anki-theme-color)",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 500,
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
  };

  const statusOptions: TaskStatus[] = ["未着手", "進行中", "完了"];

  return (
    <main style={pageStyle}>
      <header style={{ marginBottom: 28, paddingTop: 12 }}>
        <p style={{ ...eyebrowStyle, fontSize: 11 }}>ANKI / STUDY</p>

        <h1
          style={{
            fontSize: 30,
            fontWeight: 650,
            letterSpacing: -1.2,
            margin: "0 0 9px",
            color: "#332d25",
          }}
        >
          {msg("title")}
        </h1>

        <p
          style={{
            color: "#8b8175",
            fontSize: 14,
            lineHeight: 1.8,
            margin: 0,
          }}
        >
          {msg("description")}
        </p>
      </header>

      {!authReady && (
        <p style={{ color: "#8b8175" }}>{msg("checkingAuth")}</p>
      )}

      {authReady && !user && (
        <section
          style={{
            padding: 16,
            borderRadius: 14,
            background: "#fff4df",
            marginBottom: 20,
            fontSize: 14,
          }}
        >
          {msg("loginRequired")}
        </section>
      )}

      {error && (
        <p
          role="alert"
          style={{
            padding: 14,
            background: "#fff0ed",
            color: "#9b3025",
            borderRadius: 12,
            fontSize: 14,
          }}
        >
          {error}
        </p>
      )}

      <section style={sectionStyle}>
        <div style={{ marginBottom: 22 }}>
          <p style={eyebrowStyle}>{msg("createOrganize")}</p>

          <h2 style={{ fontSize: 20, letterSpacing: -0.5, margin: 0 }}>
            {editingId ? msg("editTask") : msg("newTask")}
          </h2>
        </div>

        <form onSubmit={saveTask}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
            }}
          >
            <label style={labelStyle}>
              {msg("taskName")} {msg("required")}
              <input
                style={inputStyle}
                value={form.title}
                onChange={(e) =>
                  setForm({ ...form, title: e.target.value })
                }
                placeholder={msg("placeholderTitle")}
                required
              />
            </label>

            <label style={labelStyle}>
              {msg("taskType")}
              <select
                style={selectStyle}
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value as TaskType })
                }
              >
                <option value="教材の学習">{msg("typeMaterial")}</option>
                <option value="単語の暗記・復習">
                  {msg("typeVocabulary")}
                </option>
              </select>
            </label>

            <label style={labelStyle}>
              {msg("material")}
              <input
                style={inputStyle}
                value={form.material}
                onChange={(e) =>
                  setForm({ ...form, material: e.target.value })
                }
                placeholder={msg("placeholderMaterial")}
              />
            </label>

            <label style={labelStyle}>
              {msg("target")}
              <input
                style={inputStyle}
                type="number"
                min="0"
                value={form.target}
                onChange={(e) =>
                  setForm({ ...form, target: Number(e.target.value) })
                }
              />
            </label>

            <label style={labelStyle}>
              {msg("unit")}
              <select
                style={selectStyle}
                value={form.unit}
                onChange={(e) =>
                  setForm({
                    ...form,
                    unit: e.target.value as TaskUnit,
                  })
                }
              >
                <option value="単語">{msg("unitWord")}</option>
                <option value="ページ">{msg("unitPage")}</option>
                <option value="分">{msg("unitMinute")}</option>
                <option value="章">{msg("unitChapter")}</option>
                <option value="回">{msg("unitTime")}</option>
              </select>
            </label>

            <label style={labelStyle}>
              {msg("startDate")}
              <input
                style={inputStyle}
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value })
                }
                required
              />
            </label>

            <label style={labelStyle}>
              {msg("scheduledDate")}
              <input
                style={inputStyle}
                type="date"
                value={form.scheduledDate}
                onChange={(e) =>
                  setForm({ ...form, scheduledDate: e.target.value })
                }
                required
              />
            </label>

            <label style={labelStyle}>
              {msg("dueDate")}
              <input
                style={inputStyle}
                type="date"
                value={form.dueDate}
                onChange={(e) =>
                  setForm({ ...form, dueDate: e.target.value })
                }
                required
              />
            </label>

            <label style={labelStyle}>
              {msg("repeat")}
              <select
                style={selectStyle}
                value={form.repeat}
                onChange={(e) =>
                  setForm({
                    ...form,
                    repeat: e.target.value as RepeatType,
                  })
                }
              >
                <option value="なし">{msg("repeatNone")}</option>
                <option value="毎日">{msg("repeatDaily")}</option>
                <option value="毎週">{msg("repeatWeekly")}</option>
              </select>
            </label>
          </div>

          {form.repeat === "毎週" && (
            <fieldset
              style={{
                marginTop: 20,
                padding: 14,
                border: "1px solid var(--anki-theme-soft)",
                borderRadius: 12,
              }}
            >
              <legend style={{ fontSize: 13, padding: "0 6px" }}>
                {msg("repeatDays")}
              </legend>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
                {weekdays.map((day) => (
                  <label
                    key={day}
                    style={{
                      fontSize: 13,
                      cursor: "pointer",
                      accentColor: "var(--anki-theme-color)",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={form.repeatDays.includes(day)}
                      onChange={() => toggleDay(day)}
                    />{" "}
                    {dayLabels[day]}
                  </label>
                ))}
              </div>

              {form.repeatDays.length === 0 && (
                <p
                  style={{
                    color: "#9b3025",
                    fontSize: 12,
                    marginBottom: 0,
                  }}
                >
                  {msg("chooseDay")}
                </p>
              )}
            </fieldset>
          )}

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              marginTop: 22,
            }}
          >
            <button
              type="submit"
              disabled={
                !user ||
                saving ||
                (form.repeat === "毎週" && form.repeatDays.length === 0)
              }
              style={{
                ...primaryButtonStyle,
                opacity: !user || saving ? 0.6 : 1,
              }}
            >
              {saving
                ? msg("saving")
                : editingId
                  ? msg("saveChanges")
                  : msg("register")}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                style={buttonStyle}
              >
                {msg("cancel")}
              </button>
            )}
          </div>
        </form>
      </section>

      <section>
        <div style={{ marginBottom: 20 }}>
          <p style={eyebrowStyle}>{msg("yourStudyList")}</p>

          <h2
            style={{
              fontSize: 22,
              letterSpacing: -0.7,
              margin: "0 0 6px",
            }}
          >
            {msg("taskList")}
          </h2>

          <p style={{ fontSize: 13, color: "#8b8175", margin: 0 }}>
            {msg("taskCount", { count: visibleTasks.length })}
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <label style={labelStyle}>
            {msg("filterStatus")}
            <select
              style={selectStyle}
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterType)}
            >
              <option value="all">{msg("all")}</option>
              <option value="today">{msg("today")}</option>
              <option value="open">{msg("open")}</option>
              <option value="done">{msg("done")}</option>
              <option value="overdue">{msg("overdue")}</option>
            </select>
          </label>

          <label style={labelStyle}>
            {msg("scheduledDate")}
            <input
              style={inputStyle}
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </label>

          <label style={labelStyle}>
            {msg("search")}
            <input
              style={inputStyle}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={msg("keyword")}
            />
          </label>
        </div>

        {loading ? (
          <p style={{ color: "#8b8175" }}>{msg("loading")}</p>
        ) : !user ? (
          <p style={{ color: "#8b8175" }}>{msg("loginToView")}</p>
        ) : visibleTasks.length === 0 ? (
          <div
            style={{
              padding: "40px 20px",
              textAlign: "center",
              background: "var(--anki-theme-light)",
              borderRadius: 16,
              border: "1px solid var(--anki-theme-soft)",
            }}
          >
            <p
              style={{
                fontSize: 26,
                margin: "0 0 10px",
                color: "var(--anki-theme-dark)",
              }}
            >
              ✳
            </p>

            <p
              style={{
                fontSize: 14,
                color: "var(--anki-theme-dark)",
                margin: "0 0 6px",
              }}
            >
              {msg("noTasks")}
            </p>

            <p style={{ fontSize: 12, color: "#8b8175", margin: 0 }}>
              {msg("noTasksDescription")}
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {visibleTasks.map((task) => (
              <article
                key={task.id}
                style={{
                  border: "1px solid #eee8df",
                  borderRadius: 16,
                  padding: 18,
                  background: "#fffdf9",
                  opacity: task.status === "完了" ? 0.72 : 1,
                  boxShadow: "0 3px 14px rgba(55, 43, 29, 0.025)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 16,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ flex: "1 1 220px" }}>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={task.status === "完了"}
                        onChange={(e) =>
                          changeStatus(
                            task,
                            e.target.checked ? "完了" : "未着手"
                          )
                        }
                        style={{
                          marginTop: 4,
                          accentColor: "var(--anki-theme-color)",
                        }}
                      />

                      <strong
                        style={{
                          fontSize: 16,
                          lineHeight: 1.6,
                          fontWeight: 600,
                          textDecoration:
                            task.status === "完了"
                              ? "line-through"
                              : "none",
                        }}
                      >
                        {task.title}
                      </strong>
                    </label>

                    <p
                      style={{
                        color: "#71685d",
                        fontSize: 13,
                        lineHeight: 1.8,
                        margin: "9px 0",
                      }}
                    >
                      {translatedType(task.type)}
                      {task.material ? ` ・ ${task.material}` : ""}
                      {` ・ ${msg("goal")} ${task.target}${translatedUnit(task.unit)}`}
                    </p>

                    <p
                      style={{
                        fontSize: 12,
                        color: "#8b8175",
                        margin: "6px 0",
                      }}
                    >
                      {msg("scheduled")}：{formatDate(task.scheduledDate)}
                      {" ・ "}
                      {msg("deadline")}：{formatDate(task.dueDate)}
                    </p>

                    <p
                      style={{
                        fontSize: 12,
                        color: "#8b8175",
                        margin: "6px 0 0",
                      }}
                    >
                      {msg("repeatLabel")}：{translatedRepeat(task.repeat)}
                      {task.repeat === "毎週" && task.repeatDays.length > 0
                        ? `（${task.repeatDays.map((d) => dayLabels[d]).join("・")}）`
                        : ""}
                    </p>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <select
                      aria-label={`${task.title} - ${msg("filterStatus")}`}
                      style={{
                        ...inputStyle,
                        width: 140,
                        marginTop: 0,
                      }}
                      value={task.status}
                      onChange={(e) =>
                        changeStatus(task, e.target.value as TaskStatus)
                      }
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {translatedStatus(status)}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => editTask(task)}
                      style={buttonStyle}
                    >
                      {msg("edit")}
                    </button>

                    <button
                      type="button"
                      onClick={() => removeTask(task)}
                      style={{
                        ...buttonStyle,
                        color: "#9b5145",
                        background: "#fff9f7",
                      }}
                    >
                      {msg("delete")}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer
        style={{
          marginTop: 36,
          paddingTop: 20,
          borderTop: "1px solid #eee8df",
          textAlign: "center",
          color: "#9b9081",
          fontSize: 12,
        }}
      >
        {user ? msg("loggedIn") : msg("loggedOut")}
      </footer>
    </main>
  );
}
