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
  deckName: string;
  answered: number;
  correct: number;
  incorrect: number;
  duration: number;
};

const colors = {
  blue: "#8ecae6",
  blueDark: "#4f9fc5",
  blueLight: "#eaf7fc",

  pink: "#f7a8c4",
  pinkDark: "#e783a6",
  pinkLight: "#fff0f5",

  white: "#ffffff",

  gray: "#777777",
  border: "#d9e8ef",
  dark: "#444444",

  green: "#8bcfa4",
  greenLight: "#effaf2",
};

/* =========================================================
   カードをランダムに並べ替える
========================================================= */

const shuffleCards = (cards: Card[]): Card[] => {
  const shuffled = [...cards];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [shuffled[i], shuffled[j]] = [
      shuffled[j],
      shuffled[i],
    ];
  }

  return shuffled;
};

export default function Home() {
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

  const [cardPinyin, setCardPinyin] =
    useState("");

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

              const loadedCards: Card[] =
                Array.isArray(data.cards)
                  ? data.cards.map((card: Card) => ({
                      id:
                        card.id ||
                        `${Date.now()}-${Math.random()}`,

                      front: card.front || "",

                      pinyin: card.pinyin || "",

                      japanese:
                        card.japanese || "",

                      example:
                        card.example || "",

                      exampleJapanese:
                        card.exampleJapanese || "",
                    }))
                  : [];

              return {
                name: data.name || item.id,

                language:
                  data.language || "zh-CN",

                cards: loadedCards,

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

                date: data.date || "",

                deckName:
                  data.deckName || "",

                answered: Number(
                  data.answered || 0
                ),

                correct: Number(
                  data.correct || 0
                ),

                incorrect: Number(
                  data.incorrect || 0
                ),

                duration: Number(
                  data.duration || 0
                ),
              };
            });

          loadedRecords.sort((a, b) =>
            b.date.localeCompare(a.date)
          );

          setStudyRecords(loadedRecords);
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
      (item) => item.name === currentDeck
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

    const card = studyCards[studyIndex];

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
    const name = newDeckName.trim();

    if (!name) {
      alert("デッキ名を入力してください");
      return;
    }

    if (
      decks.some(
        (deck) => deck.name === name
      )
    ) {
      alert("同じ名前のデッキがあります");
      return;
    }

    const newDeck: Deck = {
      name,

      language: newDeckLanguage,

      cards: [],

      folderId: newDeckFolderId,
    };

    try {
      await setDoc(
        doc(db, "decks", name),
        newDeck
      );

      setDecks((currentDecks) => [
        ...currentDecks,
        newDeck,
      ]);

      setCurrentDeck(name);

      setNewDeckName("");

      setNewDeckFolderId(null);

      alert("デッキを作成しました");
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

      const updatedDecks = decks.filter(
        (deck) => deck.name !== deckName
      );

      setDecks(updatedDecks);

      if (currentDeck === deckName) {
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
    const name = newFolderName.trim();

    if (!name) {
      alert(
        "フォルダ名を入力してください"
      );
      return;
    }

    const newFolder: Folder = {
      id: Date.now().toString(),
      name,
    };

    try {
      await setDoc(
        doc(db, "folders", newFolder.id),
        newFolder
      );

      setFolders((currentFolders) => [
        ...currentFolders,
        newFolder,
      ]);

      setNewFolderName("");

      alert("フォルダを作成しました");
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
        doc(db, "folders", folderId)
      );

      const updatedFolders =
        folders.filter(
          (folder) =>
            folder.id !== folderId
        );

      setFolders(updatedFolders);

      const updatedDecks = decks.map(
        (deck) =>
          deck.folderId === folderId
            ? {
                ...deck,
                folderId: null,
              }
            : deck
      );

      setDecks(updatedDecks);

      for (const deck of updatedDecks) {
        await setDoc(
          doc(db, "decks", deck.name),
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
      (item) => item.name === deckName
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
        doc(db, "decks", deckName),
        updatedDeck
      );

      setDecks((currentDecks) =>
        currentDecks.map((item) =>
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
    const input = event.currentTarget;

    const file = input.files?.[0];

    if (!file) {
      return;
    }

    input.value = "";

    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const result = reader.result;

        if (typeof result !== "string") {
          alert(
            "CSVを読み込めませんでした"
          );
          return;
        }

        const text = result.replace(
          /^\uFEFF/,
          ""
        );

        const lines = text
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(
            (line) => line.length > 0
          );

        if (lines.length === 0) {
          alert(
            "CSVにデータがありません"
          );
          return;
        }

        const importedCards: Card[] = [];

        for (const line of lines) {
          const parts = line.split(",");

          const card: Card = {
            id:
              `${Date.now()}-${Math.random()
                .toString(36)
                .slice(2)}`,

            front:
              (parts[0] || "").trim(),

            pinyin:
              (parts[1] || "").trim(),

            japanese:
              (parts[2] || "").trim(),

            example:
              (parts[3] || "").trim(),

            exampleJapanese:
              parts
                .slice(4)
                .join(",")
                .trim(),
          };

          if (card.front) {
            importedCards.push(card);
          }
        }

        if (importedCards.length === 0) {
          alert(
            "単語を読み込めませんでした"
          );
          return;
        }

        const deck = decks.find(
          (item) =>
            item.name === currentDeck
        );

        if (!deck) {
          alert("デッキが見つかりません");
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
          doc(db, "decks", deck.name),
          updatedDeck
        );

        setDecks((currentDecks) =>
          currentDecks.map((item) =>
            item.name === deck.name
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

    setCardFront(card.front);

    setCardPinyin(card.pinyin);

    setCardJapanese(card.japanese);

    setCardExample(card.example);

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
    const front = cardFront.trim();

    if (!front) {
      alert(
        "単語を入力してください"
      );
      return;
    }

    const deck = decks.find(
      (item) =>
        item.name === currentDeck
    );

    if (!deck) {
      alert(
        "現在のデッキが見つかりません"
      );
      return;
    }

    let updatedCards: Card[];

    if (editingCardId) {
      updatedCards = deck.cards.map(
        (card) =>
          card.id === editingCardId
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
        const shouldAdd = confirm(
          `「${front}」はすでに存在します。\n\nそれでも追加しますか？`
        );

        if (!shouldAdd) {
          return;
        }
      }

      const newCard: Card = {
        id:
          `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`,

        front,

        pinyin:
          cardPinyin.trim(),

        japanese:
          cardJapanese.trim(),

        example:
          cardExample.trim(),

        exampleJapanese:
          cardExampleJapanese.trim(),
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
        doc(db, "decks", deck.name),
        updatedDeck
      );

      setDecks((currentDecks) =>
        currentDecks.map((item) =>
          item.name === deck.name
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
    const deck = decks.find(
      (item) =>
        item.name === currentDeck
    );

    if (!deck) {
      return;
    }

    const card = deck.cards.find(
      (item) => item.id === cardId
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

      cards: deck.cards.filter(
        (item) =>
          item.id !== cardId
      ),
    };

    try {
      await setDoc(
        doc(db, "decks", deck.name),
        updatedDeck
      );

      setDecks((currentDecks) =>
        currentDecks.map((item) =>
          item.name === deck.name
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
    const deck = decks.find(
      (item) =>
        item.name === currentDeck
    );

    if (
      !deck ||
      deck.cards.length === 0
    ) {
      alert("単語がありません");
      return;
    }

    const randomizedCards =
      shuffleCards(deck.cards);

    setStudyCards(randomizedCards);

    setStudyIndex(0);

    setShowAnswer(false);

    setStudyCorrect(0);

    setStudyIncorrect(0);

    setStudyStartTime(Date.now());

    setStudyMode(true);
  };

  // =========================================================
  // 学習記録保存
  // =========================================================

  const saveStudyRecord = async (
    force = false
  ) => {
    if (
      studyStartTime === null ||
      (!force &&
        studyCorrect === 0 &&
        studyIncorrect === 0)
    ) {
      return;
    }

    const answered =
      studyCorrect +
      studyIncorrect;

    if (answered === 0) {
      return;
    }

    const duration = Math.max(
      0,
      Math.floor(
        (Date.now() -
          studyStartTime) /
          1000
      )
    );

    const today = new Date()
      .toISOString()
      .slice(0, 10);

    const recordId =
      `${today}_${currentDeck}`;

    const newRecord: StudyRecord = {
      id: recordId,

      date: today,

      deckName: currentDeck,

      answered,

      correct: studyCorrect,

      incorrect: studyIncorrect,

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
          const withoutCurrent =
            currentRecords.filter(
              (record) =>
                record.id !==
                recordId
            );

          return [
            newRecord,
            ...withoutCurrent,
          ].sort(
            (a, b) =>
              b.date.localeCompare(
                a.date
              )
          );
        }
      );
    } catch (error) {
      console.error(
        "学習記録保存エラー:",
        error
      );
    }
  };

  // =========================================================
  // 学習終了
  // =========================================================

  const finishStudy = async () => {
    if (
      typeof window !== "undefined" &&
      "speechSynthesis" in window
    ) {
      window.speechSynthesis.cancel();
    }

    await saveStudyRecord(true);

    setStudyMode(false);

    setShowAnswer(false);

    setStudyCards([]);

    setStudyIndex(0);

    setStudyCorrect(0);

    setStudyIncorrect(0);

    setStudyStartTime(null);
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

  const answerCard = async (
    correct: boolean
  ) => {
    const nextCorrect =
      studyCorrect +
      (correct ? 1 : 0);

    const nextIncorrect =
      studyIncorrect +
      (correct ? 0 : 1);

    setStudyCorrect(
      nextCorrect
    );

    setStudyIncorrect(
      nextIncorrect
    );

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

    const answered =
      nextCorrect +
      nextIncorrect;

    const duration =
      studyStartTime
        ? Math.max(
            0,
            Math.floor(
              (Date.now() -
                studyStartTime) /
                1000
            )
          )
        : 0;

    const today = new Date()
      .toISOString()
      .slice(0, 10);

    const recordId =
      `${today}_${currentDeck}`;

    const newRecord: StudyRecord = {
      id: recordId,

      date: today,

      deckName: currentDeck,

      answered,

      correct: nextCorrect,

      incorrect: nextIncorrect,

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
          const withoutCurrent =
            currentRecords.filter(
              (record) =>
                record.id !==
                recordId
            );

          return [
            newRecord,
            ...withoutCurrent,
          ].sort(
            (a, b) =>
              b.date.localeCompare(
                a.date
              )
          );
        }
      );
    } catch (error) {
      console.error(
        "学習記録保存エラー:",
        error
      );
    }

    alert(
      "学習終了！\n\n" +
        `正解：${nextCorrect}問\n` +
        `不正解：${nextIncorrect}問\n` +
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
  };

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
    const minutes = Math.floor(
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
            setShowStudyRecords(false)
          }
          style={{
            marginBottom: "20px",
            padding: "8px 15px",
            border: "none",
            background: "transparent",
            color: colors.blueDark,
            fontWeight: "bold",
            cursor: "pointer",
            fontSize: "16px",
          }}
        >
          ← デッキ一覧
        </button>

        <h1
          style={{
            color: colors.blueDark,
          }}
        >
          学習記録
        </h1>

        <div
          style={{
            marginTop: "20px",
            padding: "20px",
            background: colors.blueLight,
            border:
              `2px solid ${colors.blue}`,
            borderRadius: "20px",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              color: colors.blueDark,
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
                gridColumn: "1 / -1",
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

        <div
          style={{
            marginTop: "30px",
          }}
        >
          <h2
            style={{
              color: colors.blueDark,
            }}
          >
            学習履歴
          </h2>

          {studyRecords.length === 0 ? (
            <div
              style={{
                padding: "30px",
                textAlign: "center",
                background:
                  colors.blueLight,
                borderRadius: "18px",
                color: colors.gray,
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
                  record.answered > 0
                    ? Math.round(
                        (record.correct /
                          record.answered) *
                          100
                      )
                    : 0;

                return (
                  <div
                    key={record.id}
                    style={{
                      marginBottom: "15px",
                      padding: "18px",
                      background:
                        colors.white,
                      border:
                        `2px solid ${
                          rate >= 80
                            ? colors.blue
                            : colors.pink
                        }`,
                      borderRadius: "18px",
                      boxShadow:
                        "0 3px 10px rgba(100,150,180,0.08)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        alignItems:
                          "center",
                        marginBottom: "10px",
                      }}
                    >
                      <strong
                        style={{
                          fontSize: "18px",
                        }}
                      >
                        {record.date}
                      </strong>

                      <button
                        onClick={() =>
                          deleteStudyRecord(
                            record.id
                          )
                        }
                        style={{
                          border: "none",
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
                        fontSize: "17px",
                        fontWeight: "bold",
                        marginBottom:
                          "10px",
                      }}
                    >
                      {record.deckName}
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "1fr 1fr",
                        gap: "8px",
                        color:
                          colors.dark,
                      }}
                    >
                      <div>
                        回答：
                        {record.answered}問
                      </div>

                      <div>
                        正答率：
                        {rate}%
                      </div>

                      <div>
                        正解：
                        {record.correct}問
                      </div>

                      <div>
                        不正解：
                        {record.incorrect}問
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
      studyCards[studyIndex];

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
          padding: "30px 20px",
          textAlign: "center",
          background:
            colors.blueLight,
          minHeight: "100vh",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <button
            onClick={finishStudy}
            style={{
              padding: "8px 15px",
              border: "none",
              background:
                "transparent",
              fontSize: "16px",
              cursor: "pointer",
              color:
                colors.blueDark,
              fontWeight: "bold",
            }}
          >
            ← 戻る
          </button>

          <p
            style={{
              margin: 0,
              color: colors.gray,
              fontSize: "15px",
            }}
          >
            {studyIndex + 1} /{" "}
            {studyCards.length}
          </p>
        </div>

        <div
          style={{
            marginBottom: "15px",
            fontSize: "14px",
            color: colors.gray,
          }}
        >
          正解：{studyCorrect}
          {"　"}
          不正解：{studyIncorrect}
          {"　"}
          回答：{currentAnswered}
        </div>

        <div
          onClick={toggleAnswer}
          style={{
            minHeight: "380px",
            padding: "40px 25px",
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
            borderRadius: "25px",
            boxShadow:
              "0 5px 18px rgba(100,150,180,0.15)",
            cursor: "pointer",
            display: "flex",
            flexDirection:
              "column",
            justifyContent:
              "center",
            boxSizing: "border-box",
          }}
        >
          {!showAnswer ? (
            <>
              <div
                style={{
                  fontSize: "42px",
                  fontWeight: "bold",
                  marginBottom: "30px",
                }}
              >
                {card.front}
              </div>

              <div
                style={{
                  fontSize: "15px",
                  color: colors.gray,
                }}
              >
                タップして答えを見る
              </div>
            </>
          ) : (
            <>
              <div
                style={{
                  fontSize: "36px",
                  fontWeight: "bold",
                  marginBottom: "20px",
                }}
              >
                {card.front}
              </div>

              <div
                style={{
                  fontSize: "24px",
                  marginBottom: "15px",
                }}
              >
                {card.pinyin ||
                  "読み方なし"}
              </div>

              <div
                style={{
                  fontSize: "28px",
                  fontWeight: "bold",
                  marginBottom: "25px",
                }}
              >
                {card.japanese ||
                  "日本語訳なし"}
              </div>

              {card.example && (
                <div
                  style={{
                    fontSize: "20px",
                    marginBottom: "12px",
                  }}
                >
                  {card.example}
                </div>
              )}

              {card.exampleJapanese && (
                <div
                  style={{
                    fontSize: "18px",
                    color: colors.gray,
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
            speakWord(card.front)
          }
          style={{
            marginTop: "20px",
            padding: "10px 22px",
            borderRadius: "20px",
            border:
              `2px solid ${colors.blue}`,
            background:
              colors.white,
            color:
              colors.blueDark,
            fontSize: "16px",
            cursor: "pointer",
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
            }}
          >
            <button
              onClick={() =>
                answerCard(false)
              }
              style={{
                flex: 1,
                padding:
                  "18px 10px",
                background:
                  colors.pink,
                color:
                  colors.white,
                border: "none",
                borderRadius:
                  "18px",
                fontSize: "18px",
                fontWeight:
                  "bold",
                cursor: "pointer",
              }}
            >
              不正解
            </button>

            <button
              onClick={() =>
                answerCard(true)
              }
              style={{
                flex: 1,
                padding:
                  "18px 10px",
                background:
                  colors.blue,
                color:
                  colors.white,
                border: "none",
                borderRadius:
                  "18px",
                fontSize: "18px",
                fontWeight:
                  "bold",
                cursor: "pointer",
              }}
            >
              正解
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
    const deck = decks.find(
      (item) =>
        item.name === currentDeck
    );

    if (!deck) {
      return null;
    }

    // =======================================================
    // 検索
    // =======================================================

    const normalizedSearch =
      cardSearch
        .trim()
        .toLowerCase();

    const filteredCards =
      normalizedSearch === ""
        ? deck.cards
        : deck.cards.filter(
            (card) => {
              const searchableText = [
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
          maxWidth: "600px",
          margin: "40px auto",
          padding: "20px",
        }}
      >
        <button
          onClick={() => {
            setDeckOpen(false);
            setCardSearch("");
          }}
          style={{
            marginBottom: "20px",
            padding: "8px 15px",
            border: "none",
            background:
              "transparent",
            color:
              colors.blueDark,
            fontWeight: "bold",
            cursor:
              "pointer",
            fontSize: "16px",
          }}
        >
          ← デッキ一覧
        </button>

        <h1
          style={{
            color: colors.blueDark,
          }}
        >
          {currentDeck}
        </h1>

        <p
          style={{
            color: colors.gray,
          }}
        >
          {deck.cards.length}語
        </p>

        <button
          onClick={startStudy}
          style={{
            display: "block",
            width: "100%",
            padding: "15px",
            marginTop: "20px",
            background:
              colors.blue,
            color:
              colors.white,
            border: "none",
            borderRadius:
              "20px",
            fontSize: "18px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          学習開始
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={importCSV}
          style={{
            display: "none",
          }}
        />

        <button
          onClick={openCSVPicker}
          style={{
            display: "block",
            width: "100%",
            padding: "15px",
            marginTop: "10px",
            background:
              colors.pinkLight,
            border:
              `2px solid ${colors.pink}`,
            color:
              colors.pinkDark,
            borderRadius:
              "20px",
            fontSize: "17px",
            fontWeight: "bold",
            cursor:
              "pointer",
          }}
        >
          CSVインポート
        </button>

        <button
          onClick={openAddCard}
          style={{
            display: "block",
            width: "100%",
            padding: "15px",
            marginTop: "10px",
            background:
              colors.blueLight,
            border:
              `2px solid ${colors.blue}`,
            color:
              colors.blueDark,
            borderRadius:
              "20px",
            fontSize: "17px",
            fontWeight: "bold",
            cursor:
              "pointer",
          }}
        >
          単語を追加
        </button>

        {/* ===================================================
            単語フォーム
        =================================================== */}

        {showCardForm && (
          <div
            style={{
              marginTop: "25px",
              padding: "20px",
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
                marginTop: 0,
              }}
            >
              {editingCardId
                ? "単語を編集"
                : "単語を追加"}
            </h2>

            <input
              placeholder="単語 *"
              value={cardFront}
              onChange={(e) =>
                setCardFront(
                  e.target.value
                )
              }
              style={{
                width: "100%",
                padding: "12px",
                boxSizing:
                  "border-box",
                marginBottom:
                  "10px",
                border:
                  `2px solid ${colors.blue}`,
                borderRadius:
                  "12px",
                fontSize: "16px",
              }}
            />

            <input
              placeholder="ピンイン・読み方"
              value={cardPinyin}
              onChange={(e) =>
                setCardPinyin(
                  e.target.value
                )
              }
              style={{
                width: "100%",
                padding: "12px",
                boxSizing:
                  "border-box",
                marginBottom:
                  "10px",
                border:
                  `2px solid ${colors.blue}`,
                borderRadius:
                  "12px",
                fontSize: "16px",
              }}
            />

            <input
              placeholder="日本語訳"
              value={cardJapanese}
              onChange={(e) =>
                setCardJapanese(
                  e.target.value
                )
              }
              style={{
                width: "100%",
                padding: "12px",
                boxSizing:
                  "border-box",
                marginBottom:
                  "10px",
                border:
                  `2px solid ${colors.pink}`,
                borderRadius:
                  "12px",
                fontSize: "16px",
              }}
            />

            <input
              placeholder="例文"
              value={cardExample}
              onChange={(e) =>
                setCardExample(
                  e.target.value
                )
              }
              style={{
                width: "100%",
                padding: "12px",
                boxSizing:
                  "border-box",
                marginBottom:
                  "10px",
                border:
                  `2px solid ${colors.blue}`,
                borderRadius:
                  "12px",
                fontSize: "16px",
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
                width: "100%",
                padding: "12px",
                boxSizing:
                  "border-box",
                marginBottom:
                  "15px",
                border:
                  `2px solid ${colors.pink}`,
                borderRadius:
                  "12px",
                fontSize: "16px",
              }}
            />

            <div
              style={{
                display: "flex",
                gap: "10px",
              }}
            >
              <button
                onClick={saveCard}
                style={{
                  flex: 1,
                  padding: "13px",
                  background:
                    colors.blue,
                  color:
                    colors.white,
                  border: "none",
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
                onClick={closeCardForm}
                style={{
                  flex: 1,
                  padding: "13px",
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

        {/* ===================================================
            単語一覧
        =================================================== */}

        <div
          style={{
            marginTop: "35px",
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

          {/* 検索ボックス */}

          {deck.cards.length > 0 && (
            <div
              style={{
                marginBottom:
                  "18px",
              }}
            >
              <input
                type="text"
                placeholder="単語を検索"
                value={cardSearch}
                onChange={(e) =>
                  setCardSearch(
                    e.target.value
                  )
                }
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  boxSizing:
                    "border-box",
                  border:
                    `2px solid ${colors.blue}`,
                  borderRadius:
                    "14px",
                  fontSize: "17px",
                  outline: "none",
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
                  {filteredCards.length}
                  語が見つかりました
                </div>
              )}
            </div>
          )}

          {deck.cards.length === 0 ? (
            <div
              style={{
                padding: "30px 15px",
                textAlign: "center",
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
          ) : filteredCards.length === 0 ? (
            <div
              style={{
                padding: "30px 15px",
                textAlign: "center",
                background:
                  colors.pinkLight,
                borderRadius:
                  "18px",
                color:
                  colors.gray,
              }}
            >
              「{cardSearch}」に一致する
              単語がありません。
              <br />
              <button
                onClick={() =>
                  setCardSearch("")
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
                  key={card.id}
                  style={{
                    marginBottom:
                      "12px",
                    padding: "15px",
                    background:
                      colors.white,
                    border:
                      `2px solid ${
                        index % 2 === 0
                          ? colors.blue
                          : colors.pink
                      }`,
                    borderRadius:
                      "16px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      gap: "10px",
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
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
                        {card.front}
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
                          {card.pinyin}
                        </div>
                      )}

                      {card.japanese && (
                        <div
                          style={{
                            fontSize:
                              "17px",
                          }}
                        >
                          {card.japanese}
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
                          {card.example}
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        display:
                          "flex",
                        flexDirection:
                          "column",
                        gap: "6px",
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
        maxWidth: "600px",
        margin: "40px auto",
        padding: "20px",
      }}
    >
      <h1
        style={{
          color: colors.blueDark,
        }}
      >
        デッキ
      </h1>

      {/* 学習記録 */}

      <button
        onClick={() =>
          setShowStudyRecords(true)
        }
        style={{
          display: "block",
          width: "100%",
          padding: "15px",
          marginBottom: "25px",
          background:
            colors.greenLight,
          border:
            `2px solid ${colors.green}`,
          color: "#4b9b63",
          borderRadius: "20px",
          fontSize: "18px",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        学習記録を見る
      </button>

      {/* フォルダ */}

      {folders.map((folder) => (
        <div
          key={folder.id}
          style={{
            border:
              `2px solid ${colors.blue}`,
            borderRadius: "18px",
            padding: "15px",
            marginBottom: "15px",
            background:
              colors.blueLight,
          }}
        >
          <div
            style={{
              display: "flex",
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
                margin: 0,
              }}
            >
              {folder.name}
            </h2>

            <button
              onClick={() =>
                deleteFolder(
                  folder.id
                )
              }
              style={{
                border: "none",
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
            .map((deck) => (
              <div
                key={deck.name}
                style={{
                  display: "flex",
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
                    flex: 1,
                    padding: "15px",
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
                  {deck.name}

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
                    {deck.cards.length}
                    語
                  </span>
                </button>

                <select
                  value={
                    deck.folderId ||
                    ""
                  }
                  onChange={(e) =>
                    moveDeck(
                      deck.name,
                      e.target.value ||
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
                    (folderItem) => (
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
                    border: "none",
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
            ))}
        </div>
      ))}

      {/* 未分類 */}

      {decks.some(
        (deck) =>
          deck.folderId === null
      ) && (
        <div
          style={{
            border:
              `2px solid ${colors.pink}`,
            borderRadius:
              "18px",
            padding: "15px",
            marginBottom:
              "20px",
            background:
              colors.pinkLight,
          }}
        >
          <h2>未分類</h2>

          {decks
            .filter(
              (deck) =>
                deck.folderId === null
            )
            .map((deck) => (
              <div
                key={deck.name}
                style={{
                  display: "flex",
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
                    flex: 1,
                    padding: "15px",
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
                  {deck.name}{" "}
                  {deck.cards.length}語
                </button>

                <select
                  value={
                    deck.folderId ||
                    ""
                  }
                  onChange={(e) =>
                    moveDeck(
                      deck.name,
                      e.target.value ||
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
                    (folderItem) => (
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
                    border: "none",
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
            ))}
        </div>
      )}

      {/* 新しいフォルダ */}

      <h2>
        新しいフォルダ
      </h2>

      <input
        placeholder="例：中国語"
        value={newFolderName}
        onChange={(e) =>
          setNewFolderName(
            e.target.value
          )
        }
        style={{
          padding: "12px",
          width: "100%",
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
        onClick={addFolder}
        style={{
          padding:
            "12px 30px",
          background:
            colors.pink,
          color:
            colors.white,
          border: "none",
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
        value={newDeckName}
        onChange={(e) =>
          setNewDeckName(
            e.target.value
          )
        }
        style={{
          padding: "12px",
          width: "100%",
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
        value={newDeckLanguage}
        onChange={(e) =>
          setNewDeckLanguage(
            e.target.value
          )
        }
        style={{
          padding: "12px",
          width: "100%",
          marginBottom:
            "10px",
          border:
            `2px solid ${colors.blue}`,
          borderRadius:
            "12px",
        }}
      >
        <option value="zh-CN">
          中国語
        </option>

        <option value="de-DE">
          ドイツ語
        </option>

        <option value="es-ES">
          スペイン語
        </option>

        <option value="it-IT">
          イタリア語
        </option>

        <option value="ja-JP">
          日本語
        </option>
      </select>

      <select
        value={
          newDeckFolderId || ""
        }
        onChange={(e) =>
          setNewDeckFolderId(
            e.target.value ||
              null
          )
        }
        style={{
          padding: "12px",
          width: "100%",
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

        {folders.map((folder) => (
          <option
            key={folder.id}
            value={folder.id}
          >
            {folder.name}
          </option>
        ))}
      </select>

      <button
        onClick={addDeck}
        style={{
          padding:
            "12px 30px",
          background:
            colors.blue,
          color:
            colors.white,
          border: "none",
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