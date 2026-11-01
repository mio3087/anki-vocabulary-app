
"use client";

import { useState } from "react";
import { useLanguage } from "@/app/component/AppLanguage";

type Language = "ja" | "de" | "en" | "zh-CN" | "zh-TW" | "es";

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
    speaker: {
      ja: "秦国の使者",
      de: "Gesandter des Staates Qin",
      en: "Envoy of the State of Qin",
      "zh-CN": "秦国使者",
      "zh-TW": "秦國使者",
      es: "Enviado del Estado de Qin",
    },
    chinese: "若贵国愿与秦国结盟，我国愿意提供援助。",
    pinyin: "Ruò guìguó yuàn yǔ Qín guó jiéméng, wǒ guó yuànyì tígōng yuánzhù.",
    translation: {
      ja: "もし貴国が秦国との同盟を望むなら、我が国は援助を提供する用意があります。",
      de: "Wenn Ihr Land ein Bündnis mit dem Staat Qin eingehen möchte, ist unser Land bereit, Unterstützung zu leisten.",
      en: "If your country wishes to form an alliance with the State of Qin, our country is willing to provide assistance.",
      "zh-CN": "如果贵国愿意与秦国结盟，我国愿意提供援助。",
      "zh-TW": "如果貴國願意與秦國結盟，我國願意提供援助。",
      es: "Si vuestro país desea formar una alianza con el Estado de Qin, nuestro país está dispuesto a ofrecer ayuda.",
    },
    question: {
      ja: "使者の提案を理解できましたか？",
      de: "Hast du den Vorschlag des Gesandten verstanden?",
      en: "Did you understand the envoy's proposal?",
      "zh-CN": "你理解使者的提议了吗？",
      "zh-TW": "你理解使者的提議了嗎？",
      es: "¿Has entendido la propuesta del enviado?",
    },
    choices: [
      {
        text: {
          ja: "援助と引き換えに同盟を提案している",
          de: "Er schlägt ein Bündnis im Gegenzug für Unterstützung vor.",
          en: "He is proposing an alliance in exchange for assistance.",
          "zh-CN": "提出以援助换取结盟",
          "zh-TW": "提出以援助換取結盟",
          es: "Propone una alianza a cambio de ayuda.",
        },
        next: 1,
        score: 1,
      },
      {
        text: {
          ja: "秦国が直ちに戦争を始めると宣言している",
          de: "Qin erklärt, dass es sofort einen Krieg beginnen wird.",
          en: "Qin declares that it will start a war immediately.",
          "zh-CN": "秦国宣布立即发动战争",
          "zh-TW": "秦國宣布立即發動戰爭",
          es: "Qin declara que comenzará una guerra inmediatamente.",
        },
        next: 1,
        score: 0,
      },
      {
        text: {
          ja: "秦国が貴国への援助を拒否している",
          de: "Qin lehnt es ab, eurem Land zu helfen.",
          en: "Qin refuses to provide assistance to your country.",
          "zh-CN": "秦国拒绝向贵国提供援助",
          "zh-TW": "秦國拒絕向貴國提供援助",
          es: "Qin se niega a ayudar a vuestro país.",
        },
        next: 1,
        score: 0,
      },
    ],
  },
  {
    speaker: {
      ja: "秦国の使者",
      de: "Gesandter des Staates Qin",
      en: "Envoy of the State of Qin",
      "zh-CN": "秦国使者",
      "zh-TW": "秦國使者",
      es: "Enviado del Estado de Qin",
    },
    chinese: "不知贵国对此有何看法？",
    pinyin: "Bù zhī guìguó duì cǐ yǒu hé kànfǎ?",
    translation: {
      ja: "この件について、貴国はどのようにお考えでしょうか？",
      de: "Was hält euer Land von dieser Angelegenheit?",
      en: "What is your country's opinion on this matter?",
      "zh-CN": "请问贵国对此有什么看法？",
      "zh-TW": "請問貴國對此有什麼看法？",
      es: "¿Qué opina vuestro país sobre este asunto?",
    },
    question: {
      ja: "外交官として、どう返答しますか？",
      de: "Wie antwortest du als Diplomat?",
      en: "How will you respond as a diplomat?",
      "zh-CN": "作为外交官，你会如何回答？",
      "zh-TW": "作為外交官，你會如何回答？",
      es: "¿Cómo responderás como diplomático?",
    },
    choices: [
      {
        text: {
          ja: "秦国は我々に何を提供してほしいのでしょうか？",
          de: "Was erwartet Qin von uns?",
          en: "What does Qin expect us to provide?",
          "zh-CN": "请问，秦国希望我们提供什么？",
          "zh-TW": "請問，秦國希望我們提供什麼？",
          es: "¿Qué espera Qin que aportemos?",
        },
        next: 2,
        score: 1,
      },
      {
        text: {
          ja: "聞きたくありません。",
          de: "Wir wollen das nicht hören.",
          en: "We don't want to listen.",
          "zh-CN": "我们不想听。",
          "zh-TW": "我們不想聽。",
          es: "No queremos escuchar.",
        },
        next: 2,
        score: 0,
      },
      {
        text: {
          ja: "分かりません。",
          de: "Ich weiß es nicht.",
          en: "I don't know.",
          "zh-CN": "我不知道。",
          "zh-TW": "我不知道。",
          es: "No lo sé.",
        },
        next: 2,
        score: 0,
      },
    ],
  },
  {
    speaker: {
      ja: "秦国の使者",
      de: "Gesandter des Staates Qin",
      en: "Envoy of the State of Qin",
      "zh-CN": "秦国使者",
      "zh-TW": "秦國使者",
      es: "Enviado del Estado de Qin",
    },
    chinese: "我们希望贵国认真考虑这次结盟。",
    pinyin: "Wǒmen xīwàng guìguó rènzhēn kǎolǜ zhè cì jiéméng.",
    translation: {
      ja: "我々は貴国が今回の同盟を真剣に検討することを望みます。",
      de: "Wir hoffen, dass euer Land dieses Bündnis ernsthaft in Betracht zieht.",
      en: "We hope your country will seriously consider this alliance.",
      "zh-CN": "我们希望贵国认真考虑这次结盟。",
      "zh-TW": "我們希望貴國認真考慮這次結盟。",
      es: "Esperamos que vuestro país considere seriamente esta alianza.",
    },
    question: {
      ja: "次は君主に報告しましょう。",
      de: "Berichte nun dem Herrscher.",
      en: "Now, report to the ruler.",
      "zh-CN": "接下来，向君主报告吧。",
      "zh-TW": "接下來，向君主報告吧。",
      es: "Ahora, informa al gobernante.",
    },
    choices: [
      {
        text: {
          ja: "同盟の条件と危険性を君主に報告する",
          de: "Dem Herrscher die Bedingungen und Risiken des Bündnisses berichten.",
          en: "Report the alliance conditions and risks to the ruler.",
          "zh-CN": "向君主报告结盟的条件和风险",
          "zh-TW": "向君主報告結盟的條件和風險",
          es: "Informar al gobernante de las condiciones y los riesgos de la alianza.",
        },
        next: 3,
        score: 1,
      },
      {
        text: {
          ja: "内容を確認せず同盟を承諾する",
          de: "Das Bündnis akzeptieren, ohne die Einzelheiten zu prüfen.",
          en: "Accept the alliance without checking the details.",
          "zh-CN": "不确认内容就答应结盟",
          "zh-TW": "不確認內容就答應結盟",
          es: "Aceptar la alianza sin comprobar los detalles.",
        },
        next: 3,
        score: 0,
      },
      {
        text: {
          ja: "手紙を隠して報告しない",
          de: "Den Brief verstecken und nichts berichten.",
          en: "Hide the letter and make no report.",
          "zh-CN": "藏起信件，不向君主报告",
          "zh-TW": "藏起信件，不向君主報告",
          es: "Esconder la carta y no informar al gobernante.",
        },
        next: 3,
        score: 0,
      },
    ],
  },
];

