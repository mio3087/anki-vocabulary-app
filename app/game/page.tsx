"use client";

import { useEffect, useState } from "react";
import { useAppLanguage } from "@/app/component/AppLanguage";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

type Language = "ja" | "de" | "en" | "zh-CN" | "zh-TW" | "es";

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
  { id: "first", icon: "⚔️" },
  { id: "streak5", icon: "🔥" },
  { id: "level3", icon: "🌟" },
  { id: "correct10", icon: "📚" },
  { id: "wins5", icon: "🏆" },
];

const translations: Record<Language, any> = {
  ja: {
    preparing: "ゲームを準備中...",
    loadingDecks: "Ankiデッキを読み込み中...",
    noDeckCards: "このデッキにはゲームに使えるカードがありません。カードの表面と日本語の意味を確認してください。",
    noQuestions: "出題できる問題がありません。",
    prompt: "正解を選んで敵を攻撃しよう！",
    retry: "再挑戦しよう！",
    wrong: (answer: string) => `不正解！ 正解は「${answer}」。15ダメージを受けた！`,
    correct: (damage: number, streak: number) =>
      `正解！ ${damage}ダメージ！${streak >= 2 ? ` ${streak}連続コンボ！` : ""}`,
    victory: "🎉 勝利！ 経験値とゴールドを獲得した！",
    resetConfirm: "レベル・ゴールド・実績をすべてリセットしますか？",
    newAdventure: "新しい冒険を始めよう！",
    language: "🌍 学習する言語",
    deck: "📚 暗記デッキをゲームにインポート",
    loading: "デッキを読み込み中...",
    sample: "サンプル問題で遊ぶ",
    deckHelp: "デッキを選ぶと、そのカードの「表面」を問題、「日本語」を正解候補として出題します。デッキを選び直せば、いつでもサンプル問題に戻れます。",
    yourAdventurer: "YOUR ADVENTURER",
    adventurer: "冒険者",
    wins: "勝利",
    correctCount: "正解数",
    accuracy: "正答率",
    bestCombo: "最高コンボ",
    quest: "QUEST",
    enemy: "敵：スライム",
    failed: "冒険失敗...",
    slime: "スライム",
    enemyHp: "ENEMY HP",
    yourHp: "YOUR HP",
    question: "問題",
    askMeaning: "この単語の意味は？",
    retryButton: "もう一度挑戦する",
    nextEnemy: "次の敵へ →",
    nextQuestion: "次の問題へ →",
    achievements: "🏆 実績コレクション",
    earned: "獲得済み",
    notEarned: "未獲得",
    stats: "📊 冒険の記録",
    totalAnswered: "総回答数",
    defeated: "倒した敵",
    bestStreak: "最高連続正解",
    currentLevel: "現在のレベル",
    reset: "セーブデータをリセット",
    saved: "進行状況はこのブラウザに保存されます。",
    achievementNames: ["初勝利", "コンボマスター", "成長の証", "知識の探求者", "冒険者"],
    achievementDescriptions: ["初めて敵を倒す", "5問連続で正解する", "レベル3に到達する", "10問正解する", "敵を5体倒す"],
    languageNames: {
      韓国語: "韓国語",
      中国語: "中国語",
      ドイツ語: "ドイツ語",
      スペイン語: "スペイン語",
      イタリア語: "イタリア語",
    },
    unsetLanguage: "言語未設定",
  },
  de: {
    preparing: "Spiel wird vorbereitet...",
    loadingDecks: "Anki-Decks werden geladen...",
    noDeckCards: "Dieses Deck enthält keine verwendbaren Karten. Bitte überprüfe Vorderseite und japanische Bedeutung.",
    noQuestions: "Keine Fragen verfügbar.",
    prompt: "Wähle die richtige Antwort und greife den Gegner an!",
    retry: "Versuche es erneut!",
    wrong: (answer: string) => `Falsch! Die richtige Antwort ist „${answer}“. Du hast 15 Schaden erlitten!`,
    correct: (damage: number, streak: number) => `Richtig! ${damage} Schaden!${streak >= 2 ? ` ${streak}er-Combo!` : ""}`,
    victory: "🎉 Sieg! Du hast Erfahrung und Gold erhalten!",
    resetConfirm: "Möchtest du Level, Gold und Erfolge wirklich zurücksetzen?",
    newAdventure: "Ein neues Abenteuer beginnt!",
    language: "🌍 Lernsprache",
    deck: "📚 Anki-Deck ins Spiel importieren",
    loading: "Decks werden geladen...",
    sample: "Mit Beispielfragen spielen",
    deckHelp: "Wähle ein Deck: Die Vorderseite wird zur Frage und die japanische Bedeutung zu den Antwortmöglichkeiten. Du kannst jederzeit zu den Beispielfragen zurückkehren.",
    yourAdventurer: "DEIN ABENTEURER",
    adventurer: "Abenteurer",
    wins: "Siege",
    correctCount: "Richtige Antworten",
    accuracy: "Trefferquote",
    bestCombo: "Beste Combo",
    quest: "QUEST",
    enemy: "Gegner: Schleim",
    failed: "Abenteuer gescheitert...",
    slime: "Schleim",
    enemyHp: "GEGNER-HP",
    yourHp: "DEINE HP",
    question: "Frage",
    askMeaning: "Was bedeutet dieses Wort?",
    retryButton: "Erneut versuchen",
    nextEnemy: "Nächster Gegner →",
    nextQuestion: "Nächste Frage →",
    achievements: "🏆 Erfolge",
    earned: "Freigeschaltet",
    notEarned: "Nicht freigeschaltet",
    stats: "📊 Abenteuerstatistik",
    totalAnswered: "Beantwortete Fragen",
    defeated: "Besiegte Gegner",
    bestStreak: "Längste richtige Serie",
    currentLevel: "Aktuelles Level",
    reset: "Spielstand zurücksetzen",
    saved: "Dein Fortschritt wird in diesem Browser gespeichert.",
    achievementNames: ["Erster Sieg", "Combo-Meister", "Wachstum", "Wissenssucher", "Abenteurer"],
    achievementDescriptions: ["Besiege deinen ersten Gegner", "Beantworte 5 Fragen in Folge richtig", "Erreiche Level 3", "Beantworte 10 Fragen richtig", "Besiege 5 Gegner"],
    languageNames: { 韓国語: "Koreanisch", 中国語: "Chinesisch", ドイツ語: "Deutsch", スペイン語: "Spanisch", イタリア語: "Italienisch" },
    unsetLanguage: "Keine Sprache festgelegt",
  },
  en: {
    preparing: "Preparing the game...",
    loadingDecks: "Loading Anki decks...",
    noDeckCards: "This deck has no cards available for the game. Check the front and Japanese meaning fields.",
    noQuestions: "There are no questions available.",
    prompt: "Choose the correct answer and attack the enemy!",
    retry: "Let's try again!",
    wrong: (answer: string) => `Incorrect! The correct answer is "${answer}". You took 15 damage!`,
    correct: (damage: number, streak: number) => `Correct! ${damage} damage!${streak >= 2 ? ` ${streak}-hit combo!` : ""}`,
    victory: "🎉 Victory! You earned EXP and gold!",
    resetConfirm: "Reset your level, gold, and achievements?",
    newAdventure: "Start a new adventure!",
    language: "🌍 Learning language",
    deck: "📚 Import an Anki deck into the game",
    loading: "Loading decks...",
    sample: "Play with sample questions",
    deckHelp: "When you select a deck, its front side becomes the question and its Japanese meaning becomes an answer choice. Select the sample option anytime to return to sample questions.",
    yourAdventurer: "YOUR ADVENTURER",
    adventurer: "Adventurer",
    wins: "Wins",
    correctCount: "Correct answers",
    accuracy: "Accuracy",
    bestCombo: "Best combo",
    quest: "QUEST",
    enemy: "Enemy: Slime",
    failed: "Adventure failed...",
    slime: "Slime",
    enemyHp: "ENEMY HP",
    yourHp: "YOUR HP",
    question: "Question",
    askMeaning: "What does this word mean?",
    retryButton: "Try again",
    nextEnemy: "Next enemy →",
    nextQuestion: "Next question →",
    achievements: "🏆 Achievements",
    earned: "Unlocked",
    notEarned: "Locked",
    stats: "📊 Adventure stats",
    totalAnswered: "Total answered",
    defeated: "Enemies defeated",
    bestStreak: "Best correct streak",
    currentLevel: "Current level",
    reset: "Reset save data",
    saved: "Your progress is saved in this browser.",
    achievementNames: ["First Victory", "Combo Master", "Growing Stronger", "Knowledge Seeker", "Adventurer"],
    achievementDescriptions: ["Defeat your first enemy", "Answer 5 questions correctly in a row", "Reach level 3", "Answer 10 questions correctly", "Defeat 5 enemies"],
    languageNames: { 韓国語: "Korean", 中国語: "Chinese", ドイツ語: "German", スペイン語: "Spanish", イタリア語: "Italian" },
    unsetLanguage: "Language not set",
  },
  "zh-CN": {
    preparing: "正在准备游戏……",
    loadingDecks: "正在加载 Anki 卡组……",
    noDeckCards: "这个卡组没有可用于游戏的卡片。请确认卡片正面和日语释义。",
    noQuestions: "没有可用的问题。",
    prompt: "选择正确答案，攻击敌人吧！",
    retry: "再挑战一次吧！",
    wrong: (answer: string) => `回答错误！正确答案是“${answer}”。你受到了15点伤害！`,
    correct: (damage: number, streak: number) => `回答正确！造成${damage}点伤害！${streak >= 2 ? `连续答对${streak}题！` : ""}`,
    victory: "🎉 胜利！获得了经验值和金币！",
    resetConfirm: "确定要重置等级、金币和成就吗？",
    newAdventure: "开始新的冒险吧！",
    language: "🌍 学习语言",
    deck: "📚 将 Anki 卡组导入游戏",
    loading: "正在加载卡组……",
    sample: "使用示例题目进行游戏",
    deckHelp: "选择卡组后，卡片正面将作为题目，日语释义将作为正确答案选项。随时可以重新选择示例题目。",
    yourAdventurer: "你的冒险者",
    adventurer: "冒险者",
    wins: "胜利",
    correctCount: "答对数量",
    accuracy: "正确率",
    bestCombo: "最高连击",
    quest: "任务",
    enemy: "敌人：史莱姆",
    failed: "冒险失败……",
    slime: "史莱姆",
    enemyHp: "敌人 HP",
    yourHp: "你的 HP",
    question: "题目",
    askMeaning: "这个单词是什么意思？",
    retryButton: "再次挑战",
    nextEnemy: "前往下一个敌人 →",
    nextQuestion: "下一题 →",
    achievements: "🏆 成就收藏",
    earned: "已获得",
    notEarned: "未获得",
    stats: "📊 冒险记录",
    totalAnswered: "回答总数",
    defeated: "击败的敌人",
    bestStreak: "最高连续答对",
    currentLevel: "当前等级",
    reset: "重置存档",
    saved: "游戏进度保存在此浏览器中。",
    achievementNames: ["初次胜利", "连击大师", "成长的证明", "知识探索者", "冒险家"],
    achievementDescriptions: ["首次击败敌人", "连续答对5题", "达到等级3", "答对10题", "击败5个敌人"],
    languageNames: { 韓国語: "韩语", 中国語: "中文", ドイツ語: "德语", スペイン語: "西班牙语", イタリア語: "意大利语" },
    unsetLanguage: "未设置语言",
  },
  "zh-TW": {
    preparing: "正在準備遊戲……",
    loadingDecks: "正在載入 Anki 牌組……",
    noDeckCards: "這個牌組沒有可用於遊戲的卡片。請確認卡片正面和日文釋義。",
    noQuestions: "沒有可用的題目。",
    prompt: "選擇正確答案，攻擊敵人吧！",
    retry: "再挑戰一次吧！",
    wrong: (answer: string) => `回答錯誤！正確答案是「${answer}」。你受到了15點傷害！`,
    correct: (damage: number, streak: number) => `回答正確！造成${damage}點傷害！${streak >= 2 ? `連續答對${streak}題！` : ""}`,
    victory: "🎉 勝利！獲得了經驗值和金幣！",
    resetConfirm: "確定要重設等級、金幣和成就嗎？",
    newAdventure: "開始新的冒險吧！",
    language: "🌍 學習語言",
    deck: "📚 將 Anki 牌組匯入遊戲",
    loading: "正在載入牌組……",
    sample: "使用範例題目進行遊戲",
    deckHelp: "選擇牌組後，卡片正面將作為題目，日文釋義將作為正確答案選項。隨時可以重新選擇範例題目。",
    yourAdventurer: "你的冒險者",
    adventurer: "冒險者",
    wins: "勝利",
    correctCount: "答對數量",
    accuracy: "正確率",
    bestCombo: "最高連擊",
    quest: "任務",
    enemy: "敵人：史萊姆",
    failed: "冒險失敗……",
    slime: "史萊姆",
    enemyHp: "敵人 HP",
    yourHp: "你的 HP",
    question: "題目",
    askMeaning: "這個單字是什麼意思？",
    retryButton: "再次挑戰",
    nextEnemy: "前往下一個敵人 →",
    nextQuestion: "下一題 →",
    achievements: "🏆 成就收藏",
    earned: "已獲得",
    notEarned: "未獲得",
    stats: "📊 冒險紀錄",
    totalAnswered: "回答總數",
    defeated: "擊敗的敵人",
    bestStreak: "最高連續答對",
    currentLevel: "目前等級",
    reset: "重設存檔",
    saved: "遊戲進度保存在此瀏覽器中。",
    achievementNames: ["初次勝利", "連擊大師", "成長的證明", "知識探索者", "冒險家"],
    achievementDescriptions: ["首次擊敗敵人", "連續答對5題", "達到等級3", "答對10題", "擊敗5個敵人"],
    languageNames: { 韓国語: "韓語", 中国語: "中文", ドイツ語: "德語", スペイン語: "西班牙語", イタリア語: "義大利語" },
    unsetLanguage: "未設定語言",
  },
  es: {
    preparing: "Preparando el juego...",
    loadingDecks: "Cargando mazos de Anki...",
    noDeckCards: "Este mazo no contiene tarjetas que se puedan usar en el juego. Comprueba el anverso y el significado en japonés.",
    noQuestions: "No hay preguntas disponibles.",
    prompt: "¡Elige la respuesta correcta y ataca al enemigo!",
    retry: "¡Inténtalo de nuevo!",
    wrong: (answer: string) => `¡Incorrecto! La respuesta correcta es «${answer}». ¡Has recibido 15 puntos de daño!`,
    correct: (damage: number, streak: number) => `¡Correcto! ¡${damage} puntos de daño!${streak >= 2 ? ` ¡Combo de ${streak} aciertos!` : ""}`,
    victory: "🎉 ¡Victoria! ¡Has conseguido experiencia y oro!",
    resetConfirm: "¿Quieres reiniciar el nivel, el oro y los logros?",
    newAdventure: "¡Comienza una nueva aventura!",
    language: "🌍 Idioma de aprendizaje",
    deck: "📚 Importar un mazo de Anki al juego",
    loading: "Cargando mazos...",
    sample: "Jugar con preguntas de ejemplo",
    deckHelp: "Al seleccionar un mazo, el anverso de la tarjeta será la pregunta y su significado en japonés será una de las respuestas. Puedes volver a las preguntas de ejemplo cuando quieras.",
    yourAdventurer: "TU AVENTURERO",
    adventurer: "Aventurero",
    wins: "Victorias",
    correctCount: "Respuestas correctas",
    accuracy: "Precisión",
    bestCombo: "Mejor combo",
    quest: "MISIÓN",
    enemy: "Enemigo: Slime",
    failed: "Aventura fallida...",
    slime: "Slime",
    enemyHp: "HP DEL ENEMIGO",
    yourHp: "TUS HP",
    question: "Pregunta",
    askMeaning: "¿Qué significa esta palabra?",
    retryButton: "Volver a intentarlo",
    nextEnemy: "Siguiente enemigo →",
    nextQuestion: "Siguiente pregunta →",
    achievements: "🏆 Colección de logros",
    earned: "Conseguido",
    notEarned: "Sin conseguir",
    stats: "📊 Registro de aventuras",
    totalAnswered: "Respuestas totales",
    defeated: "Enemigos derrotados",
    bestStreak: "Mayor racha de aciertos",
    currentLevel: "Nivel actual",
    reset: "Reiniciar datos guardados",
    saved: "Tu progreso se guarda en este navegador.",
    achievementNames: ["Primera victoria", "Maestro del combo", "Prueba de crecimiento", "Buscador de conocimiento", "Aventurero"],
    achievementDescriptions: ["Derrota a tu primer enemigo", "Responde correctamente 5 preguntas seguidas", "Alcanza el nivel 3", "Responde correctamente 10 preguntas", "Derrota a 5 enemigos"],
    languageNames: { 韓国語: "Coreano", 中国語: "Chino", ドイツ語: "Alemán", スペイン語: "Español", イタリア語: "Italiano" },
    unsetLanguage: "Idioma no establecido",
  },
};

