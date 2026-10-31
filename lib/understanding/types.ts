
/**
 * Reality Check 共通型定義
 */

// 分析対象の言語
export type Language = "zh" | "de" | "es" | "ko" | "it" | "ja";

// 4技能
export type Skill = "reading" | "listening" | "writing" | "speaking";

// 分析カテゴリ
export type ErrorCategory =
  | "vocabulary"
  | "grammar"
  | "structure"
  | "inference"
  | "context"
  | "recall"
  | "pronunciation"
  | "fluency"
  | "expression"
  | "other";

// 誤解・理解不足の記録
export interface ErrorRecord {
  id: string;
  category: ErrorCategory;
  label: string;
  description: string;
  count: number;
  examples?: string[];
}

// 分析で発見したこと
export interface Discovery {
  id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high";
  category: ErrorCategory;
}

// 技能ごとの分析結果
export interface SkillAnalysis {
  skill: Skill;
  score: number;
  confidence: number;
  actualUnderstanding: number;
  analyzedCount: number;
  errors: ErrorRecord[];
  discoveries: Discovery[];
}

// 学習履歴
export interface AnalysisHistory {
  id: string;
  date: string;
  skill: Skill;
  score: number;
  confidence: number;
}

// 文章・課題単位の分析結果
export interface TextAnalysis {
  id: string;
  title: string;
  language: Language;
  skill: Skill;
  analyzedAt: string;
  confidence: number;
  actualUnderstanding: number;
  score: number;
  errors: ErrorRecord[];
  summary: string;
}

// Reality Check 全体の分析データ
export interface RealityCheckData {
  language: Language;
  analyses: SkillAnalysis[];
  history: AnalysisHistory[];
  texts: TextAnalysis[];
}

