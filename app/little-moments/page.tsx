"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { doc, getDoc, setDoc } from "firebase/firestore";
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

const translations = {
  ja: {
    eyebrow: "A collection of little joys",
    description: "大きな出来事じゃなくてもいい。\n今日の小さな幸せを、ここに残そう。",
    loading: "🌿 記録を読み込んでいます...",
    loadError: "クラウドの記録を読み込めませんでした。ブラウザのバックアップを表示しています。",
    savedCloud: "記録を保存しました 🌿",
    savedLocal: "このブラウザに記録を保存しました 🌿",
    saveError: "ブラウザには記録を保存しました。クラウド保存に失敗した可能性があるため、Firebaseの設定を確認してください。",
    deleted: "記録を削除しました。",
    deleteError: "ブラウザ側は更新しましたが、クラウド側の更新に失敗した可能性があります。",
    momentForYourself: "A MOMENT FOR YOURSELF",
    todayQuestion: "今日はどんな一日だった？",
    todayDescription: "ほんの小さなことでも、書き留めておこう。",
    recordToday: "今日を記録する ↗",
    yourMonth: "YOUR MONTH",
    previousMonth: "前月",
    nextMonth: "翌月",
    recordedMood: "🌿 記録した日には気分が表示されるよ",
    selectedDate: "選んだ日",
    yourJournal: "YOUR LITTLE JOURNAL",
    journalDescription: "どんな気持ちも、そのまま大切に。",
    moodLabel: "今日の気分",
    highlightsLabel: "✿ 今日の小さな幸せ",
    highlightsExample: "例：おいしいコーヒーを飲んだ。面白いアイデアが浮かんだ。",
    highlightsPlaceholder: "今日、心がちょっと嬉しくなったことは？",
    noteLabel: "今日のこと、自由に書こう",
    noteDescription: "感じたこと、考えたこと、忘れたくない瞬間。",
    notePlaceholder: "Dear diary...",
    saving: "保存中...",
    updateRecord: "記録を更新する ↗",
    saveRecord: "この日の記録を保存する ↗",
    delete: "削除",
    confirmDelete: "の記録を削除しますか？",
    deleteButton: "削除する",
    cancel: "キャンセル",
    monthReview: "A MONTH TO REMEMBER",
    monthReviewTitle: "の振り返り",
    monthReviewDescription: "小さな瞬間も、集まれば大切な思い出になる。",
    recordedDays: "記録した日",
    monthlyMood: "今月の気分",
    memoryDays: "思い出を書いた日",
    startRecording: "これから記録しよう",
    monthlyMoodSummary: "今月の気分",
    littleMemories: "LITTLE MEMORIES",
    recentRecords: "最近の記録",
    close: "閉じる ↑",
    seeMore: "もっと見る ↓",
    noRecords: "この月の記録はまだありません。",
    startWithToday: "今日の小さな幸せから、始めてみよう。",
    moodRecordedDay: "気分を記録した日",
    footer: "Every little moment matters.",
    loadingFooter: "記録を読み込み中...",
    cloudBackup: "☁️ Firestore ＋ ブラウザにバックアップ",
    localBackup: "🌿 このブラウザに保存",
    moods: {
      happy: "嬉しい",
      calm: "穏やか",
      grateful: "感動",
      tired: "疲れた",
      sad: "落ち込み",
    },
    weekdays: ["月", "火", "水", "木", "金", "土", "日"],
  },

  de: {
    eyebrow: "A collection of little joys",
    description: "Es müssen keine großen Ereignisse sein.\nHalte hier die kleinen Glücksmomente des Tages fest.",
    loading: "🌿 Deine Einträge werden geladen...",
    loadError: "Die Einträge aus der Cloud konnten nicht geladen werden. Es wird das lokale Backup angezeigt.",
    savedCloud: "Dein Eintrag wurde gespeichert 🌿",
    savedLocal: "Dein Eintrag wurde in diesem Browser gespeichert 🌿",
    saveError: "Der Eintrag wurde im Browser gespeichert. Die Cloud-Speicherung ist möglicherweise fehlgeschlagen. Bitte überprüfe deine Firebase-Einstellungen.",
    deleted: "Der Eintrag wurde gelöscht.",
    deleteError: "Der Browser wurde aktualisiert, aber die Aktualisierung in der Cloud ist möglicherweise fehlgeschlagen.",
    momentForYourself: "A MOMENT FOR YOURSELF",
    todayQuestion: "Wie war dein Tag heute?",
    todayDescription: "Auch die kleinsten Dinge sind es wert, festgehalten zu werden.",
    recordToday: "Heute festhalten ↗",
    yourMonth: "YOUR MONTH",
    previousMonth: "Vorheriger Monat",
    nextMonth: "Nächster Monat",
    recordedMood: "🌿 An Tagen mit Einträgen wird deine Stimmung angezeigt",
    selectedDate: "Ausgewählter Tag",
    yourJournal: "YOUR LITTLE JOURNAL",
    journalDescription: "Jedes Gefühl darf genauso sein, wie es ist.",
    moodLabel: "Wie fühlst du dich heute?",
    highlightsLabel: "✿ Dein kleiner Glücksmoment",
    highlightsExample: "Zum Beispiel: Einen leckeren Kaffee getrunken. Eine interessante Idee gehabt.",
    highlightsPlaceholder: "Was hat dir heute ein kleines Lächeln geschenkt?",
    noteLabel: "Schreib frei über deinen Tag",
    noteDescription: "Deine Gefühle, Gedanken und Momente, die du nicht vergessen möchtest.",
    notePlaceholder: "Liebes Tagebuch...",
    saving: "Wird gespeichert...",
    updateRecord: "Eintrag aktualisieren ↗",
    saveRecord: "Eintrag für diesen Tag speichern ↗",
    delete: "Löschen",
    confirmDelete: "Möchtest du den Eintrag vom folgenden Tag löschen?",
    deleteButton: "Löschen",
    cancel: "Abbrechen",
    monthReview: "A MONTH TO REMEMBER",
    monthReviewTitle: " – Monatsrückblick",
    monthReviewDescription: "Viele kleine Momente werden zusammen zu wertvollen Erinnerungen.",
    recordedDays: "Tage mit Einträgen",
    monthlyMood: "Stimmung des Monats",
    memoryDays: "Tage mit Erinnerungen",
    startRecording: "Beginne, deine Momente festzuhalten",
    monthlyMoodSummary: "Stimmungen in diesem Monat",
    littleMemories: "LITTLE MEMORIES",
    recentRecords: "Letzte Einträge",
    close: "Schließen ↑",
    seeMore: "Mehr anzeigen ↓",
    noRecords: "Für diesen Monat gibt es noch keine Einträge.",
    startWithToday: "Beginne mit einem kleinen Glücksmoment von heute.",
    moodRecordedDay: "Ein Tag mit festgehaltener Stimmung",
    footer: "Every little moment matters.",
    loadingFooter: "Einträge werden geladen...",
    cloudBackup: "☁️ Firestore + Browser-Backup",
    localBackup: "🌿 In diesem Browser gespeichert",
    moods: {
      happy: "Glücklich",
      calm: "Gelassen",
      grateful: "Berührt",
      tired: "Müde",
      sad: "Niedergeschlagen",
    },
    weekdays: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"],
  },

  en: {
    eyebrow: "A collection of little joys",
    description: "It doesn't have to be something big.\nSave today's little moments of happiness here.",
    loading: "🌿 Loading your memories...",
    loadError: "Couldn't load your cloud records. Showing the backup saved in this browser.",
    savedCloud: "Your memory has been saved 🌿",
    savedLocal: "Your memory has been saved in this browser 🌿",
    saveError: "Your memory was saved in this browser, but cloud saving may have failed. Please check your Firebase settings.",
    deleted: "Your memory has been deleted.",
    deleteError: "Your browser data was updated, but the cloud update may have failed.",
    momentForYourself: "A MOMENT FOR YOURSELF",
    todayQuestion: "How was your day?",
    todayDescription: "Even the smallest things are worth remembering.",
    recordToday: "Record today ↗",
    yourMonth: "YOUR MONTH",
    previousMonth: "Previous month",
    nextMonth: "Next month",
    recordedMood: "🌿 Your mood appears on days with saved memories",
    selectedDate: "Selected date",
    yourJournal: "YOUR LITTLE JOURNAL",
    journalDescription: "Every feeling deserves to be accepted as it is.",
    moodLabel: "How are you feeling today?",
    highlightsLabel: "✿ Today's little joy",
    highlightsExample: "For example: Had a delicious coffee. Came up with an interesting idea.",
    highlightsPlaceholder: "What made your heart a little happier today?",
    noteLabel: "Write freely about your day",
    noteDescription: "Your feelings, thoughts, and moments you don't want to forget.",
    notePlaceholder: "Dear diary...",
    saving: "Saving...",
    updateRecord: "Update memory ↗",
    saveRecord: "Save this day's memory ↗",
    delete: "Delete",
    confirmDelete: "Would you like to delete the memory for",
    deleteButton: "Delete",
    cancel: "Cancel",
    monthReview: "A MONTH TO REMEMBER",
    monthReviewTitle: " – Monthly reflection",
    monthReviewDescription: "Little moments become precious memories when they come together.",
    recordedDays: "Days recorded",
    monthlyMood: "Mood of the month",
    memoryDays: "Days with written memories",
    startRecording: "Start recording your moments",
    monthlyMoodSummary: "Moods this month",
    littleMemories: "LITTLE MEMORIES",
    recentRecords: "Recent memories",
    close: "Close ↑",
    seeMore: "See more ↓",
    noRecords: "There are no memories recorded for this month yet.",
    startWithToday: "Start with one little joy from today.",
    moodRecordedDay: "A day with a recorded mood",
    footer: "Every little moment matters.",
    loadingFooter: "Loading memories...",
    cloudBackup: "☁️ Firestore + browser backup",
    localBackup: "🌿 Saved in this browser",
    moods: {
      happy: "Happy",
      calm: "Calm",
      grateful: "Touched",
      tired: "Tired",
      sad: "Down",
    },
    weekdays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  },

  "zh-CN": {
    eyebrow: "A collection of little joys",
    description: "不一定要发生什么大事。\n把今天的小小幸福留在这里吧。",
    loading: "🌿 正在加载记录...",
    loadError: "无法读取云端记录。现在显示的是保存在浏览器中的备份。",
    savedCloud: "记录已保存 🌿",
    savedLocal: "记录已保存在此浏览器中 🌿",
    saveError: "记录已保存在浏览器中，但云端保存可能失败了。请检查 Firebase 设置。",
    deleted: "记录已删除。",
    deleteError: "浏览器中的记录已更新，但云端更新可能失败了。",
    momentForYourself: "A MOMENT FOR YOURSELF",
    todayQuestion: "今天过得怎么样？",
    todayDescription: "即使是很小的事情，也值得记录下来。",
    recordToday: "记录今天 ↗",
    yourMonth: "YOUR MONTH",
    previousMonth: "上个月",
    nextMonth: "下个月",
    recordedMood: "🌿 有记录的日期会显示当天的心情",
    selectedDate: "已选择日期",
    yourJournal: "YOUR LITTLE JOURNAL",
    journalDescription: "无论是什么样的心情，都值得被珍惜。",
    moodLabel: "今天的心情",
    highlightsLabel: "✿ 今天的小确幸",
    highlightsExample: "例如：喝了一杯好喝的咖啡。突然想到了一个有趣的点子。",
    highlightsPlaceholder: "今天有什么小事让你的心情变好了？",
    noteLabel: "自由记录今天发生的事",
    noteDescription: "你的感受、想法，以及不想忘记的瞬间。",
    notePlaceholder: "亲爱的日记……",
    saving: "正在保存...",
    updateRecord: "更新记录 ↗",
    saveRecord: "保存这一天的记录 ↗",
    delete: "删除",
    confirmDelete: "确定要删除这一天的记录吗？",
    deleteButton: "删除",
    cancel: "取消",
    monthReview: "A MONTH TO REMEMBER",
    monthReviewTitle: "月回顾",
    monthReviewDescription: "一个个小小的瞬间，汇聚起来就会成为珍贵的回忆。",
    recordedDays: "记录天数",
    monthlyMood: "本月心情",
    memoryDays: "写下回忆的天数",
    startRecording: "从现在开始记录吧",
    monthlyMoodSummary: "本月的心情",
    littleMemories: "LITTLE MEMORIES",
    recentRecords: "最近的记录",
    close: "收起 ↑",
    seeMore: "查看更多 ↓",
    noRecords: "这个月还没有记录。",
    startWithToday: "从今天的小确幸开始记录吧。",
    moodRecordedDay: "记录了心情的一天",
    footer: "Every little moment matters.",
    loadingFooter: "正在加载记录...",
    cloudBackup: "☁️ Firestore ＋ 浏览器备份",
    localBackup: "🌿 保存在此浏览器中",
    moods: {
      happy: "开心",
      calm: "平静",
      grateful: "感动",
      tired: "疲惫",
      sad: "低落",
    },
    weekdays: ["一", "二", "三", "四", "五", "六", "日"],
  },

  "zh-TW": {
    eyebrow: "A collection of little joys",
    description: "不一定要發生什麼大事。\n把今天的小小幸福留在這裡吧。",
    loading: "🌿 正在載入紀錄...",
    loadError: "無法讀取雲端紀錄。現在顯示的是保存在瀏覽器中的備份。",
    savedCloud: "紀錄已儲存 🌿",
    savedLocal: "紀錄已儲存在此瀏覽器中 🌿",
    saveError: "紀錄已儲存在瀏覽器中，但雲端儲存可能失敗了。請檢查 Firebase 設定。",
    deleted: "紀錄已刪除。",
    deleteError: "瀏覽器中的紀錄已更新，但雲端更新可能失敗了。",
    momentForYourself: "A MOMENT FOR YOURSELF",
    todayQuestion: "今天過得怎麼樣？",
    todayDescription: "即使是很小的事情，也值得記錄下來。",
    recordToday: "記錄今天 ↗",
    yourMonth: "YOUR MONTH",
    previousMonth: "上個月",
    nextMonth: "下個月",
    recordedMood: "🌿 有紀錄的日期會顯示當天的心情",
    selectedDate: "已選擇日期",
    yourJournal: "YOUR LITTLE JOURNAL",
    journalDescription: "無論是什麼樣的心情，都值得被珍惜。",
    moodLabel: "今天的心情",
    highlightsLabel: "✿ 今天的小確幸",
    highlightsExample: "例如：喝了一杯好喝的咖啡。突然想到了一個有趣的點子。",
    highlightsPlaceholder: "今天有什麼小事讓你的心情變好了？",
    noteLabel: "自由記錄今天發生的事",
    noteDescription: "你的感受、想法，以及不想忘記的瞬間。",
    notePlaceholder: "親愛的日記……",
    saving: "正在儲存...",
    updateRecord: "更新紀錄 ↗",
    saveRecord: "儲存這一天的紀錄 ↗",
    delete: "刪除",
    confirmDelete: "確定要刪除這一天的紀錄嗎？",
    deleteButton: "刪除",
    cancel: "取消",
    monthReview: "A MONTH TO REMEMBER",
    monthReviewTitle: "月回顧",
    monthReviewDescription: "一個個小小的瞬間，累積起來就會成為珍貴的回憶。",
    recordedDays: "紀錄天數",
    monthlyMood: "本月心情",
    memoryDays: "寫下回憶的天數",
    startRecording: "從現在開始記錄吧",
    monthlyMoodSummary: "本月的心情",
    littleMemories: "LITTLE MEMORIES",
    recentRecords: "最近的紀錄",
    close: "收起 ↑",
    seeMore: "查看更多 ↓",
    noRecords: "這個月還沒有紀錄。",
    startWithToday: "從今天的小確幸開始記錄吧。",
    moodRecordedDay: "記錄了心情的一天",
    footer: "Every little moment matters.",
    loadingFooter: "正在載入紀錄...",
    cloudBackup: "☁️ Firestore ＋ 瀏覽器備份",
    localBackup: "🌿 保存在此瀏覽器中",
    moods: {
      happy: "開心",
      calm: "平靜",
      grateful: "感動",
      tired: "疲憊",
      sad: "低落",
    },
    weekdays: ["一", "二", "三", "四", "五", "六", "日"],
  },

  es: {
    eyebrow: "A collection of little joys",
    description: "No tiene que ser algo extraordinario.\nGuarda aquí las pequeñas alegrías de hoy.",
    loading: "🌿 Cargando tus recuerdos...",
    loadError: "No se pudieron cargar los registros de la nube. Se muestra la copia de seguridad del navegador.",
    savedCloud: "Tu recuerdo se ha guardado 🌿",
    savedLocal: "Tu recuerdo se ha guardado en este navegador 🌿",
    saveError: "El recuerdo se ha guardado en el navegador, pero es posible que haya fallado el guardado en la nube. Comprueba la configuración de Firebase.",
    deleted: "El recuerdo se ha eliminado.",
    deleteError: "Se han actualizado los datos del navegador, pero es posible que haya fallado la actualización en la nube.",
    momentForYourself: "A MOMENT FOR YOURSELF",
    todayQuestion: "¿Qué tal ha sido tu día?",
    todayDescription: "Hasta las cosas más pequeñas merecen ser recordadas.",
    recordToday: "Registrar hoy ↗",
    yourMonth: "YOUR MONTH",
    previousMonth: "Mes anterior",
    nextMonth: "Mes siguiente",
    recordedMood: "🌿 Los días con recuerdos muestran el estado de ánimo",
    selectedDate: "Fecha seleccionada",
    yourJournal: "YOUR LITTLE JOURNAL",
    journalDescription: "Todos los sentimientos merecen ser aceptados tal como son.",
    moodLabel: "¿Cómo te sientes hoy?",
    highlightsLabel: "✿ La pequeña alegría de hoy",
    highlightsExample: "Por ejemplo: He tomado un café delicioso. Se me ha ocurrido una idea interesante.",
    highlightsPlaceholder: "¿Qué pequeña cosa te ha alegrado el día?",
    noteLabel: "Escribe libremente sobre tu día",
    noteDescription: "Tus sentimientos, pensamientos y momentos que no quieres olvidar.",
    notePlaceholder: "Querido diario...",
    saving: "Guardando...",
    updateRecord: "Actualizar recuerdo ↗",
    saveRecord: "Guardar el recuerdo de este día ↗",
    delete: "Eliminar",
    confirmDelete: "¿Quieres eliminar el recuerdo del día",
    deleteButton: "Eliminar",
    cancel: "Cancelar",
    monthReview: "A MONTH TO REMEMBER",
    monthReviewTitle: " – Resumen del mes",
    monthReviewDescription: "Muchos pequeños momentos juntos se convierten en recuerdos valiosos.",
    recordedDays: "Días registrados",
    monthlyMood: "Estado de ánimo del mes",
    memoryDays: "Días con recuerdos escritos",
    startRecording: "Empieza a guardar tus momentos",
    monthlyMoodSummary: "Estados de ánimo de este mes",
    littleMemories: "LITTLE MEMORIES",
    recentRecords: "Recuerdos recientes",
    close: "Cerrar ↑",
    seeMore: "Ver más ↓",
    noRecords: "Todavía no hay recuerdos de este mes.",
    startWithToday: "Empieza con una pequeña alegría de hoy.",
    moodRecordedDay: "Día con estado de ánimo registrado",
    footer: "Every little moment matters.",
    loadingFooter: "Cargando recuerdos...",
    cloudBackup: "☁️ Firestore + copia de seguridad del navegador",
    localBackup: "🌿 Guardado en este navegador",
    moods: {
      happy: "Feliz",
      calm: "Tranquilo",
      grateful: "Conmovido",
      tired: "Cansado",
      sad: "Decaído",
    },
    weekdays: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
  },
} as const;

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

