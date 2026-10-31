
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type AppLanguage =
  | "ja"
  | "de"
  | "en"
  | "zh-CN"
  | "zh-TW"
  | "es";

const translations: Record<AppLanguage, Record<string, string>> = {
  ja: {
    "nav.study": "YOUR STUDY",
    "nav.games": "GAMES & STORIES",
    "nav.preferences": "PREFERENCES",
    "nav.today": "今日のノルマ",
    "nav.studyData": "学習記録",
    "nav.realityCheck": "Reality Check",
    "nav.calendar": "学習カレンダー",
    "nav.decks": "暗記デッキ",
    "nav.materials": "教材",
    "nav.plan": "学習計画",
    "nav.tasks": "タスク",
    "nav.world": "世界地図",
    "nav.library": "Little Library",
    "nav.quest": "Language Quest",
    "nav.armada": "無敵艦隊 · スペイン語",
    "nav.story": "戦国策 · 中国語",
    "nav.moments": "Little Moments",
    "nav.settings": "設定",
    "nav.open": "メニューを開く",
    "nav.close": "メニューを閉じる",
    "nav.login": "ログイン・新規登録",
    "nav.loginDescription": "学習データを管理する",
  },

  de: {
    "nav.study": "LERNEN",
    "nav.games": "SPIELE & GESCHICHTEN",
    "nav.preferences": "EINSTELLUNGEN",
    "nav.today": "Heutiges Lernziel",
    "nav.studyData": "Lernstatistik",
    "nav.realityCheck": "Reality Check",
    "nav.calendar": "Lernkalender",
    "nav.decks": "Vokabelkarten",
    "nav.materials": "Lernmaterialien",
    "nav.plan": "Lernplan",
    "nav.tasks": "Aufgaben",
    "nav.world": "Weltkarte",
    "nav.library": "Little Library",
    "nav.quest": "Language Quest",
    "nav.armada": "Armada · Spanisch",
    "nav.story": "Sengoku · Chinesisch",
    "nav.moments": "Little Moments",
    "nav.settings": "Einstellungen",
    "nav.open": "Menü öffnen",
    "nav.close": "Menü schließen",
    "nav.login": "Anmelden / Registrieren",
    "nav.loginDescription": "Lerndaten verwalten",
  },

  en: {
    "nav.study": "YOUR STUDY",
    "nav.games": "GAMES & STORIES",
    "nav.preferences": "PREFERENCES",
    "nav.today": "Today's Goals",
    "nav.studyData": "Study Records",
    "nav.realityCheck": "Reality Check",
    "nav.calendar": "Study Calendar",
    "nav.decks": "Flashcard Decks",
    "nav.materials": "Materials",
    "nav.plan": "Study Plan",
    "nav.tasks": "Tasks",
    "nav.world": "Language World Map",
    "nav.library": "Little Library",
    "nav.quest": "Language Quest",
    "nav.armada": "Spanish Armada",
    "nav.story": "Sengoku Strategies · Chinese",
    "nav.moments": "Little Moments",
    "nav.settings": "Settings",
    "nav.open": "Open menu",
    "nav.close": "Close menu",
    "nav.login": "Log in / Sign up",
    "nav.loginDescription": "Manage your study data",
  },

  "zh-CN": {
    "nav.study": "学习",
    "nav.games": "游戏与故事",
    "nav.preferences": "偏好设置",
    "nav.today": "今日学习目标",
    "nav.studyData": "学习记录",
    "nav.realityCheck": "Reality Check",
    "nav.calendar": "学习日历",
    "nav.decks": "记忆卡组",
    "nav.materials": "学习教材",
    "nav.plan": "学习计划",
    "nav.tasks": "任务",
    "nav.world": "语言世界地图",
    "nav.library": "Little Library",
    "nav.quest": "Language Quest",
    "nav.armada": "西班牙无敌舰队",
    "nav.story": "战国策 · 中文",
    "nav.moments": "Little Moments",
    "nav.settings": "设置",
    "nav.open": "打开菜单",
    "nav.close": "关闭菜单",
    "nav.login": "登录 / 注册",
    "nav.loginDescription": "管理学习数据",
  },

  "zh-TW": {
    "nav.study": "學習",
    "nav.games": "遊戲與故事",
    "nav.preferences": "偏好設定",
    "nav.today": "今日學習目標",
    "nav.studyData": "學習紀錄",
    "nav.realityCheck": "Reality Check",
    "nav.calendar": "學習行事曆",
    "nav.decks": "記憶卡組",
    "nav.materials": "學習教材",
    "nav.plan": "學習計畫",
    "nav.tasks": "任務",
    "nav.world": "語言世界地圖",
    "nav.library": "Little Library",
    "nav.quest": "Language Quest",
    "nav.armada": "西班牙無敵艦隊",
    "nav.story": "戰國策 · 中文",
    "nav.moments": "Little Moments",
    "nav.settings": "設定",
    "nav.open": "開啟選單",
    "nav.close": "關閉選單",
    "nav.login": "登入 / 註冊",
    "nav.loginDescription": "管理學習資料",
  },

  es: {
    "nav.study": "TU APRENDIZAJE",
    "nav.games": "JUEGOS E HISTORIAS",
    "nav.preferences": "PREFERENCIAS",
    "nav.today": "Objetivos de hoy",
    "nav.studyData": "Registro de estudio",
    "nav.realityCheck": "Reality Check",
    "nav.calendar": "Calendario de estudio",
    "nav.decks": "Mazos de tarjetas",
    "nav.materials": "Materiales",
    "nav.plan": "Plan de estudio",
    "nav.tasks": "Tareas",
    "nav.world": "Mapa del mundo",
    "nav.library": "Little Library",
    "nav.quest": "Language Quest",
    "nav.armada": "Armada española",
    "nav.story": "Estrategias Sengoku · Chino",
    "nav.moments": "Little Moments",
    "nav.settings": "Configuración",
    "nav.open": "Abrir menú",
    "nav.close": "Cerrar menú",
    "nav.login": "Iniciar sesión / Registrarse",
    "nav.loginDescription": "Gestionar datos de estudio",
  },
};

