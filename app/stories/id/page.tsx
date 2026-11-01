
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { stories } from "@/lib/stories";
import { useAppLanguage } from "@/app/component/AppLanguage";

type Language = "ja" | "de" | "en" | "zh-CN" | "zh-TW" | "es";

type StoryText = {
  intro: string;
  question: string;
  choices: string[];
  answer: number;
  dialogue: string;
};

const translations: Record<
  Language,
  {
    back: string;
    story: string;
    listen: string;
    speakingTitle: string;
    speakingDescription: string;
    decision: string;
    confirm: string;
    correct: string;
    incorrect: string;
    notFound: string;
    listBack: string;
    previous: string;
    next: string;
    speechError: string;
    genericQuestion: string;
    genericChoices: string[];
    genericIntro: string;
    genericCorrect: string;
    genericIncorrect: string;
  }
> = {
  ja: {
    back: "← 物語一覧へ戻る",
    story: "物語",
    listen: "🔊 音声を再生",
    speakingTitle: "声に出して練習しよう",
    speakingDescription:
      "音声を聞いたら、同じ文を声に出して読んでみよう。読み上げを何度でも再生できるよ。",
    decision: "あなたの決断",
    confirm: "決断を確認する",
    correct: "正解！情報を確認してから判断するのが大切だね。",
    incorrect:
      "別の選択肢も考えてみよう。証拠を集めて判断することが重要だよ。",
    notFound: "物語が見つかりません",
    listBack: "物語一覧へ戻る",
    previous: "← 前の物語",
    next: "次の物語 →",
    speechError: "このブラウザでは音声読み上げを利用できません。",
    genericQuestion: "次に取るべき行動はどれ？",
    genericChoices: [
      "情報を集めて慎重に判断する",
      "確認せずに決める",
      "何もしない",
    ],
    genericIntro:
      "証言を集め、状況を整理し、あなた自身の判断で物語を進めよう。",
    genericCorrect: "情報を確認してから判断することが大切です。",
    genericIncorrect: "証拠を集め、状況を整理してから判断してみましょう。",
  },
  de: {
    back: "← Zurück zur Geschichtenliste",
    story: "Geschichte",
    listen: "🔊 Audio abspielen",
    speakingTitle: "Lautes Sprechen üben",
    speakingDescription:
      "Höre dir den Satz an und sprich ihn anschließend laut nach. Du kannst das Audio beliebig oft abspielen.",
    decision: "Deine Entscheidung",
    confirm: "Entscheidung bestätigen",
    correct:
      "Richtig! Es ist wichtig, zuerst Informationen zu prüfen und dann eine Entscheidung zu treffen.",
    incorrect:
      "Überlege dir auch die anderen Möglichkeiten. Es ist wichtig, Beweise zu sammeln, bevor du entscheidest.",
    notFound: "Geschichte nicht gefunden",
    listBack: "Zurück zur Geschichtenliste",
    previous: "← Vorherige Geschichte",
    next: "Nächste Geschichte →",
    speechError: "Die Sprachausgabe wird von diesem Browser nicht unterstützt.",
    genericQuestion: "Was solltest du als Nächstes tun?",
    genericChoices: [
      "Informationen sammeln und sorgfältig entscheiden",
      "Ohne Überprüfung entscheiden",
      "Nichts unternehmen",
    ],
    genericIntro:
      "Sammle Zeugenaussagen, ordne die Situation und führe die Geschichte mit deinen eigenen Entscheidungen fort.",
    genericCorrect: "Es ist wichtig, Informationen zu prüfen, bevor du entscheidest.",
    genericIncorrect:
      "Sammle Beweise und ordne die Situation, bevor du eine Entscheidung triffst.",
  },
  en: {
    back: "← Back to Stories",
    story: "Story",
    listen: "🔊 Play Audio",
    speakingTitle: "Practice Speaking Aloud",
    speakingDescription:
      "Listen to the audio, then read the same sentence aloud. You can replay it as many times as you like.",
    decision: "Your Decision",
    confirm: "Confirm Decision",
    correct:
      "Correct! It's important to check the information before making a decision.",
    incorrect:
      "Consider the other choices. Gathering evidence before making a decision is important.",
    notFound: "Story Not Found",
    listBack: "Back to Stories",
    previous: "← Previous Story",
    next: "Next Story →",
    speechError: "Text-to-speech is not available in this browser.",
    genericQuestion: "What should you do next?",
    genericChoices: [
      "Gather information and make a careful decision",
      "Make a decision without checking",
      "Do nothing",
    ],
    genericIntro:
      "Gather testimonies, organize the situation, and move the story forward with your own decisions.",
    genericCorrect: "It's important to check the information before making a decision.",
    genericIncorrect:
      "Gather evidence and organize the situation before making a decision.",
  },
  "zh-CN": {
    back: "← 返回故事列表",
    story: "故事",
    listen: "🔊 播放语音",
    speakingTitle: "开口练习",
    speakingDescription:
      "听完语音后，请大声读出相同的句子。你可以反复播放语音。",
    decision: "你的决定",
    confirm: "确认决定",
    correct: "回答正确！先确认信息再做判断非常重要。",
    incorrect: "试着考虑其他选项。收集证据后再做判断很重要。",
    notFound: "找不到这个故事",
    listBack: "返回故事列表",
    previous: "← 上一个故事",
    next: "下一个故事 →",
    speechError: "此浏览器不支持语音朗读。",
    genericQuestion: "接下来应该采取什么行动？",
    genericChoices: [
      "收集信息并谨慎判断",
      "不经确认就做决定",
      "什么也不做",
    ],
    genericIntro: "收集证词，整理情况，并通过自己的判断推动故事发展。",
    genericCorrect: "先确认信息再做判断非常重要。",
    genericIncorrect: "请先收集证据、整理情况，再做出判断。",
  },
  "zh-TW": {
    back: "← 返回故事列表",
    story: "故事",
    listen: "🔊 播放語音",
    speakingTitle: "開口練習",
    speakingDescription:
      "聽完語音後，請大聲讀出相同的句子。你可以反覆播放語音。",
    decision: "你的決定",
    confirm: "確認決定",
    correct: "回答正確！先確認資訊再做判斷非常重要。",
    incorrect: "試著考慮其他選項。收集證據後再做判斷很重要。",
    notFound: "找不到這個故事",
    listBack: "返回故事列表",
    previous: "← 上一個故事",
    next: "下一個故事 →",
    speechError: "此瀏覽器不支援語音朗讀。",
    genericQuestion: "接下來應該採取什麼行動？",
    genericChoices: [
      "收集資訊並謹慎判斷",
      "不經確認就做決定",
      "什麼也不做",
    ],
    genericIntro: "收集證詞、整理情況，並透過自己的判斷推動故事發展。",
    genericCorrect: "先確認資訊再做判斷非常重要。",
    genericIncorrect: "請先收集證據、整理情況，再做出判斷。",
  },
  es: {
    back: "← Volver a la lista de historias",
    story: "Historia",
    listen: "🔊 Reproducir audio",
    speakingTitle: "Practica hablando en voz alta",
    speakingDescription:
      "Escucha el audio y después lee la misma frase en voz alta. Puedes reproducirlo tantas veces como quieras.",
    decision: "Tu decisión",
    confirm: "Confirmar decisión",
    correct:
      "¡Correcto! Es importante comprobar la información antes de tomar una decisión.",
    incorrect:
      "Considera las otras opciones. Es importante reunir pruebas antes de decidir.",
    notFound: "No se ha encontrado la historia",
    listBack: "Volver a la lista de historias",
    previous: "← Historia anterior",
    next: "Historia siguiente →",
    speechError: "Este navegador no admite la lectura en voz alta.",
    genericQuestion: "¿Qué deberías hacer a continuación?",
    genericChoices: [
      "Reunir información y decidir con cuidado",
      "Decidir sin comprobar la información",
      "No hacer nada",
    ],
    genericIntro:
      "Reúne testimonios, organiza la situación y haz avanzar la historia con tus propias decisiones.",
    genericCorrect: "Es importante comprobar la información antes de decidir.",
    genericIncorrect:
      "Reúne pruebas y organiza la situación antes de tomar una decisión.",
  },
};

