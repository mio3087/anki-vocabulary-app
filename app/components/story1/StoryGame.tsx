
"use client";

import { useState } from "react";
import type { StoryChapter } from "../../lib/story1/chapters";

type StoryGameProps = {
  chapter: StoryChapter;
};

export default function StoryGame({ chapter }: StoryGameProps) {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [showPinyin, setShowPinyin] = useState(false);
  const [showJapanese, setShowJapanese] = useState(false);

  const scenes = chapter.scenes;
  const scene = scenes[sceneIndex];

  function speakChinese() {
    if (!scene || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(scene.chinese);
    utterance.lang = "zh-CN";
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  }

  function startSpeakingPractice() {
    const browserWindow = window as Window & {
      SpeechRecognition?: new () => any;
      webkitSpeechRecognition?: new () => any;
    };

    const Recognition =
      browserWindow.SpeechRecognition ||
      browserWindow.webkitSpeechRecognition;

    if (!Recognition) {
      setFeedback(
        "このブラウザでは音声認識を利用できません。Chromeで試してください。"
      );
      return;
    }

    const recognition = new Recognition();
    recognition.lang = "zh-CN";
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      setFeedback(`🎙️ 認識結果：${event.results[0][0].transcript}`);
    };

    recognition.onerror = () => {
      setFeedback("音声を認識できませんでした。もう一度試してください。");
    };

    recognition.start();
  }

  function chooseAnswer(
    choice: (typeof scenes)[number]["choices"][number]
  ) {
    if (answered) return;

    setAnswered(true);
    setScore((previous) => previous + choice.score);
    setFeedback(
      choice.score > 0
        ? "正解！外交官として一歩前進した。"
        : "まだ別の道がある。相手の言葉をもう一度考えよう。"
    );
  }

  function nextScene() {
    const nextIndex = sceneIndex + 1;

    if (nextIndex >= scenes.length) {
      setFinished(true);
      return;
    }

    setSceneIndex(nextIndex);
    setAnswered(false);
    setFeedback("");
    setShowPinyin(false);
    setShowJapanese(false);
  }

  if (scenes.length === 0) {
    return (
      <main style={ui.page}>
        <p>この章には、まだ場面が登録されていません。</p>
      </main>
    );
  }

  if (finished) {
    return (
      <main style={ui.page}>
        <div style={ui.shell}>
          <p style={ui.kicker}>DIPLOMATIC RECORD · COMPLETE</p>
          <h1 style={ui.title}>此章完了</h1>
          <div style={ui.paper}>
            <p style={ui.redLabel}>第{chapter.id}章 終了</p>
            <h2 style={ui.paperTitle}>{chapter.title}</h2>
            <p style={ui.bodyText}>
              あなたの決断が、この物語の一頁となった。
            </p>
            <div style={ui.scoreBox}>
              <span style={ui.scoreNumber}>{score}</span>
              <span style={ui.mutedText}> / {scenes.length} ポイント</span>
            </div>
            <button
              style={ui.primaryButton}
              onClick={() => (window.location.href = "/story1")}
            >
              章一覧へ戻る　→
            </button>
            <button
              style={ui.secondaryButton}
              onClick={() => window.location.reload()}
            >
              もう一度プレイ
            </button>
          </div>
        </div>
      </main>
    );
  }

  const progress = ((sceneIndex + 1) / scenes.length) * 100;

  return (
    <main style={ui.page}>
      <div style={ui.shell}>
        <header style={ui.topbar}>
          <a href="/story1" style={ui.backLink}>
            ← 章一覧
          </a>
          <span style={ui.kicker}>ANCIENT CHINA · STORY 01</span>
          <span style={ui.chapterBadge}>第{chapter.id}章</span>
        </header>

        <section style={ui.hero}>
          <p style={ui.redLabel}>外交官の記録</p>
          <h1 style={ui.title}>{chapter.title}</h1>
          <p style={ui.heroSubtitle}>
            言葉を読み解き、知略を巡らせ、歴史を動かせ。
          </p>

          <div style={ui.progressHeader}>
            <span>物語の進行</span>
            <span>
              {sceneIndex + 1} / {scenes.length}
            </span>
          </div>
          <div style={ui.progressTrack}>
            <div
              style={{
                ...ui.progressFill,
                width: `${progress}%`,
              }}
            />
          </div>
        </section>

        <section style={ui.paper}>
          <div style={ui.sceneLabel}>
            <span>SCENE {String(sceneIndex + 1).padStart(2, "0")}</span>
            <span>会話記録</span>
          </div>

          <div style={ui.speakerRow}>
            <div style={ui.seal}>使</div>
            <div>
              <p style={ui.redLabel}>使者の言葉</p>
              <h2 style={ui.speakerName}>{scene.speaker}</h2>
            </div>
          </div>

          <p style={ui.chinese}>{scene.chinese}</p>

          {showPinyin && <p style={ui.pinyin}>{scene.pinyin}</p>}

          {showJapanese && (
            <p style={ui.translation}>{scene.japanese}</p>
          )}

          <div style={ui.toolRow}>
            <button style={ui.toolButton} onClick={speakChinese}>
              <span>▶</span> 音声を聞く
            </button>
            <button
              style={{
                ...ui.toolButton,
                ...(showPinyin ? ui.toolActive : {}),
              }}
              onClick={() => setShowPinyin((value) => !value)}
            >
              拼音 {showPinyin ? "−" : "+"}
            </button>
            <button
              style={{
                ...ui.toolButton,
                ...(showJapanese ? ui.toolActive : {}),
              }}
              onClick={() => setShowJapanese((value) => !value)}
            >
              日本語訳 {showJapanese ? "−" : "+"}
            </button>
          </div>
        </section>

        <section style={ui.practice}>
          <div style={ui.practiceIcon}>声</div>
          <div style={ui.practiceContent}>
            <h2 style={{ ...ui.practiceTitle, color: "#000000" }}>声に出してみよう</h2>
            <p style={ui.practiceText}>
              使者の言葉をまねして、中国語で話してみよう。
            </p>
          </div>
          <button
            style={ui.speakButton}
            onClick={startSpeakingPractice}
            aria-label="中国語のスピーキング練習を開始"
          >
            🎙 話す
          </button>
        </section>

        <section style={ui.questionSection}>
          <div style={ui.questionHeader}>
            <span style={ui.questionNumber}>問 {sceneIndex + 1}</span>
            <span style={ui.kicker}>YOUR DECISION</span>
          </div>

        
          <h2 style={{ ...ui.questionTitle, color: "#000000" }}>使者の提案を理解できましたか？</h2>
          <p style={ui.questionHint}>
            あなたなら、どう判断する？
          </p>

          <div style={ui.choices}>
            {scene.choices.map((choice, index) => {
              const isCorrect = answered && choice.score > 0;
              const isWrong = answered && choice.score <= 0;

              return (
                <button
                  key={`${sceneIndex}-${index}`}
                  style={{
                    ...ui.choice,
                    ...(isCorrect ? ui.correctChoice : {}),
                    ...(isWrong ? ui.answeredChoice : {}),
                  }}
                  disabled={answered}
                  onClick={() => chooseAnswer(choice)}
                >
                  <span style={ui.choiceLetter}>
                    {["A", "B", "C", "D"][index] ?? String(index + 1)}
                  </span>
                  <span style={ui.choiceText}>{choice.text}</span>
                  <span style={ui.choiceArrow}>
                    {isCorrect ? "✓" : "›"}
                  </span>
                </button>
              );
            })}
          </div>

          {feedback && (
            <div
              style={ui.feedback}
              role="status"
              aria-live="polite"
            >
              {feedback}
            </div>
          )}

          {answered && (
            <button style={ui.primaryButton} onClick={nextScene}>
              {sceneIndex + 1 >= scenes.length
                ? "結果を確認する　→"
                : "次の場面へ進む　→"}
            </button>
          )}
        </section>

        <footer style={ui.footer}>
          <span>ANCIENT CHINA</span>
          <span>名声　{score}</span>
          <span>外交記録 #{String(sceneIndex + 1).padStart(3, "0")}</span>
        </footer>
      </div>
    </main>
  );
}

