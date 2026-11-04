"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useLanguage } from "@/app/component/AppLanguage";
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

/**
 * デッキアイコン画像を小さなJPEGに変換する。
 * Firebase Storageの設定に依存せず、既存のcoverImageUrlフィールドへ
 * Data URLとして保存できるようにする（Firestoreのドキュメント肥大化を防ぐ）。
 */
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

    // JPEG化で透過部分が黒くならないよう白背景にする。
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

function getStatusLabel(status?: LearningStatus) {
  if (status === "unlearned") return "未学習";
  return statusOptions.find((item) => item.value === status)?.label || "未設定";
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
  const deckSaveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // デッキ作成時用
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // デッキ詳細（編集）用
  const editImageInputRef = useRef<HTMLInputElement | null>(null);
  const editCameraInputRef = useRef<HTMLInputElement | null>(null);

  const [themeColor, setThemeColor] = useState("#718675");
  const [showThemeSettings, setShowThemeSettings] = useState(false);
  const [color, setColor] = useState("#718675");
  const [savedColor, setSavedColor] = useState("#718675");

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
    "all" | "unlearned" | "weak" | "vague"
  >("all");

  const [speechLanguage, setSpeechLanguage] = useState("zh-CN");

  const [studyMode, setStudyMode] = useState(false);
  const [studyCards, setStudyCards] = useState<Card[]>([]);
  const [studyIndex, setStudyIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const [studyCorrect, setStudyCorrect] = useState(0);
  const [studyIncorrect, setStudyIncorrect] = useState(0);
  const [studyStartTime, setStudyStartTime] = useState<number | null>(null);
  const [studySessionId, setStudySessionId] = useState<string | null>(null);

  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryData, setSummaryData] = useState<{
    total: number;
    correct: number;
    incorrect: number;
    rate: string;
    durationSec: number;
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
    const loadData = async () => {
      try {
        const folderSnapshot = await getDocs(collection(db, "folders"));
        const loadedFolders: Folder[] = folderSnapshot.docs.map((item, index) => ({
          id: item.id,
          name: item.data().name || item.id,
          order: item.data().order ?? index,
        }));

        loadedFolders.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setFolders(loadedFolders);

        const deckSnapshot = await getDocs(collection(db, "decks"));
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
        setStudyRecords(loadedRecords);
      } catch (error) {
        console.error("Firestore読み込みエラー:", error);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

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

  const persistDeck = async (deck: Deck) => {
    await setDoc(doc(db, "decks", deck.name), deck);
  };

  const persistFolder = async (folder: Folder) => {
    await setDoc(doc(db, "folders", folder.id), folder);
  };

  const updateDeckState = (updatedDeck: Deck) => {
    setDecks((previous) =>
      previous.map((item) =>
        item.name === updatedDeck.name ? updatedDeck : item
      )
    );
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

  // デッキ新規作成時の画像選択ハンドラー
  const selectCoverImage = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0] ?? null;

    if (!file) return;

    // iOSではMIME typeが空になる場合があるため、空の場合は許可する。
    if (file.type && !file.type.startsWith("image/")) {
      alert("画像ファイルを選択してください。");
      input.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("元元画像は10MB以下にしてください。");
      input.value = "";
      return;
    }

    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    input.value = "";
  };

  // 作成後（デッキ詳細画面）のアイコン画像更新ハンドラー
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
      alert("元元画像は10MB以下にしてください。");
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
      // 写真を圧縮してData URL化し、デッキ自身のFirestoreドキュメントに保存する。
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
        folderId: newDeckFolderId,
        coverImageUrl,
        order: decks.length,
      };

      await persistDeck(newDeck);

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

        const lines = result
          .replace(/^\uFEFF/, "")
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean);

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
            reviewCount: 0,
            correctCount: 0,
            incorrectCount: 0,
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

  const startStudy = () => {
    answerLockRef.current = false;

    const deck = decks.find((item) => item.name === currentDeck);

    if (!deck || deck.cards.length === 0) {
      return alert(tx("alert.noWords"));
    }

    // 学習レベルで対象カードを絞り込む。
    const filteredCards =
      studyStatusFilter === "all"
        ? deck.cards
        : deck.cards.filter(
            (card) =>
              (card.learningStatus ?? "unlearned") === studyStatusFilter
          );

    if (filteredCards.length === 0) {
      const filterLabel =
        studyStatusFilter === "unlearned"
          ? "未学習"
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
      studyLimit === "all"
        ? prioritizedCards
        : prioritizedCards.slice(0, studyLimit);

    setStudyCards(selectedCards);
    setStudyIndex(0);
    setShowAnswer(false);
    setStudyCorrect(0);
    setStudyIncorrect(0);
    setStudyStartTime(Date.now());
    setStudySessionId(createId());
    setStudyMode(true);
  };

  const saveStudyRecord = async (
    correctCount: number,
    incorrectCount: number
  ) => {
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
      duration: Math.max(
        0,
        Math.floor((now - studyStartTime) / 1000)
      ),
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
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    await deckSaveQueueRef.current;

    const total = studyCorrect + studyIncorrect;

    const rate =
      total > 0
        ? ((studyCorrect / total) * 100).toFixed(1)
        : "0.0";

    const durationSec = studyStartTime
      ? Math.max(
          0,
          Math.floor((Date.now() - studyStartTime) / 1000)
        )
      : 0;

    await saveStudyRecord(studyCorrect, studyIncorrect);

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
    if (answerLockRef.current) return;

    const currentCard = studyCards[studyIndex];
    if (!currentCard) return;

    answerLockRef.current = true;

    const nextCorrect = studyCorrect + (correct ? 1 : 0);
    const nextIncorrect = studyIncorrect + (correct ? 0 : 1);

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

  if (loading) {
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

  // テーマカラー設定
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

  // カード学習画面
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

        {showSummaryModal && summaryData && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.35)",
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
                padding: "28px",
                boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
                textAlign: "center",
              }}
            >
              <h2 style={{ marginTop: 0 }}>
                学習お疲れ様でした！
              </h2>

              {[
                ["回答数", `${summaryData.total} 問`],
                ["正解数", `${summaryData.correct} 問`],
                ["不正解数", `${summaryData.incorrect} 問`],
                ["正答率", `${summaryData.rate} %`],
              ].map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "11px 0",
                    borderBottom: "1px solid #F0F0F2",
                    fontSize: "14px",
                  }}
                >
                  <span style={{ color: "#8E8E93" }}>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}

              <button
                onClick={closeSummaryModal}
                style={{
                  ...primaryButtonStyle,
                  width: "100%",
                  marginTop: "24px",
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

  // デッキ詳細画面（デッキ作成後の管理画面）
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

        {/* 作成後のアイコン画像変更エリア */}
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
              ["4", "苦手・うろ覚え・覚えた・完璧"],
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

  // デッキ一覧の並び順
  const sortDecks = (deckList: Deck[]) => {
    return [...deckList].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0)
    );
  };

  // デッキカード
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

        <button
          onClick={() => setShowThemeSettings(true)}
          style={secondaryButtonStyle}
        >
          テーマ
        </button>
      </header>

      {/* フォルダ一覧 */}
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

      {/* 未分類デッキ */}
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

      {/* 新しいフォルダ作成 */}
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

      {/* 新しいデッキ作成前（表紙画像設定対応） */}
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