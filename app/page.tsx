"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";

type Folder = {
  id: string;
  name: string;
};

type Card = {
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

export default function Home() {
  const [folders, setFolders] = useState<Folder[]>([
    {
      id: "default",
      name: "中国語",
    },
  ]);

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

  const [studyMode, setStudyMode] = useState(false);
  const [studyIndex, setStudyIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const [newDeckName, setNewDeckName] = useState("");
  const [newDeckLanguage, setNewDeckLanguage] = useState("zh-CN");
  const [newDeckFolderId, setNewDeckFolderId] = useState<string | null>(null);

  const [newFolderName, setNewFolderName] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // =========================
  // 音声
  // =========================

  const speakWord = (word: string) => {
    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window)
    ) {
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "zh-CN";
    utterance.rate = 0.8;

    window.speechSynthesis.speak(utterance);
  };

  // =========================
  // 学習中の自動音声
  // =========================

  useEffect(() => {
    if (!studyMode) {
      return;
    }

    const deck = decks.find((item) => item.name === currentDeck);

    if (!deck || deck.cards.length === 0) {
      return;
    }

    const card = deck.cards[studyIndex];

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
  }, [studyMode, studyIndex, currentDeck, decks]);

  // =========================
  // デッキ作成
  // =========================

  const addDeck = () => {
    if (!newDeckName.trim()) {
      alert("デッキ名を入力してください");
      return;
    }

    const newDeck: Deck = {
      name: newDeckName.trim(),
      language: newDeckLanguage,
      cards: [],
      folderId: newDeckFolderId,
    };

    setDecks((currentDecks) => [...currentDecks, newDeck]);

    setCurrentDeck(newDeck.name);
    setNewDeckName("");
    setNewDeckFolderId(null);
  };

  // =========================
  // デッキ削除
  // =========================

  const deleteDeck = (deckName: string) => {
    const updatedDecks = decks.filter(
      (deck) => deck.name !== deckName
    );

    setDecks(updatedDecks);

    if (currentDeck === deckName) {
      setCurrentDeck(
        updatedDecks.length > 0 ? updatedDecks[0].name : ""
      );

      setDeckOpen(false);
    }
  };

  // =========================
  // フォルダ作成
  // =========================

  const addFolder = () => {
    if (!newFolderName.trim()) {
      alert("フォルダ名を入力してください");
      return;
    }

    const newFolder: Folder = {
      id: Date.now().toString(),
      name: newFolderName.trim(),
    };

    setFolders((currentFolders) => [
      ...currentFolders,
      newFolder,
    ]);

    setNewFolderName("");
  };

  // =========================
  // フォルダ削除
  // =========================

  const deleteFolder = (folderId: string) => {
    setFolders((currentFolders) =>
      currentFolders.filter(
        (folder) => folder.id !== folderId
      )
    );

    setDecks((currentDecks) =>
      currentDecks.map((deck) =>
        deck.folderId === folderId
          ? { ...deck, folderId: null }
          : deck
      )
    );
  };

  // =========================
  // デッキ移動
  // =========================

  const moveDeck = (
    deckName: string,
    folderId: string | null
  ) => {
    setDecks((currentDecks) =>
      currentDecks.map((deck) =>
        deck.name === deckName
          ? { ...deck, folderId }
          : deck
      )
    );
  };

  // =========================
  // CSVインポート
  // =========================

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

    reader.onload = () => {
      try {
        const result = reader.result;

        if (typeof result !== "string") {
          alert("CSVを読み込めませんでした");
          return;
        }

        const text = result.replace(/^\uFEFF/, "");

        const lines = text
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter((line) => line.length > 0);

        if (lines.length === 0) {
          alert("CSVにデータがありません");
          return;
        }

        const importedCards: Card[] = [];

        for (const line of lines) {
          const parts = line.split(",");

          const card: Card = {
            front: (parts[0] || "").trim(),
            pinyin: (parts[1] || "").trim(),
            japanese: (parts[2] || "").trim(),
            example: (parts[3] || "").trim(),
            exampleJapanese: parts
              .slice(4)
              .join(",")
              .trim(),
          };

          if (card.front.length > 0) {
            importedCards.push(card);
          }
        }

        if (importedCards.length === 0) {
          alert("単語を読み込めませんでした");
          return;
        }

        setDecks((currentDecks) =>
          currentDecks.map((deck) => {
            if (deck.name !== currentDeck) {
              return deck;
            }

            return {
              ...deck,
              cards: [
                ...deck.cards,
                ...importedCards,
              ],
            };
          })
        );

        alert(
          importedCards.length +
            "語をインポートしました"
        );
      } catch (error) {
        console.error(error);
        alert("CSVの読み込み中にエラーが発生しました");
      }
    };

    reader.onerror = () => {
      alert("CSVファイルを読み込めませんでした");
    };

    reader.readAsText(file, "UTF-8");
  };

  const openCSVPicker = () => {
    fileInputRef.current?.click();
  };

  // =========================
  // 学習開始
  // =========================

  const startStudy = () => {
    const deck = decks.find(
      (item) => item.name === currentDeck
    );

    if (!deck || deck.cards.length === 0) {
      alert("単語がありません");
      return;
    }

    setStudyIndex(0);
    setShowAnswer(false);
    setStudyMode(true);
  };

  // =========================
  // 学習終了
  // =========================

  const finishStudy = () => {
    if (
      typeof window !== "undefined" &&
      "speechSynthesis" in window
    ) {
      window.speechSynthesis.cancel();
    }

    setStudyMode(false);
    setShowAnswer(false);
    setStudyIndex(0);
  };

  // =========================
  // 次のカード
  // =========================

  const nextCard = () => {
    const deck = decks.find(
      (item) => item.name === currentDeck
    );

    if (!deck) {
      return;
    }

    if (studyIndex < deck.cards.length - 1) {
      setStudyIndex((index) => index + 1);
      setShowAnswer(false);
    } else {
      alert("学習終了！");
      finishStudy();
    }
  };

  // =========================
  // 学習画面
  // =========================

  if (studyMode) {
    const deck = decks.find(
      (item) => item.name === currentDeck
    );

    if (!deck || deck.cards.length === 0) {
      return null;
    }

    const card = deck.cards[studyIndex];

    return (
      <main
        style={{
          maxWidth: "600px",
          margin: "40px auto",
          padding: "20px",
          textAlign: "center",
        }}
      >
        <button
          onClick={finishStudy}
          style={{
            marginBottom: "30px",
            padding: "8px 15px",
          }}
        >
          ← デッキに戻る
        </button>

        <p
          style={{
            fontSize: "16px",
            color: "#777",
          }}
        >
          {studyIndex + 1} / {deck.cards.length}
        </p>

        <div
          style={{
            marginTop: "60px",
            marginBottom: "20px",
            fontSize: "36px",
            fontWeight: "bold",
          }}
        >
          {card.front}
        </div>

        <button
          onClick={() => speakWord(card.front)}
          style={{
            marginBottom: "40px",
            padding: "10px 22px",
            borderRadius: "20px",
            border: "1px solid #ccc",
            background: "white",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          🔊 発音
        </button>

        {!showAnswer ? (
          <button
            onClick={() => setShowAnswer(true)}
            style={{
              display: "block",
              width: "100%",
              padding: "18px",
              background: "#cdb4db",
              color: "white",
              border: "none",
              borderRadius: "20px",
              fontSize: "20px",
              cursor: "pointer",
            }}
          >
            答えを見る
          </button>
        ) : (
          <>
            <div
              style={{
                marginBottom: "30px",
                padding: "25px",
                background: "#f5f0f7",
                borderRadius: "15px",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  fontSize: "22px",
                  marginBottom: "15px",
                }}
              >
                🔤 {card.pinyin || "ピンインなし"}
              </div>

              <div
                style={{
                  fontSize: "24px",
                  marginBottom: "20px",
                  fontWeight: "bold",
                }}
              >
                🇯🇵 {card.japanese || "日本語訳なし"}
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
                    color: "#666",
                  }}
                >
                  {card.exampleJapanese}
                </div>
              )}
            </div>

            <button
              onClick={nextCard}
              style={{
                display: "block",
                width: "100%",
                padding: "18px",
                background: "#cdb4db",
                color: "white",
                border: "none",
                borderRadius: "20px",
                fontSize: "20px",
                cursor: "pointer",
              }}
            >
              {studyIndex < deck.cards.length - 1
                ? "次の単語"
                : "学習終了"}
            </button>
          </>
        )}
      </main>
    );
  }

  // =========================
  // デッキ詳細画面
  // =========================

  if (deckOpen) {
    const deck = decks.find(
      (item) => item.name === currentDeck
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
          onClick={() => setDeckOpen(false)}
          style={{
            marginBottom: "20px",
            padding: "8px 15px",
          }}
        >
          ← デッキ一覧
        </button>

        <h1>{currentDeck}</h1>

        <p>{deck?.cards.length || 0}語</p>

        <button
          onClick={startStudy}
          style={{
            display: "block",
            width: "100%",
            padding: "15px",
            marginTop: "20px",
            background: "#cdb4db",
            color: "white",
            border: "none",
            borderRadius: "20px",
            fontSize: "18px",
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
            cursor: "pointer",
          }}
        >
          CSVインポート
        </button>

        <button
          style={{
            display: "block",
            width: "100%",
            padding: "15px",
            marginTop: "10px",
            cursor: "pointer",
          }}
        >
          単語追加
        </button>
      </main>
    );
  }

  // =========================
  // デッキ一覧画面
  // =========================

  return (
    <main
      style={{
        maxWidth: "600px",
        margin: "40px auto",
        padding: "20px",
      }}
    >
      <h1>📚 デッキ</h1>

      {folders.map((folder) => (
        <div
          key={folder.id}
          style={{
            border: "1px solid #ddd",
            borderRadius: "12px",
            padding: "15px",
            marginBottom: "15px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "10px",
            }}
          >
            <h2 style={{ margin: 0 }}>
              📁 {folder.name}
            </h2>

            <button
              onClick={() => deleteFolder(folder.id)}
            >
              削除
            </button>
          </div>

          {decks
            .filter(
              (deck) => deck.folderId === folder.id
            )
            .map((deck) => (
              <div
                key={deck.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "8px",
                }}
              >
                <button
                  onClick={() => {
                    setCurrentDeck(deck.name);
                    setDeckOpen(true);
                  }}
                  style={{
                    flex: 1,
                    padding: "15px",
                    textAlign: "left",
                    background: "white",
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                    cursor: "pointer",
                  }}
                >
                  {deck.name}

                  <span
                    style={{
                      marginLeft: "10px",
                      fontSize: "14px",
                    }}
                  >
                    {deck.cards.length}語
                  </span>
                </button>

                <select
                  value={deck.folderId || ""}
                  onChange={(e) =>
                    moveDeck(
                      deck.name,
                      e.target.value || null
                    )
                  }
                  style={{
                    marginLeft: "8px",
                  }}
                >
                  <option value="">未分類</option>

                  {folders.map((folderItem) => (
                    <option
                      key={folderItem.id}
                      value={folderItem.id}
                    >
                      {folderItem.name}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() =>
                    deleteDeck(deck.name)
                  }
                  style={{
                    marginLeft: "8px",
                  }}
                >
                  削除
                </button>
              </div>
            ))}
        </div>
      ))}

      {decks.some(
        (deck) => deck.folderId === null
      ) && (
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: "12px",
            padding: "15px",
            marginBottom: "20px",
          }}
        >
          <h2>📂 未分類</h2>

          {decks
            .filter(
              (deck) => deck.folderId === null
            )
            .map((deck) => (
              <div
                key={deck.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "8px",
                }}
              >
                <button
                  onClick={() => {
                    setCurrentDeck(deck.name);
                    setDeckOpen(true);
                  }}
                  style={{
                    flex: 1,
                    padding: "15px",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  {deck.name} {deck.cards.length}語
                </button>

                <select
                  value={deck.folderId || ""}
                  onChange={(e) =>
                    moveDeck(
                      deck.name,
                      e.target.value || null
                    )
                  }
                  style={{
                    marginLeft: "8px",
                  }}
                >
                  <option value="">
                    フォルダへ移動
                  </option>

                  {folders.map((folderItem) => (
                    <option
                      key={folderItem.id}
                      value={folderItem.id}
                    >
                      {folderItem.name}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() =>
                    deleteDeck(deck.name)
                  }
                  style={{
                    marginLeft: "8px",
                  }}
                >
                  削除
                </button>
              </div>
            ))}
        </div>
      )}

      <h2>新しいフォルダ</h2>

      <input
        placeholder="例：中国語"
        value={newFolderName}
        onChange={(e) =>
          setNewFolderName(e.target.value)
        }
        style={{
          padding: "10px",
          width: "100%",
          boxSizing: "border-box",
          marginBottom: "10px",
        }}
      />

      <button
        onClick={addFolder}
        style={{
          padding: "12px 30px",
          background: "#cdb4db",
          color: "white",
          border: "none",
          borderRadius: "20px",
          cursor: "pointer",
        }}
      >
        ＋ フォルダ作成
      </button>

      <h2>新しいデッキ作成</h2>

      <input
        placeholder="例：HSK6"
        value={newDeckName}
        onChange={(e) =>
          setNewDeckName(e.target.value)
        }
        style={{
          padding: "10px",
          width: "100%",
          boxSizing: "border-box",
          marginBottom: "10px",
        }}
      />

      <select
        value={newDeckLanguage}
        onChange={(e) =>
          setNewDeckLanguage(e.target.value)
        }
        style={{
          padding: "10px",
          width: "100%",
          marginBottom: "10px",
        }}
      >
        <option value="zh-CN">中国語</option>
        <option value="de-DE">ドイツ語</option>
        <option value="es-ES">スペイン語</option>
        <option value="it-IT">イタリア語</option>
        <option value="ja-JP">日本語</option>
      </select>

      <select
        value={newDeckFolderId || ""}
        onChange={(e) =>
          setNewDeckFolderId(
            e.target.value || null
          )
        }
        style={{
          padding: "10px",
          width: "100%",
          marginBottom: "10px",
        }}
      >
        <option value="">フォルダなし</option>

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
          padding: "12px 30px",
          background: "#cdb4db",
          color: "white",
          border: "none",
          borderRadius: "20px",
          cursor: "pointer",
        }}
      >
        作成
      </button>
    </main>
  );
}