
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Language =
  | "ja"
  | "zh-CN"
  | "zh-TW"
  | "en"
  | "de"
  | "es"
  | "it";

type LanguageContextType = {
  language: Language;
  setLanguage: (language: Language) => void;
  isLanguageReady: boolean;
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

const STORAGE_KEY = "anki-language";

const supportedLanguages: Language[] = [
  "ja",
  "zh-CN",
  "zh-TW",
  "en",
  "de",
  "es",
  "it",
];

export function LanguageProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [language, setLanguageState] = useState<Language>("ja");
  const [isLanguageReady, setIsLanguageReady] = useState(false);

  useEffect(() => {
    try {
      const savedLanguage = localStorage.getItem(STORAGE_KEY);

      if (
        savedLanguage &&
        supportedLanguages.includes(savedLanguage as Language)
      ) {
        setLanguageState(savedLanguage as Language);
      }
    } catch {
      // 保存機能が使えない環境では日本語を使用する
    } finally {
      setIsLanguageReady(true);
    }
  }, []);

  function setLanguage(nextLanguage: Language) {
    setLanguageState(nextLanguage);

    try {
      localStorage.setItem(STORAGE_KEY, nextLanguage);
    } catch {
      // 保存できない場合も、現在の画面では言語を切り替える
    }
  }

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage, isLanguageReady }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error(
      "useLanguage must be used inside LanguageProvider"
    );
  }

  return context;
}
