"use client";
import Link from "next/link";
import { useLanguage } from "@/app/component/AppLanguage";

import {
  ChangeEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import { db } from "@/lib/firebase";

import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
} from "firebase/firestore";

type Folder = {
  id: string;
  name: string;
};

type LearningStatus =
  | "weak"
  | "almost"
  | "vague"
  | "learned"
  | "perfect"
  | "unlearned";

type Card = {
  id: string;
  front: string;
  pinyin: string;
  japanese: string;
  example: string;
  exampleJapanese: string;

  reviewCount?: number;
  correctCount?: number;
  incorrectCount?: number;
  lastReviewedAt?: number;
  lastResult?: "correct" | "incorrect";

  learningStatus?: LearningStatus;
  nextReviewAt?: number | null;
};

type Deck = {
  name: string;
  language: string;
  cards: Card[];
  folderId: string | null;
};

type StudyRecord = {
  id: string;
  date: string;
  time?: string;
  startedAt?: number;
  deckName: string;
  answered: number;
  correct: number;
  incorrect: number;
  duration: number;
};

type ThemeColors = {
  blue: string;
  blueDark: string;
  blueLight: string;
  pink: string;
  pinkDark: string;
  pinkLight: string;
  green: string;
  greenLight: string;
  white: string;
  gray: string;
  border: string;
  dark: string;
};

const pageTranslations: Record<string, Record<string, string>> = {
  "ja": {
    "color.title": "カラー選択",
    "color.custom": "カスタムカラーを選択",
    "color.customDesc": "カラーピッカーで自由に色を選択できます。",
    "color.choose": "自由に色を選択",
    "color.change": "色を変更する",
    "color.clickHint": "色のエリアをクリックすると、色選択ツールが開きます。",
    "color.hue": "色相（色の種類）",
    "color.hex": "HEX カラーコード",
    "color.copy": "コピー",
    "color.hexError": "#RRGGBB形式で入力してください。",
    "color.rgb": "RGB カラー値",
    "color.selected": "選択中のカラー",
    "color.saved": "保存済みのテーマカラー",
    "color.current": "現在のテーマカラー",
    "color.savedHint": "保存するとテーマカラーとして記録されます。",
    "common.cancel": "キャンセル",
    "common.save": "保存する",
    "common.saved": "保存しました ✓",
    "study.quit": "学習をやめる",
    "study.correct": "正解",
    "study.incorrect": "不正解",
    "study.answered": "回答",
    "study.tap": "タップして答えを見る",
    "study.noReading": "読み方なし",
    "study.noTranslation": "日本語訳なし",
    "study.pronunciation": "発音",
    "study.finished": "学習終了！",
    "study.accuracy": "正答率",
    "deck.back": "← デッキ一覧",
    "deck.cards": "語",
    "deck.start": "学習開始",
    "deck.csv": "CSVインポート",
    "deck.addWord": "単語を追加",
    "deck.editWord": "単語を編集",
    "deck.word": "単語 *",
    "deck.reading": "ピンイン・読み方",
    "deck.translation": "日本語訳",
    "deck.example": "例文",
    "deck.exampleTranslation": "例文の日本語訳",
    "deck.save": "保存",
    "deck.list": "単語一覧",
    "deck.search": "単語を検索",
    "deck.found": "語が見つかりました",
    "deck.empty": "まだ単語がありません",
    "deck.noMatchStart": "「",
    "deck.noMatchEnd": "」に一致する単語がありません。",
    "deck.clearSearch": "検索をクリア",
    "deck.edit": "編集",
    "deck.delete": "削除",
    "deck.manage": "暗記デッキ管理",
    "deck.description": "フォルダや単語デッキを整理して、学習を始めましょう。",
    "folder.uncategorized": "未分類",
    "folder.move": "フォルダへ移動",
    "folder.new": "新しいフォルダ",
    "folder.example": "例：中国語",
    "folder.create": "フォルダ作成",
    "deck.new": "新しいデッキ作成",
    "deck.exampleName": "例：HSK6",
    "deck.noFolder": "フォルダなし",
    "deck.create": "作成",
    "alert.deckName": "デッキ名を入力してください",
    "alert.deckDuplicate": "同じ名前のデッキがあります",
    "alert.deckCreated": "デッキを作成しました",
    "alert.deckSaveFailed": "デッキの保存に失敗しました",
    "alert.deckDeleteConfirm": "「{name}」を削除しますか？",
    "alert.deckDeleteFailed": "デッキの削除に失敗しました",
    "alert.folderName": "フォルダ名を入力してください",
    "alert.folderCreated": "フォルダを作成しました",
    "alert.folderSaveFailed": "フォルダの保存に失敗しました",
    "alert.folderDeleteConfirm": "このフォルダを削除しますか？",
    "alert.folderDeleteFailed": "フォルダの削除に失敗しました",
    "alert.deckMoveFailed": "デッキの移動に失敗しました",
    "alert.csvReadFailed": "CSVを読み込めませんでした",
    "alert.csvEmpty": "CSVにデータがありません",
    "alert.wordReadFailed": "単語を読み込めませんでした",
    "alert.deckNotFound": "デッキが見つかりません",
    "alert.csvImported": "{count}語をインポートしました",
    "alert.csvFileFailed": "CSVファイルを読み込めませんでした",
    "alert.wordRequired": "単語を入力してください",
    "alert.currentDeckMissing": "現在のデッキが見つかりません",
    "alert.duplicateWord": "「{word}」はすでに存在します。\n\nそれでも追加しますか？",
    "alert.wordSaveFailed": "単語の保存に失敗しました。\n",
    "alert.wordDeleteConfirm": "「{word}」を削除しますか？",
    "alert.wordDeleteFailed": "単語の削除に失敗しました",
    "alert.noWords": "単語がありません",
    "alert.studyRecordDeleteConfirm": "この学習記録を削除しますか？",
    "alert.studyRecordDeleteFailed": "学習記録の削除に失敗しました",
    "alert.studyRecordSaveFailed": "学習記録の保存に失敗しました",
    "alert.cardRecordSaveFailed": "カードの学習記録を保存できませんでした。\n\n",
    "duration.seconds": "秒",
    "duration.minutes": "分",
    "duration.separator": "",
    "color.preset.sakura": "さくら",
    "color.preset.sky": "スカイ",
    "color.preset.lavender": "ラベンダー",
    "color.preset.mint": "ミント",
    "color.preset.lemon": "レモン",
    "color.preset.peach": "ピーチ",
    "color.preset.coral": "コーラル",
    "color.preset.ocean": "オーシャン",
    "color.preset.grape": "グレープ",
    "color.preset.rose": "ローズ",
    "color.preset.forest": "フォレスト",
    "color.preset.dark": "ダーク",
    "language.zhCN": "中国語（簡体字）",
    "language.zhTW": "中国語（繁体字）",
    "language.de": "ドイツ語",
    "language.es": "スペイン語",
    "language.it": "イタリア語",
    "language.ja": "日本語",
    "language.ko": "韓国語",
    "language.nl": "オランダ語",
    "language.da": "デンマーク語",
    "language.fr": "フランス語",
    "language.ptPT": "ポルトガル語（ヨーロッパ）",
    "language.ptBR": "ポルトガル語（ブラジル）",
    "language.vi": "ベトナム語",
    "language.sv": "スウェーデン語",
    "language.nb": "ノルウェー語（ブークモール）",
    "language.id": "インドネシア語",
    "language.tr": "トルコ語",
    "language.pl": "ポーランド語",
    "language.ru": "ロシア語",
    "language.el": "ギリシャ語",
    "language.th": "タイ語",
    "language.cs": "チェコ語",
    "language.ro": "ルーマニア語",
    "language.hi": "ヒンディー語",
    "language.ar": "アラビア語",
    "alert.firestoreLoadFailed": "Firestoreからデータを読み込めませんでした。\n\n",
    "alert.csvError": "CSVエラー: "
  }
};

