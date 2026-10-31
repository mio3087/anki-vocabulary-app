
import type {
  RealityCheckData,
  SkillAnalysis,
  AnalysisHistory,
  TextAnalysis,
} from "./types";

// ========================================
// 技能別分析データ
// ========================================

export const mockSkillAnalyses: SkillAnalysis[] = [
  {
    skill: "reading",
    score: 68,
    confidence: 88,
    actualUnderstanding: 68,
    analyzedCount: 12,
    errors: [
      {
        id: "r1",
        category: "vocabulary",
        label: "語彙の理解不足",
        description: "単語の意味を文脈に合わせて正しく捉えられていない",
        count: 8,
        examples: ["抽象的な語彙", "類義語の使い分け"],
      },
      {
        id: "r2",
        category: "structure",
        label: "文構造の誤認",
        description: "修飾関係や主語・目的語の関係を誤って解釈している",
        count: 5,
      },
      {
        id: "r3",
        category: "inference",
        label: "論理関係の読み違い",
        description: "原因・結果や逆接などの関係を正確に把握できていない",
        count: 4,
      },
      {
        id: "r4",
        category: "recall",
        label: "内容の再現不足",
        description: "読んだ直後でも内容を自分の言葉で説明できない",
        count: 3,
      },
    ],
    discoveries: [
      {
        id: "rd1",
        title: "語彙の推測に頼りすぎている",
        description:
          "文章全体の雰囲気から意味を推測できている一方、重要語句の正確な理解が不足しています。",
        severity: "high",
        category: "vocabulary",
      },
      {
        id: "rd2",
        title: "大意は把握できている",
        description:
          "文章のテーマや筆者の主張は比較的正確に捉えられています。",
        severity: "low",
        category: "inference",
      },
    ],
  },
  {
    skill: "listening",
    score: 55,
    confidence: 82,
    actualUnderstanding: 55,
    analyzedCount: 8,
    errors: [
      {
        id: "l1",
        category: "vocabulary",
        label: "音声での語彙認識",
        description: "知っている単語でも音声になると認識できない",
        count: 7,
      },
      {
        id: "l2",
        category: "recall",
        label: "聞いた内容の保持",
        description: "聞き取った情報を保持したまま整理するのが難しい",
        count: 5,
      },
      {
        id: "l3",
        category: "structure",
        label: "文のつながり",
        description: "複数の情報が続くと関係性を見失いやすい",
        count: 3,
      },
    ],
    discoveries: [
      {
        id: "ld1",
        title: "知識と音声認識に差がある",
        description:
          "文字で見れば理解できる語彙でも、音声では認識できないケースが目立ちます。",
        severity: "high",
        category: "vocabulary",
      },
    ],
  },
  {
    skill: "writing",
    score: 72,
    confidence: 78,
    actualUnderstanding: 72,
    analyzedCount: 6,
    errors: [
      {
        id: "w1",
        category: "grammar",
        label: "文法の不安定さ",
        description: "複雑な文を作る際に文法の正確性が下がる",
        count: 4,
      },
      {
        id: "w2",
        category: "expression",
        label: "表現の単調さ",
        description: "同じ語彙や文型を繰り返し使う傾向がある",
        count: 3,
      },
      {
        id: "w3",
        category: "structure",
        label: "文章構成",
        description: "意見と根拠のつながりが不明瞭になることがある",
        count: 2,
      },
    ],
    discoveries: [
      {
        id: "wd1",
        title: "伝えたい内容は明確",
        description:
          "主張そのものは伝わっています。今後は表現の正確さと多様性が課題です。",
        severity: "medium",
        category: "expression",
      },
    ],
  },
  {
    skill: "speaking",
    score: 61,
    confidence: 85,
    actualUnderstanding: 61,
    analyzedCount: 5,
    errors: [
      {
        id: "s1",
        category: "recall",
        label: "語彙の即時検索",
        description: "知っている単語が会話中にすぐ出てこない",
        count: 6,
      },
      {
        id: "s2",
        category: "fluency",
        label: "発話の流暢さ",
        description: "文を組み立てる際に沈黙や言い直しが増える",
        count: 4,
      },
      {
        id: "s3",
        category: "grammar",
        label: "即興時の文法",
        description: "準備した文章と即興の発話で正確性に差がある",
        count: 3,
      },
    ],
    discoveries: [
      {
        id: "sd1",
        title: "準備した発話と即興発話に差がある",
        description:
          "事前に考えた内容は話せますが、予想外の質問への対応で負荷が高くなっています。",
        severity: "high",
        category: "fluency",
      },
    ],
  },
];

