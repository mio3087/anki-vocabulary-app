
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAppLanguage, type AppLanguage } from "@/app/component/AppLanguage";

type Material = {
  id: string;
  name: string;
  language: string;
  type: "book" | "deck";
  total: number;
};

type PlanStatus = "pending" | "completed" | "postponed";

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
  status?: PlanStatus;
};

const STORAGE_KEY = "anki-study-plans-v1";

const localeMap: Record<AppLanguage, string> = {
  ja: "ja-JP",
  en: "en-US",
  de: "de-DE",
  "zh-CN": "zh-CN",
  "zh-TW": "zh-TW",
  es: "es-ES",
  it: "it-IT",
};

const weekdaysByLanguage: Record<string, string[]> = {
  ja: ["月", "火", "水", "木", "金", "土", "日"],
  en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  de: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"],
  "zh-CN": ["周一", "周二", "周三", "周四", "周五", "周六", "周日"],
  "zh-TW": ["週一", "週二", "週三", "週四", "週五", "週六", "週日"],
  es: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
};

const text: Record<string, Record<string, string>> = {
  ja: {
    title: "学習計画", subtitle: "STUDY PLANNING",
    description: "教材と学習期間から、毎日の目標を設定します。",
    back: "今日のノルマ", create: "新しい計画",
    material: "教材を選択", selectMaterial: "教材を選んでください",
    noMaterials: "教材管理に教材を登録してください。",
    total: "教材の総量", start: "開始日", deadline: "期限",
    rounds: "周回数", days: "学習する曜日",
    save: "計画を作成", cancel: "キャンセル",
    plans: "登録済みの計画", noPlans: "学習計画はありません",
    daily: "1日あたりの目標", studyDays: "学習日数",
    completed: "完了", pending: "進行中", postponed: "延期",
    delete: "削除", status: "状態", edit: "変更",
    loading: "読み込み中...", login: "ログインしてください。",
    error: "処理に失敗しました。もう一度お試しください。",
    required: "教材・期間・周回数・曜日を設定してください。",
    linked: "教材連携済み", unlinked: "教材未連携",
    unitBook: "ページ", unitDeck: "単語",
    empty: "該当する教材がありません。先に教材管理へ登録してください。",
    manage: "教材管理",
  },
  en: {
    title: "Study Plan", subtitle: "STUDY PLANNING",
    description: "Set daily goals based on your materials and schedule.",
    back: "Today's Goals", create: "New Plan",
    material: "Select material", selectMaterial: "Choose a material",
    noMaterials: "Please add materials first.",
    total: "Total amount", start: "Start date", deadline: "Deadline",
    rounds: "Rounds", days: "Study days", save: "Create plan",
    cancel: "Cancel", plans: "Your plans", noPlans: "No study plans yet",
    daily: "Daily target", studyDays: "Study days",
    completed: "Completed", pending: "In progress", postponed: "Postponed",
    delete: "Delete", status: "Status", edit: "Change",
    loading: "Loading...", login: "Please log in.",
    error: "Something went wrong. Please try again.",
    required: "Select a material, dates, rounds and study days.",
    linked: "Material linked", unlinked: "Not linked",
    unitBook: "pages", unitDeck: "words",
    empty: "No materials found. Add one in Material Management.",
    manage: "Materials",
  },
  de: {
    title: "Lernplan", subtitle: "STUDY PLANNING",
    description: "Lege tägliche Ziele anhand deiner Materialien fest.",
    back: "Heutige Ziele", create: "Neuer Plan",
    material: "Material auswählen", selectMaterial: "Material auswählen",
    noMaterials: "Bitte füge zuerst Materialien hinzu.",
    total: "Gesamtumfang", start: "Startdatum", deadline: "Frist",
    rounds: "Durchgänge", days: "Lerntage", save: "Plan erstellen",
    cancel: "Abbrechen", plans: "Deine Pläne", noPlans: "Noch keine Lernpläne",
    daily: "Tagesziel", studyDays: "Lerntage",
    completed: "Abgeschlossen", pending: "In Bearbeitung", postponed: "Verschoben",
    delete: "Löschen", status: "Status", edit: "Ändern",
    loading: "Wird geladen...", login: "Bitte anmelden.",
    error: "Ein Fehler ist aufgetreten.",
    required: "Bitte Material, Zeitraum, Durchgänge und Lerntage festlegen.",
    linked: "Material verknüpft", unlinked: "Nicht verknüpft",
    unitBook: "Seiten", unitDeck: "Wörter",
    empty: "Keine Materialien. Bitte zuerst Materialien hinzufügen.",
    manage: "Materialien",
  },
  "zh-CN": {
    title: "学习计划", subtitle: "STUDY PLANNING",
    description: "根据教材和学习期间设置每日目标。",
    back: "今日目标", create: "新建计划",
    material: "选择教材", selectMaterial: "请选择教材",
    noMaterials: "请先在教材管理中添加教材。",
    total: "教材总量", start: "开始日期", deadline: "截止日期",
    rounds: "学习轮数", days: "学习日", save: "创建计划",
    cancel: "取消", plans: "已有计划", noPlans: "暂无学习计划",
    daily: "每日目标", studyDays: "学习天数",
    completed: "已完成", pending: "进行中", postponed: "已延期",
    delete: "删除", status: "状态", edit: "修改",
    loading: "正在加载...", login: "请先登录。",
    error: "操作失败，请重试。",
    required: "请选择教材、日期、轮数和学习日。",
    linked: "已关联教材", unlinked: "未关联教材",
    unitBook: "页", unitDeck: "个单词",
    empty: "没有教材，请先添加教材。",
    manage: "教材管理",
  },
  "zh-TW": {
    title: "學習計畫", subtitle: "STUDY PLANNING",
    description: "根據教材和學習期間設定每日目標。",
    back: "今日目標", create: "新增計畫",
    material: "選擇教材", selectMaterial: "請選擇教材",
    noMaterials: "請先在教材管理中新增教材。",
    total: "教材總量", start: "開始日期", deadline: "截止日期",
    rounds: "學習輪數", days: "學習日", save: "建立計畫",
    cancel: "取消", plans: "已有計畫", noPlans: "尚無學習計畫",
    daily: "每日目標", studyDays: "學習天數",
    completed: "已完成", pending: "進行中", postponed: "已延期",
    delete: "刪除", status: "狀態", edit: "修改",
    loading: "載入中...", login: "請先登入。",
    error: "操作失敗，請重試。",
    required: "請選擇教材、日期、輪數和學習日。",
    linked: "已連結教材", unlinked: "未連結教材",
    unitBook: "頁", unitDeck: "個單字",
    empty: "沒有教材，請先新增教材。",
    manage: "教材管理",
  },
  es: {
    title: "Plan de estudio", subtitle: "STUDY PLANNING",
    description: "Establece objetivos diarios según tus materiales.",
    back: "Objetivos de hoy", create: "Nuevo plan",
    material: "Seleccionar material", selectMaterial: "Elige un material",
    noMaterials: "Añade materiales primero.",
    total: "Cantidad total", start: "Fecha de inicio", deadline: "Fecha límite",
    rounds: "Vueltas", days: "Días de estudio", save: "Crear plan",
    cancel: "Cancelar", plans: "Tus planes", noPlans: "Todavía no hay planes",
    daily: "Objetivo diario", studyDays: "Días de estudio",
    completed: "Completado", pending: "En curso", postponed: "Aplazado",
    delete: "Eliminar", status: "Estado", edit: "Cambiar",
    loading: "Cargando...", login: "Inicia sesión.",
    error: "No se pudo completar la operación.",
    required: "Selecciona material, fechas, vueltas y días.",
    linked: "Material vinculado", unlinked: "Sin vincular",
    unitBook: "páginas", unitDeck: "palabras",
    empty: "No hay materiales. Añade uno primero.",
    manage: "Materiales",
  },
};