const presets = [
  { name: "color.preset.sakura", color: "#FF5A9E" },
  { name: "color.preset.sky", color: "#78C5FF" },
  { name: "color.preset.lavender", color: "#B69AFB" },
  { name: "color.preset.mint", color: "#70D6B5" },
  { name: "color.preset.lemon", color: "#FFE16A" },
  { name: "color.preset.peach", color: "#FFB477" },
  { name: "color.preset.coral", color: "#FF7185" },
  { name: "color.preset.ocean", color: "#36B6C8" },
  { name: "color.preset.grape", color: "#8A70C8" },
  { name: "color.preset.rose", color: "#E887B0" },
  { name: "color.preset.forest", color: "#59A982" },
  { name: "color.preset.dark", color: "#46546B" },
];

function normalizeHex(value: string) {
  const hex = value.startsWith("#") ? value : `#${value}`;
  return /^#[0-9a-fA-F]{6}$/.test(hex) ? hex.toUpperCase() : null;
}

function getRgb(hex: string) {
  const value = hex.replace("#", "");
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function prioritizeWeakCards(cards: Card[]) {
  const shuffled = [...cards].sort(() => Math.random() - 0.5);
  return shuffled.sort((a, b) => {
    const aRate = (a.reviewCount || 0) > 0
      ? (a.correctCount || 0) / (a.reviewCount || 1)
      : 0;
    const bRate = (b.reviewCount || 0) > 0
      ? (b.correctCount || 0) / (b.reviewCount || 1)
      : 0;
    const aPriority = (a.reviewCount || 0) === 0 ? -1 : aRate;
    const bPriority = (b.reviewCount || 0) === 0 ? -1 : bRate;
    return aPriority - bPriority;
  });
}

function makeThemeColors(primary: string): ThemeColors {
  const rgb = getRgb(primary);
  const mix = (amount: number) =>
    "#" + [rgb.r, rgb.g, rgb.b]
      .map((v) => Math.round(v + (255 - v) * amount).toString(16).padStart(2, "0"))
      .join("");
  const darken = (amount: number) =>
    "#" + [rgb.r, rgb.g, rgb.b]
      .map((v) => Math.round(v * (1 - amount)).toString(16).padStart(2, "0"))
      .join("");
  return {
    blue: primary,
    blueDark: darken(0.38),
    blueLight: mix(0.88),
    pink: "#F28CB8",
    pinkDark: "#B74378",
    pinkLight: "#FFF0F6",
    green: "#63B995",
    greenLight: "#E8F8F0",
    white: "#FFFFFF",
    gray: "#718096",
    border: "#E2E8F0",
    dark: "#26365D",
  };
}

export default function Page() {
  const { language } = useLanguage();
  const tx = (key: string) => pageTranslations[language]?.[key] || pageTranslations["ja"]?.[key] || key;

  const [themeColor, setThemeColor] = useState("#718675");
  const [showThemeSettings, setShowThemeSettings] = useState(false);
  const [color, setColor] = useState("#718675");
  const [savedColor, setSavedColor] = useState("#718675");
  const [hexInput, setHexInput] = useState("#718675");
  const [hexError, setHexError] = useState(false);
  const [saved, setSaved] = useState(false);
  const colors = makeThemeColors(themeColor);

  // 高速学習用：二重タップ防止
  const answerLockRef = useRef(false);

  // Firestoreへの保存を順番に実行する
  const deckSaveQueueRef = useRef<Promise<void>>(Promise.resolve());

  // 保存失敗を記録する
  const deckSaveFailedRef = useRef(false);

  useEffect(() => {
    const stored = localStorage.getItem("anki-theme-color");
    const valid = stored ? normalizeHex(stored) : null;
    if (valid) {
      setThemeColor(valid);
      setColor(valid);
      setSavedColor(valid);
      setHexInput(valid);
    }
  }, []);

  function chooseColor(value: string) {
    const valid = normalizeHex(value);
    if (!valid) return;
    setColor(valid);
    setHexInput(valid);
    setHexError(false);
    setSaved(false);
  }

  function saveColor() {
    localStorage.setItem("anki-theme-color", color);
    localStorage.setItem("anki-custom-color", color);
    document.documentElement.style.setProperty("--anki-theme-color", color);
    setSavedColor(color);
    setThemeColor(color);
    setSaved(true);
    setShowThemeSettings(false);
  }

  function cancelColor() {
    chooseColor(savedColor);
    setSaved(false);
    setShowThemeSettings(false);
  }

  // フォルダ
  const [folders, setFolders] = useState<Folder[]>([
    { id: "default", name: "中国語" },
  ]);

  // デッキ
  const [decks, setDecks] = useState<Deck[]>([
    { name: "中国語", language: "zh-CN", cards: [], folderId: "default" },
  ]);

  const [currentDeck, setCurrentDeck] = useState("中国語");
  const [deckOpen, setDeckOpen] = useState(false);
  const [answerMode, setAnswerMode] = useState<"2" | "4">("2");

  // 学習
  const [studyMode, setStudyMode] = useState(false);
  const [studyCards, setStudyCards] = useState<Card[]>([]);
  const [studyIndex, setStudyIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const [studyCorrect, setStudyCorrect] = useState(0);
  const [studyIncorrect, setStudyIncorrect] = useState(0);
  const [studyStartTime, setStudyStartTime] = useState<number | null>(null);
  const [studySessionId, setStudySessionId] = useState<string | null>(null);

  // 学習完了後のサマリー表示状態
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryData, setSummaryData] = useState<{
    total: number;
    correct: number;
    incorrect: number;
    rate: string;
    durationSec: number;
  } | null>(null);

  // 学習記録
  const [studyRecords, setStudyRecords] = useState<StudyRecord[]>([]);

  // 次のカードが表示されたら操作ロックを解除
  useEffect(() => {
    answerLockRef.current = false;
  }, [studyIndex]);

  // フォーム用
  const [newDeckName, setNewDeckName] = useState("");
  const [newDeckLanguage, setNewDeckLanguage] = useState("zh-CN");
  const [newDeckFolderId, setNewDeckFolderId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");

  const [showCardForm, setShowCardForm] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [cardFront, setCardFront] = useState("");
  const [cardPinyin, setCardPinyin] = useState("");
  const [cardJapanese, setCardJapanese] = useState("");
  const [cardExample, setCardExample] = useState("");
  const [cardExampleJapanese, setCardExampleJapanese] = useState("");

  const [cardSearch, setCardSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Firestore読み込み
  useEffect(() => {
    const loadData = async () => {
      try {
        const folderSnapshot = await getDocs(collection(db, "folders"));
        if (!folderSnapshot.empty) {
          const loadedFolders: Folder[] = folderSnapshot.docs.map((item) => ({
            id: item.id,
            name: item.data().name || item.id,
          }));
          setFolders(loadedFolders);
        }

        const deckSnapshot = await getDocs(collection(db, "decks"));
        if (!deckSnapshot.empty) {
          const loadedDecks: Deck[] = deckSnapshot.docs.map((item) => {
            const data = item.data();
            return {
              name: data.name || item.id,
              language: data.language || "zh-CN",
              cards: Array.isArray(data.cards)
                ? data.cards.map((card: Partial<Card>) => ({
                    id: card.id || createId(),
                    front: card.front || "",
                    pinyin: card.pinyin || "",
                    japanese: card.japanese || "",
                    example: card.example || "",
                    exampleJapanese: card.exampleJapanese || "",
                    reviewCount: Number(card.reviewCount || 0),
                    correctCount: Number(card.correctCount || 0),
                    incorrectCount: Number(card.incorrectCount || 0),
                    lastReviewedAt: Number(card.lastReviewedAt || 0),
                    ...(card.lastResult === "correct" || card.lastResult === "incorrect"
                      ? { lastResult: card.lastResult }
                      : {}),
                  }))
                : [],
              folderId: data.folderId ?? null,
            };
          });
          setDecks(loadedDecks);
          if (loadedDecks.length > 0) {
            setCurrentDeck(loadedDecks[0].name);
          }
        }

        const recordSnapshot = await getDocs(collection(db, "studyRecords"));
        if (!recordSnapshot.empty) {
          const loadedRecords: StudyRecord[] = recordSnapshot.docs.map((item) => {
            const data = item.data();
            return {
              id: item.id,
              date: data.date || "",
              time: data.time || "",
              startedAt: Number(data.startedAt || 0),
              deckName: data.deckName || "",
              answered: Number(data.answered || 0),
              correct: Number(data.correct || 0),
              incorrect: Number(data.incorrect || 0),
              duration: Number(data.duration || 0),
            };
          });
          loadedRecords.sort((a, b) => (b.startedAt || 0) - (a.startedAt || 0));
          setStudyRecords(loadedRecords);
        }
      } catch (error) {
        console.error("Firestore読み込みエラー:", error);
      }
    };
    loadData();
  }, []);

  const speakWord = (word: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const deck = decks.find((item) => item.name === currentDeck);
    const utterance = new SpeechSynthesisUtterance(word);
    let configuredLanguage = "";
    let configuredRate = 0.8;
    try {
      configuredLanguage = localStorage.getItem("anki-study-language") || "";
      const storedRate = Number(localStorage.getItem("anki-speech-rate") ?? "0.8");
      if (Number.isFinite(storedRate) && storedRate >= 0.5 && storedRate <= 2.0) {
        configuredRate = storedRate;
      }
    } catch {}
    utterance.lang = configuredLanguage || deck?.language || "zh-CN";
    utterance.rate = configuredRate;
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (!studyMode) return;
    const card = studyCards[studyIndex];
    if (!card) return;
    let autoReadEnabled = true;
    try {
      autoReadEnabled = localStorage.getItem("anki-auto-read") !== "false";
    } catch {}
    if (!autoReadEnabled) return;
    speakWord(card.front);

    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [studyMode, studyIndex, studyCards]);

  const addDeck = async () => {
    const name = newDeckName.trim();
    if (!name) return alert(tx("alert.deckName"));
    if (decks.some((deck) => deck.name === name)) return alert(tx("alert.deckDuplicate"));

    const newDeck: Deck = {
      name,
      language: newDeckLanguage,
      cards: [],
      folderId: newDeckFolderId,
    };

    try {
      await setDoc(doc(db, "decks", name), newDeck);
      setDecks((prev) => [...prev, newDeck]);
      setCurrentDeck(name);
      setNewDeckName("");
      setNewDeckFolderId(null);
      alert(tx("alert.deckCreated"));
    } catch (error) {
      alert(tx("alert.deckSaveFailed"));
    }
  };

  const deleteDeck = async (deckName: string) => {
    if (!confirm(tx("alert.deckDeleteConfirm").replace("{name}", deckName))) return;
    try {
      await deleteDoc(doc(db, "decks", deckName));
      const updatedDecks = decks.filter((deck) => deck.name !== deckName);
      setDecks(updatedDecks);
      if (currentDeck === deckName) {
        setCurrentDeck(updatedDecks.length > 0 ? updatedDecks[0].name : "");
        setDeckOpen(false);
      }
    } catch (error) {
      alert(tx("alert.deckDeleteFailed"));
    }
  };

  const addFolder = async () => {
    const name = newFolderName.trim();
    if (!name) return alert(tx("alert.folderName"));

    const newFolder: Folder = { id: createId(), name };
    try {
      await setDoc(doc(db, "folders", newFolder.id), newFolder);
      setFolders((prev) => [...prev, newFolder]);
      setNewFolderName("");
      alert(tx("alert.folderCreated"));
    } catch (error) {
      alert(tx("alert.folderSaveFailed"));
    }
  };

  const deleteFolder = async (folderId: string) => {
    if (!confirm(tx("alert.folderDeleteConfirm"))) return;
    try {
      await deleteDoc(doc(db, "folders", folderId));
      setFolders((prev) => prev.filter((folder) => folder.id !== folderId));
      const updatedDecks = decks.map((deck) =>
        deck.folderId === folderId ? { ...deck, folderId: null } : deck
      );
      setDecks(updatedDecks);
      for (const deck of updatedDecks) {
        await setDoc(doc(db, "decks", deck.name), deck);
      }
    } catch (error) {
      alert(tx("alert.folderDeleteFailed"));
    }
  };

  const moveDeck = async (deckName: string, folderId: string | null) => {
    const deck = decks.find((item) => item.name === deckName);
    if (!deck) return;
    const updatedDeck: Deck = { ...deck, folderId };
    try {
      await setDoc(doc(db, "decks", deckName), updatedDeck);
      setDecks((prev) => prev.map((item) => (item.name === deckName ? updatedDeck : item)));
    } catch (error) {
      alert(tx("alert.deckMoveFailed"));
    }
  };

  const importCSV = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    event.currentTarget.value = "";

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const result = reader.result;
        if (typeof result !== "string") return alert(tx("alert.csvReadFailed"));
        const lines = result.replace(/^\uFEFF/, "").split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
        if (lines.length === 0) return alert(tx("alert.csvEmpty"));

        const importedCards: Card[] = [];
        for (const line of lines) {
          const parts = line.split(",");
          const card: Card = {
            id: createId(),
            front: (parts[0] || "").trim(),
            pinyin: (parts[1] || "").trim(),
            japanese: (parts[2] || "").trim(),
            example: (parts[3] || "").trim(),
            exampleJapanese: parts.slice(4).join(",").trim(),
          };
          if (card.front) importedCards.push(card);
        }

        if (importedCards.length === 0) return alert(tx("alert.wordReadFailed"));
        const deck = decks.find((item) => item.name === currentDeck);
        if (!deck) return alert(tx("alert.deckNotFound"));

        const updatedDeck: Deck = { ...deck, cards: [...deck.cards, ...importedCards] };
        await setDoc(doc(db, "decks", deck.name), updatedDeck);
        setDecks((prev) => prev.map((item) => (item.name === deck.name ? updatedDeck : item)));
        alert(tx("alert.csvImported").replace("{count}", String(importedCards.length)));
      } catch (error) {
        alert(tx("alert.csvError") + (error instanceof Error ? error.message : String(error)));
      }
    };
    reader.readAsText(file, "UTF-8");
  };

  const openCSVPicker = () => fileInputRef.current?.click();

  const openAddCard = () => {
    setEditingCardId(null);
    setCardFront("");
    setCardPinyin("");
    setCardJapanese("");
    setCardExample("");
    setCardExampleJapanese("");
    setShowCardForm(true);
  };

  const openEditCard = (card: Card) => {
    setEditingCardId(card.id);
    setCardFront(card.front);
    setCardPinyin(card.pinyin);
    setCardJapanese(card.japanese);
    setCardExample(card.example);
    setCardExampleJapanese(card.exampleJapanese);
    setShowCardForm(true);
  };

  const closeCardForm = () => {
    setShowCardForm(false);
    setEditingCardId(null);
    setCardFront("");
    setCardPinyin("");
    setCardJapanese("");
    setCardExample("");
    setCardExampleJapanese("");
  };

  const saveCard = async () => {
    const front = cardFront.trim();
    if (!front) return alert(tx("alert.wordRequired"));

    const deck = decks.find((item) => item.name === currentDeck);
    if (!deck) return alert(tx("alert.currentDeckMissing"));

    let updatedCards: Card[];
    if (editingCardId) {
      updatedCards = deck.cards.map((card) =>
        card.id === editingCardId
          ? {
              ...card,
              front,
              pinyin: cardPinyin.trim(),
              japanese: cardJapanese.trim(),
              example: cardExample.trim(),
              exampleJapanese: cardExampleJapanese.trim(),
            }
          : card
      );
    } else {
      if (deck.cards.some((c) => c.front.trim().toLowerCase() === front.toLowerCase())) {
        if (!confirm(tx("alert.duplicateWord").replace("{word}", front))) return;
      }
      const newCard: Card = {
        id: createId(),
        front,
        pinyin: cardPinyin.trim(),
        japanese: cardJapanese.trim(),
        example: cardExample.trim(),
        exampleJapanese: cardExampleJapanese.trim(),
        reviewCount: 0,
        correctCount: 0,
        incorrectCount: 0,
        lastReviewedAt: 0,
      };
      updatedCards = [...deck.cards, newCard];
    }

    const updatedDeck: Deck = { ...deck, cards: updatedCards };
    try {
      await setDoc(doc(db, "decks", deck.name), updatedDeck);
      setDecks((prev) => prev.map((item) => (item.name === deck.name ? updatedDeck : item)));
      closeCardForm();
    } catch (error) {
      alert(tx("alert.wordSaveFailed") + (error instanceof Error ? error.message : String(error)));
    }
  };

  const deleteCard = async (cardId: string) => {
    const deck = decks.find((item) => item.name === currentDeck);
    if (!deck) return;
    const card = deck.cards.find((item) => item.id === cardId);
    if (!card || !confirm(tx("alert.wordDeleteConfirm").replace("{word}", card.front))) return;

    const updatedDeck: Deck = {
      ...deck,
      cards: deck.cards.filter((item) => item.id !== cardId),
    };
    try {
      await setDoc(doc(db, "decks", deck.name), updatedDeck);
      setDecks((prev) => prev.map((item) => (item.name === deck.name ? updatedDeck : item)));
    } catch (error) {
      alert(tx("alert.wordDeleteFailed"));
    }
  };

  const startStudy = () => {
    answerLockRef.current = false;
    deckSaveFailedRef.current = false;
    const deck = decks.find((item) => item.name === currentDeck);
    if (!deck || deck.cards.length === 0) return alert(tx("alert.noWords"));

    setStudyCards(prioritizeWeakCards(deck.cards));
    setStudyIndex(0);
    setShowAnswer(false);
    setStudyCorrect(0);
    setStudyIncorrect(0);
    setStudyStartTime(Date.now());
    setStudySessionId(createId());
    setStudyMode(true);
  };

  const saveStudyRecord = async (correctCount: number, incorrectCount: number) => {
    if (studyStartTime === null || studySessionId === null) return;
    const answered = correctCount + incorrectCount;
    if (answered === 0) return;

    const now = Date.now();
    const duration = Math.max(0, Math.floor((now - studyStartTime) / 1000));
    const dateObject = new Date(now);
    const date = dateObject.toISOString().slice(0, 10);
    const time = dateObject.toLocaleTimeString(language, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const recordId = studySessionId;
    const newRecord: StudyRecord = {
      id: recordId,
      date,
      time,
      startedAt: studyStartTime,
      deckName: currentDeck,
      answered,
      correct: correctCount,
      incorrect: incorrectCount,
      duration,
    };

    try {
      await setDoc(doc(db, "studyRecords", recordId), newRecord);
      setStudyRecords((prev) => {
        const updated = [newRecord, ...prev.filter((r) => r.id !== recordId)];
        return updated.sort((a, b) => (b.startedAt || 0) - (a.startedAt || 0));
      });
    } catch (error) {
      console.error(error);
    }
  };

  // 学習をやめる／終了する
  const finishStudy = async () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    await saveStudyRecord(studyCorrect, studyIncorrect);

    const total = studyCorrect + studyIncorrect;
    const rate = total > 0 ? ((studyCorrect / total) * 100).toFixed(1) : "0.0";
    const durationSec = studyStartTime ? Math.max(0, Math.floor((Date.now() - studyStartTime) / 1000)) : 0;

    setSummaryData({
      total,
      correct: studyCorrect,
      incorrect: studyIncorrect,
      rate,
      durationSec,
    });
    setShowSummaryModal(true);
  };

  const closeSummaryModal = () => {
    setShowSummaryModal(false);
    setSummaryData(null);
    setStudyMode(false);
    setShowAnswer(false);
    setStudyCards([]);
    setStudyIndex(0);
    setStudyCorrect(0);
    setStudyIncorrect(0);
    setStudyStartTime(null);
    setStudySessionId(null);
  };

  const toggleAnswer = () => setShowAnswer((prev) => !prev);

  const answerCard = (
    correct: boolean,
    learningStatus?: LearningStatus,
    reviewDays?: number
  ) => {
    if (answerLockRef.current) return;
    const currentCard = studyCards[studyIndex];
    if (!currentCard) return;

    answerLockRef.current = true;

    const nextCorrect = studyCorrect + (correct ? 1 : 0);
    const nextIncorrect = studyIncorrect + (correct ? 0 : 1);

    setStudyCorrect(nextCorrect);
    setStudyIncorrect(nextIncorrect);

    const updatedCard: Card = {
      ...currentCard,
      reviewCount: (currentCard.reviewCount || 0) + 1,
      correctCount: (currentCard.correctCount || 0) + (correct ? 1 : 0),
      incorrectCount: (currentCard.incorrectCount || 0) + (correct ? 0 : 1),
      lastReviewedAt: Date.now(),
      lastResult: correct ? "correct" : "incorrect",
      learningStatus: learningStatus ?? currentCard.learningStatus,
      nextReviewAt:
        reviewDays !== undefined
          ? Date.now() + reviewDays * 24 * 60 * 60 * 1000
          : currentCard.nextReviewAt ?? null,
    };

    const deck = decks.find((item) => item.name === currentDeck);
    if (deck) {
      const updatedDeck: Deck = {
        ...deck,
        cards: deck.cards.map((card) => (card.id === currentCard.id ? updatedCard : card)),
      };

      setDecks((prev) =>
        prev.map((item) => (item.name === deck.name ? updatedDeck : item))
      );

      deckSaveQueueRef.current = deckSaveQueueRef.current.then(async () => {
        try {
          await setDoc(doc(db, "decks", deck.name), updatedDeck);
        } catch (error) {
          console.error("カード学習記録保存エラー:", error);
          deckSaveFailedRef.current = true;
        }
      });
    }

    if (studyIndex < studyCards.length - 1) {
      setStudyIndex(studyIndex + 1);
      setShowAnswer(false);
      return;
    }

    const finish = async () => {
      await deckSaveQueueRef.current;
      await finishStudy();
    };

    void finish();
  };

  if (showThemeSettings) {
    return (
      <main className="min-h-screen bg-[#f5f7fc] text-[#26365d] md:flex">
        <section className="mx-auto w-full max-w-6xl p-5 md:p-10">
          <header className="mb-7">
            <h1 className="text-3xl font-bold tracking-tight">{tx("color.title")}</h1>
          </header>

          <section className="mb-5 rounded-2xl border border-[#e6ebf5] bg-white p-6 shadow-sm md:p-8">
            <div className="grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-4 md:grid-cols-6">
              {presets.map((preset) => {
                const active = color === preset.color;
                return (
                  <button
                    key={preset.color}
                    type="button"
                    onClick={() => chooseColor(preset.color)}
                    aria-label={tx(preset.name)}
                    aria-pressed={active}
                    className="group flex flex-col items-center gap-3 rounded-xl p-2 transition hover:bg-slate-50"
                  >
                    <span
                      className={`flex h-16 w-16 items-center justify-center rounded-full border-4 transition sm:h-[72px] sm:w-[72px] ${
                        active
                          ? "border-white ring-2 ring-purple-500 ring-offset-2"
                          : "border-white shadow-sm group-hover:scale-105"
                      }`}
                      style={{ backgroundColor: preset.color }}
                    >
                      {active && (
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/15 text-xl font-bold text-white">
                          ✓
                        </span>
                      )}
                    </span>
                    <span className="text-sm font-medium text-slate-600">{tx(preset.name)}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-[#e6ebf5] bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-lg font-bold">🖌 {tx("color.custom")}</h2>
            <p className="mb-6 mt-1 text-sm text-slate-500">{tx("color.customDesc")}</p>

            <div className="grid gap-7 md:grid-cols-2">
              <div>
                <label htmlFor="color-picker" className="mb-3 block text-sm font-semibold">
                  {tx("color.choose")}
                </label>

                <div
                  className="relative flex h-48 items-center justify-center overflow-hidden rounded-xl border border-slate-200"
                  style={{ background: `linear-gradient(135deg, white, ${color})` }}
                >
                  <input
                    id="color-picker"
                    type="color"
                    value={color}
                    onChange={(e) => chooseColor(e.target.value)}
                    aria-label={tx("color.custom")}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                  <div
                    className="pointer-events-none rounded-full border-4 border-white px-5 py-3 text-sm font-bold text-white shadow"
                    style={{ backgroundColor: color }}
                  >
                    {tx("color.change")}
                  </div>
                </div>

                <p className="mt-3 text-xs text-slate-400">{tx("color.clickHint")}</p>
              </div>

              <div className="space-y-5">
                <div>
                  <label htmlFor="hex-code" className="mb-2 block text-sm font-semibold">
                    {tx("color.hex")}
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="hex-code"
                      value={hexInput}
                      onChange={(e) => {
                        setHexInput(e.target.value);
                        const valid = normalizeHex(e.target.value);
                        setHexError(!valid);
                        if (valid) {
                          setColor(valid);
                          setSaved(false);
                        }
                      }}
                      className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 font-mono outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                      aria-invalid={hexError}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        void navigator.clipboard?.writeText(color);
                      }}
                      className="rounded-xl border border-slate-200 px-4 text-sm hover:bg-slate-50"
                      aria-label={tx("color.copy")}
                    >
                      {tx("color.copy")}
                    </button>
                  </div>
                  {hexError && <p className="mt-1 text-sm text-red-500">{tx("color.hexError")}</p>}
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="mb-3 text-sm font-semibold">{tx("color.selected")}</p>
                  <div className="h-24 rounded-xl shadow-inner" style={{ backgroundColor: color }} />
                  <p className="mt-3 font-mono text-sm text-slate-600">{color}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-6">
              <button
                type="button"
                onClick={cancelColor}
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold hover:bg-slate-50"
              >
                {tx("common.cancel")}
              </button>
              <button
                type="button"
                onClick={saveColor}
                className="rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-95"
                style={{ backgroundColor: color }}
              >
                {saved ? tx("common.saved") : tx("common.save")}
              </button>
            </div>
          </section>
        </section>
      </main>
    );
  }

  // 学習画面（Apple/Notion風クリーンデザイン + 洗練された直感カラー）
  if (studyMode) {
    const card = studyCards[studyIndex];
    if (!card) return null;

    const currentAnswered = studyCorrect + studyIncorrect;

    return (
      <main
        style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro JP", "SF Pro Text", sans-serif',
          background: "#FBFBFD",
          color: "#1D1D1F",
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "20px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "560px",
            background: "#FFFFFF",
            borderRadius: "20px",
            border: "1px solid #E5E5EA",
            boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
            padding: "28px",
            boxSizing: "border-box",
          }}
        >
          {/* ヘッダー：「学習をやめる」ボタン */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <button
              onClick={finishStudy}
              style={{
                background: "#F2F2F7",
                border: "none",
                borderRadius: "8px",
                padding: "8px 14px",
                fontSize: "14px",
                fontWeight: "600",
                color: "#8E8E93",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#E5E5EA";
                e.currentTarget.style.color = "#1D1D1F";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#F2F2F7";
                e.currentTarget.style.color = "#8E8E93";
              }}
            >
              学習をやめる
            </button>
            <span
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "#8E8E93",
                letterSpacing: "0.02em",
              }}
            >
              {studyIndex + 1} / {studyCards.length}
            </span>
          </div>

          {/* 学習スタッツカウンター */}
          <div
            style={{
              display: "flex",
              gap: "16px",
              marginBottom: "20px",
              fontSize: "13px",
              color: "#8E8E93",
              background: "#FAFAFC",
              padding: "10px 16px",
              borderRadius: "10px",
              border: "1px solid #F0F0F2",
            }}
          >
            <div>
              {tx("study.correct")}: <strong style={{ color: "#2E7D32" }}>{studyCorrect}</strong>
            </div>
            <div>
              {tx("study.incorrect")}: <strong style={{ color: "#C62828" }}>{studyIncorrect}</strong>
            </div>
            <div>
              {tx("study.answered")}: <strong style={{ color: "#1D1D1F" }}>{currentAnswered}</strong>
            </div>
          </div>

          {/* 問題カード */}
          <div
            onClick={toggleAnswer}
            style={{
              minHeight: "320px",
              padding: "36px 24px",
              background: "#FAFAFC",
              border: "1px solid #E5E5EA",
              borderRadius: "16px",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              textAlign: "center",
              transition: "transform 0.15s ease, border-color 0.15s ease",
              boxSizing: "border-box",
            }}
          >
            {!showAnswer ? (
              <>
                <div
                  style={{
                    fontSize: "44px",
                    fontWeight: "700",
                    marginBottom: "24px",
                    color: "#1D1D1F",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {card.front}
                </div>
                <div style={{ fontSize: "14px", color: "#8E8E93", fontWeight: "500" }}>
                  {tx("study.tap")}
                </div>
              </>
            ) : (
              <>
                <div
                  style={{
                    fontSize: "36px",
                    fontWeight: "700",
                    marginBottom: "16px",
                    color: "#1D1D1F",
                  }}
                >
                  {card.front}
                </div>
                <div style={{ fontSize: "20px", color: "#8E8E93", marginBottom: "12px" }}>
                  {card.pinyin || tx("study.noReading")}
                </div>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: "600",
                    marginBottom: "20px",
                    color: "#2C5282",
                  }}
                >
                  {card.japanese || tx("study.noTranslation")}
                </div>
                {card.example && (
                  <div style={{ fontSize: "16px", color: "#3A3A3C", marginBottom: "6px" }}>
                    {card.example}
                  </div>
                )}
                {card.exampleJapanese && (
                  <div style={{ fontSize: "14px", color: "#8E8E93" }}>
                    {card.exampleJapanese}
                  </div>
                )}
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    speakWord(card.front);
                  }}
                  title="音声を再生"
                  aria-label="音声を再生"
                  style={{
                    marginTop: "20px",
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    border: "1px solid #E5E5EA",
                    background: "#FFFFFF",
                    color: "#1D1D1F",
                    fontSize: "18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  }}
                >
                  🔊
                </button>
              </>
            )}
          </div>

          {/* 回答ボタン（目に優しく、一目で意味が伝わる大人な洗練カラー） */}
          {showAnswer && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: answerMode === "2" ? "1fr 1fr" : "repeat(2, 1fr)",
                gap: "12px",
                marginTop: "20px",
              }}
            >
              {answerMode === "2" ? (
                <>
                  <button
                    type="button"
                    onClick={() => answerCard(false)}
                    style={{
                      height: "54px",
                      borderRadius: "12px",
                      border: "1px solid #E28484",
                      background: "#FDF2F2",
                      color: "#A93226",
                      fontWeight: "600",
                      fontSize: "15px",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#FADBD8"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "#FDF2F2"; }}
                  >
                    ✕ 不正解
                  </button>
                  <button
                    type="button"
                    onClick={() => answerCard(true)}
                    style={{
                      height: "54px",
                      borderRadius: "12px",
                      border: "1px solid #82E0AA",
                      background: "#E8F8F5",
                      color: "#196F3D",
                      fontWeight: "600",
                      fontSize: "15px",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#D4EFDF"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "#E8F8F5"; }}
                  >
                    ◯ 正解
                  </button>
                </>
              ) : (
                <>
                  {/* 苦手（落ち着いた赤みブラウン/コーラル） */}
                  <button
                    type="button"
                    onClick={() => answerCard(false, "weak", 1)}
                    style={{
                      padding: "14px",
                      borderRadius: "12px",
                      border: "1px solid #E6B0AA",
                      background: "#FADBD8",
                      color: "#78281F",
                      fontWeight: "600",
                      fontSize: "14px",
                      cursor: "pointer",
                      textAlign: "center",
                    }}
                  >
                    <div>苦手</div>
                    <div style={{ fontSize: "11px", opacity: 0.75, marginTop: "3px", fontWeight: "normal" }}>明日復習</div>
                  </button>
                  {/* うろ覚え（落ち着いたイエローオーカー） */}
                  <button
                    type="button"
                    onClick={() => answerCard(false, "vague", 3)}
                    style={{
                      padding: "14px",
                      borderRadius: "12px",
                      border: "1px solid #F9E79F",
                      background: "#FEF9E7",
                      color: "#7D6608",
                      fontWeight: "600",
                      fontSize: "14px",
                      cursor: "pointer",
                      textAlign: "center",
                    }}
                  >
                    <div>うろ覚え</div>
                    <div style={{ fontSize: "11px", opacity: 0.75, marginTop: "3px", fontWeight: "normal" }}>3日後復習</div>
                  </button>
                  {/* 覚えた（落ち着いたセージグリーン） */}
                  <button
                    type="button"
                    onClick={() => answerCard(true, "learned", 5)}
                    style={{
                      padding: "14px",
                      borderRadius: "12px",
                      border: "1px solid #A9DFBF",
                      background: "#E8F8F5",
                      color: "#1E8449",
                      fontWeight: "600",
                      fontSize: "14px",
                      cursor: "pointer",
                      textAlign: "center",
                    }}
                  >
                    <div>覚えた</div>
                    <div style={{ fontSize: "11px", opacity: 0.75, marginTop: "3px", fontWeight: "normal" }}>5日後復習</div>
                  </button>
                  {/* 完璧（落ち着いたスモーキーブルー） */}
                  <button
                    type="button"
                    onClick={() => answerCard(true, "perfect", 7)}
                    style={{
                      padding: "14px",
                      borderRadius: "12px",
                      border: "1px solid #AED6F1",
                      background: "#EBF5FB",
                      color: "#1B4F72",
                      fontWeight: "600",
                      fontSize: "14px",
                      cursor: "pointer",
                      textAlign: "center",
                    }}
                  >
                    <div>完璧</div>
                    <div style={{ fontSize: "11px", opacity: 0.75, marginTop: "3px", fontWeight: "normal" }}>7日後復習</div>
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* 学習記録モーダル（学習終了時に自動表示） */}
        {showSummaryModal && summaryData && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.35)",
              backdropFilter: "blur(8px)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 9999,
              padding: "20px",
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: "400px",
                background: "#FFFFFF",
                borderRadius: "20px",
                padding: "32px 28px",
                boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
                textAlign: "center",
                border: "1px solid #E5E5EA",
              }}
            >
              <h2
                style={{
                  margin: "0 0 6px",
                  fontSize: "22px",
                  fontWeight: "700",
                  color: "#1D1D1F",
                  letterSpacing: "-0.02em",
                }}
              >
                学習お疲れ様でした！
              </h2>
              <p style={{ margin: "0 0 24px", fontSize: "13px", color: "#8E8E93" }}>
                今回の学習セッションの成績記録
              </p>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  marginBottom: "28px",
                  textAlign: "left",
                  fontSize: "15px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingBottom: "8px",
                    borderBottom: "1px solid #F0F0F2",
                  }}
                >
                  <span style={{ color: "#8E8E93" }}>回答数</span>
                  <strong style={{ color: "#1D1D1F" }}>{summaryData.total} 問</strong>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingBottom: "8px",
                    borderBottom: "1px solid #F0F0F2",
                  }}
                >
                  <span style={{ color: "#8E8E93" }}>正解数</span>
                  <strong style={{ color: "#2E7D32" }}>{summaryData.correct} 問</strong>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingBottom: "8px",
                    borderBottom: "1px solid #F0F0F2",
                  }}
                >
                  <span style={{ color: "#8E8E93" }}>不正解数</span>
                  <strong style={{ color: "#C62828" }}>{summaryData.incorrect} 問</strong>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingBottom: "8px",
                    borderBottom: "1px solid #F0F0F2",
                  }}
                >
                  <span style={{ color: "#8E8E93" }}>正答率</span>
                  <strong style={{ color: "#2C5282" }}>{summaryData.rate} %</strong>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingBottom: "8px",
                    borderBottom: "1px solid #F0F0F2",
                  }}
                >
                  <span style={{ color: "#8E8E93" }}>学習時間</span>
                  <strong style={{ color: "#1D1D1F" }}>
                    {summaryData.durationSec >= 60
                      ? `${Math.floor(summaryData.durationSec / 60)}分${summaryData.durationSec % 60}秒`
                      : `${summaryData.durationSec}秒`}
                  </strong>
                </div>
              </div>

              <button
                onClick={closeSummaryModal}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: "#1D1D1F",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "opacity 0.15s ease",
                }}
              >
                デッキ一覧に戻る
              </button>
            </div>
          </div>
        )}
      </main>
    );
  }

  // デッキ詳細画面
  if (deckOpen) {
    const deck = decks.find((item) => item.name === currentDeck);
    if (!deck) return null;

    const normalizedSearch = cardSearch.trim().toLowerCase();
    const filteredCards =
      normalizedSearch === ""
        ? deck.cards
        : deck.cards.filter((card) =>
            [card.front, card.pinyin, card.japanese, card.example, card.exampleJapanese]
              .join(" ")
              .toLowerCase()
              .includes(normalizedSearch)
          );

    return (
      <main style={{ maxWidth: "600px", margin: "40px auto", padding: "20px" }}>
        <button
          onClick={() => {
            setDeckOpen(false);
            setCardSearch("");
          }}
          style={{ marginBottom: "20px", padding: "8px 15px", border: "none", background: "transparent", color: colors.blueDark, fontWeight: "bold", cursor: "pointer", fontSize: "16px" }}
        >
          {tx("deck.back")}
        </button>

        <h1 style={{ color: colors.blueDark }}>{currentDeck}</h1>
        <p style={{ color: colors.gray }}>{deck.cards.length} {tx("deck.cards")}</p>

        <div style={{ marginTop: "24px", padding: "18px", background: colors.white, border: `1px solid ${colors.border}`, borderRadius: "16px" }}>
          <div style={{ fontSize: "15px", fontWeight: "bold", marginBottom: "12px", color: colors.dark }}>回答方式</div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={() => setAnswerMode("2")}
              style={{
                flex: 1,
                padding: "13px 8px",
                borderRadius: "12px",
                border: `1px solid ${answerMode === "2" ? colors.blue : colors.border}`,
                background: answerMode === "2" ? colors.blue : colors.white,
                color: answerMode === "2" ? colors.white : colors.dark,
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              2択
              <div style={{ fontSize: "12px", marginTop: "4px" }}>正解・不正解</div>
            </button>
            <button
              type="button"
              onClick={() => setAnswerMode("4")}
              style={{
                flex: 1,
                padding: "13px 8px",
                borderRadius: "12px",
                border: `1px solid ${answerMode === "4" ? colors.blue : colors.border}`,
                background: answerMode === "4" ? colors.blue : colors.white,
                color: answerMode === "4" ? colors.white : colors.dark,
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              4択
              <div style={{ fontSize: "12px", marginTop: "4px" }}>習熟度で評価</div>
            </button>
          </div>
        </div>

        <button
          onClick={startStudy}
          style={{ display: "block", width: "100%", padding: "15px", marginTop: "20px", background: colors.blue, color: colors.white, border: "none", borderRadius: "20px", fontSize: "18px", fontWeight: "bold", cursor: "pointer" }}
        >
          {tx("deck.start")}
        </button>

        <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={importCSV} style={{ display: "none" }} />
        <button
          onClick={openCSVPicker}
          style={{ display: "block", width: "100%", padding: "15px", marginTop: "10px", background: colors.pinkLight, border: `2px solid ${colors.pink}`, color: colors.pinkDark, borderRadius: "20px", fontSize: "17px", fontWeight: "bold", cursor: "pointer" }}
        >
          {tx("deck.csv")}
        </button>

        <button
          onClick={openAddCard}
          style={{ display: "block", width: "100%", padding: "15px", marginTop: "10px", background: colors.blueLight, border: `2px solid ${colors.blue}`, color: colors.blueDark, borderRadius: "20px", fontSize: "17px", fontWeight: "bold", cursor: "pointer" }}
        >
          {tx("deck.addWord")}
        </button>

        {showCardForm && (
          <div style={{ marginTop: "25px", padding: "20px", background: colors.pinkLight, border: `2px solid ${colors.pink}`, borderRadius: "20px" }}>
            <h2 style={{ color: colors.pinkDark, marginTop: 0 }}>{editingCardId ? tx("deck.editWord") : tx("deck.addWord")}</h2>
            <input placeholder={tx("deck.word")} value={cardFront} onChange={(e) => setCardFront(e.target.value)} style={{ width: "100%", padding: "12px", boxSizing: "border-box", marginBottom: "10px", border: `2px solid ${colors.blue}`, borderRadius: "12px", fontSize: "16px" }} />
            <input placeholder={tx("deck.reading")} value={cardPinyin} onChange={(e) => setCardPinyin(e.target.value)} style={{ width: "100%", padding: "12px", boxSizing: "border-box", marginBottom: "10px", border: `2px solid ${colors.blue}`, borderRadius: "12px", fontSize: "16px" }} />
            <input placeholder={tx("deck.translation")} value={cardJapanese} onChange={(e) => setCardJapanese(e.target.value)} style={{ width: "100%", padding: "12px", boxSizing: "border-box", marginBottom: "10px", border: `2px solid ${colors.pink}`, borderRadius: "12px", fontSize: "16px" }} />
            <input placeholder={tx("deck.example")} value={cardExample} onChange={(e) => setCardExample(e.target.value)} style={{ width: "100%", padding: "12px", boxSizing: "border-box", marginBottom: "10px", border: `2px solid ${colors.blue}`, borderRadius: "12px", fontSize: "16px" }} />
            <input placeholder={tx("deck.exampleTranslation")} value={cardExampleJapanese} onChange={(e) => setCardExampleJapanese(e.target.value)} style={{ width: "100%", padding: "12px", boxSizing: "border-box", marginBottom: "15px", border: `2px solid ${colors.pink}`, borderRadius: "12px", fontSize: "16px" }} />

            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={saveCard} style={{ flex: 1, padding: "13px", background: colors.blue, color: colors.white, border: "none", borderRadius: "15px", fontWeight: "bold", cursor: "pointer" }}>{tx("deck.save")}</button>
              <button onClick={closeCardForm} style={{ flex: 1, padding: "13px", background: colors.white, color: colors.gray, border: `2px solid ${colors.border}`, borderRadius: "15px", fontWeight: "bold", cursor: "pointer" }}>{tx("common.cancel")}</button>
            </div>
          </div>
        )}

        <div style={{ marginTop: "35px" }}>
          <h2 style={{ color: colors.blueDark, marginBottom: "12px" }}>{tx("deck.list")}</h2>
          {deck.cards.length > 0 && (
            <div style={{ marginBottom: "18px" }}>
              <input
                type="text"
                placeholder={tx("deck.search")}
                value={cardSearch}
                onChange={(e) => setCardSearch(e.target.value)}
                style={{ width: "100%", padding: "14px 16px", boxSizing: "border-box", border: `2px solid ${colors.blue}`, borderRadius: "14px", fontSize: "17px", outline: "none", background: colors.white }}
              />
              {cardSearch.trim() && (
                <div style={{ marginTop: "8px", fontSize: "14px", color: colors.gray }}>{filteredCards.length} {tx("deck.found")}</div>
              )}
            </div>
          )}

          {deck.cards.length === 0 ? (
            <div style={{ padding: "30px 15px", textAlign: "center", background: colors.blueLight, borderRadius: "18px", color: colors.gray }}>{tx("deck.empty")}</div>
          ) : filteredCards.length === 0 ? (
            <div style={{ padding: "30px 15px", textAlign: "center", background: colors.pinkLight, borderRadius: "18px", color: colors.gray }}>
              {tx("deck.noMatchStart")}{cardSearch}{tx("deck.noMatchEnd")}<br />
              <button onClick={() => setCardSearch("")} style={{ marginTop: "12px", padding: "8px 16px", background: colors.white, border: `2px solid ${colors.pink}`, borderRadius: "10px", color: colors.pinkDark, cursor: "pointer" }}>
                {tx("deck.clearSearch")}
              </button>
            </div>
          ) : (
            filteredCards.map((card, index) => (
              <div key={card.id} style={{ marginBottom: "12px", padding: "15px", background: colors.white, border: `2px solid ${index % 2 === 0 ? colors.blue : colors.pink}`, borderRadius: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "21px", fontWeight: "bold", color: colors.dark, marginBottom: "5px" }}>{card.front}</div>
                    {card.pinyin && <div style={{ color: colors.gray, marginBottom: "4px" }}>{card.pinyin}</div>}
                    {card.japanese && <div style={{ fontSize: "17px" }}>{card.japanese}</div>}
                    {card.example && <div style={{ marginTop: "8px", fontSize: "14px", color: colors.gray }}>{card.example}</div>}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <button onClick={() => openEditCard(card)} style={{ padding: "8px 12px", background: colors.blueLight, border: `1px solid ${colors.blue}`, color: colors.blueDark, borderRadius: "10px", cursor: "pointer", fontWeight: "bold" }}>{tx("deck.edit")}</button>
                    <button onClick={() => deleteCard(card.id)} style={{ padding: "8px 12px", background: colors.pinkLight, border: `1px solid ${colors.pink}`, color: colors.pinkDark, borderRadius: "10px", cursor: "pointer", fontWeight: "bold" }}>{tx("deck.delete")}</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    );
  }

  // デッキ一覧画面（デフォルト）
  return (
    <main style={{ maxWidth: "600px", margin: "40px auto", padding: "20px" }}>
      <div id="deck-management" style={{ scrollMarginTop: "28px", margin: "28px 0 16px", padding: "18px 18px 6px", borderTop: "1px solid #E5E9E2" }}>
        <p style={{ margin: 0, color: "#7B847A", fontSize: "10px", fontWeight: 750, letterSpacing: ".14em" }}>YOUR LIBRARY</p>
        <h2 style={{ margin: "7px 0 0", fontSize: "21px", letterSpacing: "-.04em", color: "#252824" }}>{tx("deck.manage")}</h2>
        <p style={{ margin: "7px 0 0", color: "#858780", fontSize: "12px", lineHeight: 1.7 }}>{tx("deck.description")}</p>
      </div>

      {/* フォルダ一覧 */}
      {folders.map((folder) => (
        <div key={folder.id} style={{ border: `2px solid ${colors.blue}`, borderRadius: "18px", padding: "15px", marginBottom: "15px", background: colors.blueLight }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <h2 style={{ margin: 0 }}>{folder.name}</h2>
            <button onClick={() => deleteFolder(folder.id)} style={{ border: "none", background: "transparent", color: colors.pinkDark, cursor: "pointer" }}>
              {tx("deck.delete")}
            </button>
          </div>

          {decks
            .filter((deck) => deck.folderId === folder.id)
            .map((deck) => (
              <div key={deck.name} style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
                <button
                  onClick={() => {
                    setCurrentDeck(deck.name);
                    setDeckOpen(true);
                  }}
                  style={{ flex: 1, padding: "15px", textAlign: "left", background: colors.white, border: `2px solid ${colors.pink}`, borderRadius: "12px", cursor: "pointer" }}
                >
                  {deck.name}
                  <span style={{ marginLeft: "10px", fontSize: "14px", color: colors.gray }}>
                    {deck.cards.length} {tx("deck.cards")}
                  </span>
                </button>

                <select
                  value={deck.folderId || ""}
                  onChange={(e) => moveDeck(deck.name, e.target.value || null)}
                  style={{ marginLeft: "8px" }}
                >
                  <option value="">{tx("folder.uncategorized")}</option>
                  {folders.map((folderItem) => (
                    <option key={folderItem.id} value={folderItem.id}>
                      {folderItem.name}
                    </option>
                  ))}
                </select>

                <button onClick={() => deleteDeck(deck.name)} style={{ marginLeft: "8px", border: "none", background: "transparent", color: colors.pinkDark, cursor: "pointer" }}>
                  {tx("deck.delete")}
                </button>
              </div>
            ))}
        </div>
      ))}

      {/* 未分類 */}
      {decks.some((deck) => deck.folderId === null) && (
        <div style={{ border: `2px solid ${colors.pink}`, borderRadius: "18px", padding: "15px", marginBottom: "20px", background: colors.pinkLight }}>
          <h2>{tx("folder.uncategorized")}</h2>
          {decks
            .filter((deck) => deck.folderId === null)
            .map((deck) => (
              <div key={deck.name} style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
                <button
                  onClick={() => {
                    setCurrentDeck(deck.name);
                    setDeckOpen(true);
                  }}
                  style={{ flex: 1, padding: "15px", textAlign: "left", background: colors.white, border: `2px solid ${colors.blue}`, borderRadius: "12px", cursor: "pointer" }}
                >
                  {deck.name} {deck.cards.length} {tx("deck.cards")}
                </button>

                <select
                  value={deck.folderId || ""}
                  onChange={(e) => moveDeck(deck.name, e.target.value || null)}
                  style={{ marginLeft: "8px" }}
                >
                  <option value="">{tx("folder.move")}</option>
                  {folders.map((folderItem) => (
                    <option key={folderItem.id} value={folderItem.id}>
                      {folderItem.name}
                    </option>
                  ))}
                </select>

                <button onClick={() => deleteDeck(deck.name)} style={{ marginLeft: "8px", border: "none", background: "transparent", color: colors.pinkDark, cursor: "pointer" }}>
                  {tx("deck.delete")}
                </button>
              </div>
            ))}
        </div>
      )}

      {/* 新しいフォルダ作成 */}
      <h2>{tx("folder.new")}</h2>
      <input
        placeholder={tx("folder.example")}
        value={newFolderName}
        onChange={(e) => setNewFolderName(e.target.value)}
        style={{ padding: "12px", width: "100%", boxSizing: "border-box", marginBottom: "10px", border: `2px solid ${colors.blue}`, borderRadius: "12px" }}
      />
      <button onClick={addFolder} style={{ padding: "12px 30px", background: colors.pink, color: colors.white, border: "none", borderRadius: "20px", cursor: "pointer", fontWeight: "bold" }}>
        {tx("folder.create")}
      </button>

      {/* 新しいデッキ作成 */}
      <h2>{tx("deck.new")}</h2>
      <input
        placeholder={tx("deck.exampleName")}
        value={newDeckName}
        onChange={(e) => setNewDeckName(e.target.value)}
        style={{ padding: "12px", width: "100%", boxSizing: "border-box", marginBottom: "10px", border: `2px solid ${colors.pink}`, borderRadius: "12px" }}
      />

      <select
        value={newDeckLanguage}
        onChange={(e) => setNewDeckLanguage(e.target.value)}
        style={{ padding: "12px", width: "100%", marginBottom: "10px", border: `2px solid ${colors.blue}`, borderRadius: "12px" }}
      >
        <option value="zh-CN">{tx("language.zhCN")}</option>
        <option value="zh-TW">{tx("language.zhTW")}</option>
        <option value="de-DE">{tx("language.de")}</option>
        <option value="es-ES">{tx("language.es")}</option>
        <option value="it-IT">{tx("language.it")}</option>
        <option value="ja-JP">{tx("language.ja")}</option>
        <option value="ko-KR">{tx("language.ko")}</option>
        <option value="nl-NL">{tx("language.nl")}</option>
        <option value="da-DK">{tx("language.da")}</option>
        <option value="fr-FR">{tx("language.fr")}</option>
        <option value="pt-PT">{tx("language.ptPT")}</option>
        <option value="pt-BR">{tx("language.ptBR")}</option>
        <option value="vi-VN">{tx("language.vi")}</option>
        <option value="sv-SE">{tx("language.sv")}</option>
        <option value="nb-NO">{tx("language.nb")}</option>
        <option value="id-ID">{tx("language.id")}</option>
        <option value="tr-TR">{tx("language.tr")}</option>
        <option value="pl-PL">{tx("language.pl")}</option>
        <option value="ru-RU">{tx("language.ru")}</option>
        <option value="el-GR">{tx("language.el")}</option>
        <option value="th-TH">{tx("language.th")}</option>
        <option value="cs-CZ">{tx("language.cs")}</option>
        <option value="ro-RO">{tx("language.ro")}</option>
        <option value="hi-IN">{tx("language.hi")}</option>
        <option value="ar-SA">{tx("language.ar")}</option>
      </select>

      <select
        value={newDeckFolderId || ""}
        onChange={(e) => setNewDeckFolderId(e.target.value || null)}
        style={{ padding: "12px", width: "100%", marginBottom: "10px", border: `2px solid ${colors.blue}`, borderRadius: "12px" }}
      >
        <option value="">{tx("deck.noFolder")}</option>
        {folders.map((folder) => (
          <option key={folder.id} value={folder.id}>
            {folder.name}
          </option>
        ))}
      </select>

      <button onClick={addDeck} style={{ padding: "12px 30px", background: colors.blue, color: colors.white, border: "none", borderRadius: "20px", cursor: "pointer", fontWeight: "bold" }}>
        {tx("deck.create")}
      </button>
    </main>
  );
}