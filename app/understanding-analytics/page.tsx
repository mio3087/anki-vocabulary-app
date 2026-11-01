
"use client";

import { useState } from "react";
import {
  Brain, BookOpen, Headphones, PenLine, Mic, BarChart3, ShieldCheck,
  Lightbulb, Target, RefreshCw, CheckCircle2, AlertTriangle,
  ChevronDown, Globe, Bookmark, ArrowRight,
} from "lucide-react";
import { useLanguage } from "@/app/component/AppLanguage";
import { mockRealityCheckData } from "@/lib/understanding/mock-data";
import type { Skill, Language } from "@/lib/understanding/types";

type Translation = Record<string, string>;

const translations: Record<string, Translation> = {
  ja: {
    subtitle:"わかったつもりを検知し、本当の理解を見つけよう", reading:"読解", listening:"リスニング", writing:"ライティング", speaking:"スピーキング", overall:"総合分析", result:"今回の検証結果", sample:"サンプルデータ", self:"自己評価", assumed:"（理解したつもり）", actual:"実際の理解度", verified:"（検証結果）", gapTitle:"わかったつもりでした！", confirmed:"理解度を確認できました", gapText:"自信と実力に", points:"ポイント", review:"もう一度、内容を確認してみましょう。", errors:"どこでつまずいた？", breakdown:"（誤解の内訳）", cases:"件", insights:"今回の気づき", next:"次にやること", retry:"もう一度チャレンジ", retryAlert:"再チャレンジ機能は次の開発段階で実装します。", fallback:"今回の分析結果を振り返りましょう。", balance:"スキル別の実力バランス", tendencies:"発見された傾向", strongest:"最も高い技能：", improve:"最も改善が必要な技能：", trend:"理解度の推移", records:"回の記録", confidence:"自己評価", actualLegend:"実際の理解度", noHistory:"まだ履歴がありません。", latestGap:"最新のギャップ：", observe:"自己評価と実際の理解度の差を継続的に観察しましょう。", recent:"最近検証した文章・課題", noLanguageHistory:"この言語の分析履歴はまだありません。", vocabulary:"語彙", grammar:"文法", structure:"文構造", inference:"推論・論理", context:"文脈", recall:"想起・記憶", pronunciation:"発音", fluency:"流暢さ", expression:"表現", other:"その他", zh:"中国語（簡体字）", de:"ドイツ語", es:"スペイン語", ko:"韓国語", it:"イタリア語", jaLang:"日本語"
  },
  en: {
    subtitle:"Detect the illusion of understanding and discover what you really know.", reading:"Reading", listening:"Listening", writing:"Writing", speaking:"Speaking", overall:"Overview", result:"Results of this check", sample:"Sample data", self:"Self-assessment", assumed:"(What you think you understand)", actual:"Actual understanding", verified:"(Verified result)", gapTitle:"You may have overestimated your understanding!", confirmed:"Your understanding has been confirmed", gapText:"There is a", points:"point gap", review:"Review the material once more.", errors:"Where did you struggle?", breakdown:"(Breakdown of misunderstandings)", cases:"items", insights:"Key insights", next:"Next step", retry:"Try again", retryAlert:"The retry feature will be implemented in a future development phase.", fallback:"Review the results of this analysis.", balance:"Skill balance", tendencies:"Patterns identified", strongest:"Strongest skill: ", improve:"Skill needing the most improvement: ", trend:"Understanding over time", records:" records", confidence:"Self-assessment", actualLegend:"Actual understanding", noHistory:"There is no history yet.", latestGap:"Latest gap: ", observe:"Keep tracking the difference between your self-assessment and actual understanding.", recent:"Recently checked texts and tasks", noLanguageHistory:"There is no analysis history for this language yet.", vocabulary:"Vocabulary", grammar:"Grammar", structure:"Sentence structure", inference:"Inference & logic", context:"Context", recall:"Recall & memory", pronunciation:"Pronunciation", fluency:"Fluency", expression:"Expression", other:"Other", zh:"Chinese (Simplified)", de:"German", es:"Spanish", ko:"Korean", it:"Italian", jaLang:"Japanese"
  },
  de: {
    subtitle:"Erkenne die Illusion des Verstehens und entdecke, was du wirklich verstanden hast.", reading:"Lesen", listening:"Hören", writing:"Schreiben", speaking:"Sprechen", overall:"Gesamtanalyse", result:"Ergebnis dieser Überprüfung", sample:"Beispieldaten", self:"Selbsteinschätzung", assumed:"(vermeintliches Verständnis)", actual:"Tatsächliches Verständnis", verified:"(Überprüfungsergebnis)", gapTitle:"Du hast dein Verständnis überschätzt!", confirmed:"Dein Verständnis wurde bestätigt", gapText:"Zwischen Selbstvertrauen und Leistung liegen", points:"Punkte", review:"Sieh dir den Inhalt noch einmal an.", errors:"Wo bist du ins Stocken geraten?", breakdown:"(Aufschlüsselung der Missverständnisse)", cases:"Fälle", insights:"Neue Erkenntnisse", next:"Nächster Schritt", retry:"Erneut versuchen", retryAlert:"Die Funktion zum erneuten Versuch wird später implementiert.", fallback:"Sieh dir die Ergebnisse dieser Analyse noch einmal an.", balance:"Kompetenzprofil", tendencies:"Erkannte Muster", strongest:"Stärkste Fähigkeit: ", improve:"Fähigkeit mit dem größten Verbesserungsbedarf: ", trend:"Entwicklung des Verständnisses", records:" Einträge", confidence:"Selbsteinschätzung", actualLegend:"Tatsächliches Verständnis", noHistory:"Noch keine Einträge vorhanden.", latestGap:"Aktuelle Differenz: ", observe:"Beobachte weiterhin den Unterschied zwischen Selbsteinschätzung und tatsächlichem Verständnis.", recent:"Zuletzt überprüfte Texte und Aufgaben", noLanguageHistory:"Für diese Sprache gibt es noch keine Analysehistorie.", vocabulary:"Wortschatz", grammar:"Grammatik", structure:"Satzstruktur", inference:"Schlussfolgerung & Logik", context:"Kontext", recall:"Abruf & Gedächtnis", pronunciation:"Aussprache", fluency:"Sprachfluss", expression:"Ausdruck", other:"Sonstiges", zh:"Chinesisch (vereinfacht)", de:"Deutsch", es:"Spanisch", ko:"Koreanisch", it:"Italienisch", jaLang:"Japanisch"
  },
  es: {
    subtitle:"Detecta la ilusión de entender y descubre lo que realmente comprendes.", reading:"Lectura", listening:"Comprensión auditiva", writing:"Expresión escrita", speaking:"Expresión oral", overall:"Análisis general", result:"Resultado de esta comprobación", sample:"Datos de muestra", self:"Autoevaluación", assumed:"(Lo que crees entender)", actual:"Comprensión real", verified:"(Resultado comprobado)", gapTitle:"¡Has sobreestimado tu comprensión!", confirmed:"Tu comprensión ha sido confirmada", gapText:"Hay una diferencia de", points:"puntos", review:"Vuelve a revisar el contenido.", errors:"¿Dónde encontraste dificultades?", breakdown:"(Desglose de los malentendidos)", cases:"casos", insights:"Conclusiones", next:"Próximo paso", retry:"Volver a intentarlo", retryAlert:"Esta función se implementará en una próxima fase.", fallback:"Repasa los resultados de este análisis.", balance:"Equilibrio de habilidades", tendencies:"Tendencias detectadas", strongest:"Habilidad más fuerte: ", improve:"Habilidad que más necesita mejorar: ", trend:"Evolución de la comprensión", records:" registros", confidence:"Autoevaluación", actualLegend:"Comprensión real", noHistory:"Todavía no hay historial.", latestGap:"Diferencia más reciente: ", observe:"Observa la diferencia entre tu autoevaluación y tu comprensión real.", recent:"Textos y tareas comprobados recientemente", noLanguageHistory:"Todavía no hay historial de análisis para este idioma.", vocabulary:"Vocabulario", grammar:"Gramática", structure:"Estructura de las frases", inference:"Inferencia y lógica", context:"Contexto", recall:"Recuerdo y memoria", pronunciation:"Pronunciación", fluency:"Fluidez", expression:"Expresión", other:"Otros", zh:"Chino (simplificado)", de:"Alemán", es:"Español", ko:"Coreano", it:"Italiano", jaLang:"Japonés"
  },
  "zh-CN": {
    subtitle:"识别“自以为理解”的错觉，发现自己真正掌握的内容。", reading:"阅读", listening:"听力", writing:"写作", speaking:"口语", overall:"综合分析", result:"本次检测结果", sample:"示例数据", self:"自我评价", assumed:"（自认为已经理解）", actual:"实际理解程度", verified:"（检测结果）", gapTitle:"你可能高估了自己的理解程度！", confirmed:"已确认你的理解程度", gapText:"自信程度与实际水平相差", points:"个百分点", review:"请再次确认相关内容。", errors:"你在哪些方面遇到了困难？", breakdown:"（误解类型统计）", cases:"项", insights:"本次发现", next:"下一步", retry:"再次挑战", retryAlert:"再次挑战功能将在后续开发阶段实现。", fallback:"请回顾本次分析结果。", balance:"各项技能的能力分布", tendencies:"发现的倾向", strongest:"最强的技能：", improve:"最需要提高的技能：", trend:"理解程度变化趋势", records:"次记录", confidence:"自我评价", actualLegend:"实际理解程度", noHistory:"暂无历史记录。", latestGap:"最新差距：", observe:"持续观察自我评价与实际理解程度之间的差距。", recent:"最近检测的文章与任务", noLanguageHistory:"该语言暂时没有分析记录。", vocabulary:"词汇", grammar:"语法", structure:"句子结构", inference:"推理与逻辑", context:"语境", recall:"回忆与记忆", pronunciation:"发音", fluency:"流利度", expression:"表达", other:"其他", zh:"中文（简体）", de:"德语", es:"西班牙语", ko:"韩语", it:"意大利语", jaLang:"日语"
  },
  "zh-TW": {
    subtitle:"偵測「自以為理解」的錯覺，找出自己真正理解的內容。", reading:"閱讀", listening:"聽力", writing:"寫作", speaking:"口說", overall:"綜合分析", result:"本次檢測結果", sample:"範例資料", self:"自我評估", assumed:"（自認為已經理解）", actual:"實際理解程度", verified:"（檢測結果）", gapTitle:"你可能高估了自己的理解程度！", confirmed:"已確認你的理解程度", gapText:"自信程度與實際能力相差", points:"個百分點", review:"請再次確認相關內容。", errors:"你在哪些地方遇到困難？", breakdown:"（誤解類型統計）", cases:"項", insights:"本次發現", next:"下一步", retry:"再次挑戰", retryAlert:"再次挑戰功能將於後續開發階段實作。", fallback:"請回顧本次分析結果。", balance:"各項技能的能力分布", tendencies:"發現的趨勢", strongest:"最強的技能：", improve:"最需要加強的技能：", trend:"理解程度變化趨勢", records:"次紀錄", confidence:"自我評估", actualLegend:"實際理解程度", noHistory:"目前尚無紀錄。", latestGap:"最新差距：", observe:"持續觀察自我評估與實際理解程度之間的差距。", recent:"最近檢測的文章與課題", noLanguageHistory:"此語言目前尚無分析紀錄。", vocabulary:"詞彙", grammar:"文法", structure:"句子結構", inference:"推論與邏輯", context:"語境", recall:"回想與記憶", pronunciation:"發音", fluency:"流暢度", expression:"表達", other:"其他", zh:"中文（簡體）", de:"德語", es:"西班牙語", ko:"韓語", it:"義大利語", jaLang:"日語"
  }
};

