
"use client";

import { useState } from "react";
import {
  Brain,
  BookOpen,
  Headphones,
  PenLine,
  Mic,
  BarChart3,
  ShieldCheck,
  Lightbulb,
  Target,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  Globe,
  Bookmark,
  ArrowRight,
} from "lucide-react";

import { mockRealityCheckData } from "@/lib/understanding/mock-data";
import type { Skill, Language } from "@/lib/understanding/types";

const skills = [
  { id: "reading" as Skill, label: "読解", icon: BookOpen },
  { id: "listening" as Skill, label: "リスニング", icon: Headphones },
  { id: "writing" as Skill, label: "ライティング", icon: PenLine },
  { id: "speaking" as Skill, label: "スピーキング", icon: Mic },
];

const languageOptions: { value: Language; label: string }[] = [
  { value: "zh", label: "中国語（簡体字）" },
  { value: "de", label: "ドイツ語" },
  { value: "es", label: "スペイン語" },
  { value: "ko", label: "韓国語" },
  { value: "it", label: "イタリア語" },
  { value: "ja", label: "日本語" },
];

const categoryLabels: Record<string, string> = {
  vocabulary: "語彙",
  grammar: "文法",
  structure: "文構造",
  inference: "推論・論理",
  context: "文脈",
  recall: "想起・記憶",
  pronunciation: "発音",
  fluency: "流暢さ",
  expression: "表現",
  other: "その他",
};

