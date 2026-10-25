
"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";


type Question = {
  word: string;
  meaning: string;
  choices: string[];
};




type AnkiCard = {
  id: string;
  front: string;
  pinyin?: string;
  japanese: string;
  example?: string;
  exampleJapanese?: string;
};

type AnkiDeck = {
  name: string;
  language: string;
  cards: AnkiCard[];
};


type SaveData = {
  level: number;
  exp: number;
  gold: number;
  wins: number;
  correct: number;
  answered: number;
  bestStreak: number;
  achievements: string[];
};

const QUESTIONS: Record<string, Question[]> = {
  韓国語: [
    { word: "감사합니다", meaning: "ありがとうございます", choices: ["こんにちは", "ありがとうございます", "ごめんなさい", "さようなら"] },
    { word: "안녕하세요", meaning: "こんにちは", choices: ["おやすみなさい", "ありがとう", "こんにちは", "また明日"] },
    { word: "사랑", meaning: "愛", choices: ["愛", "学校", "友達", "家族"] },
    { word: "친구", meaning: "友達", choices: ["先生", "友達", "学生", "会社"] },
    { word: "물", meaning: "水", choices: ["火", "水", "空", "土"] },
    { word: "학교", meaning: "学校", choices: ["病院", "駅", "学校", "図書館"] },
    { word: "먹다", meaning: "食べる", choices: ["飲む", "走る", "食べる", "読む"] },
    { word: "행복", meaning: "幸せ", choices: ["悲しみ", "幸せ", "怒り", "疲れ"] },
    { word: "책", meaning: "本", choices: ["本", "鉛筆", "机", "窓"] },
    { word: "오늘", meaning: "今日", choices: ["昨日", "明日", "今日", "毎日"] },
  ],
  中国語: [
    { word: "你好", meaning: "こんにちは", choices: ["ありがとう", "こんにちは", "さようなら", "おやすみ"] },
    { word: "谢谢", meaning: "ありがとう", choices: ["ごめんなさい", "ありがとう", "こんにちは", "どうぞ"] },
    { word: "朋友", meaning: "友達", choices: ["先生", "家族", "友達", "学校"] },
    { word: "学习", meaning: "勉強する", choices: ["遊ぶ", "勉強する", "食べる", "寝る"] },
    { word: "水", meaning: "水", choices: ["火", "木", "水", "土"] },
    { word: "学校", meaning: "学校", choices: ["学校", "病院", "駅", "会社"] },
    { word: "喜欢", meaning: "好き", choices: ["嫌い", "好き", "難しい", "新しい"] },
    { word: "今天", meaning: "今日", choices: ["昨日", "今日", "明日", "来週"] },
    { word: "书", meaning: "本", choices: ["本", "机", "椅子", "窓"] },
    { word: "幸福", meaning: "幸せ", choices: ["幸せ", "疲れ", "悲しみ", "怒り"] },
  ],
  ドイツ語: [
    { word: "Hallo", meaning: "こんにちは", choices: ["ありがとう", "こんにちは", "さようなら", "おやすみ"] },
    { word: "Danke", meaning: "ありがとう", choices: ["ごめんなさい", "ありがとう", "こんにちは", "どうぞ"] },
    { word: "Freund", meaning: "友達", choices: ["先生", "友達", "家族", "学生"] },
    { word: "Wasser", meaning: "水", choices: ["火", "水", "空", "土"] },
    { word: "Schule", meaning: "学校", choices: ["駅", "病院", "学校", "会社"] },
    { word: "Liebe", meaning: "愛", choices: ["愛", "仕事", "勉強", "旅行"] },
    { word: "Buch", meaning: "本", choices: ["本", "机", "椅子", "窓"] },
    { word: "glücklich", meaning: "幸せな", choices: ["悲しい", "幸せな", "怒った", "疲れた"] },
    { word: "essen", meaning: "食べる", choices: ["飲む", "食べる", "読む", "書く"] },
    { word: "heute", meaning: "今日", choices: ["昨日", "明日", "今日", "毎週"] },
  ],
  スペイン語: [
    { word: "Hola", meaning: "こんにちは", choices: ["ありがとう", "こんにちは", "さようなら", "おやすみ"] },
    { word: "Gracias", meaning: "ありがとう", choices: ["ごめんなさい", "ありがとう", "こんにちは", "どうぞ"] },
    { word: "amigo", meaning: "友達", choices: ["先生", "友達", "家族", "学生"] },
    { word: "agua", meaning: "水", choices: ["火", "水", "空", "土"] },
    { word: "escuela", meaning: "学校", choices: ["駅", "病院", "学校", "会社"] },
    { word: "amor", meaning: "愛", choices: ["愛", "仕事", "勉強", "旅行"] },
    { word: "libro", meaning: "本", choices: ["本", "机", "椅子", "窓"] },
    { word: "feliz", meaning: "幸せな", choices: ["悲しい", "幸せな", "怒った", "疲れた"] },
    { word: "comer", meaning: "食べる", choices: ["飲む", "食べる", "読む", "書く"] },
    { word: "hoy", meaning: "今日", choices: ["昨日", "明日", "今日", "毎週"] },
  ],
  イタリア語: [
    { word: "Ciao", meaning: "こんにちは", choices: ["ありがとう", "こんにちは", "さようなら", "おやすみ"] },
    { word: "Grazie", meaning: "ありがとう", choices: ["ごめんなさい", "ありがとう", "こんにちは", "どうぞ"] },
    { word: "amico", meaning: "友達", choices: ["先生", "友達", "家族", "学生"] },
    { word: "acqua", meaning: "水", choices: ["火", "水", "空", "土"] },
    { word: "scuola", meaning: "学校", choices: ["駅", "病院", "学校", "会社"] },
    { word: "amore", meaning: "愛", choices: ["愛", "仕事", "勉強", "旅行"] },
    { word: "libro", meaning: "本", choices: ["本", "机", "椅子", "窓"] },
    { word: "felice", meaning: "幸せな", choices: ["悲しい", "幸せな", "怒った", "疲れた"] },
    { word: "mangiare", meaning: "食べる", choices: ["飲む", "食べる", "読む", "書く"] },
    { word: "oggi", meaning: "今日", choices: ["昨日", "明日", "今日", "毎週"] },
  ],
};

