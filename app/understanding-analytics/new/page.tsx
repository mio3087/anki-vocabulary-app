"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { saveRealityCheck } from "@/lib/understanding/firestore";
import type { Language, ErrorCategory } from "@/lib/understanding/types";
import { useAppLanguage } from "@/app/component/AppLanguage";
import type { AppLanguage } from "@/app/component/AppLanguage";
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
  icon: typeof BookOpen;
}[] = [
  { id: "reading", icon: BookOpen },
  { id: "listening", icon: Headphones },
  { id: "writing", icon: PenLine },
  { id: "speaking", icon: Mic },
];

const errorCategories = [
  "vocabulary",
  "grammar",
  "structure",
  "inference",
  "context",
  "recall",
  "pronunciation",
  "fluency",
  "expression",
  "other",
] as const;

type ErrorId = (typeof errorCategories)[number];

const translations: {
  ja: Record<string, string>;
} & Partial<Record<Exclude<AppLanguage, "ja">, Record<string, string>>> = {
  ja: {
    back: "Reality Check に戻る",
    guide: "使い方ガイド",
    pageTitle: "新しい分析を記録",
    intro: "自分がどれくらい理解できたと思ったか。そして、実際にはどれくらい理解できていたか。その差を記録していきましょう。",
    targetLanguage: "対象言語",
    chinese: "中国語（簡体字・繁体字）",
    german: "ドイツ語",
    spanish: "スペイン語",
    korean: "韓国語",
    italian: "イタリア語",
    japanese: "日本語",
    analyzeSkill: "分析するスキル",
    reading: "読解",
    readingDesc: "文章を読んで理解する",
    listening: "リスニング",
    listeningDesc: "音声を聞いて理解する",
    writing: "ライティング",
    writingDesc: "文章を組み立てて表現する",
    speaking: "スピーキング",
    speakingDesc: "自分の言葉で伝える",
    material: "分析対象",
    materialTitle: "教材・文章・音声のタイトル",
    materialPlaceholder: "例：中国語ニュースの記事",
    confidence: "自分の理解度予測",
    confidenceDesc: "答え合わせや分析をする前、自分では何％理解できたと思いましたか？",
    confidenceLabel: "自信度",
    actual: "実際の理解度",
    actualDesc: "答え合わせや説明、内容の再現などを通して確認した実際の理解度を入力します。",
    actualLabel: "実際の理解度",
    gapTitle: "自信度と実際の理解度の差",
    gapOver: "理解度を高く見積もっています",
    gapUnder: "実際の理解度が予測を上回っています",
    gapEqual: "予測と実際の理解度が一致しています",
    errors: "発見した問題・誤解",
    errorsDesc: "今回の分析で発見した問題を選んでください。複数選択できます。",
    memo: "分析メモ",
    memoDesc: "どこでつまずいたのか、なぜ誤解したのか、気づいたことを記録します。",
    memoPlaceholder: "例：単語の意味は知っていたが、文脈に合った意味を選べなかった...",
    confirm: "分析内容を確認する",
    preview: "記録内容の確認",
    target: "対象",
    confidenceShort: "自信度",
    actualShort: "実際の理解度",
    recognitionGap: "理解度の認識ギャップ",
    gapPositive: "実際よりも理解できていると感じていた可能性があります。",
    gapNegative: "自分の予測よりも実際の理解度が高い結果です。",
    gapZero: "自己評価と実際の理解度が一致しています。",
    discoveredProblems: "発見した問題",
    noErrors: "問題カテゴリーは選択されていません。",
    saving: "保存中...",
    savedButton: "保存しました",
    saveResult: "分析結果を保存",
    edit: "入力内容を修正する",
    newAnalysis: "新しい分析を入力",
    savedMessage: "分析結果を保存しました！",
    saveFailed: "保存に失敗しました。",
    vocabulary: "語彙",
    vocabularyDesc: "単語の意味・使い方が分からなかった",
    grammar: "文法",
    grammarDesc: "文法や文の構造を誤解した",
    structure: "構造",
    structureDesc: "文章全体の組み立てを誤解した",
    inference: "推論",
    inferenceDesc: "筆者の意図や因果関係を読み違えた",
    context: "文脈",
    contextDesc: "前後関係から意味を判断できなかった",
    recall: "想起",
    recallDesc: "知っている知識を思い出せなかった",
    pronunciation: "音声認識",
    pronunciationDesc: "音を正しく聞き取れなかった",
    fluency: "流暢さ",
    fluencyDesc: "言いたいことをすぐに言葉にできなかった",
    expression: "表現",
    expressionDesc: "意味は分かるが自然に表現できなかった",
    other: "その他",
    otherDesc: "上記以外の問題",
  },

  en: {
    back: "Back to Reality Check",
    guide: "User Guide",
    pageTitle: "Record a New Analysis",
    intro: "How well did you think you understood something? And how much did you actually understand? Record the difference and track your progress.",
    targetLanguage: "Target Language",
    chinese: "Chinese (Simplified / Traditional)",
    german: "German",
    spanish: "Spanish",
    korean: "Korean",
    italian: "Italian",
    japanese: "Japanese",
    analyzeSkill: "Skill to Analyze",
    reading: "Reading",
    readingDesc: "Understand written texts",
    listening: "Listening",
    listeningDesc: "Understand spoken language",
    writing: "Writing",
    writingDesc: "Organize and express ideas in writing",
    speaking: "Speaking",
    speakingDesc: "Communicate in your own words",
    material: "Material",
    materialTitle: "Title of the material, text, or audio",
    materialPlaceholder: "e.g. A Chinese news article",
    confidence: "Estimated Understanding",
    confidenceDesc: "Before checking your answers or analyzing the material, how much did you think you understood?",
    confidenceLabel: "Confidence",
    actual: "Actual Understanding",
    actualDesc: "Enter your actual understanding based on checking answers, explaining the content, or reproducing it.",
    actualLabel: "Actual Understanding",
    gapTitle: "Difference Between Confidence and Actual Understanding",
    gapOver: "You overestimated your understanding",
    gapUnder: "Your actual understanding exceeded your estimate",
    gapEqual: "Your estimate matched your actual understanding",
    errors: "Problems and Misunderstandings Found",
    errorsDesc: "Select the problems you discovered in this analysis. You can select multiple items.",
    memo: "Reflection Notes",
    memoDesc: "Record where you struggled, why you misunderstood something, and what you noticed.",
    memoPlaceholder: "e.g. I knew the word's meaning, but couldn't choose the meaning that fit the context...",
    confirm: "Review Analysis",
    preview: "Review Your Record",
    target: "Target",
    confidenceShort: "Confidence",
    actualShort: "Actual Understanding",
    recognitionGap: "Understanding Gap",
    gapPositive: "You may have felt that you understood more than you actually did.",
    gapNegative: "Your actual understanding was higher than your estimate.",
    gapZero: "Your self-assessment matched your actual understanding.",
    discoveredProblems: "Problems Found",
    noErrors: "No problem categories selected.",
    saving: "Saving...",
    savedButton: "Saved",
    saveResult: "Save Analysis",
    edit: "Edit Entries",
    newAnalysis: "Start a New Analysis",
    savedMessage: "Analysis saved successfully!",
    saveFailed: "Failed to save.",
    vocabulary: "Vocabulary",
    vocabularyDesc: "Did not understand word meanings or usage",
    grammar: "Grammar",
    grammarDesc: "Misunderstood grammar or sentence structure",
    structure: "Structure",
    structureDesc: "Misunderstood the overall organization of the text",
    inference: "Inference",
    inferenceDesc: "Misinterpreted the author's intent or cause-and-effect relationships",
    context: "Context",
    contextDesc: "Could not determine meaning from surrounding context",
    recall: "Recall",
    recallDesc: "Could not recall knowledge I already knew",
    pronunciation: "Sound Recognition",
    pronunciationDesc: "Could not correctly identify the sounds",
    fluency: "Fluency",
    fluencyDesc: "Could not express what I wanted to say quickly",
    expression: "Expression",
    expressionDesc: "Understood the meaning but could not express it naturally",
    other: "Other",
    otherDesc: "Other problems not listed above",
  },

  de: {
    back: "Zurück zu Reality Check",
    guide: "Anleitung",
    pageTitle: "Neue Analyse speichern",
    intro: "Wie gut dachtest du, etwas verstanden zu haben? Und wie viel hast du tatsächlich verstanden? Halte den Unterschied fest und beobachte deine Entwicklung.",
    targetLanguage: "Zielsprache",
    chinese: "Chinesisch (vereinfacht / traditionell)",
    german: "Deutsch",
    spanish: "Spanisch",
    korean: "Koreanisch",
    italian: "Italienisch",
    japanese: "Japanisch",
    analyzeSkill: "Zu analysierende Fähigkeit",
    reading: "Lesen",
    readingDesc: "Geschriebene Texte verstehen",
    listening: "Hörverstehen",
    listeningDesc: "Gesprochene Sprache verstehen",
    writing: "Schreiben",
    writingDesc: "Gedanken schriftlich strukturieren und ausdrücken",
    speaking: "Sprechen",
    speakingDesc: "Sich mit eigenen Worten ausdrücken",
    material: "Analysematerial",
    materialTitle: "Titel des Materials, Textes oder Audios",
    materialPlaceholder: "z. B. Ein chinesischer Nachrichtenartikel",
    confidence: "Einschätzung des eigenen Verständnisses",
    confidenceDesc: "Wie viel Prozent dachtest du vor der Kontrolle oder Analyse verstanden zu haben?",
    confidenceLabel: "Selbstvertrauen",
    actual: "Tatsächliches Verständnis",
    actualDesc: "Gib dein tatsächliches Verständnis anhand von Antwortkontrolle, Erklärungen oder Wiedergabe des Inhalts ein.",
    actualLabel: "Tatsächliches Verständnis",
    gapTitle: "Unterschied zwischen Einschätzung und tatsächlichem Verständnis",
    gapOver: "Du hast dein Verständnis überschätzt",
    gapUnder: "Dein tatsächliches Verständnis war höher als erwartet",
    gapEqual: "Deine Einschätzung entsprach deinem tatsächlichen Verständnis",
    errors: "Entdeckte Probleme und Missverständnisse",
    errorsDesc: "Wähle die Probleme aus, die du bei dieser Analyse entdeckt hast. Mehrfachauswahl möglich.",
    memo: "Reflexionsnotizen",
    memoDesc: "Notiere, wo du Schwierigkeiten hattest, warum du etwas missverstanden hast und was dir aufgefallen ist.",
    memoPlaceholder: "z. B. Ich kannte die Wortbedeutung, konnte aber nicht die zum Kontext passende Bedeutung auswählen ...",
    confirm: "Analyse überprüfen",
    preview: "Eintrag überprüfen",
    target: "Ziel",
    confidenceShort: "Selbstvertrauen",
    actualShort: "Tatsächliches Verständnis",
    recognitionGap: "Unterschied in der Einschätzung",
    gapPositive: "Möglicherweise dachtest du, mehr verstanden zu haben, als tatsächlich der Fall war.",
    gapNegative: "Dein tatsächliches Verständnis war höher als deine Einschätzung.",
    gapZero: "Deine Selbsteinschätzung stimmt mit deinem tatsächlichen Verständnis überein.",
    discoveredProblems: "Entdeckte Probleme",
    noErrors: "Keine Problemkategorien ausgewählt.",
    saving: "Wird gespeichert...",
    savedButton: "Gespeichert",
    saveResult: "Analyse speichern",
    edit: "Eingaben bearbeiten",
    newAnalysis: "Neue Analyse beginnen",
    savedMessage: "Die Analyse wurde gespeichert!",
    saveFailed: "Speichern fehlgeschlagen.",
    vocabulary: "Wortschatz",
    vocabularyDesc: "Bedeutung oder Verwendung von Wörtern nicht verstanden",
    grammar: "Grammatik",
    grammarDesc: "Grammatik oder Satzbau missverstanden",
    structure: "Struktur",
    structureDesc: "Den Gesamtaufbau des Textes missverstanden",
    inference: "Schlussfolgerung",
    inferenceDesc: "Absicht des Autors oder Ursache-Wirkungs-Beziehungen falsch interpretiert",
    context: "Kontext",
    contextDesc: "Bedeutung nicht aus dem Zusammenhang erschließen können",
    recall: "Abruf",
    recallDesc: "Bekanntes Wissen nicht abrufen können",
    pronunciation: "Lauterkennung",
    pronunciationDesc: "Laute nicht richtig erkennen können",
    fluency: "Flüssigkeit",
    fluencyDesc: "Gedanken nicht schnell in Worte fassen können",
    expression: "Ausdruck",
    expressionDesc: "Bedeutung verstanden, aber nicht natürlich ausdrücken können",
    other: "Sonstiges",
    otherDesc: "Andere, oben nicht aufgeführte Probleme",
  },

  "zh-CN": {
    back: "返回 Reality Check",
    guide: "使用指南",
    pageTitle: "记录新的分析",
    intro: "记录自己原本认为理解了多少，以及实际上真正理解了多少。通过比较两者之间的差距，了解自己的学习情况。",
    targetLanguage: "学习语言",
    chinese: "中文（简体字／繁体字）",
    german: "德语",
    spanish: "西班牙语",
    korean: "韩语",
    italian: "意大利语",
    japanese: "日语",
    analyzeSkill: "分析技能",
    reading: "阅读",
    readingDesc: "阅读并理解文章",
    listening: "听力",
    listeningDesc: "听取并理解语音",
    writing: "写作",
    writingDesc: "组织内容并用文字表达",
    speaking: "口语",
    speakingDesc: "用自己的语言表达想法",
    material: "分析材料",
    materialTitle: "教材、文章或音频的标题",
    materialPlaceholder: "例如：一篇中文新闻",
    confidence: "预估自己的理解程度",
    confidenceDesc: "在核对答案或进行分析之前，你认为自己理解了百分之多少？",
    confidenceLabel: "自信程度",
    actual: "实际理解程度",
    actualDesc: "根据答案核对、内容讲解或复述等方式，填写实际理解程度。",
    actualLabel: "实际理解程度",
    gapTitle: "自信程度与实际理解程度的差距",
    gapOver: "你高估了自己的理解程度",
    gapUnder: "实际理解程度高于原先的预估",
    gapEqual: "预估与实际理解程度一致",
    errors: "发现的问题与误解",
    errorsDesc: "请选择本次分析中发现的问题。可以多选。",
    memo: "分析笔记",
    memoDesc: "记录自己在哪里遇到困难、为什么产生误解，以及本次发现的内容。",
    memoPlaceholder: "例如：虽然知道单词的意思，却无法选出符合上下文的含义……",
    confirm: "确认分析内容",
    preview: "确认记录内容",
    target: "分析对象",
    confidenceShort: "自信程度",
    actualShort: "实际理解程度",
    recognitionGap: "理解程度认知差距",
    gapPositive: "你可能认为自己比实际情况理解得更多。",
    gapNegative: "实际理解程度高于自己的预估。",
    gapZero: "自我评价与实际理解程度一致。",
    discoveredProblems: "发现的问题",
    noErrors: "尚未选择问题类别。",
    saving: "正在保存……",
    savedButton: "已保存",
    saveResult: "保存分析结果",
    edit: "修改输入内容",
    newAnalysis: "开始新的分析",
    savedMessage: "分析结果已保存！",
    saveFailed: "保存失败。",
    vocabulary: "词汇",
    vocabularyDesc: "不理解单词的意思或用法",
    grammar: "语法",
    grammarDesc: "误解了语法或句子结构",
    structure: "文章结构",
    structureDesc: "误解了文章整体的组织结构",
    inference: "推理",
    inferenceDesc: "误解了作者的意图或因果关系",
    context: "语境",
    contextDesc: "无法根据上下文判断意思",
    recall: "记忆提取",
    recallDesc: "无法回想起已经学过的知识",
    pronunciation: "语音识别",
    pronunciationDesc: "无法正确听辨声音",
    fluency: "流畅度",
    fluencyDesc: "无法迅速将想表达的内容转化为语言",
    expression: "表达",
    expressionDesc: "理解了意思，却无法自然地表达",
    other: "其他",
    otherDesc: "以上未列出的其他问题",
  },

  "zh-TW": {
    back: "返回 Reality Check",
    guide: "使用指南",
    pageTitle: "記錄新的分析",
    intro: "記錄自己原本認為理解了多少，以及實際上真正理解了多少。透過比較兩者之間的差距，了解自己的學習情況。",
    targetLanguage: "學習語言",
    chinese: "中文（簡體字／繁體字）",
    german: "德語",
    spanish: "西班牙語",
    korean: "韓語",
    italian: "義大利語",
    japanese: "日語",
    analyzeSkill: "分析技能",
    reading: "閱讀",
    readingDesc: "閱讀並理解文章",
    listening: "聽力",
    listeningDesc: "聆聽並理解語音",
    writing: "寫作",
    writingDesc: "組織內容並以文字表達",
    speaking: "口說",
    speakingDesc: "用自己的話表達想法",
    material: "分析材料",
    materialTitle: "教材、文章或音訊的標題",
    materialPlaceholder: "例如：一篇中文新聞",
    confidence: "預估自己的理解程度",
    confidenceDesc: "在核對答案或進行分析之前，你認為自己理解了百分之多少？",
    confidenceLabel: "自信程度",
    actual: "實際理解程度",
    actualDesc: "根據核對答案、講解內容或重新表達等方式，填寫實際理解程度。",
    actualLabel: "實際理解程度",
    gapTitle: "自信程度與實際理解程度的差距",
    gapOver: "你高估了自己的理解程度",
    gapUnder: "實際理解程度高於原先的預估",
    gapEqual: "預估與實際理解程度一致",
    errors: "發現的問題與誤解",
    errorsDesc: "請選擇本次分析中發現的問題。可以複選。",
    memo: "分析筆記",
    memoDesc: "記錄自己在哪裡遇到困難、為什麼產生誤解，以及本次發現的內容。",
    memoPlaceholder: "例如：雖然知道單字的意思，卻無法選出符合上下文的含義……",
    confirm: "確認分析內容",
    preview: "確認記錄內容",
    target: "分析對象",
    confidenceShort: "自信程度",
    actualShort: "實際理解程度",
    recognitionGap: "理解程度認知差距",
    gapPositive: "你可能認為自己比實際情況理解得更多。",
    gapNegative: "實際理解程度高於自己的預估。",
    gapZero: "自我評價與實際理解程度一致。",
    discoveredProblems: "發現的問題",
    noErrors: "尚未選擇問題類別。",
    saving: "儲存中……",
    savedButton: "已儲存",
    saveResult: "儲存分析結果",
    edit: "修改輸入內容",
    newAnalysis: "開始新的分析",
    savedMessage: "分析結果已儲存！",
    saveFailed: "儲存失敗。",
    vocabulary: "詞彙",
    vocabularyDesc: "不理解單字的意思或用法",
    grammar: "文法",
    grammarDesc: "誤解了文法或句子結構",
    structure: "文章結構",
    structureDesc: "誤解了文章整體的組織結構",
    inference: "推論",
    inferenceDesc: "誤解了作者的意圖或因果關係",
    context: "語境",
    contextDesc: "無法根據上下文判斷意思",
    recall: "記憶提取",
    recallDesc: "無法回想起已經學過的知識",
    pronunciation: "語音辨識",
    pronunciationDesc: "無法正確辨識聲音",
    fluency: "流暢度",
    fluencyDesc: "無法迅速將想表達的內容轉化為語言",
    expression: "表達",
    expressionDesc: "理解了意思，卻無法自然地表達",
    other: "其他",
    otherDesc: "以上未列出的其他問題",
  },

  es: {
    back: "Volver a Reality Check",
    guide: "Guía de uso",
    pageTitle: "Registrar un nuevo análisis",
    intro: "¿Cuánto creías que habías entendido? ¿Y cuánto entendiste realmente? Registra la diferencia para observar tu progreso.",
    targetLanguage: "Idioma de estudio",
    chinese: "Chino (simplificado / tradicional)",
    german: "Alemán",
    spanish: "Español",
    korean: "Coreano",
    italian: "Italiano",
    japanese: "Japonés",
    analyzeSkill: "Habilidad que se analizará",
    reading: "Comprensión lectora",
    readingDesc: "Leer y comprender textos",
    listening: "Comprensión auditiva",
    listeningDesc: "Escuchar y comprender el idioma",
    writing: "Expresión escrita",
    writingDesc: "Organizar ideas y expresarlas por escrito",
    speaking: "Expresión oral",
    speakingDesc: "Comunicar ideas con tus propias palabras",
    material: "Material de análisis",
    materialTitle: "Título del material, texto o audio",
    materialPlaceholder: "Ej.: Un artículo de noticias en chino",
    confidence: "Estimación de tu comprensión",
    confidenceDesc: "Antes de comprobar las respuestas o analizar el material, ¿qué porcentaje creías haber entendido?",
    confidenceLabel: "Confianza",
    actual: "Comprensión real",
    actualDesc: "Introduce tu comprensión real después de comprobar las respuestas, explicar el contenido o reproducirlo.",
    actualLabel: "Comprensión real",
    gapTitle: "Diferencia entre la confianza y la comprensión real",
    gapOver: "Has sobreestimado tu comprensión",
    gapUnder: "Tu comprensión real superó tu estimación",
    gapEqual: "Tu estimación coincidió con tu comprensión real",
    errors: "Problemas y malentendidos detectados",
    errorsDesc: "Selecciona los problemas que has detectado en este análisis. Puedes elegir varios.",
    memo: "Notas de reflexión",
    memoDesc: "Anota dónde tuviste dificultades, por qué interpretaste algo mal y qué descubriste.",
    memoPlaceholder: "Ej.: Conocía el significado de la palabra, pero no pude elegir el significado adecuado al contexto...",
    confirm: "Revisar el análisis",
    preview: "Revisar el registro",
    target: "Objetivo",
    confidenceShort: "Confianza",
    actualShort: "Comprensión real",
    recognitionGap: "Diferencia de comprensión",
    gapPositive: "Es posible que sintieras que habías entendido más de lo que realmente entendiste.",
    gapNegative: "Tu comprensión real fue superior a tu estimación.",
    gapZero: "Tu autoevaluación coincide con tu comprensión real.",
    discoveredProblems: "Problemas detectados",
    noErrors: "No se ha seleccionado ninguna categoría.",
    saving: "Guardando...",
    savedButton: "Guardado",
    saveResult: "Guardar análisis",
    edit: "Modificar los datos",
    newAnalysis: "Iniciar un nuevo análisis",
    savedMessage: "¡El análisis se ha guardado!",
    saveFailed: "No se pudo guardar.",
    vocabulary: "Vocabulario",
    vocabularyDesc: "No comprendí el significado o el uso de las palabras",
    grammar: "Gramática",
    grammarDesc: "Interpreté mal la gramática o la estructura de la oración",
    structure: "Estructura",
    structureDesc: "Interpreté mal la organización general del texto",
    inference: "Inferencia",
    inferenceDesc: "Interpreté mal la intención del autor o las relaciones de causa y efecto",
    context: "Contexto",
    contextDesc: "No pude deducir el significado a partir del contexto",
    recall: "Recuperación de memoria",
    recallDesc: "No pude recordar conocimientos que ya había aprendido",
    pronunciation: "Reconocimiento de sonidos",
    pronunciationDesc: "No pude identificar correctamente los sonidos",
    fluency: "Fluidez",
    fluencyDesc: "No pude expresar rápidamente lo que quería decir",
    expression: "Expresión",
    expressionDesc: "Entendí el significado, pero no pude expresarlo con naturalidad",
    other: "Otros",
    otherDesc: "Otros problemas no incluidos anteriormente",
  },
};