function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function countStudyDays(start: string, end: string, weekdays: number[]) {
  if (!start || !end || start > end || weekdays.length === 0) return 0;
  const from = new Date(`${start}T12:00:00`);
  const to = new Date(`${end}T12:00:00`);
  let count = 0;

  for (const d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
    const day = (d.getDay() + 6) % 7;
    if (weekdays.includes(day)) count++;
  }
  return count;
}

function readPlans(): Plan[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];

    return parsed.map((p: Record<string, unknown>) => ({
      id: String(p.id ?? crypto.randomUUID()),
      deckName: typeof p.deckName === "string" ? p.deckName : "",
      materialId: typeof p.materialId === "string" ? p.materialId : undefined,
      totalItems: Number(p.totalItems) || 0,
      startDate: typeof p.startDate === "string" ? p.startDate : "",
      deadline: typeof p.deadline === "string" ? p.deadline : "",
      rounds: Math.max(1, Number(p.rounds) || 1),
      weekdays: Array.isArray(p.weekdays)
        ? p.weekdays.filter((v): v is number => typeof v === "number" && v >= 0 && v <= 6)
        : [],
      createdAt: typeof p.createdAt === "string" ? p.createdAt : new Date().toISOString(),
      status: p.status === "completed" || p.status === "postponed" ? p.status : "pending",
    }));
  } catch {
    return [];
  }
}

