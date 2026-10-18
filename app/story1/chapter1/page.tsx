
"use client";

import { useState } from "react";

type SpeechRecognitionResult = {
  [index: number]: { transcript: string };
  isFinal: boolean;
};

type RecognitionInstance = {
  lang: string;
  interimResults: boolean;
  onresult: ((event: { results: SpeechRecognitionResult[] }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

const scenes = [
  {
    speaker: "秦国の使者",
    chinese: "若贵国愿与秦国结盟，我国愿意提供援助。",
    pinyin: "Ruò guìguó yuàn yǔ Qín guó jiéméng, wǒ guó yuànyì tígōng yuánzhù.",
    japanese: "もし貴国が秦国との同盟を望むなら、我が国は援助を提供する用意があります。",
    question: "使者の提案を理解できましたか？",
    choices: [
      { text: "援助と引き換えに同盟を提案している", next: 1, score: 1 },
      { text: "秦国が直ちに戦争を始めると宣言している", next: 1, score: 0 },
      { text: "秦国が貴国への援助を拒否している", next: 1, score: 0 },
    ],
  },
  {
    speaker: "秦国の使者",
    chinese: "不知贵国对此有何看法？",
    pinyin: "Bù zhī guìguó duì cǐ yǒu hé kànfǎ?",
    japanese: "この件について、貴国はどのようにお考えでしょうか？",
    question: "外交官として、どう返答しますか？",
    choices: [
      { text: "请问，秦国希望我们提供什么？", next: 2, score: 1 },
      { text: "我们不想听。", next: 2, score: 0 },
      { text: "我不知道。", next: 2, score: 0 },
    ],
  },
  {
    speaker: "秦国の使者",
    chinese: "我们希望贵国认真考虑这次结盟。",
    pinyin: "Wǒmen xīwàng guìguó rènzhēn kǎolǜ zhè cì jiéméng.",
    japanese: "我々は貴国が今回の同盟を真剣に検討することを望みます。",
    question: "次は君主に報告しましょう。",
    choices: [
      { text: "同盟の条件と危険性を君主に報告する", next: 3, score: 1 },
      { text: "内容を確認せず同盟を承諾する", next: 3, score: 0 },
      { text: "手紙を隠して報告しない", next: 3, score: 0 },
    ],
  },
];

export default function Chapter1Page() {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [showPinyin, setShowPinyin] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [spokenText, setSpokenText] = useState("");
  const [listening, setListening] = useState(false);
  const [speechError, setSpeechError] = useState("");

  const scene = scenes[sceneIndex];

  function speakChinese() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setFeedback("このブラウザでは音声読み上げが利用できません。");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(scene.chinese);
    utterance.lang = "zh-CN";
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  }

  function startSpeakingPractice() {
    const SpeechRecognitionAPI = (
      window as unknown as {
        SpeechRecognition?: new () => RecognitionInstance;
        webkitSpeechRecognition?: new () => RecognitionInstance;
      }
    ).SpeechRecognition ??
      (
        window as unknown as {
          webkitSpeechRecognition?: new () => RecognitionInstance;
        }
      ).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setSpeechError(
        "このブラウザでは音声認識が使えません。最新版の対応ブラウザで試すか、音声を聞いて声に出して練習してください。"
      );
      return;
    }

    setSpeechError("");
    setSpokenText("");

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "zh-CN";
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      setSpokenText(
        Array.from(event.results)
          .map((result) => result[0].transcript)
          .join("")
      );
    };

    recognition.onerror = () => {
      setSpeechError(
        "音声を認識できませんでした。マイクの使用を許可して、もう一度試してください。"
      );
      setListening(false);
    };

    recognition.onend = () => setListening(false);

    setListening(true);
    try {
      recognition.start();
    } catch {
      setListening(false);
      setSpeechError("マイクを開始できませんでした。少し待ってから再試行してください。");
    }
  }

  function chooseAnswer(next: number, answerScore: number) {
    setScore((current) => current + answerScore);
    setFeedback(
      answerScore
        ? "正解！相手の意図をよく理解できています。"
        : "選択を記録しました。中国語の意味をもう一度確認してみましょう。"
    );

    window.setTimeout(() => {
      setFeedback("");
      if (next >= scenes.length) {
        setFinished(true);
      } else {
        setSceneIndex(next);
        setSpokenText("");
      }
    }, 900);
  }

  const buttonStyle: React.CSSProperties = {
    width: "100%",
    padding: "13px 15px",
    margin: "6px 0",
    border: "1px solid #c9ab68",
    borderRadius: "10px",
    background: "#fffaf0",
    color: "#202a22",
    fontSize: "15px",
    textAlign: "left",
    lineHeight: 1.7,
    cursor: "pointer",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "24px 16px 48px",
        background: "#172a22",
        color: "#fff8e8",
        fontFamily: "serif",
      }}
    >
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        <a href="/story1" style={{ color: "#ffe39a" }}>
          ← タイトルへ戻る
        </a>

        <p style={{ color: "#ffe39a", letterSpacing: 2, marginTop: 28 }}>
          CHAPTER 01 · 秦国からの密書
        </p>

        <div
          style={{
            height: 6,
            background: "#43574a",
            borderRadius: 6,
            margin: "16px 0 28px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: finished
                ? "100%"
                : `${((sceneIndex + 1) / scenes.length) * 100}%`,
              background: "#e5c778",
              transition: "width 0.3s",
            }}
          />
        </div>

        {finished ? (
          <section
            style={{
              padding: 24,
              borderRadius: 14,
              background: "#fffaf0",
              color: "#202a22",
            }}
          >
            <h1>第1章 完了！</h1>
            <p>外交判断の得点：{score} / 3</p>
            <p>中国語を聞き、話し、外交上の判断をする練習ができました。</p>
            <button
              style={{ ...buttonStyle, textAlign: "center" }}
              onClick={() => {
                setSceneIndex(0);
                setScore(0);
                setFinished(false);
                setFeedback("");
                setSpokenText("");
              }}
            >
              もう一度プレイ
            </button>
            <a href="/story1" style={{ color: "#30483a" }}>
              タイトルへ戻る
            </a>
          </section>
        ) : (
          <>
            <section
              style={{
                padding: 22,
                borderRadius: 14,
                background: "#fffaf0",
                color: "#202a22",
                boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
              }}
            >
              <p style={{ color: "#705018", fontWeight: "bold" }}>
                {scene.speaker}
              </p>

              <h1 style={{ fontSize: 24, lineHeight: 1.6 }}>
                {scene.chinese}
              </h1>

              {showPinyin && (
                <p style={{ color: "#66573d", lineHeight: 1.8 }}>
                  {scene.pinyin}
                </p>
              )}

              {showTranslation && (
                <p style={{ lineHeight: 1.9 }}>
                  🇯🇵 {scene.japanese}
                </p>
              )}

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  marginTop: 18,
                }}
              >
                <button
                  onClick={speakChinese}
                  style={{
                    ...buttonStyle,
                    width: "auto",
                    background: "#30483a",
                    color: "#ffffff",
                  }}
                >
                  🔊 中国語を聞く
                </button>

                <button
                  onClick={() => setShowPinyin((value) => !value)}
                  style={{ ...buttonStyle, width: "auto" }}
                >
                  {showPinyin ? "ピンインを隠す" : "ピンインを表示"}
                </button>

                <button
                  onClick={() => setShowTranslation((value) => !value)}
                  style={{ ...buttonStyle, width: "auto" }}
                >
                  {showTranslation ? "訳を隠す" : "日本語訳を表示"}
                </button>
              </div>
            </section>

            <section
              style={{
                marginTop: 24,
                padding: 20,
                border: "1px solid #b99a57",
                borderRadius: 14,
              }}
            >
              
