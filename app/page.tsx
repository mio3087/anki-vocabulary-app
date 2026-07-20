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

  const [showAnswer, setShowAnswer] = useState(false);

  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);

  const [questionCount, setQuestionCount] = useState(10);

  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalIncorrect, setTotalIncorrect] = useState(0);


  useEffect(() => {
    const saved = localStorage.getItem("words");

    if (saved) {
      const data = JSON.parse(saved);
      setWords(data);
      setAllWords(data);
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
            correct: Number(correct) || 0,
            incorrect: Number(incorrect) || 0,
          };

        })
        .filter((item) => item.word);


      setWords(newWords);
      setAllWords(newWords);

      localStorage.setItem(
        "words",
        JSON.stringify(newWords)
      );

    };


    reader.readAsText(file);

  };


  const startStudy = () => {

    const selected =
      shuffle(allWords).slice(0, questionCount);

    setWords(selected);
    setIndex(0);
    setStarted(true);

  };


  const answer = (
    type: "correct" | "incorrect"
  ) => {

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

      setIndex(index + 1);

    }

  };


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


  if (!started) {

    return (

      <main>

        <p>
          今日の学習数
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


        <p>
          {questionCount}枚
        </p>


        <button onClick={startStudy}>
          学習開始
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
        onClick={() =>
          setShowAnswer(!showAnswer)
        }
        style={{
          marginTop:"30px",
          padding:"40px",
          border:"1px solid black",
          textAlign:"center"
        }}
      >

        {showAnswer
          ? words[index].meaning
          : words[index].word
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


    </main>

  );

}