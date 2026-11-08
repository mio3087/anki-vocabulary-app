"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
  deleteField,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAppLanguage } from "@/app/component/AppLanguage";

type MaterialType = "book" | "deck";

type StudyRange = {
  start: number;
  end: number;
  date: string;
};

type Material = {
  id: string;
  name: string;
  language: string;
  type: MaterialType;
  total: number;
  studyRanges: StudyRange[];
  createdAt: number;
  linkedBookId?: number;
};

type LibraryBook = {
  id: number;
  title: string;
  totalPages: number;
};

type ReadingLog = {
  bookId: number;
  date: string;
  startPage: number;
  endPage: number;
};

const BOOKS_STORAGE_KEY = "little-library-books-v1";
const READING_LOGS_STORAGE_KEY = "little-library-reading-logs-v1";

type AppLanguage = "ja" | "de" | "en" | "zh-CN" | "zh-TW" | "es";

const MATERIAL_LANGUAGES = [
  { value: "中国語", label: { ja: "中国語", de: "Chinesisch", en: "Chinese", "zh-CN": "中文", "zh-TW": "中文", es: "Chino" } },
  { value: "ドイツ語", label: { ja: "ドイツ語", de: "Deutsch", en: "German", "zh-CN": "德语", "zh-TW": "德語", es: "Alemán" } },
  { value: "スペイン語", label: { ja: "スペイン語", de: "Spanisch", en: "Spanish", "zh-CN": "西班牙语", "zh-TW": "西班牙語", es: "Español" } },
  { value: "英語", label: { ja: "英語", de: "Englisch", en: "English", "zh-CN": "英语", "zh-TW": "英語", es: "Inglés" } },
  { value: "イタリア語", label: { ja: "イタリア語", de: "Italienisch", en: "Italian", "zh-CN": "意大利语", "zh-TW": "義大利語", es: "Italiano" } },
  { value: "韓国語", label: { ja: "韓国語", de: "Koreanisch", en: "Korean", "zh-CN": "韩语", "zh-TW": "韓語", es: "Coreano" } },
  { value: "日本語", label: { ja: "日本語", de: "Japanisch", en: "Japanese", "zh-CN": "日语", "zh-TW": "日語", es: "Japonés" } },
  { value: "その他", label: { ja: "その他", de: "Andere", en: "Other", "zh-CN": "其他", "zh-TW": "其他", es: "Otro" } },
];