const ui: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(ellipse at 50% 0%, #354139 0%, #1b2422 50%, #12191b 100%)",
    color: "#F3E9D5",
    padding: "24px 16px 48px",
    fontFamily:
      '"Yu Mincho", "Hiragino Mincho ProN", "Noto Serif JP", serif',
  },
  shell: {
    maxWidth: "760px",
    margin: "0 auto",
  },
  topbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "12px",
    marginBottom: "32px",
  },
  backLink: {
    color: "#D8C8A6",
    textDecoration: "none",
    fontSize: "13px",
  },
  kicker: {
    color: "#B8A987",
    fontSize: "10px",
    letterSpacing: "2px",
    fontFamily: "sans-serif",
  },
  chapterBadge: {
    color: "#F1D8A5",
    border: "1px solid #75674D",
    padding: "6px 12px",
    fontSize: "12px",
  },
  hero: {
    textAlign: "center",
    padding: "12px 0 28px",
  },
  redLabel: {
    color: "#A74736",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "2px",
    margin: "0 0 8px",
  },
  title: {
    fontSize: "clamp(27px, 5vw, 40px)",
    fontWeight: 700,
    lineHeight: 1.5,
    color: "#F1D8A5",
    margin: "4px 0 10px",
    letterSpacing: "2px",
  },
  heroSubtitle: {
    color: "#C4BCA9",
    fontSize: "13px",
    lineHeight: 1.9,
    margin: "0 0 28px",
  },
  progressHeader: {
    display: "flex",
    justifyContent: "space-between",
    color: "#D5C9B1",
    fontSize: "12px",
    marginBottom: "8px",
    fontFamily: "sans-serif",
  },
  progressTrack: {
    height: "4px",
    background: "#41473F",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "#B54D3A",
    transition: "width 250ms ease",
  },
  paper: {
    background: "#F1E7D2",
    color: "#29261F",
    border: "1px solid #CBB995",
    boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
    padding: "clamp(20px, 5vw, 36px)",
    margin: "0 0 18px",
  },
  sceneLabel: {
    display: "flex",
    justifyContent: "space-between",
    borderBottom: "1px solid #D5C7AA",
    paddingBottom: "12px",
    marginBottom: "24px",
    color: "#82745A",
    fontSize: "10px",
    letterSpacing: "2px",
    fontFamily: "sans-serif",
  },
  speakerRow: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "20px",
  },
  seal: {
    width: "42px",
    height: "42px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#A74736",
    color: "#FFF1D9",
    fontSize: "21px",
    flexShrink: 0,
  },
  speakerName: {
    fontSize: "18px",
    margin: 0,
    color: "#302A22",
  },
  chinese: {
    fontSize: "clamp(22px, 4vw, 29px)",
    lineHeight: 1.9,
    color: "#29261F",
    margin: "18px 0 10px",
    overflowWrap: "anywhere",
  },
  pinyin: {
    color: "#8B5944",
    fontSize: "14px",
    lineHeight: 1.8,
    overflowWrap: "anywhere",
    margin: "8px 0",
  },
  translation: {
    color: "#5D5547",
    borderLeft: "3px solid #B54D3A",
    paddingLeft: "14px",
    lineHeight: 1.9,
    fontSize: "14px",
    margin: "14px 0",
  },
  toolRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "26px",
    paddingTop: "18px",
    borderTop: "1px solid #D5C7AA",
  },
  toolButton: {
    background: "transparent",
    color: "#5D5140",
    border: "1px solid #C9B997",
    padding: "9px 12px",
    fontSize: "12px",
    cursor: "pointer",
  },
  toolActive: {
    background: "#E0D1B4",
    borderColor: "#A74736",
    color: "#7C3328",
  },
  practice: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "18px",
    margin: "18px 0",
    border: "1px solid #5C5948",
    background: "rgba(242, 231, 210, 0.06)",
  },
  practiceIcon: {
    width: "42px",
    height: "42px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#A74736",
    color: "#FFF0D3",
    fontSize: "22px",
  },
  practiceContent: {
    flex: 1,
    minWidth: 0,
  },
  practiceTitle: {
    fontSize: "16px",
    margin: "0 0 6px",
    color: "#F1D8A5",
  },
  