const storyTexts: Record<Language, Record<string, StoryText>> = {
  ja: {
    "1": {
      intro:
        "秦国から密書が届いた。隣国との同盟を結ぶべきか、あなたの判断が国の未来を左右する。",
      question: "密書を受け取った外交官として、最初に何をする？",
      choices: [
        "内容と条件を慎重に確認する",
        "すぐに返事を送る",
        "何も読まずに破棄する",
      ],
      answer: 0,
      dialogue: "若贵国愿与秦国结盟，我国愿意提供援助。",
    },
    "2": {
      intro:
        "無敵艦隊の航海中、嵐が近づいている。船員たちの報告を聞き、決断しよう。",
      question: "嵐が近づいたとき、まず何をする？",
      choices: [
        "船員の報告を集める",
        "警告を無視する",
        "航海日誌を捨てる",
      ],
      answer: 0,
      dialogue: "Debemos escuchar los informes de la tripulación.",
    },
    "3": {
      intro:
        "城に秘密の手紙が届いた。書記官として、その意味を読み解こう。",
      question: "手紙の内容が不明確なとき、どうする？",
      choices: [
        "証拠を集めて確認する",
        "根拠なく結論を出す",
        "手紙を隠す",
      ],
      answer: 0,
      dialogue: "Wir müssen die Nachricht sorgfältig prüfen.",
    },
  },
  de: {
    "1": {
      intro:
        "Ein geheimer Brief ist aus dem Staat Qin eingetroffen. Deine Entscheidung, ob du ein Bündnis mit dem Nachbarstaat eingehen sollst, wird die Zukunft deines Landes beeinflussen.",
      question:
        "Was solltest du als Diplomat nach Erhalt des geheimen Briefes zuerst tun?",
      choices: [
        "Den Inhalt und die Bedingungen sorgfältig prüfen",
        "Sofort eine Antwort senden",
        "Den Brief ungelesen vernichten",
      ],
      answer: 0,
      dialogue: "若贵国愿与秦国结盟，我国愿意提供援助。",
    },
    "2": {
      intro:
        "Während der Fahrt der Armada nähert sich ein Sturm. Höre dir die Berichte der Besatzung an und triff eine Entscheidung.",
      question: "Was solltest du zuerst tun, wenn sich ein Sturm nähert?",
      choices: [
        "Die Berichte der Besatzung sammeln",
        "Die Warnungen ignorieren",
        "Das Logbuch über Bord werfen",
      ],
      answer: 0,
      dialogue: "Debemos escuchar los informes de la tripulación.",
    },
    "3": {
      intro:
        "Im Schloss ist ein geheimer Brief eingetroffen. Entschlüssle als Schreiber seine Bedeutung.",
      question: "Was solltest du tun, wenn der Inhalt des Briefes unklar ist?",
      choices: [
        "Beweise sammeln und den Inhalt überprüfen",
        "Ohne Begründung eine Schlussfolgerung ziehen",
        "Den Brief verstecken",
      ],
      answer: 0,
      dialogue: "Wir müssen die Nachricht sorgfältig prüfen.",
    },
  },
  en: {
    "1": {
      intro:
        "A secret letter has arrived from the State of Qin. Your decision about whether to form an alliance with the neighboring state will shape the future of your country.",
      question:
        "As a diplomat who has received the secret letter, what should you do first?",
      choices: [
        "Carefully examine its contents and conditions",
        "Send a reply immediately",
        "Destroy it without reading it",
      ],
      answer: 0,
      dialogue: "若贵国愿与秦国结盟，我国愿意提供援助。",
    },
    "2": {
      intro:
        "A storm is approaching as the Spanish Armada sails. Listen to the crew's reports and make a decision.",
      question: "What should you do first when a storm approaches?",
      choices: [
        "Gather reports from the crew",
        "Ignore the warnings",
        "Throw away the navigation log",
      ],
      answer: 0,
      dialogue: "Debemos escuchar los informes de la tripulación.",
    },
    "3": {
      intro:
        "A secret letter has arrived at the castle. As a clerk, try to uncover its meaning.",
      question: "What should you do when the contents of the letter are unclear?",
      choices: [
        "Gather evidence and verify the information",
        "Draw a conclusion without evidence",
        "Hide the letter",
      ],
      answer: 0,
      dialogue: "Wir müssen die Nachricht sorgfältig prüfen.",
    },
  },
  "zh-CN": {
    "1": {
      intro:
        "秦国送来了一封密信。是否与邻国结盟，将由你的判断决定，这也关系到国家的未来。",
      question: "作为收到密信的外交官，你首先应该做什么？",
      choices: [
        "仔细确认信件内容和结盟条件",
        "立即回复",
        "不看内容就销毁信件",
      ],
      answer: 0,
      dialogue: "若贵国愿与秦国结盟，我国愿意提供援助。",
    },
    "2": {
      intro:
        "无敌舰队正在航行，暴风雨即将来临。听取船员的报告，然后做出决定。",
      question: "暴风雨即将来临时，你首先应该做什么？",
      choices: [
        "收集船员的报告",
        "无视警告",
        "丢弃航海日志",
      ],
      answer: 0,
      dialogue: "Debemos escuchar los informes de la tripulación.",
    },
    "3": {
      intro:
        "城堡收到了一封秘密信件。作为书记官，你需要解读信件的含义。",
      question: "当信件的内容不明确时，你应该怎么做？",
      choices: [
        "收集证据并确认内容",
        "毫无根据地得出结论",
        "把信件藏起来",
      ],
      answer: 0,
      dialogue: "Wir müssen die Nachricht sorgfältig prüfen.",
    },
  },
  "zh-TW": {
    "1": {
      intro:
        "秦國送來了一封密信。是否與鄰國結盟，將由你的判斷決定，這也關係到國家的未來。",
      question: "身為收到密信的外交官，你首先應該做什麼？",
      choices: [
        "仔細確認信件內容和結盟條件",
        "立即回覆",
        "不看內容就銷毀信件",
      ],
      answer: 0,
      dialogue: "若贵国愿与秦国结盟，我国愿意提供援助。",
    },
    "2": {
      intro:
        "無敵艦隊正在航行，暴風雨即將來臨。聽取船員的報告，然後做出決定。",
      question: "暴風雨即將來臨時，你首先應該做什麼？",
      choices: [
        "收集船員的報告",
        "無視警告",
        "丟棄航海日誌",
      ],
      answer: 0,
      dialogue: "Debemos escuchar los informes de la tripulación.",
    },
    "3": {
      intro:
        "城堡收到了一封秘密信件。身為書記官，你需要解讀信件的含義。",
      question: "當信件的內容不明確時，你應該怎麼做？",
      choices: [
        "收集證據並確認內容",
        "毫無根據地得出結論",
        "把信件藏起來",
      ],
      answer: 0,
      dialogue: "Wir müssen die Nachricht sorgfältig prüfen.",
    },
  },
  es: {
    "1": {
      intro:
        "Ha llegado una carta secreta del Estado de Qin. Tu decisión sobre si debes formar una alianza con el país vecino determinará el futuro de tu nación.",
      question:
        "Como diplomático que ha recibido la carta secreta, ¿qué debes hacer primero?",
      choices: [
        "Examinar cuidadosamente el contenido y las condiciones",
        "Enviar una respuesta inmediatamente",
        "Destruirla sin leerla",
      ],
      answer: 0,
      dialogue: "若贵国愿与秦国结盟，我国愿意提供援助。",
    },
    "2": {
      intro:
        "Una tormenta se acerca mientras navega la Armada Invencible. Escucha los informes de la tripulación y toma una decisión.",
      question: "¿Qué debes hacer primero cuando se acerca una tormenta?",
      choices: [
        "Recopilar los informes de la tripulación",
        "Ignorar las advertencias",
        "Tirar el diario de navegación",
      ],
      answer: 0,
      dialogue: "Debemos escuchar los informes de la tripulación.",
    },
    "3": {
      intro:
        "Ha llegado una carta secreta al castillo. Como escribano, intenta descifrar su significado.",
      question: "¿Qué debes hacer si el contenido de la carta no está claro?",
      choices: [
        "Reunir pruebas y comprobar la información",
        "Sacar una conclusión sin fundamento",
        "Esconder la carta",
      ],
      answer: 0,
      dialogue: "Wir müssen die Nachricht sorgfältig prüfen.",
    },
  },
};