type AppLanguageContextType = {
  language: AppLanguage;
  t: (key: string) => string;
};

const AppLanguageContext =
  createContext<AppLanguageContextType | null>(null);

function isAppLanguage(value: string): value is AppLanguage {
  return ["ja", "de", "en", "zh-CN", "zh-TW", "es"].includes(value);
}

export function AppLanguageProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [language, setLanguage] = useState<AppLanguage>("ja");

  useEffect(() => {
    const applyLanguage = () => {
      try {
        const saved = localStorage.getItem("anki-app-language");

        const nextLanguage =
          saved && isAppLanguage(saved) ? saved : "ja";

        setLanguage(nextLanguage);
        document.documentElement.lang = nextLanguage;
      } catch {
        setLanguage("ja");
        document.documentElement.lang = "ja";
      }
    };

    applyLanguage();

    window.addEventListener("storage", applyLanguage);
    window.addEventListener("anki-language-change", applyLanguage);

    return () => {
      window.removeEventListener("storage", applyLanguage);
      window.removeEventListener("anki-language-change", applyLanguage);
    };
  }, []);

  const t = useCallback(
    (key: string) => {
      return translations[language][key] ?? translations.ja[key] ?? key;
    },
    [language]
  );

  return (
    <AppLanguageContext.Provider value={{ language, t }}>
      {children}
    </AppLanguageContext.Provider>
  );
}

export function useAppLanguage() {
  const context = useContext(AppLanguageContext);

  if (!context) {
    throw new Error(
      "useAppLanguage must be used inside AppLanguageProvider"
    );
  }

  return context;
}

