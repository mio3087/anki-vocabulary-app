
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAppLanguage } from "@/app/component/AppLanguage";

type PlanStatus = "pending" | "completed" | "postponed";

type Plan = {
  id: string;
  deckName: string;
  totalItems: number;
  startDate: string;
  deadline: string;
  rounds: number;
  weekdays: number[];
  createdAt: string;
  status?: PlanStatus;
};

const STORAGE_KEY = "anki-study-plans-v1";

const weekdayLabels: Record<string, string[]> = {
  ja: ["月", "火", "水", "木", "金", "土", "日"],
  de: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"],
  en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  "zh-CN": ["一", "二", "三", "四", "五", "六", "日"],
  "zh-TW": ["一", "二", "三", "四", "五", "六", "日"],
  es: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
};

const translations = {
  ja: {
    eyebrow: "Your Anki · Planning",
    title: "学習計画",
    subtitle: "ゴールから逆算して、毎日の学習量を決める。",
    today: "今日のノルマ",
    registered: "登録計画",
    completed: "完了",
    unfinished: "未完了・延期",
    newPlan: "New plan",
    createPlan: "計画を作成",
    createDescription: "学習日数と1日あたりの目標量を自動計算します。",
    materialName: "教材名",
    materialPlaceholder: "例：ドイツ語 C1 単語",
    totalItems: "教材の総量",
    totalHint: "単語・ページなど",
    rounds: "周回数",
    startDate: "開始日",
    deadline: "期限",
    weekdays: "学習する曜日",
    addPlan: "＋ 学習計画を追加",
    overview: "Overview",
    savedPlans: "登録済みの計画",
    searchPlaceholder: "教材名で検索...",
    noResults: "該当する計画がありません",
    noPlans: "まだ計画がありません",
    noPlansDescription: "左側のフォームから最初の計画を作成しましょう。",
    pending: "未完了",
    postponed: "延期",
    inProgress: "計画期間中",
    overdue: "期限超過",
    beforeStart: "開始前",
    roundUnit: "周",
    totalLabel: "教材の総量",
    studyDays: "学習日数",
    dayUnit: "日",
    perDay: "1日あたり",
    studyWeekdays: "学習曜日：",
    daysUntil: "期限まで {days} 日",
    daysPassed: "{days} 日経過",
    planStatus: "計画のステータス",
    delete: "削除",
    postpone: "延期 →",
    footerTasks: "タスク管理",
    footerCalendar: "学習カレンダー",
    enterName: "教材名を入力してください。",
    invalidTotal: "教材の総量は1以上で入力してください。",
    invalidRounds: "周回数は1以上で入力してください。",
    invalidDeadline: "期限は開始日以降の日付にしてください。",
    selectWeekday: "学習する曜日を1つ以上選んでください。",
    deleteConfirm: "この学習計画を削除しますか？",
    postponePrompt: "「{name}」の新しい期限を入力してください（YYYY-MM-DD）",
    invalidDateFormat: "日付は YYYY-MM-DD の形式で入力してください。",
    invalidDate: "正しい日付を入力してください。",
    deadlineMustBeLater: "延期する場合は、現在の期限より後の日付を指定してください。",
    itemCount: "件",
  },
  de: {
    eyebrow: "Your Anki · Planning",
    title: "Lernplanung",
    subtitle: "Plane dein tägliches Lernpensum rückwärts von deinem Ziel aus.",
    today: "Heutiges Lernziel",
    registered: "Pläne",
    completed: "Abgeschlossen",
    unfinished: "Offen · Verschoben",
    newPlan: "Neuer Plan",
    createPlan: "Plan erstellen",
    createDescription: "Die Lerntage und das tägliche Lernziel werden automatisch berechnet.",
    materialName: "Lernmaterial",
    materialPlaceholder: "z. B. Deutsch C1 Wortschatz",
    totalItems: "Gesamtumfang",
    totalHint: "Wörter, Seiten usw.",
    rounds: "Durchgänge",
    startDate: "Startdatum",
    deadline: "Frist",
    weekdays: "Lerntage",
    addPlan: "＋ Lernplan hinzufügen",
    overview: "Übersicht",
    savedPlans: "Gespeicherte Pläne",
    searchPlaceholder: "Nach Lernmaterial suchen...",
    noResults: "Keine passenden Pläne gefunden",
    noPlans: "Noch keine Lernpläne",
    noPlansDescription: "Erstelle deinen ersten Plan mit dem Formular links.",
    pending: "Offen",
    postponed: "Verschoben",
    inProgress: "Aktiver Zeitraum",
    overdue: "Frist überschritten",
    beforeStart: "Noch nicht begonnen",
    roundUnit: "Durchgänge",
    totalLabel: "Gesamtumfang",
    studyDays: "Lerntage",
    dayUnit: "Tage",
    perDay: "Pro Tag",
    studyWeekdays: "Lerntage:",
    daysUntil: "Noch {days} Tage",
    daysPassed: "{days} Tage vergangen",
    planStatus: "Planstatus",
    delete: "Löschen",
    postpone: "Verschieben →",
    footerTasks: "Aufgaben",
    footerCalendar: "Lernkalender",
    enterName: "Bitte gib den Namen des Lernmaterials ein.",
    invalidTotal: "Der Gesamtumfang muss mindestens 1 betragen.",
    invalidRounds: "Die Anzahl der Durchgänge muss mindestens 1 betragen.",
    invalidDeadline: "Die Frist muss am oder nach dem Startdatum liegen.",
    selectWeekday: "Bitte wähle mindestens einen Lerntag aus.",
    deleteConfirm: "Möchtest du diesen Lernplan löschen?",
    postponePrompt: "Gib eine neue Frist für „{name}“ ein (YYYY-MM-DD).",
    invalidDateFormat: "Bitte verwende das Datumsformat YYYY-MM-DD.",
    invalidDate: "Bitte gib ein gültiges Datum ein.",
    deadlineMustBeLater: "Die neue Frist muss nach der bisherigen Frist liegen.",
    itemCount: "Pläne",
  },
  en: {
    eyebrow: "Your Anki · Planning",
    title: "Study Plans",
    subtitle: "Set your daily study target by working backward from your goal.",
    today: "Today's Goals",
    registered: "Plans",
    completed: "Completed",
    unfinished: "Pending · Postponed",
    newPlan: "New Plan",
    createPlan: "Create a Plan",
    createDescription: "Study days and daily targets are calculated automatically.",
    materialName: "Study Material",
    materialPlaceholder: "e.g. German C1 Vocabulary",
    totalItems: "Total Amount",
    totalHint: "Words, pages, etc.",
    rounds: "Rounds",
    startDate: "Start Date",
    deadline: "Deadline",
    weekdays: "Study Days",
    addPlan: "＋ Add Study Plan",
    overview: "Overview",
    savedPlans: "Saved Plans",
    searchPlaceholder: "Search by material name...",
    noResults: "No matching plans found",
    noPlans: "No study plans yet",
    noPlansDescription: "Create your first plan using the form on the left.",
    pending: "Pending",
    postponed: "Postponed",
    inProgress: "In progress",
    overdue: "Overdue",
    beforeStart: "Not started",
    roundUnit: "rounds",
    totalLabel: "Total Amount",
    studyDays: "Study Days",
    dayUnit: "days",
    perDay: "Per Day",
    studyWeekdays: "Study days:",
    daysUntil: "{days} days remaining",
    daysPassed: "{days} days overdue",
    planStatus: "Plan Status",
    delete: "Delete",
    postpone: "Postpone →",
    footerTasks: "Tasks",
    footerCalendar: "Study Calendar",
    enterName: "Please enter a study material name.",
    invalidTotal: "The total amount must be at least 1.",
    invalidRounds: "The number of rounds must be at least 1.",
    invalidDeadline: "The deadline must be on or after the start date.",
    selectWeekday: "Please select at least one study day.",
    deleteConfirm: "Delete this study plan?",
    postponePrompt: "Enter a new deadline for “{name}” (YYYY-MM-DD).",
    invalidDateFormat: "Please use the YYYY-MM-DD date format.",
    invalidDate: "Please enter a valid date.",
    deadlineMustBeLater: "The new deadline must be later than the current deadline.",
    itemCount: "plans",
  },
  "zh-CN": {
    eyebrow: "Your Anki · Planning",
    title: "学习计划",
    subtitle: "从目标倒推，合理安排每天的学习量。",
    today: "今日目标",
    registered: "计划数",
    completed: "已完成",
    unfinished: "未完成・已延期",
    newPlan: "新计划",
    createPlan: "创建计划",
    createDescription: "自动计算学习天数和每天的目标学习量。",
    materialName: "学习资料名称",
    materialPlaceholder: "例如：德语 C1 单词",
    totalItems: "资料总量",
    totalHint: "单词、页数等",
    rounds: "复习轮数",
    startDate: "开始日期",
    deadline: "截止日期",
    weekdays: "学习日",
    addPlan: "＋ 添加学习计划",
    overview: "总览",
    savedPlans: "已创建的计划",
    searchPlaceholder: "按资料名称搜索...",
    noResults: "没有找到符合条件的计划",
    noPlans: "还没有学习计划",
    noPlansDescription: "请使用左侧表单创建第一个计划。",
    pending: "未完成",
    postponed: "已延期",
    inProgress: "计划进行中",
    overdue: "已超过期限",
    beforeStart: "尚未开始",
    roundUnit: "轮",
    totalLabel: "资料总量",
    studyDays: "学习天数",
    dayUnit: "天",
    perDay: "每天目标",
    studyWeekdays: "学习日：",
    daysUntil: "距离截止还有 {days} 天",
    daysPassed: "已超过 {days} 天",
    planStatus: "计划状态",
    delete: "删除",
    postpone: "延期 →",
    footerTasks: "任务管理",
    footerCalendar: "学习日历",
    enterName: "请输入学习资料名称。",
    invalidTotal: "资料总量必须大于或等于1。",
    invalidRounds: "复习轮数必须大于或等于1。",
    invalidDeadline: "截止日期必须在开始日期当天或之后。",
    selectWeekday: "请至少选择一个学习日。",
    deleteConfirm: "确定要删除这个学习计划吗？",
    postponePrompt: "请输入「{name}」的新截止日期（YYYY-MM-DD）。",
    invalidDateFormat: "日期格式应为 YYYY-MM-DD。",
    invalidDate: "请输入有效日期。",
    deadlineMustBeLater: "延期后的日期必须晚于当前截止日期。",
    itemCount: "个计划",
  },
  "zh-TW": {
    eyebrow: "Your Anki · Planning",
    title: "學習計畫",
    subtitle: "從目標倒推，合理安排每天的學習量。",
    today: "今日目標",
    registered: "計畫數",
    completed: "已完成",
    unfinished: "未完成・已延期",
    newPlan: "新計畫",
    createPlan: "建立計畫",
    createDescription: "自動計算學習天數和每天的目標學習量。",
    materialName: "教材名稱",
    materialPlaceholder: "例如：德語 C1 單字",
    totalItems: "教材總量",
    totalHint: "單字、頁數等",
    rounds: "複習輪數",
    startDate: "開始日期",
    deadline: "截止日期",
    weekdays: "學習日",
    addPlan: "＋ 新增學習計畫",
    overview: "總覽",
    savedPlans: "已建立的計畫",
    searchPlaceholder: "依教材名稱搜尋...",
    noResults: "找不到符合條件的計畫",
    noPlans: "目前還沒有學習計畫",
    noPlansDescription: "請使用左側表單建立第一個計畫。",
    pending: "未完成",
    postponed: "已延期",
    inProgress: "計畫進行中",
    overdue: "已超過期限",
    beforeStart: "尚未開始",
    roundUnit: "輪",
    totalLabel: "教材總量",
    studyDays: "學習天數",
    dayUnit: "天",
    perDay: "每天目標",
    studyWeekdays: "學習日：",
    daysUntil: "距離截止還有 {days} 天",
    daysPassed: "已超過 {days} 天",
    planStatus: "計畫狀態",
    delete: "刪除",
    postpone: "延期 →",
    footerTasks: "任務管理",
    footerCalendar: "學習行事曆",
    enterName: "請輸入教材名稱。",
    invalidTotal: "教材總量必須大於或等於 1。",
    invalidRounds: "複習輪數必須大於或等於 1。",
    invalidDeadline: "截止日期必須在開始日期當天或之後。",
    selectWeekday: "請至少選擇一個學習日。",
    deleteConfirm: "確定要刪除這個學習計畫嗎？",
    postponePrompt: "請輸入「{name}」的新截止日期（YYYY-MM-DD）。",
    invalidDateFormat: "日期格式應為 YYYY-MM-DD。",
    invalidDate: "請輸入有效日期。",
    deadlineMustBeLater: "延期後的日期必須晚於目前的截止日期。",
    itemCount: "個計畫",
  },
  es: {
    eyebrow: "Your Anki · Planning",
    title: "Planes de estudio",
    subtitle: "Calcula tu objetivo diario a partir de tu meta final.",
    today: "Objetivos de hoy",
    registered: "Planes",
    completed: "Completados",
    unfinished: "Pendientes · Pospuestos",
    newPlan: "Nuevo plan",
    createPlan: "Crear un plan",
    createDescription: "Los días de estudio y el objetivo diario se calculan automáticamente.",
    materialName: "Material de estudio",
    materialPlaceholder: "Ej.: Vocabulario de alemán C1",
    totalItems: "Cantidad total",
    totalHint: "Palabras, páginas, etc.",
    rounds: "Repeticiones",
    startDate: "Fecha de inicio",
    deadline: "Fecha límite",
    weekdays: "Días de estudio",
    addPlan: "＋ Añadir plan de estudio",
    overview: "Resumen",
    savedPlans: "Planes guardados",
    searchPlaceholder: "Buscar por nombre del material...",
    noResults: "No se encontraron planes",
    noPlans: "Todavía no hay planes",
    noPlansDescription: "Crea tu primer plan con el formulario de la izquierda.",
    pending: "Pendiente",
    postponed: "Pospuesto",
    inProgress: "En curso",
    overdue: "Plazo vencido",
    beforeStart: "Aún no ha comenzado",
    roundUnit: "vueltas",
    totalLabel: "Cantidad total",
    studyDays: "Días de estudio",
    dayUnit: "días",
    perDay: "Por día",
    studyWeekdays: "Días de estudio:",
    daysUntil: "Quedan {days} días",
    daysPassed: "Han pasado {days} días",
    planStatus: "Estado del plan",
    delete: "Eliminar",
    postpone: "Posponer →",
    footerTasks: "Tareas",
    footerCalendar: "Calendario de estudio",
    enterName: "Introduce el nombre del material.",
    invalidTotal: "La cantidad total debe ser al menos 1.",
    invalidRounds: "El número de repeticiones debe ser al menos 1.",
    invalidDeadline: "La fecha límite debe ser igual o posterior a la fecha de inicio.",
    selectWeekday: "Selecciona al menos un día de estudio.",
    deleteConfirm: "¿Quieres eliminar este plan de estudio?",
    postponePrompt: "Introduce una nueva fecha límite para «{name}» (YYYY-MM-DD).",
    invalidDateFormat: "Usa el formato de fecha YYYY-MM-DD.",
    invalidDate: "Introduce una fecha válida.",
    deadlineMustBeLater: "La nueva fecha límite debe ser posterior a la actual.",
    itemCount: "planes",
  },
};

