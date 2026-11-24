"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useLanguage } from "@/app/component/AppLanguage";

import { auth, db } from "@/lib/firebase";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getDocsFromServer,
  serverTimestamp,
    setDoc,
  runTransaction,
} from "firebase/firestore";

type Folder = {
  id: string;
  name: string;
  order?: number;
};

type LearningStatus =
  | "weak"
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
  normalIncorrectCount?: number;
  quickIncorrectCount?: number;
  correctStreak?: number;
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
  coverImageUrl?: string;
  order?: number;
};

type DuplicateCardGroup = {
  key: string;
  items: {
    deckName: string;
    card: Card;
  }[];
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

const languageOptions = [
  ["zh-CN", "中国語（簡体字）"],
  ["zh-TW", "中国語（繁体字）"],
  ["de-DE", "ドイツ語"],
  ["es-ES", "スペイン語"],
  ["it-IT", "イタリア語"],
  ["ja-JP", "日本語"],
  ["ko-KR", "韓国語"],
  ["nl-NL", "オランダ語"],
  ["da-DK", "デンマーク語"],
  ["fr-FR", "フランス語"],
  ["pt-PT", "ポルトガル語（ヨーロッパ）"],
  ["pt-BR", "ポルトガル語（ブラジル）"],
  ["vi-VN", "ベトナム語"],
  ["sv-SE", "スウェーデン語"],
  ["nb-NO", "ノルウェー語"],
  ["id-ID", "インドネシア語"],
  ["tr-TR", "トルコ語"],
  ["pl-PL", "ポーランド語"],
  ["ru-RU", "ロシア語"],
  ["el-GR", "ギリシャ語"],
  ["th-TH", "タイ語"],
  ["cs-CZ", "チェコ語"],
  ["ro-RO", "ルーマニア語"],
  ["hi-IN", "ヒンディー語"],
  ["ar-SA", "アラビア語"],
];

const statusOptions: {
  value: LearningStatus;
  label: string;
  days: number;
  background: string;
  border: string;
  color: string;
}[] = [
  {
    value: "weak",
    label: "苦手",
    days: 1,
    background: "#FDF2F2",
    border: "#E8B4B4",
    color: "#A93226",
  },
  {
    value: "vague",
    label: "うろ覚え",
    days: 3,
    background: "#FEF9E7",
    border: "#F2D675",
    color: "#806600",
  },
  {
    value: "learned",
    label: "覚えた",
    days: 5,
    background: "#E8F8F0",
    border: "#A9DFBF",
    color: "#196F3D",
  },
  {
    value: "perfect",
    label: "完璧",
    days: 7,
    background: "#EBF5FB",
    border: "#AED6F1",
    color: "#1B4F72",
  },
];

const presets = [
  { name: "さくら", color: "#FF5A9E" },
  { name: "スカイ", color: "#78C5FF" },
  { name: "ラベンダー", color: "#B69AFB" },
  { name: "ミント", color: "#70D6B5" },
  { name: "レモン", color: "#FFE16A" },
  { name: "ピーチ", color: "#FFB477" },
  { name: "コーラル", color: "#FF7185" },
  { name: "オーシャン", color: "#36B6C8" },
  { name: "グレープ", color: "#8A70C8" },
  { name: "ローズ", color: "#E887B0" },
  { name: "フォレスト", color: "#59A982" },
  { name: "ダーク", color: "#46546B" },
];

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function compressDeckCover(file: File): Promise<string> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("画像を読み込めませんでした。別の画像をお試しください。"));
      img.src = objectUrl;
    });

    const maxSide = 384;
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) throw new Error("画像の変換に失敗しました。");

    context.fillStyle = "#FFFFFF";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    let quality = 0.78;
    let blob: Blob | null = null;

    while (quality >= 0.42) {
      blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", quality)
      );
      if (blob && blob.size <= 180 * 1024) break;
      quality -= 0.08;
    }

    if (!blob) throw new Error("画像をJPEGに変換できませんでした。");
    if (blob.size > 220 * 1024) {
      throw new Error("画像サイズを小さくできませんでした。別の写真をお試しください。");
    }

    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") resolve(reader.result);
        else reject(new Error("画像データを読み取れませんでした。"));
      };
      reader.onerror = () => reject(new Error("画像データの読み取りに失敗しました。"));
      reader.readAsDataURL(blob);
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function normalizeHex(value: string) {
  const hex = value.startsWith("#") ? value : `#${value}`;
  return /^#[0-9a-fA-F]{6}$/.test(hex) ? hex.toUpperCase() : null;
}

function getDeckSpeechKey(deckName: string) {
  return `anki-study-language-${encodeURIComponent(deckName)}`;
}

function prioritizeWeakCards(cards: Card[]) {
  return [...cards]
    .sort(() => Math.random() - 0.5)
    .sort((a, b) => {
      const aRate =
        (a.reviewCount || 0) > 0
          ? (a.correctCount || 0) / (a.reviewCount || 1)
          : 0;
      const bRate =
        (b.reviewCount || 0) > 0
          ? (b.correctCount || 0) / (b.reviewCount || 1)
          : 0;

      const aPriority = (a.reviewCount || 0) === 0 ? -1 : aRate;
      const bPriority = (b.reviewCount || 0) === 0 ? -1 : bRate;

      return aPriority - bPriority;
    });
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  boxSizing: "border-box",
  marginBottom: "10px",
  border: "1px solid #E5E5EA",
  borderRadius: "10px",
  fontSize: "14px",
  outline: "none",
  background: "#FFFFFF",
  color: "#1D1D1F",
};

const primaryButtonStyle: React.CSSProperties = {
  padding: "13px 18px",
  background: "#1D1D1F",
  color: "#FFFFFF",
  border: "none",
  borderRadius: "10px",
  fontWeight: 600,
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: "11px 14px",
  background: "#FFFFFF",
  color: "#1D1D1F",
  border: "1px solid #E5E5EA",
  borderRadius: "10px",
  fontWeight: 600,
  cursor: "pointer",
};