const languageLabels: Record<string, string> = {
  zh: "chinese",
  de: "german",
  es: "spanish",
  ko: "korean",
  it: "italian",
  ja: "japanese",
};

export default function NewUnderstandingAnalysisPage() {
  const { language: appLanguage } = useAppLanguage();

  const dictionary: Record<string, string> =
  translations[appLanguage] ?? translations.ja;

const t = (key: string): string =>
  dictionary[key] ?? translations.ja[key] ?? key;

  const [language, setLanguage] = useState<Language>("zh");
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
        .filter((id) => selectedErrors.includes(id))
        .map((id) => t(id)),
    [selectedErrors, appLanguage]
  );

  function toggleError(id: string) {
    setSelectedErrors((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setShowPreview(true);
  }

  async function handleSave() {
    setSaving(true);
    setSaveError("");

    try {
      const errors = errorCategories
        .filter((id) => selectedErrors.includes(id))
        .map((id) => ({
          category: id as ErrorCategory,
          label: t(id),
          description: t(`${id}Desc`),
          count: 1,
        }));

      await saveRealityCheck({
        language,
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
        error instanceof Error ? error.message : t("saveFailed")
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

  const languageOptions: { value: Language; label: string }[] = [
    { value: "zh", label: t("chinese") },
    { value: "de", label: t("german") },
    { value: "es", label: t("spanish") },
    { value: "ko", label: t("korean") },
    { value: "it", label: t("italian") },
    { value: "ja", label: t("japanese") },
  ];

  return (
    <main className="min-h-screen bg-[#f7f8f6] px-5 py-8 text-[#303a35] md:px-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/understanding-analytics"
            className="inline-flex items-center gap-2 text-sm text-[var(--anki-theme-dark)] transition hover:opacity-75"
          >
            <ArrowLeft size={16} />
            {t("back")}
          </Link>

          <Link
            href="/understanding-analytics/guide"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--anki-theme-soft)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--anki-theme-dark)] transition hover:bg-[var(--anki-theme-light)]"
          >
            <BookOpen size={16} />
            {t("guide")}
          </Link>
        </div>

        <div className="mb-8">
          <p className="mb-2 text-xs font-semibold tracking-[0.2em] text-[var(--anki-theme-dark)]">
            REALITY CHECK / NEW ANALYSIS
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {t("pageTitle")}
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#849087]">
            {t("intro")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 01 Language */}
          <section className="rounded-2xl border border-[#e7ebe6] bg-white p-6 shadow-sm">
            <div className="mb-4">
              <p className="text-xs font-semibold tracking-wider text-[var(--anki-theme-dark)]">
                01 / LANGUAGE
              </p>
              <h2 className="mt-1 text-lg font-semibold">
                {t("targetLanguage")}
              </h2>
            </div>

            <div className="relative">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="w-full appearance-none rounded-xl border border-[#e5eae4] bg-[#fafbf9] px-4 py-3 text-sm outline-none transition focus:border-[var(--anki-theme-color)]"
              >
                {languageOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
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
                {t("analyzeSkill")}
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
                    <p className="text-sm font-semibold">{t(item.id)}</p>
                    <p className="mt-1 text-xs leading-5 opacity-75">
                      {t(`${item.id}Desc`)}
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
              <h2 className="mt-1 text-lg font-semibold">
                {t("material")}
              </h2>
            </div>

            <label className="mb-2 block text-sm text-[#66746a]">
              {t("materialTitle")}
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("materialPlaceholder")}
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
                {t("confidence")}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#849087]">
                {t("confidenceDesc")}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-[#77847b]">
                {t("confidenceLabel")}
              </span>
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
                {t("actual")}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#849087]">
                {t("actualDesc")}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-[#77847b]">
                {t("actualLabel")}
              </span>
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
                {t("gapTitle")}
              </p>

              <div className="mt-2 flex items-end justify-between gap-3">
                <span className="text-sm text-[#65746a]">
                  {gap > 0
                    ? t("gapOver")
                    : gap < 0
                      ? t("gapUnder")
                      : t("gapEqual")}
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
                {t("errors")}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#849087]">
                {t("errorsDesc")}
              </p>
            </div>

            <div className="space-y-2">
              {errorCategories.map((id) => {
                const checked = selectedErrors.includes(id);

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleError(id)}
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
                        {t(id)}
                      </span>
                      <span className="mt-0.5 block text-xs text-[#929c94]">
                        {t(`${id}Desc`)}
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
              <h2 className="mt-1 text-lg font-semibold">
                {t("memo")}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#849087]">
                {t("memoDesc")}
              </p>
            </div>

            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={5}
              placeholder={t("memoPlaceholder")}
              className="w-full resize-y rounded-xl border border-[#e5eae4] bg-[#fafbf9] px-4 py-3 text-sm leading-6 outline-none transition focus:border-[var(--anki-theme-color)]"
            />
          </section>

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--anki-theme-color)] px-6 py-4 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
          >
            <ClipboardCheck size={18} />
            {t("confirm")}
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
                  {t("preview")}
                </h2>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-[#929c94]">
                  {t("target")}
                </p>
                <p className="mt-1 text-sm font-medium">
                  {t(languageLabels[language])} / {selectedSkill ? t(selectedSkill.id) : ""}
                </p>
                <p className="mt-1 text-sm text-[#66746a]">{title}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[#f5f7f4] p-4">
                  <p className="text-xs text-[#849087]">
                    {t("confidenceShort")}
                  </p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">
                    {confidence}%
                  </p>
                </div>
                <div className="rounded-xl bg-[#f5f7f4] p-4">
                  <p className="text-xs text-[#849087]">
                    {t("actualShort")}
                  </p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">
                    {actualUnderstanding}%
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-[var(--anki-theme-light)] p-4">
                <p className="text-xs text-[#849087]">
                  {t("recognitionGap")}
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-[#a27655]">
                  {gap > 0 ? "+" : ""}
                  {gap}pt
                </p>
                <p className="mt-1 text-xs text-[#849087]">
                  {gap > 0
                    ? t("gapPositive")
                    : gap < 0
                      ? t("gapNegative")
                      : t("gapZero")}
                </p>
              </div>

              <div>
                <p className="text-xs text-[#929c94]">
                  {t("discoveredProblems")}
                </p>
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
                      {t("noErrors")}
                    </p>
                  )}
                </div>
              </div>

              {memo.trim() && (
                <div>
                  <p className="text-xs text-[#929c94]">
                    {t("memo")}
                  </p>
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
                {saving
                  ? t("saving")
                  : saved
                    ? t("savedButton")
                    : t("saveResult")}
              </button>

              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="flex flex-1 items-center justify-center rounded-xl border border-[var(--anki-theme-soft)] px-4 py-3 text-sm font-medium text-[var(--anki-theme-dark)] transition hover:bg-[var(--anki-theme-light)]"
              >
                {t("edit")}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--anki-theme-color)] px-4 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                <RotateCcw size={15} />
                {t("newAnalysis")}
              </button>
            </div>

            {saved && (
              <p className="mt-4 text-sm font-medium text-[var(--anki-theme-dark)]">
                {t("savedMessage")}
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