const translations: Record<AppLanguage, Record<string, string>> = {
  ja: {
    loading: "教材を読み込んでいます...",
    title: "📚 教材一覧",
    loginRequired: "教材を登録・保存するにはログインしてください。",
    login: "ログインする",
    backToday: "今日の学習へ戻る",
    eyebrow: "STUDY LIBRARY",
    subtitle: "本も単語帳も、進み具合を見える化しよう。",
    linkBook: "Little Libraryの本と連携",
    noBookLink: "連携しない",
    linkedBook: "連携中の本",
    readBook: "読書記録を開く",
    linkedBookHint: "連携した本のページ進捗は読書記録から反映されます。",
    noBooks: "本棚に本がありません。先にLittle Libraryへ本を登録してください。",
    linkedRecordHint: "本棚と連携した教材は、読書記録からページを記録してください。",

    today: "今日の学習へ →",
    plan: "学習計画",
    todayNav: "今日の学習",
    editMaterial: "✏️ 教材を編集",
    addMaterial: "➕ 教材を登録",
    materialName: "教材名",
    namePlaceholder: "例：HSK7-9級、ドイツ語問題集",
    language: "言語",
    materialType: "教材の種類",
    book: "本・問題集（ページ数）",
    deck: "暗記デッキ（単語数）",
    totalPages: "総ページ数",
    totalWords: "総単語数",
    saving: "保存中...",
    saveChanges: "変更を保存",
    register: "教材を登録",
    cancelEdit: "編集をキャンセル",
    recordHeading: "📝 学習した範囲を記録",
    recordDescription: "例：1〜20ページ、または1〜20番の単語。以前記録した範囲をもう一度入力しても、進捗は二重に加算されません。",
    registerFirst: "まずは上のフォームから教材を登録してください。",
    selectMaterial: "学習する教材",
    selectPlaceholder: "教材を選択してください",
    pages: "ページ",
    words: "単語",
    wordNumber: "番の単語",
    startNumber: "開始番号",
    endNumber: "終了番号",
    recordRange: "の範囲で記録できます。",
    recording: "記録中...",
    saveRecord: "学習記録を保存",
    registered: "📖 登録した教材",
    noMaterials: "まだ教材がありません。",
    firstMaterial: "最初の教材を登録してみましょう！",
    studied: "学習済み",
    records: "記録した学習範囲：",
    recordsUnit: "件",
    viewRecords: "学習記録を見る",
    edit: "編集",
    delete: "削除",
    goPlan: "学習計画へ",
    totalUnit: "全",
    errorLoad: "教材を読み込めませんでした。Firestoreのセキュリティルールや接続設定を確認してください。",
    errorLoginSave: "教材を保存するにはログインしてください。",
    errorName: "教材名を入力してください。",
    errorTotal: "総ページ数・総単語数は1以上の整数で入力してください。",
    errorSave: "保存できませんでした。Firestoreのセキュリティルールを確認してください。",
    errorLoginRecord: "学習記録を保存するにはログインしてください。",
    errorSelect: "学習する教材を選んでください。",
    errorRange: "開始番号は1以上、終了番号は開始番号以上の整数で入力してください。",
    errorRecord: "学習記録を保存できませんでした。Firestoreのセキュリティルールを確認してください。",
    confirmDelete: "を削除しますか？\nこの教材の学習記録も削除されます。",
    errorDelete: "削除できませんでした。Firestoreの設定を確認してください。",
  },
  de: {
    loading: "Lernmaterialien werden geladen...",
    title: "📚 Lernmaterialien",
    loginRequired: "Bitte melde dich an, um Lernmaterialien zu speichern.",
    login: "Anmelden",
    backToday: "Zurück zum heutigen Lernen",
    eyebrow: "STUDY LIBRARY",
    subtitle: "Behalte den Lernfortschritt deiner Bücher und Vokabeldecks im Blick.",
    linkBook: "Mit einem Buch aus Little Library verknüpfen",
    noBookLink: "Nicht verknüpfen",
    linkedBook: "Verknüpftes Buch",
    readBook: "Lernprotokoll öffnen",
    linkedBookHint: "Der Seitenfortschritt wird aus dem Leseprotokoll übernommen.",
    noBooks: "Keine Bücher im Regal. Füge zuerst ein Buch in Little Library hinzu.",
    linkedRecordHint: "Bei verknüpften Büchern bitte die Seiten im Leseprotokoll erfassen.",

    today: "Zum heutigen Lernen →",
    plan: "Lernplan",
    todayNav: "Heutiges Lernen",
    editMaterial: "✏️ Material bearbeiten",
    addMaterial: "➕ Material hinzufügen",
    materialName: "Name des Lernmaterials",
    namePlaceholder: "z. B. HSK 7–9, Deutsch-Übungsbuch",
    language: "Sprache",
    materialType: "Materialtyp",
    book: "Buch / Übungsbuch (Seiten)",
    deck: "Vokabeldeck (Wörter)",
    totalPages: "Gesamtseitenzahl",
    totalWords: "Gesamtzahl der Wörter",
    saving: "Wird gespeichert...",
    saveChanges: "Änderungen speichern",
    register: "Material hinzufügen",
    cancelEdit: "Bearbeitung abbrechen",
    recordHeading: "📝 Lernfortschritt eintragen",
    recordDescription: "Beispiel: Seiten 1–20 oder Wörter 1–20. Bereits erfasste Bereiche werden nicht doppelt gezählt.",
    registerFirst: "Füge zuerst oben ein Lernmaterial hinzu.",
    selectMaterial: "Lernmaterial auswählen",
    selectPlaceholder: "Material auswählen",
    pages: "Seiten",
    words: "Wörter",
    wordNumber: "Wörter",
    startNumber: "Startnummer",
    endNumber: "Endnummer",
    recordRange: "kann erfasst werden.",
    recording: "Wird eingetragen...",
    saveRecord: "Lernfortschritt speichern",
    registered: "📖 Registrierte Lernmaterialien",
    noMaterials: "Noch keine Lernmaterialien vorhanden.",
    firstMaterial: "Füge dein erstes Lernmaterial hinzu!",
    studied: "Gelernt",
    records: "Erfasste Lernbereiche: ",
    recordsUnit: "",
    viewRecords: "Lernverlauf anzeigen",
    edit: "Bearbeiten",
    delete: "Löschen",
    goPlan: "Zum Lernplan",
    totalUnit: "Gesamt: ",
    errorLoad: "Die Lernmaterialien konnten nicht geladen werden. Bitte überprüfe die Firestore-Sicherheitsregeln und die Verbindung.",
    errorLoginSave: "Bitte melde dich an, um das Material zu speichern.",
    errorName: "Bitte gib einen Materialnamen ein.",
    errorTotal: "Die Gesamtzahl der Seiten oder Wörter muss eine ganze Zahl ab 1 sein.",
    errorSave: "Speichern fehlgeschlagen. Bitte überprüfe die Firestore-Sicherheitsregeln.",
    errorLoginRecord: "Bitte melde dich an, um den Lernfortschritt zu speichern.",
    errorSelect: "Bitte wähle ein Lernmaterial aus.",
    errorRange: "Die Startnummer muss mindestens 1 sein. Die Endnummer muss eine ganze Zahl sein, die mindestens so groß wie die Startnummer ist.",
    errorRecord: "Der Lernfortschritt konnte nicht gespeichert werden. Bitte überprüfe die Firestore-Sicherheitsregeln.",
    confirmDelete: " wirklich löschen?\nDer zugehörige Lernverlauf wird ebenfalls gelöscht.",
    errorDelete: "Löschen fehlgeschlagen. Bitte überprüfe die Firestore-Einstellungen.",
  },
  en: {
    loading: "Loading study materials...",
    title: "📚 Study Materials",
    loginRequired: "Please log in to register and save study materials.",
    login: "Log in",
    backToday: "Back to today's study",
    eyebrow: "STUDY LIBRARY",
    subtitle: "Track your progress with books and vocabulary decks.",
    linkBook: "Link to a Little Library book",
    noBookLink: "Do not link",
    linkedBook: "Linked book",
    readBook: "Open reading log",
    linkedBookHint: "Page progress is synced from the reading log.",
    noBooks: "There are no books in your library. Add a book to Little Library first.",
    linkedRecordHint: "For linked books, record pages in the reading log.",

    today: "Today's Study →",
    plan: "Study Plan",
    todayNav: "Today's Study",
    editMaterial: "✏️ Edit Material",
    addMaterial: "➕ Add Material",
    materialName: "Material Name",
    namePlaceholder: "e.g. HSK 7–9, German Workbook",
    language: "Language",
    materialType: "Material Type",
    book: "Book / Workbook (pages)",
    deck: "Vocabulary Deck (words)",
    totalPages: "Total Pages",
    totalWords: "Total Words",
    saving: "Saving...",
    saveChanges: "Save Changes",
    register: "Add Material",
    cancelEdit: "Cancel Editing",
    recordHeading: "📝 Record Study Progress",
    recordDescription: "Example: pages 1–20 or words 1–20. Previously recorded ranges will not be counted twice.",
    registerFirst: "Please add a study material using the form above first.",
    selectMaterial: "Select Material",
    selectPlaceholder: "Choose a material",
    pages: "pages",
    words: "words",
    wordNumber: "words",
    startNumber: "Start Number",
    endNumber: "End Number",
    recordRange: "can be recorded.",
    recording: "Recording...",
    saveRecord: "Save Study Record",
    registered: "📖 Registered Materials",
    noMaterials: "You haven't added any materials yet.",
    firstMaterial: "Add your first study material!",
    studied: "Studied",
    records: "Recorded ranges: ",
    recordsUnit: "",
    viewRecords: "View Study Records",
    edit: "Edit",
    delete: "Delete",
    goPlan: "Study Plan",
    totalUnit: "Total: ",
    errorLoad: "Could not load materials. Please check your Firestore security rules and connection settings.",
    errorLoginSave: "Please log in to save the material.",
    errorName: "Please enter a material name.",
    errorTotal: "The total number of pages or words must be an integer of at least 1.",
    errorSave: "Could not save. Please check your Firestore security rules.",
    errorLoginRecord: "Please log in to save your study record.",
    errorSelect: "Please select a material to study.",
    errorRange: "The start number must be at least 1, and the end number must be an integer equal to or greater than the start number.",
    errorRecord: "Could not save the study record. Please check your Firestore security rules.",
    confirmDelete: "Do you want to delete this material?\nIts study records will also be deleted.",
    errorDelete: "Could not delete the material. Please check your Firestore settings.",
  },
  "zh-CN": {
    loading: "正在加载学习资料...",
    title: "📚 学习资料",
    loginRequired: "请登录后注册并保存学习资料。",
    login: "登录",
    backToday: "返回今日学习",
    eyebrow: "STUDY LIBRARY",
    subtitle: "记录书籍和单词卡组的学习进度。",
    linkBook: "关联 Little Library 中的书籍",
    noBookLink: "不关联",
    linkedBook: "已关联书籍",
    readBook: "打开阅读记录",
    linkedBookHint: "页面进度会从阅读记录同步。",
    noBooks: "书架中没有书籍，请先在 Little Library 添加书籍。",
    linkedRecordHint: "已关联书籍请在阅读记录中记录页数。",

    today: "今日学习 →",
    plan: "学习计划",
    todayNav: "今日学习",
    editMaterial: "✏️ 编辑学习资料",
    addMaterial: "➕ 添加学习资料",
    materialName: "资料名称",
    namePlaceholder: "例如：HSK7-9级、德语练习册",
    language: "语言",
    materialType: "资料类型",
    book: "书籍 / 练习册（页数）",
    deck: "单词卡组（单词数）",
    totalPages: "总页数",
    totalWords: "总单词数",
    saving: "正在保存...",
    saveChanges: "保存修改",
    register: "添加资料",
    cancelEdit: "取消编辑",
    recordHeading: "📝 记录学习范围",
    recordDescription: "例如：第1～20页，或第1～20个单词。重复记录相同范围时，进度不会重复增加。",
    registerFirst: "请先使用上方表单添加学习资料。",
    selectMaterial: "选择学习资料",
    selectPlaceholder: "请选择资料",
    pages: "页",
    words: "个单词",
    wordNumber: "个单词",
    startNumber: "起始编号",
    endNumber: "结束编号",
    recordRange: "的范围可以记录。",
    recording: "正在记录...",
    saveRecord: "保存学习记录",
    registered: "📖 已添加的学习资料",
    noMaterials: "还没有学习资料。",
    firstMaterial: "添加你的第一份学习资料吧！",
    studied: "已学习",
    records: "学习记录范围：",
    recordsUnit: "条",
    viewRecords: "查看学习记录",
    edit: "编辑",
    delete: "删除",
    goPlan: "学习计划",
    totalUnit: "共",
    errorLoad: "无法加载学习资料。请检查 Firestore 安全规则和连接设置。",
    errorLoginSave: "请登录后保存学习资料。",
    errorName: "请输入资料名称。",
    errorTotal: "总页数或总单词数必须是大于等于1的整数。",
    errorSave: "保存失败。请检查 Firestore 安全规则。",
    errorLoginRecord: "请登录后保存学习记录。",
    errorSelect: "请选择要学习的资料。",
    errorRange: "起始编号必须大于等于1，结束编号必须是大于等于起始编号的整数。",
    errorRecord: "无法保存学习记录。请检查 Firestore 安全规则。",
    confirmDelete: "，确定要删除吗？\n该资料的学习记录也会被删除。",
    errorDelete: "删除失败。请检查 Firestore 设置。",
  },
  "zh-TW": {
    loading: "正在載入學習教材...",
    title: "📚 學習教材",
    loginRequired: "請登入後註冊並儲存學習教材。",
    login: "登入",
    backToday: "返回今日學習",
    eyebrow: "STUDY LIBRARY",
    subtitle: "讓書籍和單字卡組的學習進度一目了然。",
    linkBook: "連結 Little Library 中的書籍",
    noBookLink: "不連結",
    linkedBook: "已連結書籍",
    readBook: "開啟閱讀記錄",
    linkedBookHint: "頁面進度會從閱讀記錄同步。",
    noBooks: "書架中沒有書籍，請先在 Little Library 新增書籍。",
    linkedRecordHint: "已連結書籍請在閱讀記錄中記錄頁數。",

    today: "今日學習 →",
    plan: "學習計畫",
    todayNav: "今日學習",
    editMaterial: "✏️ 編輯教材",
    addMaterial: "➕ 新增教材",
    materialName: "教材名稱",
    namePlaceholder: "例如：HSK7-9級、德文練習題",
    language: "語言",
    materialType: "教材類型",
    book: "書籍／練習題（頁數）",
    deck: "單字卡組（單字數）",
    totalPages: "總頁數",
    totalWords: "總單字數",
    saving: "儲存中...",
    saveChanges: "儲存變更",
    register: "新增教材",
    cancelEdit: "取消編輯",
    recordHeading: "📝 記錄學習範圍",
    recordDescription: "例如：第1～20頁，或第1～20個單字。重複輸入已記錄的範圍，進度不會重複計算。",
    registerFirst: "請先使用上方表單新增教材。",
    selectMaterial: "選擇學習教材",
    selectPlaceholder: "請選擇教材",
    pages: "頁",
    words: "個單字",
    wordNumber: "個單字",
    startNumber: "起始編號",
    endNumber: "結束編號",
    recordRange: "的範圍可以記錄。",
    recording: "記錄中...",
    saveRecord: "儲存學習記錄",
    registered: "📖 已新增的教材",
    noMaterials: "目前還沒有教材。",
    firstMaterial: "新增你的第一份教材吧！",
    studied: "已學習",
    records: "已記錄的學習範圍：",
    recordsUnit: "筆",
    viewRecords: "查看學習記錄",
    edit: "編輯",
    delete: "刪除",
    goPlan: "前往學習計畫",
    totalUnit: "共",
    errorLoad: "無法載入教材。請檢查 Firestore 安全性規則及連線設定。",
    errorLoginSave: "請登入後儲存教材。",
    errorName: "請輸入教材名稱。",
    errorTotal: "總頁數或總單字數必須是大於或等於1的整數。",
    errorSave: "無法儲存。請檢查 Firestore 安全性規則。",
    errorLoginRecord: "請登入後儲存學習記錄。",
    errorSelect: "請選擇要學習的教材。",
    errorRange: "起始編號必須大於或等於1，結束編號必須是大於或等於起始編號的整數。",
    errorRecord: "無法儲存學習記錄。請檢查 Firestore 安全性規則。",
    confirmDelete: "，確定要刪除嗎？\n該教材的學習記錄也會一併刪除。",
    errorDelete: "無法刪除。請檢查 Firestore 設定。",
  },
  es: {
    loading: "Cargando materiales de estudio...",
    title: "📚 Materiales de estudio",
    loginRequired: "Inicia sesión para registrar y guardar materiales.",
    login: "Iniciar sesión",
    backToday: "Volver al estudio de hoy",
    eyebrow: "STUDY LIBRARY",
    subtitle: "Visualiza tu progreso con libros y mazos de vocabulario.",
    linkBook: "Vincular con un libro de Little Library",
    noBookLink: "No vincular",
    linkedBook: "Libro vinculado",
    readBook: "Abrir registro de lectura",
    linkedBookHint: "El progreso de páginas se sincroniza desde el registro de lectura.",
    noBooks: "No hay libros en tu biblioteca. Añade primero un libro a Little Library.",
    linkedRecordHint: "Registra las páginas de los libros vinculados en el registro de lectura.",

    today: "Estudio de hoy →",
    plan: "Plan de estudio",
    todayNav: "Estudio de hoy",
    editMaterial: "✏️ Editar material",
    addMaterial: "➕ Añadir material",
    materialName: "Nombre del material",
    namePlaceholder: "Ej.: HSK 7-9, cuaderno de alemán",
    language: "Idioma",
    materialType: "Tipo de material",
    book: "Libro / Cuaderno (páginas)",
    deck: "Mazo de vocabulario (palabras)",
    totalPages: "Total de páginas",
    totalWords: "Total de palabras",
    saving: "Guardando...",
    saveChanges: "Guardar cambios",
    register: "Añadir material",
    cancelEdit: "Cancelar edición",
    recordHeading: "📝 Registrar el progreso",
    recordDescription: "Ejemplo: páginas 1–20 o palabras 1–20. Los rangos ya registrados no se contabilizan dos veces.",
    registerFirst: "Primero añade un material con el formulario de arriba.",
    selectMaterial: "Seleccionar material",
    selectPlaceholder: "Elige un material",
    pages: "páginas",
    words: "palabras",
    wordNumber: "palabras",
    startNumber: "Número inicial",
    endNumber: "Número final",
    recordRange: "se puede registrar.",
    recording: "Registrando...",
    saveRecord: "Guardar registro de estudio",
    registered: "📖 Materiales registrados",
    noMaterials: "Todavía no hay materiales.",
    firstMaterial: "¡Añade tu primer material de estudio!",
    studied: "Estudiado",
    records: "Rangos registrados: ",
    recordsUnit: "",
    viewRecords: "Ver registros de estudio",
    edit: "Editar",
    delete: "Eliminar",
    goPlan: "Ir al plan de estudio",
    totalUnit: "Total: ",
    errorLoad: "No se pudieron cargar los materiales. Comprueba las reglas de seguridad de Firestore y la conexión.",
    errorLoginSave: "Inicia sesión para guardar el material.",
    errorName: "Introduce el nombre del material.",
    errorTotal: "El total de páginas o palabras debe ser un número entero igual o superior a 1.",
    errorSave: "No se pudo guardar. Comprueba las reglas de seguridad de Firestore.",
    errorLoginRecord: "Inicia sesión para guardar el registro de estudio.",
    errorSelect: "Selecciona el material que vas a estudiar.",
    errorRange: "El número inicial debe ser al menos 1 y el número final debe ser un entero igual o superior al inicial.",
    errorRecord: "No se pudo guardar el registro. Comprueba las reglas de seguridad de Firestore.",
    confirmDelete: "¿Quieres eliminar este material?\nTambién se eliminarán sus registros de estudio.",
    errorDelete: "No se pudo eliminar. Comprueba la configuración de Firestore.",
  },
};

