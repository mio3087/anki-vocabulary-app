"use client";

import { useEffect, useState } from "react";
import { shuffle } from "./shuffle";

type Word = {
  word: string;
  meaning: string;
  correct: number;
  incorrect: number;
};














export default function Home() {

  const [words, setWords] = useState<Word[]>([]);
  const [allWords, setAllWords] = useState<Word[]>([]);
  const [index, setIndex] = useState(0);

  const [showMeaning, setShowMeaning] = useState(false);

const [questionCount, setQuestionCount] = useState(10);
const [started, setStarted] = useState(false);


  const [finished, setFinished] = useState(false);

  const [showStats, setShowStats] = useState(false);



  const [showWeakOnly, setShowWeakOnly] = useState(false);

  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalIncorrect, setTotalIncorrect] = useState(0);


  useEffect(() => {

    const saved = localStorage.getItem("words");

    if (saved) {
      setWords(JSON.parse(saved));
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
            incorrect,
          ] = line.split(",");


          return {
            word,
            meaning,
            correct: Number(correct),
            incorrect: Number(incorrect),
          };

        })
        .filter((item) => item.word);



    setWords(newWords);
setAllWords(newWords);

localStorage.setItem(
  "words",
  JSON.stringify(newWords)
);

      setIndex(0);

    };


    reader.readAsText(file);

  };




  const startWeakStudy = () => {

  const weakWords = [...words]
    .sort(
      (a, b) =>
        b.incorrect - a.incorrect
    )
    .slice(0, questionCount);


  setWords(weakWords);
  setIndex(0);
  setStarted(true);
  setFinished(false);

};



  const answer = (
    type: "correct" | "incorrect"
  ) => {

    const updated = [...words];


    if (type === "correct") {

      updated[index].correct += 1;
      setTotalCorrect(totalCorrect + 1);

    } else {

      updated[index].incorrect += 1;
      setTotalIncorrect(totalIncorrect + 1);

    }


    setWords(updated);

    localStorage.setItem(
      "words",
      JSON.stringify(updated)
    );


    if (index + 1 >= words.length) {

      setFinished(true);

    } else {

      setIndex(index + 1);

    }


    setShowMeaning(false);

  };



  if (!started) {

  return (
    <main>

      <h1>
        My Language Vocabulary App
      </h1>

      <p>
        今日の学習数
      </p>



<div className="question-buttons">

<button
  onClick={() => setQuestionCount(10)}
>
  10問
</button>

<button
  onClick={() => setQuestionCount(50)}
>
  50問
</button>

<button
  onClick={() => setQuestionCount(100)}
>
  100問
</button>

<button
  onClick={() => setQuestionCount(300)}
>
  300問
</button>

</div>


      <p>
        選択中：{questionCount}問
      </p>


      <button
        onClick={() => {

          const selected = shuffle(allWords).slice(0, questionCount);

          setWords(selected);
          setIndex(0);
          setStarted(true);

        }}
      >
        学習開始
      </button>




      <button
  onClick={startWeakStudy}
>
  苦手だけ復習
</button>


    </main>
  );

}



  if (words.length === 0) {

    return (
      <main>

        <h1>
          CSVを読み込んでください
        </h1>


        <input
          type="file"
          accept=".csv"
          onChange={loadCSV}
        />

      </main>
    );

  }



  
if (showStats) {

  const displayWords = showWeakOnly
    ? words.filter(
        (word) =>
          word.incorrect > word.correct
      )
    : words;


  return (
    <main>

      <h1>
        学習成績
      </h1>


      <button
        onClick={() =>
          setShowWeakOnly(!showWeakOnly)
        }
      >
        {showWeakOnly
          ? "全部を見る"
          : "苦手だけ見る"}
      </button>


      {displayWords.map((word, i) => (

        <div key={i}>

          <h3>
            {word.word}
          </h3>


          <p>
            正解：{word.correct}回
          </p>


          <p>
            {
              word.correct + word.incorrect === 0
                ? "⚪ 未学習"
                :
              Math.round(
                (word.correct /
                (word.correct + word.incorrect))
                * 100
              ) >= 80
                ? "🟢 覚えた"
                :
              Math.round(
                (word.correct /
                (word.correct + word.incorrect))
                * 100
              ) >= 50
                ? "🟡 復習中"
                :
                "🔴 苦手"
            }
          </p>


          <p>
            不正解：{word.incorrect}回
          </p>


          <p>
            暗記率：
            {
              word.correct + word.incorrect === 0
              ? 0
              :
              Math.round(
                (word.correct /
                (word.correct + word.incorrect))
                * 100
              )
            }%
          </p>


          <hr />

        </div>

      ))}


      <button
        onClick={() => setShowStats(false)}
      >
        学習へ戻る
      </button>


    </main>
  );

}








  if (finished) {

    return (

      <main>

        <h1>
          学習終了！
        </h1>


        <p>
          正解数：{totalCorrect}
        </p>


        <p>
          不正解数：{totalIncorrect}
        </p>


        <button
  onClick={() => {

    const selected = shuffle(allWords).slice(
      0,
      questionCount
    );

    setWords(selected);
    setIndex(0);
    setFinished(false);
    setStarted(true);
    setTotalCorrect(0);
    setTotalIncorrect(0);

  }}
>
  もう一回
</button>

        <button
          onClick={() => setShowStats(true)}
        >
          成績を見る
        </button>


      </main>

    );

  }



  return (

    <main>

      <h1>
  📚 My Language
  <br />
  Vocabulary App
</h1>

{false && (
<div>
  <p>今日の学習数</p>


<button
  onClick={() => {
    const selected = shuffle(words).slice(0, questionCount);

    setWords(selected);
    setIndex(0);
    setStarted(true);
    setFinished(false);
  }}
>
  学習開始
</button>


  <button
    onClick={() => setQuestionCount(10)}
  >
    10問
  </button>

  <button
    onClick={() => setQuestionCount(50)}
  >
    50問
  </button>

  <button
    onClick={() => setQuestionCount(100)}
  >
    100問
  </button>

  <button
    onClick={() => setQuestionCount(300)}
  >
    300問
  </button>

  <p>
    選択中：{questionCount}問
  </p>
</div>

)}

      
<p>
  {index + 1} / {words.length}問
</p>

<p>
  正解率：
  {
    totalCorrect + totalIncorrect === 0
      ? 0
      :
      Math.round(
        (totalCorrect /
        (totalCorrect + totalIncorrect))
        * 100
      )
  }%
</p>


    <div className="word-card">

  <h2>
    {words[index].word}
  </h2>

</div>

      {!showMeaning && (

        <button
          onClick={() =>
            setShowMeaning(true)
          }
        >
          答えを見る
        </button>

      )}



      {showMeaning && (

        <>

          <p>
            {words[index].meaning}
          </p>


        <div className="answer-buttons">

<button
  onClick={() =>
    answer("correct")
  }
>
  正解
</button>


<button
  onClick={() =>
    answer("incorrect")
  }
>
  不正解
</button>

</div>

        </>

      )}



      <button
        onClick={() => setShowStats(true)}
      >
        成績を見る
      </button>


    </main>

  );

}