
"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import type { StoryChapter } from "../../../lib/story1/chapters";
import { useAppLanguage } from "@/app/component/AppLanguage";

type AppLanguage = "ja" | "de" | "en" | "zh-CN" | "zh-TW" | "es";

type StoryGameProps = {
  chapter: StoryChapter;
};

const translations: Record<AppLanguage, Record<string, string>> = {
  ja: {
    empty: "この章には、まだ場面が登録されていません。",
    record: "DIPLOMATIC RECORD · COMPLETE",
    finished: "此章完了",
    chapterEnd: "第{n}章 終了",
    ending: "あなたの決断が、この物語の一頁となった。",
    points: "ポイント",
    chapterList: "章一覧へ戻る",
    replay: "もう一度プレイ",
    chapter: "第{n}章",
    diplomatRecord: "外交官の記録",
    subtitle: "言葉を読み解き、知略を巡らせ、歴史を動かせ。",
    progress: "物語の進行",
    conversation: "会話記録",
    messenger: "使者の言葉",
    listen: "音声を聞く",
    pinyin: "拼音",
    japanese: "日本語訳",
    speakingTitle: "声に出してみよう",
    speakingText: "使者の言葉をまねして、中国語で話してみよう。",
    speak: "話す",
    speakAria: "中国語のスピーキング練習を開始",
    unsupported: "このブラウザでは音声認識を利用できません。Chromeで試してください。",
    recognized: "🎙️ 認識結果：{text}",
    recognitionError: "音声を認識できませんでした。もう一度試してください。",
    correct: "正解！外交官として一歩前進した。",
    incorrect: "まだ別の道がある。相手の言葉をもう一度考えよう。",
    question: "問 {n}",
    decision: "使者の提案を理解できましたか？",
    hint: "あなたなら、どう判断する？",
    result: "結果を確認する",
    next: "次の場面へ進む",
    fame: "名声",
  },
  de: {
    empty: "In diesem Kapitel wurden noch keine Szenen hinzugefügt.",
    record: "DIPLOMATIC RECORD · COMPLETE",
    finished: "Kapitel abgeschlossen",
    chapterEnd: "Kapitel {n} abgeschlossen",
    ending: "Deine Entscheidung wurde zu einer Seite dieser Geschichte.",
    points: "Punkte",
    chapterList: "Zur Kapitelübersicht",
    replay: "Noch einmal spielen",
    chapter: "Kapitel {n}",
    diplomatRecord: "Aufzeichnungen eines Diplomaten",
    subtitle: "Entschlüssle die Worte, entwickle Strategien und verändere die Geschichte.",
    progress: "Fortschritt der Geschichte",
    conversation: "Gesprächsprotokoll",
    messenger: "Worte des Gesandten",
    listen: "Audio anhören",
    pinyin: "Pinyin",
    japanese: "Japanische Übersetzung",
    speakingTitle: "Sprich laut",
    speakingText: "Sprich die Worte des Gesandten auf Chinesisch nach.",
    speak: "Sprechen",
    speakAria: "Chinesische Sprechübung starten",
    unsupported: "Die Spracherkennung wird von diesem Browser nicht unterstützt. Bitte versuche es mit Chrome.",
    recognized: "🎙️ Erkanntes Ergebnis: {text}",
    recognitionError: "Die Sprache konnte nicht erkannt werden. Bitte versuche es erneut.",
    correct: "Richtig! Du bist als Diplomat einen Schritt weitergekommen.",
    incorrect: "Es gibt noch einen anderen Weg. Überlege noch einmal, was dein Gegenüber gesagt hat.",
    question: "Frage {n}",
    decision: "Hast du den Vorschlag des Gesandten verstanden?",
    hint: "Wie würdest du entscheiden?",
    result: "Ergebnis anzeigen",
    next: "Zur nächsten Szene",
    fame: "Ruhm",
  },
  en: {
    empty: "No scenes have been added to this chapter yet.",
    record: "DIPLOMATIC RECORD · COMPLETE",
    finished: "Chapter Complete",
    chapterEnd: "Chapter {n} Completed",
    ending: "Your decision has become a page in this story.",
    points: "points",
    chapterList: "Back to Chapters",
    replay: "Play Again",
    chapter: "Chapter {n}",
    diplomatRecord: "A Diplomat's Record",
    subtitle: "Decipher words, devise strategies, and shape history.",
    progress: "Story Progress",
    conversation: "Conversation Record",
    messenger: "The Messenger's Words",
    listen: "Listen to Audio",
    pinyin: "Pinyin",
    japanese: "Japanese Translation",
    speakingTitle: "Speak Out Loud",
    speakingText: "Try speaking Chinese by imitating the messenger.",
    speak: "Speak",
    speakAria: "Start Chinese speaking practice",
    unsupported: "Speech recognition is not available in this browser. Please try Chrome.",
    recognized: "🎙️ Recognized: {text}",
    recognitionError: "Could not recognize your speech. Please try again.",
    correct: "Correct! You've taken another step forward as a diplomat.",
    incorrect: "There may be another way. Think again about what the other person said.",
    question: "Question {n}",
    decision: "Did you understand the messenger's proposal?",
    hint: "What would your decision be?",
    result: "View Results",
    next: "Next Scene",
    fame: "Fame",
  },
  "zh-CN": {
    empty: "本章暂时还没有添加任何场景。",
    record: "DIPLOMATIC RECORD · COMPLETE",
    finished: "本章完成",
    chapterEnd: "第{n}章结束",
    ending: "你的决定，成为了这个故事的一页。",
    points: "分",
    chapterList: "返回章节列表",
    replay: "再玩一次",
    chapter: "第{n}章",
    diplomatRecord: "外交官的记录",
    subtitle: "读懂语言，运筹帷幄，推动历史。",
    progress: "故事进度",
    conversation: "对话记录",
    messenger: "使者的话",
    listen: "收听语音",
    pinyin: "拼音",
    japanese: "日语翻译",
    speakingTitle: "试着大声说出来",
    speakingText: "模仿使者的话，试着用中文说出来吧。",
    speak: "开始说话",
    speakAria: "开始中文口语练习",
    unsupported: "此浏览器不支持语音识别。请尝试使用 Chrome。",
    recognized: "🎙️ 识别结果：{text}",
    recognitionError: "无法识别语音，请再试一次。",
    correct: "回答正确！你作为外交官又向前迈进了一步。",
    incorrect: "也许还有其他方法。再仔细想想对方说的话吧。",
    question: "问题 {n}",
    decision: "你理解使者的提议了吗？",
    hint: "如果是你，会如何判断？",
    result: "查看结果",
    next: "进入下一个场景",
    fame: "声望",
  },
  "zh-TW": {
    empty: "本章目前還沒有新增任何場景。",
    record: "DIPLOMATIC RECORD · COMPLETE",
    finished: "本章完成",
    chapterEnd: "第{n}章結束",
    ending: "你的決定，成為了這個故事的一頁。",
    points: "分",
    chapterList: "返回章節列表",
    replay: "再玩一次",
    chapter: "第{n}章",
    diplomatRecord: "外交官的紀錄",
    subtitle: "讀懂語言，運籌帷幄，推動歷史。",
    progress: "故事進度",
    conversation: "對話紀錄",
    messenger: "使者的話",
    listen: "收聽語音",
    pinyin: "拼音",
    japanese: "日文翻譯",
    speakingTitle: "試著大聲說出來",
    speakingText: "模仿使者的話，試著用中文說出來吧。",
    speak: "開始說話",
    speakAria: "開始中文口說練習",
    unsupported: "此瀏覽器不支援語音辨識。請試著使用 Chrome。",
    recognized: "🎙️ 辨識結果：{text}",
    recognitionError: "無法辨識語音，請再試一次。",
    correct: "回答正確！你作為外交官又向前邁進了一步。",
    incorrect: "或許還有其他方法。再仔細想想對方說的話吧。",
    question: "問題 {n}",
    decision: "你理解使者的提議了嗎？",
    hint: "如果是你，會如何判斷？",
    result: "查看結果",
    next: "進入下一個場景",
    fame: "聲望",
  },
  es: {
    empty: "Todavía no se han añadido escenas a este capítulo.",
    record: "DIPLOMATIC RECORD · COMPLETE",
    finished: "Capítulo completado",
    chapterEnd: "Capítulo {n} finalizado",
    ending: "Tu decisión se ha convertido en una página de esta historia.",
    points: "puntos",
    chapterList: "Volver a los capítulos",
    replay: "Volver a jugar",
    chapter: "Capítulo {n}",
    diplomatRecord: "Registro de un diplomático",
    subtitle: "Descifra las palabras, desarrolla estrategias y cambia la historia.",
    progress: "Progreso de la historia",
    conversation: "Registro de conversación",
    messenger: "Las palabras del mensajero",
    listen: "Escuchar audio",
    pinyin: "Pinyin",
    japanese: "Traducción al japonés",
    speakingTitle: "Habla en voz alta",
    speakingText: "Imita las palabras del mensajero e intenta hablar en chino.",
    speak: "Hablar",
    speakAria: "Iniciar práctica oral de chino",
    unsupported: "Este navegador no admite el reconocimiento de voz. Prueba con Chrome.",
    recognized: "🎙️ Resultado del reconocimiento: {text}",
    recognitionError: "No se ha podido reconocer tu voz. Inténtalo de nuevo.",
    correct: "¡Correcto! Has dado un paso más como diplomático.",
    incorrect: "Quizás exista otro camino. Piensa de nuevo en las palabras de la otra persona.",
    question: "Pregunta {n}",
    decision: "¿Has entendido la propuesta del mensajero?",
    hint: "¿Qué decidirías tú?",
    result: "Ver resultado",
    next: "Continuar a la siguiente escena",
    fame: "Prestigio",
  },
};