function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
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
    const day = (date.getDay() + 6) % 7;
    if (weekdays.includes(day)) count++;
  }

  return count;
}

function dailyTarget(plan: Plan) {
  const days = countStudyDays(plan.startDate, plan.deadline, plan.weekdays);
  if (!days) return 0;
  return Math.ceil((plan.totalItems * plan.rounds) / days);
}

function remainingDays(deadline: string) {
  if (!deadline) return 0;
  const end = new Date(`${deadline}T00:00:00`);
  const today = new Date(`${todayString()}T00:00:00`);
  return Math.ceil((end.getTime() - today.getTime()) / 86400000);
}

function statusLabel(status: PlanStatus | undefined, t: (key: keyof typeof translations.ja) => string) {
  if (status === "completed") return t("completed");
  if (status === "postponed") return t("postponed");
  return t("pending");
}

export default function StudyPlanPage() {
  const { language } = useAppLanguage();
  const currentLanguage = translations[language] ? language : "ja";
  const t = (key: keyof typeof translations.ja) =>
    translations[currentLanguage][key];

  const [plans, setPlans] = useState<Plan[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [deckName, setDeckName] = useState("");
  const [totalItems, setTotalItems] = useState("100");
  const [startDate, setStartDate] = useState(todayString());
  const [deadline, setDeadline] = useState("");
  const [rounds, setRounds] = useState("1");
  const [weekdays, setWeekdays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: Plan[] = JSON.parse(saved);
        setPlans(
          parsed.map((plan) => ({
            ...plan,
            status: plan.status ?? "pending",
          }))
        );
      }
    } catch (error) {
      console.error("Failed to load study plans", error);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
    } catch (error) {
      console.error("Failed to save study plans", error);
    }
  }, [plans, loaded]);

  const filteredPlans = useMemo(
    () =>
      plans
        .filter((plan) =>
          plan.deckName.toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => a.deadline.localeCompare(b.deadline)),
    [plans, search]
  );

  const completedCount = plans.filter(
    (plan) => plan.status === "completed"
  ).length;

  function toggleWeekday(day: number) {
    setWeekdays((current) =>
      current.includes(day)
        ? current.filter((d) => d !== day)
        : [...current, day].sort((a, b) => a - b)
    );
  }

  function addPlan(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const total = Number(totalItems);
    const roundCount = Number(rounds);

    if (!deckName.trim()) {
      alert(t("enterName"));
      return;
    }
    if (!Number.isFinite(total) || total <= 0) {
      alert(t("invalidTotal"));
      return;
    }
    if (!Number.isFinite(roundCount) || roundCount <= 0) {
      alert(t("invalidRounds"));
      return;
    }
    if (!deadline || deadline < startDate) {
      alert(t("invalidDeadline"));
      return;
    }
    if (weekdays.length === 0) {
      alert(t("selectWeekday"));
      return;
    }

    const newPlan: Plan = {
      id: crypto.randomUUID(),
      deckName: deckName.trim(),
      totalItems: total,
      startDate,
      deadline,
      rounds: roundCount,
      weekdays,
      createdAt: new Date().toISOString(),
      status: "pending",
    };

    setPlans((current) => [newPlan, ...current]);
    setDeckName("");
    setTotalItems("100");
    setRounds("1");
  }

  function updateStatus(id: string, status: PlanStatus) {
    setPlans((current) =>
      current.map((plan) =>
        plan.id === id ? { ...plan, status } : plan
      )
    );
  }

  function postponePlan(plan: Plan) {
    const newDeadline = window.prompt(
      t("postponePrompt").replace("{name}", plan.deckName),
      plan.deadline
    );

    if (newDeadline === null) return;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(newDeadline)) {
      alert(t("invalidDateFormat"));
      return;
    }

    const parsedDate = new Date(`${newDeadline}T12:00:00`);
    if (
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== newDeadline
    ) {
      alert(t("invalidDate"));
      return;
    }

    if (newDeadline <= plan.deadline) {
      alert(t("deadlineMustBeLater"));
      return;
    }

    setPlans((current) =>
      current.map((item) =>
        item.id === plan.id
          ? { ...item, deadline: newDeadline, status: "postponed" }
          : item
      )
    );
  }

  function deletePlan(id: string) {
    if (!window.confirm(t("deleteConfirm"))) return;
    setPlans((current) => current.filter((plan) => plan.id !== id));
  }

  const today = todayString();
  const daysOfWeek = weekdayLabels[currentLanguage];

  const inputClass =
    "w-full rounded-xl border border-[#e1e5dc] bg-[#fbfcfa] px-4 py-3 outline-none focus:border-[var(--anki-theme-color)] focus:ring-2 focus:ring-[var(--anki-theme-light)]";

  const secondaryButtonClass =
    "rounded-xl border border-[var(--anki-theme-soft)] bg-[var(--anki-theme-light)] px-4 py-3 text-sm text-[var(--anki-theme-dark)] transition hover:bg-[var(--anki-theme-soft)]";

  return (
    <main className="min-h-screen bg-[#f6f7f4] text-[#20251f]">
      <div className="mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-12">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--anki-theme-dark)]">
              {t("eyebrow")}
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              {t("title")}
            </h1>
            <p className="mt-2 text-sm text-[#7c8278]">
              {t("subtitle")}
            </p>
          </div>
          <Link href="/today" className={secondaryButtonClass}>
            {t("today")} →
          </Link>
        </header>

        <div className="mb-8 grid grid-cols-3 border-y border-[#dfe3da] py-5">
          <div>
            <p className="text-xs text-[#858b81]">{t("registered")}</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">
              {plans.length}
            </p>
          </div>
          <div className="border-l border-[#dfe3da] pl-4">
            <p className="text-xs text-[#858b81]">{t("completed")}</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-[var(--anki-theme-dark)]">
              {completedCount}
            </p>
          </div>
          <div className="border-l border-[#dfe3da] pl-4">
            <p className="text-xs text-[#858b81]">{t("unfinished")}</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">
              {plans.length - completedCount}
            </p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <section className="h-fit rounded-3xl border border-[#e5e8e0] bg-white p-6 md:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--anki-theme-dark)]">
              {t("newPlan")}
            </p>
            <h2 className="mt-2 text-xl font-semibold">{t("createPlan")}</h2>
            <p className="mt-2 text-sm leading-6 text-[#858b81]">
              {t("createDescription")}
            </p>

            <form onSubmit={addPlan} className="mt-6 space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-medium">
                  {t("materialName")}
                </span>
                <input
                  value={deckName}
                  onChange={(e) => setDeckName(e.target.value)}
                  placeholder={t("materialPlaceholder")}
                  className={inputClass}
                  required
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium">
                    {t("totalItems")}
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={totalItems}
                    onChange={(e) => setTotalItems(e.target.value)}
                    className={inputClass}
                    required
                  />
                  <span className="mt-1 block text-xs text-[#92978f]">
                    {t("totalHint")}
                  </span>
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium">
                    {t("rounds")}
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={rounds}
                    onChange={(e) => setRounds(e.target.value)}
                    className={inputClass}
                    required
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium">
                    {t("startDate")}
                  </span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={`${inputClass} px-3 text-sm`}
                    required
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium">
                    {t("deadline")}
                  </span>
                  <input
                    type="date"
                    value={deadline}
                    min={startDate}
                    onChange={(e) => setDeadline(e.target.value)}
                    className={`${inputClass} px-3 text-sm`}
                    required
                  />
                </label>
              </div>

              <div>
                <span className="mb-3 block text-sm font-medium">
                  {t("weekdays")}
                </span>
                <div className="grid grid-cols-7 gap-1.5">
                  {daysOfWeek.map((label, index) => {
                    const selected = weekdays.includes(index);

                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => toggleWeekday(index)}
                        aria-pressed={selected}
                        className={`rounded-lg py-3 text-sm transition ${
                          selected
                            ? "bg-[var(--anki-theme-color)] text-white"
                            : "bg-[#f1f3ee] text-[#81877d] hover:bg-[var(--anki-theme-light)]"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-[var(--anki-theme-color)] px-4 py-3.5 text-sm font-medium text-white transition hover:brightness-90"
              >
                {t("addPlan")}
              </button>
            </form>
          </section>

          <section>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--anki-theme-dark)]">
                  {t("overview")}
                </p>
                <h2 className="mt-2 text-xl font-semibold">
                  {t("savedPlans")}
                </h2>
              </div>
              <span className="text-sm text-[#858b81]">
                {plans.length} {t("itemCount")}
              </span>
            </div>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className={`mb-4 ${inputClass} bg-white`}
            />

            {filteredPlans.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[var(--anki-theme-soft)] bg-white/60 px-6 py-16 text-center">
                <p className="text-base font-medium text-[#5d6658]">
                  {search ? t("noResults") : t("noPlans")}
                </p>
                <p className="mt-2 text-sm text-[#92978f]">
                  {t("noPlansDescription")}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPlans.map((plan) => {
                  const perDay = dailyTarget(plan);
                  const daysLeft = remainingDays(plan.deadline);
                  const studyDays = countStudyDays(
                    plan.startDate,
                    plan.deadline,
                    plan.weekdays
                  );
                  const isActive =
                    plan.startDate <= today && plan.deadline >= today;
                  const status = plan.status ?? "pending";

                  return (
                    <article
                      key={plan.id}
                      className={`rounded-3xl border bg-white p-5 md:p-6 ${
                        status === "completed"
                          ? "border-[var(--anki-theme-soft)]"
                          : "border-[#e5e8e0]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs ${
                                status === "completed"
                                  ? "bg-[var(--anki-theme-light)] text-[var(--anki-theme-dark)]"
                                  : status === "postponed"
                                  ? "bg-[#f7edda] text-[#8b6a2d]"
                                  : isActive
                                  ? "bg-[var(--anki-theme-light)] text-[var(--anki-theme-dark)]"
                                  : daysLeft < 0
                                  ? "bg-[#f7e9e5] text-[#9b5a4c]"
                                  : "bg-[#f0f1ed] text-[#7b8176]"
                              }`}
                            >
                              {statusLabel(status, t)}
                            </span>

                            {status !== "completed" && (
                              <span className="text-xs text-[#92978f]">
                                {isActive
                                  ? t("inProgress")
                                  : daysLeft < 0
                                  ? t("overdue")
                                  : t("beforeStart")}
                              </span>
                            )}

                            <span className="text-xs text-[#92978f]">
                              {plan.rounds} {t("roundUnit")}
                            </span>
                          </div>

                          <h3
                            className={`mt-3 break-words text-lg font-semibold ${
                              status === "completed" ? "text-[#777f72]" : ""
                            }`}
                          >
                            {plan.deckName}
                          </h3>
                          <p className="mt-1 text-sm text-[#858b81]">
                            {plan.startDate} ～ {plan.deadline}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => deletePlan(plan.id)}
                          className="shrink-0 rounded-full px-3 py-2 text-sm text-[#969b92] transition hover:bg-[#f8eeeb] hover:text-[#a55e4e]"
                          aria-label={`${plan.deckName}: ${t("delete")}`}
                        >
                          {t("delete")}
                        </button>
                      </div>

                      <div className="mt-5 grid grid-cols-3 gap-2">
                        <div className="rounded-2xl bg-[#f7f8f5] p-3">
                          <p className="text-xs text-[#858b81]">
                            {t("totalLabel")}
                          </p>
                          <p className="mt-1 text-lg font-semibold">
                            {plan.totalItems.toLocaleString()}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-[#f7f8f5] p-3">
                          <p className="text-xs text-[#858b81]">
                            {t("studyDays")}
                          </p>
                          <p className="mt-1 text-lg font-semibold">
                            {studyDays}
                            <span className="ml-1 text-xs font-normal">
                              {t("dayUnit")}
                            </span>
                          </p>
                        </div>

                        <div className="rounded-2xl bg-[var(--anki-theme-light)] p-3">
                          <p className="text-xs text-[var(--anki-theme-dark)]">
                            {t("perDay")}
                          </p>
                          <p className="mt-1 text-lg font-semibold text-[var(--anki-theme-dark)]">
                            {perDay.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-[#858b81]">
                        <span>
                          {t("studyWeekdays")}
                          {plan.weekdays
                            .slice()
                            .sort((a, b) => a - b)
                            .map((d) => daysOfWeek[d])
                            .join("・")}
                        </span>

                        <span>
                          {daysLeft >= 0
                            ? t("daysUntil").replace("{days}", String(daysLeft))
                            : t("daysPassed").replace(
                                "{days}",
                                String(Math.abs(daysLeft))
                              )}
                        </span>
                      </div>

                      <div className="mt-5 border-t border-[#ecefe8] pt-4">
                        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-[#858b81]">
                          {t("planStatus")}
                        </p>

                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => updateStatus(plan.id, "pending")}
                            aria-pressed={status === "pending"}
                            className={`rounded-xl border px-2 py-3 text-sm transition ${
                              status === "pending"
                                ? "border-[var(--anki-theme-color)] bg-[var(--anki-theme-light)] font-semibold text-[var(--anki-theme-dark)]"
                                : "border-[#e1e5dc] bg-white text-[#777f72] hover:bg-[#f6f7f4]"
                            }`}
                          >
                            {t("pending")}
                          </button>

                          <button
                            type="button"
                            onClick={() => updateStatus(plan.id, "completed")}
                            aria-pressed={status === "completed"}
                            className={`rounded-xl border px-2 py-3 text-sm transition ${
                              status === "completed"
                                ? "border-[var(--anki-theme-color)] bg-[var(--anki-theme-color)] font-semibold text-white"
                                : "border-[#e1e5dc] bg-white text-[#777f72] hover:bg-[#f6f7f4]"
                            }`}
                          >
                            ✓ {t("completed")}
                          </button>

                          <button
                            type="button"
                            onClick={() => postponePlan(plan)}
                            className={`rounded-xl border px-2 py-3 text-sm transition ${
                              status === "postponed"
                                ? "border-[#b89a5a] bg-[#f7edda] font-semibold text-[#8b6a2d]"
                                : "border-[#e1e5dc] bg-white text-[#777f72] hover:bg-[#f6f7f4]"
                            }`}
                          >
                            {t("postpone")}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <footer className="mt-12 flex flex-wrap gap-3 border-t border-[#e2e6dd] pt-6 text-sm text-[#81877d]">
          <Link
            href="/today"
            className="transition hover:text-[var(--anki-theme-dark)]"
          >
            {t("today")}
          </Link>
          <Link
            href="/tasks"
            className="transition hover:text-[var(--anki-theme-dark)]"
          >
            {t("footerTasks")}
          </Link>
          <Link
            href="/calendar"
            className="transition hover:text-[var(--anki-theme-dark)]"
          >
            {t("footerCalendar")}
          </Link>
        </footer>
      </div>
    </main>
  );
}
