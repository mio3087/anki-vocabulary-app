"use client";

import { useState } from "react";

type Deck = {
  name: string;
  language: string;
  words: string[];
};

export default function Home() {
  const [decks, setDecks] = useState<Deck[]>([
    {
      name: "中国語",
      language: "zh-CN",
      words: [],
    },
  ]);

  const [currentDeck, setCurrentDeck] = useState("中国語");
  const [deckOpen, setDeckOpen] = useState(false);

  const [newDeckName, setNewDeckName] = useState("");
  const [newDeckLanguage, setNewDeckLanguage] = useState("zh-CN");

  const addDeck = () => {
    if (!newDeckName.trim()) {
      alert("デッキ名を入力してください");
      return;
    }

    const newDeck: Deck = {
      name: newDeckName,
      language: newDeckLanguage,
      words: [],
    };

    setDecks([...decks, newDeck]);

    setCurrentDeck(newDeck.name);

    setNewDeckName("");
  };

  const deleteDeck = (deckName: string) => {
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
    }
  };




  if (deckOpen) {
  const deck = decks.find(
    (deck) => deck.name === currentDeck
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
      >
        ← デッキ一覧に戻る

      
      </button>

      <h1>{currentDeck}</h1>

      <p>
        {deck?.words.length ?? 0}語
      </p>

      <button
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
  }}
>
  学習開始
</button>

<button
  style={{
    display: "block",
    width: "100%",
    padding: "15px",
    marginTop: "10px",
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
  }}
>
  単語追加
</button>


    </main>
  );
}






  return (
    <main
      style={{
        maxWidth: "600px",
        margin: "40px auto",
        padding: "20px",
      }}
    >
      <h1>デッキ</h1>

      {/* デッキ一覧 */}
      <div>
        {decks.map((deck) => (
          <div
            key={deck.name}
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "10px",
            }}
          >
            <button
            onClick={() => {
  setCurrentDeck(deck.name);
  setDeckOpen(true);
}}
              style={{
                flex: 1,
                padding: "20px",
                textAlign: "left",
                fontSize: "18px",
                background:
                  currentDeck === deck.name
                    ? "#cdb4db"
                    : "white",
                border: "1px solid #ccc",
                borderRadius: "10px",
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
                {deck.words.length}語
              </span>
            </button>

            <button
              onClick={() => deleteDeck(deck.name)}
              style={{
                marginLeft: "10px",
                padding: "8px 12px",
              }}
            >
              削除
            </button>
          </div>
        ))}
      </div>

      {/* 新しいデッキ作成 */}
      <h2>新しいデッキ作成</h2>

      <input
        placeholder="例：イタリア語"
        value={newDeckName}
        onChange={(e) =>
          setNewDeckName(e.target.value)
        }
        style={{
          padding: "10px",
          width: "100%",
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