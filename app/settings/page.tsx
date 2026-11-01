
"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  exportBackup,
  restoreBackup,
  type RestoreResult,
} from "@/lib/backup";

type AppLanguage = "ja" | "de" | "en" | "zh-CN" | "zh-TW" | "es";

const presets = [
  { name: "sage", color: "#718675" },
  { name: "blue", color: "#647A91" },
  { name: "lavender", color: "#8B7DB8" },
  { name: "monochrome", color: "#454A46" },
];

const appLanguages: { value: AppLanguage; label: string }[] = [
  { value: "ja", label: "日本語" },
  { value: "de", label: "Deutsch" },
  { value: "en", label: "English" },
  { value: "zh-CN", label: "简体中文" },
  { value: "zh-TW", label: "繁體中文" },
  { value: "es", label: "Español" },
];

const studyLanguages = [
  { value: "de-DE", key: "german" },
  { value: "es-ES", key: "spanish" },
  { value: "zh-CN", key: "chineseSimplified" },
  { value: "zh-TW", key: "chineseTraditional" },
  { value: "ko-KR", key: "korean" },
  { value: "it-IT", key: "italian" },
  { value: "en-US", key: "english" },
] as const;

const translations = {
  ja: {
    title: "設定",
    appearance: "外観",
    appearanceDescription: "アプリのアクセントカラー",
    presets: {
      sage: "セージ",
      blue: "ブルー",
      lavender: "ラベンダー",
      monochrome: "モノクロ",
    },
    customColor: "カスタムカラー（HEX）",
    colorPicker: "カラーピッカー",
    audio: "単語カード・音声",
    audioDescription: "読み上げ方法を調整できます。",
    autoRead: "自動読み上げ",
    autoReadDescription: "学習中にカードが切り替わると自動で読み上げます。",
    speechRate: "音声の再生速度",
    slow: "ゆっくり 0.5倍",
    standard: "標準 1.0倍",
    fast: "速い 2.0倍",
    previewVoice: "音声を試聴",
    voiceUnsupported: "このブラウザーでは音声読み上げに対応していません。",
    language: "言語",
    languageDescription: "アプリの表示言語と学習する言語を分けて設定できます。",
    appLanguage: "アプリの表示言語",
    studyLanguage: "学習する言語（音声の言語にも使用）",
    studyLanguages: {
      german: "ドイツ語",
      spanish: "スペイン語",
      chineseSimplified: "中国語（簡体字）",
      chineseTraditional: "中国語（繁体字）",
      korean: "韓国語",
      italian: "イタリア語",
      english: "英語",
    },
    languageNote: "※ 表示言語は保存後、対応済みのページに反映されます。学習言語は単語カードの読み上げ言語にも使用されます。",
    dataManagement: "データ管理",
    dataDescription: "学習データやアプリの設定をJSONファイルに保存できます。別の端末への移行や、大切なデータの保管に利用できます。",
    export: "JSONバックアップを保存",
    restore: "JSONファイルから復元",
    restoreNote: "※ 復元は既存データをすべて消去する操作ではありません。同じIDのデータを更新し、バックアップに含まれないデータは残します。",
    loginChecking: "ログイン状態を確認しています……",
    loginRequired: "バックアップ・復元にはログインが必要です。",
    exportLoginRequired: "バックアップにはログインが必要です。",
    restoreLoginRequired: "復元にはログインが必要です。",
    processing: "データを処理しています。しばらくお待ちください……",
    exportSuccess: "バックアップファイルをダウンロードしました。",
    exportError: "バックアップに失敗しました。もう一度お試しください。",
    restoreSuccess: "復元が完了しました。保存データを画面に反映するため、ページを再読み込みしてください。",
    restoreError: "復元に失敗しました。",
    confirmRestore: "このバックアップファイルのデータを復元しますか？\n\n同じIDのデータは更新されます。\nバックアップに含まれない既存データは削除されません。\n\n復元前に、現在のデータもバックアップしておくことをおすすめします。",
    saveError: "設定を保存できませんでした。ブラウザーの保存設定をご確認ください。",
    saved: "設定を保存しました",
    save: "設定を保存",
    restoreResult: "復元結果",
    decks: "デッキ",
    folders: "フォルダ",
    words: "単語",
    materials: "教材",
    tasks: "タスク",
    calendar: "カレンダー",
    restored: "復元済み",
    noData: "対象データなし",
    littleMoments: "Little Moments",
    littleMomentsNotRestored: "対象データなし・未復元",
    browserData: "ブラウザ保存データ",
    warnings: "注意事項",
  },
  de: {
    title: "Einstellungen",
    appearance: "Darstellung",
    appearanceDescription: "Akzentfarbe der App",
    presets: {
      sage: "Salbei",
      blue: "Blau",
      lavender: "Lavendel",
      monochrome: "Monochrom",
    },
    customColor: "Benutzerdefinierte Farbe (HEX)",
    colorPicker: "Farbauswahl",
    audio: "Karteikarten & Audio",
    audioDescription: "Passe die Sprachausgabe an.",
    autoRead: "Automatische Sprachausgabe",
    autoReadDescription: "Die Karte wird beim Wechsel während des Lernens automatisch vorgelesen.",
    speechRate: "Wiedergabegeschwindigkeit",
    slow: "Langsam 0,5×",
    standard: "Normal 1,0×",
    fast: "Schnell 2,0×",
    previewVoice: "Stimme testen",
    voiceUnsupported: "Dieser Browser unterstützt keine Sprachausgabe.",
    language: "Sprache",
    languageDescription: "Du kannst die Anzeigesprache der App und deine Lernsprache getrennt einstellen.",
    appLanguage: "Anzeigesprache der App",
    studyLanguage: "Lernsprache (auch für die Sprachausgabe)",
    studyLanguages: {
      german: "Deutsch",
      spanish: "Spanisch",
      chineseSimplified: "Chinesisch (vereinfacht)",
      chineseTraditional: "Chinesisch (traditionell)",
      korean: "Koreanisch",
      italian: "Italienisch",
      english: "Englisch",
    },
    languageNote: "※ Die Anzeigesprache wird nach dem Speichern auf unterstützten Seiten übernommen. Die Lernsprache wird auch für die Sprachausgabe der Karteikarten verwendet.",
    dataManagement: "Datenverwaltung",
    dataDescription: "Du kannst deine Lerndaten und App-Einstellungen als JSON-Datei speichern. So kannst du Daten auf ein anderes Gerät übertragen oder sicher aufbewahren.",
    export: "JSON-Backup speichern",
    restore: "Aus JSON-Datei wiederherstellen",
    restoreNote: "※ Bei der Wiederherstellung werden nicht alle vorhandenen Daten gelöscht. Daten mit derselben ID werden aktualisiert. Andere Daten bleiben erhalten.",
    loginChecking: "Anmeldestatus wird überprüft …",
    loginRequired: "Zum Sichern und Wiederherstellen musst du angemeldet sein.",
    exportLoginRequired: "Zum Erstellen eines Backups musst du angemeldet sein.",
    restoreLoginRequired: "Zum Wiederherstellen musst du angemeldet sein.",
    processing: "Daten werden verarbeitet. Bitte warte einen Moment …",
    exportSuccess: "Die Backup-Datei wurde heruntergeladen.",
    exportError: "Das Backup ist fehlgeschlagen. Bitte versuche es erneut.",
    restoreSuccess: "Die Wiederherstellung ist abgeschlossen. Lade die Seite neu, damit die gespeicherten Daten angezeigt werden.",
    restoreError: "Die Wiederherstellung ist fehlgeschlagen.",
    confirmRestore: "Möchtest du die Daten aus dieser Backup-Datei wiederherstellen?\n\nDaten mit derselben ID werden aktualisiert.\nVorhandene Daten, die nicht im Backup enthalten sind, werden nicht gelöscht.\n\nWir empfehlen, vor der Wiederherstellung ein Backup deiner aktuellen Daten zu erstellen.",
    saveError: "Die Einstellungen konnten nicht gespeichert werden. Bitte überprüfe die Speichereinstellungen deines Browsers.",
    saved: "Einstellungen gespeichert",
    save: "Einstellungen speichern",
    restoreResult: "Wiederherstellungsergebnis",
    decks: "Decks",
    folders: "Ordner",
    words: "Wörter",
    materials: "Lernmaterialien",
    tasks: "Aufgaben",
    calendar: "Kalender",
    restored: "Wiederhergestellt",
    noData: "Keine Daten vorhanden",
    littleMoments: "Little Moments",
    littleMomentsNotRestored: "Keine Daten vorhanden · nicht wiederhergestellt",
    browserData: "Im Browser gespeicherte Daten",
    warnings: "Hinweise",
  },
  en: {
    title: "Settings",
    appearance: "Appearance",
    appearanceDescription: "App accent color",
    presets: {
      sage: "Sage",
      blue: "Blue",
      lavender: "Lavender",
      monochrome: "Monochrome",
    },
    customColor: "Custom color (HEX)",
    colorPicker: "Color picker",
    audio: "Flashcards & Audio",
    audioDescription: "Adjust text-to-speech settings.",
    autoRead: "Automatic reading",
    autoReadDescription: "Automatically read cards aloud when switching cards during study.",
    speechRate: "Speech rate",
    slow: "Slow 0.5×",
    standard: "Normal 1.0×",
    fast: "Fast 2.0×",
    previewVoice: "Preview voice",
    voiceUnsupported: "This browser does not support text-to-speech.",
    language: "Language",
    languageDescription: "You can set the app display language and your study language separately.",
    appLanguage: "App display language",
    studyLanguage: "Study language (also used for speech)",
    studyLanguages: {
      german: "German",
      spanish: "Spanish",
      chineseSimplified: "Chinese (Simplified)",
      chineseTraditional: "Chinese (Traditional)",
      korean: "Korean",
      italian: "Italian",
      english: "English",
    },
    languageNote: "※ The display language is applied to supported pages after saving. The study language is also used for flashcard speech.",
    dataManagement: "Data management",
    dataDescription: "Save your study data and app settings as a JSON file. You can use it to transfer your data to another device or keep a backup.",
    export: "Save JSON backup",
    restore: "Restore from JSON file",
    restoreNote: "※ Restoring does not delete all existing data. Data with matching IDs will be updated, while data not included in the backup will remain.",
    loginChecking: "Checking login status...",
    loginRequired: "You must be logged in to back up or restore data.",
    exportLoginRequired: "You must be logged in to create a backup.",
    restoreLoginRequired: "You must be logged in to restore data.",
    processing: "Processing data. Please wait...",
    exportSuccess: "The backup file has been downloaded.",
    exportError: "Backup failed. Please try again.",
    restoreSuccess: "Restore completed. Reload the page to display the restored data.",
    restoreError: "Restore failed.",
    confirmRestore: "Would you like to restore the data from this backup file?\n\nData with matching IDs will be updated.\nExisting data not included in the backup will not be deleted.\n\nWe recommend backing up your current data before restoring.",
    saveError: "Could not save settings. Please check your browser's storage settings.",
    saved: "Settings saved",
    save: "Save settings",
    restoreResult: "Restore results",
    decks: "Decks",
    folders: "Folders",
    words: "Words",
    materials: "Materials",
    tasks: "Tasks",
    calendar: "Calendar",
    restored: "Restored",
    noData: "No data available",
    littleMoments: "Little Moments",
    littleMomentsNotRestored: "No data available · not restored",
    browserData: "Browser storage data",
    warnings: "Warnings",
  },
  "zh-CN": {
    title: "设置",
    appearance: "外观",
    appearanceDescription: "应用强调色",
    presets: {
      sage: "鼠尾草绿",
      blue: "蓝色",
      lavender: "薰衣草紫",
      monochrome: "黑白",
    },
    customColor: "自定义颜色（HEX）",
    colorPicker: "颜色选择器",
    audio: "单词卡片与语音",
    audioDescription: "调整语音朗读设置。",
    autoRead: "自动朗读",
    autoReadDescription: "学习过程中切换卡片时自动朗读。",
    speechRate: "语音播放速度",
    slow: "慢速 0.5倍",
    standard: "标准 1.0倍",
    fast: "快速 2.0倍",
    previewVoice: "试听语音",
    voiceUnsupported: "此浏览器不支持语音朗读。",
    language: "语言",
    languageDescription: "可以分别设置应用显示语言和学习语言。",
    appLanguage: "应用显示语言",
    studyLanguage: "学习语言（同时用于语音朗读）",
    studyLanguages: {
      german: "德语",
      spanish: "西班牙语",
      chineseSimplified: "中文（简体）",
      chineseTraditional: "中文（繁体）",
      korean: "韩语",
      italian: "意大利语",
      english: "英语",
    },
    languageNote: "※ 保存后，显示语言将应用于已支持多语言的页面。学习语言也会用于单词卡片的语音朗读。",
    dataManagement: "数据管理",
    dataDescription: "可以将学习数据和应用设置保存为JSON文件，用于迁移到其他设备或备份重要数据。",
    export: "保存JSON备份",
    restore: "从JSON文件恢复",
    restoreNote: "※ 恢复操作不会删除所有现有数据。相同ID的数据会被更新，备份中不包含的数据会保留。",
    loginChecking: "正在确认登录状态……",
    loginRequired: "备份和恢复数据需要登录。",
    exportLoginRequired: "备份数据需要登录。",
    restoreLoginRequired: "恢复数据需要登录。",
    processing: "正在处理数据，请稍候……",
    exportSuccess: "备份文件已下载。",
    exportError: "备份失败，请重试。",
    restoreSuccess: "恢复已完成。请重新加载页面以显示恢复的数据。",
    restoreError: "恢复失败。",
    confirmRestore: "确定要恢复此备份文件中的数据吗？\n\n相同ID的数据将被更新。\n备份中不包含的现有数据不会被删除。\n\n建议在恢复前先备份当前数据。",
    saveError: "无法保存设置。请检查浏览器的存储设置。",
    saved: "设置已保存",
    save: "保存设置",
    restoreResult: "恢复结果",
    decks: "牌组",
    folders: "文件夹",
    words: "单词",
    materials: "教材",
    tasks: "任务",
    calendar: "日历",
    restored: "已恢复",
    noData: "没有对应数据",
    littleMoments: "Little Moments",
    littleMomentsNotRestored: "没有对应数据 · 未恢复",
    browserData: "浏览器保存的数据",
    warnings: "注意事项",
  },
  "zh-TW": {
    title: "設定",
    appearance: "外觀",
    appearanceDescription: "應用程式的強調色",
    presets: {
      sage: "鼠尾草綠",
      blue: "藍色",
      lavender: "薰衣草紫",
      monochrome: "黑白",
    },
    customColor: "自訂顏色（HEX）",
    colorPicker: "色彩選擇器",
    audio: "單字卡與語音",
    audioDescription: "調整語音朗讀設定。",
    autoRead: "自動朗讀",
    autoReadDescription: "學習時切換卡片，會自動朗讀內容。",
    speechRate: "語音播放速度",
    slow: "慢速 0.5倍",
    standard: "標準 1.0倍",
    fast: "快速 2.0倍",
    previewVoice: "試聽語音",
    voiceUnsupported: "此瀏覽器不支援語音朗讀。",
    language: "語言",
    languageDescription: "可以分別設定應用程式的顯示語言與學習語言。",
    appLanguage: "應用程式顯示語言",
    studyLanguage: "學習語言（也用於語音朗讀）",
    studyLanguages: {
      german: "德語",
      spanish: "西班牙語",
      chineseSimplified: "中文（簡體）",
      chineseTraditional: "中文（繁體）",
      korean: "韓語",
      italian: "義大利語",
      english: "英語",
    },
    languageNote: "※ 儲存後，顯示語言會套用至已支援多語言的頁面。學習語言也會用於單字卡的語音朗讀。",
    dataManagement: "資料管理",
    dataDescription: "可以將學習資料與應用程式設定儲存為JSON檔案，用於轉移至其他裝置或備份重要資料。",
    export: "儲存JSON備份",
    restore: "從JSON檔案還原",
    restoreNote: "※ 還原不會刪除所有現有資料。相同ID的資料會更新，備份中未包含的資料則會保留。",
    loginChecking: "正在確認登入狀態……",
    loginRequired: "備份與還原資料需要登入。",
    exportLoginRequired: "備份資料需要登入。",
    restoreLoginRequired: "還原資料需要登入。",
    processing: "正在處理資料，請稍候……",
    exportSuccess: "備份檔案已下載。",
    exportError: "備份失敗，請再試一次。",
    restoreSuccess: "還原已完成。請重新載入頁面，以顯示還原後的資料。",
    restoreError: "還原失敗。",
    confirmRestore: "確定要還原此備份檔案中的資料嗎？\n\n相同ID的資料將會更新。\n備份中未包含的現有資料不會被刪除。\n\n建議在還原前先備份目前的資料。",
    saveError: "無法儲存設定。請檢查瀏覽器的儲存設定。",
    saved: "設定已儲存",
    save: "儲存設定",
    restoreResult: "還原結果",
    decks: "牌組",
    folders: "資料夾",
    words: "單字",
    materials: "教材",
    tasks: "任務",
    calendar: "日曆",
    restored: "已還原",
    noData: "沒有對應資料",
    littleMoments: "Little Moments",
    littleMomentsNotRestored: "沒有對應資料・未還原",
    browserData: "瀏覽器儲存資料",
    warnings: "注意事項",
  },
  es: {
    title: "Configuración",
    appearance: "Apariencia",
    appearanceDescription: "Color de acento de la aplicación",
    presets: {
      sage: "Salvia",
      blue: "Azul",
      lavender: "Lavanda",
      monochrome: "Monocromo",
    },
    customColor: "Color personalizado (HEX)",
    colorPicker: "Selector de color",
    audio: "Tarjetas y audio",
    audioDescription: "Ajusta la lectura en voz alta.",
    autoRead: "Lectura automática",
    autoReadDescription: "Lee automáticamente la tarjeta al cambiar durante el estudio.",
    speechRate: "Velocidad de reproducción",
    slow: "Lento 0,5×",
    standard: "Normal 1,0×",
    fast: "Rápido 2,0×",
    previewVoice: "Probar voz",
    voiceUnsupported: "Este navegador no admite la lectura en voz alta.",
    language: "Idioma",
    languageDescription: "Puedes configurar por separado el idioma de la aplicación y el idioma de estudio.",
    appLanguage: "Idioma de la aplicación",
    studyLanguage: "Idioma de estudio (también para el audio)",
    studyLanguages: {
      german: "Alemán",
      spanish: "Español",
      chineseSimplified: "Chino (simplificado)",
      chineseTraditional: "Chino (tradicional)",
      korean: "Coreano",
      italian: "Italiano",
      english: "Inglés",
    },
    languageNote: "※ El idioma de visualización se aplicará a las páginas compatibles después de guardar. El idioma de estudio también se utilizará para el audio de las tarjetas.",
    dataManagement: "Gestión de datos",
    dataDescription: "Puedes guardar tus datos de estudio y la configuración de la aplicación en un archivo JSON. Úsalo para transferir tus datos a otro dispositivo o conservar una copia de seguridad.",
    export: "Guardar copia de seguridad JSON",
    restore: "Restaurar desde un archivo JSON",
    restoreNote: "※ La restauración no elimina todos los datos existentes. Los datos con el mismo ID se actualizan y los que no están incluidos en la copia de seguridad se conservan.",
    loginChecking: "Comprobando el inicio de sesión...",
    loginRequired: "Debes iniciar sesión para guardar o restaurar datos.",
    exportLoginRequired: "Debes iniciar sesión para crear una copia de seguridad.",
    restoreLoginRequired: "Debes iniciar sesión para restaurar los datos.",
    processing: "Procesando los datos. Espera un momento...",
    exportSuccess: "Se ha descargado el archivo de copia de seguridad.",
    exportError: "No se pudo crear la copia de seguridad. Inténtalo de nuevo.",
    restoreSuccess: "La restauración ha finalizado. Recarga la página para mostrar los datos restaurados.",
    restoreError: "No se pudo restaurar la copia de seguridad.",
    confirmRestore: "¿Quieres restaurar los datos de este archivo de copia de seguridad?\n\nLos datos con el mismo ID se actualizarán.\nLos datos existentes que no estén incluidos en la copia no se eliminarán.\n\nTe recomendamos guardar una copia de tus datos actuales antes de restaurarlos.",
    saveError: "No se pudo guardar la configuración. Comprueba los ajustes de almacenamiento del navegador.",
    saved: "Configuración guardada",
    save: "Guardar configuración",
    restoreResult: "Resultado de la restauración",
    decks: "Mazos",
    folders: "Carpetas",
    words: "Palabras",
    materials: "Materiales",
    tasks: "Tareas",
    calendar: "Calendario",
    restored: "Restaurado",
    noData: "No hay datos disponibles",
    littleMoments: "Little Moments",
    littleMomentsNotRestored: "Sin datos disponibles · no restaurado",
    browserData: "Datos guardados en el navegador",
    warnings: "Advertencias",
  },
} as const;