export default function Page() {
  const { language } = useLanguage();

  const answerLockRef = useRef(false);
  const finishLockRef = useRef(false);
  const studyCountsRef = useRef({ correct: 0, incorrect: 0 });
  const deckSaveErrorsRef = useRef<string[]>([]);
  const quickDeadlineRef = useRef<number | null>(null);
  const quickRemainingRef = useRef(0);
  const quickActiveStartedRef = useRef<number | null>(null);
  const quickElapsedRef = useRef(0);
  const quickPausedRef = useRef(false);
  const quickModeRef = useRef<"normal" | "50" | "100" | "unlimited">("normal");
  const finishStudyRef = useRef<() => Promise<void>>(async () => {});
  const deckSaveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const editImageInputRef = useRef<HTMLInputElement | null>(null);
  const editCameraInputRef = useRef<HTMLInputElement | null>(null);

  const [themeColor, setThemeColor] = useState("#718675");
  const [showThemeSettings, setShowThemeSettings] = useState(false);
  const [color, setColor] = useState("#718675");
  const [savedColor, setSavedColor] = useState("#718675");

  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [taskTargets, setTaskTargets] = useState<Record<string, number>>({});
  const [taskAddingDeck, setTaskAddingDeck] = useState<string | null>(null);
  const [taskAddedDecks, setTaskAddedDecks] = useState<string[]>([]);

  const [folders, setFolders] = useState<Folder[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [studyRecords, setStudyRecords] = useState<StudyRecord[]>([]);

  const [currentDeck, setCurrentDeck] = useState("");
  const [deckOpen, setDeckOpen] = useState(false);
  const [answerMode, setAnswerMode] = useState<"2" | "4">("2");
  const [studyLimit, setStudyLimit] = useState<
    30 | 50 | 100 | 300 | 500 | 1000 | "all"
  >(30);
  const [studyStatusFilter, setStudyStatusFilter] = useState<
    "all" | "unlearned" | "weak" | "vague" | "mistakes"
  >("all");

  const [showMistakeList, setShowMistakeList] = useState(false);
  const [mistakeCsvScope, setMistakeCsvScope] = useState<"all" | "normal" | "quick">("all");
  const [speechLanguage, setSpeechLanguage] = useState("zh-CN");

  const [challengeMode, setChallengeMode] = useState<"normal" | "50" | "100" | "unlimited">("100");
  const [activeChallengeMode, setActiveChallengeMode] = useState<"normal" | "50" | "100" | "unlimited">("normal");
  const [quickRemainingMs, setQuickRemainingMs] = useState(100000);
  const [quickPaused, setQuickPaused] = useState(false);
  const [studyMode, setStudyMode] = useState(false);
  const [studyCards, setStudyCards] = useState<Card[]>([]);
  const [studyIndex, setStudyIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const [studyCorrect, setStudyCorrect] = useState(0);
  const [studyIncorrect, setStudyIncorrect] = useState(0);
  const studyStartRef = useRef<number | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const sessionUidRef = useRef<string | null>(null);
  const retryRewardRef = useRef<(() => Promise<void>) | null>(null);
  const rewardBusyRef = useRef(false);
  const [rewardBusy, setRewardBusy] = useState(false);

  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [rewardSaveStatus, setRewardSaveStatus] = useState<"success" | "failed" | "skipped">("skipped");
  const [rewardSaveMessage, setRewardSaveMessage] = useState("");
  const [rewardEarnedXp, setRewardEarnedXp] = useState(0);
  const [rewardEarnedCoins, setRewardEarnedCoins] = useState(0);
  const answerHistoryRef = useRef<Array<{ card: Card; correct: boolean }>>([]);
  const [summaryData, setSummaryData] = useState<{
    total: number;
    correct: number;
    incorrect: number;
    rate: string;
    durationSec: number;
    missed: Card[];
    remembered: Card[];
  } | null>(null);

  const [duplicateDeckName, setDuplicateDeckName] = useState<string | null>(null);
  const [duplicateBusy, setDuplicateBusy] = useState(false);
  const duplicateLock = useRef(false);
  const [editingDuplicateCard, setEditingDuplicateCard] = useState<{
    deckName: string;
    card: Card;
  } | null>(null);

  const [newDeckName, setNewDeckName] = useState("");
  const [newDeckLanguage, setNewDeckLanguage] = useState("zh-CN");
  const [newDeckFolderId, setNewDeckFolderId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [editCoverPreview, setEditCoverPreview] = useState("");

  const [showCardForm, setShowCardForm] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [cardFront, setCardFront] = useState("");
  const [cardPinyin, setCardPinyin] = useState("");
  const [cardJapanese, setCardJapanese] = useState("");
  const [cardExample, setCardExample] = useState("");
  const [cardExampleJapanese, setCardExampleJapanese] = useState("");

  const [cardSearch, setCardSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);

  const tx = (key: string) => {
    const ja: Record<string, string> = {
      "deck.back": "デッキ一覧",
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
      "deck.empty": "まだ単語がありません",
      "deck.edit": "編集",
      "deck.delete": "削除",
      "deck.manage": "暗記デッキ管理",
      "deck.description": "フォルダや単語デッキを整理して、学習を始めましょう。",
      "deck.new": "新しいデッキ作成",
      "deck.exampleName": "例：HSK6",
      "deck.noFolder": "フォルダなし",
      "deck.create": "作成",
      "folder.uncategorized": "未分類",
      "folder.new": "新しいフォルダ",
      "folder.example": "例：中国語",
      "folder.create": "フォルダ作成",
      "folder.move": "フォルダへ移動",
      "common.cancel": "キャンセル",
      "study.quit": "学習をやめる",
      "study.correct": "正解",
      "study.incorrect": "不正解",
      "study.answered": "回答",
      "study.tap": "タップして答えを見る",
      "study.noReading": "読み方なし",
      "study.noTranslation": "日本語訳なし",
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
      "alert.wordRequired": "単語を入力してください",
      "alert.currentDeckMissing": "現在のデッキが見つかりません",
      "alert.duplicateWord": "「{word}」はすでに存在します。それでも追加しますか？",
      "alert.wordSaveFailed": "単語の保存に失敗しました。",
      "alert.wordDeleteConfirm": "「{word}」を削除しますか？",
      "alert.wordDeleteFailed": "単語の削除に失敗しました",
      "alert.noWords": "単語がありません",
      "alert.studyRecordSaveFailed": "学習記録の保存に失敗しました",
      "color.title": "カラー選択",
    };
    return ja[key] || key;
  };

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      setAuthReady(true);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const folderSnapshot = await getDocsFromServer(collection(db, "folders"));
        const loadedFolders: Folder[] = folderSnapshot.docs.map((item, index) => ({
          id: item.id,
          name: item.data().name || item.id,
          order: item.data().order ?? index,
        }));

        if (!loadedFolders.some((folder) => ["フランス語", "🇫🇷 フランス語", "French", "Français"].includes(folder.name.trim()))) {
          const folder: Folder = { id: "language-fr-FR", name: "フランス語", order: Math.max(-1, ...loadedFolders.map(f => f.order ?? 0)) + 1 };
          try {
            const ref = doc(db, "folders", folder.id);
            await runTransaction(db, async transaction => {
              const existing = await transaction.get(ref);
              if (!existing.exists()) transaction.set(ref, folder);
            });
            loadedFolders.push(folder);
          } catch (error) {
            console.error("フランス語フォルダ作成エラー:", error);
          }
        }
        loadedFolders.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        if (cancelled) return;
        setFolders(loadedFolders);

        const deckSnapshot = await getDocsFromServer(collection(db, "decks"));
        const loadedDecks: Deck[] = deckSnapshot.docs.map((item, index) => {
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
                  normalIncorrectCount: card.normalIncorrectCount === undefined ? undefined : Number(card.normalIncorrectCount || 0),
                  quickIncorrectCount: card.quickIncorrectCount === undefined ? undefined : Number(card.quickIncorrectCount || 0),
                  correctStreak: Number(card.correctStreak || 0),
                  lastReviewedAt: Number(card.lastReviewedAt || 0),
                  ...(card.lastResult === "correct" || card.lastResult === "incorrect"
                    ? { lastResult: card.lastResult }
                    : {}),
                  ...(card.learningStatus
                    ? { learningStatus: card.learningStatus }
                    : {}),
                  nextReviewAt: card.nextReviewAt ?? null,
                }))
              : [],
            folderId: data.folderId ?? null,
            coverImageUrl: data.coverImageUrl || "",
            order: data.order ?? index,
          };
        });

        if (cancelled) return;
        setDecks(loadedDecks);

        if (loadedDecks.length > 0) {
          setCurrentDeck(loadedDecks[0].name);
        }

        const recordSnapshot = await getDocs(collection(db, "studyRecords"));

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
        if (!cancelled) setStudyRecords(loadedRecords);
      } catch (error) {
        console.error("Firestore読み込みエラー:", error);
        if (!cancelled) setLoadError(error instanceof Error ? error.message : String(error));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (authReady && authUser) void loadData();
    else if (authReady) {
      setLoading(false);
      setLoadError("");
      setDecks([]);
      setFolders([]);
      setStudyRecords([]);
    }
    return () => { cancelled = true; };
  }, [authReady, authUser, loadAttempt]);

  useEffect(() => {
    answerLockRef.current = false;
  }, [studyIndex]);

  useEffect(() => {
    const stored = localStorage.getItem("anki-theme-color");
    const valid = stored ? normalizeHex(stored) : null;

    if (valid) {
      setThemeColor(valid);
      setColor(valid);
      setSavedColor(valid);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
    };
  }, [coverPreview]);

  const saveColor = () => {
    localStorage.setItem("anki-theme-color", color);
    localStorage.setItem("anki-custom-color", color);
    document.documentElement.style.setProperty("--anki-theme-color", color);
    setThemeColor(color);
    setSavedColor(color);
    setShowThemeSettings(false);
  };

  useEffect(() => {
    const deck = decks.find((item) => item.name === currentDeck);
    if (!deck || !deckOpen) return;

    let savedLanguage = "";

    try {
      savedLanguage = localStorage.getItem(getDeckSpeechKey(deck.name)) || "";
    } catch {}

    const validLanguage = languageOptions.some(([code]) => code === savedLanguage);
    setSpeechLanguage(validLanguage ? savedLanguage : deck.language);
  }, [currentDeck, deckOpen, decks]);

  const changeSpeechLanguage = (value: string) => {
    setSpeechLanguage(value);

    try {
      localStorage.setItem(getDeckSpeechKey(currentDeck), value);
    } catch {}

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  const speakWord = (word: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(word);
    let rate = 0.8;

    try {
      const storedRate = Number(localStorage.getItem("anki-speech-rate") ?? "0.8");

      if (Number.isFinite(storedRate) && storedRate >= 0.5 && storedRate <= 2) {
        rate = storedRate;
      }
    } catch {}

    utterance.lang = speechLanguage || "zh-CN";
    utterance.rate = rate;
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
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [studyMode, studyIndex, studyCards, speechLanguage]);

  // Firestoreはundefinedを保存できない。旧カードの任意フィールドを安全に除去する。
  const stripUndefined = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(stripUndefined);
    if (value !== null && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
      return Object.fromEntries(
        Object.entries(value).filter(([, item]) => item !== undefined)
          .map(([key, item]) => [key, stripUndefined(item)])
      );
    }
    return value;
  };

  const persistDeck = async (deck: Deck) => {
    await setDoc(doc(db, "decks", deck.name), stripUndefined(deck) as Deck);
  };

  const persistFolder = async (folder: Folder) => {
    await setDoc(doc(db, "folders", folder.id), folder);
  };

  const addDeckToTodayTask = async (deck: Deck) => {
    if (!authReady) {
      alert("ログイン状態を確認しています。少し待ってからもう一度お試しください。");
      return;
    }

    if (!authUser) {
      alert("今日のタスクに追加するにはログインが必要です。");
      return;
    }

    if (deck.cards.length === 0) {
      alert("単語が登録されていないデッキは追加できません。");
      return;
    }

    setTaskAddingDeck(deck.name);

    const now = new Date();
    const today = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");

    const requestedTarget = taskTargets[deck.name] ?? 30;
    const target = Math.min(deck.cards.length, requestedTarget);
    const taskId = `deck-${today}-${encodeURIComponent(deck.name)}`;
    const taskRef = doc(db, "users", authUser.uid, "tasks", taskId);

    try {
      const existingTask = await getDoc(taskRef);

      if (existingTask.exists()) {
        setTaskAddedDecks((previous) =>
          previous.includes(deck.name) ? previous : [...previous, deck.name]
        );
        alert(`「${deck.name}」は、すでに今日のタスクに登録されています。`);
        return;
      }

      await setDoc(taskRef, {
        title: `${deck.name}の単語学習`,
        type: "単語の暗記・復習",
        material: deck.name,
        deckId: deck.name,
        source: "deck",
        target,
        unit: "単語",
        startDate: today,
        scheduledDate: today,
        dueDate: today,
        status: "未着手",
        repeat: "なし",
        repeatDays: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setTaskAddedDecks((previous) =>
        previous.includes(deck.name) ? previous : [...previous, deck.name]
      );
      alert(`「${deck.name}」を今日のタスクに追加しました。`);
    } catch (error) {
      console.error("今日のタスクへのデッキ追加エラー:", error);
      alert("今日のタスクへの追加に失敗しました。もう一度お試しください。");
    } finally {
      setTaskAddingDeck(null);
    }
  };

  const updateDeckState = (updatedDeck: Deck) => {
    setDecks((previous) =>
      previous.map((item) =>
        item.name === updatedDeck.name ? updatedDeck : item
      )
    );
  };

  // デッキ内重複検出用のヘルパー関数
  const getDuplicateCardGroups = (deckName: string | null): DuplicateCardGroup[] => {
    const map = new Map<string, { deckName: string; card: Card }[]>();

    for (const deck of decks.filter((item) => item.name === deckName)) {
      for (const card of deck.cards) {
        const key = (card.front ?? "").normalize("NFC").trim().replace(/\s+/g, " ").toLowerCase();
        if (!key) continue;

        if (!map.has(key)) {
          map.set(key, []);
        }
        map.get(key)!.push({ deckName: deck.name, card });
      }
    }

    const result: DuplicateCardGroup[] = [];
    for (const [key, items] of map.entries()) {
      if (items.length > 1) {
        result.push({ key, items });
      }
    }

    return result;
  };

  const persistDuplicateChange = async (deck: Deck, cards: Card[]) => {
    if (duplicateLock.current || deck.name !== duplicateDeckName) return;
    duplicateLock.current = true;
    setDuplicateBusy(true);
    try {
      const updatedDeck = { ...deck, cards };
      await persistDeck(updatedDeck);
      updateDeckState(updatedDeck);
      setEditingDuplicateCard(null);
    } catch (error) {
      console.error(error);
      alert("保存に失敗しました。もう一度お試しください。");
    } finally {
      duplicateLock.current = false;
      setDuplicateBusy(false);
    }
  };

  const deleteDuplicateCard = async (targetDeckName: string, cardId: string) => {
    const deck = decks.find((item) => item.name === targetDeckName);
    const card = deck?.cards.find((c) => c.id === cardId);
    if (!deck || !card || duplicateLock.current || targetDeckName !== duplicateDeckName) return;
    if (!confirm(`デッキ「${targetDeckName}」から「${card.front}」を削除しますか？`)) return;
    await persistDuplicateChange(deck, deck.cards.filter((c) => c.id !== cardId));
  };

  const saveDuplicateCardEdit = async (targetDeckName: string, updatedCard: Card) => {
    const deck = decks.find((item) => item.name === targetDeckName);
    if (!deck || !updatedCard.front.trim()) { alert("単語を入力してください。"); return; }
    await persistDuplicateChange(deck, deck.cards.map((c) => c.id === updatedCard.id ? {
      ...c, front: updatedCard.front.trim(), pinyin: updatedCard.pinyin,
      japanese: updatedCard.japanese, example: updatedCard.example,
      exampleJapanese: updatedCard.exampleJapanese,
    } : c));
  };

  const exactSignature = (card: Card) => JSON.stringify(
    [card.front, card.pinyin, card.japanese, card.example, card.exampleJapanese]
      .map((value) => (value ?? "").normalize("NFC").trim())
  );
  const getExactDuplicateIds = (deck: Deck) => {
    const keep = new Map<string, Card>();
    const remove = new Set<string>();
    const history = (c: Card) => Math.max(c.reviewCount ?? 0, (c.correctCount ?? 0) + (c.incorrectCount ?? 0));
    for (const card of deck.cards) {
      if (!card.front.trim()) continue;
      const key = exactSignature(card);
      const previous = keep.get(key);
      if (!previous) keep.set(key, card);
      else if (history(card) > history(previous) || (history(card) === history(previous) && (card.lastReviewedAt ?? 0) > (previous.lastReviewedAt ?? 0))) {
        remove.add(previous.id);
        keep.set(key, card);
      } else remove.add(card.id);
    }
    return remove;
  };
  const autoRemoveExactDuplicates = async () => {
    const deck = decks.find((item) => item.name === duplicateDeckName);
    if (!deck || duplicateLock.current) return;
    const remove = getExactDuplicateIds(deck);
    if (!remove.size) return;
    if (!confirm(`「${deck.name}」内の完全一致カード ${remove.size}枚を削除しますか？ 学習履歴の多いカードを優先して残します。`)) return;
    await persistDuplicateChange(deck, deck.cards.filter((c) => !remove.has(c.id)));
  };

  const moveFolderOrder = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= folders.length) return;

    const newFolders = [...folders];
    const temp = newFolders[index];

    newFolders[index] = newFolders[targetIndex];
    newFolders[targetIndex] = temp;

    const updated = newFolders.map((folder, i) => ({
      ...folder,
      order: i,
    }));

    setFolders(updated);

    try {
      await Promise.all(updated.map((folder) => persistFolder(folder)));
    } catch (error) {
      console.error("フォルダ並び替え保存エラー:", error);
    }
  };

  const moveDeckOrder = async (
    folderDecks: Deck[],
    index: number,
    direction: "up" | "down"
  ) => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= folderDecks.length) return;

    const newFolderDecks = [...folderDecks];
    const temp = newFolderDecks[index];

    newFolderDecks[index] = newFolderDecks[targetIndex];
    newFolderDecks[targetIndex] = temp;

    const updatedDecks = decks.map((deck) => {
      const foundIndex = newFolderDecks.findIndex(
        (item) => item.name === deck.name
      );

      if (foundIndex !== -1) {
        return { ...deck, order: foundIndex };
      }

      return deck;
    });

    setDecks(updatedDecks);

    try {
      await Promise.all(
        newFolderDecks.map((deck, i) =>
          persistDeck({ ...deck, order: i })
        )
      );
    } catch (error) {
      console.error("デッキ並び替え保存エラー:", error);
    }
  };

  const selectCoverImage = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0] ?? null;

    if (!file) return;

    if (file.type && !file.type.startsWith("image/")) {
      alert("画像ファイルを選択してください。");
      input.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("元画像は10MB以下にしてください。");
      input.value = "";
      return;
    }

    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    input.value = "";
  };

  const updateExistingDeckCover = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const input = event.currentTarget;
    const file = input.files?.item(0) ?? null;

    if (!file) return;

    if (file.type && !file.type.startsWith("image/")) {
      alert("画像ファイルを選択してください。");
      input.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("元画像は10MB以下にしてください。");
      input.value = "";
      return;
    }

    const deck = decks.find((item) => item.name === currentDeck);
    if (!deck) {
      input.value = "";
      alert("更新するデッキが見つかりませんでした。");
      return;
    }

    setUploadingCover(true);

    try {
      const coverImageUrl = await compressDeckCover(file);
      const updatedDeck: Deck = {
        ...deck,
        coverImageUrl,
      };

      await persistDeck(updatedDeck);
      updateDeckState(updatedDeck);
      setEditCoverPreview("");
      alert("デッキのアイコン画像を保存しました。");
    } catch (error) {
      console.error("デッキアイコン保存エラー:", error);
      alert(
        "写真を保存できませんでした。\n" +
          (error instanceof Error ? error.message : String(error))
      );
    } finally {
      input.value = "";
      setUploadingCover(false);
    }
  };

  const addDeck = async () => {
    const name = newDeckName.trim();

    if (!name) return alert(tx("alert.deckName"));

    if (decks.some((deck) => deck.name === name)) {
      return alert(tx("alert.deckDuplicate"));
    }

    setUploadingCover(true);

    try {
      let coverImageUrl = "";

      if (coverFile) {
        coverImageUrl = await compressDeckCover(coverFile);
      }

      const newDeck: Deck = {
        name,
        language: newDeckLanguage,
        cards: [],
        folderId: newDeckFolderId ?? (newDeckLanguage === "fr-FR" ? folders.find(f => ["フランス語", "🇫🇷 フランス語", "French", "Français"].includes(f.name.trim()))?.id ?? null : null),
        coverImageUrl,
        order: decks.length,
      };

      await runTransaction(db, async (transaction) => {
        const ref = doc(db, "decks", name);
        const existing = await transaction.get(ref);
        if (existing.exists()) throw new Error("同じ名前のデッキがFirebaseに存在します。上書きしません。");
        transaction.set(ref, newDeck);
      });

      setDecks((previous) => [...previous, newDeck]);
      setCurrentDeck(name);
      setNewDeckName("");
      setNewDeckFolderId(null);
      setCoverFile(null);
      setCoverPreview("");

      alert(tx("alert.deckCreated"));
    } catch (error) {
      console.error("デッキ作成エラー:", error);
      alert(tx("alert.deckSaveFailed") + "\n" + String(error));
    } finally {
      setUploadingCover(false);
    }
  };

  const deleteDeck = async (deckName: string) => {
    if (!confirm(tx("alert.deckDeleteConfirm").replace("{name}", deckName))) {
      return;
    }

    try {
      await deleteDoc(doc(db, "decks", deckName));

      const updated = decks.filter((deck) => deck.name !== deckName);
      setDecks(updated);

      if (currentDeck === deckName) {
        setCurrentDeck(updated[0]?.name || "");
        setDeckOpen(false);
      }
    } catch (error) {
      console.error(error);
      alert(tx("alert.deckDeleteFailed"));
    }
  };

  const addFolder = async () => {
    const name = newFolderName.trim();

    if (!name) return alert(tx("alert.folderName"));

    const folder: Folder = {
      id: createId(),
      name,
      order: folders.length,
    };

    try {
      await persistFolder(folder);
      setFolders((previous) => [...previous, folder]);
      setNewFolderName("");
      alert(tx("alert.folderCreated"));
    } catch (error) {
      console.error(error);
      alert(tx("alert.folderSaveFailed"));
    }
  };

  const deleteFolder = async (folderId: string) => {
    if (!confirm(tx("alert.folderDeleteConfirm"))) return;

    try {
      await deleteDoc(doc(db, "folders", folderId));

      setFolders((previous) =>
        previous.filter((folder) => folder.id !== folderId)
      );

      const updatedDecks = decks.map((deck) =>
        deck.folderId === folderId
          ? { ...deck, folderId: null }
          : deck
      );

      setDecks(updatedDecks);

      await Promise.all(updatedDecks.map((deck) => persistDeck(deck)));
    } catch (error) {
      console.error(error);
      alert(tx("alert.folderDeleteFailed"));
    }
  };

  const moveDeck = async (deckName: string, folderId: string | null) => {
    const deck = decks.find((item) => item.name === deckName);
    if (!deck) return;

    const updatedDeck = { ...deck, folderId };

    try {
      await persistDeck(updatedDeck);
      updateDeckState(updatedDeck);
    } catch (error) {
      console.error(error);
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

        if (typeof result !== "string") {
          return alert(tx("alert.csvReadFailed"));
        }

        // RFC 4180形式の引用符付きCSVを解析（例文中のカンマ・改行にも対応）。
        const parseCSV = (text: string): string[][] => {
          const rows: string[][] = [];
          let row: string[] = [];
          let cell = "";
          let quoted = false;
          const input = text.replace(/^\uFEFF/, "");
          for (let i = 0; i < input.length; i += 1) {
            const ch = input[i];
            if (ch === '"') {
              if (quoted && input[i + 1] === '"') { cell += '"'; i += 1; }
              else quoted = !quoted;
            } else if (ch === "," && !quoted) {
              row.push(cell); cell = "";
            } else if ((ch === "\n" || ch === "\r") && !quoted) {
              if (ch === "\r" && input[i + 1] === "\n") i += 1;
              row.push(cell); cell = "";
              if (row.some((value) => value.trim())) rows.push(row);
              row = [];
            } else {
              cell += ch;
            }
          }
          row.push(cell);
          if (row.some((value) => value.trim())) rows.push(row);
          return rows;
        };
        const parsedRows = parseCSV(result);
        if (parsedRows.length === 0) return alert(tx("alert.csvEmpty"));

        const importedCards: Card[] = [];
        for (const parts of parsedRows) {
          // 分析用CSVのヘッダーはカードとして読み込まない。
          if (parts[0] === "front" && parts[1] === "pinyin" && parts[2] === "japanese") continue;
          const card: Card = {
            id: createId(),
            front: (parts[0] || "").trim(),
            pinyin: (parts[1] || "").trim(),
            japanese: (parts[2] || "").trim(),
            example: (parts[3] || "").trim(),
            exampleJapanese: (parts[4] || "").trim(),
            reviewCount: 0,
            correctCount: 0,
            incorrectCount: 0,
            normalIncorrectCount: 0,
            quickIncorrectCount: 0,
            correctStreak: 0,
            lastReviewedAt: 0,
            learningStatus: "unlearned",
            nextReviewAt: null,
          };
          if (card.front) importedCards.push(card);
        }

        if (importedCards.length === 0) {
          return alert(tx("alert.wordReadFailed"));
        }

        const deck = decks.find((item) => item.name === currentDeck);

        if (!deck) return alert(tx("alert.deckNotFound"));

        const updatedDeck: Deck = {
          ...deck,
          cards: [...deck.cards, ...importedCards],
        };

        await persistDeck(updatedDeck);
        updateDeckState(updatedDeck);

        alert(
          tx("alert.csvImported").replace(
            "{count}",
            String(importedCards.length)
          )
        );
      } catch (error) {
        console.error(error);
        alert("CSVエラー: " + String(error));
      }
    };

    reader.readAsText(file, "UTF-8");
  };

  const resetCardForm = () => {
    setShowCardForm(false);
    setEditingCardId(null);
    setCardFront("");
    setCardPinyin("");
    setCardJapanese("");
    setCardExample("");
    setCardExampleJapanese("");
  };

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
      const duplicate = deck.cards.some(
        (card) =>
          card.front.trim().toLowerCase() === front.toLowerCase()
      );

      if (
        duplicate &&
        !confirm(
          tx("alert.duplicateWord").replace("{word}", front)
        )
      ) {
        return;
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
        learningStatus: "unlearned",
        nextReviewAt: null,
      };

      updatedCards = [...deck.cards, newCard];
    }

    const updatedDeck: Deck = {
      ...deck,
      cards: updatedCards,
    };

    try {
      await persistDeck(updatedDeck);
      updateDeckState(updatedDeck);

      setStudyCards((previous) =>
        previous.map(
          (card) =>
            updatedCards.find((item) => item.id === card.id) || card
        )
      );

      resetCardForm();
    } catch (error) {
      console.error(error);
      alert(tx("alert.wordSaveFailed") + "\n" + String(error));
    }
  };

  const deleteCard = async (cardId: string) => {
    const deck = decks.find((item) => item.name === currentDeck);
    if (!deck) return;

    const card = deck.cards.find((item) => item.id === cardId);
    if (!card) return;

    if (
      !confirm(
        tx("alert.wordDeleteConfirm").replace("{word}", card.front)
      )
    ) {
      return;
    }

    const updatedDeck: Deck = {
      ...deck,
      cards: deck.cards.filter((item) => item.id !== cardId),
    };

    try {
      await persistDeck(updatedDeck);
      updateDeckState(updatedDeck);

      setStudyCards((previous) =>
        previous.filter((item) => item.id !== cardId)
      );
    } catch (error) {
      console.error(error);
      alert(tx("alert.wordDeleteFailed"));
    }
  };

  // 過去のカードにはモード別履歴がないため、旧履歴は「すべて」にのみ含めます。
  // 苦手克服の判定は既存の連続3回正解ルールを共通利用します。
  const getMistakeCards = (deck: Deck, scope: "all" | "normal" | "quick") =>
    deck.cards.filter((card) => {
      if ((card.correctStreak || 0) >= 3) return false;
      if (scope === "normal") return (card.normalIncorrectCount || 0) > 0;
      if (scope === "quick") return (card.quickIncorrectCount || 0) > 0;
      return (card.incorrectCount || 0) > 0 ||
        (card.normalIncorrectCount || 0) > 0 || (card.quickIncorrectCount || 0) > 0;
    });

  const downloadMistakesCSV = (deck: Deck, analysis: boolean, scope: "all" | "normal" | "quick" = "all") => {
    const mistakes = getMistakeCards(deck, scope);
    if (!mistakes.length) return alert("選択した条件に復習対象の苦手単語はありません。");
    const csvCell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
    // 学習用CSVは既存と同じ5列・ヘッダーなし。分析用にはモード別回数を追記。
    const rows = mistakes.map((card) => {
      const basic = [card.front, card.pinyin, card.japanese, card.example, card.exampleJapanese];
      const extra = analysis ? [card.incorrectCount || 0, card.correctCount || 0, card.reviewCount || 0, card.correctStreak || 0, card.lastReviewedAt ? new Date(card.lastReviewedAt).toISOString() : "", card.normalIncorrectCount ?? "", card.quickIncorrectCount ?? ""] : [];
      return [...basic, ...extra].map(csvCell).join(",");
    });
    if (analysis) rows.unshift(["front", "pinyin", "japanese", "example", "exampleJapanese", "incorrectCount", "correctCount", "reviewCount", "correctStreak", "lastReviewedAt", "normalIncorrectCount", "quickIncorrectCount"].map(csvCell).join(","));
    const blob = new Blob(["\uFEFF", rows.join("\r\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${deck.name.replace(/[\\/:*?"<>|]/g, "_")}-mistakes-${scope}-${analysis ? "analysis" : "study"}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const quickElapsedMs = () =>
    quickElapsedRef.current +
    (quickActiveStartedRef.current === null ? 0 : Date.now() - quickActiveStartedRef.current);

  const pauseChallenge = () => {
    if (quickModeRef.current === "normal" || quickPausedRef.current) return;
    const now = Date.now();
    if (quickDeadlineRef.current !== null) {
      quickRemainingRef.current = Math.max(0, quickDeadlineRef.current - now);
      quickDeadlineRef.current = null;
      setQuickRemainingMs(quickRemainingRef.current);
    }
    if (quickActiveStartedRef.current !== null) {
      quickElapsedRef.current += now - quickActiveStartedRef.current;
      quickActiveStartedRef.current = null;
    }
    quickPausedRef.current = true;
    setQuickPaused(true);
  };

  const resumeChallenge = () => {
    if (quickModeRef.current === "normal" || !quickPausedRef.current) return;
    quickActiveStartedRef.current = Date.now();
    if (quickModeRef.current !== "unlimited") {
      quickDeadlineRef.current = Date.now() + quickRemainingRef.current;
    }
    quickPausedRef.current = false;
    setQuickPaused(false);
  };

  useEffect(() => {
    if (!studyMode || activeChallengeMode === "normal") return;
    const tick = () => {
      if (quickPausedRef.current || finishLockRef.current) return;
      if (quickDeadlineRef.current !== null) {
        const remaining = Math.max(0, quickDeadlineRef.current - Date.now());
        setQuickRemainingMs(remaining);
        if (remaining === 0) void finishStudyRef.current();
      } else if (activeChallengeMode === "unlimited") {
        setQuickRemainingMs(quickElapsedMs());
      }
    };
    tick();
    const interval = window.setInterval(tick, 200);
    return () => window.clearInterval(interval);
  }, [studyMode, activeChallengeMode]);

  const startStudy = () => {
    if (!authReady || !auth.currentUser) {
      alert("XPを保存するため、ログイン状態を確認してから学習を開始してください。");
      return;
    }
    answerLockRef.current = false;

    const deck = decks.find((item) => item.name === currentDeck);

    if (!deck || deck.cards.length === 0) {
      return alert(tx("alert.noWords"));
    }

    const filteredCards =
      studyStatusFilter === "all"
        ? deck.cards
        : studyStatusFilter === "mistakes"
          ? deck.cards.filter((card) => (card.incorrectCount || 0) > 0 && (card.correctStreak || 0) < 3)
        : deck.cards.filter(
            (card) =>
              (card.learningStatus ?? "unlearned") === studyStatusFilter
          );

    if (filteredCards.length === 0) {
      const filterLabel =
        studyStatusFilter === "unlearned"
          ? "未学習"
          : studyStatusFilter === "mistakes"
            ? "間違えた単語"
          : studyStatusFilter === "weak"
            ? "苦手"
            : studyStatusFilter === "vague"
              ? "うろ覚え"
              : "対象";
      alert(`${filterLabel}のカードはありません。`);
      return;
    }

    const prioritizedCards = prioritizeWeakCards(filteredCards);
    const selectedCards =
      challengeMode !== "normal" ? prioritizedCards : studyLimit === "all"
        ? prioritizedCards
        : prioritizedCards.slice(0, studyLimit);

    finishLockRef.current = false;
    studyCountsRef.current = { correct: 0, incorrect: 0 };
    deckSaveErrorsRef.current = [];
    setRewardSaveStatus("skipped");
    setRewardSaveMessage("");
    setRewardEarnedXp(0);
    setRewardEarnedCoins(0);
    answerHistoryRef.current = [];
    quickModeRef.current = challengeMode;
    setActiveChallengeMode(challengeMode);
    const now = Date.now();
    const limitMs = challengeMode === "50" ? 50000 : challengeMode === "100" ? 100000 : 0;
    quickRemainingRef.current = limitMs;
    quickDeadlineRef.current = limitMs ? now + limitMs : null;
    quickActiveStartedRef.current = challengeMode === "normal" ? null : now;
    quickElapsedRef.current = 0;
    quickPausedRef.current = false;
    setQuickPaused(false);
    setQuickRemainingMs(limitMs);
    setStudyCards(selectedCards);
    setStudyIndex(0);
    setShowAnswer(false);
    setStudyCorrect(0);
    setStudyIncorrect(0);
    studyStartRef.current = now;
    sessionIdRef.current = createId();
    sessionUidRef.current = auth.currentUser.uid;
    retryRewardRef.current = null;
    setStudyMode(true);
  };

  const saveStudyRecord = async (
    correctCount: number,
    incorrectCount: number
  ) => {
    const studyStartTime = studyStartRef.current;
    const studySessionId = sessionIdRef.current;
    if (studyStartTime === null || studySessionId === null) return;

    const answered = correctCount + incorrectCount;
    if (answered === 0) return;

    const now = Date.now();
    const dateObject = new Date(now);

    const date = [
      dateObject.getFullYear(),
      String(dateObject.getMonth() + 1).padStart(2, "0"),
      String(dateObject.getDate()).padStart(2, "0"),
    ].join("-");

    const time = dateObject.toLocaleTimeString(language, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const record: StudyRecord = {
      id: studySessionId,
      date,
      time,
      startedAt: studyStartTime,
      deckName: currentDeck,
      answered,
      correct: correctCount,
      incorrect: incorrectCount,
      duration: quickModeRef.current === "normal"
        ? Math.max(0, Math.floor((now - studyStartTime) / 1000))
        : Math.max(0, Math.floor(quickElapsedMs() / 1000)),
    };

    try {
      await setDoc(doc(db, "studyRecords", record.id), record);

      setStudyRecords((previous) =>
        [record, ...previous.filter((item) => item.id !== record.id)].sort(
          (a, b) => (b.startedAt || 0) - (a.startedAt || 0)
        )
      );
    } catch (error) {
      console.error("学習記録保存エラー:", error);
      alert(tx("alert.studyRecordSaveFailed"));
    }
  };

  const finishStudy = async () => {
    if (finishLockRef.current) return;
    finishLockRef.current = true;
    if (quickActiveStartedRef.current !== null) {
      quickElapsedRef.current += Date.now() - quickActiveStartedRef.current;
      quickActiveStartedRef.current = null;
    }
    quickDeadlineRef.current = null;
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    await deckSaveQueueRef.current;

    // Reactのstate反映を待たず、最後の回答まで確実に集計する。
    const { correct: finalCorrect, incorrect: finalIncorrect } = studyCountsRef.current;
    const total = finalCorrect + finalIncorrect;

    const rate =
      total > 0
        ? ((finalCorrect / total) * 100).toFixed(1)
        : "0.0";

    const studyStartTime = studyStartRef.current;
    const studySessionId = sessionIdRef.current;
    const sessionUid = sessionUidRef.current;
    const durationSec = quickModeRef.current === "normal"
      ? (studyStartTime ? Math.max(0, Math.floor((Date.now() - studyStartTime) / 1000)) : 0)
      : Math.max(0, Math.floor(quickElapsedMs() / 1000));

    await saveStudyRecord(finalCorrect, finalIncorrect);
    // Anki Lifeへの報酬連携
const saveReward = async () => {
if (rewardBusyRef.current) return;
rewardBusyRef.current = true;
setRewardBusy(true);
try {
if (sessionUid && auth.currentUser?.uid === sessionUid && studySessionId && total > 0) {
  try {
    const now = new Date();
    const today = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");

    const lifeStateRef = doc(
      db,
      "users",
      sessionUid,
      "ankiLife",
      "state"
    );

    const rewardEventRef = doc(
      db,
      "users",
      sessionUid,
      "ankiLife",
      "state",
      "rewardEvents",
      studySessionId
    );

    const rewardResult = await runTransaction(db, async (transaction) => {
      const eventSnapshot = await transaction.get(rewardEventRef);

      // 同じ学習セッションの二重付与を防止
      if (eventSnapshot.exists()) return { alreadyGranted: true, xp: Number(eventSnapshot.data()?.xp || 0), coins: Number(eventSnapshot.data()?.coins || 0) };

      const stateSnapshot = await transaction.get(lifeStateRef);
      const saved = stateSnapshot.exists()
        ? stateSnapshot.data()
        : {};

      const previousCoins = Number(saved.coins || 0);
      const previousXp = Number(saved.xp || 0);
      const previousSessions = Number(saved.totalSessions || 0);
      const previousCards = Number(saved.totalCards || 0);

      const sameDay = saved.lastStudyDate === today;
      const sessionsToday = sameDay
        ? Number(saved.sessionsToday || 0)
        : 0;

      // 何度も戻ってきたことを評価する
      const returnBonus = sessionsToday >= 1 ? 20 : 0;
      const earnedCoins = total * 5 + returnBonus;
      const earnedXp = total * 10;

      const nextXp = previousXp + earnedXp;

      transaction.set(
        lifeStateRef,
        {
          coins: previousCoins + earnedCoins,
          xp: nextXp,
          petName: saved.petName || "まめ",
          petLevel: Math.floor(nextXp / 100) + 1,
          islandLevel: Math.floor(nextXp / 500) + 1,
          totalSessions: previousSessions + 1,
          totalCards: previousCards + total,
          lastStudyDate: today,
          sessionsToday: sessionsToday + 1,
          rewards: Array.isArray(saved.rewards) ? saved.rewards : [],
          items: Array.isArray(saved.items) ? saved.items : [],
          updatedAt: Date.now(),
        },
        { merge: true }
      );

      transaction.set(rewardEventRef, {
        sessionId: studySessionId,
        deckName: currentDeck,
        answered: total,
        correct: finalCorrect,
        incorrect: finalIncorrect,
        coins: earnedCoins,
        xp: earnedXp,
        returnBonus,
        mode: quickModeRef.current,
        durationSec,
        // 回答順を保持。未回答カードは記録しない。
        cards: answerHistoryRef.current.map(({ card, correct }, index) => ({
          order: index + 1,
          cardId: String(card.id ?? ""),
          front: String(card.front ?? ""),
          pinyin: String(card.pinyin ?? ""),
          japanese: String(card.japanese ?? ""),
          example: String(card.example ?? ""),
          exampleJapanese: String(card.exampleJapanese ?? ""),
          correct,
        })),
        createdAt: Date.now(),
      });
      return { alreadyGranted: false, xp: earnedXp, coins: earnedCoins };
    });
    setRewardSaveStatus("success");
    setRewardEarnedXp(rewardResult.xp);
    setRewardEarnedCoins(rewardResult.coins);
    setRewardSaveMessage(rewardResult.alreadyGranted ? "この学習のXP・コインは付与済みです（二重付与なし）。" : "Anki Lifeへの保存が完了しました。");
  } catch (error) {
    console.error("Anki Life報酬付与エラー:", error);
    setRewardSaveStatus("failed");
    setRewardSaveMessage(`XP・コインの保存に失敗しました。Firebaseの認証・Firestoreルール・通信を確認してください。詳細: ${error instanceof Error ? error.message : String(error)}`);
  }
} else if (total > 0) {
  setRewardSaveStatus("failed");
  setRewardSaveMessage("学習開始時と同じアカウントでログインして再保存してください。セッションIDがない場合は新しい学習を開始してください。");
}
 } finally {
  rewardBusyRef.current = false;
  setRewardBusy(false);
 }
};
retryRewardRef.current = saveReward;
await saveReward();
if (deckSaveErrorsRef.current.length > 0) {
  setRewardSaveMessage((previous) => `${previous} カード保存にも失敗しました: ${deckSaveErrorsRef.current[0]}`);
}

    setSummaryData({
      total,
      correct: finalCorrect,
      incorrect: finalIncorrect,
      rate,
      durationSec,
      missed: answerHistoryRef.current.filter((entry) => !entry.correct).map((entry) => entry.card),
      remembered: answerHistoryRef.current.filter((entry) => entry.correct).map((entry) => entry.card),
    });

    setShowSummaryModal(true);
  };

  finishStudyRef.current = finishStudy;

  const closeSummaryModal = () => {
    if (rewardBusyRef.current) return;
    if (rewardSaveStatus === "failed" && !confirm("XPが未保存です。結果画面を閉じると再保存できなくなります。閉じますか？")) return;
    quickDeadlineRef.current = null;
    quickActiveStartedRef.current = null;
    quickModeRef.current = "normal";
    setActiveChallengeMode("normal");
    setShowSummaryModal(false);
    setSummaryData(null);
    setStudyMode(false);
    setShowAnswer(false);
    setStudyCards([]);
    setStudyIndex(0);
    setStudyCorrect(0);
    setStudyIncorrect(0);
    studyStartRef.current = null;
    sessionIdRef.current = null;
    sessionUidRef.current = null;
    retryRewardRef.current = null;
    resetCardForm();
  };

  const updateLearningStatus = async (
    cardId: string,
    status: LearningStatus
  ) => {
    const deck = decks.find((item) => item.name === currentDeck);
    if (!deck) return;

    const selectedStatus = statusOptions.find(
      (item) => item.value === status
    );

    const nextReviewAt = selectedStatus
      ? Date.now() + selectedStatus.days * 24 * 60 * 60 * 1000
      : null;

    const updatedCards = deck.cards.map((card) =>
      card.id === cardId
        ? { ...card, learningStatus: status, nextReviewAt }
        : card
    );

    const updatedDeck: Deck = {
      ...deck,
      cards: updatedCards,
    };

    updateDeckState(updatedDeck);

    setStudyCards((previous) =>
      previous.map((card) =>
        card.id === cardId
          ? { ...card, learningStatus: status, nextReviewAt }
          : card
      )
    );

    try {
      await persistDeck(updatedDeck);
    } catch (error) {
      console.error("暗記レベル保存エラー:", error);
      alert("暗記レベルを保存できませんでした。\n" + String(error));
    }
  };

  const deleteCurrentStudyCard = async () => {
    const card = studyCards[studyIndex];
    if (!card) return;

    if (
      !confirm(
        `「${card.front}」を削除しますか？\nこのカードはデッキからも削除されます。`
      )
    ) {
      return;
    }

    const deck = decks.find((item) => item.name === currentDeck);
    if (!deck) return;

    const updatedDeck: Deck = {
      ...deck,
      cards: deck.cards.filter((item) => item.id !== card.id),
    };

    const updatedStudyCards = studyCards.filter(
      (item) => item.id !== card.id
    );

    try {
      await persistDeck(updatedDeck);
      updateDeckState(updatedDeck);

      setStudyCards(updatedStudyCards);
      setShowAnswer(false);
      resetCardForm();

      if (updatedStudyCards.length === 0) {
        await finishStudy();
        return;
      }

      if (studyIndex >= updatedStudyCards.length) {
        setStudyIndex(updatedStudyCards.length - 1);
      }
    } catch (error) {
      console.error(error);
      alert("カードの削除に失敗しました。\n" + String(error));
    }
  };

  const answerCard = (
    correct: boolean,
    learningStatus?: LearningStatus,
    reviewDays?: number
  ) => {
    if (answerLockRef.current || finishLockRef.current || quickPausedRef.current) return;
    if (quickDeadlineRef.current !== null && Date.now() >= quickDeadlineRef.current) {
      void finishStudyRef.current();
      return;
    }

    const currentCard = studyCards[studyIndex];
    if (!currentCard) return;

    answerLockRef.current = true;

    answerHistoryRef.current.push({ card: currentCard, correct });

    const nextCorrect = studyCountsRef.current.correct + (correct ? 1 : 0);
    const nextIncorrect = studyCountsRef.current.incorrect + (correct ? 0 : 1);
    studyCountsRef.current = { correct: nextCorrect, incorrect: nextIncorrect };

    setStudyCorrect(nextCorrect);
    setStudyIncorrect(nextIncorrect);

    const now = Date.now();

    const updatedCard: Card = {
      ...currentCard,
      reviewCount: (currentCard.reviewCount || 0) + 1,
      correctCount:
        (currentCard.correctCount || 0) + (correct ? 1 : 0),
      incorrectCount:
        (currentCard.incorrectCount || 0) + (correct ? 0 : 1),
      normalIncorrectCount: (currentCard.normalIncorrectCount || 0) + (!correct && quickModeRef.current === "normal" ? 1 : 0),
      quickIncorrectCount: (currentCard.quickIncorrectCount || 0) + (!correct && quickModeRef.current !== "normal" ? 1 : 0),
      correctStreak: correct ? (currentCard.correctStreak || 0) + 1 : 0,
      lastReviewedAt: now,
      lastResult: correct ? "correct" : "incorrect",
      learningStatus: learningStatus ?? currentCard.learningStatus,
      nextReviewAt:
        reviewDays !== undefined
          ? now + reviewDays * 24 * 60 * 60 * 1000
          : currentCard.nextReviewAt ?? null,
    };

    const updatedStudyCards = studyCards.map((card, index) =>
      index === studyIndex ? updatedCard : card
    );

    setStudyCards(updatedStudyCards);

    const deck = decks.find((item) => item.name === currentDeck);

    if (deck) {
      const updatedDeck: Deck = {
        ...deck,
        cards: deck.cards.map((card) =>
          card.id === updatedCard.id ? updatedCard : card
        ),
      };

      updateDeckState(updatedDeck);

      deckSaveQueueRef.current = deckSaveQueueRef.current.then(
        async () => {
          try {
            await persistDeck(updatedDeck);
          } catch (error) {
            console.error("カード学習記録保存エラー:", error);
            deckSaveErrorsRef.current.push(error instanceof Error ? error.message : String(error));
          }
        }
      );
    }

    if (studyIndex < updatedStudyCards.length - 1) {
      setStudyIndex((previous) => previous + 1);
      setShowAnswer(false);
      return;
    }

    void (async () => {
      await deckSaveQueueRef.current;
      await finishStudy();
    })();
  };

  const currentCard = studyCards[studyIndex];

  if (authReady && !authUser) {
    return (
      <main style={{ maxWidth: 600, margin: "40px auto", padding: 24 }}>
        <h2>ログインが必要です</h2>
        <p>デッキは削除されていません。この端末でアプリのログイン操作を行ってください。</p>
        <p>ログイン後に一覧を再読み込みしてください。</p>
        <button style={primaryButtonStyle} onClick={() => window.location.reload()}>再読み込み</button>
      </main>
    );
  }

  if (loadError && !loading) {
    return (
      <main style={{ maxWidth: 600, margin: "40px auto", padding: 24 }}>
        <h2>データを読み込めませんでした</h2>
        <p>既存データは初期化していません。通信とログイン状態を確認してください。</p>
        <p style={{ overflowWrap: "anywhere" }}>{loadError}</p>
        <button style={primaryButtonStyle} onClick={() => { setLoading(true); setLoadAttempt(n => n + 1); }}>再試行</button>
      </main>
    );
  }

  if (!authReady || loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#FBFBFD",
          color: "#8E8E93",
        }}
      >
        データを読み込んでいます…
      </main>
    );
  }

  if (showThemeSettings) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#F5F7FC",
          padding: "30px 20px",
          color: "#26365D",
        }}
      >
        <section
          style={{
            maxWidth: "800px",
            margin: "0 auto",
            background: "#FFFFFF",
            borderRadius: "20px",
            padding: "28px",
            border: "1px solid #E6EBF5",
          }}
        >
          <h1 style={{ fontSize: "26px", marginTop: 0 }}>
            {tx("color.title")}
          </h1>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(100px,1fr))",
              gap: "12px",
            }}
          >
            {presets.map((preset) => (
              <button
                key={preset.color}
                onClick={() => setColor(preset.color)}
                style={{
                  padding: "12px",
                  borderRadius: "12px",
                  border:
                    color === preset.color
                      ? "2px solid #26365D"
                      : "1px solid #E5E5EA",
                  background: "#FFFFFF",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    height: "42px",
                    borderRadius: "10px",
                    background: preset.color,
                    marginBottom: "8px",
                  }}
                />
                <span style={{ fontSize: "13px" }}>{preset.name}</span>
              </button>
            ))}
          </div>

          <div style={{ marginTop: "24px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: 600,
              }}
            >
              カラーバー（自由選択）
            </label>

            <div
              style={{
                display: "flex",
                gap: "12px",
                alignItems: "center",
              }}
            >
              <input
                type="color"
                value={color}
                onChange={(event) => setColor(event.target.value)}
                style={{
                  width: "80px",
                  height: "50px",
                  border: "1px solid #E5E5EA",
                  borderRadius: "8px",
                  cursor: "pointer",
                  background: "none",
                }}
              />

              <input
                type="text"
                value={color}
                onChange={(event) => setColor(event.target.value)}
                style={{ ...inputStyle, flex: 1, marginBottom: 0 }}
                placeholder="#718675"
              />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              justifyContent: "flex-end",
              marginTop: "24px",
            }}
          >
            <button
              style={secondaryButtonStyle}
              onClick={() => {
                setColor(savedColor);
                setShowThemeSettings(false);
              }}
            >
              キャンセル
            </button>

            <button style={primaryButtonStyle} onClick={saveColor}>
              保存する
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (showSummaryModal && summaryData) {
    const summary = summaryData;
    return (
      <main style={{ minHeight: "100vh", background: "#FBFBFD", padding: "32px 16px", fontFamily: "sans-serif", color: "#1D1D1F" }}>
        <section style={{ maxWidth: 680, margin: "0 auto", padding: 24, background: "white", borderRadius: 20, border: "1px solid #E5E5EA" }}>
          <div style={{ fontSize: 13, color: "#456B55", fontWeight: 700, letterSpacing: 1 }}>STUDY RESULTS</div>
          <h1 style={{ margin: "8px 0 4px", fontSize: 26 }}>学習お疲れ様でした！</h1>
          <p style={{ color: "#777", marginTop: 0 }}>結果は「デッキ一覧に戻る」を押すまで表示されます。</p>
          <div style={{ padding: 20, borderRadius: 16, background: "#F1F5F1", textAlign: "center", margin: "20px 0" }}>
            <div style={{ fontSize: 13, color: "#456B55" }}>正答率</div>
            <strong style={{ fontSize: 48, color: "#345640", fontVariantNumeric: "tabular-nums" }}>{summary.rate}%</strong>
            <div style={{ height: 9, background: "#DCE6DD", borderRadius: 9, overflow: "hidden", marginTop: 12 }}>
              <div style={{ width: `${summary.rate}%`, height: "100%", background: "#456B55" }} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
            {[
              ["回答数", `${summary.total} 問`],
              ["正解", `${summary.correct} 問`],
              ["間違えた", `${summary.incorrect} 問`],
              ["学習時間", `${summary.durationSec} 秒`],
            ].map(([label, value]) => (
              <div key={label} style={{ padding: 16, border: "1px solid #E5E5EA", borderRadius: 12 }}>
                <div style={{ color: "#777", fontSize: 13 }}>{label}</div>
                <strong style={{ fontSize: 23 }}>{value}</strong>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 18, padding: 16, borderRadius: 12, background: "#F1F5F1", border: "1px solid #C9DCCC" }}>
            <div style={{ color: "#456B55", fontSize: 13, fontWeight: 700 }}>今回のタイムアタック・学習で獲得したXP</div>
            <strong style={{ display: "block", marginTop: 5, fontSize: 30, color: "#345640" }}>
              {rewardSaveStatus === "success" ? `+${rewardEarnedXp} XP` : rewardSaveStatus === "failed" ? `獲得予定 +${summary.total * 10} XP（未保存）` : "+0 XP"}
            </strong>
            <div style={{ fontSize: 12, color: "#66766A", marginTop: 4 }}>
              {rewardSaveStatus === "success" ? `Anki Lifeに反映済み / +${rewardEarnedCoins} コイン` : rewardSaveStatus === "failed" ? "Firebaseへの保存に失敗したため、まだ加算されていません" : "報酬なし"}
            </div>
          </div>
          <div role="status" style={{ marginTop: 12, padding: 14, borderRadius: 12, background: rewardSaveStatus === "success" ? "#F1F5F1" : "#FFF1EE", border: `1px solid ${rewardSaveStatus === "success" ? "#C9DCCC" : "#F0C6BD"}` }}>
            <strong>{rewardSaveStatus === "success" ? `⭐ +${rewardEarnedXp} XP / 🪙 +${rewardEarnedCoins} コイン` : rewardSaveStatus === "failed" ? "⚠️ Anki Lifeへの報酬保存に失敗" : "報酬なし"}</strong>
            <div style={{ marginTop: 5, fontSize: 13, whiteSpace: "pre-wrap" }}>{rewardSaveMessage || "回答数が0件のため報酬はありません。"}</div>
          </div>
          {rewardSaveStatus === "failed" && <button type="button" disabled={rewardBusy} onClick={() => void retryRewardRef.current?.()} style={{ ...primaryButtonStyle, marginTop: 12 }}>{rewardBusy ? "保存中…" : "XP・コインを再保存"}</button>}
          <h2 style={{ marginTop: 28, fontSize: 19 }}>間違えた単語 ({summary.missed.length}件)</h2>
          {summary.missed.length === 0 ? (
            <p style={{ color: "#456B55" }}>今回間違えた単語はありません！</p>
          ) : (
            <div style={{ maxHeight: 320, overflowY: "auto", border: "1px solid #E5E5EA", borderRadius: 12 }}>
              {summary.missed.map((card, index) => (
                <div key={`${card.id}-${index}`} style={{ padding: "12px 14px", borderBottom: index === summary.missed.length - 1 ? "none" : "1px solid #EEE" }}>
                  <strong>{card.front}</strong>
                  {card.pinyin && <span style={{ marginLeft: 10, color: "#777", fontSize: 13 }}>{card.pinyin}</span>}
                  <div style={{ marginTop: 4 }}>{card.japanese}</div>
                  {card.example && <div style={{ marginTop: 6, color: "#777", fontSize: 13 }}>{card.example}</div>}
                  {card.exampleJapanese && <div style={{ color: "#777", fontSize: 13 }}>{card.exampleJapanese}</div>}
                </div>
              ))}
            </div>
          )}
          <button type="button" onClick={closeSummaryModal} style={{ ...primaryButtonStyle, width: "100%", marginTop: 24, padding: 15 }}>
            デッキ一覧に戻る
          </button>
        </section>
      </main>
    );
  }

  if (studyMode) {
    if (!currentCard) return null;

    const currentAnswered = studyCorrect + studyIncorrect;
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#FBFBFD",
          color: "#1D1D1F",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "30px 16px",
          boxSizing: "border-box",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "620px",
            background: "#FFFFFF",
            border: "1px solid #E5E5EA",
            borderRadius: "20px",
            padding: "24px",
            boxSizing: "border-box",
          }}
        >
          {activeChallengeMode !== "normal" && (
            <div style={{ textAlign: "center", marginBottom: 18 }}>
              <div style={{ fontSize: 13, color: "#718675", fontWeight: 700 }}>QUICK CHALLENGE</div>
              <div aria-live="off" style={{ fontSize: 36, fontVariantNumeric: "tabular-nums", fontWeight: 750, margin: "8px 0" }}>
                {Math.floor(quickRemainingMs / 60000).toString().padStart(2, "0")}:
                {Math.floor((quickRemainingMs % 60000) / 1000).toString().padStart(2, "0")}
              </div>
              <button type="button" style={secondaryButtonStyle} onClick={quickPaused ? resumeChallenge : pauseChallenge}>
                {quickPaused ? "▶ 再開" : "Ⅱ 一時停止"}
              </button>
              {quickPaused && <p style={{ color: "#718675" }}>一時停止中です</p>}
            </div>
          )}
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
                border: "none",
                background: "#F2F2F7",
                borderRadius: "9px",
                padding: "9px 13px",
                color: "#68686D",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {tx("study.quit")}
            </button>

            <span
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "#8E8E93",
              }}
            >
              {studyIndex + 1} / {studyCards.length}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              gap: "18px",
              flexWrap: "wrap",
              marginBottom: "18px",
              padding: "13px 16px",
              background: "#FAFAFC",
              border: "1px solid #F0F0F2",
              borderRadius: "12px",
              fontSize: "13px",
              color: "#8E8E93",
            }}
          >
            <span>
              正解:{" "}
              <strong style={{ color: "#2E7D32" }}>
                {studyCorrect}
              </strong>
            </span>
            <span>
              不正解:{" "}
              <strong style={{ color: "#C62828" }}>
                {studyIncorrect}
              </strong>
            </span>
            <span>
              回答:{" "}
              <strong style={{ color: "#1D1D1F" }}>
                {currentAnswered}
              </strong>
            </span>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: "8px",
              marginTop: "12px",
              marginBottom: "10px",
            }}
          >
            <button
              onClick={() => openEditCard(currentCard)}
              style={{
                padding: "7px 15px",
                borderRadius: "8px",
                border: "1px solid #E5E5EA",
                background: "#FFFFFF",
                color: "#55555B",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              編集
            </button>

            <button
              onClick={deleteCurrentStudyCard}
              style={{
                padding: "7px 15px",
                borderRadius: "8px",
                border: "1px solid #F0DADA",
                background: "#FFFFFF",
                color: "#B46A6A",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              削除
            </button>
          </div>

          <div
            onClick={() => setShowAnswer((previous) => !previous)}
            style={{
              minHeight: "290px",
              padding: "36px 22px",
              background: "#FAFAFC",
              border: "1px solid #E5E5EA",
              borderRadius: "16px",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              textAlign: "center",
              boxSizing: "border-box",
            }}
          >
            {!showAnswer ? (
              <>
                <div
                  style={{
                    fontSize: "42px",
                    fontWeight: 700,
                    marginBottom: "24px",
                    wordBreak: "break-word",
                  }}
                >
                  {currentCard.front}
                </div>

                <div style={{ fontSize: "14px", color: "#8E8E93" }}>
                  {tx("study.tap")}
                </div>
              </>
            ) : (
              <>
                <div
                  style={{
                    fontSize: "34px",
                    fontWeight: 700,
                    marginBottom: "12px",
                    wordBreak: "break-word",
                  }}
                >
                  {currentCard.front}
                </div>

                <div
                  style={{
                    fontSize: "19px",
                    color: "#8E8E93",
                    marginBottom: "12px",
                  }}
                >
                  {currentCard.pinyin || tx("study.noReading")}
                </div>

                <div
                  style={{
                    fontSize: "23px",
                    fontWeight: 600,
                    color: "#2C5282",
                    marginBottom: "18px",
                  }}
                >
                  {currentCard.japanese || tx("study.noTranslation")}
                </div>

                {currentCard.example && (
                  <div style={{ fontSize: "15px", marginBottom: "7px" }}>
                    {currentCard.example}
                  </div>
                )}

                {currentCard.exampleJapanese && (
                  <div style={{ fontSize: "14px", color: "#8E8E93" }}>
                    {currentCard.exampleJapanese}
                  </div>
                )}

                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    speakWord(currentCard.front);
                  }}
                  style={{
                    marginTop: "20px",
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    border: "1px solid #E5E5EA",
                    background: "#FFFFFF",
                    cursor: "pointer",
                    fontSize: "18px",
                  }}
                >
                  🔊
                </button>
              </>
            )}
          </div>

          {showCardForm && (
            <div
              style={{
                marginTop: "16px",
                padding: "18px",
                border: "1px solid #E5E5EA",
                borderRadius: "14px",
                background: "#FFFFFF",
              }}
            >
              <h3 style={{ margin: "0 0 14px", fontSize: "17px" }}>
                カードを編集
              </h3>

              <input
                placeholder="単語・表面"
                value={cardFront}
                onChange={(event) => setCardFront(event.target.value)}
                style={inputStyle}
              />

              <input
                placeholder="ピンイン・読み方"
                value={cardPinyin}
                onChange={(event) => setCardPinyin(event.target.value)}
                style={inputStyle}
              />

              <input
                placeholder="日本語訳"
                value={cardJapanese}
                onChange={(event) => setCardJapanese(event.target.value)}
                style={inputStyle}
              />

              <input
                placeholder="例文"
                value={cardExample}
                onChange={(event) => setCardExample(event.target.value)}
                style={inputStyle}
              />

              <input
                placeholder="例文の日本語訳"
                value={cardExampleJapanese}
                onChange={(event) =>
                  setCardExampleJapanese(event.target.value)
                }
                style={inputStyle}
              />

              {editingCardId && (
                <div style={{ margin: "8px 0 16px", padding: "14px", background: "#FAFAFC", border: "1px solid #E5E5EA", borderRadius: "12px" }}>
                  <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "9px" }}>暗記レベルを変更</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "7px" }}>
                    {[
                      { value: "unlearned" as LearningStatus, label: "未学習", days: null },
                      { value: "weak" as LearningStatus, label: "苦手", days: 1 },
                      { value: "vague" as LearningStatus, label: "うろ覚え", days: 3 },
                      { value: "learned" as LearningStatus, label: "覚えた", days: 5 },
                      { value: "perfect" as LearningStatus, label: "完璧", days: 7 },
                    ].map((status) => (
                      <button
                        key={status.value}
                        type="button"
                        onClick={() => updateLearningStatus(editingCardId, status.value)}
                        style={{
                          padding: "10px 8px",
                          borderRadius: "9px",
                          border: currentCard.learningStatus === status.value ? "2px solid #718675" : "1px solid #E5E5EA",
                          background: currentCard.learningStatus === status.value ? "#F1F5F1" : "#FFFFFF",
                          color: "#1D1D1F",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        {status.label}{status.days ? ` · ${status.days}日後` : ""}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: "8px" }}>

                <a
  href="/anki-life"
  style={{
    ...secondaryButtonStyle,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    background: "#EDF4EA",
    borderColor: "#D7E5D4",
    color: "#49664F",
  }}
>
  🐣 Anki Life
</a>
                <button
                  onClick={saveCard}
                  style={{ ...primaryButtonStyle, flex: 1 }}
                >
                  保存
                </button>

                <button
                  onClick={resetCardForm}
                  style={{ ...secondaryButtonStyle, flex: 1 }}
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}

          {showAnswer && answerMode === "2" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "10px",
                marginTop: "18px",
              }}
            >
              <button
                onClick={() => answerCard(false, "weak", 1)}
                style={{
                  padding: "16px 10px",
                  borderRadius: "12px",
                  border: "1px solid #E28484",
                  background: "#FDF2F2",
                  color: "#A93226",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                ✕ 不正解
                <span style={{ display: "block", fontSize: "11px", fontWeight: 400, marginTop: "4px" }}>翌日復習</span>
              </button>

              <button
                onClick={() => answerCard(true, "learned", 5)}
                style={{
                  padding: "16px 10px",
                  borderRadius: "12px",
                  border: "1px solid #82E0AA",
                  background: "#E8F8F5",
                  color: "#196F3D",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                ◯ 正解
                <span style={{ display: "block", fontSize: "11px", fontWeight: 400, marginTop: "4px" }}>5日後復習</span>
              </button>
            </div>
          )}

          {showAnswer && answerMode === "4" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "10px",
                marginTop: "18px",
              }}
            >
              {statusOptions.map((status) => (
                <button
                  key={status.value}
                  type="button"
                  onClick={() =>
                    answerCard(
                      status.value === "learned" || status.value === "perfect",
                      status.value,
                      status.days
                    )
                  }
                  style={{
                    padding: "15px 10px",
                    borderRadius: "12px",
                    border: `1px solid ${status.border}`,
                    background: status.background,
                    color: status.color,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {status.label}
                  <span style={{ display: "block", fontSize: "11px", fontWeight: 400, marginTop: "4px" }}>
                    {status.days}日後に復習
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>


      </main>
    );
  }

  if (deckOpen) {
    const deck = decks.find((item) => item.name === currentDeck);
    if (!deck) return null;

    const normalizedSearch = cardSearch.trim().toLowerCase();

    const filteredCards =
      normalizedSearch === ""
        ? deck.cards
        : deck.cards.filter((card) =>
            [
              card.front,
              card.pinyin,
              card.japanese,
              card.example,
              card.exampleJapanese,
            ]
              .join(" ")
              .toLowerCase()
              .includes(normalizedSearch)
          );

    return (
      <main
        style={{
          maxWidth: "680px",
          margin: "30px auto",
          padding: "20px",
          fontFamily: "sans-serif",
          color: "#1D1D1F",
        }}
      >
        <button
          onClick={() => {
            setDeckOpen(false);
            setCardSearch("");
            resetCardForm();
          }}
          style={{ ...secondaryButtonStyle, marginBottom: "22px" }}
        >
          ‹ {tx("deck.back")}
        </button>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              minWidth: 0,
            }}
          >
            {editCoverPreview || deck.coverImageUrl ? (
              <img
                src={editCoverPreview || deck.coverImageUrl || ""}
                alt=""
                style={{
                  width: "76px",
                  height: "76px",
                  objectFit: "cover",
                  borderRadius: "13px",
                  border: "1px solid #E5E5EA",
                }}
              />
            ) : (
              <div
                style={{
                  width: "76px",
                  height: "76px",
                  borderRadius: "13px",
                  background: "#F1F2EF",
                  display: "grid",
                  placeItems: "center",
                  color: "#8B968C",
                  fontSize: "26px",
                }}
              >
                ▤
              </div>
            )}

            <div style={{ minWidth: 0 }}>
              <h1
                style={{
                  fontSize: "25px",
                  fontWeight: 700,
                  margin: 0,
                  overflowWrap: "anywhere",
                }}
              >
                {currentDeck}
              </h1>

              <p
                style={{
                  color: "#8E8E93",
                  fontSize: "14px",
                  marginTop: "5px",
                }}
              >
                {deck.cards.length} {tx("deck.cards")}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowThemeSettings(true)}
            style={secondaryButtonStyle}
          >
            テーマ
          </button>
        </div>

        <div
          style={{
            marginTop: "16px",
            padding: "14px",
            background: "#FAFAFC",
            border: "1px solid #E5E5EA",
            borderRadius: "12px",
          }}
        >
          <p
            style={{
              fontSize: "13px",
              fontWeight: 600,
              margin: "0 0 8px",
            }}
          >
            デッキアイコンの変更
          </p>

          <input
            ref={editImageInputRef}
            type="file"
            accept="image/*"
            onChange={updateExistingDeckCover}
            style={{ display: "none" }}
          />

          <input
            ref={editCameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={updateExistingDeckCover}
            style={{ display: "none" }}
          />

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              type="button"
              disabled={uploadingCover}
              onClick={() => editImageInputRef.current?.click()}
              style={{
                ...secondaryButtonStyle,
                padding: "8px 12px",
                fontSize: "12px",
              }}
            >
              写真を選択
            </button>

            <button
              type="button"
              disabled={uploadingCover}
              onClick={() => editCameraInputRef.current?.click()}
              style={{
                ...secondaryButtonStyle,
                padding: "8px 12px",
                fontSize: "12px",
              }}
            >
              カメラで撮影
            </button>
          </div>
          {uploadingCover && (
            <p style={{ margin: "10px 0 0", fontSize: "12px", color: "#718675" }}>
              写真を保存しています…
            </p>
          )}
        </div>

        <div style={{ marginTop: "16px" }}>
          <label
            style={{
              display: "block",
              fontSize: "12px",
              color: "#8E8E93",
              marginBottom: "6px",
            }}
          >
            音声の言語
          </label>

          <select
            value={speechLanguage}
            onChange={(event) =>
              changeSpeechLanguage(event.target.value)
            }
            style={inputStyle}
          >
            {languageOptions.map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <section
          style={{
            marginTop: "18px",
            padding: "16px",
            border: "1px solid #E5E5EA",
            borderRadius: "14px",
            background: "#FFFFFF",
          }}
        >
          <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "10px" }}>
            回答方式
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "8px" }}>
            {([
              ["2", "正解・不正解"],
              ["4", "苦手・うろ覚え\n覚えた・完璧"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setAnswerMode(value)}
                style={{
                  padding: "11px 8px",
                  borderRadius: "10px",
                  border: answerMode === value ? "2px solid #718675" : "1px solid #E5E5EA",
                  background: answerMode === value ? "#F1F5F1" : "#FFFFFF",
                  color: "#1D1D1F",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div style={{ fontSize: "13px", fontWeight: 700, margin: "16px 0 10px" }}>
            学習する枚数
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: "7px",
            }}
          >
            {([
              [30, "30問"],
              [50, "50問"],
              [100, "100問"],
              [300, "300問"],
              [500, "500問"],
              [1000, "1000問"],
              ["all", "全範囲"],
            ] as const).map(([value, label]) => (
              <button
                key={String(value)}
                type="button"
                onClick={() => setStudyLimit(value)}
                style={{
                  padding: "11px 4px",
                  borderRadius: "10px",
                  border:
                    studyLimit === value
                      ? "2px solid #718675"
                      : "1px solid #E5E5EA",
                  background: studyLimit === value ? "#F1F5F1" : "#FFFFFF",
                  color: "#1D1D1F",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div style={{ fontSize: "13px", fontWeight: 700, margin: "18px 0 10px" }}>
            学習する暗記レベル
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "7px",
            }}
          >
            {([
              ["all", "すべて"],
              ["unlearned", "未学習だけ"],
              ["weak", "苦手だけ"],
              ["vague", "うろ覚えだけ"],
              ["mistakes", "間違えた単語だけ"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setStudyStatusFilter(value)}
                style={{
                  padding: "11px 8px",
                  borderRadius: "10px",
                  border:
                    studyStatusFilter === value
                      ? "2px solid #718675"
                      : "1px solid #E5E5EA",
                  background:
                    studyStatusFilter === value ? "#F1F5F1" : "#FFFFFF",
                  color: "#1D1D1F",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <p style={{ margin: "9px 0 0", color: "#8E8E93", fontSize: "11px" }}>
            選択した暗記レベルのカードから、指定した枚数を出題します。対象が指定枚数より少ない場合は、対象カードをすべて学習します。
          </p>
        </section>

        <section style={{ marginTop: "18px", padding: "16px", border: "1px solid #E5E5EA", borderRadius: "14px", background: "#FFFFFF" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <strong>📖 苦手単語帳（{deck.cards.filter((card) => (card.incorrectCount || 0) > 0 && (card.correctStreak || 0) < 3).length}語）</strong>
            <button type="button" style={secondaryButtonStyle} onClick={() => setShowMistakeList((v) => !v)}>{showMistakeList ? "閉じる" : "一覧を見る"}</button>
          </div>
          <p style={{ fontSize: "12px", color: "#777" }}>過去に間違えた単語を自動収集。連続3回正解で克服済みになります。</p>
          {showMistakeList && (
            <div style={{ maxHeight: "320px", overflowY: "auto" }}>
              {deck.cards.filter((card) => (card.incorrectCount || 0) > 0).sort((a, b) => (b.incorrectCount || 0) - (a.incorrectCount || 0)).map((card) => (
                <div key={card.id} style={{ padding: "10px 0", borderBottom: "1px solid #eee" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                    <strong>{card.front}</strong><span style={{ fontSize: "12px", color: (card.correctStreak || 0) >= 3 ? "#387A55" : "#A93226" }}>{(card.correctStreak || 0) >= 3 ? "克服済み" : `不正解 ${card.incorrectCount || 0}回`}</span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#777" }}>{card.pinyin}　{card.japanese}</div>
                </div>
              ))}
              {deck.cards.every((card) => !(card.incorrectCount || 0)) && <p>まだ間違えた単語はありません。</p>}
            </div>
          )}
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
            <label htmlFor="mistake-csv-scope" style={{ fontSize: 12, fontWeight: 600 }}>CSVに出力する苦手単語</label>
            <select id="mistake-csv-scope" value={mistakeCsvScope} onChange={(event) => setMistakeCsvScope(event.target.value as "all" | "normal" | "quick")}
              style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #D8DED9", background: "#fff", maxWidth: 350 }}>
              <option value="all">すべて（通常学習＋タイムアタック）</option>
              <option value="normal">通常学習で間違えた単語のみ</option>
              <option value="quick">タイムアタックで間違えた単語のみ</option>
            </select>
            <span style={{ fontSize: 11, color: "#777" }}>対象 {getMistakeCards(deck, mistakeCsvScope).length}語。以前の学習履歴はモード不明のため「すべて」にのみ含まれます。</span>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "12px" }}>
            <button type="button" style={secondaryButtonStyle} onClick={() => downloadMistakesCSV(deck, false, mistakeCsvScope)}>学習用CSV</button>
            <button type="button" style={secondaryButtonStyle} onClick={() => downloadMistakesCSV(deck, true, mistakeCsvScope)}>分析用CSV</button>
          </div>
        </section>

        <section style={{ marginTop: 18, padding: 16, border: "1px solid #E5E5EA", borderRadius: 16, background: "#FFFFFF" }}>
          <strong style={{ display: "block", marginBottom: 10 }}>学習モード</strong>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
            {([ ["50", "⚡ 50秒"], ["100", "⏱ 100秒"], ["unlimited", "∞ 無制限"], ["normal", "通常学習"] ] as const).map(([value, label]) => (
              <button key={value} type="button" onClick={() => setChallengeMode(value)}
                style={{ ...secondaryButtonStyle, padding: 12, border: challengeMode === value ? "2px solid #718675" : "1px solid #E5E5EA", background: challengeMode === value ? "#F1F5F1" : "white" }}>
                {label}{value === "100" ? "（おすすめ）" : ""}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 12, color: "#777", marginBottom: 0 }}>Quick Challengeは時間内に復習できた枚数を記録します。通常学習の枚数設定は通常学習のみで使用します。</p>
        </section>
        <button
          onClick={startStudy}
          style={{
            ...primaryButtonStyle,
            width: "100%",
            marginTop: "12px",
            padding: "16px",
            fontSize: "16px",
          }}
        >
          {tx("deck.start")}
        </button>

        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={importCSV}
            style={{ display: "none" }}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            style={{ ...secondaryButtonStyle, flex: 1 }}
          >
            {tx("deck.csv")}
          </button>

          <button
            onClick={openAddCard}
            style={{ ...secondaryButtonStyle, flex: 1 }}
          >
            + {tx("deck.addWord")}
          </button>
        </div>

        {showCardForm && (
          <section
            style={{
              marginTop: "20px",
              padding: "20px",
              background: "#FFFFFF",
              border: "1px solid #E5E5EA",
              borderRadius: "15px",
            }}
          >
            <h2 style={{ marginTop: 0, fontSize: "18px" }}>
              {editingCardId
                ? tx("deck.editWord")
                : tx("deck.addWord")}
            </h2>

            <input
              placeholder={tx("deck.word")}
              value={cardFront}
              onChange={(event) => setCardFront(event.target.value)}
              style={inputStyle}
            />

            <input
              placeholder={tx("deck.reading")}
              value={cardPinyin}
              onChange={(event) => setCardPinyin(event.target.value)}
              style={inputStyle}
            />

            <input
              placeholder={tx("deck.translation")}
              value={cardJapanese}
              onChange={(event) => setCardJapanese(event.target.value)}
              style={inputStyle}
            />

            <input
              placeholder={tx("deck.example")}
              value={cardExample}
              onChange={(event) => setCardExample(event.target.value)}
              style={inputStyle}
            />

            <input
              placeholder={tx("deck.exampleTranslation")}
              value={cardExampleJapanese}
              onChange={(event) =>
                setCardExampleJapanese(event.target.value)
              }
              style={inputStyle}
            />

            {editingCardId && (() => {
              const editingCard = deck.cards.find((item) => item.id === editingCardId);
              if (!editingCard) return null;
              const manualStatuses = [
                { value: "unlearned" as LearningStatus, label: "未学習", days: null },
                { value: "weak" as LearningStatus, label: "苦手", days: 1 },
                { value: "vague" as LearningStatus, label: "うろ覚え", days: 3 },
                { value: "learned" as LearningStatus, label: "覚えた", days: 5 },
                { value: "perfect" as LearningStatus, label: "完璧", days: 7 },
              ];
              return (
                <div style={{ margin: "8px 0 16px", padding: "14px", background: "#FAFAFC", border: "1px solid #E5E5EA", borderRadius: "12px" }}>
                  <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "9px" }}>暗記レベルを変更</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "7px" }}>
                    {manualStatuses.map((status) => (
                      <button
                        key={status.value}
                        type="button"
                        onClick={() => updateLearningStatus(editingCard.id, status.value)}
                        style={{
                          padding: "10px 8px",
                          borderRadius: "9px",
                          border: editingCard.learningStatus === status.value ? "2px solid #718675" : "1px solid #E5E5EA",
                          background: editingCard.learningStatus === status.value ? "#F1F5F1" : "#FFFFFF",
                          color: "#1D1D1F",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        {status.label}{status.days ? ` · ${status.days}日後` : ""}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={saveCard}
                style={{ ...primaryButtonStyle, flex: 1 }}
              >
                {tx("deck.save")}
              </button>

              <button
                onClick={resetCardForm}
                style={{ ...secondaryButtonStyle, flex: 1 }}
              >
                {tx("common.cancel")}
              </button>
            </div>
          </section>
        )}

        <section style={{ marginTop: "30px" }}>
          <h2 style={{ fontSize: "18px", marginBottom: "13px" }}>
            {tx("deck.list")}
          </h2>

          {deck.cards.length > 0 && (
            <input
              placeholder={tx("deck.search")}
              value={cardSearch}
              onChange={(event) => setCardSearch(event.target.value)}
              style={{ ...inputStyle, background: "#FFFFFF" }}
            />
          )}

          {deck.cards.length === 0 ? (
            <div
              style={{
                padding: "30px 15px",
                textAlign: "center",
                background: "#FAFAFC",
                border: "1px dashed #E5E5EA",
                borderRadius: "14px",
                color: "#8E8E93",
              }}
            >
              {tx("deck.empty")}
            </div>
          ) : (
            filteredCards.map((card) => (
              <article
                key={card.id}
                style={{
                  marginBottom: "10px",
                  padding: "16px",
                  background: "#FFFFFF",
                  border: "1px solid #E5E5EA",
                  borderRadius: "14px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "12px",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "18px",
                        fontWeight: 700,
                        marginBottom: "4px",
                        wordBreak: "break-word",
                      }}
                    >
                      {card.front}
                    </div>

                    {card.pinyin && (
                      <div
                        style={{
                          color: "#8E8E93",
                          fontSize: "13px",
                          marginBottom: "4px",
                        }}
                      >
                        {card.pinyin}
                      </div>
                    )}

                    {card.japanese && (
                      <div style={{ fontSize: "15px", color: "#3A3A3C" }}>
                        {card.japanese}
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    <button
                      onClick={() => openEditCard(card)}
                      style={{
                        ...secondaryButtonStyle,
                        padding: "7px 10px",
                        fontSize: "12px",
                      }}
                    >
                      {tx("deck.edit")}
                    </button>

                    <button
                      onClick={() => deleteCard(card.id)}
                      style={{
                        padding: "7px 10px",
                        background: "#FDF2F2",
                        border: "1px solid #F3D0D0",
                        color: "#A93226",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontWeight: 600,
                        fontSize: "12px",
                      }}
                    >
                      {tx("deck.delete")}
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      </main>
    );
  }

  const sortDecks = (deckList: Deck[]) => {
    return [...deckList].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0)
    );
  };

  const renderDeckCard = (deck: Deck, deckIndex: number, list: Deck[]) => (
    <div
      key={deck.name}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginBottom: "10px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "2px",
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => moveDeckOrder(list, deckIndex, "up")}
          disabled={deckIndex === 0}
          style={{
            padding: "2px 5px",
            fontSize: "10px",
            cursor: deckIndex === 0 ? "default" : "pointer",
            border: "1px solid #E5E5EA",
            borderRadius: "4px",
            background: "#FAFAFC",
            color: "#777",
            opacity: deckIndex === 0 ? 0.3 : 1,
          }}
          title="上に移動"
        >
          ▲
        </button>

        <button
          onClick={() => moveDeckOrder(list, deckIndex, "down")}
          disabled={deckIndex === list.length - 1}
          style={{
            padding: "2px 5px",
            fontSize: "10px",
            cursor:
              deckIndex === list.length - 1 ? "default" : "pointer",
            border: "1px solid #E5E5EA",
            borderRadius: "4px",
            background: "#FAFAFC",
            color: "#777",
            opacity: deckIndex === list.length - 1 ? 0.3 : 1,
          }}
          title="下に移動"
        >
          ▼
        </button>
      </div>

      <button
        onClick={() => {
          setCurrentDeck(deck.name);
          setDeckOpen(true);
        }}
        style={{
          flex: 1,
          minWidth: 0,
          padding: "11px 12px",
          textAlign: "left",
          background: "#FFFFFF",
          border: "1px solid #E5E5EA",
          borderRadius: "13px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        {deck.coverImageUrl ? (
          <img
            src={deck.coverImageUrl}
            alt=""
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "9px",
              objectFit: "cover",
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "9px",
              background: "#F1F2EF",
              display: "grid",
              placeItems: "center",
              color: "#8B968C",
              fontSize: "23px",
              flexShrink: 0,
            }}
          >
            ▤
          </div>
        )}

        <span style={{ flex: 1, minWidth: 0 }}>
          <strong
            style={{
              display: "block",
              fontSize: "14px",
              fontWeight: 600,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {deck.name}
          </strong>

          <span
            style={{
              display: "block",
              fontSize: "12px",
              color: "#8E8E93",
              marginTop: "5px",
            }}
          >
            {deck.cards.length} {tx("deck.cards")}
          </span>
        </span>

        <span style={{ color: "#A0A0A5", fontSize: "20px" }}>›</span>
      </button>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "5px",
          flexShrink: 0,
          alignItems: "stretch",
        }}
      >
        <button type="button" style={{ ...secondaryButtonStyle, padding: "6px", fontSize: "11px" }}
          onClick={() => { setEditingDuplicateCard(null); setDuplicateDeckName(deck.name); }}>
          重複チェック ({getDuplicateCardGroups(deck.name).length})
        </button>
        <select
          aria-label={`${deck.name}の今日の学習語数`}
          value={taskTargets[deck.name] ?? 30}
          onChange={(event) =>
            setTaskTargets((previous) => ({
              ...previous,
              [deck.name]: Number(event.target.value),
            }))
          }
          style={{
            width: "76px",
            padding: "6px 4px",
            border: "1px solid #E5E5EA",
            borderRadius: "7px",
            fontSize: "11px",
            background: "#FFFFFF",
          }}
        >
          {[10, 20, 30, 50, 100].map((count) => (
            <option key={count} value={count}>
              {count}語
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => void addDeckToTodayTask(deck)}
          disabled={
            !authReady ||
            !authUser ||
            deck.cards.length === 0 ||
            taskAddingDeck === deck.name ||
            taskAddedDecks.includes(deck.name)
          }
          title={
            !authReady
              ? "ログイン状態を確認中"
              : !authUser
                ? "ログインすると追加できます"
                : taskAddedDecks.includes(deck.name)
                  ? "今日のタスクに登録済み"
                  : "今日のタスクに追加"
          }
          style={{
            minWidth: "76px",
            padding: "7px 5px",
            border: "1px solid #D8E3D9",
            borderRadius: "7px",
            background: taskAddedDecks.includes(deck.name) ? "#F1F5F1" : "#FFFFFF",
            color: taskAddedDecks.includes(deck.name) ? "#718675" : "#526B58",
            fontSize: "11px",
            fontWeight: 600,
            cursor: "pointer",
            opacity:
              !authReady ||
              !authUser ||
              deck.cards.length === 0 ||
              taskAddingDeck === deck.name ||
              taskAddedDecks.includes(deck.name)
                ? 0.55
                : 1,
          }}
        >
          {taskAddingDeck === deck.name
            ? "追加中..."
            : taskAddedDecks.includes(deck.name)
              ? "追加済み"
              : "＋ 今日"}
        </button>
      </div>

      <select
        value={deck.folderId || ""}
        onChange={(event) =>
          moveDeck(deck.name, event.target.value || null)
        }
        title="フォルダを移動"
        style={{
          maxWidth: "105px",
          minWidth: "0",
          padding: "8px 5px",
          border: "1px solid #E5E5EA",
          borderRadius: "8px",
          fontSize: "11px",
          background: "#FFFFFF",
        }}
      >
        <option value="">{tx("folder.uncategorized")}</option>
        {folders.map((folder) => (
          <option key={folder.id} value={folder.id}>
            {folder.name}
          </option>
        ))}
      </select>

      <button
        onClick={() => deleteDeck(deck.name)}
        style={{
          border: "none",
          background: "transparent",
          color: "#C62828",
          cursor: "pointer",
          fontSize: "12px",
          flexShrink: 0,
        }}
      >
        削除
      </button>
    </div>
  );

  const duplicateGroups = getDuplicateCardGroups(duplicateDeckName);
  const duplicateDeck = decks.find((deck) => deck.name === duplicateDeckName);
  const exactDuplicateCount = duplicateDeck ? getExactDuplicateIds(duplicateDeck).size : 0;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F7F7F5",
        maxWidth: "900px",
        margin: "0 auto",
        padding: "35px 20px 60px",
        fontFamily: "sans-serif",
        color: "#1D1D1F",
      }}
    >
      <header
        style={{
          marginBottom: "28px",
          paddingBottom: "20px",
          borderBottom: "1px solid #E5E5EA",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "12px",
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              color: "#8E8E93",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.12em",
            }}
          >
            YOUR LIBRARY
          </p>

          <h1
            style={{
              margin: "6px 0 0",
              fontSize: "27px",
              fontWeight: 700,
              letterSpacing: "-0.03em",
            }}
          >
            {tx("deck.manage")}
          </h1>

          <p
            style={{
              margin: "7px 0 0",
              color: "#8E8E93",
              fontSize: "13px",
              lineHeight: 1.6,
            }}
          >
            {tx("deck.description")}
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => setShowThemeSettings(true)}
            style={secondaryButtonStyle}
          >
            テーマ
          </button>
        </div>
      </header>

      {/* 重複チェック・自動一括削除モーダル */}
      {duplicateDeck && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(6px)",
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
              maxWidth: "760px",
              maxHeight: "85vh",
              background: "#FFFFFF",
              borderRadius: "20px",
              padding: "24px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
              display: "flex",
              flexDirection: "column",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
                paddingBottom: "12px",
                borderBottom: "1px solid #E5E5EA",
                gap: "10px",
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700 }}>
                  {duplicateDeck.name}：重複チェック
                </h2>
                <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#8E8E93" }}>
                  全 {duplicateDeck.cards.length} 枚 ／ 重複 {duplicateGroups.length} グループ ／ 余分なカード {duplicateGroups.reduce((sum, group) => sum + group.items.length - 1, 0)} 枚 ／ 完全一致の削除候補 {exactDuplicateCount} 枚
                </p>
              </div>

              <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                {exactDuplicateCount > 0 && (
                  <button
                    onClick={autoRemoveExactDuplicates}
                    disabled={duplicateBusy}
                    style={{
                      padding: "10px 14px",
                      background: "#A93226",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: "10px",
                      fontWeight: 600,
                      fontSize: "13px",
                      cursor: "pointer",
                    }}
                  >
                    完全重複を一括削除
                  </button>
                )}

                <button
                  disabled={duplicateBusy}
                  onClick={() => {
                    setDuplicateDeckName(null);
                    setEditingDuplicateCard(null);
                  }}
                  style={secondaryButtonStyle}
                >
                  閉じる
                </button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", paddingRight: "4px" }}>
              {duplicateGroups.length === 0 ? (
                <div
                  style={{
                    padding: "40px 20px",
                    textAlign: "center",
                    color: "#8E8E93",
                    fontSize: "14px",
                  }}
                >
                  🎉 このデッキに重複した単語は見つかりませんでした！
                </div>
              ) : (
                duplicateGroups.map((group) => (
                  <div
                    key={group.key}
                    style={{
                      marginBottom: "18px",
                      padding: "16px",
                      background: "#FAFAFC",
                      border: "1px solid #E5E5EA",
                      borderRadius: "14px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "17px",
                        fontWeight: 700,
                        marginBottom: "12px",
                        color: "#A93226",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span>重複単語: 「{group.items[0].card.front}」</span>
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 500,
                          color: "#8E8E93",
                        }}
                      >
                        ({group.items.length}件検出)
                      </span>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                        gap: "10px",
                      }}
                    >
                      {group.items.map(({ deckName, card }) => {
                        const isEditing =
                          editingDuplicateCard?.card.id === card.id &&
                          editingDuplicateCard?.deckName === deckName;

                        return (
                          <div
                            key={`${deckName}-${card.id}`}
                            style={{
                              padding: "14px",
                              background: "#FFFFFF",
                              border: "1px solid #E5E5EA",
                              borderRadius: "12px",
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "space-between",
                            }}
                          >
                            <div>
                              <div
                                style={{
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  color: "#718675",
                                  marginBottom: "6px",
                                  background: "#F1F5F1",
                                  padding: "3px 8px",
                                  borderRadius: "6px",
                                  display: "inline-block",
                                }}
                              >
                                デッキ: {deckName}
                              </div>

                              {!isEditing ? (
                                <>
                                  <div
                                    style={{
                                      fontSize: "16px",
                                      fontWeight: 700,
                                      margin: "6px 0 2px",
                                    }}
                                  >
                                    {card.front}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "13px",
                                      color: "#8E8E93",
                                      marginBottom: "4px",
                                    }}
                                  >
                                    読み: {card.pinyin || "未設定"}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "14px",
                                      color: "#1D1D1F",
                                      marginBottom: "6px",
                                    }}
                                  >
                                    訳: {card.japanese || "未設定"}
                                  </div>
                                  {card.example && (
                                    <div
                                      style={{
                                        fontSize: "12px",
                                        color: "#555",
                                        fontStyle: "italic",
                                      }}
                                    >
                                      例: {card.example}
                                    </div>
                                  )}
                                  {card.exampleJapanese && <div style={{ fontSize: "12px", color: "#555" }}>{card.exampleJapanese}</div>}
                                </>
                              ) : (
                                <div style={{ marginTop: "10px" }}>
                                  <label style={{ fontSize: "11px", color: "#8E8E93" }}>単語</label>
                                  <input
                                    value={editingDuplicateCard.card.front}
                                    onChange={(e) =>
                                      setEditingDuplicateCard({
                                        ...editingDuplicateCard,
                                        card: {
                                          ...editingDuplicateCard.card,
                                          front: e.target.value,
                                        },
                                      })
                                    }
                                    style={{ ...inputStyle, padding: "8px", fontSize: "13px" }}
                                  />

                                  <label style={{ fontSize: "11px", color: "#8E8E93" }}>読み</label>
                                  <input
                                    value={editingDuplicateCard.card.pinyin}
                                    onChange={(e) =>
                                      setEditingDuplicateCard({
                                        ...editingDuplicateCard,
                                        card: {
                                          ...editingDuplicateCard.card,
                                          pinyin: e.target.value,
                                        },
                                      })
                                    }
                                    style={{ ...inputStyle, padding: "8px", fontSize: "13px" }}
                                  />

                                  <label style={{ fontSize: "11px", color: "#8E8E93" }}>日本語訳</label>
                                  <input
                                    value={editingDuplicateCard.card.japanese}
                                    onChange={(e) =>
                                      setEditingDuplicateCard({
                                        ...editingDuplicateCard,
                                        card: {
                                          ...editingDuplicateCard.card,
                                          japanese: e.target.value,
                                        },
                                      })
                                    }
                                    style={{ ...inputStyle, padding: "8px", fontSize: "13px" }}
                                  />

                                  <label style={{ fontSize: "11px", color: "#8E8E93" }}>例文</label>
                                  <input
                                    value={editingDuplicateCard.card.example}
                                    onChange={(e) =>
                                      setEditingDuplicateCard({
                                        ...editingDuplicateCard,
                                        card: {
                                          ...editingDuplicateCard.card,
                                          example: e.target.value,
                                        },
                                      })
                                    }
                                    style={{ ...inputStyle, padding: "8px", fontSize: "13px" }}
                                  />
                                  <label style={{ fontSize: "11px", color: "#8E8E93" }}>例文の日本語訳</label>
                                  <input value={editingDuplicateCard.card.exampleJapanese ?? ""}
                                    onChange={(e) => setEditingDuplicateCard({ ...editingDuplicateCard, card: { ...editingDuplicateCard.card, exampleJapanese: e.target.value } })}
                                    style={{ ...inputStyle, padding: "8px", fontSize: "13px" }} />
                                  <button type="button" disabled={duplicateBusy} onClick={() => setEditingDuplicateCard(null)} style={secondaryButtonStyle}>キャンセル</button>
                                </div>
                              )}
                            </div>

                            <div
                              style={{
                                display: "flex",
                                gap: "6px",
                                marginTop: "12px",
                                paddingTop: "8px",
                                borderTop: "1px solid #F0F0F2",
                              }}
                            >
                              {!isEditing ? (
                                <button
                                  onClick={() =>
                                    setEditingDuplicateCard({
                                      deckName,
                                      card: { ...card },
                                    })
                                  }
                                  style={{
                                    ...secondaryButtonStyle,
                                    flex: 1,
                                    padding: "6px 8px",
                                    fontSize: "12px",
                                  }}
                                >
                                  編集
                                </button>
                              ) : (
                                <button
                                  disabled={duplicateBusy}
                                  onClick={() =>
                                    saveDuplicateCardEdit(
                                      deckName,
                                      editingDuplicateCard.card
                                    )
                                  }
                                  style={{
                                    ...primaryButtonStyle,
                                    flex: 1,
                                    padding: "6px 8px",
                                    fontSize: "12px",
                                  }}
                                >
                                  保存
                                </button>
                              )}

                              <button
                                disabled={duplicateBusy}
                                onClick={() =>
                                  deleteDuplicateCard(deckName, card.id)
                                }
                                style={{
                                  padding: "6px 8px",
                                  background: "#FDF2F2",
                                  border: "1px solid #F3D0D0",
                                  color: "#A93226",
                                  borderRadius: "8px",
                                  cursor: "pointer",
                                  fontWeight: 600,
                                  fontSize: "12px",
                                }}
                              >
                                削除
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {folders.map((folder, folderIndex) => {
        const folderDecks = sortDecks(
          decks.filter((deck) => deck.folderId === folder.id)
        );

        return (
          <section
            key={folder.id}
            style={{
              border: "1px solid #E5E5EA",
              borderRadius: "16px",
              padding: "18px",
              marginBottom: "16px",
              background: "#FFFFFF",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "15px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: "16px",
                    fontWeight: 700,
                  }}
                >
                  {folder.name}
                </h2>

                <div style={{ display: "flex", gap: "4px" }}>
                  <button
                    onClick={() =>
                      moveFolderOrder(folderIndex, "up")
                    }
                    disabled={folderIndex === 0}
                    style={{
                      padding: "4px 7px",
                      fontSize: "10px",
                      cursor: "pointer",
                      border: "1px solid #E5E5EA",
                      borderRadius: "5px",
                      background: "#FAFAFC",
                    }}
                    title="上に移動"
                  >
                    ▲
                  </button>

                  <button
                    onClick={() =>
                      moveFolderOrder(folderIndex, "down")
                    }
                    disabled={folderIndex === folders.length - 1}
                    style={{
                      padding: "4px 7px",
                      fontSize: "10px",
                      cursor: "pointer",
                      border: "1px solid #E5E5EA",
                      borderRadius: "5px",
                      background: "#FAFAFC",
                    }}
                    title="下に移動"
                  >
                    ▼
                  </button>
                </div>
              </div>

              <button
                onClick={() => deleteFolder(folder.id)}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#C62828",
                  cursor: "pointer",
                  fontSize: "13px",
                }}
              >
                {tx("deck.delete")}
              </button>
            </div>

            {folderDecks.length === 0 ? (
              <p
                style={{
                  fontSize: "13px",
                  color: "#8E8E93",
                  margin: "8px 0",
                }}
              >
                デッキがありません
              </p>
            ) : (
              folderDecks.map((deck, index) =>
                renderDeckCard(deck, index, folderDecks)
              )
            )}
          </section>
        );
      })}

      {decks.some((deck) => deck.folderId === null) && (
        <section
          style={{
            border: "1px solid #E5E5EA",
            borderRadius: "16px",
            padding: "18px",
            marginBottom: "24px",
            background: "#FFFFFF",
          }}
        >
          <h2
            style={{
              margin: "0 0 15px",
              fontSize: "16px",
              fontWeight: 700,
            }}
          >
            {tx("folder.uncategorized")}
          </h2>

          {(() => {
            const uncategorizedDecks = sortDecks(
              decks.filter((deck) => deck.folderId === null)
            );

            return uncategorizedDecks.map((deck, index) =>
              renderDeckCard(deck, index, uncategorizedDecks)
            );
          })()}
        </section>
      )}

      <section
        style={{
          marginTop: "28px",
          padding: "18px",
          background: "#FFFFFF",
          border: "1px solid #E5E5EA",
          borderRadius: "16px",
        }}
      >
        <h3 style={{ margin: "0 0 12px", fontSize: "15px" }}>
          {tx("folder.new")}
        </h3>

        <div style={{ display: "flex", gap: "8px" }}>
          <input
            placeholder={tx("folder.example")}
            value={newFolderName}
            onChange={(event) => setNewFolderName(event.target.value)}
            style={{
              ...inputStyle,
              flex: 1,
              marginBottom: 0,
            }}
          />

          <button onClick={addFolder} style={primaryButtonStyle}>
            {tx("folder.create")}
          </button>
        </div>
      </section>

      <section
        style={{
          marginTop: "16px",
          padding: "22px",
          background: "#FFFFFF",
          border: "1px solid #E5E5EA",
          borderRadius: "16px",
        }}
      >
        <h3 style={{ margin: "0 0 18px", fontSize: "16px" }}>
          {tx("deck.new")}
        </h3>

        <input
          placeholder={tx("deck.exampleName")}
          value={newDeckName}
          onChange={(event) => setNewDeckName(event.target.value)}
          style={inputStyle}
        />

        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "20px",
          }}
        >
          <select
            value={newDeckLanguage}
            onChange={(event) =>
              setNewDeckLanguage(event.target.value)
            }
            style={{
              ...inputStyle,
              flex: 1,
              marginBottom: 0,
            }}
          >
            {languageOptions.map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={newDeckFolderId || ""}
            onChange={(event) =>
              setNewDeckFolderId(event.target.value || null)
            }
            style={{
              ...inputStyle,
              flex: 1,
              marginBottom: 0,
            }}
          >
            <option value="">{tx("deck.noFolder")}</option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <p
            style={{
              fontSize: "13px",
              fontWeight: 600,
              margin: "0 0 10px",
            }}
          >
            デッキの表紙画像
          </p>

          {coverPreview ? (
            <div style={{ marginBottom: "12px" }}>
              <img
                src={coverPreview}
                alt="表紙プレビュー"
                style={{
                  width: "130px",
                  height: "130px",
                  objectFit: "cover",
                  borderRadius: "13px",
                  border: "1px solid #E5E5EA",
                }}
              />

              <button
                type="button"
                onClick={() => {
                  setCoverFile(null);
                  setCoverPreview("");
                }}
                style={{
                  display: "block",
                  marginTop: "8px",
                  border: "none",
                  background: "transparent",
                  color: "#B46A6A",
                  cursor: "pointer",
                  fontSize: "13px",
                }}
              >
                画像を取り消す
              </button>
            </div>
          ) : (
            <div
              style={{
                width: "130px",
                height: "130px",
                borderRadius: "13px",
                border: "1px dashed #D5D5DA",
                background: "#FAFAFC",
                display: "grid",
                placeItems: "center",
                color: "#A0A0A5",
                marginBottom: "12px",
                fontSize: "30px",
              }}
            >
              ＋
            </div>
          )}

          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={selectCoverImage}
            style={{ display: "none" }}
          />

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={selectCoverImage}
            style={{ display: "none" }}
          />

          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              style={secondaryButtonStyle}
            >
              画像を選択
            </button>

            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              style={secondaryButtonStyle}
            >
              カメラで撮影
            </button>
          </div>

          <p
            style={{
              fontSize: "11px",
              color: "#8E8E93",
              marginTop: "9px",
            }}
          >
            JPG・PNGなどの画像（10MB以下）
          </p>
        </div>

        <button
          onClick={addDeck}
          disabled={uploadingCover}
          style={{
            ...primaryButtonStyle,
            width: "100%",
            opacity: uploadingCover ? 0.6 : 1,
            cursor: uploadingCover ? "wait" : "pointer",
          }}
        >
          {uploadingCover
            ? "画像を保存しています…"
            : tx("deck.create")}
        </button>
      </section>
    </main>
  );
}