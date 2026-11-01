"use client";

import { useEffect, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
} from "react-simple-maps";

import { languages as defaultLanguages } from "../data/language-countries";

import { useLanguage } from "@/app/component/AppLanguage";

type LanguageCode = "ja" | "de" | "en" | "zh-CN" | "zh-TW" | "es";

type Language = {
  id: string;
  name: string;
  color: string;
  lightColor: string;
  studyCountries: string[];
  speakingCountries: string[];
};

type Progress = Record<string, number>;

type SelectedCountry = {
  id: string;
  name: string;
} | null;

const geoUrl =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const PROGRESS_KEY = "language-world-progress";
const LANGUAGES_KEY = "language-world-custom-languages";

const translations: Record<LanguageCode, any> = {
  ja: {
    description:
      "学んだ言語で世界を少しずつ色づけよう。複数の言語の記録も同時に残せます。",
    chooseLanguage: "① 学習言語を選ぶ",
    addLanguage: "＋ 言語を追加",
    edit: "編集",
    delete: "削除",
    editLanguage: "言語を編集",
    languageName: "言語名",
    languageColor: "言語カラー",
    saveChanges: "変更を保存",
    cancel: "キャンセル",
    registerLanguage: "新しい言語を登録",
    languagePlaceholder: "例：アラビア語",
    addThisLanguage: "この言語を追加",
    bulkColor: "対象国を一括で色付け",
    bulkDescription:
      "が使われる対象国をまとめて変更できます。ほかの言語の記録には影響しません。",
    learningColor: "学習中の色にする",
    someSpeakingColor: "少し話せる色にする",
    speakingColor: "話せる色にする",
    clearColors: "対象国の色を解除",
    clearConfirm: "の対象国の色をすべて解除しますか？",
    chooseCountry: "② 地図上の国をクリック",
    mapDescription:
      "1つの国に複数の言語が登録されている場合は、それぞれの色を縞模様で表示します。",
    selectedCountry: "選択した国",
    registeredLanguages: "この国に登録されている言語",
    noColor: "まだ色が設定されていません。",
    changeLearningStatus: "の学習状況を変更",
    autoSave:
      "変更は自動保存されます。未学習に戻しても、ほかの言語の記録は消えません。",
    close: "閉じる",
    footer:
      "記録はこのブラウザに自動保存されます。言語ごとに記録を管理し、複数言語の色を同時に表示します。",
    loading: "地図データを読み込んでいます…",
    loadError: "地図データの読み込みに失敗しました",
    saveError: "地図データの保存に失敗しました",
    enterName: "言語名を入力してください。",
    alreadyRegistered: "この言語はすでに登録されています。",
    nameAlreadyUsed: "この言語名はすでに使われています。",
    deleteConfirm: (name: string) =>
      `「${name}」を削除しますか？\n\nこの言語の国別記録も削除されます。`,
    countryCode: (id: string) => `国コード ${id}`,
    levels: [
      { label: "未学習", description: "まだこれから" },
      { label: "学習中", description: "淡い色" },
      { label: "少し話せる", description: "中くらいの色" },
      { label: "話せる！", description: "濃い色" },
    ],
    languageNames: {
      ドイツ語: "ドイツ語",
      スペイン語: "スペイン語",
      英語: "英語",
      中国語: "中国語",
      韓国語: "韓国語",
      イタリア語: "イタリア語",
      フランス語: "フランス語",
      ポルトガル語: "ポルトガル語",
      ロシア語: "ロシア語",
      日本語: "日本語",
      オランダ語: "オランダ語",
    },
  },

  de: {
    description:
      "Färbe die Welt Schritt für Schritt mit den Sprachen, die du lernst. Du kannst mehrere Sprachen gleichzeitig dokumentieren.",
    chooseLanguage: "① Lernsprache auswählen",
    addLanguage: "＋ Sprache hinzufügen",
    edit: "Bearbeiten",
    delete: "Löschen",
    editLanguage: "Sprache bearbeiten",
    languageName: "Sprachname",
    languageColor: "Sprachfarbe",
    saveChanges: "Änderungen speichern",
    cancel: "Abbrechen",
    registerLanguage: "Neue Sprache hinzufügen",
    languagePlaceholder: "z. B. Arabisch",
    addThisLanguage: "Diese Sprache hinzufügen",
    bulkColor: "Zielländer auf einmal einfärben",
    bulkDescription:
      " kann in diesen Ländern verwendet werden. Du kannst ihren Status gemeinsam ändern. Andere Sprachaufzeichnungen bleiben unverändert.",
    learningColor: "Als „Lerne ich gerade“ markieren",
    someSpeakingColor: "Als „Ein wenig sprechen“ markieren",
    speakingColor: "Als „Kann ich sprechen“ markieren",
    clearColors: "Farben der Zielländer entfernen",
    clearConfirm:
      "Möchtest du alle Farben der Zielländer für entfernen?",
    chooseCountry: "② Ein Land auf der Karte auswählen",
    mapDescription:
      "Wenn für ein Land mehrere Sprachen registriert sind, werden ihre Farben als Streifen angezeigt.",
    selectedCountry: "Ausgewähltes Land",
    registeredLanguages: "In diesem Land registrierte Sprachen",
    noColor: "Noch keine Farbe festgelegt.",
    changeLearningStatus: "Lernfortschritt ändern",
    autoSave:
      "Änderungen werden automatisch gespeichert. Auch wenn du den Status auf „Noch nicht gelernt“ zurücksetzt, bleiben die Aufzeichnungen anderer Sprachen erhalten.",
    close: "Schließen",
    footer:
      "Deine Aufzeichnungen werden automatisch in diesem Browser gespeichert. Du kannst den Fortschritt für jede Sprache verwalten und mehrere Sprachfarben gleichzeitig anzeigen.",
    loading: "Kartendaten werden geladen…",
    loadError: "Die Kartendaten konnten nicht geladen werden",
    saveError: "Die Kartendaten konnten nicht gespeichert werden",
    enterName: "Bitte gib einen Sprachnamen ein.",
    alreadyRegistered: "Diese Sprache ist bereits registriert.",
    nameAlreadyUsed: "Dieser Sprachname wird bereits verwendet.",
    deleteConfirm: (name: string) =>
      `Möchtest du „${name}“ löschen?\n\nAuch die Länderaufzeichnungen dieser Sprache werden gelöscht.`,
    countryCode: (id: string) => `Ländercode ${id}`,
    levels: [
      { label: "Noch nicht gelernt", description: "Noch nicht begonnen" },
      { label: "Lerne ich gerade", description: "Helle Farbe" },
      { label: "Ein wenig sprechen", description: "Mittlere Farbe" },
      { label: "Kann ich sprechen!", description: "Dunkle Farbe" },
    ],
    languageNames: {
      ドイツ語: "Deutsch",
      スペイン語: "Spanisch",
      英語: "Englisch",
      中国語: "Chinesisch",
      韓国語: "Koreanisch",
      イタリア語: "Italienisch",
      フランス語: "Französisch",
      ポルトガル語: "Portugiesisch",
      ロシア語: "Russisch",
      日本語: "Japanisch",
      オランダ語: "Niederländisch",
    },
  },

  en: {
    description:
      "Color the world little by little with the languages you learn. You can track multiple languages at the same time.",
    chooseLanguage: "① Choose a language",
    addLanguage: "＋ Add language",
    edit: "Edit",
    delete: "Delete",
    editLanguage: "Edit language",
    languageName: "Language name",
    languageColor: "Language color",
    saveChanges: "Save changes",
    cancel: "Cancel",
    registerLanguage: "Register a new language",
    languagePlaceholder: "e.g. Arabic",
    addThisLanguage: "Add this language",
    bulkColor: "Color all target countries",
    bulkDescription:
      " can be used in these countries. You can update them all at once without affecting records for other languages.",
    learningColor: "Set to Learning",
    someSpeakingColor: "Set to Some speaking ability",
    speakingColor: "Set to Can speak",
    clearColors: "Clear target country colors",
    clearConfirm:
      "Clear all colors for the target countries of ?",
    chooseCountry: "② Click a country on the map",
    mapDescription:
      "If multiple languages are registered for one country, their colors are displayed as stripes.",
    selectedCountry: "Selected country",
    registeredLanguages: "Languages registered in this country",
    noColor: "No color has been set yet.",
    changeLearningStatus: " learning progress",
    autoSave:
      "Changes are saved automatically. Resetting a language to Not learned will not delete records for other languages.",
    close: "Close",
    footer:
      "Your records are automatically saved in this browser. Track each language separately and display multiple language colors at the same time.",
    loading: "Loading map data…",
    loadError: "Failed to load map data",
    saveError: "Failed to save map data",
    enterName: "Please enter a language name.",
    alreadyRegistered: "This language is already registered.",
    nameAlreadyUsed: "This language name is already in use.",
    deleteConfirm: (name: string) =>
      `Delete "${name}"?\n\nThe country records for this language will also be deleted.`,
    countryCode: (id: string) => `Country code ${id}`,
    levels: [
      { label: "Not learned", description: "Not started yet" },
      { label: "Learning", description: "Light color" },
      { label: "Can speak a little", description: "Medium color" },
      { label: "Can speak!", description: "Dark color" },
    ],
    languageNames: {
      ドイツ語: "German",
      スペイン語: "Spanish",
      英語: "English",
      中国語: "Chinese",
      韓国語: "Korean",
      イタリア語: "Italian",
      フランス語: "French",
      ポルトガル語: "Portuguese",
      ロシア語: "Russian",
      日本語: "Japanese",
      オランダ語: "Dutch",
    },
  },

  "zh-CN": {
    description:
      "用你正在学习的语言，一点一点为世界地图添上色彩。你也可以同时记录多种语言。",
    chooseLanguage: "① 选择学习语言",
    addLanguage: "＋ 添加语言",
    edit: "编辑",
    delete: "删除",
    editLanguage: "编辑语言",
    languageName: "语言名称",
    languageColor: "语言颜色",
    saveChanges: "保存更改",
    cancel: "取消",
    registerLanguage: "添加新语言",
    languagePlaceholder: "例如：阿拉伯语",
    addThisLanguage: "添加此语言",
    bulkColor: "批量标记目标国家",
    bulkDescription:
      "可以在这些国家使用。你可以批量更改这些国家的学习状态，不会影响其他语言的记录。",
    learningColor: "设为学习中",
    someSpeakingColor: "设为会说一点",
    speakingColor: "设为能够交流",
    clearColors: "清除目标国家的颜色",
    clearConfirm: "确定清除的所有目标国家的颜色吗？",
    chooseCountry: "② 点击地图上的国家",
    mapDescription:
      "如果一个国家登记了多种语言，地图上会以条纹显示各语言的颜色。",
    selectedCountry: "已选择的国家",
    registeredLanguages: "登记在该国家的语言",
    noColor: "尚未设置颜色。",
    changeLearningStatus: "的学习状态",
    autoSave:
      "更改会自动保存。即使恢复为未学习，也不会删除其他语言的记录。",
    close: "关闭",
    footer:
      "记录会自动保存在当前浏览器中。你可以分别管理每种语言的学习记录，并同时显示多种语言的颜色。",
    loading: "正在加载地图数据…",
    loadError: "地图数据加载失败",
    saveError: "地图数据保存失败",
    enterName: "请输入语言名称。",
    alreadyRegistered: "该语言已经登记。",
    nameAlreadyUsed: "该语言名称已被使用。",
    deleteConfirm: (name: string) =>
      `确定删除“${name}”吗？\n\n该语言的国家记录也会一并删除。`,
    countryCode: (id: string) => `国家代码 ${id}`,
    levels: [
      { label: "未学习", description: "还未开始" },
      { label: "学习中", description: "浅色" },
      { label: "会说一点", description: "中等颜色" },
      { label: "会说！", description: "深色" },
    ],
    languageNames: {
      ドイツ語: "德语",
      スペイン語: "西班牙语",
      英語: "英语",
      中国語: "中文",
      韓国語: "韩语",
      イタリア語: "意大利语",
      フランス語: "法语",
      ポルトガル語: "葡萄牙语",
      ロシア語: "俄语",
      日本語: "日语",
      オランダ語: "荷兰语",
    },
  },

  "zh-TW": {
    description:
      "用你正在學習的語言，一點一點為世界地圖添上色彩。你也可以同時記錄多種語言。",
    chooseLanguage: "① 選擇學習語言",
    addLanguage: "＋ 新增語言",
    edit: "編輯",
    delete: "刪除",
    editLanguage: "編輯語言",
    languageName: "語言名稱",
    languageColor: "語言顏色",
    saveChanges: "儲存變更",
    cancel: "取消",
    registerLanguage: "新增語言",
    languagePlaceholder: "例如：阿拉伯語",
    addThisLanguage: "新增此語言",
    bulkColor: "批次標記目標國家",
    bulkDescription:
      "可以在這些國家使用。你可以一次變更這些國家的學習狀態，不會影響其他語言的紀錄。",
    learningColor: "設為學習中",
    someSpeakingColor: "設為會說一點",
    speakingColor: "設為能夠溝通",
    clearColors: "清除目標國家的顏色",
    clearConfirm: "確定清除的所有目標國家的顏色嗎？",
    chooseCountry: "② 點擊地圖上的國家",
    mapDescription:
      "如果一個國家登記了多種語言，地圖上會以條紋顯示各語言的顏色。",
    selectedCountry: "已選擇的國家",
    registeredLanguages: "登記在該國家的語言",
    noColor: "尚未設定顏色。",
    changeLearningStatus: "的學習狀態",
    autoSave:
      "變更會自動儲存。即使恢復為未學習，也不會刪除其他語言的紀錄。",
    close: "關閉",
    footer:
      "紀錄會自動儲存在目前的瀏覽器中。你可以分別管理每種語言的學習紀錄，並同時顯示多種語言的顏色。",
    loading: "正在載入地圖資料…",
    loadError: "地圖資料載入失敗",
    saveError: "地圖資料儲存失敗",
    enterName: "請輸入語言名稱。",
    alreadyRegistered: "此語言已經登記。",
    nameAlreadyUsed: "此語言名稱已被使用。",
    deleteConfirm: (name: string) =>
      `確定刪除「${name}」嗎？\n\n此語言的國家紀錄也會一併刪除。`,
    countryCode: (id: string) => `國家代碼 ${id}`,
    levels: [
      { label: "未學習", description: "尚未開始" },
      { label: "學習中", description: "淺色" },
      { label: "會說一點", description: "中等顏色" },
      { label: "會說！", description: "深色" },
    ],
    languageNames: {
      ドイツ語: "德語",
      スペイン語: "西班牙語",
      英語: "英語",
      中国語: "中文",
      韓国語: "韓語",
      イタリア語: "義大利語",
      フランス語: "法語",
      ポルトガル語: "葡萄牙語",
      ロシア語: "俄語",
      日本語: "日語",
      オランダ語: "荷蘭語",
    },
  },

  es: {
    description:
      "Colorea el mundo poco a poco con los idiomas que aprendes. También puedes registrar varios idiomas al mismo tiempo.",
    chooseLanguage: "① Elegir idioma de aprendizaje",
    addLanguage: "＋ Añadir idioma",
    edit: "Editar",
    delete: "Eliminar",
    editLanguage: "Editar idioma",
    languageName: "Nombre del idioma",
    languageColor: "Color del idioma",
    saveChanges: "Guardar cambios",
    cancel: "Cancelar",
    registerLanguage: "Registrar un nuevo idioma",
    languagePlaceholder: "Ej.: árabe",
    addThisLanguage: "Añadir este idioma",
    bulkColor: "Colorear todos los países objetivo",
    bulkDescription:
      " se utiliza en estos países. Puedes cambiar su estado de aprendizaje en bloque sin afectar los registros de otros idiomas.",
    learningColor: "Marcar como En aprendizaje",
    someSpeakingColor: "Marcar como Puedo hablar un poco",
    speakingColor: "Marcar como Puedo hablar",
    clearColors: "Quitar colores de los países objetivo",
    clearConfirm:
      "¿Quieres quitar todos los colores de los países objetivo de ?",
    chooseCountry: "② Haz clic en un país del mapa",
    mapDescription:
      "Si hay varios idiomas registrados en un país, sus colores se mostrarán en forma de franjas.",
    selectedCountry: "País seleccionado",
    registeredLanguages: "Idiomas registrados en este país",
    noColor: "Todavía no se ha establecido ningún color.",
    changeLearningStatus: "Cambiar el progreso de aprendizaje de",
    autoSave:
      "Los cambios se guardan automáticamente. Aunque vuelvas a «No aprendido», los registros de otros idiomas no se eliminarán.",
    close: "Cerrar",
    footer:
      "Tus registros se guardan automáticamente en este navegador. Puedes gestionar cada idioma por separado y mostrar varios colores al mismo tiempo.",
    loading: "Cargando los datos del mapa…",
    loadError: "No se pudieron cargar los datos del mapa",
    saveError: "No se pudieron guardar los datos del mapa",
    enterName: "Introduce el nombre del idioma.",
    alreadyRegistered: "Este idioma ya está registrado.",
    nameAlreadyUsed: "Este nombre de idioma ya está en uso.",
    deleteConfirm: (name: string) =>
      `¿Quieres eliminar «${name}»?\n\nTambién se eliminarán los registros de países de este idioma.`,
    countryCode: (id: string) => `Código del país ${id}`,
    levels: [
      { label: "No aprendido", description: "Aún no he empezado" },
      { label: "En aprendizaje", description: "Color claro" },
      { label: "Puedo hablar un poco", description: "Color intermedio" },
      { label: "¡Puedo hablar!", description: "Color oscuro" },
    ],
    languageNames: {
      ドイツ語: "Alemán",
      スペイン語: "Español",
      英語: "Inglés",
      中国語: "Chino",
      韓国語: "Coreano",
      イタリア語: "Italiano",
      フランス語: "Francés",
      ポルトガル語: "Portugués",
      ロシア語: "Ruso",
      日本語: "Japonés",
      オランダ語: "Neerlandés",
    },
  },
};