const uiTranslations: Record<Language, Record<string, string>> = {
  ja: {
    back: "← タイトルへ戻る",
    chapter: "CHAPTER 01 · 秦国からの密書",
    completed: "第1章 完了！",
    score: "外交判断の得点：",
    outOf: "/ 3",
    result: "中国語を聞き、話し、外交上の判断をする練習ができました。",
    replay: "もう一度プレイ",
    listen: "🔊 中国語を聞く",
    hidePinyin: "ピンインを隠す",
    showPinyin: "ピンインを表示",
    hideTranslation: "訳を隠す",
    showTranslation: "日本語訳を表示",
    speaking: "🎙️ スピーキング練習",
    speakingDescription: "お手本の中国語を聞いたら、同じ文を声に出してみましょう。",
    listening: "🎙️ 聞き取り中…",
    startMic: "🎙️ マイクで話す",
    recognized: "認識された発話：",
    recognitionNote: "認識結果は発音評価そのものではありません。お手本と聞き比べてみましょう。",
    question: "⚖️ ",
    correct: "正解！相手の意図をよく理解できています。",
    incorrect: "選択を記録しました。中国語の意味をもう一度確認してみましょう。",
    noSpeech: "このブラウザでは音声読み上げが利用できません。",
    noRecognition: "このブラウザでは音声認識が使えません。最新版の対応ブラウザで試すか、音声を聞いて声に出して練習してください。",
    recognitionError: "音声を認識できませんでした。マイクの使用を許可して、もう一度試してください。",
    micError: "マイクを開始できませんでした。少し待ってから再試行してください。",
  },
  de: {
    back: "← Zurück zum Titel",
    chapter: "CHAPTER 01 · Der geheime Brief aus Qin",
    completed: "Kapitel 1 abgeschlossen!",
    score: "Punktzahl für diplomatische Entscheidungen: ",
    outOf: "/ 3",
    result: "Du hast geübt, Chinesisch zu hören, zu sprechen und diplomatische Entscheidungen zu treffen.",
    replay: "Noch einmal spielen",
    listen: "🔊 Chinesisch anhören",
    hidePinyin: "Pinyin ausblenden",
    showPinyin: "Pinyin anzeigen",
    hideTranslation: "Übersetzung ausblenden",
    showTranslation: "Übersetzung anzeigen",
    speaking: "🎙️ Sprechübung",
    speakingDescription: "Höre dir das chinesische Beispiel an und sprich denselben Satz laut nach.",
    listening: "🎙️ Aufnahme läuft…",
    startMic: "🎙️ Mit dem Mikrofon sprechen",
    recognized: "Erkannte Sprache:",
    recognitionNote: "Das Erkennungsergebnis ist keine direkte Aussprachebewertung. Vergleiche es mit dem Beispiel.",
    question: "⚖️ ",
    correct: "Richtig! Du hast die Absicht deines Gegenübers gut verstanden.",
    incorrect: "Deine Auswahl wurde gespeichert. Überprüfe noch einmal die Bedeutung des Chinesischen.",
    noSpeech: "Die Sprachausgabe wird von diesem Browser nicht unterstützt.",
    noRecognition: "Die Spracherkennung wird von diesem Browser nicht unterstützt. Verwende einen aktuellen kompatiblen Browser oder übe, indem du das Audio anhörst und laut nachsprichst.",
    recognitionError: "Die Sprache konnte nicht erkannt werden. Erlaube den Mikrofonzugriff und versuche es erneut.",
    micError: "Das Mikrofon konnte nicht gestartet werden. Warte kurz und versuche es erneut.",
  },
  en: {
    back: "← Back to title",
    chapter: "CHAPTER 01 · The Secret Letter from Qin",
    completed: "Chapter 1 Completed!",
    score: "Diplomatic decision score: ",
    outOf: "/ 3",
    result: "You practiced listening to Chinese, speaking, and making diplomatic decisions.",
    replay: "Play Again",
    listen: "🔊 Listen to Chinese",
    hidePinyin: "Hide Pinyin",
    showPinyin: "Show Pinyin",
    hideTranslation: "Hide Translation",
    showTranslation: "Show Translation",
    speaking: "🎙️ Speaking Practice",
    speakingDescription: "Listen to the Chinese example, then say the same sentence aloud.",
    listening: "🎙️ Listening…",
    startMic: "🎙️ Speak with Microphone",
    recognized: "Recognized speech:",
    recognitionNote: "The recognition result is not a pronunciation assessment. Compare it with the example.",
    question: "⚖️ ",
    correct: "Correct! You've understood the other person's intention well.",
    incorrect: "Your choice has been recorded. Review the meaning of the Chinese sentence once more.",
    noSpeech: "Text-to-speech is not available in this browser.",
    noRecognition: "Speech recognition is not available in this browser. Try a supported, up-to-date browser, or listen to the audio and practice speaking aloud.",
    recognitionError: "Your speech could not be recognized. Allow microphone access and try again.",
    micError: "The microphone could not be started. Wait a moment and try again.",
  },
  "zh-CN": {
    back: "← 返回标题",
    chapter: "CHAPTER 01 · 来自秦国的密信",
    completed: "第一章完成！",
    score: "外交判断得分：",
    outOf: "/ 3",
    result: "你练习了中文听力、口语以及外交判断。",
    replay: "再玩一次",
    listen: "🔊 听中文",
    hidePinyin: "隐藏拼音",
    showPinyin: "显示拼音",
    hideTranslation: "隐藏翻译",
    showTranslation: "显示翻译",
    speaking: "🎙️ 口语练习",
    speakingDescription: "听完中文示范后，请大声说出相同的句子。",
    listening: "🎙️ 正在识别…",
    startMic: "🎙️ 使用麦克风说话",
    recognized: "识别结果：",
    recognitionNote: "语音识别结果并不等于发音评分。请与示范语音进行比较。",
    question: "⚖️ ",
    correct: "回答正确！你很好地理解了对方的意图。",
    incorrect: "已记录你的选择。请再确认一次中文的意思。",
    noSpeech: "此浏览器不支持语音朗读。",
    noRecognition: "此浏览器不支持语音识别。请尝试使用最新版的兼容浏览器，或听完示范后大声练习。",
    recognitionError: "无法识别语音。请允许使用麦克风，然后重试。",
    micError: "无法启动麦克风。请稍等片刻后重试。",
  },
  "zh-TW": {
    back: "← 返回標題",
    chapter: "CHAPTER 01 · 來自秦國的密信",
    completed: "第一章完成！",
    score: "外交判斷得分：",
    outOf: "/ 3",
    result: "你練習了中文聽力、口說以及外交判斷。",
    replay: "再玩一次",
    listen: "🔊 聽中文",
    hidePinyin: "隱藏拼音",
    showPinyin: "顯示拼音",
    hideTranslation: "隱藏翻譯",
    showTranslation: "顯示翻譯",
    speaking: "🎙️ 口說練習",
    speakingDescription: "聽完中文示範後，請大聲說出相同的句子。",
    listening: "🎙️ 正在辨識…",
    startMic: "🎙️ 使用麥克風說話",
    recognized: "辨識結果：",
    recognitionNote: "語音辨識結果並不等於發音評分。請與示範語音進行比較。",
    question: "⚖️ ",
    correct: "回答正確！你很好地理解了對方的意圖。",
    incorrect: "已記錄你的選擇。請再確認一次中文的意思。",
    noSpeech: "此瀏覽器不支援語音朗讀。",
    noRecognition: "此瀏覽器不支援語音辨識。請嘗試使用最新版的相容瀏覽器，或聽完示範後大聲練習。",
    recognitionError: "無法辨識語音。請允許使用麥克風，然後重試。",
    micError: "無法啟動麥克風。請稍等片刻後重試。",
  },
  es: {
    back: "← Volver al título",
    chapter: "CHAPTER 01 · La carta secreta del Estado de Qin",
    completed: "¡Capítulo 1 completado!",
    score: "Puntuación de decisiones diplomáticas: ",
    outOf: "/ 3",
    result: "Has practicado la comprensión auditiva, la expresión oral en chino y la toma de decisiones diplomáticas.",
    replay: "Jugar otra vez",
    listen: "🔊 Escuchar chino",
    hidePinyin: "Ocultar pinyin",
    showPinyin: "Mostrar pinyin",
    hideTranslation: "Ocultar traducción",
    showTranslation: "Mostrar traducción",
    speaking: "🎙️ Práctica oral",
    speakingDescription: "Escucha el ejemplo en chino y luego repite la misma frase en voz alta.",
    listening: "🎙️ Escuchando…",
    startMic: "🎙️ Hablar con el micrófono",
    recognized: "Habla reconocida:",
    recognitionNote: "El resultado del reconocimiento no es una evaluación de pronunciación. Compáralo con el ejemplo.",
    question: "⚖️ ",
    correct: "¡Correcto! Has comprendido bien la intención de la otra persona.",
    incorrect: "Tu elección ha sido registrada. Vuelve a comprobar el significado del chino.",
    noSpeech: "Este navegador no admite la lectura en voz alta.",
    noRecognition: "Este navegador no admite el reconocimiento de voz. Prueba con un navegador compatible actualizado o escucha el audio y practica en voz alta.",
    recognitionError: "No se pudo reconocer tu voz. Permite el acceso al micrófono e inténtalo de nuevo.",
    micError: "No se pudo iniciar el micrófono. Espera un momento e inténtalo de nuevo.",
  },
};