const cardStyle = {
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 18,
  padding: 18,
};

export default function GamePage() {
  const { language: appLanguage } = useAppLanguage();

  const currentLanguage: Language =
    appLanguage in translations ? (appLanguage as Language) : "ja";

  const t = translations[currentLanguage];

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
  const [message, setMessage] = useState(t.prompt);
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

  const selectedDeck = ankiDecks.find(
    (deck) => deck.name === selectedDeckName
  );

  const questions: Question[] = selectedDeck
    ? selectedDeck.cards
        .filter(
          (card) =>
            typeof card.front === "string" &&
            card.front.trim() &&
            typeof card.japanese === "string" &&
            card.japanese.trim()
        )
        .map((card) => {
          const meaning = card.japanese.trim();
          const otherMeanings = Array.from(
            new Set(
              selectedDeck.cards
                .map((item) => item.japanese?.trim())
                .filter(
                  (item): item is string =>
                    Boolean(item) && item !== meaning
                )
            )
          );

          return {
            word: card.front.trim(),
            meaning,
            choices: [meaning, ...otherMeanings.slice(0, 3)],
          };
        })
    : QUESTIONS[language] ?? QUESTIONS["ドイツ語"];

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
      Array.from({ length: questions.length }, (_, i) => i).sort(
        () => Math.random() - 0.5
      )
    );
    setQuestionIndex(0);
    setEnemyHp(30);
    setPlayerHp(100);
    setStreak(0);
    setChoice(null);
    setAnswered(false);
    setGameOver(false);
    setVictory(false);
    setMessage(t.prompt);
  }, [language, selectedDeckName, questions.length]);

  useEffect(() => {
    if (!answered && !gameOver && !victory) {
      setMessage(t.prompt);
    }
  }, [currentLanguage]);

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
      setMessage(t.wrong(question.meaning));
      setSave((old) => ({
        ...old,
        answered: old.answered + 1,
        bestStreak: Math.max(old.bestStreak, streak),
      }));
      if (playerHp <= 15) setGameOver(true);
      return;
    }

    const damage =
      10 + save.level * 2 + Math.min(nextStreak, 5) * 2;
    const remaining = Math.max(0, enemyHp - damage);
    setEnemyHp(remaining);
    setMessage(t.correct(damage, nextStreak));

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
      setMessage(t.victory);
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
      setMessage(t.retry);
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
    setMessage(t.prompt);
  }

  function resetSave() {
    if (!window.confirm(t.resetConfirm)) return;

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
    setMessage(t.newAdventure);
  }

  if (!ready || !question) {
    return (
      <main
        style={{
          padding: 40,
          color: "white",
          background: "#101629",
          minHeight: "100vh",
        }}
      >
        {!ready
          ? t.preparing
          : loadingCards
            ? t.loadingDecks
            : selectedDeckName
              ? t.noDeckCards
              : t.noQuestions}
      </main>
    );
  }

  const page: React.CSSProperties = {
    minHeight: "100vh",
    padding: "24px 14px 48px",
    background:
      "radial-gradient(circle at top, #263b70, #101629 55%, #090d18)",
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
          <label
            htmlFor="language"
            style={{
              display: "block",
              marginBottom: 8,
              fontWeight: 700,
            }}
          >
            {t.language}
          </label>
          <select
            id="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{ ...button, background: "#202e50" }}
          >
            {Object.keys(QUESTIONS).map((name) => (
              <option key={name} value={name}>
                {t.languageNames[name as keyof typeof t.languageNames]}
              </option>
            ))}
          </select>
        </section>

        <section style={{ ...cardStyle, marginTop: 14 }}>
          <label
            htmlFor="anki-deck"
            style={{
              display: "block",
              marginBottom: 8,
              fontWeight: 700,
            }}
          >
            {t.deck}
          </label>
          <select
            id="anki-deck"
            value={selectedDeckName}
            onChange={(e) => setSelectedDeckName(e.target.value)}
            style={{ ...button, background: "#202e50" }}
            disabled={loadingCards}
          >
            <option value="">
              {loadingCards ? t.loading : t.sample}
            </option>
            {ankiDecks.map((deck, index) => (
              <option key={`${deck.name}-${index}`} value={deck.name}>
                {deck.name}（{deck.language || t.unsetLanguage}・
                {deck.cards.length}
                {currentLanguage === "ja"
                  ? "枚"
                  : currentLanguage === "de"
                    ? " Karten"
                    : currentLanguage === "es"
                      ? " tarjetas"
                      : currentLanguage === "en"
                        ? " cards"
                        : "張"}
                ）
              </option>
            ))}
          </select>
          <p
            style={{
              color: "#c4cee8",
              fontSize: 13,
              lineHeight: 1.7,
              marginBottom: 0,
            }}
          >
            {t.deckHelp}
          </p>
        </section>

        <section style={{ ...cardStyle, marginTop: 14 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ color: "#a9b9ff", fontSize: 12 }}>
                {t.yourAdventurer}
              </div>
              <h2 style={{ margin: "6px 0", color: "#FF69B4" }}>
                🛡️ {t.adventurer} Lv.{save.level}
              </h2>
            </div>
            <div style={{ textAlign: "right" }}>
              <div>🪙 {save.gold} GOLD</div>
              <div style={{ color: "#a9b9ff", fontSize: 13 }}>
                🏆 {t.wins} {save.wins}
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: 16,
              marginBottom: 6,
              display: "flex",
              justifyContent: "space-between",
              fontSize: 13,
            }}
          >
            <span>EXP</span>
            <span>
              {save.exp} / {expNeeded}
            </span>
          </div>
          <div
            style={{
              height: 10,
              borderRadius: 10,
              background: "#27314c",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progressWidth}%`,
                background: "linear-gradient(90deg,#647cf5,#9b8cff)",
                transition: "width .3s",
              }}
            />
          </div>

          <div
            style={{
              marginTop: 14,
              display: "grid",
              gridTemplateColumns: "repeat(3,minmax(0,1fr))",
              gap: 8,
            }}
          >
            <div
              style={{
                background: "rgba(255,255,255,.05)",
                borderRadius: 12,
                padding: 10,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 12, color: "#a9b9ff" }}>
                {t.correctCount}
              </div>
              <strong>{save.correct}</strong>
            </div>
            <div
              style={{
                background: "rgba(255,255,255,.05)",
                borderRadius: 12,
                padding: 10,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 12, color: "#a9b9ff" }}>
                {t.accuracy}
              </div>
              <strong>{accuracy}%</strong>
            </div>
            <div
              style={{
                background: "rgba(255,255,255,.05)",
                borderRadius: 12,
                padding: 10,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 12, color: "#a9b9ff" }}>
                {t.bestCombo}
              </div>
              <strong>{save.bestStreak}</strong>
            </div>
          </div>
        </section>

        <section
          style={{
            ...cardStyle,
            marginTop: 14,
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 13,
              color: "#c4cee8",
            }}
          >
            <span>
              {t.quest} {enemyNumber}
            </span>
            <span>{t.enemy}</span>
          </div>

          <div style={{ fontSize: 82, margin: "8px 0" }}>
            {gameOver ? "💫" : victory ? "🎉" : "🟢"}
          </div>

          <h2 style={{ margin: 4, color: "#000000" }}>
            {gameOver ? t.failed : victory ? "VICTORY!" : t.slime}
          </h2>

          <div
            style={{
              margin: "12px auto",
              maxWidth: 440,
              textAlign: "left",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12,
                marginBottom: 5,
              }}
            >
              <span>{t.enemyHp}</span>
              <span>
                {enemyHp} / {30 + Math.min(enemyNumber - 1, 10) * 5}
              </span>
            </div>
            <div
              style={{
                height: 12,
                background: "#422d45",
                borderRadius: 10,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${
                    Math.max(
                      0,
                      (enemyHp /
                        (30 + Math.min(enemyNumber - 1, 10) * 5)) *
                        100
                    )
                  }%`,
                  background: "#f16d83",
                  transition: "width .3s",
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12,
                margin: "12px 0 5px",
              }}
            >
              <span>{t.yourHp}</span>
              <span>{playerHp} / 100</span>
            </div>
            <div
              style={{
                height: 12,
                background: "#27314c",
                borderRadius: 10,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${playerHp}%`,
                  background: "#43d9a3",
                  transition: "width .3s",
                }}
              />
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
          <div style={{ fontSize: 12, color: "#64748b" }}>
            {selectedDeck
              ? `${selectedDeck.name} · ${selectedDeck.language || language}`
              : t.languageNames[
                  language as keyof typeof t.languageNames
                ]}{" "}
            · {t.question} {questionIndex + 1} / {questions.length}
          </div>

          <h2
            style={{
              fontSize: "clamp(28px, 7vw, 42px)",
              textAlign: "center",
              margin: "22px 0 8px",
              overflowWrap: "anywhere",
            }}
          >
            {question.word}
          </h2>
          <p
            style={{
              textAlign: "center",
              color: "#64748b",
              marginBottom: 22,
            }}
          >
            {t.askMeaning}
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(135px,1fr))",
              gap: 10,
            }}
          >
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
                    opacity:
                      answered && !isAnswer && !isSelected ? 0.55 : 1,
                    cursor:
                      answered || gameOver || victory
                        ? "default"
                        : "pointer",
                  }}
                >
                  {item}
                  {answered && isAnswer ? " ✓" : ""}
                  {answered && isSelected && !isAnswer ? " ✕" : ""}
                </button>
              );
            })}
          </div>

          <div
            aria-live="polite"
            style={{
              textAlign: "center",
              marginTop: 20,
              lineHeight: 1.8,
              color: victory
                ? "#86efac"
                : gameOver
                  ? "#fda4af"
                  : "#64748b",
              minHeight: 30,
            }}
          >
            {message}
          </div>

          {(answered || victory || gameOver) && (
            <button
              onClick={nextQuestion}
              style={{
                ...button,
                marginTop: 12,
                background: "#647cf5",
                border: "none",
              }}
            >
              {gameOver
                ? t.retryButton
                : victory
                  ? t.nextEnemy
                  : t.nextQuestion}
            </button>
          )}
        </section>

        <section style={{ ...cardStyle, marginTop: 14 }}>
          <button
            onClick={() => setShowAchievements((v) => !v)}
            style={button}
          >
            {t.achievements} ({save.achievements.length}/
            {ACHIEVEMENTS.length}) {showAchievements ? "▲" : "▼"}
          </button>

          {showAchievements && (
            <div
              style={{
                display: "grid",
                gap: 10,
                marginTop: 14,
              }}
            >
              {ACHIEVEMENTS.map((a, index) => {
                const earned = save.achievements.includes(a.id);

                return (
                  <div
                    key={a.id}
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "center",
                      padding: 12,
                      borderRadius: 12,
                      background: earned
                        ? "rgba(250,204,21,.12)"
                        : "rgba(255,255,255,.035)",
                      opacity: earned ? 1 : 0.55,
                    }}
                  >
                    <div style={{ fontSize: 28 }}>
                      {earned ? a.icon : "🔒"}
                    </div>
                    <div>
                      <strong>{t.achievementNames[index]}</strong>
                      <div
                        style={{
                          fontSize: 13,
                          color: "#c4cee8",
                          marginTop: 4,
                        }}
                      >
                        {t.achievementDescriptions[index]}
                      </div>
                    </div>
                    <div
                      style={{
                        marginLeft: "auto",
                        fontSize: 12,
                        color: earned ? "#fde68a" : "#a0aec0",
                      }}
                    >
                      {earned ? t.earned : t.notEarned}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section style={{ ...cardStyle, marginTop: 14 }}>
          <button
            onClick={() => setShowStats((v) => !v)}
            style={button}
          >
            {t.stats} {showStats ? "▲" : "▼"}
          </button>

          {showStats && (
            <div style={{ marginTop: 14, lineHeight: 2 }}>
              <div>
                {t.totalAnswered}：{save.answered}
              </div>
              <div>
                {t.correctCount}：{save.correct}
              </div>
              <div>
                {t.defeated}：{save.wins}
              </div>
              <div>
                {t.bestStreak}：{save.bestStreak}
              </div>
              <div>
                {t.currentLevel}：{save.level}
              </div>
            </div>
          )}
        </section>

        <button
          onClick={resetSave}
          style={{
            ...button,
            marginTop: 18,
            color: "#fda4af",
            background: "transparent",
          }}
        >
          {t.reset}
        </button>

        <p
          style={{
            textAlign: "center",
            fontSize: 12,
            color: "#8491b4",
            marginTop: 22,
            lineHeight: 1.8,
          }}
        >
          {t.saved}
        </p>
      </div>
    </main>
  );
}