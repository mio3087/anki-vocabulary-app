
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useAppLanguage } from "@/app/component/AppLanguage";

type Language = "ja" | "de" | "en" | "zh-CN" | "zh-TW" | "es";
type Mood = "happy" | "calm" | "grateful" | "tired" | "sad";

type Moment = {
  date: string;
  mood: Mood;
  highlights: string;
  note: string;
  updatedAt: string;
};

const STORAGE_KEY = "anki-little-moments-v1";

const moodDefinitions: {
  id: Mood;
  emoji: string;
  color: string;
  background: string;
}[] = [
  { id: "happy", emoji: "☀️", color: "#997344", background: "#FBF0D9" },
  { id: "calm", emoji: "🌿", color: "#577761", background: "#EAF1E9" },
  { id: "grateful", emoji: "🌷", color: "#AD747B", background: "#F8E9EB" },
  { id: "tired", emoji: "☁️", color: "#77788A", background: "#EEEEF4" },
  { id: "sad", emoji: "🌧️", color: "#64859A", background: "#E8F0F5" },
];

const locales: Record<Language, string> = {
  ja: "ja-JP",
  de: "de-DE",
  en: "en-US",
  "zh-CN": "zh-CN",
  "zh-TW": "zh-TW",
  es: "es-ES",
};