function formatDate(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatLongDate(date: string, language: Language) {
  return new Intl.DateTimeFormat(locales[language], {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date(`${date}T12:00:00`));
}

function getMood(id: Mood) {
  return moodDefinitions.find((item) => item.id === id) ?? moodDefinitions[1];
}

function loadLocal(): Moment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item): item is Moment =>
        item &&
        typeof item.date === "string" &&
        typeof item.highlights === "string" &&
        typeof item.note === "string"
    );
  } catch {
    return [];
  }
}

// 日付ごとに記録をまとめ、新しい記録を優先する
function mergeEntries(remote: Moment[], local: Moment[]): Moment[] {
  const map = new Map<string, Moment>();

  for (const entry of [...remote, ...local]) {
    const previous = map.get(entry.date);

    if (!previous || (entry.updatedAt || "") >= (previous.updatedAt || "")) {
      map.set(entry.date, entry);
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
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
  const [showAllEntries, setShowAllEntries] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const moods = moodDefinitions.map((item) => ({
    ...item,
    label: t.moods[item.id],
  }));

  // 日付を更新
  useEffect(() => {
    const updateToday = () => setToday(formatDate(new Date()));

    updateToday();

    const interval = window.setInterval(updateToday, 60 * 1000);

    return () => window.clearInterval(interval);
  }, []);

  // ログイン状態を確認し、記録を読み込む
  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoaded(false);
      setUser(currentUser);
      setMessage("");

      try {
        const localEntries = loadLocal();
        let remoteEntries: Moment[] = [];

        if (currentUser) {
          const ref = doc(db, "littleMoments", currentUser.uid);
          const snapshot = await getDoc(ref);

          if (!active) return;

          if (snapshot.exists()) {
            const saved = snapshot.data().entries;

            if (Array.isArray(saved)) {
              remoteEntries = saved.filter(
                (item): item is Moment =>
                  item &&
                  typeof item.date === "string" &&
                  typeof item.highlights === "string" &&
                  typeof item.note === "string"
              );
            }
          }
        }

        if (!active) return;

        const merged = mergeEntries(remoteEntries, localEntries);

        setEntries(merged);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));

        if (currentUser && remoteEntries.length === 0 && merged.length > 0) {
          await setDoc(
            doc(db, "littleMoments", currentUser.uid),
            {
              entries: merged,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        }
      } catch (error) {
        console.error("little moments 読み込みエラー:", error);

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

  // 選択した日の記録を入力欄に表示する
  useEffect(() => {
    if (!loaded) return;

    const entry = entries.find((item) => item.date === selectedDate);

    setMood(entry?.mood ?? "calm");
    setHighlights(entry?.highlights ?? "");
    setNote(entry?.note ?? "");
    setConfirmDelete(false);
  }, [entries, selectedDate, loaded]);

  // 記録を保存する
  async function saveEntry() {
    if (!loaded || saving) return;

    const entry: Moment = {
      date: selectedDate,
      mood,
      highlights: highlights.trim(),
      note: note.trim(),
      updatedAt: new Date().toISOString(),
    };

    const newEntries = [
      ...entries.filter((item) => item.date !== selectedDate),
      entry,
    ].sort((a, b) => a.date.localeCompare(b.date));

    setSaving(true);
    setMessage("");

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newEntries));
      setEntries(newEntries);

      if (user) {
        await setDoc(
          doc(db, "littleMoments", user.uid),
          {
            entries: newEntries,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }

      setMessage(user ? t.savedCloud : t.savedLocal);
      setConfirmDelete(false);
    } catch (error) {
      console.error("little moments 保存エラー:", error);
      setMessage(t.saveError);
    } finally {
      setSaving(false);
    }
  }

  // 記録を削除する
  async function deleteEntry() {
    if (!loaded || saving) return;

    const newEntries = entries.filter(
      (item) => item.date !== selectedDate
    );

    setSaving(true);
    setMessage("");

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newEntries));
      setEntries(newEntries);

      if (user) {
        await setDoc(
          doc(db, "littleMoments", user.uid),
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
      console.error("little moments 削除エラー:", error);
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
    "rounded-[1.6rem] border border-[#e8e4d9] bg-[#fffefa] p-5 shadow-[0_8px_28px_rgba(65,76,57,0.045)] sm:p-7";

  const secondaryButton =
    "rounded-xl border border-[var(--anki-theme-soft)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--anki-theme-dark)] transition hover:bg-[var(--anki-theme-light)]";

  const primaryButton =
    "rounded-xl bg-[var(--anki-theme-color)] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--anki-theme-dark)] disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <main className="min-h-screen bg-[#f7f6ef] px-4 pb-12 pt-7 text-[#373e35] sm:px-7 sm:pt-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <div className="mt-7 flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#9b9a85]">
                {t.eyebrow}
              </p>
              <h1 className="mt-2 text-4xl font-medium tracking-tight text-[var(--anki-theme-dark)] sm:text-5xl">
                Little Moments
              </h1>
              <p className="mt-4 max-w-xl whitespace-pre-line text-sm leading-7 text-[#777b6d] sm:text-base">
                {t.description}
              </p>
            </div>

            <div
              className="hidden h-20 w-20 shrink-0 items-center justify-center rounded-full text-4xl sm:flex"
              style={{ background: "var(--anki-theme-light)" }}
            >
              🌿
            </div>
          </div>
        </header>

        {message && (
          <p
            role="status"
            className="mb-5 rounded-xl border border-[var(--anki-theme-soft)] bg-[var(--anki-theme-light)] p-4 text-sm leading-6 text-[var(--anki-theme-dark)]"
          >
            {message}
          </p>
        )}

        {!loaded && (
          <div className={`${panel} mb-6 text-sm text-[#798273]`}>
            {t.loading}
          </div>
        )}

        <section className={`${panel} mb-6`}>
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-medium tracking-widest text-[#a09c88]">
                {t.momentForYourself}
              </p>
              <h2 className="mt-2 text-xl font-medium text-[var(--anki-theme-dark)]">
                {formatLongDate(today, currentLanguage)}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#858577]">
                {t.todayQuestion}
                <br />
                {t.todayDescription}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedDate(today);
                setCurrentMonth(
                  new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                );
              }}
              className="self-start rounded-full bg-[var(--anki-theme-light)] px-4 py-2.5 text-sm font-medium text-[var(--anki-theme-dark)] transition hover:bg-[var(--anki-theme-soft)] sm:self-center"
            >
              {t.recordToday}
            </button>
          </div>
        </section>

        <section className={`${panel} mb-6`}>
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.2em] text-[#a09c88]">
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
                  setCurrentMonth((current) =>
                    new Date(current.getFullYear(), current.getMonth() - 1, 1)
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
                  setCurrentMonth((current) =>
                    new Date(current.getFullYear(), current.getMonth() + 1, 1)
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
                  aria-label={
                    date ? formatLongDate(date, currentLanguage) : undefined
                  }
                  className={`flex min-h-[58px] min-w-0 flex-col items-center justify-center gap-1 rounded-xl border text-sm transition sm:min-h-[76px] ${
                    !date
                      ? "border-transparent bg-transparent"
                      : isSelected
                        ? "border-[var(--anki-theme-color)] bg-[var(--anki-theme-light)] text-[var(--anki-theme-dark)] shadow-sm"
                        : isToday
                          ? "border-[#d8b4a9] bg-[#fcf1ed] text-[#6c5b50]"
                          : "border-transparent bg-[#faf9f3] text-[#62675c] hover:border-[var(--anki-theme-soft)] hover:bg-[var(--anki-theme-light)]"
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
              {t.selectedDate}：{selectedDate}
            </span>
          </div>
        </section>

        <section className={`${panel} mb-6`}>
          <div>
            <p className="text-[11px] font-semibold tracking-[0.2em] text-[#a09c88]">
              {t.yourJournal}
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
                      : "border-[#ebe8dd] bg-white hover:bg-[#faf9f3]"
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
              className="little-moments-field mt-3 w-full resize-y rounded-2xl border border-[#e7e4d8] bg-[#fdfcf7] p-4 text-sm leading-7 text-[#424a40] outline-none transition placeholder:text-[#b0ad9e] focus:border-[var(--anki-theme-color)] focus:ring-2 focus:ring-[var(--anki-theme-light)]"
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
              className="little-moments-field mt-3 w-full resize-y rounded-2xl border border-[#e7e4d8] bg-[#fdfcf7] p-4 text-sm leading-7 text-[#424a40] outline-none transition placeholder:text-[#b0ad9e] focus:border-[var(--anki-theme-color)] focus:ring-2 focus:ring-[var(--anki-theme-light)]"
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
                {currentLanguage === "ja"
                  ? `${selectedDate} ${t.confirmDelete}`
                  : currentLanguage === "es"
                    ? `${t.confirmDelete} ${selectedDate}?`
                    : `${t.confirmDelete} ${selectedDate}?`}
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

        <section className={`${panel} mb-6`}>
          <p className="text-[11px] font-semibold tracking-[0.2em] text-[#a09c88]">
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
                <span className="ml-1 text-sm">
                  {currentLanguage === "ja"
                    ? "日"
                    : currentLanguage === "zh-CN" || currentLanguage === "zh-TW"
                      ? "天"
                      : ""}
                </span>
              </p>
            </div>

            <div className="rounded-2xl bg-[#f8e9e9] p-4">
              <p className="text-xs text-[#a77f83]">{t.monthlyMood}</p>
              <p className="mt-2 text-2xl">{favoriteMood?.emoji ?? "🌷"}</p>
              <p className="mt-1 text-sm text-[#926f72]">
                {favoriteMood?.label ?? t.startRecording}
              </p>
            </div>

            <div className="col-span-2 rounded-2xl bg-[#f6f0e2] p-4 sm:col-span-1">
              <p className="text-xs text-[#9b8b69]">{t.memoryDays}</p>
              <p className="mt-2 text-3xl font-medium text-[#82734f]">
                {recordedDays}
                <span className="ml-1 text-sm">
                  {currentLanguage === "ja"
                    ? "日"
                    : currentLanguage === "zh-CN" || currentLanguage === "zh-TW"
                      ? "天"
                      : ""}
                </span>
              </p>
            </div>
          </div>

          {monthEntries.length > 0 && (
            <div className="mt-5 border-t border-[#eeeadd] pt-5">
              <h3 className="text-sm font-medium text-[var(--anki-theme-dark)]">
                {t.monthlyMoodSummary}
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
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

        <section className={`${panel} mb-7`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.2em] text-[#a09c88]">
                {t.littleMemories}
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
            <div className="mt-6 rounded-2xl bg-[#faf9f3] px-5 py-8 text-center">
              <p className="text-3xl">🌼</p>
              <p className="mt-3 text-sm text-[#73796c]">
                {t.noRecords}
              </p>
              <p className="mt-2 text-xs leading-6 text-[#a19f90]">
                {t.startWithToday}
              </p>
            </div>
          ) : (
            <div className="mt-5 divide-y divide-[#eeeadd]">
              {(showAllEntries
                ? monthEntries
                : monthEntries.slice(0, 3)
              ).map((entry) => {
                const entryMood = getMood(entry.mood);
                const entryMoodLabel = t.moods[entry.mood];

                return (
                  <button
                    key={entry.date}
                    type="button"
                    onClick={() => setSelectedDate(entry.date)}
                    className="flex w-full items-start gap-3 py-4 text-left transition hover:bg-[#faf9f3]"
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
                          `${entryMoodLabel} · ${t.moodRecordedDay}`}
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
              ? t.loadingFooter
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