<h2
  style={{
    fontSize: 21,
    color: "#000000",
    fontWeight: 800,
    lineHeight: 1.6,
    textShadow: "0 1px 3px rgba(0,0,0,0.4)",
  }}
>
  🎙️ スピーキング練習
</h2>

              <p style={{ lineHeight: 1.9 }}>
                お手本の中国語を聞いたら、同じ文を声に出してみましょう。
              </p>

              <button
                onClick={startSpeakingPractice}
                disabled={listening}
                style={{
                  ...buttonStyle,
                  textAlign: "center",
                  background: listening ? "#9c916f" : "#e5c778",
                  color: "#172a22",
                  fontWeight: "bold",
                }}
              >
                {listening ? "🎙️ 聞き取り中…" : "🎙️ マイクで話す"}
              </button>

              {spokenText && (
                <div
                  style={{
                    padding: 14,
                    marginTop: 12,
                    borderRadius: 8,
                    background: "#ffffff",
                    color: "#202a22",
                  }}
                >
                  <strong>認識された発話：</strong>
                  <p>{spokenText}</p>
                  <p style={{ fontSize: 13, color: "#625744" }}>
                    認識結果は発音評価そのものではありません。お手本と聞き比べてみましょう。
                  </p>
                </div>
              )}

              {speechError && (
                <p style={{ color: "#ffe39a", lineHeight: 1.8 }}>
                  {speechError}
                </p>
              )}
            </section>

            <section style={{ marginTop: 28 }}>
              
<h2
  style={{
    fontSize: 21,
    color: "#000000",
    fontWeight: 800,
    lineHeight: 1.8,
    textShadow: "0 1px 3px rgba(0,0,0,0.4)",
  }}
>
  ⚖️ {scene.question}
</h2>

              {scene.choices.map((choice, index) => (
                <button
                  key={choice.text}
                  onClick={() => chooseAnswer(choice.next, choice.score)}
                  style={buttonStyle}
                >
                  {index + 1}. {choice.text}
                </button>
              ))}
              {feedback && (
                <p
                  role="status"
                  style={{
                    padding: 14,
                    background: "#fffaf0",
                    color: "#202a22",
                    borderRadius: 8,
                    lineHeight: 1.8,
                  }}
                >
                  {feedback}
                </p>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
