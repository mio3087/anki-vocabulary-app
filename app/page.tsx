
"use client";

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

export default function Home() {
  const [themeColor, setThemeColor] = useState("#78C5FF");
  const [showThemeSettings, setShowThemeSettings] = useState(false);
  const [color, setColor] = useState("#78C5FF");
  const [savedColor, setSavedColor] = useState("#78C5FF");
  const [hexInput, setHexInput] = useState("#78C5FF");
  const [hexError, setHexError] = useState(false);
  const [saved, setSaved] = useState(false);
  const colors = makeThemeColors(themeColor);
  const rgb = getRgb(color);

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





  
  // =========================================================
  // フォルダ
  // =========================================================

  const [folders, setFolders] = useState<Folder[]>([
    {
      id: "default",
      name: "中国語",
    },
  ]);

  // =========================================================
  // デッキ
  // =========================================================

  const [decks, setDecks] = useState<Deck[]>([
    {
      name: "中国語",
      language: "zh-CN",
      cards: [],
      folderId: "default",
    },
  ]);

  const [currentDeck, setCurrentDeck] = useState("中国語");
  const [deckOpen, setDeckOpen] = useState(false);

  // =========================================================
  // 学習
  // =========================================================

  const [studyMode, setStudyMode] = useState(false);
  const [studyCards, setStudyCards] = useState<Card[]>([]);
  const [studyIndex, setStudyIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const [studyCorrect, setStudyCorrect] = useState(0);
  const [studyIncorrect, setStudyIncorrect] =
    useState(0);

  const [studyStartTime, setStudyStartTime] =
    useState<number | null>(null);

  // 1回の学習ごとに固有IDを持たせる
  const [studySessionId, setStudySessionId] =
    useState<string | null>(null);

  // =========================================================
  // 学習記録
  // =========================================================

  const [studyRecords, setStudyRecords] =
    useState<StudyRecord[]>([]);

  const [showStudyRecords, setShowStudyRecords] =
    useState(false);











    

  // =========================================================
  // デッキ作成
  // =========================================================

  const [newDeckName, setNewDeckName] =
    useState("");

  const [newDeckLanguage, setNewDeckLanguage] =
    useState("zh-CN");

  const [newDeckFolderId, setNewDeckFolderId] =
    useState<string | null>(null);

  // =========================================================
  // フォルダ作成
  // =========================================================

  const [newFolderName, setNewFolderName] =
    useState("");

  // =========================================================
  // 単語フォーム
  // =========================================================

  const [showCardForm, setShowCardForm] =
    useState(false);

  const [editingCardId, setEditingCardId] =
    useState<string | null>(null);

  const [cardFront, setCardFront] = useState("");
  const [cardPinyin, setCardPinyin] = useState("");
  const [cardJapanese, setCardJapanese] =
    useState("");
  const [cardExample, setCardExample] =
    useState("");
  const [cardExampleJapanese, setCardExampleJapanese] =
    useState("");

  // =========================================================
  // 単語検索
  // =========================================================

  const [cardSearch, setCardSearch] =
    useState("");

  // =========================================================
  // CSV
  // =========================================================

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  // =========================================================
  // Firestore読み込み
  // =========================================================

  useEffect(() => {
    const loadData = async () => {
      try {
        // -----------------------------------------------------
        // フォルダ
        // -----------------------------------------------------

        const folderSnapshot = await getDocs(
          collection(db, "folders")
        );

        if (!folderSnapshot.empty) {
          const loadedFolders: Folder[] =
            folderSnapshot.docs.map((item) => {
              const data = item.data();

              return {
                id: item.id,
                name: data.name || item.id,
              };
            });

          setFolders(loadedFolders);
        }

        // -----------------------------------------------------
        // デッキ
        // -----------------------------------------------------

        const deckSnapshot = await getDocs(
          collection(db, "decks")
        );

        if (!deckSnapshot.empty) {
          const loadedDecks: Deck[] =
            deckSnapshot.docs.map((item) => {
              const data = item.data();

              

              return {
                name:
                  data.name || item.id,

                language:
                  data.language ||
                  "zh-CN",

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

                folderId:
                  data.folderId ?? null,
              };
            });

          setDecks(loadedDecks);

          if (loadedDecks.length > 0) {
            setCurrentDeck(
              loadedDecks[0].name
            );
          }
        }

        // -----------------------------------------------------
        // 学習記録
        // -----------------------------------------------------

        const recordSnapshot = await getDocs(
          collection(db, "studyRecords")
        );

        if (!recordSnapshot.empty) {
          const loadedRecords: StudyRecord[] =
            recordSnapshot.docs.map((item) => {
              const data = item.data();

              return {
                id: item.id,

                date:
                  data.date || "",

                time:
                  data.time || "",

                startedAt:
                  Number(
                    data.startedAt || 0
                  ),

                deckName:
                  data.deckName || "",

                answered:
                  Number(
                    data.answered || 0
                  ),

                correct:
                  Number(
                    data.correct || 0
                  ),

                incorrect:
                  Number(
                    data.incorrect || 0
                  ),

                duration:
                  Number(
                    data.duration || 0
                  ),
              };
            });

          loadedRecords.sort((a, b) => {
            const aTime =
              a.startedAt || 0;

            const bTime =
              b.startedAt || 0;

            if (aTime && bTime) {
              return bTime - aTime;
            }

            return b.date.localeCompare(
              a.date
            );
          });

          setStudyRecords(
            loadedRecords
          );
        }

        console.log(
          "Firestoreからデータを読み込みました"
        );
      } catch (error) {
        console.error(
          "Firestore読み込みエラー:",
          error
        );

        alert(
          "Firestoreからデータを読み込めませんでした。\n\n" +
            (error instanceof Error
              ? error.message
              : String(error))
        );
      }
    };

    loadData();
  }, []);

  // =========================================================
  // 音声
  // =========================================================

  const speakWord = (word: string) => {
    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window)
    ) {
      return;
    }

    window.speechSynthesis.cancel();

    const deck = decks.find(
      (item) =>
        item.name === currentDeck
    );

    const utterance =
      new SpeechSynthesisUtterance(word);

    utterance.lang =
      deck?.language || "zh-CN";

    utterance.rate = 0.8;

    window.speechSynthesis.speak(
      utterance
    );
  };

  // =========================================================
  // 学習中の自動音声
  // =========================================================

  useEffect(() => {
    if (!studyMode) {
      return;
    }

    const card =
      studyCards[studyIndex];

    if (!card) {
      return;
    }

    speakWord(card.front);

    return () => {
      if (
        typeof window !== "undefined" &&
        "speechSynthesis" in window
      ) {
        window.speechSynthesis.cancel();
      }
    };
  }, [
    studyMode,
    studyIndex,
    studyCards,
  ]);

  // =========================================================
  // デッキ作成
  // =========================================================

  const addDeck = async () => {
    const name =
      newDeckName.trim();

    if (!name) {
      alert(
        "デッキ名を入力してください"
      );
      return;
    }

    if (
      decks.some(
        (deck) =>
          deck.name === name
      )
    ) {
      alert(
        "同じ名前のデッキがあります"
      );
      return;
    }

    const newDeck: Deck = {
      name,
      language:
        newDeckLanguage,
      cards: [],
      folderId:
        newDeckFolderId,
    };

    try {
      await setDoc(
        doc(db, "decks", name),
        newDeck
      );

      setDecks(
        (currentDecks) => [
          ...currentDecks,
          newDeck,
        ]
      );

      setCurrentDeck(name);
      setNewDeckName("");
      setNewDeckFolderId(null);

      alert(
        "デッキを作成しました"
      );
    } catch (error) {
      console.error(error);

      alert(
        "デッキの保存に失敗しました"
      );
    }
  };

  // =========================================================
  // デッキ削除
  // =========================================================

  const deleteDeck = async (
    deckName: string
  ) => {
    if (
      !confirm(
        `「${deckName}」を削除しますか？`
      )
    ) {
      return;
    }

    try {
      await deleteDoc(
        doc(db, "decks", deckName)
      );

      const updatedDecks =
        decks.filter(
          (deck) =>
            deck.name !== deckName
        );

      setDecks(updatedDecks);

      if (
        currentDeck === deckName
      ) {
        setCurrentDeck(
          updatedDecks.length > 0
            ? updatedDecks[0].name
            : ""
        );

        setDeckOpen(false);
      }
    } catch (error) {
      console.error(error);

      alert(
        "デッキの削除に失敗しました"
      );
    }
  };

  // =========================================================
  // フォルダ作成
  // =========================================================

  const addFolder = async () => {
    const name =
      newFolderName.trim();

    if (!name) {
      alert(
        "フォルダ名を入力してください"
      );
      return;
    }

    const newFolder: Folder = {
      id: createId(),
      name,
    };

    try {
      await setDoc(
        doc(
          db,
          "folders",
          newFolder.id
        ),
        newFolder
      );

      setFolders(
        (currentFolders) => [
          ...currentFolders,
          newFolder,
        ]
      );

      setNewFolderName("");

      alert(
        "フォルダを作成しました"
      );
    } catch (error) {
      console.error(error);

      alert(
        "フォルダの保存に失敗しました"
      );
    }
  };

  // =========================================================
  // フォルダ削除
  // =========================================================

  const deleteFolder = async (
    folderId: string
  ) => {
    if (
      !confirm(
        "このフォルダを削除しますか？"
      )
    ) {
      return;
    }

    try {
      await deleteDoc(
        doc(
          db,
          "folders",
          folderId
        )
      );

      const updatedFolders =
        folders.filter(
          (folder) =>
            folder.id !== folderId
        );

      setFolders(
        updatedFolders
      );

      const updatedDecks =
        decks.map((deck) =>
          deck.folderId ===
          folderId
            ? {
                ...deck,
                folderId: null,
              }
            : deck
        );

      setDecks(
        updatedDecks
      );

      for (const deck of updatedDecks) {
        await setDoc(
          doc(
            db,
            "decks",
            deck.name
          ),
          deck
        );
      }
    } catch (error) {
      console.error(error);

      alert(
        "フォルダの削除に失敗しました"
      );
    }
  };

  // =========================================================
  // デッキ移動
  // =========================================================

  const moveDeck = async (
    deckName: string,
    folderId: string | null
  ) => {
    const deck = decks.find(
      (item) =>
        item.name === deckName
    );

    if (!deck) {
      return;
    }

    const updatedDeck: Deck = {
      ...deck,
      folderId,
    };

    try {
      await setDoc(
        doc(
          db,
          "decks",
          deckName
        ),
        updatedDeck
      );

      setDecks(
        (currentDecks) =>
          currentDecks.map(
            (item) =>
              item.name === deckName
                ? updatedDeck
                : item
          )
      );
    } catch (error) {
      console.error(error);

      alert(
        "デッキの移動に失敗しました"
      );
    }
  };

  // =========================================================
  // CSV
  // =========================================================

  const importCSV = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const input =
      event.currentTarget;

    const file =
      input.files?.[0];

    if (!file) {
      return;
    }

    input.value = "";

    const reader =
      new FileReader();

    reader.onload = async () => {
      try {
        const result =
          reader.result;

        if (
          typeof result !==
          "string"
        ) {
          alert(
            "CSVを読み込めませんでした"
          );
          return;
        }

        const text =
          result.replace(
            /^\uFEFF/,
            ""
          );

        const lines =
          text
            .split(/\r?\n/)
            .map((line) =>
              line.trim()
            )
            .filter(
              (line) =>
                line.length > 0
            );

        if (
          lines.length === 0
        ) {
          alert(
            "CSVにデータがありません"
          );
          return;
        }

        const importedCards: Card[] =
          [];

        for (const line of lines) {
          const parts =
            line.split(",");





function parseCSVLine(line: string): string[] {
  // CSVの引用符を考慮して解析
  if (line.includes('"')) {
    const fields: string[] = [];
    let field = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        fields.push(field.trim());
        field = "";
      } else {
        field += char;
      }
    }

    fields.push(field.trim());
    return fields;
  }

  // 引用符がない場合は、先頭の文章を優先して保持する
const parts = parseCSVLine(line);

  if (parts.length > 5) {
    return [
      parts.slice(0, parts.length - 4).join(",").trim(),
      ...parts.slice(-4).map((part) => part.trim()),
    ];
  }

  return parts.map((part) => part.trim());
}













          const card: Card = {
            id: createId(),

            front:
              (parts[0] || "")
                .trim(),

            pinyin:
              (parts[1] || "")
                .trim(),

            japanese:
              (parts[2] || "")
                .trim(),

            example:
              (parts[3] || "")
                .trim(),

            exampleJapanese:
              parts
                .slice(4)
                .join(",")
                .trim(),
          };

          if (card.front) {
            importedCards.push(
              card
            );
          }
        }

        if (
          importedCards.length ===
          0
        ) {
          alert(
            "単語を読み込めませんでした"
          );
          return;
        }

        const deck =
          decks.find(
            (item) =>
              item.name ===
              currentDeck
          );

        if (!deck) {
          alert(
            "デッキが見つかりません"
          );
          return;
        }

        const updatedDeck: Deck = {
          ...deck,

          cards: [
            ...deck.cards,
            ...importedCards,
          ],
        };

        await setDoc(
          doc(
            db,
            "decks",
            deck.name
          ),
          updatedDeck
        );

        setDecks(
          (currentDecks) =>
            currentDecks.map(
              (item) =>
                item.name ===
                deck.name
                  ? updatedDeck
                  : item
            )
        );

        alert(
          `${importedCards.length}語をインポートしました`
        );
      } catch (error) {
        console.error(
          "CSV読み込みエラー:",
          error
        );

        alert(
          "CSVエラー: " +
            (error instanceof Error
              ? error.message
              : String(error))
        );
      }
    };

    reader.onerror = () => {
      alert(
        "CSVファイルを読み込めませんでした"
      );
    };

    reader.readAsText(
      file,
      "UTF-8"
    );
  };

  const openCSVPicker = () => {
    fileInputRef.current?.click();
  };

  



  // =========================================================
  // 単語追加
  // =========================================================

  const openAddCard = () => {
    setEditingCardId(null);

    setCardFront("");
    setCardPinyin("");
    setCardJapanese("");
    setCardExample("");
    setCardExampleJapanese("");

    setShowCardForm(true);
  };

  // =========================================================
  // 単語編集
  // =========================================================

  const openEditCard = (
    card: Card
  ) => {
    setEditingCardId(card.id);

    setCardFront(
      card.front
    );

    setCardPinyin(
      card.pinyin
    );

    setCardJapanese(
      card.japanese
    );

    setCardExample(
      card.example
    );

    setCardExampleJapanese(
      card.exampleJapanese
    );

    setShowCardForm(true);
  };

  // =========================================================
  // フォーム閉じる
  // =========================================================

  const closeCardForm = () => {
    setShowCardForm(false);
    setEditingCardId(null);

    setCardFront("");
    setCardPinyin("");
    setCardJapanese("");
    setCardExample("");
    setCardExampleJapanese("");
  };

  // =========================================================
  // 単語保存
  // =========================================================

  const saveCard = async () => {
    const front =
      cardFront.trim();

    if (!front) {
      alert(
        "単語を入力してください"
      );
      return;
    }

    const deck =
      decks.find(
        (item) =>
          item.name ===
          currentDeck
      );

    if (!deck) {
      alert(
        "現在のデッキが見つかりません"
      );
      return;
    }

    let updatedCards: Card[];

    if (editingCardId) {
      updatedCards =
        deck.cards.map(
          (card) =>
            card.id ===
            editingCardId
              ? {
                  ...card,

                  front,

                  pinyin:
                    cardPinyin.trim(),

                  japanese:
                    cardJapanese.trim(),

                  example:
                    cardExample.trim(),

                  exampleJapanese:
                    cardExampleJapanese.trim(),
                }
              : card
        );
    } else {
      const duplicate =
        deck.cards.some(
          (card) =>
            card.front
              .trim()
              .toLowerCase() ===
            front.toLowerCase()
        );

      if (duplicate) {
        const shouldAdd =
          confirm(
            `「${front}」はすでに存在します。\n\nそれでも追加しますか？`
          );

        if (!shouldAdd) {
          return;
        }
      }

    const newCard: Card = {
  id: createId(),

  front,

  pinyin:
    cardPinyin.trim(),

  japanese:
    cardJapanese.trim(),

  example:
    cardExample.trim(),

  exampleJapanese:
    cardExampleJapanese.trim(),

  reviewCount: 0,
  correctCount: 0,
  incorrectCount: 0,
  lastReviewedAt: 0,
};

      updatedCards = [
        ...deck.cards,
        newCard,
      ];
    }

    const updatedDeck: Deck = {
      ...deck,
      cards: updatedCards,
    };

    try {
      await setDoc(
        doc(
          db,
          "decks",
          deck.name
        ),
        updatedDeck
      );

      setDecks(
        (currentDecks) =>
          currentDecks.map(
            (item) =>
              item.name ===
              deck.name
                ? updatedDeck
                : item
          )
      );

      closeCardForm();
    } catch (error) {
      console.error(
        "単語保存エラー:",
        error
      );

      alert(
        "単語の保存に失敗しました。\n" +
          (error instanceof Error
            ? error.message
            : String(error))
      );
    }
  };

  // =========================================================
  // 単語削除
  // =========================================================

  const deleteCard = async (
    cardId: string
  ) => {
    const deck =
      decks.find(
        (item) =>
          item.name ===
          currentDeck
      );

    if (!deck) {
      return;
    }

    const card =
      deck.cards.find(
        (item) =>
          item.id === cardId
      );

    if (!card) {
      return;
    }

    if (
      !confirm(
        `「${card.front}」を削除しますか？`
      )
    ) {
      return;
    }

    const updatedDeck: Deck = {
      ...deck,

      cards:
        deck.cards.filter(
          (item) =>
            item.id !== cardId
        ),
    };

    try {
      await setDoc(
        doc(
          db,
          "decks",
          deck.name
        ),
        updatedDeck
      );

      setDecks(
        (currentDecks) =>
          currentDecks.map(
            (item) =>
              item.name ===
              deck.name
                ? updatedDeck
                : item
          )
      );
    } catch (error) {
      console.error(error);

      alert(
        "単語の削除に失敗しました"
      );
    }
  };

  // =========================================================
  // 学習開始
  // =========================================================

  const startStudy = () => {
    const deck = decks.find((item) => item.name === currentDeck);
    if (!deck || deck.cards.length === 0) {
      alert("単語がありません");
      return;
    }

    setStudyCards(prioritizeWeakCards(deck.cards));
    setStudyIndex(0);
    setShowAnswer(false);
    setStudyCorrect(0);
    setStudyIncorrect(0);
    setStudyStartTime(Date.now());
    setStudySessionId(createId());
    setStudyMode(true);
  };

  // =========================================================
  // 学習記録を1回分保存
  //
  // 重要：
  // 以前は「日付＋デッキ名」をIDにしていたため、
  // 同じ日に同じデッキをやると上書きされていた。
  //
  // 今回は studySessionId を使って、
  // 「1回の学習＝1つの記録」にする。
  // =========================================================

  const saveStudyRecord = async (
    correctCount: number,
    incorrectCount: number
  ) => {
    if (
      studyStartTime === null ||
      studySessionId === null
    ) {
      return;
    }

    const answered =
      correctCount +
      incorrectCount;

    if (answered === 0) {
      return;
    }

    const now = Date.now();

    const duration =
      Math.max(
        0,
        Math.floor(
          (now -
            studyStartTime) /
            1000
        )
      );

    const dateObject =
      new Date(now);

    const date =
      dateObject
        .toISOString()
        .slice(0, 10);

    const time =
      dateObject.toLocaleTimeString(
        "ja-JP",
        {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }
      );

    // ★ここが今回の重要部分
    // 毎回違うIDなので上書きされない
    const recordId =
      studySessionId;

    const newRecord: StudyRecord = {
      id: recordId,

      date,

      time,

      startedAt:
        studyStartTime,

      deckName:
        currentDeck,

      answered,

      correct:
        correctCount,

      incorrect:
        incorrectCount,

      duration,
    };

    try {
      await setDoc(
        doc(
          db,
          "studyRecords",
          recordId
        ),
        newRecord
      );

      setStudyRecords(
        (currentRecords) => {
          const updated = [
            newRecord,
            ...currentRecords.filter(
              (record) =>
                record.id !==
                recordId
            ),
          ];

          return updated.sort(
            (a, b) => {
              const aTime =
                a.startedAt || 0;

              const bTime =
                b.startedAt || 0;

              if (
                aTime &&
                bTime
              ) {
                return (
                  bTime -
                  aTime
                );
              }

              return b.date.localeCompare(
                a.date
              );
            }
          );
        }
      );
    } catch (error) {
      console.error(
        "学習記録保存エラー:",
        error
      );

      alert(
        "学習記録の保存に失敗しました"
      );
    }
  };

  // =========================================================
  // 学習終了
  // =========================================================

  const finishStudy = async () => {
    if (
      typeof window !==
        "undefined" &&
      "speechSynthesis" in
        window
    ) {
      window.speechSynthesis.cancel();
    }

    await saveStudyRecord(
      studyCorrect,
      studyIncorrect
    );

    setStudyMode(false);
    setShowAnswer(false);

    setStudyCards([]);
    setStudyIndex(0);

    setStudyCorrect(0);
    setStudyIncorrect(0);

    setStudyStartTime(null);
    setStudySessionId(null);
  };

  // =========================================================
  // 答え表示
  // =========================================================

  const toggleAnswer = () => {
    setShowAnswer(
      (current) => !current
    );
  };

  // =========================================================
  // 正解・不正解
  // =========================================================


  // =========================================================
  // 学習記録削除
  // =========================================================

  const deleteStudyRecord =
    async (
      recordId: string
    ) => {
      if (
        !confirm(
          "この学習記録を削除しますか？"
        )
      ) {
        return;
      }

      try {
        await deleteDoc(
          doc(
            db,
            "studyRecords",
            recordId
          )
        );

        setStudyRecords(
          (records) =>
            records.filter(
              (record) =>
                record.id !==
                recordId
            )
        );
      } catch (error) {
        console.error(error);

        alert(
          "学習記録の削除に失敗しました"
        );
      }
    };

  // =========================================================
  // 時間表示
  // =========================================================

  const formatDuration = (
    seconds: number
  ) => {
    const minutes =
      Math.floor(
        seconds / 60
      );

    const remaining =
      seconds % 60;

    if (minutes === 0) {
      return `${remaining}秒`;
    }

    if (remaining === 0) {
      return `${minutes}分`;
    }

    return `${minutes}分${remaining}秒`;
  };

  const answerCard = async (
  correct: boolean
) => {
  const currentCard =
    studyCards[studyIndex];

  if (!currentCard) {
    return;
  }

  // -----------------------------
  // セッション全体の成績
  // -----------------------------

  const nextCorrect =
    studyCorrect +
    (correct ? 1 : 0);

  const nextIncorrect =
    studyIncorrect +
    (correct ? 0 : 1);

  setStudyCorrect(nextCorrect);
  setStudyIncorrect(nextIncorrect);


  // -----------------------------
  // カード個別の学習記録
  // -----------------------------

  const updatedCard: Card = {
    ...currentCard,

    reviewCount:
      (currentCard.reviewCount || 0) + 1,

    correctCount:
      (currentCard.correctCount || 0) +
      (correct ? 1 : 0),

    incorrectCount:
      (currentCard.incorrectCount || 0) +
      (correct ? 0 : 1),

    lastReviewedAt:
      Date.now(),

    lastResult:
      correct
        ? "correct"
        : "incorrect",
  };


  // -----------------------------
  // デッキに保存
  // -----------------------------

  const deck = decks.find(
    (item) =>
      item.name === currentDeck
  );

  if (deck) {
    const updatedDeck: Deck = {
      ...deck,

      cards: deck.cards.map(
        (card) =>
          card.id === currentCard.id
            ? updatedCard
            : card
      ),
    };

    try {
      await setDoc(
        doc(
          db,
          "decks",
          deck.name
        ),
        updatedDeck
      );

      setDecks(
        (currentDecks) =>
          currentDecks.map(
            (item) =>
              item.name === deck.name
                ? updatedDeck
                : item
          )
      );
    } catch (error) {
      console.error(
        "カード学習記録保存エラー:",
        error
      );

      alert(
        "カードの学習記録を保存できませんでした。\n\n" +
          (error instanceof Error ? error.message : String(error))
      );
    }
  }


  // -----------------------------
  // 次のカードへ
  // -----------------------------

  if (
    studyIndex <
    studyCards.length - 1
  ) {
    setStudyIndex(
      (index) => index + 1
    );

    setShowAnswer(false);

    return;
  }


  // -----------------------------
  // 最後のカード
  // -----------------------------

  const answered =
    nextCorrect +
    nextIncorrect;

  await saveStudyRecord(
    nextCorrect,
    nextIncorrect
  );

  alert(
    "学習終了！\n\n" +
      `正解：${nextCorrect}問\n` +
      `不正解：${nextIncorrect}問\n` +
      `回答：${answered}問\n` +
      `正答率：${
        answered > 0
          ? Math.round(
              (nextCorrect /
                answered) *
                100
            )
          : 0
      }%`
  );

  if (
    typeof window !== "undefined" &&
    "speechSynthesis" in window
  ) {
    window.speechSynthesis.cancel();
  }

  setStudyMode(false);
  setShowAnswer(false);

  setStudyCards([]);
  setStudyIndex(0);

  setStudyCorrect(0);
  setStudyIncorrect(0);

  setStudyStartTime(null);
  setStudySessionId(null);
};

  if (showThemeSettings) {
    return (
    <main className="min-h-screen bg-[#f5f7fc] text-[#26365d] md:flex">
      

      <section className="mx-auto w-full max-w-6xl p-5 md:p-10">
        <header className="mb-7">
          <h1 className="text-3xl font-bold tracking-tight">
            カラー選択
          </h1>

        </header>

        <section className="mb-5 rounded-2xl border border-[#e6ebf5] bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
            
              <p className="mt-1 text-sm text-slate-500">
              </p>
            </div>
            
          </div>

          <div className="grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-4 md:grid-cols-6">
            {presets.map((preset) => {
              const active = color === preset.color;

              return (
                <button
                  key={preset.color}
                  type="button"
                  onClick={() => chooseColor(preset.color)}
                  aria-label={`${preset.name}を選択`}
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
                  <span className="text-sm font-medium text-slate-600">
                    {preset.name}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-[#e6ebf5] bg-white p-6 shadow-sm md:p-8">
          <h2 className="text-lg font-bold">
            🖌 カスタムカラーを選択
          </h2>
          <p className="mb-6 mt-1 text-sm text-slate-500">
            カラーピッカーで自由に色を選択できます。
          </p>

          <div className="grid gap-7 md:grid-cols-2">
            <div>
              <label
                htmlFor="color-picker"
                className="mb-3 block text-sm font-semibold"
              >
                自由に色を選択
              </label>

              <div
                className="relative flex h-48 items-center justify-center overflow-hidden rounded-xl border border-slate-200"
                style={{
                  background: `linear-gradient(135deg, white, ${color})`,
                }}
              >
                <input
                  id="color-picker"
                  type="color"
                  value={color}
                  onChange={(e) => chooseColor(e.target.value)}
                  aria-label="カスタムカラー"
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
                <div
                  className="pointer-events-none rounded-full border-4 border-white px-5 py-3 text-sm font-bold text-white shadow"
                  style={{ backgroundColor: color }}
                >
                  色を変更する
                </div>
              </div>

              <p className="mt-3 text-xs text-slate-400">
                色のエリアをクリックすると、色選択ツールが開きます。
              </p>

              <div className="mt-6 rounded-xl bg-slate-50 p-4">
                <label
                  htmlFor="hue-slider"
                  className="mb-3 block text-sm font-semibold"
                >
                  色相（色の種類）
                </label>
                <input
                  id="hue-slider"
                  type="range"
                  min="0"
                  max="359"
                  value={(() => {
                    const { r, g, b } = rgb;
                    const rr = r / 255;
                    const gg = g / 255;
                    const bb = b / 255;
                    const max = Math.max(rr, gg, bb);
                    const min = Math.min(rr, gg, bb);
                    const d = max - min;
                    if (d === 0) return 0;
                    let h = 0;
                    if (max === rr) h = ((gg - bb) / d) % 6;
                    else if (max === gg) h = (bb - rr) / d + 2;
                    else h = (rr - gg) / d + 4;
                    return Math.round((h * 60 + 360) % 360);
                  })()}
                  onChange={(e) => {
                    const h = Number(e.target.value);
                    const rgbValue = `hsl(${h}, 100%, 50%)`;
                    const canvas = document.createElement("canvas");
                    canvas.width = 1;
                    canvas.height = 1;
                    const ctx = canvas.getContext("2d");
                    if (!ctx) return;
                    ctx.fillStyle = rgbValue;
                    ctx.fillRect(0, 0, 1, 1);
                    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
                    chooseColor(
                      "#" +
                        [r, g, b]
                          .map((v) => v.toString(16).padStart(2, "0"))
                          .join("")
                    );
                  }}
                  className="h-3 w-full cursor-pointer accent-purple-600"
                  style={{
                    background:
                      "linear-gradient(to right, red, yellow, lime, cyan, blue, magenta, red)",
                  }}
                />
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label
                  htmlFor="hex-code"
                  className="mb-2 block text-sm font-semibold"
                >
                  HEX カラーコード
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
                    onBlur={() => {
                      const valid = normalizeHex(hexInput);
                      if (valid) setHexInput(valid);
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
                    aria-label="HEXコードをコピー"
                  >
                    コピー
                  </button>
                </div>
                {hexError && (
                  <p className="mt-1 text-sm text-red-500">
                    #RRGGBB形式で入力してください。
                  </p>
                )}
              </div>

              <div>
                <p className="mb-3 text-sm font-semibold">
                  RGB カラー値
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    ["R", rgb.r],
                    ["G", rgb.g],
                    ["B", rgb.b],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <label
                        className="mb-1 block text-xs text-slate-500"
                        htmlFor={`rgb-${label}`}
                      >
                        {label}
                      </label>
                      <input
                        id={`rgb-${label}`}
                        value={value}
                        readOnly
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 font-mono"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="mb-3 text-sm font-semibold">
                  選択中のカラー
                </p>
                <div
                  className="h-24 rounded-xl shadow-inner"
                  style={{ backgroundColor: color }}
                />
                <p className="mt-3 font-mono text-sm text-slate-600">
                  {color}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-7 flex flex-col gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span
                className="h-12 w-12 shrink-0 rounded-full border-2 border-white shadow"
                style={{ backgroundColor: color }}
              />
              <div>
                <p className="text-sm font-semibold">
                  {saved ? "保存済みのテーマカラー" : "現在のテーマカラー"}
                </p>
                <p className="mt-1 font-mono text-sm text-slate-500">
                  {color}
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-500">
              保存するとテーマカラーとして記録されます。
            </p>
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-6">
            <button
              type="button"
              onClick={cancelColor}
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold hover:bg-slate-50"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={saveColor}
              className="rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-95"
              style={{ backgroundColor: color }}
            >
              {saved ? "保存しました ✓" : "保存する"}
            </button>
          </div>
        </section>
      </section>
    </main>
  );
  }


  // =========================================================
  // 学習記録画面
  // =========================================================

  if (showStudyRecords) {
    const totalAnswered =
      studyRecords.reduce(
        (sum, record) =>
          sum + record.answered,
        0
      );

    const totalCorrect =
      studyRecords.reduce(
        (sum, record) =>
          sum + record.correct,
        0
      );

    const totalIncorrect =
      studyRecords.reduce(
        (sum, record) =>
          sum + record.incorrect,
        0
      );

    const totalDuration =
      studyRecords.reduce(
        (sum, record) =>
          sum + record.duration,
        0
      );

    const overallRate =
      totalAnswered > 0
        ? Math.round(
            (totalCorrect /
              totalAnswered) *
              100
          )
        : 0;

    return (
      <main
        style={{
          maxWidth: "600px",
          margin: "40px auto",
          padding: "20px",
        }}
      >
        <button
          onClick={() =>
            setShowStudyRecords(
              false
            )
          }
          style={{
            marginBottom: "20px",
            padding: "8px 15px",
            border: "none",
            background:
              "transparent",
            color:
              colors.blueDark,
            fontWeight: "bold",
            cursor: "pointer",
            fontSize: "16px",
          }}
        >
          ← デッキ一覧
        </button>

        <h1
          style={{
            color:
              colors.blueDark,
          }}
        >
          学習記録
        </h1>

        {/* 累計 */}

        <div
          style={{
            marginTop: "20px",
            padding: "20px",
            background:
              colors.blueLight,
            border:
              `2px solid ${colors.blue}`,
            borderRadius: "20px",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              color:
                colors.blueDark,
            }}
          >
            累計
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "1fr 1fr",
              gap: "10px",
            }}
          >
            <div>
              回答数
              <br />
              <strong>
                {totalAnswered}問
              </strong>
            </div>

            <div>
              正解
              <br />
              <strong>
                {totalCorrect}問
              </strong>
            </div>

            <div>
              不正解
              <br />
              <strong>
                {totalIncorrect}問
              </strong>
            </div>

            <div>
              正答率
              <br />
              <strong>
                {overallRate}%
              </strong>
            </div>

            <div
              style={{
                gridColumn:
                  "1 / -1",
              }}
            >
              学習時間
              <br />
              <strong>
                {formatDuration(
                  totalDuration
                )}
              </strong>
            </div>
          </div>
        </div>

        {/* 学習履歴 */}

        <div
          style={{
            marginTop: "30px",
          }}
        >
          <h2
            style={{
              color:
                colors.blueDark,
            }}
          >
            学習履歴
          </h2>

          {studyRecords.length ===
          0 ? (
            <div
              style={{
                padding: "30px",
                textAlign:
                  "center",
                background:
                  colors.blueLight,
                borderRadius:
                  "18px",
                color:
                  colors.gray,
              }}
            >
              まだ学習記録がありません。
              <br />
              単語を学習すると、
              ここに記録されます。
            </div>
          ) : (
            studyRecords.map(
              (record) => {
                const rate =
                  record.answered >
                  0
                    ? Math.round(
                        (record.correct /
                          record.answered) *
                          100
                      )
                    : 0;

                return (
                  <div
                    key={
                      record.id
                    }
                    style={{
                      marginBottom:
                        "15px",
                      padding:
                        "18px",
                      background:
                        colors.white,
                      border:
                        `2px solid ${
                          rate >= 80
                            ? colors.blue
                            : colors.pink
                        }`,
                      borderRadius:
                        "18px",
                      boxShadow:
                        "0 3px 10px rgba(100,150,180,0.08)",
                    }}
                  >
                    <div
                      style={{
                        display:
                          "flex",
                        justifyContent:
                          "space-between",
                        alignItems:
                          "center",
                        marginBottom:
                          "10px",
                      }}
                    >
                      <div>
                        <strong
                          style={{
                            fontSize:
                              "18px",
                          }}
                        >
                          {record.date}
                        </strong>

                        {record.time && (
                          <span
                            style={{
                              marginLeft:
                                "8px",
                              color:
                                colors.gray,
                              fontSize:
                                "14px",
                            }}
                          >
                            {record.time}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() =>
                          deleteStudyRecord(
                            record.id
                          )
                        }
                        style={{
                          border:
                            "none",
                          background:
                            "transparent",
                          color:
                            colors.pinkDark,
                          cursor:
                            "pointer",
                        }}
                      >
                        削除
                      </button>
                    </div>

                    <div
                      style={{
                        fontSize:
                          "17px",
                        fontWeight:
                          "bold",
                        marginBottom:
                          "10px",
                      }}
                    >
                      {
                        record.deckName
                      }
                    </div>

                    <div
                      style={{
                        display:
                          "grid",
                        gridTemplateColumns:
                          "1fr 1fr",
                        gap: "8px",
                        color:
                          colors.dark,
                      }}
                    >
                      <div>
                        回答：
                        {
                          record.answered
                        }
                        問
                      </div>

                      <div>
                        正答率：
                        {rate}%
                      </div>

                      <div>
                        正解：
                        {
                          record.correct
                        }
                        問
                      </div>

                      <div>
                        不正解：
                        {
                          record.incorrect
                        }
                        問
                      </div>

                      <div
                        style={{
                          gridColumn:
                            "1 / -1",
                        }}
                      >
                        時間：
                        {formatDuration(
                          record.duration
                        )}
                      </div>
                    </div>
                  </div>
                );
              }
            )
          )}
        </div>
      </main>
    );
  }

  // =========================================================
  // 学習画面
  // =========================================================

  if (studyMode) {
    const card =
      studyCards[
        studyIndex
      ];

    if (!card) {
      return null;
    }

    const currentAnswered =
      studyCorrect +
      studyIncorrect;

    return (
      <main
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          padding:
            "30px 20px",
          textAlign:
            "center",
          background:
            colors.blueLight,
          minHeight:
            "100vh",
          boxSizing:
            "border-box",
        }}
      >
        <div
          style={{
            display:
              "flex",
            justifyContent:
              "space-between",
            alignItems:
              "center",
            marginBottom:
              "20px",
          }}
        >
          <button
            onClick={
              finishStudy
            }
            style={{
              padding:
                "8px 15px",
              border:
                "none",
              background:
                "transparent",
              fontSize:
                "16px",
              cursor:
                "pointer",
              color:
                colors.blueDark,
              fontWeight:
                "bold",
            }}
          >
            ← 戻る
          </button>

          <p
            style={{
              margin: 0,
              color:
                colors.gray,
              fontSize:
                "15px",
            }}
          >
            {studyIndex + 1} /{" "}
            {
              studyCards.length
            }
          </p>
        </div>

        <div
          style={{
            marginBottom:
              "15px",
            fontSize:
              "14px",
            color:
              colors.gray,
          }}
        >
          正解：
          {studyCorrect}
          {"　"}
          不正解：
          {studyIncorrect}
          {"　"}
          回答：
          {currentAnswered}
        </div>

        <div
          onClick={
            toggleAnswer
          }
          style={{
            minHeight:
              "380px",
            padding:
              "40px 25px",
            background:
              showAnswer
                ? colors.pinkLight
                : colors.white,
            border:
              `3px solid ${
                showAnswer
                  ? colors.pink
                  : colors.blue
              }`,
            borderRadius:
              "25px",
            boxShadow:
              "0 5px 18px rgba(100,150,180,0.15)",
            cursor:
              "pointer",
            display:
              "flex",
            flexDirection:
              "column",
            justifyContent:
              "center",
            boxSizing:
              "border-box",
          }}
        >
          {!showAnswer ? (
            <>
              <div
                style={{
                  fontSize:
                    "42px",
                  fontWeight:
                    "bold",
                  marginBottom:
                    "30px",
                }}
              >
                {
                  card.front
                }
              </div>

              <div
                style={{
                  fontSize:
                    "15px",
                  color:
                    colors.gray,
                }}
              >
                タップして答えを見る
              </div>
            </>
          ) : (
            <>
              <div
                style={{
                  fontSize:
                    "36px",
                  fontWeight:
                    "bold",
                  marginBottom:
                    "20px",
                }}
              >
                {
                  card.front
                }
              </div>

              <div
                style={{
                  fontSize:
                    "24px",
                  marginBottom:
                    "15px",
                }}
              >
                {card.pinyin ||
                  "読み方なし"}
              </div>

              <div
                style={{
                  fontSize:
                    "28px",
                  fontWeight:
                    "bold",
                  marginBottom:
                    "25px",
                }}
              >
                {card.japanese ||
                  "日本語訳なし"}
              </div>

              {card.example && (
                <div
                  style={{
                    fontSize:
                      "20px",
                    marginBottom:
                      "12px",
                  }}
                >
                  {
                    card.example
                  }
                </div>
              )}

              {card.exampleJapanese && (
                <div
                  style={{
                    fontSize:
                      "18px",
                    color:
                      colors.gray,
                  }}
                >
                  {
                    card.exampleJapanese
                  }
                </div>
              )}
            </>
          )}
        </div>

        <button
          onClick={() =>
            speakWord(
              card.front
            )
          }
          style={{
            marginTop:
              "20px",
            padding:
              "10px 22px",
            borderRadius:
              "20px",
            border:
              `2px solid ${colors.blue}`,
            background:
              colors.white,
            color:
              colors.blueDark,
            fontSize:
              "16px",
            cursor:
              "pointer",
          }}
        >
          発音
        </button>

        {showAnswer && (
          <div
            style={{
              display: "flex",
              gap: "12px",
              marginTop: "25px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={() => void answerCard(true)}
              style={{
                padding: "14px 28px",
                borderRadius: "16px",
                border: "none",
                background: colors.green,
                color: colors.white,
                fontWeight: "bold",
                cursor: "pointer",
                minWidth: "120px",
              }}
            >
              正解
            </button>
            <button
              type="button"
              onClick={() => void answerCard(false)}
              style={{
                padding: "14px 28px",
                borderRadius: "16px",
                border: "none",
                background: colors.pink,
                color: colors.white,
                fontWeight: "bold",
                cursor: "pointer",
                minWidth: "120px",
              }}
            >
              不正解
            </button>
          </div>
        )}
      </main>
    );
  }


  // =========================================================
  // デッキ詳細
  // =========================================================

  if (deckOpen) {
    const deck =
      decks.find(
        (item) =>
          item.name ===
          currentDeck
      );

    if (!deck) {
      return null;
    }

    // -------------------------------------------------------
    // 検索
    // -------------------------------------------------------

    const normalizedSearch =
      cardSearch
        .trim()
        .toLowerCase();

    const filteredCards =
      normalizedSearch === ""
        ? deck.cards
        : deck.cards.filter(
            (card) => {
              const searchableText =
                [
                  card.front,
                  card.pinyin,
                  card.japanese,
                  card.example,
                  card.exampleJapanese,
                ]
                  .join(" ")
                  .toLowerCase();

              return searchableText.includes(
                normalizedSearch
              );
            }
          );

    return (
      <main
        style={{
          maxWidth:
            "600px",
          margin:
            "40px auto",
          padding:
            "20px",
        }}
      >
        <button
          onClick={() => {
            setDeckOpen(
              false
            );

            setCardSearch("");
          }}
          style={{
            marginBottom:
              "20px",
            padding:
              "8px 15px",
            border:
              "none",
            background:
              "transparent",
            color:
              colors.blueDark,
            fontWeight:
              "bold",
            cursor:
              "pointer",
            fontSize:
              "16px",
          }}
        >
          ← デッキ一覧
        </button>

        <h1
          style={{
            color:
              colors.blueDark,
          }}
        >
          {currentDeck}
        </h1>

        <p
          style={{
            color:
              colors.gray,
          }}
        >
          {deck.cards.length}語
        </p>

        <button
          onClick={
            startStudy
          }
          style={{
            display:
              "block",
            width:
              "100%",
            padding:
              "15px",
            marginTop:
              "20px",
            background:
              colors.blue,
            color:
              colors.white,
            border:
              "none",
            borderRadius:
              "20px",
            fontSize:
              "18px",
            fontWeight:
              "bold",
            cursor:
              "pointer",
          }}
        >
          学習開始
        </button>

        <input
          ref={
            fileInputRef
          }
          type="file"
          accept=".csv,text/csv"
          onChange={
            importCSV
          }
          style={{
            display:
              "none",
          }}
        />

        <button
          onClick={
            openCSVPicker
          }
          style={{
            display:
              "block",
            width:
              "100%",
            padding:
              "15px",
            marginTop:
              "10px",
            background:
              colors.pinkLight,
            border:
              `2px solid ${colors.pink}`,
            color:
              colors.pinkDark,
            borderRadius:
              "20px",
            fontSize:
              "17px",
            fontWeight:
              "bold",
            cursor:
              "pointer",
          }}
        >
          CSVインポート
        </button>

        <button
          onClick={
            openAddCard
          }
          style={{
            display:
              "block",
            width:
              "100%",
            padding:
              "15px",
            marginTop:
              "10px",
            background:
              colors.blueLight,
            border:
              `2px solid ${colors.blue}`,
            color:
              colors.blueDark,
            borderRadius:
              "20px",
            fontSize:
              "17px",
            fontWeight:
              "bold",
            cursor:
              "pointer",
          }}
        >
          単語を追加
        </button>

        {/* 単語フォーム */}

        {showCardForm && (
          <div
            style={{
              marginTop:
                "25px",
              padding:
                "20px",
              background:
                colors.pinkLight,
              border:
                `2px solid ${colors.pink}`,
              borderRadius:
                "20px",
            }}
          >
            <h2
              style={{
                color:
                  colors.pinkDark,
                marginTop:
                  0,
              }}
            >
              {editingCardId
                ? "単語を編集"
                : "単語を追加"}
            </h2>

            <input
              placeholder="単語 *"
              value={
                cardFront
              }
              onChange={(e) =>
                setCardFront(
                  e.target.value
                )
              }
              style={{
                width:
                  "100%",
                padding:
                  "12px",
                boxSizing:
                  "border-box",
                marginBottom:
                  "10px",
                border:
                  `2px solid ${colors.blue}`,
                borderRadius:
                  "12px",
                fontSize:
                  "16px",
              }}
            />

            <input
              placeholder="ピンイン・読み方"
              value={
                cardPinyin
              }
              onChange={(e) =>
                setCardPinyin(
                  e.target.value
                )
              }
              style={{
                width:
                  "100%",
                padding:
                  "12px",
                boxSizing:
                  "border-box",
                marginBottom:
                  "10px",
                border:
                  `2px solid ${colors.blue}`,
                borderRadius:
                  "12px",
                fontSize:
                  "16px",
              }}
            />

            <input
              placeholder="日本語訳"
              value={
                cardJapanese
              }
              onChange={(e) =>
                setCardJapanese(
                  e.target.value
                )
              }
              style={{
                width:
                  "100%",
                padding:
                  "12px",
                boxSizing:
                  "border-box",
                marginBottom:
                  "10px",
                border:
                  `2px solid ${colors.pink}`,
                borderRadius:
                  "12px",
                fontSize:
                  "16px",
              }}
            />

            <input
              placeholder="例文"
              value={
                cardExample
              }
              onChange={(e) =>
                setCardExample(
                  e.target.value
                )
              }
              style={{
                width:
                  "100%",
                padding:
                  "12px",
                boxSizing:
                  "border-box",
                marginBottom:
                  "10px",
                border:
                  `2px solid ${colors.blue}`,
                borderRadius:
                  "12px",
                fontSize:
                  "16px",
              }}
            />

            <input
              placeholder="例文の日本語訳"
              value={
                cardExampleJapanese
              }
              onChange={(e) =>
                setCardExampleJapanese(
                  e.target.value
                )
              }
              style={{
                width:
                  "100%",
                padding:
                  "12px",
                boxSizing:
                  "border-box",
                marginBottom:
                  "15px",
                border:
                  `2px solid ${colors.pink}`,
                borderRadius:
                  "12px",
                fontSize:
                  "16px",
              }}
            />

            <div
              style={{
                display:
                  "flex",
                gap:
                  "10px",
              }}
            >
              <button
                onClick={
                  saveCard
                }
                style={{
                  flex:
                    1,
                  padding:
                    "13px",
                  background:
                    colors.blue,
                  color:
                    colors.white,
                  border:
                    "none",
                  borderRadius:
                    "15px",
                  fontWeight:
                    "bold",
                  cursor:
                    "pointer",
                }}
              >
                保存
              </button>

              <button
                onClick={
                  closeCardForm
                }
                style={{
                  flex:
                    1,
                  padding:
                    "13px",
                  background:
                    colors.white,
                  color:
                    colors.gray,
                  border:
                    `2px solid ${colors.border}`,
                  borderRadius:
                    "15px",
                  fontWeight:
                    "bold",
                  cursor:
                    "pointer",
                }}
              >
                キャンセル
              </button>
            </div>
          </div>
        )}

        {/* 単語一覧 */}

        <div
          style={{
            marginTop:
              "35px",
          }}
        >
          <h2
            style={{
              color:
                colors.blueDark,
              marginBottom:
                "12px",
            }}
          >
            単語一覧
          </h2>

          {/* 検索 */}

          {deck.cards.length >
            0 && (
            <div
              style={{
                marginBottom:
                  "18px",
              }}
            >
              <input
                type="text"
                placeholder="単語を検索"
                value={
                  cardSearch
                }
                onChange={(e) =>
                  setCardSearch(
                    e.target.value
                  )
                }
                style={{
                  width:
                    "100%",
                  padding:
                    "14px 16px",
                  boxSizing:
                    "border-box",
                  border:
                    `2px solid ${colors.blue}`,
                  borderRadius:
                    "14px",
                  fontSize:
                    "17px",
                  outline:
                    "none",
                  background:
                    colors.white,
                }}
              />

              {cardSearch.trim() && (
                <div
                  style={{
                    marginTop:
                      "8px",
                    fontSize:
                      "14px",
                    color:
                      colors.gray,
                  }}
                >
                  {
                    filteredCards.length
                  }
                  語が見つかりました
                </div>
              )}
            </div>
          )}

          {deck.cards.length ===
          0 ? (
            <div
              style={{
                padding:
                  "30px 15px",
                textAlign:
                  "center",
                background:
                  colors.blueLight,
                borderRadius:
                  "18px",
                color:
                  colors.gray,
              }}
            >
              まだ単語がありません
            </div>
          ) : filteredCards.length ===
            0 ? (
            <div
              style={{
                padding:
                  "30px 15px",
                textAlign:
                  "center",
                background:
                  colors.pinkLight,
                borderRadius:
                  "18px",
                color:
                  colors.gray,
              }}
            >
              「
              {cardSearch}
              」に一致する
              単語がありません。
              <br />

              <button
                onClick={() =>
                  setCardSearch(
                    ""
                  )
                }
                style={{
                  marginTop:
                    "12px",
                  padding:
                    "8px 16px",
                  background:
                    colors.white,
                  border:
                    `1px solid ${colors.pink}`,
                  borderRadius:
                    "10px",
                  color:
                    colors.pinkDark,
                  cursor:
                    "pointer",
                }}
              >
                検索をクリア
              </button>
            </div>
          ) : (
            filteredCards.map(
              (card, index) => (
                <div
                  key={
                    card.id
                  }
                  style={{
                    marginBottom:
                      "12px",
                    padding:
                      "15px",
                    background:
                      colors.white,
                    border:
                      `2px solid ${
                        index % 2 ===
                        0
                          ? colors.blue
                          : colors.pink
                      }`,
                    borderRadius:
                      "16px",
                  }}
                >
                  <div
                    style={{
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                      gap:
                        "10px",
                    }}
                  >
                    <div
                      style={{
                        flex:
                          1,
                        minWidth:
                          0,
                      }}
                    >
                      <div
                        style={{
                          fontSize:
                            "21px",
                          fontWeight:
                            "bold",
                          color:
                            colors.dark,
                          marginBottom:
                            "5px",
                        }}
                      >
                        {
                          card.front
                        }
                      </div>

                      {card.pinyin && (
                        <div
                          style={{
                            color:
                              colors.gray,
                            marginBottom:
                              "4px",
                          }}
                        >
                          {
                            card.pinyin
                          }
                        </div>
                      )}

                      {card.japanese && (
                        <div
                          style={{
                            fontSize:
                              "17px",
                          }}
                        >
                          {
                            card.japanese
                          }
                        </div>
                      )}

                      {card.example && (
                        <div
                          style={{
                            marginTop:
                              "8px",
                            fontSize:
                              "14px",
                            color:
                              colors.gray,
                          }}
                        >
                          {
                            card.example
                          }
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        display:
                          "flex",
                        flexDirection:
                          "column",
                        gap:
                          "6px",
                      }}
                    >
                      <button
                        onClick={() =>
                          openEditCard(
                            card
                          )
                        }
                        style={{
                          padding:
                            "8px 12px",
                          background:
                            colors.blueLight,
                          border:
                            `1px solid ${colors.blue}`,
                          color:
                            colors.blueDark,
                          borderRadius:
                            "10px",
                          cursor:
                            "pointer",
                          fontWeight:
                            "bold",
                        }}
                      >
                        編集
                      </button>

                      <button
                        onClick={() =>
                          deleteCard(
                            card.id
                          )
                        }
                        style={{
                          padding:
                            "8px 12px",
                          background:
                            colors.pinkLight,
                          border:
                            `1px solid ${colors.pink}`,
                          color:
                            colors.pinkDark,
                          borderRadius:
                            "10px",
                          cursor:
                            "pointer",
                          fontWeight:
                            "bold",
                        }}
                      >
                        削除
                      </button>
                    </div>
                  </div>
                </div>
              )
            )
          )}
        </div>
      </main>
    );
  }

  // =========================================================
  // デッキ一覧
  // =========================================================

  return (
    <main
      style={{
        maxWidth:
          "600px",
        margin:
          "40px auto",
        padding:
          "20px",
      }}
    >
      



  
<a
  href="/armada"
  style={{
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "20px",
    margin: "20px 0",
    borderRadius: "16px",
    border: "1px solid #c99b62",
    background: "linear-gradient(135deg, #172b3d, #604832)",
    color: "#fff7e8",
    textDecoration: "none",
    cursor: "pointer",
  }}
>
  <span style={{ fontSize: "40px" }}>⛵</span>

  <span style={{ flex: 1 }}>
    <strong
      style={{
        fontSize: "20px",
        display: "block",
        marginBottom: "6px",
      }}
    >
      無敵艦隊 ― 海に消えた航海日誌
    </strong>

    <span style={{ fontSize: "14px", color: "#f0d6ae" }}>
      スペイン語を学びながら、1588年の大海戦を生き抜こう。
      <br />
      🎧 リスニング　📖 リーディング　🎙️ スピーキング　✍️ ライティング
    </span>

    <span
      style={{
        display: "block",
        marginTop: "14px",
        fontWeight: "bold",
        color: "#e6c77c",
      }}
    >
      航海を始める　➜
    </span>
  </span>
</a>



{/* Story 1：中国戦国時代への入口 */}
<a
  href="/story1"
  style={{
    display: "flex",
    alignItems: "center",
    gap: "16px",
    margin: "24px 0",
    padding: "22px",
    borderRadius: "18px",
    border: "1px solid #c9a45c",
    background:
      "linear-gradient(135deg, #172b25 0%, #30483a 60%, #192a24 100%)",
    color: "#f8edcf",
    textDecoration: "none",
    boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
  }}
>
  <div
    style={{
      fontSize: "42px",
      flexShrink: 0,
    }}
  >
    🏯
  </div>

  <div style={{ flex: 1 }}>
    <div
      style={{
        fontSize: "12px",
        letterSpacing: "2px",
        color: "#d9bc79",
        marginBottom: "6px",
      }}
    >
      STORY 01 · 中国戦国時代
    </div>

    <div
      style={{
        fontSize: "22px",
        fontWeight: "bold",
        marginBottom: "6px",
      }}
    >
      戦国策 ― 天下への道 ―
    </div>

    <div
      style={{
        fontSize: "14px",
        lineHeight: 1.7,
        color: "#e4e6d8",
      }}
    >
      言葉を武器に、乱世を生き抜け。
      <br />
      中国語を学びながら、外交官として歴史を動かそう。
    </div>

    <div
      style={{
        marginTop: "14px",
        fontWeight: "bold",
        color: "#e6c77c",
      }}
    >
      物語を始める　➜
    </div>
  </div>
</a>





<a
  href="/game"
  style={{
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "20px",
    margin: "20px 0",
    borderRadius: "16px",
    border: "1px solid #8b6cff",
    background: "linear-gradient(135deg, #20183f, #102a46)",
    color: "#ffffff",
    textDecoration: "none",
    cursor: "pointer",
  }}
>
  <span style={{ fontSize: "40px" }}>⚔️</span>

  <span style={{ flex: 1 }}>
    <strong style={{ fontSize: "20px", display: "block" }}>
      Language Quest
    </strong>
    <span style={{ fontSize: "14px", color: "#c8d5f0" }}>
      言語世界を冒険しよう！
    </span>
  </span>

  <span style={{ fontSize: "24px" }}>➜</span>
</a>




      
      <button
        type="button"
        onClick={() => setShowStudyRecords(true)}
        style={{
          marginBottom: "20px",
          padding: "10px 16px",
          border: `2px solid ${colors.blue}`,
          borderRadius: "14px",
          background: colors.white,
          color: colors.blueDark,
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        学習記録を見る
      </button>

      <button
        type="button"
        onClick={() => {
          setColor(themeColor);
          setSavedColor(themeColor);
          setHexInput(themeColor);
          setShowThemeSettings(true);
        }}
        style={{
          margin: "0 0 20px 10px",
          padding: "10px 16px",
          border: `2px solid ${colors.blue}`,
          borderRadius: "14px",
          background: colors.white,
          color: colors.blueDark,
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        🎨 テーマカラー設定
      </button>

      {/* フォルダ */}

      {folders.map(
        (folder) => (
          <div
            key={
              folder.id
            }
            style={{
              border:
                `2px solid ${colors.blue}`,
              borderRadius:
                "18px",
              padding:
                "15px",
              marginBottom:
                "15px",
              background:
                colors.blueLight,
            }}
          >
            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                marginBottom:
                  "10px",
              }}
            >
              <h2
                style={{
                  margin:
                    0,
                }}
              >
                {
                  folder.name
                }
              </h2>

              <button
                onClick={() =>
                  deleteFolder(
                    folder.id
                  )
                }
                style={{
                  border:
                    "none",
                  background:
                    "transparent",
                  color:
                    colors.pinkDark,
                  cursor:
                    "pointer",
                }}
              >
                削除
              </button>
            </div>

            {decks
              .filter(
                (deck) =>
                  deck.folderId ===
                  folder.id
              )
              .map(
                (deck) => (
                  <div
                    key={
                      deck.name
                    }
                    style={{
                      display:
                        "flex",
                      alignItems:
                        "center",
                      marginBottom:
                        "8px",
                    }}
                  >
                    <button
                      onClick={() => {
                        setCurrentDeck(
                          deck.name
                        );

                        setDeckOpen(
                          true
                        );
                      }}
                      style={{
                        flex:
                          1,
                        padding:
                          "15px",
                        textAlign:
                          "left",
                        background:
                          colors.white,
                        border:
                          `2px solid ${colors.pink}`,
                        borderRadius:
                          "12px",
                        cursor:
                          "pointer",
                      }}
                    >
                      {
                        deck.name
                      }

                      <span
                        style={{
                          marginLeft:
                            "10px",
                          fontSize:
                            "14px",
                          color:
                            colors.gray,
                        }}
                      >
                        {
                          deck
                            .cards
                            .length
                        }
                        語
                      </span>
                    </button>

                    <select
                      value={
                        deck.folderId ||
                        ""
                      }
                      onChange={(
                        e
                      ) =>
                        moveDeck(
                          deck.name,
                          e.target
                            .value ||
                            null
                        )
                      }
                      style={{
                        marginLeft:
                          "8px",
                      }}
                    >
                      <option value="">
                        未分類
                      </option>

                      {folders.map(
                        (
                          folderItem
                        ) => (
                          <option
                            key={
                              folderItem.id
                            }
                            value={
                              folderItem.id
                            }
                          >
                            {
                              folderItem.name
                            }
                          </option>
                        )
                      )}
                    </select>

                    <button
                      onClick={() =>
                        deleteDeck(
                          deck.name
                        )
                      }
                      style={{
                        marginLeft:
                          "8px",
                        border:
                          "none",
                        background:
                          "transparent",
                        color:
                          colors.pinkDark,
                        cursor:
                          "pointer",
                      }}
                    >
                      削除
                    </button>
                  </div>
                )
              )}
          </div>
        )
      )}

      {/* 未分類 */}

      {decks.some(
        (deck) =>
          deck.folderId ===
          null
      ) && (
        <div
          style={{
            border:
              `2px solid ${colors.pink}`,
            borderRadius:
              "18px",
            padding:
              "15px",
            marginBottom:
              "20px",
            background:
              colors.pinkLight,
          }}
        >
          <h2>
            未分類
          </h2>

          {decks
            .filter(
              (deck) =>
                deck.folderId ===
                null
            )
            .map(
              (deck) => (
                <div
                  key={
                    deck.name
                  }
                  style={{
                    display:
                      "flex",
                    alignItems:
                      "center",
                    marginBottom:
                      "8px",
                  }}
                >
                  <button
                    onClick={() => {
                      setCurrentDeck(
                        deck.name
                      );

                      setDeckOpen(
                        true
                      );
                    }}
                    style={{
                      flex:
                        1,
                      padding:
                        "15px",
                      textAlign:
                        "left",
                      background:
                        colors.white,
                      border:
                        `2px solid ${colors.blue}`,
                      borderRadius:
                        "12px",
                      cursor:
                        "pointer",
                    }}
                  >
                    {
                      deck.name
                    }{" "}
                    {
                      deck
                        .cards
                        .length
                    }
                    語
                  </button>

                  <select
                    value={
                      deck.folderId ||
                      ""
                    }
                    onChange={(
                      e
                    ) =>
                      moveDeck(
                        deck.name,
                        e.target
                          .value ||
                          null
                      )
                    }
                    style={{
                      marginLeft:
                        "8px",
                    }}
                  >
                    <option value="">
                      フォルダへ移動
                    </option>

                    {folders.map(
                      (
                        folderItem
                      ) => (
                        <option
                          key={
                            folderItem.id
                          }
                          value={
                            folderItem.id
                          }
                        >
                          {
                            folderItem.name
                          }
                        </option>
                      )
                    )}
                  </select>

                  <button
                    onClick={() =>
                      deleteDeck(
                        deck.name
                      )
                    }
                    style={{
                      marginLeft:
                        "8px",
                      border:
                        "none",
                      background:
                        "transparent",
                      color:
                        colors.pinkDark,
                      cursor:
                        "pointer",
                    }}
                  >
                    削除
                  </button>
                </div>
              )
            )}
        </div>
      )}

      {/* 新しいフォルダ */}

      <h2>
        新しいフォルダ
      </h2>

      <input
        placeholder="例：中国語"
        value={
          newFolderName
        }
        onChange={(e) =>
          setNewFolderName(
            e.target.value
          )
        }
        style={{
          padding:
            "12px",
          width:
            "100%",
          boxSizing:
            "border-box",
          marginBottom:
            "10px",
          border:
            `2px solid ${colors.blue}`,
          borderRadius:
            "12px",
        }}
      />

      <button
        onClick={
          addFolder
        }
        style={{
          padding:
            "12px 30px",
          background:
            colors.pink,
          color:
            colors.white,
          border:
            "none",
          borderRadius:
            "20px",
          cursor:
            "pointer",
          fontWeight:
            "bold",
        }}
      >
        フォルダ作成
      </button>

      {/* 新しいデッキ */}

      <h2>
        新しいデッキ作成
      </h2>

      <input
        placeholder="例：HSK6"
        value={
          newDeckName
        }
        onChange={(e) =>
          setNewDeckName(
            e.target.value
          )
        }
        style={{
          padding:
            "12px",
          width:
            "100%",
          boxSizing:
            "border-box",
          marginBottom:
            "10px",
          border:
            `2px solid ${colors.pink}`,
          borderRadius:
            "12px",
        }}
      />

      <select
        value={
          newDeckLanguage
        }
        onChange={(e) =>
          setNewDeckLanguage(
            e.target.value
          )
        }
        style={{
          padding:
            "12px",
          width:
            "100%",
          marginBottom:
            "10px",
          border:
            `2px solid ${colors.blue}`,
          borderRadius:
            "12px",
        }}
      >
        



<option value="zh-CN">中国語（簡体字）</option>
<option value="zh-TW">中国語（台湾・繁体字）</option>
<option value="de-DE">ドイツ語</option>
<option value="es-ES">スペイン語</option>
<option value="it-IT">イタリア語</option>
<option value="ja-JP">日本語</option>
<option value="ko-KR">韓国語</option>
<option value="nl-NL">オランダ語</option>
<option value="da-DK">デンマーク語</option>
<option value="fr-FR">フランス語</option>
<option value="pt-PT">ポルトガル語（ヨーロッパ）</option>
<option value="pt-BR">ポルトガル語（ブラジル）</option>
<option value="vi-VN">ベトナム語</option>
<option value="sv-SE">スウェーデン語</option>
<option value="nb-NO">ノルウェー語（ブークモール）</option>
<option value="id-ID">インドネシア語</option>
<option value="tr-TR">トルコ語</option>
<option value="pl-PL">ポーランド語</option>
<option value="ru-RU">ロシア語</option>
<option value="el-GR">ギリシャ語</option>
<option value="th-TH">タイ語</option>
<option value="cs-CZ">チェコ語</option>
<option value="ro-RO">ルーマニア語</option>
<option value="hi-IN">ヒンディー語</option>
<option value="ar-SA">アラビア語</option>






        
      </select>

      <select
        value={
          newDeckFolderId ||
          ""
        }
        onChange={(e) =>
          setNewDeckFolderId(
            e.target
              .value ||
              null
          )
        }
        style={{
          padding:
            "12px",
          width:
            "100%",
          marginBottom:
            "10px",
          border:
            `2px solid ${colors.blue}`,
          borderRadius:
            "12px",
        }}
      >
        <option value="">
          フォルダなし
        </option>

        {folders.map(
          (folder) => (
            <option
              key={
                folder.id
              }
              value={
                folder.id
              }
            >
              {
                folder.name
              }
            </option>
          )
        )}
      </select>

      <button
        onClick={
          addDeck
        }
        style={{
          padding:
            "12px 30px",
          background:
            colors.blue,
          color:
            colors.white,
          border:
            "none",
          borderRadius:
            "20px",
          cursor:
            "pointer",
          fontWeight:
            "bold",
        }}
      >
        作成
      </button>
    </main>
  );
}