export default function Chapter1Page() {
  const { language } = useLanguage();

  const currentLanguage: Language =
    language in uiTranslations ? (language as Language) : "ja";

  const t = uiTranslations[currentLanguage];

  const [sceneIndex, setSceneIndex] = useState(0);
  const [showPinyin, setShowPinyin] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [spokenText, setSpokenText] = useState("");
  const [listening, setListening] = useState(false);
  const [speechError, setSpeechError] = useState("");
  const [answering, setAnswering] = useState(false);

  const scene = scenes[sceneIndex];

  function speakChinese() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setFeedback(t.noSpeech);
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
      setSpeechError(t.noRecognition);
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
      setSpeechError(t.recognitionError);
      setListening(false);
    };

    recognition.onend = () => setListening(false);

    setListening(true);

    try {
      recognition.start();
    } catch {
      setListening(false);
      setSpeechError(t.micError);
    }
  }

  function chooseAnswer(next: number, answerScore: number) {
    if (answering) return;

    setAnswering(true);
    setScore((current) => current + answerScore);
    setFeedback(answerScore ? t.correct : t.incorrect);

    window.setTimeout(() => {
      setFeedback("");
      setAnswering(false);

      if (next >= scenes.length) {
        setFinished(true);
      } else {
        setSceneIndex(next);
        setSpokenText("");
        setSpeechError("");
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
          {t.back}
        </a>

        <p style={{ color: "#ffe39a", letterSpacing: 2, marginTop: 28 }}>
          {t.chapter}
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
            <h1>{t.completed}</h1>
            <p>
              {t.score}
              {score} {t.outOf}
            </p>
            <p>{t.result}</p>

            <button
              style={{ ...buttonStyle, textAlign: "center" }}
              onClick={() => {
                setSceneIndex(0);
                setScore(0);
                setFinished(false);
                setFeedback("");
                setSpokenText("");
                setSpeechError("");
                setShowPinyin(true);
                setShowTranslation(true);
              }}
            >
              {t.replay}
            </button>

            <a href="/story1" style={{ color: "#30483a" }}>
              {t.back}
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
                {scene.speaker[currentLanguage]}
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
                  {scene.translation[currentLanguage]}
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
                  {t.listen}
                </button>

                <button
                  onClick={() => setShowPinyin((value) => !value)}
                  style={{ ...buttonStyle, width: "auto" }}
                >
                  {showPinyin ? t.hidePinyin : t.showPinyin}
                </button>

                <button
                  onClick={() => setShowTranslation((value) => !value)}
                  style={{ ...buttonStyle, width: "auto" }}
                >
                  {showTranslation ? t.hideTranslation : t.showTranslation}
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
                  color: "#fff8e8",
                  fontWeight: 800,
                  lineHeight: 1.6,
                }}
              >
                {t.speaking}
              </h2>

              <p style={{ lineHeight: 1.9 }}>
                {t.speakingDescription}
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
                {listening ? t.listening : t.startMic}
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
                  <strong>{t.recognized}</strong>
                  <p>{spokenText}</p>
                  <p style={{ fontSize: 13, color: "#625744" }}>
                    {t.recognitionNote}
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
                  color: "#fff8e8",
                  fontWeight: 800,
                  lineHeight: 1.8,
                }}
              >
                {t.question}
                {scene.question[currentLanguage]}
              </h2>

              {scene.choices.map((choice, index) => (
                <button
                  key={`${sceneIndex}-${index}`}
                  disabled={answering}
                  onClick={() => chooseAnswer(choice.next, choice.score)}
                  style={{
                    ...buttonStyle,
                    opacity: answering ? 0.7 : 1,
                    cursor: answering ? "default" : "pointer",
                  }}
                >
                  {index + 1}. {choice.text[currentLanguage]}
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