// ========================================
// 学習履歴
// ========================================

export const mockHistory: AnalysisHistory[] = [
  { id: "h1", date: "2026-10-01", skill: "reading", score: 52, confidence: 80 },
  { id: "h2", date: "2026-10-05", skill: "reading", score: 56, confidence: 82 },
  { id: "h3", date: "2026-10-09", skill: "reading", score: 61, confidence: 85 },
  { id: "h4", date: "2026-10-13", skill: "reading", score: 58, confidence: 84 },
  { id: "h5", date: "2026-10-17", skill: "reading", score: 65, confidence: 87 },
  { id: "h6", date: "2026-10-21", skill: "reading", score: 63, confidence: 86 },
  { id: "h7", date: "2026-10-25", skill: "reading", score: 68, confidence: 88 },

  { id: "h8", date: "2026-10-03", skill: "listening", score: 45, confidence: 75 },
  { id: "h9", date: "2026-10-08", skill: "listening", score: 48, confidence: 78 },
  { id: "h10", date: "2026-10-14", skill: "listening", score: 50, confidence: 79 },
  { id: "h11", date: "2026-10-20", skill: "listening", score: 52, confidence: 80 },
  { id: "h12", date: "2026-10-28", skill: "listening", score: 55, confidence: 82 },

  { id: "h13", date: "2026-10-04", skill: "writing", score: 62, confidence: 72 },
  { id: "h14", date: "2026-10-12", skill: "writing", score: 66, confidence: 75 },
  { id: "h15", date: "2026-10-19", skill: "writing", score: 69, confidence: 77 },
  { id: "h16", date: "2026-10-27", skill: "writing", score: 72, confidence: 78 },

  { id: "h17", date: "2026-10-06", skill: "speaking", score: 50, confidence: 78 },
  { id: "h18", date: "2026-10-15", skill: "speaking", score: 55, confidence: 81 },
  { id: "h19", date: "2026-10-23", skill: "speaking", score: 61, confidence: 85 },
];

// ========================================
// 文章ごとの分析データ
// ========================================

export const mockTexts: TextAnalysis[] = [
  {
    id: "text-1",
    title: "中国語ニュース：教育改革",
    language: "zh",
    skill: "reading",
    analyzedAt: "2026-10-29",
    confidence: 90,
    actualUnderstanding: 65,
    score: 65,
    errors: [
      {
        id: "t1-e1",
        category: "vocabulary",
        label: "重要語彙の誤認",
        description: "文脈から意味を推測したが、実際の意味とは異なっていた",
        count: 4,
        examples: ["政策関連語彙", "抽象的な表現"],
      },
      {
        id: "t1-e2",
        category: "inference",
        label: "筆者の意図",
        description: "事実の説明と筆者の評価を区別できていなかった",
        count: 2,
      },
    ],
    summary:
      "文章の大意は把握できていましたが、重要語彙の理解と筆者の意図の読み取りに課題がありました。",
  },
  {
    id: "text-2",
    title: "ドイツ語記事：環境政策",
    language: "de",
    skill: "reading",
    analyzedAt: "2026-10-26",
    confidence: 80,
    actualUnderstanding: 70,
    score: 70,
    errors: [
      {
        id: "t2-e1",
        category: "structure",
        label: "長文の構造",
        description: "従属節と主節の関係を一部誤って解釈した",
        count: 3,
      },
    ],
    summary:
      "文全体の意味は概ね正確でした。複雑な文構造を素早く処理する練習が有効です。",
  },
  {
    id: "text-3",
    title: "スペイン語：家族についての会話",
    language: "es",
    skill: "listening",
    analyzedAt: "2026-10-22",
    confidence: 85,
    actualUnderstanding: 55,
    score: 55,
    errors: [
      {
        id: "t3-e1",
        category: "vocabulary",
        label: "音声での単語認識",
        description: "既知の単語を音声の中で認識できなかった",
        count: 5,
      },
    ],
    summary:
      "話題の流れは追えていましたが、細かな情報の聞き取りに課題がありました。",
  },
];

// ========================================
// Reality Check 全体の仮データ
// ========================================

export const mockRealityCheckData: RealityCheckData = {
  language: "zh",
  analyses: mockSkillAnalyses,
  history: mockHistory,
  texts: mockTexts,
};
