
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

// アプリで使用する言語
export type AppLanguage =
  | "ja"
  | "de"
  | "en"
  | "zh-CN"
  | "zh-TW"
  | "es"
  | "it";

// 言語設定の型
type LanguageContextType = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
};

// 保存用キー
const LANGUAGE_STORAGE_KEY = "anki-app-language";

// 初期値
const DEFAULT_LANGUAGE: AppLanguage = "ja";

// Context
const LanguageContext =
  createContext<LanguageContextType | undefined>(undefined);

// Provider
export function AppLanguageProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [language, setLanguageState] =
    useState<AppLanguage>(DEFAULT_LANGUAGE);

  const [ready, setReady] = useState(false);

  // 初回読み込み時に保存済みの言語を取得
  useEffect(() => {
    try {
      const savedLanguage = localStorage.getItem(
        LANGUAGE_STORAGE_KEY
      );

      const supportedLanguages: AppLanguage[] = [
        "ja",
        "de",
        "en",
        "zh-CN",
        "zh-TW",
        "es",
        "it",
      ];

      if (
        savedLanguage &&
        supportedLanguages.includes(savedLanguage as AppLanguage)
      ) {
        setLanguageState(savedLanguage as AppLanguage);
      }
    } catch (error) {
      console.error("言語設定の読み込みに失敗しました:", error);
    } finally {
      setReady(true);
    }
  }, []);

  // 言語変更
  const setLanguage = (newLanguage: AppLanguage) => {
    setLanguageState(newLanguage);

    try {
      localStorage.setItem(
        LANGUAGE_STORAGE_KEY,
        newLanguage
      );
    } catch (error) {
      console.error("言語設定の保存に失敗しました:", error);
    }
  };

  // Providerが準備できるまでは初期言語を使用
  const value: LanguageContextType = {
    language: ready ? language : DEFAULT_LANGUAGE,
    setLanguage,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

// 共通言語設定を取得するHook
export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error(
      "useLanguage must be used within AppLanguageProvider"
    );
  }

  return context;
}

// 旧Hook名との互換性
export const useAppLanguage = useLanguage;