export default function UnderstandingAnalyticsPage() {
  const [activeSkill, setActiveSkill] = useState<Skill>("reading");
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [language, setLanguage] = useState<Language>(
    mockRealityCheckData.language
  );

  const selectedLanguage =
    languageOptions.find((item) => item.value === language) ??
    languageOptions[0];

  const currentAnalysis = mockRealityCheckData.analyses.find(
    (item) => item.skill === activeSkill
  );

  const data = currentAnalysis ?? mockRealityCheckData.analyses[0];

  const gap = data.confidence - data.actualUnderstanding;

  const skillScores = skills.map((skill) => {
    const analysis = mockRealityCheckData.analyses.find(
      (item) => item.skill === skill.id
    );

    return {
      ...skill,
      score: analysis?.actualUnderstanding ?? 0,
    };
  });

  const history = mockRealityCheckData.history.filter(
    (item) => item.skill === activeSkill
  );

  const latestHistory = history.slice(-3);

  const maxErrorCount = Math.max(
    ...data.errors.map((error) => error.count),
    1
  );

  const themeColor = "var(--anki-theme-color)";
  const themeDark = "var(--anki-theme-dark)";
  const themeLight = "var(--anki-theme-light)";
  const themeSoft = "var(--anki-theme-soft)";

  return (
    <div className="min-h-screen bg-[#F5F6FA] text-[#20263A]">
      <main className="w-full min-w-0 p-4 md:p-7 lg:p-8">
        <div className="max-w-[1500px] mx-auto space-y-5">

          {/* Header */}
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center shadow-lg"
                style={{
                  background: `linear-gradient(135deg, var(--anki-theme-color), var(--anki-theme-dark))`,
                  boxShadow: `0 8px 24px var(--anki-theme-soft)`,
                }}
              >
                <Brain size={42} className="text-white" />
              </div>

              <div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                  Reality Check
                </h1>
                <p className="text-sm md:text-base text-slate-500 mt-1">
                  わかったつもりを検知し、本当の理解を見つけよう
                </p>
              </div>
            </div>

            {/* Language selector */}
            <div className="relative">
              <button
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-3 text-sm shadow-sm hover:bg-slate-50 transition"
              >
                <Globe size={18} style={{ color: themeColor }} />
                {selectedLanguage.label}
                <ChevronDown size={16} />
              </button>

              {showLanguageMenu && (
                <div className="absolute right-0 top-14 z-20 bg-white border border-slate-200 shadow-xl rounded-xl p-2 w-52">
                  {languageOptions.map((lang) => (
                    <button
                      key={lang.value}
                      onClick={() => {
                        setLanguage(lang.value);
                        setShowLanguageMenu(false);
                      }}
                      className="block w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-slate-100"
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </header>

          {/* Skill tabs */}
          <section className="bg-white rounded-2xl border border-slate-200 p-2 shadow-sm">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {skills.map((skill) => {
                const Icon = skill.icon;
                const selected = activeSkill === skill.id;

                return (
                  <button
                    key={skill.id}
                    onClick={() => setActiveSkill(skill.id)}
                    className="flex items-center justify-center gap-3 rounded-xl py-3 px-2 transition"
                    style={
                      selected
                        ? {
                            backgroundColor: themeColor,
                            color: "#fff",
                            boxShadow: "0 4px 12px var(--anki-theme-soft)",
                          }
                        : {
                            color: "#64748b",
                          }
                    }
                  >
                    <Icon size={24} />
                    <span className="text-left">
                      <span className="block font-bold text-sm">
                        {skill.label}
                      </span>
                      <span
                        className="text-xs"
                        style={{
                          color: selected ? "#E8EFE9" : "#94a3b8",
                        }}
                      >
                        {skill.id}
                      </span>
                    </span>
                  </button>
                );
              })}

              <button
                onClick={() => setActiveSkill("reading")}
                className="flex items-center justify-center gap-2 rounded-xl py-3 text-slate-600 hover:bg-slate-100 transition"
              >
                <BarChart3 size={23} style={{ color: themeColor }} />
                <span className="text-sm font-bold">総合分析</span>
              </button>
            </div>
          </section>

          {/* Main result grid */}
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(280px,0.9fr)] gap-4">

            {/* Result */}
            <section className="bg-white rounded-2xl border border-slate-200 p-5 md:p-7 shadow-sm">
              <div className="flex items-center gap-3 mb-7">
                <BookOpen size={27} style={{ color: themeColor }} />
                <h2 className="text-xl font-bold">今回の検証結果</h2>
                <span className="ml-auto text-xs text-slate-400">
                  サンプルデータ
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
                <div className="text-center">
                  <p className="font-bold text-slate-700">自己評価</p>
                  <p className="text-xs text-slate-400">
                    （理解したつもり）
                  </p>
                  <div
                    className="text-6xl md:text-7xl font-bold mt-2 tabular-nums"
                    style={{ color: themeColor }}
                  >
                    {data.confidence}
                    <span className="text-3xl">%</span>
                  </div>
                </div>

                <ArrowRight
                  className="hidden md:block text-slate-300"
                  size={38}
                />

                <div className="text-center">
                  <p className="font-bold text-slate-700">実際の理解度</p>
                  <p className="text-xs text-slate-400">（検証結果）</p>
                  <div className="text-6xl md:text-7xl font-bold text-orange-500 mt-2 tabular-nums">
                    {data.actualUnderstanding}
                    <span className="text-3xl">%</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 bg-orange-50 border border-orange-100 rounded-2xl p-5 flex flex-col md:flex-row gap-4 items-center">
                <AlertTriangle
                  size={42}
                  className="text-orange-500 shrink-0"
                />
                <div>
                  <h3 className="text-xl font-bold text-orange-600">
                    {gap > 0 ? "わかったつもりでした！" : "理解度を確認できました"}
                  </h3>
                  <p className="text-sm text-slate-700 mt-2">
                    自信と実力に <strong>{gap}ポイント</strong> のギャップがあります。
                    もう一度、内容を確認してみましょう。
                  </p>
                </div>
              </div>

              {/* Errors */}
              <div className="mt-7">
                <h3 className="font-bold text-lg mb-5">
                  どこでつまずいた？
                  <span className="text-sm font-normal text-slate-400">
                    （誤解の内訳）
                  </span>
                </h3>

                <div className="space-y-4">
                  {data.errors.map((error, index) => {
                    const colors = [
                      "#F97316",
                      "#FBBF24",
                      "#3B82F6",
                      "#A78BFA",
                      "#5295E8",
                    ];

                    const color = colors[index % colors.length];
                    const percentage = Math.round(
                      (error.count / maxErrorCount) * 100
                    );

                    return (
                      <div
                        key={error.id}
                        className="grid grid-cols-[130px_1fr_45px] md:grid-cols-[200px_1fr_50px] gap-3 items-center"
                      >
                        <span className="text-sm text-slate-700">
                          {categoryLabels[error.label] ?? error.label}
                        </span>

                        <div className="h-5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: color,
                            }}
                          />
                        </div>

                        <span className="text-sm font-bold text-right tabular-nums">
                          {error.count}件
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Insights */}
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div
                className="p-5 flex items-center gap-3 border-b border-slate-100"
                style={{ backgroundColor: themeLight }}
              >
                <Lightbulb size={27} style={{ color: themeDark }} />
                <h2 className="text-xl font-bold">今回の気づき</h2>
              </div>

              <div className="p-5 space-y-5 flex-1">
                {data.discoveries.map((item) => (
                  <div key={item.id} className="flex gap-3 items-start">
                    <CheckCircle2
                      size={21}
                      className="text-emerald-500 shrink-0 mt-0.5"
                    />
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {item.title}
                      </p>
                      <p className="text-sm leading-6 text-slate-600 mt-1">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}

                <div className="border-t border-slate-100 pt-5">
                  <div
                    className="border rounded-xl p-4"
                    style={{
                      backgroundColor: themeLight,
                      borderColor: themeSoft,
                    }}
                  >
                    <div className="flex items-center gap-2 font-bold mb-2">
                      <Target size={21} style={{ color: themeDark }} />
                      次にやること
                    </div>
                    <p className="text-sm leading-6 text-slate-700">
                      {data.discoveries[0]?.description ??
                        "今回の分析結果を振り返りましょう。"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() =>
                    alert("再チャレンジ機能は次の開発段階で実装します。")
                  }
                  className="w-full text-white font-bold rounded-xl py-3 flex items-center justify-center gap-2 transition hover:opacity-90"
                  style={{ backgroundColor: themeColor }}
                >
                  <RefreshCw size={18} />
                  もう一度チャレンジ
                </button>
              </div>
            </section>
          </div>

          {/* Bottom analytics */}
          <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-4">

            {/* Skills */}
            <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h2 className="font-bold text-lg mb-6">
                スキル別の実力バランス
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {skillScores.map((skill) => {
                  const Icon = skill.icon;

                  return (
                    <div key={skill.id} className="flex flex-col items-center">
                      <div
                        className="w-24 h-24 rounded-full flex items-center justify-center relative"
                        style={{
                          background: `conic-gradient(${themeColor} ${
                            skill.score * 3.6
                          }deg, #E9EDF4 0deg)`,
                        }}
                      >
                        <div className="w-[82px] h-[82px] rounded-full bg-white flex flex-col items-center justify-center">
                          <Icon size={23} style={{ color: themeColor }} />
                          <span className="text-xs font-bold mt-1">
                            {skill.label}
                          </span>
                        </div>
                      </div>

                      <span
                        className="text-2xl font-bold mt-2 tabular-nums"
                        style={{ color: themeDark }}
                      >
                        {skill.score}%
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-5 border-t border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                  <Bookmark size={18} style={{ color: themeColor }} />
                  <h3 className="font-bold text-sm">発見された傾向</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-3 text-sm text-slate-600">
                  <p className="flex gap-2">
                    <CheckCircle2 className="text-emerald-500 shrink-0" size={17} />
                    最も高い技能：
                    {skillScores.reduce((a, b) =>
                      a.score > b.score ? a : b
                    ).label}
                  </p>

                  <p className="flex gap-2">
                    <CheckCircle2 className="text-emerald-500 shrink-0" size={17} />
                    最も改善が必要な技能：
                    {skillScores.reduce((a, b) =>
                      a.score < b.score ? a : b
                    ).label}
                  </p>
                </div>
              </div>
            </section>

            {/* Trend */}
            <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-lg">理解度の推移</h2>
                <span className="text-xs text-slate-400">
                  {history.length}回の記録
                </span>
              </div>

              <div className="flex flex-wrap gap-4 text-xs mb-4">
                <span className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: themeColor }}
                  />
                  自己評価
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                  実際の理解度
                </span>
              </div>

              {latestHistory.length > 0 ? (
                <div className="space-y-4">
                  {latestHistory.map((item) => (
                    <div key={item.id} className="space-y-2">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>{item.date}</span>
                        <span>
                          自己評価 {item.confidence}% / 実力 {item.score}%
                        </span>
                      </div>

                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${item.confidence}%`,
                            backgroundColor: themeColor,
                          }}
                        />
                      </div>

                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-orange-500 rounded-full"
                          style={{ width: `${item.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 py-8 text-center">
                  まだ履歴がありません。
                </p>
              )}

              {latestHistory.length > 0 && (
                <div className="mt-5 rounded-xl px-4 py-3 text-sm border"
                  style={{
                    backgroundColor: themeLight,
                    borderColor: themeSoft,
                    color: themeDark,
                  }}
                >
                  <strong>
                    最新のギャップ：
                    {latestHistory[latestHistory.length - 1].confidence -
                      latestHistory[latestHistory.length - 1].score}
                    ポイント
                  </strong>
                  <p className="text-xs mt-1 text-slate-600">
                    自己評価と実際の理解度の差を継続的に観察しましょう。
                  </p>
                </div>
              )}
            </section>
          </div>

          {/* Recent text analyses */}
          <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <ShieldCheck size={23} style={{ color: themeColor }} />
              <h2 className="font-bold text-lg">最近検証した文章・課題</h2>
            </div>

            <div className="space-y-3">
              {mockRealityCheckData.texts
                .filter((text) => text.language === language)
                .map((text) => (
                  <div
                    key={text.id}
                    className="border border-slate-100 rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-3"
                  >
                    <div className="flex-1">
                      <p className="font-bold text-sm">{text.title}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {text.analyzedAt} · {text.skill}
                      </p>
                    </div>

                    <div className="text-sm text-slate-600">
                      自己評価 {text.confidence}% / 実力{" "}
                      {text.actualUnderstanding}%
                    </div>

                    <div className="font-bold text-orange-600">
                      {text.confidence - text.actualUnderstanding}pt gap
                    </div>
                  </div>
                ))}

              {mockRealityCheckData.texts.filter(
                (text) => text.language === language
              ).length === 0 && (
                <p className="text-sm text-slate-400 py-4 text-center">
                  この言語の分析履歴はまだありません。
                </p>
              )}
            </div>
          </section>

          {/* Footer */}
          <footer className="text-center text-xs text-slate-400 py-4">
            Reality Check · Understand what you really understand.
          </footer>
        </div>
      </main>
    </div>
  );
}