export default function StoryDetailPage() {
  const params = useParams();
  const id = String(params.id);

  const { language } = useAppLanguage();

  const currentLanguage: Language =
    language in translations ? (language as Language) : "ja";

  const t = translations[currentLanguage];

  const story = stories.find((item) => item.id === Number(id));

  const chapter = storyTexts[currentLanguage][id];

  const [selected, setSelected] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  if (!story) {
    return (
      <main
        style={{
          minHeight: "100vh",
          padding: 32,
          background: "#101827",
          color: "#f8fafc",
        }}
      >
        <h1>{t.notFound}</h1>
        <Link href="/stories" style={{ color: "#93c5fd" }}>
          {t.listBack}
        </Link>
      </main>
    );
  }

  const intro =
    chapter?.intro ??
    `${story.description} ${t.genericIntro}`;

  const question =
    chapter?.question ?? t.genericQuestion;

  const choices =
    chapter?.choices ?? t.genericChoices;

  const answer = chapter?.answer ?? 0;

  const dialogue =
    chapter?.dialogue ??
    "Wir müssen die Wahrheit herausfinden.";

  function speak(text: string, storyLanguage: string) {
    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window)
    ) {
      window.alert(t.speechError);
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    const normalizedLanguage = storyLanguage.toLowerCase();

    if (normalizedLanguage.startsWith("zh")) {
      utterance.lang = "zh-CN";
    } else if (normalizedLanguage.startsWith("es")) {
      utterance.lang = "es-ES";
    } else if (normalizedLanguage.startsWith("de")) {
      utterance.lang = "de-DE";
    } else if (normalizedLanguage.startsWith("it")) {
      utterance.lang = "it-IT";
    } else if (normalizedLanguage.startsWith("ja")) {
      utterance.lang = "ja-JP";
    } else {
      utterance.lang = "en-US";
    }

    window.speechSynthesis.speak(utterance);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "28px 20px",
        background: "#101827",
        color: "#f8fafc",
      }}
    >
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <Link
          href="/stories"
          style={{ color: "#93c5fd", textDecoration: "none" }}
        >
          {t.back}
        </Link>

        <p style={{ color: "#93c5fd", marginTop: 28 }}>
          STORY {String(story.id).padStart(2, "0")} · {story.era}
        </p>

        <h1 style={{ fontSize: 30 }}>{story.title}</h1>

        <section
          style={{
            marginTop: 24,
            padding: 22,
            borderRadius: 16,
            background: "#1e293b",
            border: "1px solid #334155",
          }}
        >
          <h2>{t.story}</h2>
          <p style={{ lineHeight: 1.9 }}>{intro}</p>
        </section>

        <section
          style={{
            marginTop: 18,
            padding: 22,
            borderRadius: 16,
            background: "#1e293b",
            border: "1px solid #334155",
          }}
        >
          <h2>{t.listen}</h2>

          <p style={{ lineHeight: 1.8 }}>{dialogue}</p>

          <button
            onClick={() => speak(dialogue, story.language)}
            style={{
              padding: "12px 18px",
              borderRadius: 10,
              border: 0,
              background: "#2563eb",
              color: "white",
              cursor: "pointer",
            }}
          >
            {t.listen}
          </button>

          <h3 style={{ marginTop: 24 }}>{t.speakingTitle}</h3>

          <p style={{ color: "#cbd5e1", lineHeight: 1.8 }}>
            {t.speakingDescription}
          </p>
        </section>

        <section
          style={{
            marginTop: 18,
            padding: 22,
            borderRadius: 16,
            background: "#1e293b",
            border: "1px solid #334155",
          }}
        >
          <h2>{t.decision}</h2>
          <p>{question}</p>

          <div style={{ display: "grid", gap: 10 }}>
            {choices.map((choice, index) => (
              <button
                key={`${id}-${index}`}
                onClick={() => {
                  setSelected(index);
                  setShowAnswer(false);
                }}
                style={{
                  padding: 14,
                  textAlign: "left",
                  borderRadius: 10,
                  border:
                    selected === index
                      ? "2px solid #60a5fa"
                      : "1px solid #475569",
                  background:
                    selected === index ? "#1d4ed8" : "#0f172a",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                {index + 1}. {choice}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowAnswer(true)}
            disabled={selected === null}
            style={{
              marginTop: 16,
              padding: "12px 18px",
              borderRadius: 10,
              border: 0,
              background: selected === null ? "#475569" : "#16a34a",
              color: "white",
              cursor: selected === null ? "not-allowed" : "pointer",
            }}
          >
            {t.confirm}
          </button>

          {showAnswer && selected !== null && (
            <p
              style={{
                marginTop: 16,
                lineHeight: 1.8,
                color: selected === answer ? "#86efac" : "#fcd34d",
              }}
            >
              {selected === answer
                ? chapter
                  ? t.correct
                  : t.genericCorrect
                : chapter
                  ? t.incorrect
                  : t.genericIncorrect}
            </p>
          )}
        </section>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            marginTop: 24,
          }}
        >
          {story.id > 1 ? (
            <Link
              href={`/stories/${story.id - 1}`}
              style={{ color: "#93c5fd" }}
            >
              {t.previous}
            </Link>
          ) : (
            <span />
          )}

          {story.id < 50 && (
            <Link
              href={`/stories/${story.id + 1}`}
              style={{ color: "#93c5fd" }}
            >
              {t.next}
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