const automaticCountrySets: Record<string, string[]> = {
  フランス語: [
    "250", "056", "756", "124", "442", "492", "204", "854",
    "140", "148", "174", "384", "180", "178", "262", "266",
    "450", "466", "562", "646", "690", "768", "332", "324",
    "686", "624", "430", "678", "548", "638",
  ],
  ポルトガル語: [
    "076", "620", "024", "508", "624", "132", "678", "626",
    "226",
  ],
  ロシア語: ["643", "112", "398", "417", "762", "795"],
  日本語: ["392"],
  オランダ語: ["528", "056", "740"],
  韓国語: ["410", "408"],
  中国語: ["156", "158", "702"],
  イタリア語: ["380", "674", "336", "756"],
  ドイツ語: ["276", "040", "756", "438", "442", "056"],
  スペイン語: [
    "724", "032", "068", "152", "170", "188", "192", "214",
    "218", "222", "320", "340", "484", "558", "591", "600",
    "604", "858", "862", "226",
  ],
  英語: [
    "826", "840", "124", "036", "554", "372", "356", "710",
    "566", "288", "404", "800", "050", "458", "702", "044",
    "052", "090", "548", "690", "426", "748", "516", "072",
    "894", "716", "388", "780",
  ],
};

const levels = [
  { value: 0 },
  { value: 1 },
  { value: 2 },
  { value: 3 },
] as const;

