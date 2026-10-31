
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { saveRealityCheck } from "@/lib/understanding/firestore";
import type { Language, ErrorCategory } from "@/lib/understanding/types";
import {
  ArrowLeft,
  BookOpen,
  Headphones,
  PenLine,
  Mic,
  ChevronDown,
  Check,
  ClipboardCheck,
  RotateCcw,
} from "lucide-react";

type Skill = "reading" | "listening" | "writing" | "speaking";

const skills: {
  id: Skill;
  label: string;
  description: string;
  icon: typeof BookOpen;
}[] = [
  {
    id: "reading",
    label: "Reading",
    description: "文章を読んで理解する",
    icon: BookOpen,
  },
  {
    id: "listening",
    label: "Listening",
    description: "音声を聞いて理解する",
    icon: Headphones,
  },
  {
    id: "writing",
    label: "Writing",
    description: "文章を組み立てて表現する",
    icon: PenLine,
  },
  {
    id: "speaking",
    label: "Speaking",
    description: "自分の言葉で伝える",
    icon: Mic,
  },
];

const errorCategories = [
  { id: "vocabulary", label: "語彙", description: "単語の意味・使い方が分からなかった" },
  { id: "grammar", label: "文法", description: "文法や文の構造を誤解した" },
  { id: "structure", label: "構造", description: "文章全体の組み立てを誤解した" },
  { id: "inference", label: "推論", description: "筆者の意図や因果関係を読み違えた" },
  { id: "context", label: "文脈", description: "前後関係から意味を判断できなかった" },
  { id: "recall", label: "想起", description: "知っている知識を思い出せなかった" },
  { id: "pronunciation", label: "音声認識", description: "音を正しく聞き取れなかった" },
  { id: "fluency", label: "流暢さ", description: "言いたいことをすぐに言葉にできなかった" },
  { id: "expression", label: "表現", description: "意味は分かるが自然に表現できなかった" },
  { id: "other", label: "その他", description: "上記以外の問題" },
];

const languageLabels: Record<string, string> = {
  zh: "中国語",
  de: "ドイツ語",
  es: "スペイン語",
  ko: "韓国語",
  it: "イタリア語",
  ja: "日本語",
};