function getToday(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// 重複した学習範囲をまとめて、学習済みページ・単語数を計算する
function getCoveredCount(ranges: StudyRange[]): number {
  if (ranges.length === 0) return 0;

  const sorted = [...ranges].sort((a, b) => a.start - b.start);

  let covered = 0;
  let currentStart = sorted[0].start;
  let currentEnd = sorted[0].end;

  for (let i = 1; i < sorted.length; i++) {
    const range = sorted[i];

    if (range.start <= currentEnd + 1) {
      currentEnd = Math.max(currentEnd, range.end);
    } else {
      covered += currentEnd - currentStart + 1;
      currentStart = range.start;
      currentEnd = range.end;
    }
  }

  covered += currentEnd - currentStart + 1;
  return covered;
}

function getMaterialRanges(material: Material, readingLogs: ReadingLog[]): StudyRange[] {
  const linkedLogs = material.linkedBookId
    ? readingLogs
        .filter((log) => log.bookId === material.linkedBookId)
        .map((log) => ({ start: log.startPage, end: log.endPage, date: log.date }))
    : [];

  // 既存の教材記録を残しつつ、読書ログと重複するページは進捗に二重計上しない
  return [...material.studyRanges, ...linkedLogs];
}

function getProgress(material: Material, readingLogs: ReadingLog[]): number {
  if (material.total <= 0) return 0;
  const covered = getCoveredCount(getMaterialRanges(material, readingLogs));
  return Math.min(100, Math.round((covered / material.total) * 100));
}

export default function MaterialsPage() {
  const { language: appLanguage } = useAppLanguage();
  const currentLanguage = (translations[appLanguage as AppLanguage]
    ? appLanguage
    : "ja") as AppLanguage;
  const t = translations[currentLanguage];

  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [libraryBooks, setLibraryBooks] = useState<LibraryBook[]>([]);
  const [readingLogs, setReadingLogs] = useState<ReadingLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [language, setLanguage] = useState("中国語");
  const [type, setType] = useState<MaterialType>("book");
  const [total, setTotal] = useState("100");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [linkedBookId, setLinkedBookId] = useState("");

  const [selectedId, setSelectedId] = useState("");
  const [rangeStart, setRangeStart] = useState("1");
  const [rangeEnd, setRangeEnd] = useState("10");

  useEffect(() => {
    const refreshLibrary = () => {
      try {
        const rawBooks = localStorage.getItem(BOOKS_STORAGE_KEY);
        const parsedBooks = rawBooks ? JSON.parse(rawBooks) : [];
        setLibraryBooks(
          Array.isArray(parsedBooks)
            ? parsedBooks.flatMap((book: unknown) => {
                if (!book || typeof book !== "object") return [];
                const value = book as Record<string, unknown>;
                if (typeof value.id !== "number" || typeof value.title !== "string") return [];
                return [{
                  id: value.id,
                  title: value.title,
                  totalPages: typeof value.totalPages === "number" ? value.totalPages : 0,
                }];
              })
            : []
        );

        const rawLogs = localStorage.getItem(READING_LOGS_STORAGE_KEY);
        const parsedLogs = rawLogs ? JSON.parse(rawLogs) : [];
        setReadingLogs(
          Array.isArray(parsedLogs)
            ? parsedLogs.flatMap((log: unknown) => {
                if (!log || typeof log !== "object") return [];
                const value = log as Record<string, unknown>;
                if (
                  typeof value.bookId !== "number" ||
                  typeof value.startPage !== "number" ||
                  typeof value.endPage !== "number" ||
                  typeof value.date !== "string"
                ) return [];
                return [{
                  bookId: value.bookId,
                  startPage: value.startPage,
                  endPage: value.endPage,
                  date: value.date,
                }];
              })
            : []
        );
      } catch (err) {
        console.error("Little Library data loading error:", err);
        setLibraryBooks([]);
        setReadingLogs([]);
      }
    };

    refreshLibrary();
    window.addEventListener("storage", refreshLibrary);
    window.addEventListener("focus", refreshLibrary);
    return () => {
      window.removeEventListener("storage", refreshLibrary);
      window.removeEventListener("focus", refreshLibrary);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthChecked(true);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadMaterials() {
      if (!authChecked) return;

      if (!user) {
        setMaterials([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const snapshot = await getDocs(
          collection(db, "users", user.uid, "materials")
        );

        const loaded: Material[] = snapshot.docs.map((item) => {
          const data = item.data();

          const rawRanges: unknown[] = Array.isArray(data.studyRanges)
            ? data.studyRanges
            : [];

          const studyRanges: StudyRange[] = rawRanges.flatMap((value) => {
            if (
              typeof value !== "object" ||
              value === null ||
              !("start" in value) ||
              !("end" in value) ||
              !("date" in value)
            ) {
              return [];
            }

            const range = value as {
              start: unknown;
              end: unknown;
              date: unknown;
            };

            if (
              typeof range.start !== "number" ||
              typeof range.end !== "number" ||
              typeof range.date !== "string" ||
              !Number.isFinite(range.start) ||
              !Number.isFinite(range.end)
            ) {
              return [];
            }

            return [{
              start: range.start,
              end: range.end,
              date: range.date,
            }];
          });

          return {
            id: item.id,
            name: typeof data.name === "string" ? data.name : "",
            language:
              typeof data.language === "string"
                ? data.language
                : "その他",
            type: data.type === "deck" ? "deck" : "book",
            total:
              typeof data.total === "number" && data.total > 0
                ? Math.floor(data.total)
                : 1,
            studyRanges,
            createdAt:
              typeof data.createdAt === "number" ? data.createdAt : 0,
            linkedBookId:
              typeof data.linkedBookId === "number" ? data.linkedBookId : undefined,
          };
        });

        loaded.sort((a, b) => b.createdAt - a.createdAt);

        if (!cancelled) {
          setMaterials(loaded);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) setError(t.errorLoad);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadMaterials();

    return () => {
      cancelled = true;
    };
  }, [user, authChecked]);

  async function handleSaveMaterial(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      setError(t.errorLoginSave);
      return;
    }

    const trimmedName = name.trim();
    const parsedTotal = Number(total);

    if (!trimmedName) {
      setError(t.errorName);
      return;
    }

    if (
      !Number.isSafeInteger(parsedTotal) ||
      parsedTotal < 1 ||
      parsedTotal > 10000000
    ) {
      setError(t.errorTotal);
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (editingId) {
        await updateDoc(
          doc(db, "users", user.uid, "materials", editingId),
          {
            name: trimmedName,
            language,
            type,
            total: parsedTotal,
            linkedBookId:
              type === "book" && linkedBookId
                ? Number(linkedBookId)
                : deleteField(),
          }
        );

        setMaterials((previous) =>
          previous.map((material) =>
            material.id === editingId
              ? {
                  ...material,
                  name: trimmedName,
                  language,
                  type,
                  total: parsedTotal,
                  linkedBookId:
                    type === "book" && linkedBookId
                      ? Number(linkedBookId)
                      : undefined,
                }
              : material
          )
        );
      } else {
        const newMaterial = {
          name: trimmedName,
          language,
          type,
          total: parsedTotal,
          studyRanges: [] as StudyRange[],
          createdAt: Date.now(),
          ...(type === "book" && linkedBookId
            ? { linkedBookId: Number(linkedBookId) }
            : {}),
        };

        const result = await addDoc(
          collection(db, "users", user.uid, "materials"),
          newMaterial
        );

        setMaterials((previous) => [
          { id: result.id, ...newMaterial },
          ...previous,
        ]);
      }

      setName("");
      setLanguage("中国語");
      setType("book");
      setTotal("100");
      setLinkedBookId("");
      setEditingId(null);
    } catch (err) {
      console.error(err);
      setError(t.errorSave);
    } finally {
      setSaving(false);
    }
  }

  function startEditing(material: Material) {
    setEditingId(material.id);
    setName(material.name);
    setLanguage(material.language);
    setType(material.type);
    setTotal(String(material.total));
    setLinkedBookId(material.linkedBookId ? String(material.linkedBookId) : "");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEditing() {
    setEditingId(null);
    setName("");
    setLanguage("中国語");
    setType("book");
    setTotal("100");
    setLinkedBookId("");
    setError("");
  }

  async function handleRecordStudy(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      setError(t.errorLoginRecord);
      return;
    }

    const material = materials.find((item) => item.id === selectedId);
    const start = Number(rangeStart);
    const end = Number(rangeEnd);

    if (!material) {
      setError(t.errorSelect);
      return;
    }

    if (
      !Number.isSafeInteger(start) ||
      !Number.isSafeInteger(end) ||
      start < 1 ||
      end < start ||
      end > material.total
    ) {
      setError(t.errorRange);
      return;
    }

    const newRange: StudyRange = {
      start,
      end,
      date: getToday(),
    };

    setSaving(true);
    setError("");

    try {
      await updateDoc(
        doc(db, "users", user.uid, "materials", material.id),
        {
          studyRanges: [...material.studyRanges, newRange],
        }
      );

      setMaterials((previous) =>
        previous.map((item) =>
          item.id === material.id
            ? {
                ...item,
                studyRanges: [...item.studyRanges, newRange],
              }
            : item
        )
      );
    } catch (err) {
      console.error(err);
      setError(t.errorRecord);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(material: Material) {
    if (!user) return;

    const confirmed = window.confirm(
      `「${material.name}」${t.confirmDelete}`
    );

    if (!confirmed) return;

    setError("");

    try {
      await deleteDoc(
        doc(db, "users", user.uid, "materials", material.id)
      );

      setMaterials((previous) =>
        previous.filter((item) => item.id !== material.id)
      );

      if (selectedId === material.id) setSelectedId("");
      if (editingId === material.id) cancelEditing();
    } catch (err) {
      console.error(err);
      setError(t.errorDelete);
    }
  }

  if (!authChecked || loading) {
    return (
      <main style={styles.page}>
        <p>{t.loading}</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main style={styles.page}>
        <div style={styles.container}>
          <h1 style={styles.title}>{t.title}</h1>
          <p>{t.loginRequired}</p>
          <Link href="/login" style={styles.primaryLink}>
            {t.login}
          </Link>
          <p style={{ marginTop: 20 }}>
            <Link href="/today" style={styles.textLink}>
              {t.backToday}
            </Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div>
            <p style={styles.eyebrow}>{t.eyebrow}</p>
            <h1 style={styles.title}>{t.title}</h1>
            <p style={styles.subtitle}>{t.subtitle}</p>
          </div>

          <Link href="/today" style={styles.primaryLink}>
            {t.today}
          </Link>
        </header>

        <nav style={styles.nav}>
          <Link href="/plan" style={styles.navLink}>
            {t.plan}
          </Link>
          <Link href="/today" style={styles.navLink}>
            {t.todayNav}
          </Link>
        </nav>

        {error && (
          <div role="alert" style={styles.error}>
            {error}
          </div>
        )}

        <section style={styles.panel}>
          <h2 style={styles.heading}>
            {editingId ? t.editMaterial : t.addMaterial}
          </h2>

          <form onSubmit={handleSaveMaterial} style={styles.form}>
            <label style={styles.label}>
              {t.materialName}
              <input
                style={styles.input}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={t.namePlaceholder}
                maxLength={150}
                required
              />
            </label>

            <div style={styles.twoColumns}>
              <label style={styles.label}>
                {t.language}
                <select
                  style={styles.input}
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                >
                  {MATERIAL_LANGUAGES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label[currentLanguage]}
                    </option>
                  ))}
                </select>
              </label>

              <label style={styles.label}>
                {t.materialType}
                <select
                  style={styles.input}
                  value={type}
                  onChange={(event) => {
                    const nextType = event.target.value as MaterialType;
                    setType(nextType);
                    if (nextType === "deck") setLinkedBookId("");
                  }}
                >
                  <option value="book">{t.book}</option>
                  <option value="deck">{t.deck}</option>
                </select>
              </label>
            </div>

            <label style={styles.label}>
              {type === "book" ? t.totalPages : t.totalWords}
              <input
                style={styles.input}
                type="number"
                min="1"
                max="10000000"
                step="1"
                value={total}
                onChange={(event) => setTotal(event.target.value)}
                required
              />
            </label>

            {type === "book" && (
              <label style={styles.label}>
                {t.linkBook}
                <select
                  style={styles.input}
                  value={linkedBookId}
                  onChange={(event) => setLinkedBookId(event.target.value)}
                >
                  <option value="">{t.noBookLink}</option>
                  {libraryBooks.map((book) => (
                    <option key={book.id} value={String(book.id)}>
                      {book.title}{book.totalPages > 0 ? `（${book.totalPages}${t.pages}）` : ""}
                    </option>
                  ))}
                </select>
                {libraryBooks.length === 0 && (
                  <span style={styles.smallText}>{t.noBooks}</span>
                )}
                {linkedBookId && (
                  <span style={styles.smallText}>{t.linkedBookHint}</span>
                )}
              </label>
            )}

            <div style={styles.buttonRow}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  ...styles.primaryButton,
                  opacity: saving ? 0.65 : 1,
                  cursor: saving ? "not-allowed" : "pointer",
                }}
              >
                {saving
                  ? t.saving
                  : editingId
                    ? t.saveChanges
                    : t.register}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={cancelEditing}
                  style={styles.secondaryButton}
                >
                  {t.cancelEdit}
                </button>
              )}
            </div>
          </form>
        </section>

<section style={styles.panel}>
          <h2 style={styles.heading}>{t.recordHeading}</h2>
          <p style={styles.description}>{t.recordDescription}</p>

          {materials.filter((item) => !(item.type === "book" && item.linkedBookId)).length === 0 ? (
            <p>{materials.length > 0 ? t.linkedRecordHint : t.registerFirst}</p>
          ) : (
            <form onSubmit={handleRecordStudy} style={styles.form}>
              <label style={styles.label}>
                {t.selectMaterial}
                <select
                  style={styles.input}
                  value={selectedId}
                  onChange={(event) => {
                    const id = event.target.value;
                    setSelectedId(id);

                    const material = materials.find(
                      (item) => item.id === id
                    );

                    if (material) {
                      setRangeStart("1");
                      setRangeEnd(String(Math.min(10, material.total)));
                    }
                  }}
                  required
                >
                  <option value="">{t.selectPlaceholder}</option>
                  {materials.filter((material) => !(material.type === "book" && material.linkedBookId)).map((material) => (
                    <option key={material.id} value={material.id}>
                      {material.name}（{t.totalUnit}{material.total}
                      {material.type === "book" ? t.pages : t.words}）
                    </option>
                  ))}
                </select>
              </label>

              {(() => {
                const selected = materials.find(
                  (item) => item.id === selectedId
                );

                if (!selected) return null;

                const unit =
                  selected.type === "book" ? t.pages : t.wordNumber;

                return (
                  <>
                    <div style={styles.twoColumns}>
                      <label style={styles.label}>
                        {t.startNumber}
                        <input
                          style={styles.input}
                          type="number"
                          min="1"
                          step="1"
                          value={rangeStart}
                          onChange={(event) =>
                            setRangeStart(event.target.value)
                          }
                          required
                        />
                      </label>

                      <label style={styles.label}>
                        {t.endNumber}
                        <input
                          style={styles.input}
                          type="number"
                          min="1"
                          step="1"
                          value={rangeEnd}
                          onChange={(event) =>
                            setRangeEnd(event.target.value)
                          }
                          required
                        />
                      </label>
                    </div>

                    <p style={styles.description}>
                      1〜{selected.total.toLocaleString()}
                      {unit}{t.recordRange}
                    </p>
                  </>
                );
              })()}

              <button
                type="submit"
                disabled={saving || !selectedId}
                style={{
                  ...styles.primaryButton,
                  opacity: saving || !selectedId ? 0.65 : 1,
                  cursor:
                    saving || !selectedId ? "not-allowed" : "pointer",
                }}
              >
                {saving ? t.recording : t.saveRecord}
              </button>
            </form>
          )}
        </section>

        <section>
          <h2 style={styles.heading}>{t.registered}</h2>

          {materials.length === 0 ? (
            <div style={styles.empty}>
              <p style={{ fontSize: 32, margin: 0 }}>🌱</p>
              <p>{t.noMaterials}</p>
              <p>{t.firstMaterial}</p>
            </div>
          ) : (
            <div style={styles.materialList}>
              {materials.map((material) => {
                const allRanges = getMaterialRanges(material, readingLogs);
                const covered = getCoveredCount(allRanges);
                const progress = getProgress(material, readingLogs);
                const linkedBook = libraryBooks.find((book) => book.id === material.linkedBookId);
                const unit =
                  material.type === "book" ? t.pages : t.words;

                return (
                  <article key={material.id} style={styles.materialCard}>
                    <div style={styles.cardTop}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={styles.tag}>
                          {MATERIAL_LANGUAGES.find(
                            (item) => item.value === material.language
                          )?.label[currentLanguage] ?? material.language}
                        </span>
                        <span style={styles.tag}>
                          {material.type === "book" ? t.book : t.deck}
                        </span>

                        <h3 style={styles.cardTitle}>{material.name}</h3>

                        {material.linkedBookId && (
                          <div style={{ margin: "4px 0 10px" }}>
                            <span style={styles.tag}>
                              {t.linkedBook}: {linkedBook?.title ?? `#${material.linkedBookId}`}
                            </span>
                            {linkedBook && (
                              <Link
                                href={`/library/read?id=${linkedBook.id}`}
                                style={{ ...styles.textLink, display: "inline-block", marginTop: 4 }}
                              >
                                {t.readBook} ↗
                              </Link>
                            )}
                          </div>
                        )}

                        <p style={styles.description}>
                          {t.studied} {covered.toLocaleString()} /{" "}
                          {material.total.toLocaleString()} {unit}
                        </p>
                      </div>

                      <strong style={styles.percentage}>
                        {progress}%
                      </strong>
                    </div>

                    <div
                      style={styles.progressTrack}
                      role="progressbar"
                      aria-label={`${material.name} ${t.studied}`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={progress}
                    >
                      <div
                        style={{
                          ...styles.progressBar,
                          width: `${progress}%`,
                        }}
                      />
                    </div>

                    <p style={styles.smallText}>
                      {t.records}
                      {allRanges.length}
                      {t.recordsUnit}
                    </p>

                    {allRanges.length > 0 && (
                      <details style={styles.details}>
                        <summary>{t.viewRecords}</summary>
                        <ul style={styles.rangeList}>
                          {[...allRanges]
                            .reverse()
                            .map((range, index) => (
                              <li
                                key={`${range.date}-${range.start}-${range.end}-${index}`}
                              >
                                {range.date}：{range.start}〜{range.end}
                                {unit}
                              </li>
                            ))}
                        </ul>
                      </details>
                    )}

                    <div style={styles.buttonRow}>
                      <button
                        type="button"
                        onClick={() => startEditing(material)}
                        style={styles.secondaryButton}
                      >
                        {t.edit}
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleDelete(material)}
                        style={styles.deleteButton}
                      >
                        {t.delete}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <footer style={styles.footer}>
          <Link href="/plan" style={styles.textLink}>
            {t.goPlan}
          </Link>
          {"　・　"}
          <Link href="/today" style={styles.textLink}>
            {t.todayNav}
          </Link>
        </footer>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "32px 16px 60px",
    background: "#f5f0e6",
    color: "#302a22",
    boxSizing: "border-box",
  },
  container: {
    width: "100%",
    maxWidth: 850,
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 20,
    flexWrap: "wrap",
    marginBottom: 24,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 3,
    margin: "0 0 8px",
    color: "var(--anki-theme-dark)",
  },
  title: {
    fontSize: "clamp(28px, 5vw, 40px)",
    lineHeight: 1.2,
    margin: "0 0 10px",
    fontWeight: 900,
  },
  subtitle: {
    margin: 0,
    color: "#675d50",
    lineHeight: 1.7,
  },
  primaryLink: {
    display: "inline-block",
    padding: "12px 16px",
    borderRadius: 14,
    background: "var(--anki-theme-color)",
    color: "#ffffff",
    textDecoration: "none",
    fontWeight: 800,
  },
  nav: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  navLink: {
    display: "inline-block",
    padding: "9px 14px",
    border: "1px solid var(--anki-theme-soft)",
    borderRadius: 12,
    color: "var(--anki-theme-dark)",
    textDecoration: "none",
    fontWeight: 700,
    background: "#fffdf6",
  },
  panel: {
    padding: 22,
    marginBottom: 24,
    border: "2px solid var(--anki-theme-soft)",
    borderRadius: 22,
    background: "#fffdf6",
    boxShadow: "4px 5px 0 var(--anki-theme-light)",
  },
  heading: {
    fontSize: 22,
    lineHeight: 1.4,
    margin: "0 0 18px",
    fontWeight: 900,
  },
  description: {
    color: "#675d50",
    lineHeight: 1.7,
    fontSize: 14,
  },
  form: {
    display: "grid",
    gap: 16,
  },
  label: {
    display: "grid",
    gap: 8,
    fontWeight: 800,
    fontSize: 14,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 13px",
    border: "1px solid var(--anki-theme-soft)",
    borderRadius: 12,
    background: "#ffffff",
    color: "#302a22",
    fontSize: 16,
    accentColor: "var(--anki-theme-color)",
  },
  twoColumns: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 14,
  },
  buttonRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
  },
  primaryButton: {
    padding: "12px 17px",
    border: "2px solid var(--anki-theme-color)",
    borderRadius: 12,
    background: "var(--anki-theme-color)",
    color: "#ffffff",
    fontWeight: 800,
    fontSize: 14,
    cursor: "pointer",
  },
  secondaryButton: {
    padding: "10px 14px",
    border: "1px solid var(--anki-theme-soft)",
    borderRadius: 12,
    background: "#fffdf6",
    color: "var(--anki-theme-dark)",
    fontWeight: 800,
    cursor: "pointer",
  },
  deleteButton: {
    padding: "10px 14px",
    border: "1px solid #b64c43",
    borderRadius: 12,
    background: "#fff5f3",
    color: "#9c3028",
    fontWeight: 800,
    cursor: "pointer",
  },
  error: {
    padding: 14,
    marginBottom: 20,
    border: "1px solid #d88b83",
    borderRadius: 12,
    background: "#fff0ed",
    color: "#922e25",
    lineHeight: 1.6,
  },
  empty: {
    padding: 30,
    border: "1px dashed var(--anki-theme-soft)",
    borderRadius: 18,
    textAlign: "center",
    background: "#fffdf6",
    lineHeight: 1.7,
  },
  materialList: {
    display: "grid",
    gap: 18,
  },
  materialCard: {
    padding: 20,
    border: "2px solid var(--anki-theme-soft)",
    borderRadius: 20,
    background: "#fffdf6",
    boxShadow: "3px 4px 0 var(--anki-theme-light)",
    minWidth: 0,
  },
  cardTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  tag: {
    display: "inline-block",
    margin: "0 6px 8px 0",
    padding: "5px 9px",
    borderRadius: 999,
    background: "var(--anki-theme-light)",
    color: "var(--anki-theme-dark)",
    fontSize: 12,
    fontWeight: 800,
  },
  cardTitle: {
    margin: "5px 0 8px",
    fontSize: 20,
    lineHeight: 1.5,
    overflowWrap: "anywhere",
  },
  percentage: {
    fontSize: 25,
    whiteSpace: "nowrap",
    color: "var(--anki-theme-dark)",
  },
  progressTrack: {
    width: "100%",
    height: 13,
    marginTop: 14,
    overflow: "hidden",
    borderRadius: 999,
    background: "var(--anki-theme-light)",
  },
  progressBar: {
    height: "100%",
    borderRadius: 999,
    background: "var(--anki-theme-color)",
    transition: "width 0.25s ease",
  },
  smallText: {
    margin: "10px 0",
    fontSize: 12,
    color: "#756b5d",
  },
  details: {
    marginTop: 12,
    lineHeight: 1.8,
    fontSize: 14,
  },
  rangeList: {
    paddingLeft: 22,
  },
  footer: {
    marginTop: 30,
    textAlign: "center",
    fontSize: 14,
  },
  textLink: {
    color: "var(--anki-theme-dark)",
    fontWeight: 800,
  },
};