const skills = [
  { id: "reading" as Skill, icon: BookOpen },
  { id: "listening" as Skill, icon: Headphones },
  { id: "writing" as Skill, icon: PenLine },
  { id: "speaking" as Skill, icon: Mic },
];

const languageOptions: { value: Language; key: string }[] = [
  { value: "zh", key: "zh" },
  { value: "de", key: "de" },
  { value: "es", key: "es" },
  { value: "ko", key: "ko" },
  { value: "it", key: "it" },
  { value: "ja", key: "jaLang" },
];

export default function UnderstandingAnalyticsPage() {
  // アプリ全体の表示言語
  const { language: appLanguage } = useLanguage();

  // このページの翻訳データに存在する言語だけを使用する
  const displayLanguage =
    appLanguage === "ja" ||
    appLanguage === "en" ||
    appLanguage === "de" ||
    appLanguage === "es" ||
    appLanguage === "zh-CN" ||
    appLanguage === "zh-TW"
      ? appLanguage
      : "ja";

  const tr = (key: string): string => {
  return (
    translations[displayLanguage]?.[key] ??
    translations.ja?.[key] ??
    key
  );
};

  const [activeSkill, setActiveSkill] = useState<Skill>("reading");
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  // ここで選ぶ言語は、アプリの表示言語ではなく分析対象の学習言語
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

  const skillName = (id: Skill) => tr(id);

  const languageTexts = mockRealityCheckData.texts.filter(
    (item) => item.language === language
  );

  return (
    <div className="min-h-screen bg-[#F5F6FA] text-[#20263A]">
      <main className="w-full min-w-0 p-4 md:p-7 lg:p-8">
        <div className="max-w-[1500px] mx-auto space-y-5">

          {/* ヘッダー */}
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center shadow-lg"
                style={{
                  background:
                    "linear-gradient(135deg, var(--anki-theme-color), var(--anki-theme-dark))",
                  boxShadow: "0 8px 24px var(--anki-theme-soft)",
                }}
              >
                <Brain size={42} className="text-white" />
              </div>

              <div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                  Reality Check
                </h1>
                <p className="text-sm md:text-base text-slate-500 mt-1">
                  {tr("subtitle")}
                </p>
              </div>
            </div>

            {/* 分析対象言語の選択 */}
            <div className="relative">
              <button
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-3 text-sm shadow-sm hover:bg-slate-50 transition"
              >
                <Globe size={18} style={{ color: themeColor }} />
                {tr(selectedLanguage.key)}
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
                      {tr(lang.key)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </header>

          {/* スキル選択 */}
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
                        : { color: "#64748b" }
                    }
                  >
                    <Icon size={24} />
                    <span className="text-left">
                      <span className="block font-bold text-sm">
                        {skillName(skill.id)}
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
                <span className="text-sm font-bold">{tr("overall")}</span>
              </button>
            </div>
          </section>

          {/* 今回の検証結果 */}
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(280px,0.9fr)] gap-4">
            <section className="bg-white rounded-2xl border border-slate-200 p-5 md:p-7 shadow-sm">
              <div className="flex items-center gap-3 mb-7">
                <BookOpen size={27} style={{ color: themeColor }} />
                <h2 className="text-xl font-bold">{tr("result")}</h2>
                <span className="ml-auto text-xs text-slate-400">
                  {tr("sample")}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
                <div className="text-center">
                  <p className="font-bold text-slate-700">{tr("self")}</p>
                  <p className="text-xs text-slate-400">{tr("assumed")}</p>
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
                  <p className="font-bold text-slate-700">{tr("actual")}</p>
                  <p className="text-xs text-slate-400">{tr("verified")}</p>
                  <div className="text-6xl md:text-7xl font-bold text-orange-500 mt-2 tabular-nums">
                    {data.actualUnderstanding}
                    <span className="text-3xl">%</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 bg-orange-50 border border-orange-100 rounded-2xl p-5 flex flex-col md:flex-row gap-4 items-center">
                <AlertTriangle size={42} className="text-orange-500 shrink-0" />
                <div>
                  <h3 className="text-xl font-bold text-orange-600">
                    {gap > 0 ? tr("gapTitle") : tr("confirmed")}
                  </h3>
                  <p className="text-sm text-slate-700 mt-2">
                    {tr("gapText")} <strong>{gap} {tr("points")}</strong>.{" "}
                    {tr("review")}
                  </p>
                </div>
              </div>

              <div className="mt-7">
                <h3 className="font-bold text-lg mb-5">
                  {tr("errors")}{" "}
                  <span className="text-sm font-normal text-slate-400">
                    {tr("breakdown")}
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

                    const percentage = Math.round(
                      (error.count / maxErrorCount) * 100
                    );

                    return (
                      <div
                        key={error.id}
                        className="grid grid-cols-[130px_1fr_45px] md:grid-cols-[200px_1fr_50px] gap-3 items-center"
                      >
                        <span className="text-sm text-slate-700">
                          {tr(error.label)}
                        </span>

                        <div className="h-5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor:
                                colors[index % colors.length],
                            }}
                          />
                        </div>

                        <span className="text-sm font-bold text-right tabular-nums">
                          {error.count}
                          {tr("cases")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* 今回の気づき */}
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div
                className="p-5 flex items-center gap-3 border-b border-slate-100"
                style={{ backgroundColor: themeLight }}
              >
                <Lightbulb size={27} style={{ color: themeDark }} />
                <h2 className="text-xl font-bold">{tr("insights")}</h2>
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
                      {tr("next")}
                    </div>
                    <p className="text-sm leading-6 text-slate-700">
                      {data.discoveries[0]?.description ?? tr("fallback")}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => alert(tr("retryAlert"))}
                  className="w-full text-white font-bold rounded-xl py-3 flex items-center justify-center gap-2 transition hover:opacity-90"
                  style={{ backgroundColor: themeColor }}
                >
                  <RefreshCw size={18} />
                  {tr("retry")}
                </button>
              </div>
            </section>
          </div>

          {/* スキル別の実力バランス・推移 */}
          <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-4">
            <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h2 className="font-bold text-lg mb-6">{tr("balance")}</h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {skillScores.map((skill) => {
                  const Icon = skill.icon;

                  return (
                    <div
                      key={skill.id}
                      className="flex flex-col items-center"
                    >
                      <div
                        className="w-24 h-24 rounded-full flex items-center justify-center relative"
                        style={{
                          background: `conic-gradient(${themeColor} ${skill.score * 3.6}deg, #E9EDF4 0deg)`,
                        }}
                      >
                        <div className="w-[82px] h-[82px] rounded-full bg-white flex flex-col items-center justify-center">
                          <Icon size={23} style={{ color: themeColor }} />
                          <span className="text-xs font-bold mt-1">
                            {skillName(skill.id)}
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
                  <h3 className="font-bold text-sm">{tr("tendencies")}</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-3 text-sm text-slate-600">
                  <p className="flex gap-2">
                    <CheckCircle2
                      className="text-emerald-500 shrink-0"
                      size={17}
                    />
                    {tr("strongest")}
                    {skillName(
                      skillScores.reduce((a, b) =>
                        a.score > b.score ? a : b
                      ).id
                    )}
                  </p>

                  <p className="flex gap-2">
                    <CheckCircle2
                      className="text-emerald-500 shrink-0"
                      size={17}
                    />
                    {tr("improve")}
                    {skillName(
                      skillScores.reduce((a, b) =>
                        a.score < b.score ? a : b
                      ).id
                    )}
                  </p>
                </div>
              </div>
            </section>

            {/* 理解度の推移 */}
            <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-lg">{tr("trend")}</h2>
                <span className="text-xs text-slate-400">
                  {history.length}
                  {tr("records")}
                </span>
              </div>

              <div className="flex flex-wrap gap-4 text-xs mb-4">
                <span className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: themeColor }}
                  />
                  {tr("confidence")}
                </span>

                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                  {tr("actualLegend")}
                </span>
              </div>

              {latestHistory.length > 0 ? (
                <div className="space-y-4">
                  {latestHistory.map((item) => (
                    <div key={item.id} className="space-y-2">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>{item.date}</span>
                        <span>
                          {tr("self")} {item.confidence}% / {tr("actual")}{" "}
                          {item.score}%
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
                  {tr("noHistory")}
                </p>
              )}

              {latestHistory.length > 0 && (
                <div
                  className="mt-5 rounded-xl px-4 py-3 text-sm border"
                  style={{
                    backgroundColor: themeLight,
                    borderColor: themeSoft,
                    color: themeDark,
                  }}
                >
                  <strong>
                    {tr("latestGap")}{" "}
                    {latestHistory[latestHistory.length - 1].confidence -
                      latestHistory[latestHistory.length - 1].score}{" "}
                    {tr("points")}
                  </strong>
                  <p className="text-xs mt-1 text-slate-600">
                    {tr("observe")}
                  </p>
                </div>
              )}
            </section>
          </div>

          {/* 最近検証した文章・課題 */}
          <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <ShieldCheck size={23} style={{ color: themeColor }} />
              <h2 className="font-bold text-lg">{tr("recent")}</h2>
            </div>

            <div className="space-y-3">
              {languageTexts.map((item) => (
                <div
                  key={item.id}
                  className="border border-slate-100 rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-3"
                >
                  <div className="flex-1">
                    <p className="font-bold text-sm">{item.title}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {item.analyzedAt} · {skillName(item.skill)}
                    </p>
                  </div>

                  <div className="text-sm text-slate-600">
                    {tr("self")} {item.confidence}% / {tr("actual")}{" "}
                    {item.actualUnderstanding}%
                  </div>

                  <div className="font-bold text-orange-600">
                    {item.confidence - item.actualUnderstanding}pt gap
                  </div>
                </div>
              ))}

              {languageTexts.length === 0 && (
                <p className="text-sm text-slate-400 py-4 text-center">
                  {tr("noLanguageHistory")}
                </p>
              )}
            </div>
          </section>

          <footer className="text-center text-xs text-slate-400 py-4">
            Reality Check · Understand what you really understand.
          </footer>
        </div>
      </main>
    </div>
  );
}
