
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAppLanguage } from "@/app/component/AppLanguage";

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
    actual: "実績進捗", planned: "予定進捗",
    actualNote: "教材管理に記録された学習範囲",
    plannedNote: "今日までに進んでいる予定の割合",
    firstRound: "実績は1周目を基準に表示",
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
    actual: "Actual progress", planned: "Planned progress",
    actualNote: "Ranges recorded in Material Management",
    plannedNote: "Expected progress by today",
    firstRound: "Actual progress is based on the first round",
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
    actual: "Tatsächlicher Fortschritt", planned: "Geplanter Fortschritt",
    actualNote: "In der Materialverwaltung erfasste Bereiche",
    plannedNote: "Bis heute erwarteter Fortschritt",
    firstRound: "Der tatsächliche Fortschritt basiert auf dem ersten Durchgang",
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
    actual: "实际进度", planned: "计划进度",
    actualNote: "教材管理中记录的学习范围",
    plannedNote: "截至今天预计完成的比例",
    firstRound: "实际进度以第一轮为基准",
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
    actual: "實際進度", planned: "計畫進度",
    actualNote: "教材管理中記錄的學習範圍",
    plannedNote: "截至今天預計完成的比例",
    firstRound: "實際進度以第一輪為基準",
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
    actual: "Progreso real", planned: "Progreso previsto",
    actualNote: "Rangos registrados en Materiales",
    plannedNote: "Progreso esperado hasta hoy",
    firstRound: "El progreso real se basa en la primera vuelta",
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

// 重複した範囲をまとめて、実際に学習した項目数を計算
function getCoveredCount(ranges: StudyRange[]) {
  const valid = ranges
    .filter(
      (range) =>
        Number.isFinite(range.start) &&
        Number.isFinite(range.end) &&
        range.start > 0 &&
        range.end >= range.start
    )
    .map((range) => ({
      start: Math.floor(range.start),
      end: Math.floor(range.end),
    }))
    .sort((a, b) => a.start - b.start);

  if (valid.length === 0) return 0;

  let total = 0;
  let currentStart = valid[0].start;
  let currentEnd = valid[0].end;

  for (let i = 1; i < valid.length; i++) {
    const range = valid[i];

    if (range.start <= currentEnd + 1) {
      currentEnd = Math.max(currentEnd, range.end);
    } else {
      total += currentEnd - currentStart + 1;
      currentStart = range.start;
      currentEnd = range.end;
    }
  }

  return total + currentEnd - currentStart + 1;
}

