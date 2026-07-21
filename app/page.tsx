"use client";

import { useEffect, useState } from "react";
import { shuffle } from "./shuffle"

type Word = {
  word: string;
  meaning: string;
  language: string;
  correct: number;
  incorrect: number;
};

type Deck = {
  name: string;
  language: string;
  words: Word[];
};


export default function Home() {
  const [words, setWords] = useState<Word[]>([]);
  const [allWords, setAllWords] = useState<Word[]>([]);


const [decks, setDecks] = useState<Deck[]>([
  {
    name: "中国語",
    language: "zh-CN",
    words: [],
  },
]);


const [currentDeck, setCurrentDeck] = useState("中国語");

const [newDeckName, setNewDeckName] = useState("");
const [newDeckLanguage, setNewDeckLanguage] = useState("zh-CN");


  const [index, setIndex] = useState(0);

  const [showAnswer, setShowAnswer] = useState(false);

  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);

  const [questionCount, setQuestionCount] = useState<number | "all">(10);
  const [newWord, setNewWord] = useState("");
const [newMeaning, setNewMeaning] = useState("");

  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalIncorrect, setTotalIncorrect] = useState(0);

  const [todayCount, setTodayCount] = useState(0);


  useEffect(() => {

  const savedDecks = localStorage.getItem("decks");

  if (savedDecks) {

    const data = JSON.parse(savedDecks);

    setDecks(data.length > 0 ? data : [
  {
  name: "中国語",
  language: "zh-CN",
  words: [],
}
]);

    const current = data.find(
      (deck: Deck) =>
        deck.name === currentDeck
    );

    if (current && current.words.length > 0) {
  setWords(current.words);
  setAllWords(current.words);
}
  }

}, []);







  const loadCSV = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {

    const file = e.target.files?.[0];

    if (!file) return;


    const reader = new FileReader();


    reader.onload = () => {

      const text = reader.result as string;

      const lines = text.split("\n").slice(1);


      const newWords = lines
        .map((line) => {

          const [
  word,
  meaning,
  correct,
  incorrect
] = line.split(",");


          return {
  word,
  meaning,
  language: decks.find(
    (deck) => deck.name === currentDeck
  )?.language || "zh-CN",
  correct: Number(correct) || 0,
  incorrect: Number(incorrect) || 0,
};

        })
        .filter((item) => item.word);


    const updatedDecks = decks.map((deck) => {

  if (deck.name === currentDeck) {
    return {
      ...deck,
      words: newWords,
    };
  }

  return deck;

});


setDecks(updatedDecks);

setWords(newWords);
setAllWords(newWords);


localStorage.setItem(
  "decks",
  JSON.stringify(updatedDecks)
);

    };


    reader.readAsText(file);

  };


  

  

const startStudy = () => {

  if (allWords.length === 0) {
    alert("このデッキには単語がありません");
    return;
  }

  const selected =
    questionCount === "all"
      ? shuffle(allWords)
      : shuffle(allWords).slice(0, questionCount);

  setWords(selected);
setIndex(0);
setStarted(true);

setTimeout(() => {
  const speech = new SpeechSynthesisUtterance(
    selected[0].word
  );

  const voices = speechSynthesis.getVoices();

speech.voice = voices.find(
  (voice) => voice.lang.startsWith("de")
) || null;

  speech.lang = selected[0].language;

  window.speechSynthesis.speak(speech);

}, 300);

};

const addDeck = () => {
  if (!newDeckName) return;

  const updatedDecks = [
  ...decks,
  {
    name: newDeckName,
    language: newDeckLanguage,
    words: [],
  }
];

  setDecks(updatedDecks);

  localStorage.setItem(
    "decks",
    JSON.stringify(updatedDecks)
  );

  setCurrentDeck(newDeckName);
  setNewDeckName("");
};

const addWord = () => {

  if (!newWord || !newMeaning) return;


  


  const updatedDecks = decks.map((deck) => {

    if (deck.name === currentDeck) {

      return {
        ...deck,
        words: [
  ...deck.words,
  {
    word: newWord,
    meaning: newMeaning,
    language: deck.language,
    correct: 0,
    incorrect: 0,
  },
],
      };

    }

    return deck;

  });


  setDecks(updatedDecks);


  const current = updatedDecks.find(
    (deck) => deck.name === currentDeck
  );


  if (current) {
    setWords(current.words);
    setAllWords(current.words);
  }


  localStorage.setItem(
    "decks",
    JSON.stringify(updatedDecks)
  );


  setNewWord("");
  setNewMeaning("");

};