export default function PlanPage() {
  const { language } = useAppLanguage();
  const lang = language in text ? language : "ja";
  const t = text[lang];
  const weekdayLabels = weekdaysByLanguage[lang] ?? weekdaysByLanguage.ja;

  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [materialId, setMaterialId] = useState("");
  const [startDate, setStartDate] = useState(todayString());
  const [deadline, setDeadline] = useState("");
  const [rounds, setRounds] = useState(1);
  const [weekdays, setWeekdays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

  useEffect(() => {
    setPlans(readPlans());
    const refresh = () => setPlans(readPlans());
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });
  }, []);

  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      setMaterials([]);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    getDocs(collection(db, "users", user.uid, "materials"))
      .then((snapshot) => {
        if (!active) return;
        const loaded: Material[] = snapshot.docs.map((item) => {
          const data = item.data();
          return {
            id: item.id,
            name: typeof data.name === "string" ? data.name : "",
            language: typeof data.language === "string" ? data.language : "",
            type: data.type === "deck" ? "deck" : "book",
            total: Math.max(0, Number(data.total) || 0),
          };
        });

        setMaterials(loaded);

        // 既存計画を教材名の完全一致で安全に自動連携
        const currentPlans = readPlans();
        let changed = false;

        const migrated = currentPlans.map((plan) => {
          if (plan.materialId) return plan;

          const matches = loaded.filter(
            (material) => material.name.trim() === plan.deckName.trim()
          );

          if (matches.length !== 1) return plan;

          changed = true;
          return {
            ...plan,
            materialId: matches[0].id,
            deckName: matches[0].name,
            totalItems: matches[0].total,
          };
        });

        if (changed) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
          setPlans(migrated);
        }
      })
      .catch((err) => {
        console.error("Material loading error:", err);
        setError(t.error);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [authReady, user, t.error]);

  const selectedMaterial = materials.find((m) => m.id === materialId);

  const plansWithMaterial = useMemo(
    () =>
      plans.map((plan) => {
        const material = materials.find((m) => m.id === plan.materialId);
        return material
          ? { ...plan, deckName: material.name, totalItems: material.total }
          : plan;
      }),
    [plans, materials]
  );

  function persist(next: Plan[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setPlans(next);
    window.dispatchEvent(new Event("storage"));
  }

  function toggleWeekday(day: number) {
    setWeekdays((current) =>
      current.includes(day)
        ? current.filter((d) => d !== day)
        : [...current, day].sort((a, b) => a - b)
    );
  }

  function createPlan() {
    setError("");

    if (!selectedMaterial || !startDate || !deadline || startDate > deadline || rounds < 1 || weekdays.length === 0) {
      setError(t.required);
      return;
    }

    const next: Plan = {
      id: crypto.randomUUID(),
      deckName: selectedMaterial.name,
      materialId: selectedMaterial.id,
      totalItems: selectedMaterial.total,
      startDate,
      deadline,
      rounds,
      weekdays,
      createdAt: new Date().toISOString(),
      status: "pending",
    };

    persist([next, ...plans]);
    setMaterialId("");
    setDeadline("");
    setRounds(1);
    setWeekdays([0, 1, 2, 3, 4, 5, 6]);
  }

  function updateStatus(id: string, status: PlanStatus) {
    persist(plans.map((p) => (p.id === id ? { ...p, status } : p)));
  }

  function deletePlan(id: string) {
    if (!window.confirm(t.delete + "?")) return;
    persist(plans.filter((p) => p.id !== id));
  }

  const styles = {
    page: "min-h-screen bg-[#F7F7F5] text-[#20231F]",
    border: "#DCDDD6",
    muted: "#777C74",
    accent: "var(--anki-theme-color)",
    dark: "var(--anki-theme-dark)",
  };

  return (
    <main className={styles.page}>
      <div className="mx-auto max-w-5xl px-5 pb-14 pt-8 sm:px-8 md:px-12">
        <header className="mb-10 border-b pb-7" style={{ borderColor: styles.border }}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.2em]" style={{ color: styles.muted }}>
                {t.subtitle}
              </p>
              <h1 className="mt-4 text-3xl font-semibold tracking-[-0.045em] sm:text-5xl">
                {t.title}
              </h1>
              <p className="mt-3 text-sm" style={{ color: styles.muted }}>
                {t.description}
              </p>
            </div>
            <Link href="/today" className="border px-4 py-3 text-sm hover:bg-white" style={{ borderColor: styles.border }}>
              {t.back} ↗
            </Link>
          </div>
        </header>

        {error && (
          <div role="alert" className="mb-6 border-l-2 bg-white px-4 py-3 text-sm text-[#8A5145]" style={{ borderColor: "#A86B5C" }}>
            {error}
          </div>
        )}

        {!authReady || loading ? (
          <p className="py-10 text-sm" style={{ color: styles.muted }}>{t.loading}</p>
        ) : !user ? (
          <p className="border-y py-8 text-sm">{t.login}</p>
        ) : (
          <>
            <section className="mb-12">
              <div className="mb-4 border-b pb-3" style={{ borderColor: styles.border }}>
                <p className="text-[10px] font-semibold tracking-[0.2em]" style={{ color: styles.muted }}>01 / CREATE</p>
                <h2 className="mt-2 text-xl font-semibold">{t.create}</h2>
              </div>

              <div className="grid gap-5 border p-5 sm:grid-cols-2 sm:p-7" style={{ borderColor: styles.border, backgroundColor: "#FFFFFF" }}>
                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-xs font-medium">{t.material}</span>
                  <select
                    value={materialId}
                    onChange={(e) => setMaterialId(e.target.value)}
                    className="w-full border bg-white px-3 py-3 text-sm outline-none focus:border-[var(--anki-theme-color)]"
                    style={{ borderColor: styles.border }}
                  >
                    <option value="">{t.selectMaterial}</option>
                    {materials.map((material) => (
                      <option key={material.id} value={material.id}>
                        {material.name} · {material.total.toLocaleString(localeMap[lang])} {material.type === "book" ? t.unitBook : t.unitDeck}
                      </option>
                    ))}
                  </select>
                  {materials.length === 0 && (
                    <p className="mt-2 text-xs" style={{ color: styles.muted }}>
                      {t.noMaterials} <Link href="/materials" className="underline">{t.manage}</Link>
                    </p>
                  )}
                </label>

                {selectedMaterial && (
                  <div className="sm:col-span-2 border-l-2 pl-4 py-1" style={{ borderColor: styles.accent }}>
                    <p className="text-xs" style={{ color: styles.muted }}>{t.total}</p>
                    <p className="mt-1 font-mono text-2xl">
                      {selectedMaterial.total.toLocaleString(localeMap[lang])}{" "}
                      <span className="text-xs" style={{ color: styles.muted }}>
                        {selectedMaterial.type === "book" ? t.unitBook : t.unitDeck}
                      </span>
                    </p>
                  </div>
                )}

                <label className="block">
                  <span className="mb-2 block text-xs font-medium">{t.start}</span>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full border bg-white px-3 py-3 text-sm" style={{ borderColor: styles.border }} />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-medium">{t.deadline}</span>
                  <input type="date" min={startDate} value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full border bg-white px-3 py-3 text-sm" style={{ borderColor: styles.border }} />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-medium">{t.rounds}</span>
                  <input type="number" min={1} max={100} value={rounds} onChange={(e) => setRounds(Math.max(1, Number(e.target.value) || 1))} className="w-full border bg-white px-3 py-3 text-sm" style={{ borderColor: styles.border }} />
                </label>

                <div className="sm:col-span-2">
                  <p className="mb-3 text-xs font-medium">{t.days}</p>
                  <div className="flex flex-wrap gap-2">
                    {weekdayLabels.map((label, index) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => toggleWeekday(index)}
                        className="min-w-11 border px-3 py-2 text-xs transition"
                        style={weekdays.includes(index)
                          ? { borderColor: styles.accent, backgroundColor: styles.accent, color: "#FFFFFF" }
                          : { borderColor: styles.border, backgroundColor: "#FFFFFF", color: styles.muted }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedMaterial && deadline && startDate <= deadline && (
                  <div className="sm:col-span-2 border-t pt-4" style={{ borderColor: styles.border }}>
                    <p className="text-xs" style={{ color: styles.muted }}>{t.daily}</p>
                    <p className="mt-1 font-mono text-3xl" style={{ color: styles.dark }}>
                      {Math.ceil(
                        (selectedMaterial.total * rounds) /
                        Math.max(1, countStudyDays(startDate, deadline, weekdays))
                      ).toLocaleString(localeMap[lang])}
                      <span className="ml-2 text-xs" style={{ color: styles.muted }}>
                        {selectedMaterial.type === "book" ? t.unitBook : t.unitDeck} / day
                      </span>
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
                  <button
                    type="button"
                    onClick={createPlan}
                    disabled={!selectedMaterial || !deadline || materials.length === 0}
                    className="bg-[var(--anki-theme-dark)] px-6 py-3 text-sm text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {t.save}
                  </button>
                  <Link href="/materials" className="text-xs underline" style={{ color: styles.muted }}>
                    {t.manage}
                  </Link>
                </div>
              </div>
            </section>

            <section>
              <div className="mb-4 border-b pb-3" style={{ borderColor: styles.border }}>
                <p className="text-[10px] font-semibold tracking-[0.2em]" style={{ color: styles.muted }}>02 / OVERVIEW</p>
                <h2 className="mt-2 text-xl font-semibold">{t.plans}</h2>
              </div>

              {plansWithMaterial.length === 0 ? (
                <p className="border-y py-8 text-sm" style={{ color: styles.muted }}>{t.noPlans}</p>
              ) : (
                <div className="border-l border-t" style={{ borderColor: styles.border }}>
                  {plansWithMaterial.map((plan) => {
                    const days = countStudyDays(plan.startDate, plan.deadline, plan.weekdays);
                    const daily = days > 0 ? Math.ceil((plan.totalItems * plan.rounds) / days) : 0;
                    const material = materials.find((m) => m.id === plan.materialId);
                    const unit = material?.type === "deck" ? t.unitDeck : t.unitBook;
                    const statusText = plan.status === "completed" ? t.completed : plan.status === "postponed" ? t.postponed : t.pending;

                    return (
                      <article key={plan.id} className="border-b border-r bg-white p-5 sm:p-6" style={{ borderColor: styles.border }}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="break-words text-base font-semibold">{plan.deckName || "—"}</h3>
                            <p className="mt-2 text-xs" style={{ color: styles.muted }}>
                              {plan.startDate} — {plan.deadline}
                            </p>
                          </div>
                          <span className="text-[10px]" style={{ color: styles.muted }}>
                            {material ? t.linked : t.unlinked}
                          </span>
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                          <div>
                            <p className="text-[10px]" style={{ color: styles.muted }}>{t.total}</p>
                            <p className="mt-1 font-mono text-lg">{plan.totalItems.toLocaleString(localeMap[lang])} <span className="text-xs">{unit}</span></p>
                          </div>
                          <div>
                            <p className="text-[10px]" style={{ color: styles.muted }}>{t.rounds}</p>
                            <p className="mt-1 font-mono text-lg">{plan.rounds}</p>
                          </div>
                          <div>
                            <p className="text-[10px]" style={{ color: styles.muted }}>{t.studyDays}</p>
                            <p className="mt-1 font-mono text-lg">{days}</p>
                          </div>
                          <div>
                            <p className="text-[10px]" style={{ color: styles.muted }}>{t.daily}</p>
                            <p className="mt-1 font-mono text-lg" style={{ color: styles.dark }}>{daily} <span className="text-xs">{unit}</span></p>
                          </div>
                        </div>

                        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4" style={{ borderColor: styles.border }}>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs" style={{ color: styles.muted }}>{t.status}:</span>
                            <select
                              value={plan.status ?? "pending"}
                              onChange={(e) => updateStatus(plan.id, e.target.value as PlanStatus)}
                              className="border bg-white px-2 py-1.5 text-xs"
                              style={{ borderColor: styles.border }}
                            >
                              <option value="pending">{t.pending}</option>
                              <option value="completed">{t.completed}</option>
                              <option value="postponed">{t.postponed}</option>
                            </select>
                          </div>
                          <button type="button" onClick={() => deletePlan(plan.id)} className="text-xs text-[#9A655A] hover:underline">
                            {t.delete}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}

        <footer className="mt-12 border-t pt-5 text-[10px] tracking-[0.12em]" style={{ borderColor: styles.border, color: styles.muted }}>
          YOUR ANKI / PERSONAL LEARNING SYSTEM
        </footer>
      </div>
    </main>
  );
}