export default function StoryGame({ chapter }: StoryGameProps) {
  const { language } = useAppLanguage();

  const currentLanguage: AppLanguage =
    language in translations ? (language as AppLanguage) : "ja";

  const t = translations[currentLanguage];

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
      setFeedback(t.unsupported);
      return;
    }

    const recognition = new Recognition();
    recognition.lang = "zh-CN";
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      setFeedback(
        t.recognized.replace(
          "{text}",
          event.results[0][0].transcript
        )
      );
    };

    recognition.onerror = () => {
      setFeedback(t.recognitionError);
    };

    recognition.start();
  }

  function chooseAnswer(
    choice: (typeof scenes)[number]["choices"][number]
  ) {
    if (answered) return;

    setAnswered(true);
    setScore((previous) => previous + choice.score);
    setFeedback(choice.score > 0 ? t.correct : t.incorrect);
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
        <p>{t.empty}</p>
      </main>
    );
  }

  if (finished) {
    return (
      <main style={ui.page}>
        <div style={ui.shell}>
          <p style={ui.kicker}>{t.record}</p>
          <h1 style={ui.title}>{t.finished}</h1>
          <div style={ui.paper}>
            <p style={ui.redLabel}>
              {t.chapterEnd.replace("{n}", String(chapter.id))}
            </p>
            <h2 style={ui.paperTitle}>{chapter.title}</h2>
            <p style={ui.bodyText}>{t.ending}</p>
            <div style={ui.scoreBox}>
              <span style={ui.scoreNumber}>{score}</span>
              <span style={ui.mutedText}>
                {" / "}{scenes.length} {t.points}
              </span>
            </div>
            <button
              style={ui.primaryButton}
              onClick={() => (window.location.href = "/story1")}
            >
              {t.chapterList}　→
            </button>
            <button
              style={ui.secondaryButton}
              onClick={() => window.location.reload()}
            >
              {t.replay}
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
            ← {t.chapterList}
          </a>
          <span style={ui.kicker}>ANCIENT CHINA · STORY 01</span>
          <span style={ui.chapterBadge}>
            {t.chapter.replace("{n}", String(chapter.id))}
          </span>
        </header>

        <section style={ui.hero}>
          <p style={ui.redLabel}>{t.diplomatRecord}</p>
          <h1 style={ui.title}>{chapter.title}</h1>
          <p style={ui.heroSubtitle}>{t.subtitle}</p>

          <div style={ui.progressHeader}>
            <span>{t.progress}</span>
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
            <span>
              SCENE {String(sceneIndex + 1).padStart(2, "0")}
            </span>
            <span>{t.conversation}</span>
          </div>

          <div style={ui.speakerRow}>
            <div style={ui.seal}>使</div>
            <div>
              <p style={ui.redLabel}>{t.messenger}</p>
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
              <span>▶</span> {t.listen}
            </button>
            <button
              style={{
                ...ui.toolButton,
                ...(showPinyin ? ui.toolActive : {}),
              }}
              onClick={() => setShowPinyin((value) => !value)}
            >
              {t.pinyin} {showPinyin ? "−" : "+"}
            </button>
            <button
              style={{
                ...ui.toolButton,
                ...(showJapanese ? ui.toolActive : {}),
              }}
              onClick={() => setShowJapanese((value) => !value)}
            >
              {t.japanese} {showJapanese ? "−" : "+"}
            </button>
          </div>
        </section>

        <section style={ui.practice}>
          <div style={ui.practiceIcon}>声</div>
          <div style={ui.practiceContent}>
            <h2 style={ui.practiceTitle}>{t.speakingTitle}</h2>
            <p style={ui.practiceText}>{t.speakingText}</p>
          </div>
          <button
            style={ui.speakButton}
            onClick={startSpeakingPractice}
            aria-label={t.speakAria}
          >
            🎙 {t.speak}
          </button>
        </section>

        <section style={ui.questionSection}>
          <div style={ui.questionHeader}>
            <span style={ui.questionNumber}>
              {t.question.replace("{n}", String(sceneIndex + 1))}
            </span>
            <span style={ui.kicker}>YOUR DECISION</span>
          </div>

          <h2 style={ui.questionTitle}>{t.decision}</h2>
          <p style={ui.questionHint}>{t.hint}</p>

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
                ? `${t.result}　→`
                : `${t.next}　→`}
            </button>
          )}
        </section>

        <footer style={ui.footer}>
          <span>ANCIENT CHINA</span>
          <span>{t.fame}　{score}</span>
          <span>
            RECORD #{String(sceneIndex + 1).padStart(3, "0")}
          </span>
        </footer>
      </div>
    </main>
  );
}

const ui: Record<string, CSSProperties> = {
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
    fontSize: "13px",
    lineHeight: 1.8,
    margin: 0,
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