const speak = (text: string) => {
  const speech = new SpeechSynthesisUtterance(text);

  const voices = window.speechSynthesis.getVoices();

console.log(voices);

  if (words[index]?.language === "de-DE") {
  speech.lang = "de-DE";
  speech.voice = voices.find(
    (voice) => voice.lang.startsWith("de")
  ) || null;

} else if (words[index]?.language === "es-ES") {
  speech.lang = "es-ES";
  speech.voice = voices.find(
    (voice) => voice.lang.startsWith("es")
  ) || null;

} else if (words[index]?.language === "ja-JP") {
  speech.lang = "ja-JP";
  speech.voice = voices.find(
    (voice) => voice.lang.startsWith("ja")
  ) || null;

} else {
  speech.lang = "zh-CN";
  speech.voice = voices.find(
    (voice) => voice.lang.startsWith("zh")
  ) || null;
}

  window.speechSynthesis.speak(speech);
};


  const answer = (
    type: "correct" | "incorrect"
  ) => {



    setTodayCount(todayCount + 1);

    const updated = [...words];


    if (type === "correct") {

      updated[index].correct++;

      setTotalCorrect(
        totalCorrect + 1
      );

    } else {

      updated[index].incorrect++;

      setTotalIncorrect(
        totalIncorrect + 1
      );

    }


    setWords(updated);

    localStorage.setItem(
      "words",
      JSON.stringify(updated)
    );


    setShowAnswer(false);


    if (index + 1 >= words.length) {

      setFinished(true);

    } else {

      


const nextIndex = index + 1;

setIndex(nextIndex);

setTimeout(() => {
  const speech = new SpeechSynthesisUtterance(
    words[nextIndex]?.word || ""
  );

  speech.voice = speechSynthesis
  .getVoices()
  .find((voice) => voice.lang === "de-DE");

  speech.lang =
  words[nextIndex]?.language === "es-ES"
  ? "es-ES"
  : words[nextIndex]?.language === "de-DE"
  ? "de-DE"
  : "zh-CN";

window.speechSynthesis.speak(speech);

}, 300);



    }

  };


  


  if (!started) {

    return (

      <main>



<h3>デッキ</h3>

{decks.map((deck) => (
  <div key={deck.name}>


<button
  onClick={() => {
    setCurrentDeck(deck.name);
    setWords(deck.words);
    setAllWords(deck.words);
  }}
>
  {deck.name}（{deck.words.length}語）
</button>

    
<button
  style={{
    marginLeft: "10px",
    padding: "4px 8px",
    fontSize: "12px",
  }}
  onClick={() => {
    setDecks(
      decks.filter(
        (d) => d.name !== deck.name
      )
    );
  }}
>
  削除
</button>




  </div>
))}

<h3>
新しいデッキ作成
</h3>

<hr />

<h3>
CSVインポート
</h3>

<input
  type="file"
  accept=".csv"
  onChange={loadCSV}
/>

<input
  placeholder="例：イタリア語"
  value={newDeckName}
  onChange={(e) =>
    setNewDeckName(e.target.value)
  }
/>

<p>デッキの言語</p>

<select
  value={newDeckLanguage}
  onChange={(e) =>
    setNewDeckLanguage(e.target.value)
  }
>
  <option value="zh-CN">中国語</option>
  <option value="de-DE">ドイツ語</option>
  <option value="es-ES">スペイン語</option>
  <option value="ja-JP">日本語</option>
</select>

<button onClick={addDeck}>
  作成
</button>



        <p>
          今日の学習数
        </p>

        <p>
  今日やった単語数：{todayCount}単語
</p>


        <button onClick={() => setQuestionCount(10)}>
          10枚
        </button>

        <button onClick={() => setQuestionCount(50)}>
          50枚
        </button>

        <button onClick={() => setQuestionCount(100)}>
          100枚
        </button>

        <button onClick={() => setQuestionCount(300)}>
  300枚
</button>

<button onClick={() => setQuestionCount(500)}>
  500枚
</button>

<button onClick={() => setQuestionCount("all")}>
  全範囲
</button>


        <p>
          {questionCount}枚
        </p>


        <button
  onClick={startStudy}
  style={{
    background: "#cdb4db",
    color: "white",
    padding: "12px 30px",
    borderRadius: "20px",
    border: "none",
    fontSize: "18px",
    cursor: "pointer",
    marginTop: "15px",
  }}
>
  学習開始
</button>
<hr />

<h3>
単語を追加
</h3>


<input
  placeholder="単語"
  value={newWord}
  onChange={(e) =>
    setNewWord(e.target.value)
  }
/>


<input
  placeholder="意味"
  value={newMeaning}
  onChange={(e) =>
    setNewMeaning(e.target.value)
  }
/>


<button onClick={addWord}>
  追加
</button>

      </main>

    );

  }


  if (finished) {

    return (

      <main>

        <h1>
          終了！
        </h1>


        <p>
          正解：{totalCorrect}
        </p>


        <p>
          不正解：{totalIncorrect}
        </p>


        <button
          onClick={() => {
            setStarted(false);
            setFinished(false);
            setIndex(0);
            setTotalCorrect(0);
            setTotalIncorrect(0);
          }}
        >
          戻る
        </button>


      </main>

    );

  }


  const progress =
    Math.round(
      ((index + 1) / words.length) * 100
    );


  return (

    <main>


      <p>
        {index + 1} / {words.length}枚
      </p>


      <p>
        進捗：{progress}%
      </p>


      <div
        style={{
          width:"100%",
          height:"10px",
          background:"#ddd"
        }}
      >

        <div
          style={{
            width:`${progress}%`,
            height:"10px",
            background:"#333"
          }}
        />

      </div>


      

      <div
  className="card"
  onClick={() => {
    setShowAnswer(!showAnswer);
    speak(words[index].word);
  }}

        style={{
          marginTop:"30px",
          padding:"40px",
          border:"1px solid black",
          textAlign:"center"
        }}
      >

        {showAnswer
  ? words[index]?.meaning
  : words[index]?.word
}



      </div>


      <button
        onClick={() => answer("correct")}
      >
        正解
      </button>


      <button
        onClick={() => answer("incorrect")}
      >
        不正解
      </button>


<button
  onClick={() => {
    localStorage.setItem(
      "todayCount",
      String(todayCount)
    );

    setStarted(false);
    setFinished(false);
    setIndex(0);
    setTotalCorrect(0);
    setTotalIncorrect(0);
  }}
>
  終了
</button>



    </main>

  );

}