function getPlannedPercent(plan: Plan) {
  const totalDays = countStudyDays(
    plan.startDate,
    plan.deadline,
    plan.weekdays
  );

  if (totalDays === 0) return 0;

  const today = todayString();

  if (today < plan.startDate) return 0;
  if (today >= plan.deadline) return 100;

  const elapsedDays = countStudyDays(
    plan.startDate,
    today,
    plan.weekdays
  );

  return Math.min(100, Math.round((elapsedDays / totalDays) * 100));
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
        ? p.weekdays.filter(
            (v): v is number =>
              typeof v === "number" && v >= 0 && v <= 6
          )
        : [],
      createdAt:
        typeof p.createdAt === "string"
          ? p.createdAt
          : new Date().toISOString(),
      status:
        p.status === "completed" || p.status === "postponed"
          ? p.status
          : "pending",
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

  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<"all" | PlanStatus>("pending");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [materialId, setMaterialId] = useState("");
  const [startDate, setStartDate] = useState(todayString());
  const [deadline, setDeadline] = useState("");
  const [rounds, setRounds] = useState(1);
  const [weekdays, setWeekdays] = useState<number[]>([
    0, 1, 2, 3, 4, 5, 6,
  ]);

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

          const rawRanges = Array.isArray(data.studyRanges)
            ? data.studyRanges
            : [];

          const studyRanges: StudyRange[] = rawRanges
            .filter(
              (range: unknown): range is Record<string, unknown> =>
                typeof range === "object" && range !== null
            )
            .map((range) => ({
              start: Number(range.start),
              end: Number(range.end),
              date: typeof range.date === "string" ? range.date : "",
            }))
            .filter(
              (range) =>
                Number.isFinite(range.start) &&
                Number.isFinite(range.end) &&
                range.start > 0 &&
                range.end >= range.start
            );

          return {
            id: item.id,
            name: typeof data.name === "string" ? data.name : "",
            language:
              typeof data.language === "string" ? data.language : "",
            type: data.type === "deck" ? "deck" : "book",
            total: Math.max(0, Number(data.total) || 0),
            studyRanges,
          };
        });

        setMaterials(loaded);

        // 既存計画を教材名の完全一致で安全に自動連携
        const currentPlans = readPlans();
        let changed = false;

        const migrated = currentPlans.map((plan) => {
          if (plan.materialId) return plan;

          const matches = loaded.filter(
            (material) =>
              material.name.trim() === plan.deckName.trim()
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
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(migrated)
          );
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

  const selectedMaterial = materials.find(
    (m) => m.id === materialId
  );

  const plansWithMaterial = useMemo(
    () =>
      plans.map((plan) => {
        const material = materials.find(
          (m) => m.id === plan.materialId
        );

        return material
          ? {
              ...plan,
              deckName: material.name,
              totalItems: material.total,
            }
          : plan;
      }),
    [plans, materials]
  );

  function persist(next: Plan[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setPlans(next);
      window.dispatchEvent(new Event("storage"));
      return true;
    } catch { setError(t.error); return false; }
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

    if (
      !selectedMaterial ||
      !startDate ||
      !deadline ||
      startDate > deadline ||
      !Number.isInteger(rounds) || rounds < 1 || rounds > 100 ||
      selectedMaterial.total <= 0 || countStudyDays(startDate, deadline, weekdays) === 0 ||
      weekdays.length === 0
    ) {
      setError(t.required);
      return;
    }

    const next: Plan = {
      id: editingId ?? crypto.randomUUID(),
      deckName: selectedMaterial.name,
      materialId: selectedMaterial.id,
      totalItems: selectedMaterial.total,
      startDate,
      deadline,
      rounds,
      weekdays,
      createdAt: plans.find(p => p.id === editingId)?.createdAt ?? new Date().toISOString(),
      status: plans.find(p => p.id === editingId)?.status ?? "pending",
    };

    if (!persist(editingId ? plans.map(p => p.id === editingId ? next : p) : [next, ...plans])) return;
    setEditingId(null); setShowCreate(false); setFilter("all");
    setMaterialId("");
    setDeadline("");
    setRounds(1);
    setWeekdays([0, 1, 2, 3, 4, 5, 6]);
  }

  function updateStatus(id: string, status: PlanStatus) {
    persist(
      plans.map((p) => (p.id === id ? { ...p, status } : p))
    );
  }

  function deletePlan(id: string) {
    if (!window.confirm(t.delete + "?")) return;
    persist(plans.filter((p) => p.id !== id));
  }

  const ja = lang === "ja";
  const ui = (j: string, e: string) => ja ? j : e;
  const panel = "rounded-2xl border border-[#e5e5e9] bg-white p-5 sm:p-6 shadow-sm";
  const field = "mt-2 w-full rounded-xl border border-[#dedee5] bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#a5a0c8]";
  const button = "rounded-xl border border-[#dedee5] bg-white px-4 py-2.5 text-sm font-medium hover:bg-[#f4f3f8]";
  const primary = "rounded-xl bg-[#555075] px-5 py-3 text-sm font-semibold text-white hover:bg-[#413d61] disabled:opacity-40";
  const active = plansWithMaterial.filter(p => (p.status ?? "pending") === "pending");
  const visible = plansWithMaterial.filter(p => filter === "all" || (p.status ?? "pending") === filter).sort((a,b) => a.deadline.localeCompare(b.deadline));
  const previewDays = countStudyDays(startDate, deadline, weekdays);
  const dateAfter = (n: number) => { const d = new Date(`${startDate || todayString()}T12:00:00`); d.setDate(d.getDate()+n-1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
  const today = todayString();
  const openEditor = (p?: Plan) => {
    setEditingId(p?.id ?? null); setMaterialId(p?.materialId ?? ""); setStartDate(p?.startDate ?? today); setDeadline(p?.deadline ?? ""); setRounds(p?.rounds ?? 1); setWeekdays(p?.weekdays ?? [0,1,2,3,4,5,6]); setError(""); setShowCreate(true);
    window.scrollTo({top:0,behavior:"smooth"});
  };
  return <main className="min-h-screen bg-white text-[#29283a]">
    <div className="mx-auto max-w-5xl px-4 pb-16 pt-20 sm:px-8">
      <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-semibold tracking-[.22em] text-[#777099]">LEARNING STUDIO</p><h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-5xl">{t.title}</h1><p className="mt-3 text-sm leading-6 text-[#716f80]">{ui("学びたいものを、無理なく最後まで。","Make room for what you want to learn.")}</p></div>
        <div className="flex flex-wrap gap-2"><Link href="/materials" className={button}>{t.manage}</Link><button className={primary} disabled={!user || loading} onClick={()=>openEditor()}>＋ {t.create}</button></div>
      </header>
      {error && <p role="alert" className="mb-4 rounded-xl border border-[#e8c9c3] p-4 text-sm text-[#964f43]">{error}</p>}
      {!authReady || loading ? <p>{t.loading}</p> : !user ? <Link href="/login" className={button}>{t.login}</Link> : <>
        <section className="mb-6 grid grid-cols-2 gap-3 rounded-2xl bg-[#f4f3f8] p-5 sm:grid-cols-3">
          {[[t.pending,active.length],[t.completed,plans.filter(p=>p.status==="completed").length],[ui("登録教材","Materials"),materials.length]].map(([label,value])=><div key={label} className="rounded-xl bg-white p-4"><p className="text-xs text-[#716f80]">{label}</p><p className="mt-2 text-3xl font-semibold tabular-nums text-[#555075]">{value}</p></div>)}
        </section>
        {showCreate && <section className={`${panel} mb-7`}>
          <div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-semibold">{editingId?t.edit:t.create}</h2><button className={button} onClick={()=>setShowCreate(false)}>{t.cancel}</button></div>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="text-sm sm:col-span-2">{t.material}<select className={field} value={materialId} onChange={e=>setMaterialId(e.target.value)}><option value="">{t.selectMaterial}</option>{materials.map(m=><option key={m.id} value={m.id}>{m.name} · {m.total} {m.type==="book"?t.unitBook:t.unitDeck}</option>)}</select></label>
            {!materials.length&&<Link href="/materials" className="text-sm underline sm:col-span-2">{t.noMaterials}</Link>}
            <label className="text-sm">{t.start}<input className={field} type="date" value={startDate} onChange={e=>setStartDate(e.target.value)}/></label>
            <label className="text-sm">{t.deadline}<input className={field} type="date" min={startDate} value={deadline} onChange={e=>setDeadline(e.target.value)}/></label>
            <div className="flex flex-wrap gap-2 sm:col-span-2">{[7,14,30,90].map(n=><button key={n} type="button" className={button} onClick={()=>setDeadline(dateAfter(n))}>{n} {ui("日間","days")}</button>)}</div>
            <label className="text-sm">{t.rounds}<input className={field} type="number" min={1} max={100} value={rounds} onChange={e=>setRounds(Math.min(100,Math.max(1,Math.floor(Number(e.target.value)||1))))}/></label>
            <div className="sm:col-span-2"><p className="mb-2 text-sm">{t.days}</p><div className="flex flex-wrap gap-2">{weekdayLabels.map((l,i)=><button key={i} aria-pressed={weekdays.includes(i)} onClick={()=>toggleWeekday(i)} className={weekdays.includes(i)?primary:button}>{l}</button>)}</div><div className="mt-3 flex flex-wrap gap-2"><button className={button} onClick={()=>setWeekdays([0,1,2,3,4,5,6])}>{ui("毎日","Every day")}</button><button className={button} onClick={()=>setWeekdays([0,1,2,3,4])}>{ui("平日","Weekdays")}</button><button className={button} onClick={()=>setWeekdays([5,6])}>{ui("週末","Weekend")}</button></div></div>
            {selectedMaterial&&<div className="rounded-xl bg-[#f4f3f8] p-5 sm:col-span-2"><p className="text-xs text-[#716f80]">{ui("計画プレビュー・保存前に確認","Plan preview")}</p><p className="mt-2 text-2xl font-semibold">{previewDays?Math.ceil(selectedMaterial.total*rounds/previewDays):"—"} <span className="text-sm font-normal">{selectedMaterial.type==="book"?t.unitBook:t.unitDeck} / {ui("学習日","study day")}</span></p><p className="mt-2 text-sm">{previewDays} {t.studyDays} · {selectedMaterial.total*rounds} {ui("延べ学習量","total items")}</p></div>}
          </div><button className={`${primary} mt-5`} disabled={!selectedMaterial||!previewDays||selectedMaterial.total<=0} onClick={createPlan}>{editingId?ui("変更を保存","Save changes"):t.save}</button>
        </section>}
        <section><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">{t.plans}</h2><div className="flex flex-wrap gap-2">{(["pending","completed","postponed","all"] as const).map(f=><button key={f} aria-pressed={filter===f} onClick={()=>setFilter(f)} className={filter===f?primary:button}>{f==="all"?ui("すべて","All"):t[f]}</button>)}</div></div>
          {!visible.length?<div className={`${panel} text-center`}><p className="text-sm text-[#716f80]">{t.noPlans}</p><button className={`${button} mt-4`} onClick={()=>openEditor()}>＋ {t.create}</button></div>:<div className="grid gap-4 lg:grid-cols-2">{visible.map(p=>{
            const m=materials.find(x=>x.id===p.materialId); const total=p.totalItems; const unit=m?.type==="deck"?t.unitDeck:t.unitBook;
            const covered=m?Math.min(total,getCoveredCount(m.studyRanges.map(r=>({...r,end:Math.min(r.end,total)})))):null;
            const percent=covered!==null&&total>0?Math.round(100*covered/total):null;
            const remaining=covered===null?null:Math.max(0,total-covered);
            const days=countStudyDays(p.startDate,p.deadline,p.weekdays); const left=countStudyDays(today>p.startDate?today:p.startDate,p.deadline,p.weekdays);
            const target=getPlannedPercent(p); const status=p.status??"pending";
            return <article key={p.id} className={panel}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs text-[#777099]">{m?.language||"—"} · {m?t.linked:t.unlinked}</p><h3 className="mt-2 break-words text-lg font-semibold">{p.deckName||"—"}</h3><p className="mt-1 text-xs text-[#716f80]">{p.startDate} → {p.deadline}</p></div><span className="shrink-0 rounded-lg bg-[#f4f3f8] px-2 py-1 text-xs">{t[status]}</span></div>
            <div className="mt-5 flex items-end justify-between gap-2"><div><p className="text-xs text-[#716f80]">{ui("残り（1周目）","Remaining · first round")}</p><p className="mt-1 text-3xl font-semibold tabular-nums text-[#555075]">{remaining??"—"} <span className="text-sm font-normal">{unit}</span></p></div><div className="text-right"><p className="text-xs text-[#716f80]">{ui("残り学習日","Study days left")}</p><p className="text-xl font-semibold tabular-nums">{left}</p></div></div>
            <div className="mt-5 space-y-3">{[[t.actual,percent,"#70658e"],[t.planned,target,"#a6b5a1"]].map(([label,value,color])=><div key={String(label)}><div className="mb-1 flex justify-between text-xs"><span>{label}</span><span>{value===null?"—":`${value}%`}</span></div><div className="h-2 rounded-full bg-[#eeedf1]" role="progressbar" aria-label={String(label)} aria-valuenow={typeof value==="number"?value:undefined}><div className="h-full rounded-full" style={{width:`${value??0}%`,background:String(color)}}/></div></div>)}</div>
            <p className="mt-3 text-xs leading-5 text-[#716f80]">{t.firstRound} · {ui("予定は計画全体の経過率。実績は教材の記録範囲。","Plan progress is elapsed schedule; actual is recorded coverage.")}</p>
            <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-[#f7f7f9] p-3 text-sm"><div><p className="text-xs text-[#716f80]">{t.total} · {t.rounds}</p><p>{total} {unit} × {p.rounds}</p></div><div><p className="text-xs text-[#716f80]">{t.daily} · {ui("当初","Original")}</p><p>{days?Math.ceil(total*p.rounds/days):"—"} {unit}</p></div>{remaining!==null&&left>0&&p.rounds===1&&status==="pending"&&<div className="col-span-2"><p className="text-xs text-[#716f80]">{ui("今からの目安","Adjusted pace")}</p><p>{Math.ceil(remaining/left)} {unit} / {ui("学習日","study day")}</p></div>}</div>
            <div className="mt-4 flex flex-wrap items-center gap-2"><Link className={primary} href="/materials">{t.manage} ↗</Link><button className={button} onClick={()=>openEditor(p)}>{t.edit}</button><select aria-label={t.status} className={button} value={status} onChange={e=>updateStatus(p.id,e.target.value as PlanStatus)}><option value="pending">{t.pending}</option><option value="completed">{t.completed}</option><option value="postponed">{t.postponed}</option></select><button className="ml-auto px-2 py-2 text-xs text-[#a06b64]" onClick={()=>deletePlan(p.id)}>{t.delete}</button></div></article>;
          })}</div>}
        </section>
      </>}
      <footer className="mt-8 text-xs text-[#716f80]">{ui("計画はこのブラウザに保存されます。教材の学習範囲はFirebaseから読み込みます。","Plans are saved in this browser. Material ranges are loaded from Firebase.")}</footer>
    </div>
  </main>;
}