export default function NewUnderstandingAnalysisPage() {
  const [language, setLanguage] = useState("zh");
  const [skill, setSkill] = useState<Skill>("reading");
  const [title, setTitle] = useState("");
  const [confidence, setConfidence] = useState(80);
  const [actualUnderstanding, setActualUnderstanding] = useState(60);
  const [selectedErrors, setSelectedErrors] = useState<string[]>([]);
  const [memo, setMemo] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);

  const gap = confidence - actualUnderstanding;

  const selectedSkill = skills.find((item) => item.id === skill);

  const selectedErrorLabels = useMemo(
    () =>
      errorCategories
        .filter((item) => selectedErrors.includes(item.id))
        .map((item) => item.label),
    [selectedErrors]
  );

  function toggleError(id: string) {
    setSelectedErrors((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setShowPreview(true);
  }

  async function handleSave() {
    setSaving(true);
    setSaveError("");

    try {
      const errors = errorCategories
        .filter((item) => selectedErrors.includes(item.id))
        .map((item) => ({
          category: item.id as ErrorCategory,
          label: item.label,
          description: item.description,
          count: 1,
        }));

      await saveRealityCheck({
        language: language as Language,
        skill,
        title,
        confidence,
        actualUnderstanding,
        gap,
        errors,
        memo,
      });

      setSaved(true);
    } catch (error) {
      console.error("Reality Check save error:", error);
      setSaveError(
        error instanceof Error ? error.message : "保存に失敗しました。"
      );
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setTitle("");
    setConfidence(80);
    setActualUnderstanding(60);
    setSelectedErrors([]);
    setMemo("");
    setShowPreview(false);
    setSaved(false);
    setSaveError("");
  }

  return (
    <main className="min-h-screen bg-[#f7f8f6] px-5 py-8 text-[#303a35] md:px-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/understanding-analytics"
            className="inline-flex items-center gap-2 text-sm text-[var(--anki-theme-dark)] transition hover:opacity-75"
          >
            <ArrowLeft size={16} />
            Reality Check に戻る
          </Link>

          <Link
            href="/understanding-analytics/guide"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--anki-theme-soft)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--anki-theme-dark)] transition hover:bg-[var(--anki-theme-light)]"
          >
            <BookOpen size={16} />
            使い方ガイド
          </Link>
        </div>

        <div className="mb-8">
          <p className="mb-2 text-xs font-semibold tracking-[0.2em] text-[var(--anki-theme-dark)]">
            REALITY CHECK / NEW ANALYSIS
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            新しい分析を記録
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#849087]">
            自分がどれくらい理解できたと思ったか。
            そして、実際にはどれくらい理解できていたか。
            その差を記録していきましょう。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 01 Language */}
          <section className="rounded-2xl border border-[#e7ebe6] bg-white p-6 shadow-sm">
            <div className="mb-4">
              <p className="text-xs font-semibold tracking-wider text-[var(--anki-theme-dark)]">
                01 / LANGUAGE
              </p>
              <h2 className="mt-1 text-lg font-semibold">対象言語</h2>
            </div>

            <div className="relative">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full appearance-none rounded-xl border border-[#e5eae4] bg-[#fafbf9] px-4 py-3 text-sm outline-none transition focus:border-[var(--anki-theme-color)]"
              >
                <option value="zh">中国語（簡体字・繁体字）</option>
                <option value="de">ドイツ語</option>
                <option value="es">スペイン語</option>
                <option value="ko">韓国語</option>
                <option value="it">イタリア語</option>
                <option value="ja">日本語</option>
              </select>
              <ChevronDown
                size={17}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#8b978e]"
              />
            </div>
          </section>

          {/* 02 Skill */}
          <section className="rounded-2xl border border-[#e7ebe6] bg-white p-6 shadow-sm">
            <div className="mb-4">
              <p className="text-xs font-semibold tracking-wider text-[var(--anki-theme-dark)]">
                02 / SKILL
              </p>
              <h2 className="mt-1 text-lg font-semibold">
                分析するスキル
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {skills.map((item) => {
                const Icon = item.icon;
                const active = skill === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSkill(item.id)}
                    className={`rounded-xl border p-4 text-left transition ${
                      active
                        ? "border-[var(--anki-theme-color)] bg-[var(--anki-theme-light)] text-[var(--anki-theme-dark)]"
                        : "border-[#e9ece8] bg-white text-[#7b877e] hover:bg-[#fafbf9]"
                    }`}
                  >
                    <Icon size={20} className="mb-3" />
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className="mt-1 text-xs leading-5 opacity-75">
                      {item.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 03 Material */}
          <section className="rounded-2xl border border-[#e7ebe6] bg-white p-6 shadow-sm">
            <div className="mb-4">
              <p className="text-xs font-semibold tracking-wider text-[var(--anki-theme-dark)]">
                03 / MATERIAL
              </p>
              <h2 className="mt-1 text-lg font-semibold">分析対象</h2>
            </div>

            <label className="mb-2 block text-sm text-[#66746a]">
              教材・文章・音声のタイトル
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例：中国語ニュースの記事"
              required
              className="w-full rounded-xl border border-[#e5eae4] bg-[#fafbf9] px-4 py-3 text-sm outline-none transition focus:border-[var(--anki-theme-color)]"
            />
          </section>

          {/* 04 Confidence */}
          <section className="rounded-2xl border border-[#e7ebe6] bg-white p-6 shadow-sm">
            <div className="mb-4">
              <p className="text-xs font-semibold tracking-wider text-[var(--anki-theme-dark)]">
                04 / CONFIDENCE
              </p>
              <h2 className="mt-1 text-lg font-semibold">
                自分の理解度予測
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#849087]">
                答え合わせや分析をする前、自分では何％理解できたと思いましたか？
              </p>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-[#77847b]">自信度</span>
              <span className="text-3xl font-semibold tabular-nums text-[var(--anki-theme-dark)]">
                {confidence}%
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={confidence}
              onChange={(e) => setConfidence(Number(e.target.value))}
              className="mt-4 w-full accent-[var(--anki-theme-color)]"
            />

            <div className="mt-1 flex justify-between text-xs text-[#a0aaa2]">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </section>

          {/* 05 Actual understanding */}
          <section className="rounded-2xl border border-[#e7ebe6] bg-white p-6 shadow-sm">
            <div className="mb-4">
              <p className="text-xs font-semibold tracking-wider text-[var(--anki-theme-dark)]">
                05 / ACTUAL UNDERSTANDING
              </p>
              <h2 className="mt-1 text-lg font-semibold">
                実際の理解度
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#849087]">
                答え合わせや説明、内容の再現などを通して確認した実際の理解度を入力します。
              </p>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-[#77847b]">実際の理解度</span>
              <span className="text-3xl font-semibold tabular-nums text-[var(--anki-theme-dark)]">
                {actualUnderstanding}%
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={actualUnderstanding}
              onChange={(e) =>
                setActualUnderstanding(Number(e.target.value))
              }
              className="mt-4 w-full accent-[var(--anki-theme-color)]"
            />

            <div className="mt-1 flex justify-between text-xs text-[#a0aaa2]">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>

            <div className="mt-6 rounded-xl bg-[var(--anki-theme-light)] p-4">
              <p className="text-xs text-[#849087]">
                自信度と実際の理解度の差
              </p>

              <div className="mt-2 flex items-end justify-between gap-3">
                <span className="text-sm text-[#65746a]">
                  {gap > 0
                    ? "理解度を高く見積もっています"
                    : gap < 0
                      ? "実際の理解度が予測を上回っています"
                      : "予測と実際の理解度が一致しています"}
                </span>

                <span
                  className={`text-2xl font-semibold tabular-nums ${
                    gap > 0
                      ? "text-[#b47c58]"
                      : gap < 0
                        ? "text-[#62866d]"
                        : "text-[var(--anki-theme-dark)]"
                  }`}
                >
                  {gap > 0 ? "+" : ""}
                  {gap}pt
                </span>
              </div>
            </div>
          </section>

          {/* 06 Errors */}
          <section className="rounded-2xl border border-[#e7ebe6] bg-white p-6 shadow-sm">
            <div className="mb-4">
              <p className="text-xs font-semibold tracking-wider text-[var(--anki-theme-dark)]">
                06 / ERROR CATEGORIES
              </p>
              <h2 className="mt-1 text-lg font-semibold">
                発見した問題・誤解
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#849087]">
                今回の分析で発見した問題を選んでください。複数選択できます。
              </p>
            </div>

            <div className="space-y-2">
              {errorCategories.map((item) => {
                const checked = selectedErrors.includes(item.id);

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleError(item.id)}
                    className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                      checked
                        ? "border-[var(--anki-theme-color)] bg-[var(--anki-theme-light)]"
                        : "border-[#e9ece8] bg-white hover:bg-[#fafbf9]"
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                        checked
                          ? "border-[var(--anki-theme-color)] bg-[var(--anki-theme-color)] text-white"
                          : "border-[#d9dfd8] bg-white"
                      }`}
                    >
                      {checked && <Check size={13} />}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-[#46554a]">
                        {item.label}
                      </span>
                      <span className="mt-0.5 block text-xs text-[#929c94]">
                        {item.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 07 Memo */}
          <section className="rounded-2xl border border-[#e7ebe6] bg-white p-6 shadow-sm">
            <div className="mb-4">
              <p className="text-xs font-semibold tracking-wider text-[var(--anki-theme-dark)]">
                07 / REFLECTION
              </p>
              <h2 className="mt-1 text-lg font-semibold">分析メモ</h2>
              <p className="mt-2 text-sm leading-6 text-[#849087]">
                どこでつまずいたのか、なぜ誤解したのか、気づいたことを記録します。
              </p>
            </div>

            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={5}
              placeholder="例：単語の意味は知っていたが、文脈に合った意味を選べなかった..."
              className="w-full resize-y rounded-xl border border-[#e5eae4] bg-[#fafbf9] px-4 py-3 text-sm leading-6 outline-none transition focus:border-[var(--anki-theme-color)]"
            />
          </section>

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--anki-theme-color)] px-6 py-4 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
          >
            <ClipboardCheck size={18} />
            分析内容を確認する
          </button>
        </form>

        {/* Preview */}
        {showPreview && (
          <section className="mt-8 rounded-2xl border border-[var(--anki-theme-soft)] bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--anki-theme-light)] text-[var(--anki-theme-dark)]">
                <Check size={20} />
              </div>
              <div>
                <p className="text-xs font-semibold tracking-wider text-[var(--anki-theme-dark)]">
                  ANALYSIS PREVIEW
                </p>
                <h2 className="text-lg font-semibold">
                  記録内容の確認
                </h2>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-[#929c94]">対象</p>
                <p className="mt-1 text-sm font-medium">
                  {languageLabels[language]} / {selectedSkill?.label}
                </p>
                <p className="mt-1 text-sm text-[#66746a]">{title}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[#f5f7f4] p-4">
                  <p className="text-xs text-[#849087]">自信度</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">
                    {confidence}%
                  </p>
                </div>
                <div className="rounded-xl bg-[#f5f7f4] p-4">
                  <p className="text-xs text-[#849087]">実際の理解度</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">
                    {actualUnderstanding}%
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-[var(--anki-theme-light)] p-4">
                <p className="text-xs text-[#849087]">理解度の認識ギャップ</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-[#a27655]">
                  {gap > 0 ? "+" : ""}
                  {gap}pt
                </p>
                <p className="mt-1 text-xs text-[#849087]">
                  {gap > 0
                    ? "実際よりも理解できていると感じていた可能性があります。"
                    : gap < 0
                      ? "自分の予測よりも実際の理解度が高い結果です。"
                      : "自己評価と実際の理解度が一致しています。"}
                </p>
              </div>

              <div>
                <p className="text-xs text-[#929c94]">発見した問題</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedErrorLabels.length > 0 ? (
                    selectedErrorLabels.map((label) => (
                      <span
                        key={label}
                        className="rounded-full bg-[var(--anki-theme-light)] px-3 py-1.5 text-xs text-[var(--anki-theme-dark)]"
                      >
                        {label}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-[#929c94]">
                      問題カテゴリーは選択されていません。
                    </p>
                  )}
                </div>
              </div>

              {memo.trim() && (
                <div>
                  <p className="text-xs text-[#929c94]">分析メモ</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#66746a]">
                    {memo}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || saved}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--anki-theme-color)] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "保存中..." : saved ? "保存しました" : "分析結果を保存"}
              </button>

              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="flex flex-1 items-center justify-center rounded-xl border border-[var(--anki-theme-soft)] px-4 py-3 text-sm font-medium text-[var(--anki-theme-dark)] transition hover:bg-[var(--anki-theme-light)]"
              >
                入力内容を修正する
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--anki-theme-color)] px-4 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                <RotateCcw size={15} />
                新しい分析を入力
              </button>
            </div>

            {saved && (
              <p className="mt-4 text-sm font-medium text-[var(--anki-theme-dark)]">
                分析結果を保存しました！
              </p>
            )}

            {saveError && (
              <p className="mt-4 text-sm font-medium text-red-600">
                {saveError}
              </p>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