const INITIAL_SAVE: SaveData = {
  level: 1,
  exp: 0,
  gold: 0,
  wins: 0,
  correct: 0,
  answered: 0,
  bestStreak: 0,
  achievements: [],
};

const ACHIEVEMENTS = [
  { id: "first", name: "初勝利", description: "初めて敵を倒す", icon: "⚔️" },
  { id: "streak5", name: "コンボマスター", description: "5問連続で正解する", icon: "🔥" },
  { id: "level3", name: "成長の証", description: "レベル3に到達する", icon: "🌟" },
  { id: "correct10", name: "知識の探求者", description: "10問正解する", icon: "📚" },
  { id: "wins5", name: "冒険者", description: "敵を5体倒す", icon: "🏆" },
];

const cardStyle = {
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 18,
  padding: 18,
};

export default function GamePage() {
  const [language, setLanguage] = useState("ドイツ語");
  const [selectedDeckName, setSelectedDeckName] = useState("");
  
const [ankiDecks, setAnkiDecks] = useState<AnkiDeck[]>([]);
const [loadingCards, setLoadingCards] = useState(true);

  const [save, setSave] = useState<SaveData>(INITIAL_SAVE);
  const [ready, setReady] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [enemyHp, setEnemyHp] = useState(30);
  const [playerHp, setPlayerHp] = useState(100);
  const [streak, setStreak] = useState(0);
  const [choice, setChoice] = useState<string | null>(null);
  const [message, setMessage] = useState("正解を選んで敵を攻撃しよう！");
  const [answered, setAnswered] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [victory, setVictory] = useState(false);
  const [enemyNumber, setEnemyNumber] = useState(1);
  const [questionOrder, setQuestionOrder] = useState<number[]>([]);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showStats, setShowStats] = useState(false);

  
  useEffect(() => {
    async function loadAnkiDecks() {
      try {
        const snapshot = await getDocs(collection(db, "decks"));

        const decks: AnkiDeck[] = snapshot.docs.map((item) => {
          const data = item.data();

          return {
            name: data.name || item.id,
            language: data.language || "",
            cards: Array.isArray(data.cards) ? data.cards : [],
          };
        });

        setAnkiDecks(decks);
      } catch (error) {
        console.error("Ankiカードの読み込みに失敗しました:", error);
      } finally {
        setLoadingCards(false);
      }
    }

    loadAnkiDecks();
  }, []);


  // デッキが選択されていれば、Ankiの実カードからゲーム問題を作る
  const selectedDeck = ankiDecks.find((deck) => deck.name === selectedDeckName);
  const questions: Question[] = selectedDeck
    ? selectedDeck.cards
        .filter((card) => typeof card.front === "string" && card.front.trim() && typeof card.japanese === "string" && card.japanese.trim())
        .map((card) => {
          const meaning = card.japanese.trim();
          const otherMeanings = Array.from(
            new Set(
              selectedDeck.cards
                .map((item) => item.japanese?.trim())
                .filter((item): item is string => Boolean(item) && item !== meaning)
            )
          );
          return {
            word: card.front.trim(),
            meaning,
            choices: [meaning, ...otherMeanings.slice(0, 3)],
          };
        })
    : (QUESTIONS[language] ?? QUESTIONS["ドイツ語"]);
  const question = questions[questionOrder[questionIndex] ?? 0];
  const expNeeded = save.level * 100;
  const accuracy = save.answered
    ? Math.round((save.correct / save.answered) * 100)
    : 0;

  useEffect(() => {
    try {
      const stored = localStorage.getItem("language-quest-save-v1");
      if (stored) {
        const parsed = JSON.parse(stored) as SaveData;
        setSave({ ...INITIAL_SAVE, ...parsed });
      }
    } catch {
      // 保存データが読めない場合は初期状態で開始
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) {
      localStorage.setItem("language-quest-save-v1", JSON.stringify(save));
    }
  }, [save, ready]);

  useEffect(() => {
    setQuestionOrder(
      Array.from({ length: questions.length }, (_, i) => i)
        .sort(() => Math.random() - 0.5)
    );
    setQuestionIndex(0);
    setEnemyHp(30);
    setPlayerHp(100);
    setStreak(0);
    setChoice(null);
    setAnswered(false);
    setGameOver(false);
    setVictory(false);
    setMessage("正解を選んで敵を攻撃しよう！");
  }, [language, selectedDeckName, questions.length]);

  function unlock(ids: string[]) {
    setSave((old) => ({
      ...old,
      achievements: Array.from(new Set([...old.achievements, ...ids])),
    }));
  }

  function answerQuestion(selected: string) {
    if (answered || gameOver || victory || !question) return;

    setChoice(selected);
    setAnswered(true);

    const isCorrect = selected === question.meaning;
    const nextStreak = isCorrect ? streak + 1 : 0;
    setStreak(nextStreak);

    if (!isCorrect) {
      setPlayerHp((hp) => Math.max(0, hp - 15));
      setMessage(`不正解！ 正解は「${question.meaning}」。15ダメージを受けた！`);
      setSave((old) => ({
        ...old,
        answered: old.answered + 1,
        bestStreak: Math.max(old.bestStreak, streak),
      }));
      if (playerHp <= 15) setGameOver(true);
      return;
    }

    const damage = 10 + save.level * 2 + Math.min(nextStreak, 5) * 2;
    const remaining = Math.max(0, enemyHp - damage);
    setEnemyHp(remaining);
    setMessage(
      `正解！ ${damage}ダメージ！${nextStreak >= 2 ? ` ${nextStreak}連続コンボ！` : ""}`
    );

    const nextCorrect = save.correct + 1;
    const nextAnswered = save.answered + 1;
    const defeated = remaining <= 0;

    let nextLevel = save.level;
    let nextExp = save.exp + 15;
    let nextGold = save.gold;
    let nextWins = save.wins;
    const newAchievements: string[] = [];

    if (defeated) {
      nextWins += 1;
      nextGold += 20 + save.level * 5;
      nextExp += 35;
      setVictory(true);
      setMessage("🎉 勝利！ 経験値とゴールドを獲得した！");
      newAchievements.push("first");
      if (nextWins >= 5) newAchievements.push("wins5");
    }

    while (nextExp >= nextLevel * 100) {
      nextExp -= nextLevel * 100;
      nextLevel += 1;
    }

    if (nextLevel >= 3) newAchievements.push("level3");
    if (nextCorrect >= 10) newAchievements.push("correct10");
    if (nextStreak >= 5) newAchievements.push("streak5");

    setSave((old) => ({
      ...old,
      level: nextLevel,
      exp: nextExp,
      gold: nextGold,
      wins: nextWins,
      correct: nextCorrect,
      answered: nextAnswered,
      bestStreak: Math.max(old.bestStreak, nextStreak),
      achievements: Array.from(
        new Set([...old.achievements, ...newAchievements])
      ),
    }));
  }

  function nextQuestion() {
    if (gameOver) {
      setPlayerHp(100);
      setEnemyHp(30);
      setQuestionIndex(0);
      setEnemyNumber(1);
      setStreak(0);
      setChoice(null);
      setAnswered(false);
      setGameOver(false);
      setVictory(false);
      setMessage("再挑戦しよう！");
      return;
    }

    if (victory) {
      setEnemyNumber((n) => n + 1);
      setEnemyHp(30 + Math.min(enemyNumber, 10) * 5);
      setPlayerHp(100);
      setVictory(false);
    }

    setQuestionIndex((i) => (i + 1) % questions.length);
    setChoice(null);
    setAnswered(false);
    setMessage("正解を選んで敵を攻撃しよう！");
  }

  function resetSave() {
    if (!window.confirm("レベル・ゴールド・実績をすべてリセットしますか？")) {
      return;
    }
    setSave(INITIAL_SAVE);
    setPlayerHp(100);
    setEnemyHp(30);
    setStreak(0);
    setEnemyNumber(1);
    setQuestionIndex(0);
    setChoice(null);
    setAnswered(false);
    setVictory(false);
    setGameOver(false);
    setMessage("新しい冒険を始めよう！");
  }

  if (!ready || !question) {
    return (
      <main style={{ padding: 40, color: "white", background: "#101629", minHeight: "100vh" }}>
        {!ready
          ? "ゲームを準備中..."
          : loadingCards
            ? "Ankiデッキを読み込み中..."
            : selectedDeckName
              ? "このデッキにはゲームに使えるカードがありません。カードの表面と日本語の意味を確認してください。"
              : "出題できる問題がありません。"}
        
      </main>
    );
  }

  const page: React.CSSProperties = {
    minHeight: "100vh",
    padding: "24px 14px 48px",
    background: "radial-gradient(circle at top, #263b70, #101629 55%, #090d18)",
    color: "#fff",
    fontFamily: "Arial, sans-serif",
  };

  const content: React.CSSProperties = {
    maxWidth: 850,
    margin: "0 auto",
  };

  const button: React.CSSProperties = {
    width: "100%",
    padding: "14px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.08)",
    color: "white",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
  };

  const progressWidth = Math.min(100, (save.exp / expNeeded) * 100);

    return (
    <main style={page}>
      <div style={content}>
          

        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "clamp(26px, 5vw, 38px)",
                margin: "8px 0",
              }}
            >
              ⚔️ LANGUAGE QUEST
            </h1>
          </div>

        </header>

        

            


        <section style={cardStyle}>
          <label htmlFor="language" style={{ display: "block", marginBottom: 8, fontWeight: 700 }}>
            🌍 学習する言語
          </label>
          <select
            id="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{ ...button, background: "#202e50" }}
          >
            {Object.keys(QUESTIONS).map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </section>

        <section style={{ ...cardStyle, marginTop: 14 }}>
          <label htmlFor="anki-deck" style={{ display: "block", marginBottom: 8, fontWeight: 700 }}>
            📚 暗記デッキをゲームにインポート
          </label>
          <select
            id="anki-deck"
            value={selectedDeckName}
            onChange={(e) => setSelectedDeckName(e.target.value)}
            style={{ ...button, background: "#202e50" }}
            disabled={loadingCards}
          >
            <option value="">
              {loadingCards ? "デッキを読み込み中..." : "サンプル問題で遊ぶ"}
            </option>
            {ankiDecks.map((deck, index) => (
              <option key={`${deck.name}-${index}`} value={deck.name}>
                {deck.name}（{deck.language || "言語未設定"}・{deck.cards.length}枚）
              </option>
            ))}
          </select>
          <p style={{ color: "#c4cee8", fontSize: 13, lineHeight: 1.7, marginBottom: 0 }}>
            デッキを選ぶと、そのカードの「表面」を問題、「日本語」を正解候補として出題します。
            デッキを選び直せば、いつでもサンプル問題に戻れます。
          </p>
        </section>
        


        

        <section style={{ ...cardStyle, marginTop: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
            <div>
              <div style={{ color: "#a9b9ff", fontSize: 12 }}>YOUR ADVENTURER</div>

              <h2 style={{ margin: "6px 0", color: "#FF69B4" }}>
  🛡️ 冒険者 Lv.{save.level}</h2>

            </div>
            <div style={{ textAlign: "right" }}>
              <div>🪙 {save.gold} GOLD</div>
              <div style={{ color: "#a9b9ff", fontSize: 13 }}>🏆 勝利 {save.wins}回</div>
            </div>
          </div>

          <div style={{ marginTop: 16, marginBottom: 6, display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span>EXP</span>
            <span>{save.exp} / {expNeeded}</span>
          </div>
          <div style={{ height: 10, borderRadius: 10, background: "#27314c", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progressWidth}%`, background: "linear-gradient(90deg,#647cf5,#9b8cff)", transition: "width .3s" }} />
          </div>

          <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 8 }}>
            <div style={{ background: "rgba(255,255,255,.05)", borderRadius: 12, padding: 10, textAlign: "center" }}>
              <div style={{ fontSize: 12, color: "#a9b9ff" }}>正解数</div>
              <strong>{save.correct}</strong>
            </div>
            <div style={{ background: "rgba(255,255,255,.05)", borderRadius: 12, padding: 10, textAlign: "center" }}>
              <div style={{ fontSize: 12, color: "#a9b9ff" }}>正答率</div>
              <strong>{accuracy}%</strong>
            </div>
            <div style={{ background: "rgba(255,255,255,.05)", borderRadius: 12, padding: 10, textAlign: "center" }}>
              <div style={{ fontSize: 12, color: "#a9b9ff" }}>最高コンボ</div>
              <strong>{save.bestStreak}</strong>
            </div>
          </div>
        </section>

        <section style={{ ...cardStyle, marginTop: 14, textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, color: "#c4cee8" }}>
            <span>QUEST {enemyNumber}</span>
            <span>敵：スライム</span>
          </div>

          <div style={{ fontSize: 82, margin: "8px 0" }}>
            {gameOver ? "💫" : victory ? "🎉" : "🟢"}
          </div>

          <h2 style={{ margin: 4, color: "#000000" }}>
  {gameOver ? "冒険失敗..." : victory ? "VICTORY!" : "スライム"}
</h2>

          <div style={{ margin: "12px auto", maxWidth: 440, textAlign: "left" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
              <span>ENEMY HP</span>
              <span>{enemyHp} / {30 + Math.min(enemyNumber - 1, 10) * 5}</span>
            </div>
            <div style={{ height: 12, background: "#422d45", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.max(0, enemyHp / (30 + Math.min(enemyNumber - 1, 10) * 5) * 100)}%`, background: "#f16d83", transition: "width .3s" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, margin: "12px 0 5px" }}>
              <span>YOUR HP</span>
              <span>{playerHp} / 100</span>
            </div>
            <div style={{ height: 12, background: "#27314c", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${playerHp}%`, background: "#43d9a3", transition: "width .3s" }} />
            </div>
          </div>
        </section>

        <section
  style={{
    ...cardStyle,
    marginTop: 14,
    background: "#ffffff",
    color: "#111827",
    border: "1px solid #d1d5db",
  }}
>
          <div style={{ fontSize: 12, color: "#a9b9ff" }}>
            {selectedDeck ? `${selectedDeck.name} · ${selectedDeck.language || language}` : language} · 問題 {questionIndex + 1} / {questions.length}
          </div>
          <h2 style={{ fontSize: "clamp(28px, 7vw, 42px)", textAlign: "center", margin: "22px 0 8px", overflowWrap: "anywhere" }}>
            {question.word}
          </h2>
          <p style={{ textAlign: "center", color: "#c4cee8", marginBottom: 22 }}>
            この単語の意味は？
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(135px,1fr))", gap: 10 }}>
            {question.choices.map((item) => {
              const isAnswer = item === question.meaning;
              const isSelected = item === choice;
              let background = "rgba(255,255,255,0.06)";
              let borderColor = "rgba(255,255,255,0.15)";

              if (answered && isAnswer) {
                background = "rgba(34,197,94,0.18)";
                borderColor = "#43d9a3";
              } else if (answered && isSelected) {
                background = "rgba(244,63,94,0.18)";
                borderColor = "#fb7185";
              }

              return (
                <button
                  key={item}
                  onClick={() => answerQuestion(item)}
                  disabled={answered || gameOver || victory}
                  style={{
  ...button,
  color: "#111827",
  background,
  borderColor,
  minHeight: 60,
  opacity: answered && !isAnswer && !isSelected ? 0.55 : 1,
  cursor: answered || gameOver || victory ? "default" : "pointer",
}}
                >
                  {item}
                  {answered && isAnswer ? " ✓" : ""}
                  {answered && isSelected && !isAnswer ? " ✕" : ""}
                </button>
              );
            })}
          </div>

          <div aria-live="polite" style={{ textAlign: "center", marginTop: 20, lineHeight: 1.8, color: victory ? "#86efac" : gameOver ? "#fda4af" : "#dce5ff", minHeight: 30 }}>
            {message}
          </div>

          {(answered || victory || gameOver) && (
            <button
              onClick={nextQuestion}
              style={{ ...button, marginTop: 12, background: "#647cf5", border: "none" }}
            >
              {gameOver ? "もう一度挑戦する" : victory ? "次の敵へ進む →" : "次の問題へ →"}
            </button>
          )}
        </section>

        <section style={{ ...cardStyle, marginTop: 14 }}>
          <button onClick={() => setShowAchievements((v) => !v)} style={button}>
            🏆 実績コレクション ({save.achievements.length}/{ACHIEVEMENTS.length}) {showAchievements ? "▲" : "▼"}
          </button>

          {showAchievements && (
            <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
              {ACHIEVEMENTS.map((a) => {
                const earned = save.achievements.includes(a.id);
                return (
                  <div key={a.id} style={{ display: "flex", gap: 12, alignItems: "center", padding: 12, borderRadius: 12, background: earned ? "rgba(250,204,21,.12)" : "rgba(255,255,255,.035)", opacity: earned ? 1 : 0.55 }}>
                    <div style={{ fontSize: 28 }}>{earned ? a.icon : "🔒"}</div>
                    <div>
                      <strong>{a.name}</strong>
                      <div style={{ fontSize: 13, color: "#c4cee8", marginTop: 4 }}>{a.description}</div>
                    </div>
                    <div style={{ marginLeft: "auto", fontSize: 12, color: earned ? "#fde68a" : "#a0aec0" }}>
                      {earned ? "獲得済み" : "未獲得"}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section style={{ ...cardStyle, marginTop: 14 }}>
          <button onClick={() => setShowStats((v) => !v)} style={button}>
            📊 冒険の記録 {showStats ? "▲" : "▼"}
          </button>

          {showStats && (
            <div style={{ marginTop: 14, lineHeight: 2 }}>
              <div>総回答数：{save.answered}</div>
              <div>正解数：{save.correct}</div>
              <div>倒した敵：{save.wins}</div>
              <div>最高連続正解：{save.bestStreak}</div>
              <div>現在のレベル：{save.level}</div>
            </div>
          )}
        </section>

        <button
          onClick={resetSave}
          style={{ ...button, marginTop: 18, color: "#fda4af", background: "transparent" }}
        >
          セーブデータをリセット
        </button>

        <p style={{ textAlign: "center", fontSize: 12, color: "#8491b4", marginTop: 22, lineHeight: 1.8 }}>
    
          進行状況はこのブラウザに保存されます。
        </p>
      </div>
    </main>
  );
}