const voiceSamples: Record<string, string> = {
  "de-DE": "Hallo! Lass uns lernen.",
  "es-ES": "¡Hola! Vamos a aprender.",
  "zh-CN": "你好，欢迎学习。",
  "zh-TW": "你好，歡迎學習。",
  "ko-KR": "안녕하세요. 함께 공부해요.",
  "it-IT": "Ciao! Impariamo insieme.",
  "en-US": "Hello! Let's learn together.",
};

export default function SettingsPage() {
  const [themeColor, setThemeColor] = useState("#718675");
  const [customColor, setCustomColor] = useState("#718675");
  const [autoRead, setAutoRead] = useState(true);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [appLanguage, setAppLanguage] = useState<AppLanguage>("ja");
  const [studyLanguage, setStudyLanguage] = useState("de-DE");
  const [saved, setSaved] = useState(false);

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupMessage, setBackupMessage] = useState("");
  const [backupError, setBackupError] = useState("");
  const [restoreResult, setRestoreResult] =
    useState<RestoreResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = translations[appLanguage];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const read = (key: string, fallback: string) => {
      try {
        return window.localStorage.getItem(key) ?? fallback;
      } catch {
        return fallback;
      }
    };

    const color = read("anki-theme-color", "#718675");

    if (/^#[0-9a-fA-F]{6}$/.test(color)) {
      setThemeColor(color);
      setCustomColor(color);
    }

    setAutoRead(read("anki-auto-read", "true") === "true");

    const rate = Number(read("anki-speech-rate", "1.0"));

    if (
      Number.isFinite(rate) &&
      rate >= 0.5 &&
      rate <= 2.0 &&
      Math.round((rate - 0.5) / 0.25) ===
        (rate - 0.5) / 0.25
    ) {
      setSpeechRate(rate);
    }

    const storedAppLanguage = read("anki-app-language", "ja");

    const validAppLanguage = appLanguages.some(
      (item) => item.value === storedAppLanguage
    );

    setAppLanguage(
      validAppLanguage
        ? (storedAppLanguage as AppLanguage)
        : "ja"
    );

    const storedStudyLanguage = read(
      "anki-study-language",
      "de-DE"
    );

    const validStudyLanguage = studyLanguages.some(
      (item) => item.value === storedStudyLanguage
    );

    setStudyLanguage(
      validStudyLanguage ? storedStudyLanguage : "de-DE"
    );
  }, []);

  function saveSettings() {
    try {
      localStorage.setItem("anki-theme-color", themeColor);
      localStorage.setItem("anki-custom-color", themeColor);
      localStorage.setItem("anki-auto-read", String(autoRead));
      localStorage.setItem("anki-speech-rate", String(speechRate));
      localStorage.setItem("anki-app-language", appLanguage);
      localStorage.setItem("anki-study-language", studyLanguage);

      document.documentElement.style.setProperty(
        "--anki-theme-color",
        themeColor
      );

      window.dispatchEvent(new Event("anki-language-change"));

      setSaved(true);
    } catch {
      setSaved(false);
      alert(t.saveError);
    }
  }

  async function handleExportBackup() {
    if (!user) {
      setBackupError(t.exportLoginRequired);
      return;
    }

    setBackupLoading(true);
    setBackupMessage("");
    setBackupError("");
    setRestoreResult(null);

    try {
      await exportBackup(user);
      setBackupMessage(t.exportSuccess);
    } catch (error) {
      console.error(error);
      setBackupError(t.exportError);
    } finally {
      setBackupLoading(false);
    }
  }

  function handleSelectRestore() {
    fileInputRef.current?.click();
  }

  async function handleRestoreFile(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) return;

    if (!user) {
      setBackupError(t.restoreLoginRequired);
      return;
    }

    const confirmed = window.confirm(t.confirmRestore);

    if (!confirmed) return;

    setBackupLoading(true);
    setBackupMessage("");
    setBackupError("");
    setRestoreResult(null);

    try {
      const result = await restoreBackup(file, user);

      setRestoreResult(result);
      setBackupMessage(t.restoreSuccess);
    } catch (error) {
      console.error(error);
      setBackupError(
        error instanceof Error ? error.message : t.restoreError
      );
    } finally {
      setBackupLoading(false);
    }
  }

  function previewVoice() {
    if (!("speechSynthesis" in window)) {
      alert(t.voiceUnsupported);
      return;
    }

    window.speechSynthesis.cancel();

    const sample =
      voiceSamples[studyLanguage] ?? voiceSamples["en-US"];

    const utterance = new SpeechSynthesisUtterance(sample);
    utterance.rate = speechRate;
    utterance.lang = studyLanguage;

    window.speechSynthesis.speak(utterance);
  }

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box" as const,
    border: "1px solid #DADDD6",
    borderRadius: "10px",
    padding: "11px 12px",
    background: "#FFFFFF",
    color: "#252824",
    fontSize: "14px",
  };

  const cardStyle = {
    background: "#FFFFFF",
    border: "1px solid #E8E9E5",
    borderRadius: "16px",
    padding: "22px",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F7F7F5",
        color: "#252824",
        padding: "28px 18px 56px",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div style={{ maxWidth: "760px", margin: "0 auto" }}>
        <header style={{ marginBottom: "26px" }}>
          <p
            style={{
              color: "#718675",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "2px",
              margin: "0 0 8px",
            }}
          >
            PERSONALIZE YOUR STUDY
          </p>

          <h1
            style={{
              fontSize: "clamp(28px, 5vw, 36px)",
              letterSpacing: "-1.2px",
              margin: 0,
            }}
          >
            {t.title}
          </h1>
        </header>

        <div style={{ display: "grid", gap: "16px" }}>
          {/* Appearance */}
          <section style={cardStyle}>
            <h2 style={{ fontSize: "16px", margin: "0 0 5px" }}>
              {t.appearance}
            </h2>

            <p
              style={{
                color: "#858780",
                fontSize: "13px",
                margin: "0 0 18px",
              }}
            >
              {t.appearanceDescription}
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(125px, 1fr))",
                gap: "10px",
              }}
            >
              {presets.map((preset) => {
                const active =
                  themeColor.toUpperCase() === preset.color;

                return (
                  <button
                    key={preset.color}
                    type="button"
                    onClick={() => {
                      setThemeColor(preset.color);
                      setCustomColor(preset.color);
                      setSaved(false);
                    }}
                    aria-pressed={active}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "9px",
                      padding: "10px",
                      border: active
                        ? "2px solid #718675"
                        : "1px solid #E8E9E5",
                      borderRadius: "11px",
                      background: active ? "#F2F5F0" : "#FFFFFF",
                      cursor: "pointer",
                      color: "#30352F",
                      textAlign: "left",
                    }}
                  >
                    <span
                      style={{
                        width: "22px",
                        height: "22px",
                        borderRadius: "50%",
                        background: preset.color,
                        flexShrink: 0,
                      }}
                    />

                    <span style={{ fontSize: "12px", fontWeight: 600 }}>
                      {t.presets[preset.name as keyof typeof t.presets]}
                    </span>
                  </button>
                );
              })}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: "12px",
                alignItems: "end",
                marginTop: "18px",
              }}
            >
              <label style={{ fontSize: "13px", fontWeight: 600 }}>
                {t.customColor}

                <input
                  value={customColor}
                  onChange={(event) => {
                    const value = event.target.value;
                    setCustomColor(value);

                    if (/^#[0-9a-fA-F]{6}$/.test(value)) {
                      setThemeColor(value.toUpperCase());
                      setSaved(false);
                    }
                  }}
                  style={{
                    ...inputStyle,
                    marginTop: "8px",
                    fontFamily: "monospace",
                  }}
                />
              </label>

              <input
                aria-label={t.colorPicker}
                type="color"
                value={
                  /^#[0-9a-fA-F]{6}$/.test(customColor)
                    ? customColor
                    : themeColor
                }
                onChange={(event) => {
                  setCustomColor(event.target.value.toUpperCase());
                  setThemeColor(event.target.value.toUpperCase());
                  setSaved(false);
                }}
                style={{
                  width: "48px",
                  height: "44px",
                  padding: "3px",
                  border: "1px solid #DADDD6",
                  borderRadius: "10px",
                  background: "#fff",
                }}
              />
            </div>

            <div
              style={{
                marginTop: "14px",
                height: "8px",
                borderRadius: "99px",
                background: `linear-gradient(90deg, ${themeColor}, #FFFFFF)`,
              }}
            />
          </section>

          {/* Audio */}
          <section style={cardStyle}>
            <h2 style={{ fontSize: "16px", margin: "0 0 5px" }}>
              {t.audio}
            </h2>

            <p
              style={{
                color: "#858780",
                fontSize: "13px",
                margin: "0 0 18px",
              }}
            >
              {t.audioDescription}
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "16px",
              }}
            >
              <div>
                <div style={{ fontSize: "14px", fontWeight: 650 }}>
                  {t.autoRead}
                </div>

                <div
                  style={{
                    color: "#858780",
                    fontSize: "12px",
                    marginTop: "4px",
                  }}
                >
                  {t.autoReadDescription}
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-label={t.autoRead}
                aria-checked={autoRead}
                onClick={() => {
                  setAutoRead(!autoRead);
                  setSaved(false);
                }}
                style={{
                  width: "52px",
                  height: "30px",
                  border: 0,
                  borderRadius: "99px",
                  padding: "3px",
                  background: autoRead ? "#718675" : "#C9CCC6",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: autoRead ? "flex-end" : "flex-start",
                  alignItems: "center",
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    width: "24px",
                    height: "24px",
                    background: "#FFFFFF",
                    borderRadius: "50%",
                    boxShadow: "0 1px 4px #0002",
                  }}
                />
              </button>
            </div>

            <div style={{ marginTop: "24px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "10px",
                }}
              >
                <label
                  htmlFor="speech-rate"
                  style={{ fontSize: "14px", fontWeight: 650 }}
                >
                  {t.speechRate}
                </label>

                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#5E7562",
                  }}
                >
                  {speechRate.toFixed(2).replace(/0$/, "")}×
                </span>
              </div>

              <input
                id="speech-rate"
                type="range"
                min="0.5"
                max="2"
                step="0.25"
                value={speechRate}
                onChange={(event) => {
                  setSpeechRate(Number(event.target.value));
                  setSaved(false);
                }}
                style={{ width: "100%", accentColor: "#718675" }}
              />

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  color: "#858780",
                  fontSize: "11px",
                }}
              >
                <span>{t.slow}</span>
                <span>{t.standard}</span>
                <span>{t.fast}</span>
              </div>

              <button
                type="button"
                onClick={previewVoice}
                style={{
                  marginTop: "14px",
                  padding: "9px 13px",
                  border: "1px solid #DDE3DA",
                  borderRadius: "10px",
                  background: "#F7F9F5",
                  color: "#435747",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                {t.previewVoice}
              </button>
            </div>
          </section>

          {/* Language */}
          <section style={cardStyle}>
            <h2 style={{ fontSize: "16px", margin: "0 0 5px" }}>
              {t.language}
            </h2>

            <p
              style={{
                color: "#858780",
                fontSize: "13px",
                margin: "0 0 18px",
              }}
            >
              {t.languageDescription}
            </p>

            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 600,
                marginBottom: "16px",
              }}
            >
              {t.appLanguage}

              <select
                value={appLanguage}
                onChange={(event) => {
                  setAppLanguage(event.target.value as AppLanguage);
                  setSaved(false);
                }}
                style={{
                  ...inputStyle,
                  display: "block",
                  marginTop: "8px",
                }}
              >
                {appLanguages.map((language) => (
                  <option key={language.value} value={language.value}>
                    {language.label}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: "block", fontSize: "13px", fontWeight: 600 }}>
              {t.studyLanguage}

              <select
                value={studyLanguage}
                onChange={(event) => {
                  setStudyLanguage(event.target.value);
                  setSaved(false);
                }}
                style={{
                  ...inputStyle,
                  display: "block",
                  marginTop: "8px",
                }}
              >
                {studyLanguages.map((language) => (
                  <option key={language.value} value={language.value}>
                    {t.studyLanguages[language.key]}
                  </option>
                ))}
              </select>
            </label>

            <p
              style={{
                color: "#858780",
                fontSize: "12px",
                lineHeight: 1.6,
                margin: "12px 0 0",
              }}
            >
              {t.languageNote}
            </p>
          </section>

          {/* Data management */}
          <section style={cardStyle}>
            <h2 style={{ fontSize: "16px", margin: "0 0 5px" }}>
              {t.dataManagement}
            </h2>

            <p
              style={{
                color: "#858780",
                fontSize: "13px",
                lineHeight: 1.7,
                margin: "0 0 20px",
              }}
            >
              {t.dataDescription}
            </p>

            <div
              style={{
                display: "grid",
                gap: "12px",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(200px, 1fr))",
              }}
            >
              <button
                type="button"
                onClick={handleExportBackup}
                disabled={backupLoading || authLoading || !user}
                style={{
                  padding: "13px 16px",
                  border: "1px solid #DDE3DA",
                  borderRadius: "11px",
                  background: "#F3F6F1",
                  color: "#435747",
                  fontSize: "14px",
                  fontWeight: 650,
                  cursor:
                    backupLoading || !user ? "not-allowed" : "pointer",
                  opacity: backupLoading || !user ? 0.5 : 1,
                }}
              >
                {t.export}
              </button>

              <button
                type="button"
                onClick={handleSelectRestore}
                disabled={backupLoading || authLoading || !user}
                style={{
                  padding: "13px 16px",
                  border: "1px solid #DADDD6",
                  borderRadius: "11px",
                  background: "#FFFFFF",
                  color: "#30352F",
                  fontSize: "14px",
                  fontWeight: 650,
                  cursor:
                    backupLoading || !user ? "not-allowed" : "pointer",
                  opacity: backupLoading || !user ? 0.5 : 1,
                }}
              >
                {t.restore}
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleRestoreFile}
              style={{ display: "none" }}
            />

            <p
              style={{
                color: "#858780",
                fontSize: "12px",
                lineHeight: 1.7,
                margin: "16px 0 0",
              }}
            >
              {t.restoreNote}
            </p>

            {authLoading && (
              <p style={{ fontSize: "13px", color: "#858780" }}>
                {t.loginChecking}
              </p>
            )}

            {!authLoading && !user && (
              <p style={{ fontSize: "13px", color: "#A45B50" }}>
                {t.loginRequired}
              </p>
            )}

            {backupLoading && (
              <p style={{ fontSize: "13px", color: "#68756A" }}>
                {t.processing}
              </p>
            )}

            {backupMessage && (
              <p
                role="status"
                style={{
                  color: "#52735A",
                  fontSize: "13px",
                  lineHeight: 1.7,
                  marginTop: "16px",
                }}
              >
                {backupMessage}
              </p>
            )}

            {backupError && (
              <p
                role="alert"
                style={{
                  color: "#B04D43",
                  fontSize: "13px",
                  lineHeight: 1.7,
                  marginTop: "16px",
                }}
              >
                {backupError}
              </p>
            )}

            {restoreResult && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "14px",
                  borderRadius: "10px",
                  background: "#F7F8F5",
                  fontSize: "13px",
                  lineHeight: 1.9,
                }}
              >
                <strong>{t.restoreResult}</strong>

                <div>{t.decks}: {restoreResult.decks}</div>
                <div>{t.folders}: {restoreResult.folders}</div>
                <div>{t.words}: {restoreResult.words}</div>
                <div>{t.materials}: {restoreResult.materials}</div>
                <div>{t.tasks}: {restoreResult.tasks}</div>

                <div>
                  {t.calendar}:{" "}
                  {restoreResult.calendarData ? t.restored : t.noData}
                </div>

                <div>
                  {t.littleMoments}:{" "}
                  {restoreResult.littleMoments
                    ? t.restored
                    : t.littleMomentsNotRestored}
                </div>

                <div>
                  {t.browserData}: {restoreResult.localStorage}
                </div>

                {restoreResult.warnings.length > 0 && (
                  <div style={{ marginTop: "10px", color: "#A45B50" }}>
                    <strong>{t.warnings}</strong>

                    {restoreResult.warnings.map((warning, index) => (
                      <p key={index} style={{ margin: "5px 0" }}>
                        ・{warning}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Save */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: "14px",
              flexWrap: "wrap",
            }}
          >
            {saved && (
              <span
                role="status"
                style={{
                  color: "#52735A",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                {t.saved}
              </span>
            )}

            <button
              type="button"
              onClick={saveSettings}
              style={{
                padding: "12px 20px",
                border: 0,
                borderRadius: "11px",
                background: "#252824",
                color: "#FFFFFF",
                fontSize: "14px",
                fontWeight: 650,
                cursor: "pointer",
              }}
            >
              {t.save}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