practiceText: {
  color: "#F3E9D5",
  // ほかの設定はそのまま残す
},

questionHint: {
  color: "#F3E9D5",
  // ほかの設定はそのまま残す
},


  speakButton: {
    background: "#D8C49A",
    color: "#29261F",
    border: "none",
    padding: "11px 14px",
    fontWeight: 700,
    fontSize: "12px",
    cursor: "pointer",
    flexShrink: 0,
  },
  questionSection: {
    padding: "24px 0 8px",
  },
  questionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "14px",
  },
  questionNumber: {
    color: "#E4C995",
    fontSize: "12px",
    letterSpacing: "1px",
  },
  questionTitle: {
    color: "#F3E9D5",
    fontSize: "clamp(19px, 4vw, 24px)",
    lineHeight: 1.7,
    margin: "0 0 8px",
  },
  questionHint: {
    color: "#BEB8A8",
    fontSize: "13px",
    margin: "0 0 20px",
    lineHeight: 1.8,
  },
  choices: {
    display: "grid",
    gap: "10px",
  },
  choice: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    width: "100%",
    textAlign: "left",
    padding: "16px",
    border: "1px solid #656457",
    background: "#F1E7D2",
    color: "#29261F",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "14px",
    lineHeight: 1.8,
    transition: "background 150ms ease",
  },
  choiceLetter: {
    width: "30px",
    height: "30px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #BDAE8C",
    color: "#8D4232",
    fontSize: "12px",
  },
  choiceText: {
    flex: 1,
    minWidth: 0,
    overflowWrap: "anywhere",
  },
  choiceArrow: {
    color: "#9B4836",
    fontSize: "22px",
    flexShrink: 0,
  },
  correctChoice: {
    background: "#E1E8D8",
    borderColor: "#637C56",
  },
  answeredChoice: {
    opacity: 0.72,
    cursor: "default",
  },
  feedback: {
    marginTop: "18px",
    padding: "15px",
    background: "#303B32",
    color: "#F1D8A5",
    borderLeft: "3px solid #B54D3A",
    fontSize: "14px",
    lineHeight: 1.9,
    overflowWrap: "anywhere",
  },
  primaryButton: {
    display: "block",
    width: "100%",
    marginTop: "20px",
    padding: "15px 18px",
    background: "#A74736",
    color: "#FFF1D9",
    border: "1px solid #C36A53",
    fontFamily: "inherit",
    fontSize: "14px",
    letterSpacing: "1px",
    cursor: "pointer",
  },
  secondaryButton: {
    display: "block",
    width: "100%",
    marginTop: "10px",
    padding: "13px",
    background: "transparent",
    color: "#655842",
    border: "1px solid #C9B997",
    fontFamily: "inherit",
    cursor: "pointer",
  },
  scoreBox: {
    padding: "18px 0",
    borderTop: "1px solid #D5C7AA",
    marginTop: "20px",
  },
  scoreNumber: {
    color: "#A74736",
    fontSize: "40px",
    fontWeight: 700,
  },
  mutedText: {
    color: "#82745A",
    fontSize: "13px",
  },
  bodyText: {
    color: "#5D5547",
    lineHeight: 1.9,
    fontSize: "14px",
  },
  paperTitle: {
    color: "#29261F",
    fontSize: "24px",
    lineHeight: 1.6,
  },
  footer: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: "10px",
    borderTop: "1px solid #42483F",
    paddingTop: "18px",
    marginTop: "30px",
    color: "#9D9B8D",
    fontSize: "10px",
    letterSpacing: "1px",
    fontFamily: "sans-serif",
  },
};