function getCountryId(id: string | number) {
  return String(id).padStart(3, "0");
}

function getKey(languageId: string, countryId: string) {
  return `${languageId}:${countryId}`;
}

function getLightColor(hex: string) {
  const value = hex.replace("#", "");
  const number = parseInt(value, 16);

  if (value.length !== 6 || Number.isNaN(number)) {
    return "#DCE6DD";
  }

  const mix = (channel: number) =>
    Math.round(channel + (255 - channel) * 0.78);

  const channels = [
    (number >> 16) & 255,
    (number >> 8) & 255,
    number & 255,
  ];

  return (
    "#" +
    channels
      .map((channel) =>
        mix(channel).toString(16).padStart(2, "0")
      )
      .join("")
  );
}

function getColor(language: Language, level: number) {
  if (level === 1) return language.lightColor;
  if (level === 2) return `${language.color}B3`;
  if (level === 3) return language.color;
  return "#E8E8E3";
}

function getAutomaticCountries(language: Language) {
  const normalizedName = language.name.trim().toLowerCase();

  const byName =
    automaticCountrySets[language.name.trim()] ??
    Object.entries(automaticCountrySets).find(
      ([name]) => name.toLowerCase() === normalizedName
    )?.[1] ??
    [];

  return Array.from(
    new Set([...language.studyCountries, ...byName])
  );
}