const translations = {
  ja: {
    description: "大きな出来事じゃなくてもいい。\n今日の小さな幸せを、ここに残そう。",
    loading: "記録を読み込んでいます...",
    loadError: "クラウドの記録を読み込めませんでした。ブラウザの記録を表示しています。",
    savedCloud: "記録を保存しました 🌿",
    savedLocal: "このブラウザに記録を保存しました。",
    saveError: "ブラウザには保存しましたが、クラウド保存に失敗しました。",
    deleted: "記録を削除しました。",
    deleteError: "クラウド側の削除に失敗しました。",
    today: "今日",
    todayQuestion: "今日はどんな一日だった？",
    todayDescription: "ほんの小さなことでも、書き留めておこう。",
    recordToday: "今日を記録する",
    yourMonth: "YOUR MONTH",
    previousMonth: "前月",
    nextMonth: "翌月",
    recordedMood: "記録した日には気分が表示されます",
    selectedDate: "選択中の日付",
    journal: "YOUR LITTLE JOURNAL",
    journalDescription: "どんな気持ちも、そのまま大切に。",
    moodLabel: "今日の気分",
    highlightsLabel: "今日の小さな幸せ",
    highlightsExample: "例：おいしいコーヒーを飲んだ。ディズニーに行った。",
    highlightsPlaceholder: "今日、心がちょっと嬉しくなったことは？",
    noteLabel: "今日のこと、自由に書こう",
    noteDescription: "感じたこと、考えたこと、忘れたくない瞬間。",
    notePlaceholder: "今日の出来事や思い出を自由に書いてね...",
    saving: "保存中...",
    updateRecord: "記録を更新する",
    saveRecord: "この日の記録を保存する",
    delete: "削除",
    confirmDelete: "この日の記録を削除しますか？",
    deleteButton: "削除する",
    cancel: "キャンセル",
    monthReview: "A MONTH TO REMEMBER",
    monthReviewTitle: "の振り返り",
    monthReviewDescription: "小さな瞬間も、集まれば大切な思い出になる。",
    recordedDays: "記録した日",
    memoryDays: "思い出を書いた日",
    monthlyMood: "今月の気分",
    searchTitle: "MEMORY SEARCH",
    searchHeading: "思い出を検索する",
    searchDescription: "場所、出来事、食べ物、気持ち。覚えている言葉から探せます。",
    searchPlaceholder: "例：ディズニー、旅行、中国茶、カフェ...",
    searchEmpty: "検索したい言葉を入力してください。",
    searchNoResults: "一致する思い出はありませんでした。",
    searchResults: "検索結果",
    resultCount: "件見つかりました",
    recentRecords: "最近の記録",
    noRecords: "この月の記録はまだありません。",
    startWithToday: "今日の小さな幸せから、始めてみよう。",
    close: "閉じる",
    seeMore: "もっと見る",
    footer: "Every little moment matters.",
    cloudBackup: "Firestore ＋ ブラウザにバックアップ",
    localBackup: "このブラウザに保存",
    moods: {
      happy: "嬉しい",
      calm: "穏やか",
      grateful: "感動",
      tired: "疲れた",
      sad: "落ち込み",
    },
    weekdays: ["月", "火", "水", "木", "金", "土", "日"],
    dayUnit: "日",
  },
  en: {
    description: "It doesn't have to be something big.\nSave today's little moments here.",
    loading: "Loading memories...",
    loadError: "Couldn't load cloud records. Showing browser records.",
    savedCloud: "Memory saved 🌿",
    savedLocal: "Saved in this browser.",
    saveError: "Saved locally, but cloud saving failed.",
    deleted: "Memory deleted.",
    deleteError: "Cloud deletion failed.",
    today: "Today",
    todayQuestion: "How was your day?",
    todayDescription: "Even the smallest things are worth remembering.",
    recordToday: "Record today",
    yourMonth: "YOUR MONTH",
    previousMonth: "Previous month",
    nextMonth: "Next month",
    recordedMood: "Your mood appears on recorded days",
    selectedDate: "Selected date",
    journal: "YOUR LITTLE JOURNAL",
    journalDescription: "Every feeling deserves to be accepted.",
    moodLabel: "How are you feeling?",
    highlightsLabel: "Today's little joy",
    highlightsExample: "For example: Had a lovely coffee. Went to Disneyland.",
    highlightsPlaceholder: "What made you happy today?",
    noteLabel: "Write freely about your day",
    noteDescription: "Your feelings, thoughts, and moments you want to remember.",
    notePlaceholder: "Write about your day...",
    saving: "Saving...",
    updateRecord: "Update memory",
    saveRecord: "Save this day's memory",
    delete: "Delete",
    confirmDelete: "Delete this day's memory?",
    deleteButton: "Delete",
    cancel: "Cancel",
    monthReview: "A MONTH TO REMEMBER",
    monthReviewTitle: " – Monthly reflection",
    monthReviewDescription: "Little moments become precious memories.",
    recordedDays: "Days recorded",
    memoryDays: "Days with written memories",
    monthlyMood: "Mood of the month",
    searchTitle: "MEMORY SEARCH",
    searchHeading: "Search your memories",
    searchDescription: "Find places, events, food, and feelings using words you remember.",
    searchPlaceholder: "e.g. Disneyland, travel, tea, cafe...",
    searchEmpty: "Enter a word to search.",
    searchNoResults: "No matching memories found.",
    searchResults: "Search results",
    resultCount: "results found",
    recentRecords: "Recent memories",
    noRecords: "No memories recorded this month yet.",
    startWithToday: "Start with one little joy from today.",
    close: "Close",
    seeMore: "See more",
    footer: "Every little moment matters.",
    cloudBackup: "Firestore + browser backup",
    localBackup: "Saved in this browser",
    moods: {
      happy: "Happy",
      calm: "Calm",
      grateful: "Touched",
      tired: "Tired",
      sad: "Down",
    },
    weekdays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    dayUnit: "days",
  },
  de: {
    description: "Es müssen keine großen Ereignisse sein.\nHalte die kleinen Glücksmomente fest.",
    loading: "Einträge werden geladen...",
    loadError: "Cloud-Einträge konnten nicht geladen werden. Lokale Einträge werden angezeigt.",
    savedCloud: "Eintrag gespeichert 🌿",
    savedLocal: "Im Browser gespeichert.",
    saveError: "Lokal gespeichert, aber die Cloud-Speicherung ist fehlgeschlagen.",
    deleted: "Eintrag gelöscht.",
    deleteError: "Das Löschen in der Cloud ist fehlgeschlagen.",
    today: "Heute",
    todayQuestion: "Wie war dein Tag?",
    todayDescription: "Auch kleine Dinge sind es wert, festgehalten zu werden.",
    recordToday: "Heute festhalten",
    yourMonth: "YOUR MONTH",
    previousMonth: "Vorheriger Monat",
    nextMonth: "Nächster Monat",
    recordedMood: "Deine Stimmung erscheint an gespeicherten Tagen",
    selectedDate: "Ausgewählter Tag",
    journal: "YOUR LITTLE JOURNAL",
    journalDescription: "Jedes Gefühl darf sein.",
    moodLabel: "Wie fühlst du dich?",
    highlightsLabel: "Dein kleiner Glücksmoment",
    highlightsExample: "Zum Beispiel: Einen Kaffee genossen. Im Disneyland gewesen.",
    highlightsPlaceholder: "Was hat dich heute glücklich gemacht?",
    noteLabel: "Schreib frei über deinen Tag",
    noteDescription: "Gefühle, Gedanken und unvergessliche Momente.",
    notePlaceholder: "Schreib über deinen Tag...",
    saving: "Wird gespeichert...",
    updateRecord: "Eintrag aktualisieren",
    saveRecord: "Eintrag speichern",
    delete: "Löschen",
    confirmDelete: "Diesen Eintrag löschen?",
    deleteButton: "Löschen",
    cancel: "Abbrechen",
    monthReview: "A MONTH TO REMEMBER",
    monthReviewTitle: " – Monatsrückblick",
    monthReviewDescription: "Kleine Momente werden zu wertvollen Erinnerungen.",
    recordedDays: "Tage mit Einträgen",
    memoryDays: "Tage mit Erinnerungen",
    monthlyMood: "Stimmung des Monats",
    searchTitle: "MEMORY SEARCH",
    searchHeading: "Erinnerungen suchen",
    searchDescription: "Finde Orte, Ereignisse, Essen und Gefühle anhand von Stichwörtern.",
    searchPlaceholder: "z. B. Disneyland, Reise, Tee, Café...",
    searchEmpty: "Gib einen Suchbegriff ein.",
    searchNoResults: "Keine passenden Erinnerungen gefunden.",
    searchResults: "Suchergebnisse",
    resultCount: "Ergebnisse",
    recentRecords: "Letzte Einträge",
    noRecords: "Für diesen Monat gibt es noch keine Einträge.",
    startWithToday: "Beginne mit einem kleinen Glücksmoment von heute.",
    close: "Schließen",
    seeMore: "Mehr anzeigen",
    footer: "Every little moment matters.",
    cloudBackup: "Firestore + Browser-Backup",
    localBackup: "In diesem Browser gespeichert",
    moods: {
      happy: "Glücklich",
      calm: "Gelassen",
      grateful: "Berührt",
      tired: "Müde",
      sad: "Niedergeschlagen",
    },
    weekdays: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"],
    dayUnit: "Tage",
  },
  "zh-CN": {
    description: "不一定要发生什么大事。\n把今天的小小幸福留在这里吧。",
    loading: "正在加载记录...",
    loadError: "无法读取云端记录。现在显示浏览器中的记录。",
    savedCloud: "记录已保存 🌿",
    savedLocal: "已保存在此浏览器中。",
    saveError: "已保存在本地，但云端保存失败。",
    deleted: "记录已删除。",
    deleteError: "云端删除失败。",
    today: "今天",
    todayQuestion: "今天过得怎么样？",
    todayDescription: "即使是很小的事情，也值得记录下来。",
    recordToday: "记录今天",
    yourMonth: "YOUR MONTH",
    previousMonth: "上个月",
    nextMonth: "下个月",
    recordedMood: "有记录的日期会显示当天的心情",
    selectedDate: "已选择日期",
    journal: "YOUR LITTLE JOURNAL",
    journalDescription: "无论是什么样的心情，都值得被珍惜。",
    moodLabel: "今天的心情",
    highlightsLabel: "今天的小确幸",
    highlightsExample: "例如：喝了一杯好喝的咖啡。去了迪士尼。",
    highlightsPlaceholder: "今天有什么小事让你开心？",
    noteLabel: "自由记录今天发生的事",
    noteDescription: "感受、想法，以及不想忘记的瞬间。",
    notePlaceholder: "写下今天的事情...",
    saving: "正在保存...",
    updateRecord: "更新记录",
    saveRecord: "保存这一天的记录",
    delete: "删除",
    confirmDelete: "确定要删除这一天的记录吗？",
    deleteButton: "删除",
    cancel: "取消",
    monthReview: "A MONTH TO REMEMBER",
    monthReviewTitle: "月回顾",
    monthReviewDescription: "一个个小小的瞬间，汇聚起来就会成为珍贵的回忆。",
    recordedDays: "记录天数",
    memoryDays: "写下回忆的天数",
    monthlyMood: "本月心情",
    searchTitle: "MEMORY SEARCH",
    searchHeading: "搜索回忆",
    searchDescription: "通过关键词寻找地点、活动、美食和心情。",
    searchPlaceholder: "例如：迪士尼、旅行、茶、咖啡...",
    searchEmpty: "请输入搜索关键词。",
    searchNoResults: "没有找到相关记录。",
    searchResults: "搜索结果",
    resultCount: "条结果",
    recentRecords: "最近的记录",
    noRecords: "这个月还没有记录。",
    startWithToday: "从今天的小确幸开始记录吧。",
    close: "收起",
    seeMore: "查看更多",
    footer: "Every little moment matters.",
    cloudBackup: "Firestore + 浏览器备份",
    localBackup: "保存在此浏览器中",
    moods: {
      happy: "开心",
      calm: "平静",
      grateful: "感动",
      tired: "疲惫",
      sad: "低落",
    },
    weekdays: ["一", "二", "三", "四", "五", "六", "日"],
    dayUnit: "天",
  },
  "zh-TW": {
    description: "不一定要發生什麼大事。\n把今天的小小幸福留在這裡吧。",
    loading: "正在載入紀錄...",
    loadError: "無法讀取雲端紀錄。現在顯示瀏覽器中的紀錄。",
    savedCloud: "紀錄已儲存 🌿",
    savedLocal: "已儲存在此瀏覽器中。",
    saveError: "已儲存在本地，但雲端儲存失敗。",
    deleted: "紀錄已刪除。",
    deleteError: "雲端刪除失敗。",
    today: "今天",
    todayQuestion: "今天過得怎麼樣？",
    todayDescription: "即使是很小的事情，也值得記錄下來。",
    recordToday: "記錄今天",
    yourMonth: "YOUR MONTH",
    previousMonth: "上個月",
    nextMonth: "下個月",
    recordedMood: "有紀錄的日期會顯示當天的心情",
    selectedDate: "已選擇日期",
    journal: "YOUR LITTLE JOURNAL",
    journalDescription: "無論是什麼樣的心情，都值得被珍惜。",
    moodLabel: "今天的心情",
    highlightsLabel: "今天的小確幸",
    highlightsExample: "例如：喝了一杯好喝的咖啡。去了迪士尼。",
    highlightsPlaceholder: "今天有什麼小事讓你開心？",
    noteLabel: "自由記錄今天發生的事",
    noteDescription: "感受、想法，以及不想忘記的瞬間。",
    notePlaceholder: "寫下今天的事情...",
    saving: "正在儲存...",
    updateRecord: "更新紀錄",
    saveRecord: "儲存這一天的紀錄",
    delete: "刪除",
    confirmDelete: "確定要刪除這一天的紀錄嗎？",
    deleteButton: "刪除",
    cancel: "取消",
    monthReview: "A MONTH TO REMEMBER",
    monthReviewTitle: "月回顧",
    monthReviewDescription: "一個個小小的瞬間，累積起來就會成為珍貴的回憶。",
    recordedDays: "紀錄天數",
    memoryDays: "寫下回憶的天數",
    monthlyMood: "本月心情",
    searchTitle: "MEMORY SEARCH",
    searchHeading: "搜尋回憶",
    searchDescription: "透過關鍵字尋找地點、活動、美食和心情。",
    searchPlaceholder: "例如：迪士尼、旅行、茶、咖啡...",
    searchEmpty: "請輸入搜尋關鍵字。",
    searchNoResults: "沒有找到相關紀錄。",
    searchResults: "搜尋結果",
    resultCount: "筆結果",
    recentRecords: "最近的紀錄",
    noRecords: "這個月還沒有紀錄。",
    startWithToday: "從今天的小確幸開始記錄吧。",
    close: "收起",
    seeMore: "查看更多",
    footer: "Every little moment matters.",
    cloudBackup: "Firestore + 瀏覽器備份",
    localBackup: "保存在此瀏覽器中",
    moods: {
      happy: "開心",
      calm: "平靜",
      grateful: "感動",
      tired: "疲憊",
      sad: "低落",
    },
    weekdays: ["一", "二", "三", "四", "五", "六", "日"],
    dayUnit: "天",
  },
  es: {
    description: "No tiene que ser algo extraordinario.\nGuarda aquí las pequeñas alegrías de hoy.",
    loading: "Cargando recuerdos...",
    loadError: "No se pudieron cargar los registros de la nube. Se muestran los registros locales.",
    savedCloud: "Recuerdo guardado 🌿",
    savedLocal: "Guardado en este navegador.",
    saveError: "Guardado localmente, pero falló la nube.",
    deleted: "Recuerdo eliminado.",
    deleteError: "Falló la eliminación en la nube.",
    today: "Hoy",
    todayQuestion: "¿Qué tal ha sido tu día?",
    todayDescription: "Hasta las cosas más pequeñas merecen ser recordadas.",
    recordToday: "Registrar hoy",
    yourMonth: "YOUR MONTH",
    previousMonth: "Mes anterior",
    nextMonth: "Mes siguiente",
    recordedMood: "Los días registrados muestran tu estado de ánimo",
    selectedDate: "Fecha seleccionada",
    journal: "YOUR LITTLE JOURNAL",
    journalDescription: "Todos los sentimientos merecen ser aceptados.",
    moodLabel: "¿Cómo te sientes?",
    highlightsLabel: "La pequeña alegría de hoy",
    highlightsExample: "Por ejemplo: He tomado un café delicioso. He ido a Disneyland.",
    highlightsPlaceholder: "¿Qué pequeña cosa te ha alegrado el día?",
    noteLabel: "Escribe libremente sobre tu día",
    noteDescription: "Tus sentimientos, pensamientos y momentos que no quieres olvidar.",
    notePlaceholder: "Escribe sobre tu día...",
    saving: "Guardando...",
    updateRecord: "Actualizar recuerdo",
    saveRecord: "Guardar el recuerdo",
    delete: "Eliminar",
    confirmDelete: "¿Quieres eliminar este recuerdo?",
    deleteButton: "Eliminar",
    cancel: "Cancelar",
    monthReview: "A MONTH TO REMEMBER",
    monthReviewTitle: " – Resumen del mes",
    monthReviewDescription: "Muchos pequeños momentos juntos se convierten en recuerdos valiosos.",
    recordedDays: "Días registrados",
    memoryDays: "Días con recuerdos",
    monthlyMood: "Estado de ánimo del mes",
    searchTitle: "MEMORY SEARCH",
    searchHeading: "Buscar recuerdos",
    searchDescription: "Busca lugares, actividades, comida y sentimientos con palabras clave.",
    searchPlaceholder: "Por ejemplo: Disneyland, viaje, té, café...",
    searchEmpty: "Introduce una palabra para buscar.",
    searchNoResults: "No se encontraron recuerdos.",
    searchResults: "Resultados",
    resultCount: "resultados",
    recentRecords: "Recuerdos recientes",
    noRecords: "Todavía no hay recuerdos de este mes.",
    startWithToday: "Empieza con una pequeña alegría de hoy.",
    close: "Cerrar",
    seeMore: "Ver más",
    footer: "Every little moment matters.",
    cloudBackup: "Firestore + copia de seguridad del navegador",
    localBackup: "Guardado en este navegador",
    moods: {
      happy: "Feliz",
      calm: "Tranquilo",
      grateful: "Conmovido",
      tired: "Cansado",
      sad: "Decaído",
    },
    weekdays: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
    dayUnit: "días",
  },
} as const;

