
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Brain,
  BookOpen,
  Headphones,
  PenLine,
  Mic,
  BarChart3,
  Globe,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Lightbulb,
  Target,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ChevronDown,
  Activity,
} from "lucide-react";

import { db, auth } from "@/lib/firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

import type { Skill, Language } from "@/lib/understanding/types";

type ErrorItem = {
  id: string;
  label: string;
  count: number;
};

type DiscoveryItem = {
  id: string;
  title: string;
  description: string;
};

type RealityRecord = {
  id: string;
  language: Language;
  skill: Skill;
  title: string;
  confidence: number;
  actualUnderstanding: number;
  errors: ErrorItem[];
  discoveries: DiscoveryItem[];
  nextAction: string;
  createdAt?: any;
};

type FormData = {
  language: Language;
  skill: Skill;
  title: string;
  confidence: number;
  actualUnderstanding: number;
  errors: string;
  discoveries: string;
  nextAction: string;
};

const languageOptions: { value: Language; label: string }[] = [
  { value: "zh" as Language, label: "中国語" },
  { value: "de" as Language, label: "ドイツ語" },
  { value: "es" as Language, label: "スペイン語" },
  { value: "ko" as Language, label: "韓国語" },
  { value: "it" as Language, label: "イタリア語" },
  { value: "ja" as Language, label: "日本語" },
];

const skills: {
  id: Skill;
  label: string;
  icon: any;
}[] = [
  { id: "reading" as Skill, label: "リーディング", icon: BookOpen },
  { id: "listening" as Skill, label: "リスニング", icon: Headphones },
  { id: "writing" as Skill, label: "ライティング", icon: PenLine },
  { id: "speaking" as Skill, label: "スピーキング", icon: Mic },
];

const initialForm: FormData = {
  language: "zh" as Language,
  skill: "reading" as Skill,
  title: "",
  confidence: 70,
  actualUnderstanding: 70,
  errors: "",
  discoveries: "",
  nextAction: "",
};

