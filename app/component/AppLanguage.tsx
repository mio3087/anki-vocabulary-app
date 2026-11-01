
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

// 言語変更イベント
const LANGUAGE_CHANGE_EVENT = "anki-language-change";

// 初期値
const DEFAULT_LANGUAGE: AppLanguage = "ja";

// 対応言語
const SUPPORTED_LANGUAGES: AppLanguage[] = [
  "ja",
  "de",
  "en",
  "zh-CN",
  "zh-TW",
  "es",
  "it",
];

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

  // 初回読み込み・言語変更イベントの監視
  useEffect(() => {
    const loadLanguage = () => {
      try {
        const savedLanguage = localStorage.getItem(
          LANGUAGE_STORAGE_KEY
        );

        if (
          savedLanguage &&
          SUPPORTED_LANGUAGES.includes(
            savedLanguage as AppLanguage
          )
        ) {
          setLanguageState(savedLanguage as AppLanguage);
        } else {
          setLanguageState(DEFAULT_LANGUAGE);
        }
      } catch (error) {
        console.error(
          "言語設定の読み込みに失敗しました:",
          error
        );
      } finally {
        setReady(true);
      }
    };

    // 初回読み込み
    loadLanguage();

    // 設定ページからの言語変更を検知
    window.addEventListener(
      LANGUAGE_CHANGE_EVENT,
      loadLanguage
    );

    // 別タブでの言語変更も検知
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === LANGUAGE_STORAGE_KEY) {
        loadLanguage();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener(
        LANGUAGE_CHANGE_EVENT,
        loadLanguage
      );

      window.removeEventListener(
        "storage",
        handleStorageChange
      );
    };
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
      console.error(
        "言語設定の保存に失敗しました:",
        error
      );
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