function formatDate(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatLongDate(date: string, language: Language) {
  return new Intl.DateTimeFormat(locales[language], {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date(`${date}T12:00:00`));
}

function getMood(id: Mood) {
  return moodDefinitions.find((item) => item.id === id) ?? moodDefinitions[1];
}

function isMoment(value: unknown): value is Moment {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;

  return (
    typeof item.date === "string" &&
    typeof item.highlights === "string" &&
    typeof item.note === "string" &&
    ["happy", "calm", "grateful", "tired", "sad"].includes(
      String(item.mood)
    )
  );
}

function loadLocal(): Moment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isMoment) : [];
  } catch {
    return [];
  }
}

function mergeEntries(...groups: Moment[][]): Moment[] {
  const map = new Map<string, Moment>();

  for (const group of groups) {
    for (const entry of group) {
      const previous = map.get(entry.date);
      if (
        !previous ||
        (entry.updatedAt || "") >= (previous.updatedAt || "")
      ) {
        map.set(entry.date, entry);
      }
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
}

// 新しい保存先：users/{uid}/littleMoments/data
function getLittleMomentsRef(uid: string) {
  return doc(db, "users", uid, "littleMoments", "data");
}

// 以前の保存先：littleMoments/{uid}
function getOldLittleMomentsRef(uid: string) {
  return doc(db, "littleMoments", uid);
}

export default function LittleMomentsPage() {
  const { language } = useAppLanguage();

  const currentLanguage: Language =
    language in translations ? (language as Language) : "ja";

  const t = translations[currentLanguage];

  const [today, setToday] = useState(() => formatDate(new Date()));
  const [currentMonth, setCurrentMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState(today);

  const [entries, setEntries] = useState<Moment[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [mood, setMood] = useState<Mood>("calm");
  const [highlights, setHighlights] = useState("");
  const [note, setNote] = useState("");

  const [search, setSearch] = useState("");
  const [showAllEntries, setShowAllEntries] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const moods = moodDefinitions.map((item) => ({
    ...item,
    label: t.moods[item.id],
  }));

  useEffect(() => {
    const updateToday = () => setToday(formatDate(new Date()));
    updateToday();

    const interval = window.setInterval(updateToday, 60000);
    return () => window.clearInterval(interval);
  }, []);

  // 記録を読み込む。新旧両方のFirestore保存先を確認する。
  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoaded(false);
      setUser(currentUser);
      setMessage("");

      try {
        const localEntries = loadLocal();
        let newCloudEntries: Moment[] = [];
        let oldCloudEntries: Moment[] = [];

        if (currentUser) {
          const [newSnapshot, oldSnapshot] = await Promise.all([
            getDoc(getLittleMomentsRef(currentUser.uid)),
            getDoc(getOldLittleMomentsRef(currentUser.uid)),
          ]);

          if (!active) return;

          if (newSnapshot.exists()) {
            const saved = newSnapshot.data().entries;
            if (Array.isArray(saved)) {
              newCloudEntries = saved.filter(isMoment);
            }
          }

          if (oldSnapshot.exists()) {
            const saved = oldSnapshot.data().entries;
            if (Array.isArray(saved)) {
              oldCloudEntries = saved.filter(isMoment);
            }
          }
        }

        if (!active) return;

        const merged = mergeEntries(
          localEntries,
          oldCloudEntries,
          newCloudEntries
        );

        setEntries(merged);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));

        // 新しい保存先へ統合データを保存
        if (currentUser && merged.length > 0) {
          await setDoc(
            getLittleMomentsRef(currentUser.uid),
            {
              entries: merged,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        }
      } catch (error) {
        console.error("Little Moments 読み込みエラー:", error);

        if (!active) return;

        setEntries(loadLocal());
        setMessage(t.loadError);
      } finally {
        if (active) setLoaded(true);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [t.loadError]);

  useEffect(() => {
    if (!loaded) return;

    const entry = entries.find((item) => item.date === selectedDate);

    setMood(entry?.mood ?? "calm");
    setHighlights(entry?.highlights ?? "");
    setNote(entry?.note ?? "");
    setConfirmDelete(false);
  }, [entries, selectedDate, loaded]);

  async function saveEntry() {
    if (!loaded || saving) return;

    if (!highlights.trim() && !note.trim()) {
      setMessage(
        currentLanguage === "ja"
          ? "小さな幸せや今日のことを、ひとつ書いてみてね。"
          : "Please write something before saving."
      );
      return;
    }

    const entry: Moment = {
      date: selectedDate,
      mood,
      highlights: highlights.trim(),
      note: note.trim(),
      updatedAt: new Date().toISOString(),
    };

    const newEntries = mergeEntries(
      entries.filter((item) => item.date !== selectedDate),
      [entry]
    );

    setSaving(true);
    setMessage("");

    // まずブラウザに保存。クラウドが失敗しても記録を失わない。
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newEntries));
    setEntries(newEntries);

    try {
      if (user) {
        await setDoc(
          getLittleMomentsRef(user.uid),
          {
            entries: newEntries,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
        setMessage(t.savedCloud);
      } else {
        setMessage(t.savedLocal);
      }

      setConfirmDelete(false);
    } catch (error) {
      console.error("Little Moments 保存エラー:", error);
      setMessage(t.saveError);
    } finally {
      setSaving(false);
    }
  }

  async function deleteEntry() {
    if (!loaded || saving) return;

    const newEntries = entries.filter(
      (item) => item.date !== selectedDate
    );

    setSaving(true);
    setMessage("");

    localStorage.setItem(STORAGE_KEY, JSON.stringify(newEntries));
    setEntries(newEntries);

    try {
      if (user) {
        await setDoc(
          getLittleMomentsRef(user.uid),
          {
            entries: newEntries,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }

      setMood("calm");
      setHighlights("");
      setNote("");
      setConfirmDelete(false);
      setMessage(t.deleted);
    } catch (error) {
      console.error("Little Moments 削除エラー:", error);
      setMessage(t.deleteError);
    } finally {
      setSaving(false);
    }
  }

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const calendarCells = useMemo(() => {
    const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
    const days = new Date(year, month + 1, 0).getDate();

    const cells: (string | null)[] = [
      ...Array.from({ length: firstDay }, () => null),
      ...Array.from({ length: days }, (_, index) =>
        formatDate(new Date(year, month, index + 1))
      ),
    ];

    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [year, month]);

  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;

  const monthEntries = entries
    .filter((entry) => entry.date.startsWith(monthPrefix))
    .sort((a, b) => b.date.localeCompare(a.date));

  const selectedEntry = entries.find(
    (entry) => entry.date === selectedDate
  );

  // 日付・幸せの内容・日記本文をまとめて検索
  const searchResults = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase();
    if (!keyword) return [];

    return entries
      .filter((entry) => {
        const searchable = [
          entry.date,
          entry.highlights,
          entry.note,
          t.moods[entry.mood],
        ]
          .join(" ")
          .toLocaleLowerCase();

        return searchable.includes(keyword);
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [entries, search, t.moods]);

  const recordedDays = monthEntries.filter(
    (entry) => entry.highlights.trim() || entry.note.trim()
  ).length;

  const moodCounts = moods.map((item) => ({
    ...item,
    count: monthEntries.filter((entry) => entry.mood === item.id).length,
  }));

  const favoriteMood = [...moodCounts]
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)[0];

  const monthTitle = new Intl.DateTimeFormat(locales[currentLanguage], {
    year: "numeric",
    month: "long",
  }).format(currentMonth);

  const panel =
    "rounded-3xl border border-[#e7e8e3] bg-white p-5 shadow-[0_4px_20px_rgba(35,45,35,0.035)] sm:p-7";

  const secondaryButton =
    "rounded-xl border border-[#e4e6df] bg-white px-4 py-2.5 text-sm font-medium text-[#596657] transition hover:bg-[#f5f7f2]";

  const primaryButton =
    "rounded-xl bg-[var(--anki-theme-color)] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--anki-theme-dark)] disabled:cursor-not-allowed disabled:opacity-50";

  function openEntry(date: string) {
    setSelectedDate(date);
    setCurrentMonth(
      new Date(
        Number(date.slice(0, 4)),
        Number(date.slice(5, 7)) - 1,
        1
      )
    );
    setMessage("");
    document
      .getElementById("little-journal")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <main className="min-h-screen bg-[#f7f8f6] px-4 pb-12 pt-7 text-[#343b35] sm:px-7 sm:pt-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#92998e]">
            A COLLECTION OF LITTLE JOYS
          </p>
          <div className="mt-3 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-medium tracking-tight text-[var(--anki-theme-dark)] sm:text-5xl">
                Little Moments
              </h1>
              <p className="mt-4 max-w-xl whitespace-pre-line text-sm leading-7 text-[#777f76] sm:text-base">
                {t.description}
              </p>
            </div>
            <div className="hidden h-16 w-16 items-center justify-center rounded-full bg-[#edf2eb] text-3xl sm:flex">
              🌿
            </div>
          </div>
        </header>

        {message && (
          <p
            role="status"
            className="mb-5 rounded-xl border border-[#dce6d9] bg-[#eef4eb] p-4 text-sm leading-6 text-[#536b54]"
          >
            {message}
          </p>
        )}

        {!loaded && (
          <div className={`${panel} mb-6 text-sm text-[#798273]`}>
            {t.loading}
          </div>
        )}

        {/* 今日の記録 */}
        <section className={`${panel} mb-6`}>
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-medium tracking-[0.18em] text-[#9a9f92]">
                A MOMENT FOR YOURSELF
              </p>
              <h2 className="mt-2 text-2xl font-medium text-[var(--anki-theme-dark)]">
                {formatLongDate(today, currentLanguage)}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#858b80]">
                {t.todayQuestion}
                <br />
                {t.todayDescription}
              </p>
            </div>
            <button
              type="button"
              onClick={() => openEntry(today)}
              className="self-start rounded-full bg-[var(--anki-theme-light)] px-5 py-3 text-sm font-medium text-[var(--anki-theme-dark)] transition hover:bg-[var(--anki-theme-soft)] sm:self-center"
            >
              {t.recordToday} ↗
            </button>
          </div>
        </section>

        {/* 思い出検索 */}
        <section className={`${panel} mb-6`}>
          <div>
            <p className="text-[11px] font-semibold tracking-[0.2em] text-[#9a9f92]">
              {t.searchTitle}
            </p>
            <h2 className="mt-2 text-2xl font-medium text-[var(--anki-theme-dark)]">
              {t.searchHeading}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#858b80]">
              {t.searchDescription}
            </p>
          </div>

          <div className="relative mt-5">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-[#92998e]">
              ⌕
            </span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full rounded-2xl border border-[#e4e7df] bg-[#f8f9f7] py-4 pl-12 pr-12 text-sm text-[#414a40] outline-none transition placeholder:text-[#a4aaa0] focus:border-[var(--anki-theme-color)] focus:bg-white focus:ring-2 focus:ring-[var(--anki-theme-light)]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-lg text-[#92998e] hover:text-[#414a40]"
              >
                ×
              </button>
            )}
          </div>

          {search.trim() ? (
            <div className="mt-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium text-[#596657]">
                  {t.searchResults}
                </h3>
                <span className="text-xs text-[#92998e]">
                  {searchResults.length} {t.resultCount}
                </span>
              </div>

              {searchResults.length === 0 ? (
                <div className="rounded-2xl bg-[#f8f9f7] px-5 py-8 text-center text-sm text-[#858b80]">
                  {t.searchNoResults}
                </div>
              ) : (
                <div className="divide-y divide-[#edf0e9]">
                  {searchResults.map((entry) => {
                    const entryMood = getMood(entry.mood);

                    return (
                      <button
                        key={entry.date}
                        type="button"
                        onClick={() => openEntry(entry.date)}
                        className="flex w-full items-start gap-3 rounded-xl px-2 py-4 text-left transition hover:bg-[#f8f9f7]"
                      >
                        <span
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl"
                          style={{ background: entryMood.background }}
                        >
                          {entryMood.emoji}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs text-[#92998e]">
                            {formatLongDate(entry.date, currentLanguage)}
                          </span>
                          <span className="mt-1 block text-sm font-medium text-[#465346]">
                            {entry.highlights ||
                              entry.note ||
                              t.moods[entry.mood]}
                          </span>
                          {entry.highlights && entry.note && (
                            <span className="mt-1 block text-xs leading-5 text-[#92998e]">
                              {entry.note}
                            </span>
                          )}
                        </span>
                        <span className="pt-2 text-[#a5aca1]">›</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <p className="mt-4 text-xs text-[#a0a69c]">
              {t.searchEmpty}
            </p>
          )}
        </section>

        {/* カレンダー */}
        <section className={`${panel} mb-6`}>
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.2em] text-[#9a9f92]">
                {t.yourMonth}
              </p>
              <h2 className="mt-1 text-2xl font-medium tracking-tight text-[var(--anki-theme-dark)]">
                {monthTitle}
              </h2>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                aria-label={t.previousMonth}
                onClick={() =>
                  setCurrentMonth(
                    (current) =>
                      new Date(
                        current.getFullYear(),
                        current.getMonth() - 1,
                        1
                      )
                  )
                }
                className={secondaryButton}
              >
                ←
              </button>
              <button
                type="button"
                aria-label={t.nextMonth}
                onClick={() =>
                  setCurrentMonth(
                    (current) =>
                      new Date(
                        current.getFullYear(),
                        current.getMonth() + 1,
                        1
                      )
                  )
                }
                className={secondaryButton}
              >
                →
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {t.weekdays.map((day, index) => (
              <div
                key={day}
                className={`py-2 text-center text-xs font-medium ${
                  index === 5
                    ? "text-[#7995a2]"
                    : index === 6
                      ? "text-[#c18c8e]"
                      : "text-[#aaa797]"
                }`}
              >
                {day}
              </div>
            ))}

            {calendarCells.map((date, index) => {
              const entry = date
                ? entries.find((item) => item.date === date)
                : undefined;

              const isSelected = date === selectedDate;
              const isToday = date === today;

              return (
                <button
                  key={date ?? `blank-${index}`}
                  type="button"
                  disabled={!date || !loaded}
                  onClick={() => date && setSelectedDate(date)}
                  aria-pressed={isSelected}
                  className={`flex min-h-[58px] min-w-0 flex-col items-center justify-center gap-1 rounded-xl border text-sm transition sm:min-h-[76px] ${
                    !date
                      ? "border-transparent bg-transparent"
                      : isSelected
                        ? "border-[var(--anki-theme-color)] bg-[var(--anki-theme-light)] text-[var(--anki-theme-dark)]"
                        : isToday
                          ? "border-[#d8b4a9] bg-[#fcf1ed] text-[#6c5b50]"
                          : "border-transparent bg-[#f8f9f7] text-[#62675c] hover:border-[var(--anki-theme-soft)] hover:bg-[var(--anki-theme-light)]"
                  }`}
                >
                  {date && (
                    <>
                      <span className={isToday ? "font-bold" : "font-medium"}>
                        {Number(date.slice(-2))}
                      </span>
                      <span className="text-base leading-none sm:text-lg">
                        {entry ? getMood(entry.mood).emoji : ""}
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-[#969585]">
            <span>{t.recordedMood}</span>
            <span>
              {t.selectedDate}: {selectedDate}
            </span>
          </div>
        </section>

        {/* 日記入力 */}
        <section id="little-journal" className={`${panel} mb-6 scroll-mt-6`}>
          <div>
            <p className="text-[11px] font-semibold tracking-[0.2em] text-[#9a9f92]">
              {t.journal}
            </p>
            <h2 className="mt-2 text-xl font-medium text-[var(--anki-theme-dark)]">
              {formatLongDate(selectedDate, currentLanguage)}
            </h2>
            <p className="mt-2 text-sm text-[#89897b]">
              {t.journalDescription}
            </p>
          </div>

          <div className="mt-7">
            <label className="mb-3 block text-sm font-medium text-[var(--anki-theme-dark)]">
              {t.moodLabel}
            </label>
            <div className="grid grid-cols-5 gap-2">
              {moods.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMood(item.id)}
                  aria-pressed={mood === item.id}
                  className={`flex flex-col items-center gap-2 rounded-2xl border p-2 py-4 transition sm:py-5 ${
                    mood === item.id
                      ? "border-[var(--anki-theme-color)] shadow-sm"
                      : "border-[#e8eae4] bg-white hover:bg-[#f8f9f7]"
                  }`}
                  style={{
                    background: mood === item.id ? item.background : undefined,
                  }}
                >
                  <span className="text-2xl sm:text-3xl">{item.emoji}</span>
                  <span
                    className="text-[10px] font-medium sm:text-xs"
                    style={{
                      color: mood === item.id ? item.color : "#8d8c7e",
                    }}
                  >
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-7">
            <label
              htmlFor="highlights"
              className="block text-sm font-medium text-[var(--anki-theme-dark)]"
            >
              {t.highlightsLabel}
            </label>
            <p className="mt-1 text-xs leading-5 text-[#999787]">
              {t.highlightsExample}
            </p>
            <textarea
              id="highlights"
              value={highlights}
              onChange={(event) => setHighlights(event.target.value)}
              placeholder={t.highlightsPlaceholder}
              rows={3}
              className="mt-3 w-full resize-y rounded-2xl border border-[#e4e7df] bg-[#f8f9f7] p-4 text-sm leading-7 text-[#424a40] outline-none transition placeholder:text-[#a4aaa0] focus:border-[var(--anki-theme-color)] focus:bg-white focus:ring-2 focus:ring-[var(--anki-theme-light)]"
            />
          </div>

          <div className="mt-6">
            <label
              htmlFor="note"
              className="block text-sm font-medium text-[var(--anki-theme-dark)]"
            >
              {t.noteLabel}
            </label>
            <p className="mt-1 text-xs leading-5 text-[#999787]">
              {t.noteDescription}
            </p>
            <textarea
              id="note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={t.notePlaceholder}
              rows={5}
              className="mt-3 w-full resize-y rounded-2xl border border-[#e4e7df] bg-[#f8f9f7] p-4 text-sm leading-7 text-[#424a40] outline-none transition placeholder:text-[#a4aaa0] focus:border-[var(--anki-theme-color)] focus:bg-white focus:ring-2 focus:ring-[var(--anki-theme-light)]"
            />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={saveEntry}
              disabled={!loaded || saving}
              className={primaryButton}
            >
              {saving
                ? t.saving
                : selectedEntry
                  ? t.updateRecord
                  : t.saveRecord}
              {" ↗"}
            </button>

            {selectedEntry && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                disabled={saving}
                className="rounded-xl px-4 py-3 text-sm text-[#a27d78] transition hover:bg-[#fbefeb]"
              >
                {t.delete}
              </button>
            )}
          </div>

          {confirmDelete && (
            <div className="mt-4 rounded-xl border border-[#ead8d0] bg-[#fcf3ee] p-4">
              <p className="text-sm text-[#825b51]">
                {t.confirmDelete}
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={deleteEntry}
                  disabled={saving}
                  className="rounded-lg bg-[#a66f65] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {t.deleteButton}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className={secondaryButton}
                >
                  {t.cancel}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* 月間振り返り */}
        <section className={`${panel} mb-6`}>
          <p className="text-[11px] font-semibold tracking-[0.2em] text-[#9a9f92]">
            {t.monthReview}
          </p>
          <h2 className="mt-2 text-xl font-medium text-[var(--anki-theme-dark)]">
            {monthTitle}
            {t.monthReviewTitle}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#89897b]">
            {t.monthReviewDescription}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-[var(--anki-theme-light)] p-4">
              <p className="text-xs text-[var(--anki-theme-dark)]">
                {t.recordedDays}
              </p>
              <p className="mt-2 text-3xl font-medium text-[var(--anki-theme-dark)]">
                {monthEntries.length}
                <span className="ml-1 text-sm">{t.dayUnit}</span>
              </p>
            </div>

            <div className="rounded-2xl bg-[#f8e9e9] p-4">
              <p className="text-xs text-[#a77f83]">{t.monthlyMood}</p>
              <p className="mt-2 text-2xl">
                {favoriteMood?.emoji ?? "🌷"}
              </p>
              <p className="mt-1 text-sm text-[#926f72]">
                {favoriteMood?.label ?? "—"}
              </p>
            </div>

            <div className="col-span-2 rounded-2xl bg-[#f6f0e2] p-4 sm:col-span-1">
              <p className="text-xs text-[#9b8b69]">{t.memoryDays}</p>
              <p className="mt-2 text-3xl font-medium text-[#82734f]">
                {recordedDays}
                <span className="ml-1 text-sm">{t.dayUnit}</span>
              </p>
            </div>
          </div>

          {monthEntries.length > 0 && (
            <div className="mt-5 border-t border-[#eeeadd] pt-5">
              <div className="flex flex-wrap gap-2">
                {moodCounts
                  .filter((item) => item.count > 0)
                  .map((item) => (
                    <span
                      key={item.id}
                      className="rounded-full px-3 py-2 text-xs"
                      style={{
                        color: item.color,
                        background: item.background,
                      }}
                    >
                      {item.emoji} {item.label} · {item.count}
                    </span>
                  ))}
              </div>
            </div>
          )}
        </section>

        {/* 最近の記録 */}
        <section className={`${panel} mb-7`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.2em] text-[#9a9f92]">
                LITTLE MEMORIES
              </p>
              <h2 className="mt-2 text-xl font-medium text-[var(--anki-theme-dark)]">
                {t.recentRecords}
              </h2>
            </div>

            {monthEntries.length > 0 && (
              <button
                type="button"
                onClick={() => setShowAllEntries((current) => !current)}
                className="text-sm text-[var(--anki-theme-color)] hover:text-[var(--anki-theme-dark)]"
              >
                {showAllEntries ? t.close : t.seeMore}
              </button>
            )}
          </div>

          {monthEntries.length === 0 ? (
            <div className="mt-6 rounded-2xl bg-[#f8f9f7] px-5 py-8 text-center">
              <p className="text-3xl">🌼</p>
              <p className="mt-3 text-sm text-[#73796c]">
                {t.noRecords}
              </p>
              <p className="mt-2 text-xs leading-6 text-[#a19f90]">
                {t.startWithToday}
              </p>
            </div>
          ) : (
            <div className="mt-5 divide-y divide-[#edf0e9]">
              {(showAllEntries
                ? monthEntries
                : monthEntries.slice(0, 3)
              ).map((entry) => {
                const entryMood = getMood(entry.mood);

                return (
                  <button
                    key={entry.date}
                    type="button"
                    onClick={() => openEntry(entry.date)}
                    className="flex w-full items-start gap-3 rounded-xl py-4 text-left transition hover:bg-[#f8f9f7]"
                  >
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl"
                      style={{ background: entryMood.background }}
                    >
                      {entryMood.emoji}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs text-[#9b9a89]">
                        {formatLongDate(entry.date, currentLanguage)}
                      </span>
                      <span className="mt-1 block truncate text-sm font-medium text-[var(--anki-theme-dark)]">
                        {entry.highlights ||
                          entry.note ||
                          t.moods[entry.mood]}
                      </span>
                      {entry.highlights && entry.note && (
                        <span className="mt-1 block truncate text-xs text-[#999787]">
                          {entry.note}
                        </span>
                      )}
                    </span>
                    <span className="pt-1 text-[#b1b09e]">›</span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <footer className="pb-5 text-center">
          <p className="text-sm text-[#87907d]">{t.footer}</p>
          <p className="mt-3 text-xs text-[#aaa895]">
            {!loaded
              ? t.loading
              : saving
                ? t.saving
                : user
                  ? t.cloudBackup
                  : t.localBackup}
          </p>
          <Link
            href="/"
            className="mt-5 inline-block text-xs text-[var(--anki-theme-color)] hover:text-[var(--anki-theme-dark)]"
          >
            ← Anki home
          </Link>
        </footer>
      </div>
    </main>
  );
}