export default function UnderstandingAnalyticsPage() {
  const [uid, setUid] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<RealityRecord[]>([]);

  const [language, setLanguage] = useState<Language>("zh" as Language);
  const [activeSkill, setActiveSkill] = useState<Skill | "overall">("overall");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormData>(initialForm);

  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  const themeColor = "var(--anki-theme-color, #718B78)";
  const themeDark = "var(--anki-theme-dark, #536D5B)";
  const themeLight = "var(--anki-theme-light, #E8EFE9)";

  const cardClass = "bg-white border border-slate-200/80 rounded-2xl shadow-sm";
  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100";

  // AUTH
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid ?? null);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // FIRESTORE
  useEffect(() => {
    if (!uid) {
      setRecords([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const recordsRef = collection(db, "users", uid, "realityChecks");
    const q = query(recordsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const result = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        })) as RealityRecord[];

        setRecords(result);
        setLoading(false);
      },
      (error) => {
        console.error("Reality Check 読み込みエラー:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [uid]);

  // FILTER
  const languageRecords = useMemo(
    () => records.filter((item) => item.language === language),
    [records, language]
  );

  const filteredRecords = useMemo(() => {
    if (activeSkill === "overall") return languageRecords;
    return languageRecords.filter((item) => item.skill === activeSkill);
  }, [languageRecords, activeSkill]);

  const selectedRecord =
    filteredRecords.find((item) => item.id === selectedRecordId) ??
    filteredRecords[0] ??
    null;

  // STATISTICS
  const overallAverage =
    languageRecords.length > 0
      ? Math.round(
          languageRecords.reduce(
            (sum, item) => sum + item.actualUnderstanding,
            0
          ) / languageRecords.length
        )
      : null;

  const averageGap =
    languageRecords.length > 0
      ? Math.round(
          languageRecords.reduce(
            (sum, item) => sum + item.confidence - item.actualUnderstanding,
            0
          ) / languageRecords.length
        )
      : null;

  const skillScores = useMemo(
    () =>
      skills.map((skill) => {
        const items = languageRecords.filter(
          (item) => item.skill === skill.id
        );

        return {
          ...skill,
          score:
            items.length > 0
              ? Math.round(
                  items.reduce(
                    (sum, item) => sum + item.actualUnderstanding,
                    0
                  ) / items.length
                )
              : null,
          count: items.length,
        };
      }),
    [languageRecords]
  );

  // HELPERS
  const getLanguageName = (value: Language) =>
    languageOptions.find((item) => item.value === value)?.label ??
    String(value);

  const getSkillName = (value: Skill) =>
    skills.find((item) => item.id === value)?.label ?? String(value);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "—";

    const date =
      typeof timestamp.toDate === "function"
        ? timestamp.toDate()
        : new Date(timestamp);

    if (Number.isNaN(date.getTime())) return "—";

    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const updateForm = <K extends keyof FormData>(
    key: K,
    value: FormData[K]
  ) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const parseErrors = (value: string): ErrorItem[] =>
    value
      .split("\n")
      .map((line, index) => {
        const match = line.match(/^(.+?)[：:]\s*(\d+)$/);
        if (!match) return null;

        return {
          id: `error-${index}`,
          label: match[1].trim(),
          count: Math.max(0, Number(match[2])),
        };
      })
      .filter(
        (item): item is ErrorItem =>
          item !== null && item.label.length > 0
      );

  const parseDiscoveries = (value: string): DiscoveryItem[] =>
    value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, index) => {
        const parts = line.split(/[：:]/);

        return {
          id: `discovery-${index}`,
          title: parts[0].trim(),
          description: parts.slice(1).join("：").trim(),
        };
      });

  // NEW
  const openNewForm = () => {
    setEditingId(null);
    setForm({
      ...initialForm,
      language,
      skill: activeSkill === "overall" ? ("reading" as Skill) : activeSkill,
    });
    setShowForm(true);
  };

  // EDIT
  const openEditForm = (record: RealityRecord) => {
    setEditingId(record.id);

    setForm({
      language: record.language,
      skill: record.skill,
      title: record.title,
      confidence: record.confidence,
      actualUnderstanding: record.actualUnderstanding,
      errors: (record.errors ?? [])
        .map((item) => `${item.label}：${item.count}`)
        .join("\n"),
      discoveries: (record.discoveries ?? [])
        .map((item) =>
          item.description
            ? `${item.title}：${item.description}`
            : item.title
        )
        .join("\n"),
      nextAction: record.nextAction ?? "",
    });

    setShowForm(true);
  };

  // SAVE
  const handleSave = async () => {
    if (!uid) {
      alert("ログインが必要です。");
      return;
    }

    if (!form.title.trim()) {
      alert("教材名・課題名を入力してください。");
      return;
    }

    if (
      form.confidence < 0 ||
      form.confidence > 100 ||
      form.actualUnderstanding < 0 ||
      form.actualUnderstanding > 100
    ) {
      alert("理解度は0〜100で入力してください。");
      return;
    }

    setSaving(true);

    try {
      const recordData = {
        language: form.language,
        skill: form.skill,
        title: form.title.trim(),
        confidence: Number(form.confidence),
        actualUnderstanding: Number(form.actualUnderstanding),
        errors: parseErrors(form.errors),
        discoveries: parseDiscoveries(form.discoveries),
        nextAction: form.nextAction.trim(),
        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        await updateDoc(
          doc(db, "users", uid, "realityChecks", editingId),
          recordData
        );
      } else {
        await addDoc(
          collection(db, "users", uid, "realityChecks"),
          {
            ...recordData,
            createdAt: serverTimestamp(),
          }
        );
      }

      setLanguage(form.language);
      setActiveSkill(form.skill);
      setSelectedRecordId(null);
      setShowForm(false);
      setEditingId(null);
      setForm(initialForm);
    } catch (error) {
      console.error("Reality Check 保存エラー:", error);
      alert("保存できませんでした。Firestoreの設定を確認してください。");
    } finally {
      setSaving(false);
    }
  };

  // DELETE
  const handleDelete = async (id: string) => {
    if (!uid) return;

    const confirmed = window.confirm("この記録を削除しますか？");
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, "users", uid, "realityChecks", id));

      if (selectedRecordId === id) {
        setSelectedRecordId(null);
      }
    } catch (error) {
      console.error("Reality Check 削除エラー:", error);
      alert("削除できませんでした。");
    }
  };

  // LOADING
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F8FA]">
        <div className="text-center">
          <div
            className="w-10 h-10 border-[3px] border-slate-200 rounded-full animate-spin mx-auto"
            style={{ borderTopColor: themeColor }}
          />
          <p className="text-sm text-slate-400 mt-4">
            Loading Reality Check...
          </p>
        </div>
      </div>
    );
  }

  // LOGIN
  if (!uid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F8FA] p-6">
        <div className={`${cardClass} max-w-md w-full p-10 text-center`}>
          <Brain
            size={42}
            className="mx-auto mb-5"
            style={{ color: themeColor }}
          />
          <h2 className="text-xl font-bold mb-2">ログインしてください</h2>
          <p className="text-sm text-slate-500">
            Reality Checkを利用するにはログインが必要です。
          </p>
        </div>
      </div>
    );
  }

  const skillTabs = [
    ...skills,
    { id: "overall" as const, label: "すべて", icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#20263A]">
      <main className="max-w-[1450px] mx-auto px-4 py-5 md:px-7 md:py-7 lg:px-9 lg:py-9 space-y-6">

        {/* HEADER */}
        <header className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5 pl-12 md:pl-14">
          <div className="flex items-center gap-4 min-w-0">
            <div
              className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                background: `linear-gradient(135deg, ${themeColor}, var(--anki-theme-dark, #536D5B))`,
              }}
            >
              <Brain size={27} color="white" />
            </div>

            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Reality Check
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                理解したつもりと、実際の理解度を可視化する
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium hover:bg-slate-50"
              >
                <Globe size={17} style={{ color: themeColor }} />
                {getLanguageName(language)}
                <ChevronDown size={15} />
              </button>

              {showLanguageMenu && (
                <div className="absolute left-0 md:left-auto md:right-0 top-14 z-30 w-52 bg-white border border-slate-200 shadow-xl rounded-xl p-2">
                  {languageOptions.map((item) => (
                    <button
                      key={item.value}
                      onClick={() => {
                        setLanguage(item.value);
                        setActiveSkill("overall");
                        setSelectedRecordId(null);
                        setShowLanguageMenu(false);
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-lg text-sm hover:bg-slate-100"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={openNewForm}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-white text-sm font-semibold hover:opacity-90"
              style={{ backgroundColor: themeColor }}
            >
              <Plus size={18} />
              記録を追加
            </button>
          </div>
        </header>

        {/* SKILL FILTER - MOVED ABOVE SUMMARY */}
        <section className={`${cardClass} p-2`}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1">
            {skillTabs.map((skill) => {
              const Icon = skill.icon;
              const selected = activeSkill === skill.id;

              return (
                <button
                  key={skill.id}
                  onClick={() => {
                    setActiveSkill(skill.id);
                    setSelectedRecordId(null);
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl py-3 px-2 transition"
                  style={
                    selected
                      ? {
                          backgroundColor: themeLight,
                          color: themeDark,
                        }
                      : { color: "#64748b" }
                  }
                >
                  <Icon size={18} />
                  <span className="font-semibold text-sm">
                    {skill.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* SUMMARY CARDS */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className={`${cardClass} p-5 md:p-6`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500 font-medium">記録数</p>
                <p className="text-4xl font-bold mt-3 tabular-nums">
                  {languageRecords.length}
                  <span className="text-base font-normal text-slate-400 ml-2">
                    件
                  </span>
                </p>
              </div>
              <Activity size={22} className="text-slate-400" />
            </div>
            <p className="text-xs text-slate-400 mt-4">
              {getLanguageName(language)}の検証記録
            </p>
          </div>

          <div className={`${cardClass} p-5 md:p-6`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500 font-medium">平均理解度</p>
                <p className="text-4xl font-bold mt-3 tabular-nums">
                  {overallAverage === null ? "—" : `${overallAverage}%`}
                </p>
              </div>
              <TrendingUp size={22} style={{ color: themeColor }} />
            </div>
            <p className="text-xs text-slate-400 mt-4">
              実際の理解度の平均
            </p>
          </div>

          <div className={`${cardClass} p-5 md:p-6`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500 font-medium">平均ギャップ</p>
                <p
                  className={`text-4xl font-bold mt-3 tabular-nums ${
                    averageGap !== null && averageGap > 0
                      ? "text-orange-500"
                      : "text-slate-800"
                  }`}
                >
                  {averageGap === null
                    ? "—"
                    : `${averageGap > 0 ? "+" : ""}${averageGap}pt`}
                </p>
              </div>
              <Target size={22} className="text-orange-400" />
            </div>
            <p className="text-xs text-slate-400 mt-4">
              自己評価 − 実際の理解度
            </p>
          </div>
        </section>

        {/* ANALYSIS */}
        {selectedRecord ? (
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.8fr)] gap-4">
            <section className={`${cardClass} p-5 md:p-7`}>
              <div className="flex flex-wrap justify-between items-start gap-3 mb-8">
                <div>
                  <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                    Latest analysis
                  </p>
                  <h2 className="text-xl font-bold mt-2">
                    {selectedRecord.title}
                  </h2>
                  <p className="text-xs text-slate-400 mt-2">
                    {formatDate(selectedRecord.createdAt)}
                    {" · "}
                    {getSkillName(selectedRecord.skill)}
                  </p>
                </div>

                <button
                  onClick={() => openEditForm(selectedRecord)}
                  className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2 text-sm hover:bg-slate-50"
                >
                  <Pencil size={15} />
                  編集
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="rounded-2xl bg-[#F7F8FA] p-5 md:p-6">
                  <p className="text-sm font-medium text-slate-500">自己評価</p>
                  <div
                    className="text-5xl md:text-6xl font-bold mt-4 tabular-nums"
                    style={{ color: themeColor }}
                  >
                    {selectedRecord.confidence}%
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 mt-5 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${selectedRecord.confidence}%`,
                        backgroundColor: themeColor,
                      }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-3">
                    自分ではどれくらい理解したと思ったか
                  </p>
                </div>

                <div className="rounded-2xl bg-[#F7F8FA] p-5 md:p-6">
                  <p className="text-sm font-medium text-slate-500">
                    実際の理解度
                  </p>
                  <div className="text-5xl md:text-6xl font-bold mt-4 text-orange-500 tabular-nums">
                    {selectedRecord.actualUnderstanding}%
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 mt-5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-orange-400"
                      style={{
                        width: `${selectedRecord.actualUnderstanding}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-3">
                    問題演習などで確認した理解度
                  </p>
                </div>
              </div>

              <div
                className="mt-5 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4"
                style={{
                  backgroundColor:
                    selectedRecord.confidence >
                    selectedRecord.actualUnderstanding
                      ? "#FFF7ED"
                      : themeLight,
                }}
              >
                <div>
                  <p className="text-sm font-semibold text-slate-600">
                    理解度のギャップ
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    自己評価と実際の理解度の差
                  </p>
                </div>
                <div
                  className="text-3xl font-bold tabular-nums"
                  style={{
                    color:
                      selectedRecord.confidence >
                      selectedRecord.actualUnderstanding
                        ? "#EA580C"
                        : themeDark,
                  }}
                >
                  {selectedRecord.confidence -
                    selectedRecord.actualUnderstanding >
                  0
                    ? "+"
                    : ""}
                  {selectedRecord.confidence -
                    selectedRecord.actualUnderstanding}
                  <span className="text-base ml-1">pt</span>
                </div>
              </div>

              <div className="mt-8">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="font-bold text-lg">つまずいたポイント</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      理解できなかった項目と件数
                    </p>
                  </div>
                  <AlertCircle size={20} className="text-slate-400" />
                </div>

                {selectedRecord.errors?.length ? (
                  <div className="space-y-4">
                    {selectedRecord.errors.map((error, index) => {
                      const total = selectedRecord.errors.reduce(
                        (sum, item) => sum + item.count,
                        0
                      );
                      const percentage =
                        total > 0 ? (error.count / total) * 100 : 0;

                      return (
                        <div key={error.id} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-700 font-medium">
                              {error.label}
                            </span>
                            <span className="text-slate-500 tabular-nums">
                              {error.count}件 · {Math.round(percentage)}%
                            </span>
                          </div>
                          <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor:
                                  index === 0 ? themeColor : "#AAB8AE",
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 py-5">
                    つまずいた項目は登録されていません。
                  </p>
                )}
              </div>
            </section>

            <section className={`${cardClass} overflow-hidden`}>
              <div
                className="px-5 py-5 border-b border-slate-100"
                style={{ backgroundColor: themeLight }}
              >
                <div className="flex items-center gap-3">
                  <Lightbulb size={22} style={{ color: themeDark }} />
                  <h2 className="font-bold text-lg">分析メモ</h2>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  検証から得られた気づき
                </p>
              </div>

              <div className="p-5 space-y-5">
                {selectedRecord.discoveries?.length ? (
                  selectedRecord.discoveries.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <CheckCircle2
                        size={19}
                        className="text-emerald-500 shrink-0 mt-0.5"
                      />
                      <div>
                        <p className="font-semibold text-sm">{item.title}</p>
                        {item.description && (
                          <p className="text-sm text-slate-500 leading-6 mt-1">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">
                    気づきはまだ登録されていません。
                  </p>
                )}

                <div className="border-t border-slate-100 pt-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Target size={19} style={{ color: themeColor }} />
                    <h3 className="font-bold text-sm">次に取り組むこと</h3>
                  </div>
                  <div
                    className="rounded-xl p-4 text-sm leading-6 text-slate-700"
                    style={{ backgroundColor: themeLight }}
                  >
                    {selectedRecord.nextAction ||
                      "次の学習目標はまだ設定されていません。"}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <button
                    onClick={() => handleDelete(selectedRecord.id)}
                    className="flex items-center gap-2 text-sm text-slate-400 hover:text-red-500 transition"
                  >
                    <Trash2 size={16} />
                    この記録を削除
                  </button>
                </div>
              </div>
            </section>
          </div>
        ) : (
          <section className={`${cardClass} p-10 md:p-16 text-center`}>
            <div
              className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-5"
              style={{ backgroundColor: themeLight }}
            >
              <BookOpen size={29} style={{ color: themeColor }} />
            </div>
            <h2 className="text-xl font-bold">
              まだ分析データがありません
            </h2>
            <p className="text-sm text-slate-500 mt-3 leading-6">
              最初の検証結果を記録すると、理解度の比較や技能別の分析が表示されます。
            </p>
            <button
              onClick={openNewForm}
              className="mt-6 px-6 py-3 rounded-xl text-white text-sm font-semibold"
              style={{ backgroundColor: themeColor }}
            >
              <Plus size={17} className="inline mr-2" />
              最初の記録を追加
            </button>
          </section>
        )}

        {/* SKILL BALANCE */}
        <section className={`${cardClass} p-5 md:p-7`}>
          <div className="flex items-center justify-between mb-7">
            <div>
              <h2 className="text-lg font-bold">スキル別の理解度</h2>
              <p className="text-xs text-slate-400 mt-1">
                各技能の実際の理解度の平均
              </p>
            </div>
            <BarChart3 size={22} style={{ color: themeColor }} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
            {skillScores.map((skill) => {
              const Icon = skill.icon;

              return (
                <div key={skill.id}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Icon size={19} className="text-slate-500" />
                      <span className="font-semibold text-sm">
                        {skill.label}
                      </span>
                    </div>
                    <span className="font-bold text-lg tabular-nums">
                      {skill.score === null ? "—" : `${skill.score}%`}
                    </span>
                  </div>

                  <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${skill.score ?? 0}%`,
                        backgroundColor: themeColor,
                      }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    {skill.count}件の記録
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* HISTORY */}
        <section className={`${cardClass} p-5 md:p-7`}>
          <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
            <div>
              <h2 className="text-lg font-bold">検証履歴</h2>
              <p className="text-xs text-slate-400 mt-1">
                過去の記録を選択して詳細を確認できます。
              </p>
            </div>
            <span className="text-xs text-slate-500 bg-slate-100 px-3 py-2 rounded-lg">
              {filteredRecords.length} records
            </span>
          </div>

          {filteredRecords.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                    <th className="py-3 px-3 font-medium">教材・課題</th>
                    <th className="py-3 px-3 font-medium">技能</th>
                    <th className="py-3 px-3 font-medium">自己評価</th>
                    <th className="py-3 px-3 font-medium">実際の理解度</th>
                    <th className="py-3 px-3 font-medium">ギャップ</th>
                    <th className="py-3 px-3 font-medium">日付</th>
                    <th className="py-3 px-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((item) => {
                    const gap =
                      item.confidence - item.actualUnderstanding;

                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedRecordId(item.id)}
                        className={`border-b border-slate-50 cursor-pointer transition ${
                          selectedRecordId === item.id
                            ? "bg-slate-50"
                            : "hover:bg-slate-50/70"
                        }`}
                      >
                        <td className="py-4 px-3 font-semibold">
                          {item.title}
                        </td>
                        <td className="py-4 px-3 text-slate-500">
                          {getSkillName(item.skill)}
                        </td>
                        <td className="py-4 px-3 tabular-nums">
                          {item.confidence}%
                        </td>
                        <td className="py-4 px-3 font-semibold tabular-nums">
                          {item.actualUnderstanding}%
                        </td>
                        <td className="py-4 px-3">
                          <span
                            className={`font-semibold tabular-nums ${
                              gap > 0
                                ? "text-orange-500"
                                : "text-emerald-600"
                            }`}
                          >
                            {gap > 0 ? "+" : ""}
                            {gap}pt
                          </span>
                        </td>
                        <td className="py-4 px-3 text-slate-400 text-xs">
                          {formatDate(item.createdAt)}
                        </td>
                        <td className="py-4 px-3">
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              openEditForm(item);
                            }}
                            className="p-2 rounded-lg hover:bg-slate-200 transition"
                            title="編集"
                          >
                            <Pencil size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-sm text-slate-400 py-10">
              該当する記録はありません。
            </p>
          )}
        </section>

        <footer className="text-center text-xs text-slate-400 py-5">
          Reality Check · Understand what you really understand.
        </footer>
      </main>

      {/* INPUT MODAL */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-3 md:p-6"
          onClick={() => {
            if (!saving) setShowForm(false);
          }}
        >
          <div
            className="bg-white w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-slate-100 px-6 py-5 flex justify-between items-center z-10">
              <div>
                <h2 className="text-xl font-bold">
                  {editingId ? "記録を編集" : "新しい検証を記録"}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  自分の理解度を記録しましょう。
                </p>
              </div>
              <button
                onClick={() => setShowForm(false)}
                disabled={saving}
                className="p-2 rounded-full hover:bg-slate-100"
              >
                <X size={21} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  学習言語
                </label>
                <select
                  className={inputClass}
                  value={form.language}
                  onChange={(event) =>
                    updateForm("language", event.target.value as Language)
                  }
                >
                  {languageOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  対象技能
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {skills.map((skill) => {
                    const Icon = skill.icon;
                    const selected = form.skill === skill.id;

                    return (
                      <button
                        type="button"
                        key={skill.id}
                        onClick={() => updateForm("skill", skill.id)}
                        className="flex flex-col items-center gap-2 border rounded-xl p-3 transition"
                        style={
                          selected
                            ? {
                                borderColor: themeColor,
                                backgroundColor: themeLight,
                                color: themeDark,
                              }
                            : {
                                borderColor: "#e2e8f0",
                                color: "#64748b",
                              }
                        }
                      >
                        <Icon size={21} />
                        <span className="text-xs font-semibold">
                          {skill.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  教材・文章・課題名
                </label>
                <input
                  className={inputClass}
                  value={form.title}
                  onChange={(event) =>
                    updateForm("title", event.target.value)
                  }
                  placeholder="例：HSK読解問題、ドイツ語ニュース..."
                />
              </div>

              <div className="rounded-2xl bg-[#F7F8FA] p-5 space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <label className="font-semibold text-sm">
                        自己評価
                      </label>
                      <p className="text-xs text-slate-400 mt-1">
                        解答・確認する前の予想
                      </p>
                    </div>
                    <span
                      className="text-3xl font-bold tabular-nums"
                      style={{ color: themeColor }}
                    >
                      {form.confidence}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={form.confidence}
                    onChange={(event) =>
                      updateForm("confidence", Number(event.target.value))
                    }
                    className="w-full cursor-pointer"
                    style={{ accentColor: themeColor }}
                  />
                </div>

                <div className="border-t border-slate-200 pt-5">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <label className="font-semibold text-sm">
                        実際の理解度
                      </label>
                      <p className="text-xs text-slate-400 mt-1">
                        問題演習・再現・説明などによる検証結果
                      </p>
                    </div>
                    <span className="text-3xl font-bold text-orange-500 tabular-nums">
                      {form.actualUnderstanding}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={form.actualUnderstanding}
                    onChange={(event) =>
                      updateForm(
                        "actualUnderstanding",
                        Number(event.target.value)
                      )
                    }
                    className="w-full cursor-pointer accent-orange-500"
                  />
                </div>

                <div className="border-t border-slate-200 pt-4 flex justify-between items-center">
                  <span className="text-sm text-slate-500">
                    理解度の差
                  </span>
                  <span
                    className={`text-xl font-bold tabular-nums ${
                      form.confidence > form.actualUnderstanding
                        ? "text-orange-500"
                        : "text-emerald-600"
                    }`}
                  >
                    {form.confidence - form.actualUnderstanding > 0
                      ? "+"
                      : ""}
                    {form.confidence - form.actualUnderstanding}pt
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  つまずいたポイント
                </label>
                <p className="text-xs text-slate-400 mb-2">
                  1行につき1項目。「項目名：件数」で入力します。
                </p>
                <textarea
                  className={inputClass}
                  rows={4}
                  value={form.errors}
                  onChange={(event) =>
                    updateForm("errors", event.target.value)
                  }
                  placeholder={"語彙：3\n文法：2\n推論・論理：1"}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  今回の気づき
                </label>
                <p className="text-xs text-slate-400 mb-2">
                  1行につき1つの気づき。必要なら「タイトル：説明」と入力します。
                </p>
                <textarea
                  className={inputClass}
                  rows={4}
                  value={form.discoveries}
                  onChange={(event) =>
                    updateForm("discoveries", event.target.value)
                  }
                  placeholder="文脈から単語の意味を推測できた：未知語があっても内容を把握できた"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  次に取り組むこと
                </label>
                <textarea
                  className={inputClass}
                  rows={3}
                  value={form.nextAction}
                  onChange={(event) =>
                    updateForm("nextAction", event.target.value)
                  }
                  placeholder="次回の学習で意識したいこと..."
                />
              </div>

              <button
                onClick={handleSave}
                disabled={saving || !form.title.trim()}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-white font-semibold transition hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: themeColor }}
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    {editingId ? "変更を保存" : "検証結果を保存"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