function getCountryLanguages(
  countryId: string,
  languageList: Language[],
  progress: Progress
) {
  return languageList.flatMap((language) => {
    const key = getKey(language.id, countryId);

    let level: number;

    if (Object.prototype.hasOwnProperty.call(progress, key)) {
      level = progress[key];
    } else if (language.speakingCountries.includes(countryId)) {
      level = 3;
    } else if (getAutomaticCountries(language).includes(countryId)) {
      level = 1;
    } else {
      level = 0;
    }

    if (level === 0) return [];

    return [
      {
        id: language.id,
        name: language.name,
        color: getColor(language, level),
        level,
      },
    ];
  });
}

export default function LanguageWorldMap() {
  const { language } = useAppLanguage();

  const currentLanguage: LanguageCode =
    language in translations ? (language as LanguageCode) : "ja";

  const t = translations[currentLanguage];

  const [languageList, setLanguageList] =
    useState<Language[]>(defaultLanguages);

  const [selectedLanguageId, setSelectedLanguageId] =
    useState(defaultLanguages[0]?.id ?? "");

  const [selectedCountry, setSelectedCountry] =
    useState<SelectedCountry>(null);

  const [progress, setProgress] = useState<Progress>({});

  const [newLanguageName, setNewLanguageName] = useState("");
  const [newLanguageColor, setNewLanguageColor] =
    useState("#718675");

  const [showAddLanguage, setShowAddLanguage] =
    useState(false);

  const [editingLanguageId, setEditingLanguageId] =
    useState<string | null>(null);

  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("#718675");

  const [ready, setReady] = useState(false);

  const getLanguageName = (name: string) =>
    t.languageNames[name as keyof typeof t.languageNames] ?? name;

  useEffect(() => {
    try {
      const savedLanguages =
        localStorage.getItem(LANGUAGES_KEY);

      const savedProgress =
        localStorage.getItem(PROGRESS_KEY);

      if (savedLanguages) {
        const parsed = JSON.parse(savedLanguages) as Language[];

        if (Array.isArray(parsed) && parsed.length > 0) {
          setLanguageList(parsed);
          setSelectedLanguageId(parsed[0].id);
        }
      }

      if (savedProgress) {
        const parsed = JSON.parse(savedProgress) as Progress;

        if (
          parsed &&
          typeof parsed === "object" &&
          !Array.isArray(parsed)
        ) {
          setProgress(parsed);
        }
      }
    } catch (error) {
      console.error(t.loadError, error);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;

    try {
      localStorage.setItem(
        PROGRESS_KEY,
        JSON.stringify(progress)
      );

      localStorage.setItem(
        LANGUAGES_KEY,
        JSON.stringify(languageList)
      );
    } catch (error) {
      console.error(t.saveError, error);
    }
  }, [progress, languageList, ready]);

  const selectedLanguage = languageList.find(
    (item) => item.id === selectedLanguageId
  );

  function getLevel(languageId: string, countryId: string) {
    const key = getKey(languageId, countryId);

    if (Object.prototype.hasOwnProperty.call(progress, key)) {
      return progress[key];
    }

    const language = languageList.find(
      (item) => item.id === languageId
    );

    if (!language) return 0;

    if (language.speakingCountries.includes(countryId)) {
      return 3;
    }

    if (getAutomaticCountries(language).includes(countryId)) {
      return 1;
    }

    return 0;
  }

  function updateLevel(level: number) {
    if (!selectedCountry || !selectedLanguage) return;

    const key = getKey(
      selectedLanguage.id,
      selectedCountry.id
    );

    setProgress((previous) => ({
      ...previous,
      [key]: level,
    }));
  }

  function colorAllStudyCountries(level: number) {
    if (!selectedLanguage) return;

    setProgress((previous) => {
      const next = { ...previous };

      for (const countryId of getAutomaticCountries(selectedLanguage)) {
        const key = getKey(selectedLanguage.id, countryId);
        next[key] = level;
      }

      return next;
    });
  }

  function addLanguage() {
    const name = newLanguageName.trim();

    if (!name) {
      alert(t.enterName);
      return;
    }

    if (
      languageList.some(
        (item) =>
          item.name.toLowerCase() === name.toLowerCase()
      )
    ) {
      alert(t.alreadyRegistered);
      return;
    }

    const newLanguage: Language = {
      id: `custom-${Date.now()}`,
      name,
      color: newLanguageColor,
      lightColor: getLightColor(newLanguageColor),
      studyCountries: [],
      speakingCountries: [],
    };

    setLanguageList((previous) => [...previous, newLanguage]);
    setSelectedLanguageId(newLanguage.id);
    setSelectedCountry(null);
    setNewLanguageName("");
    setShowAddLanguage(false);
  }

  function startEditing(language: Language) {
    setEditingLanguageId(language.id);
    setEditName(language.name);
    setEditColor(language.color);
    setShowAddLanguage(false);
  }

  function saveEdit() {
    const name = editName.trim();

    if (!editingLanguageId || !name) {
      alert(t.enterName);
      return;
    }

    if (
      languageList.some(
        (item) =>
          item.id !== editingLanguageId &&
          item.name.toLowerCase() === name.toLowerCase()
      )
    ) {
      alert(t.nameAlreadyUsed);
      return;
    }

    setLanguageList((previous) =>
      previous.map((item) =>
        item.id === editingLanguageId
          ? {
              ...item,
              name,
              color: editColor,
              lightColor: getLightColor(editColor),
            }
          : item
      )
    );

    setEditingLanguageId(null);
  }

  function deleteLanguage(language: Language) {
    const confirmed = window.confirm(
      t.deleteConfirm(getLanguageName(language.name))
    );

    if (!confirmed) return;

    setLanguageList((previous) =>
      previous.filter((item) => item.id !== language.id)
    );

    setProgress((previous) => {
      const next = { ...previous };

      for (const key of Object.keys(next)) {
        if (key.startsWith(`${language.id}:`)) {
          delete next[key];
        }
      }

      return next;
    });

    if (selectedLanguageId === language.id) {
      const remaining = languageList.filter(
        (item) => item.id !== language.id
      );

      setSelectedLanguageId(remaining[0]?.id ?? "");
      setSelectedCountry(null);
    }

    if (editingLanguageId === language.id) {
      setEditingLanguageId(null);
    }
  }

  const mapCountryIds = Array.from(
    new Set([
      ...languageList.flatMap((item) =>
        getAutomaticCountries(item)
      ),
      ...Object.keys(progress).map((key) =>
        key.slice(key.lastIndexOf(":") + 1)
      ),
    ])
  );

  const mapPatterns = mapCountryIds
    .map((countryId) => ({
      countryId,
      entries: getCountryLanguages(
        countryId,
        languageList,
        progress
      ),
    }))
    .filter(({ entries }) => entries.length > 1);

  if (!ready) {
    return (
      <div
        className="mx-auto max-w-5xl rounded-2xl p-6 shadow-sm"
        style={{ backgroundColor: "var(--surface)" }}
      >
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          {t.loading}
        </p>
      </div>
    );
  }

  return (
    <div
      className="mx-auto w-full max-w-5xl rounded-2xl p-4 shadow-sm md:p-6"
      style={{
        backgroundColor: "var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      <h1
        className="text-2xl font-semibold"
        style={{ color: "var(--foreground)" }}
      >
        Language World
      </h1>

      <p
        className="mt-2 text-sm leading-6"
        style={{ color: "var(--muted)" }}
      >
        {t.description}
      </p>

      <h2
        className="mt-6 text-sm font-semibold"
        style={{ color: "var(--anki-theme-dark)" }}
      >
        {t.chooseLanguage}
      </h2>

      <div className="mt-3 flex flex-wrap gap-2">
        {languageList.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setSelectedLanguageId(item.id);
              setSelectedCountry(null);
            }}
            className="rounded-xl border px-4 py-2 text-sm font-medium transition"
            style={{
              backgroundColor:
                selectedLanguageId === item.id
                  ? item.color
                  : "var(--surface)",
              color:
                selectedLanguageId === item.id
                  ? "#FFFFFF"
                  : "var(--foreground)",
              borderColor:
                selectedLanguageId === item.id
                  ? item.color
                  : "var(--border)",
              boxShadow:
                selectedLanguageId === item.id
                  ? "0 0 0 2px var(--anki-theme-light)"
                  : "none",
            }}
          >
            {getLanguageName(item.name)}
          </button>
        ))}

        <button
          type="button"
          onClick={() => {
            setShowAddLanguage((previous) => !previous);
            setEditingLanguageId(null);
          }}
          className="rounded-xl border border-dashed px-4 py-2 text-sm transition"
          style={{
            borderColor: "var(--anki-theme-color)",
            color: "var(--anki-theme-color)",
            backgroundColor: "var(--surface)",
          }}
        >
          {t.addLanguage}
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {languageList.map((item) => (
          <div
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl px-3 py-3"
            style={{
              border: "1px solid var(--border)",
              backgroundColor: "var(--surface)",
            }}
          >
            <div className="flex items-center gap-2">
              <span
                className="h-4 w-4 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span
                className="text-sm font-medium"
                style={{ color: "var(--foreground)" }}
              >
                {getLanguageName(item.name)}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => startEditing(item)}
                className="rounded-lg border px-3 py-1.5 text-xs transition"
                style={{
                  borderColor: "var(--border)",
                  color: "var(--anki-theme-color)",
                }}
              >
                {t.edit}
              </button>

              <button
                type="button"
                onClick={() => deleteLanguage(item)}
                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-600 transition hover:bg-red-50"
              >
                {t.delete}
              </button>
            </div>
          </div>
        ))}
      </div>

      {editingLanguageId && (
        <section
          className="mt-4 rounded-2xl p-4"
          style={{
            border: "1px solid var(--anki-theme-soft)",
            backgroundColor: "var(--anki-theme-light)",
          }}
        >
          <h3
            className="text-sm font-semibold"
            style={{ color: "var(--anki-theme-dark)" }}
          >
            {t.editLanguage}
          </h3>

          <label
            className="mt-3 block text-sm"
            style={{ color: "var(--foreground)" }}
          >
            {t.languageName}
          </label>

          <input
            value={editName}
            onChange={(event) => setEditName(event.target.value)}
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface)",
              color: "var(--foreground)",
            }}
          />

          <label
            className="mt-4 block text-sm"
            style={{ color: "var(--foreground)" }}
          >
            {t.languageColor}
          </label>

          <div className="mt-2 flex items-center gap-3">
            <input
              type="color"
              value={editColor}
              onChange={(event) => setEditColor(event.target.value)}
              className="h-10 w-14 cursor-pointer"
            />
            <span className="text-sm" style={{ color: "var(--muted)" }}>
              {editColor.toUpperCase()}
            </span>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={saveEdit}
              className="rounded-xl px-4 py-2 text-sm font-medium text-white transition"
              style={{ backgroundColor: "var(--anki-theme-color)" }}
            >
              {t.saveChanges}
            </button>

            <button
              type="button"
              onClick={() => setEditingLanguageId(null)}
              className="rounded-xl border px-4 py-2 text-sm transition"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--surface)",
                color: "var(--foreground)",
              }}
            >
              {t.cancel}
            </button>
          </div>
        </section>
      )}

      {showAddLanguage && (
        <section
          className="mt-4 rounded-2xl p-4"
          style={{
            border: "1px solid var(--anki-theme-soft)",
            backgroundColor: "var(--anki-theme-light)",
          }}
        >
          <h3
            className="text-sm font-semibold"
            style={{ color: "var(--anki-theme-dark)" }}
          >
            {t.registerLanguage}
          </h3>

          <label
            className="mt-3 block text-sm"
            style={{ color: "var(--foreground)" }}
          >
            {t.languageName}
          </label>

          <input
            value={newLanguageName}
            onChange={(event) =>
              setNewLanguageName(event.target.value)
            }
            placeholder={t.languagePlaceholder}
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface)",
              color: "var(--foreground)",
            }}
          />

          <label
            className="mt-4 block text-sm"
            style={{ color: "var(--foreground)" }}
          >
            {t.languageColor}
          </label>

          <div className="mt-2 flex items-center gap-3">
            <input
              type="color"
              value={newLanguageColor}
              onChange={(event) =>
                setNewLanguageColor(event.target.value)
              }
              className="h-10 w-14 cursor-pointer"
            />
            <span className="text-sm" style={{ color: "var(--muted)" }}>
              {newLanguageColor.toUpperCase()}
            </span>
          </div>

          <button
            type="button"
            onClick={addLanguage}
            className="mt-4 rounded-xl px-4 py-2 text-sm font-medium text-white transition"
            style={{ backgroundColor: "var(--anki-theme-color)" }}
          >
            {t.addThisLanguage}
          </button>
        </section>
      )}

      {selectedLanguage &&
        getAutomaticCountries(selectedLanguage).length > 0 && (
          <section
            className="mt-6 rounded-2xl p-4"
            style={{
              border: "1px solid var(--border)",
              backgroundColor: "var(--anki-theme-light)",
            }}
          >
            <h2
              className="text-sm font-semibold"
              style={{ color: "var(--anki-theme-dark)" }}
            >
              {t.bulkColor}
            </h2>

            <p
              className="mt-1 text-sm leading-6"
              style={{ color: "var(--muted)" }}
            >
              {getLanguageName(selectedLanguage.name)}
              {t.bulkDescription}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => colorAllStudyCountries(1)}
                className="rounded-xl border px-3 py-2 text-sm font-medium transition"
                style={{
                  backgroundColor: selectedLanguage.lightColor,
                  borderColor: selectedLanguage.color,
                  color: "var(--foreground)",
                }}
              >
                {t.learningColor}
              </button>

              <button
                type="button"
                onClick={() => colorAllStudyCountries(2)}
                className="rounded-xl border px-3 py-2 text-sm font-medium transition"
                style={{
                  backgroundColor: `${selectedLanguage.color}B3`,
                  borderColor: selectedLanguage.color,
                  color: "#263126",
                }}
              >
                {t.someSpeakingColor}
              </button>

              <button
                type="button"
                onClick={() => colorAllStudyCountries(3)}
                className="rounded-xl px-3 py-2 text-sm font-medium text-white transition"
                style={{
                  backgroundColor: selectedLanguage.color,
                }}
              >
                {t.speakingColor}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      `${getLanguageName(selectedLanguage.name)}${t.clearConfirm}`
                    )
                  ) {
                    colorAllStudyCountries(0);
                  }
                }}
                className="rounded-xl border px-3 py-2 text-sm transition"
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: "var(--surface)",
                  color: "var(--foreground)",
                }}
              >
                {t.clearColors}
              </button>
            </div>
          </section>
        )}

      <h2
        className="mt-6 text-sm font-semibold"
        style={{ color: "var(--anki-theme-dark)" }}
      >
        {t.chooseCountry}
      </h2>

      <p
        className="mt-2 text-xs leading-5"
        style={{ color: "var(--muted)" }}
      >
        {t.mapDescription}
      </p>

      <div className="mt-3">
        <ComposableMap
          projection="geoEqualEarth"
          width={900}
          height={500}
          style={{ width: "100%", height: "auto" }}
        >
          <defs>
            {mapPatterns.map(({ countryId, entries }) => (
              <pattern
                key={countryId}
                id={`country-pattern-${countryId}`}
                width={entries.length * 8}
                height="8"
                patternUnits="userSpaceOnUse"
              >
                {entries.map((entry, index) => (
                  <rect
                    key={entry.id}
                    x={index * 8}
                    y="0"
                    width="8"
                    height="8"
                    fill={entry.color}
                  />
                ))}
              </pattern>
            ))}
          </defs>

          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const countryId = getCountryId(geo.id ?? "");

                const entries = getCountryLanguages(
                  countryId,
                  languageList,
                  progress
                );

                const isSelected =
                  selectedCountry?.id === countryId;

                let fill = "#E8E8E3";

                if (entries.length > 1) {
                  fill = `url(#country-pattern-${countryId})`;
                } else if (entries.length === 1) {
                  fill = entries[0].color;
                }

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onClick={() =>
                      setSelectedCountry({
                        id: countryId,
                        name:
                          geo.properties?.name ??
                          t.countryCode(countryId),
                      })
                    }
                    fill={fill}
                    stroke={
                      isSelected
                        ? "var(--anki-theme-dark)"
                        : "#FFFFFF"
                    }
                    strokeWidth={isSelected ? 1.8 : 0.6}
                    style={{
                      outline: "none",
                      cursor: "pointer",
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>
      </div>

      {selectedLanguage && (
        <div
          className="mt-3 flex flex-wrap gap-3 text-xs"
          style={{ color: "var(--muted)" }}
        >
          {levels.map((level) => (
            <div
              key={level.value}
              className="flex items-center gap-2"
            >
              <span
                className="h-3 w-3 rounded-sm"
                style={{
                  backgroundColor: getColor(
                    selectedLanguage,
                    level.value
                  ),
                  border: "1px solid var(--border)",
                }}
              />
              {t.levels[level.value].label}
            </div>
          ))}
        </div>
      )}

      {selectedCountry && (
        <section
          className="mt-6 rounded-2xl p-4"
          style={{
            border: "1px solid var(--anki-theme-soft)",
            backgroundColor: "var(--anki-theme-light)",
          }}
        >
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            {t.selectedCountry}
          </p>

          <h2
            className="mt-1 text-lg font-semibold"
            style={{ color: "var(--foreground)" }}
          >
            {selectedCountry.name}
          </h2>

          <p
            className="mt-1 text-sm"
            style={{ color: "var(--muted)" }}
          >
            {t.registeredLanguages}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {getCountryLanguages(
              selectedCountry.id,
              languageList,
              progress
            ).map((entry) => (
              <span
                key={entry.id}
                className="rounded-lg border px-3 py-1.5 text-xs font-medium"
                style={{
                  color: entry.color,
                  borderColor: entry.color,
                  backgroundColor: "var(--surface)",
                }}
              >
                {getLanguageName(entry.name)}：
                {t.levels[entry.level].label}
              </span>
            ))}

            {getCountryLanguages(
              selectedCountry.id,
              languageList,
              progress
            ).length === 0 && (
              <span
                className="text-xs"
                style={{ color: "var(--muted)" }}
              >
                {t.noColor}
              </span>
            )}
          </div>

          {selectedLanguage && (
            <div
              className="mt-5 border-t pt-4"
              style={{ borderColor: "var(--border)" }}
            >
              <p
                className="text-sm font-medium"
                style={{ color: "var(--foreground)" }}
              >
                {getLanguageName(selectedLanguage.name)}
                {t.changeLearningStatus}
              </p>

              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {levels.map((level) => {
                  const isActive =
                    getLevel(
                      selectedLanguage.id,
                      selectedCountry.id
                    ) === level.value;

                  return (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => updateLevel(level.value)}
                      className="rounded-xl p-3 text-left transition"
                      style={{
                        backgroundColor: "var(--surface)",
                        borderColor: isActive
                          ? "var(--anki-theme-color)"
                          : "var(--border)",
                        borderWidth: isActive ? 2 : 1,
                        borderStyle: "solid",
                        boxShadow: isActive
                          ? "0 0 0 2px var(--anki-theme-light)"
                          : "none",
                      }}
                    >
                      <span
                        className="mb-2 block h-4 w-4 rounded"
                        style={{
                          backgroundColor: getColor(
                            selectedLanguage,
                            level.value
                          ),
                        }}
                      />

                      <span
                        className="block text-sm font-medium"
                        style={{ color: "var(--foreground)" }}
                      >
                        {t.levels[level.value].label}
                      </span>

                      <span
                        className="mt-1 block text-xs"
                        style={{ color: "var(--muted)" }}
                      >
                        {t.levels[level.value].description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <p
            className="mt-3 text-xs leading-5"
            style={{ color: "var(--muted)" }}
          >
            {t.autoSave}
          </p>

          <button
            type="button"
            onClick={() => setSelectedCountry(null)}
            className="mt-3 rounded-xl border px-4 py-2 text-sm transition"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface)",
              color: "var(--anki-theme-color)",
            }}
          >
            {t.close}
          </button>
        </section>
      )}

      <p
        className="mt-5 text-xs leading-5"
        style={{ color: "var(--muted)" }}
      >
        {t.footer}
      </p>
    </div>
  );
}