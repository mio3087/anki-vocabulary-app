
"use client";

import { useEffect, useState } from "react";

type Lang = "ja" | "es" | "de" | "zh" | "en" | "it";

const languages: { value: Lang; label: string }[] = [
  { value: "ja", label: "🇯🇵 日本語" },
  { value: "es", label: "🇪🇸 Español" },
  { value: "de", label: "🇩🇪 Deutsch" },
  { value: "zh", label: "🇨🇳 中文" },
  { value: "en", label: "🇬🇧 English" },
  { value: "it", label: "🇮🇹 Italiano" },
];

const chapters = [
  ["出航前夜", "La noche antes de zarpar"],
  ["消えた航海日誌", "El diario desaparecido"],
  ["謎の密書", "La carta misteriosa"],
  ["艦長の命令", "La orden del capitán"],
  ["疑わしい船員", "El marinero sospechoso"],
  ["酒場の証言", "El testimonio de la taberna"],
  ["封印された箱", "La caja sellada"],
  ["暗号の手がかり", "La pista cifrada"],
  ["失われた鍵", "La llave perdida"],
  ["最初の告白", "La primera confesión"],
  ["大西洋への出発", "La salida al Atlántico"],
  ["荒れる海", "El mar embravecido"],
  ["水の不足", "La escasez de agua"],
  ["船員たちの口論", "La disputa de los marineros"],
  ["夜の見張り", "La guardia nocturna"],
  ["水平線の帆影", "Velas en el horizonte"],
  ["謎の信号", "La señal misteriosa"],
  ["壊れた羅針盤", "La brújula rota"],
  ["航路の変更", "El cambio de rumbo"],
  ["海図の秘密", "El secreto del mapa"],
  ["敵影を発見", "El enemigo a la vista"],
  ["作戦会議", "El consejo de guerra"],
  ["伝令の到着", "La llegada del mensajero"],
  ["二つの作戦", "Dos estrategias"],
  ["偽りの情報", "La información falsa"],
  ["捕虜の証言", "El testimonio del prisionero"],
  ["夜襲のうわさ", "Rumores de un ataque nocturno"],
  ["仲間の裏切り", "La traición de un compañero"],
  ["秘密の合図", "La señal secreta"],
  ["海峡へ", "Rumbo al canal"],
  ["迫る嵐", "Se acerca la tormenta"],
  ["破損した帆", "La vela dañada"],
  ["救助か前進か", "¿Rescatar o avanzar?"],
  ["船長の決断", "La decisión del capitán"],
  ["暗闇の航海", "Navegar en la oscuridad"],
  ["孤立した船", "El barco aislado"],
  ["最後の食料", "Las últimas provisiones"],
  ["届かない手紙", "La carta que no llegó"],
  ["仲間との約束", "La promesa entre compañeros"],
  ["嵐の終わり", "El fin de la tormenta"],
  ["残された記録", "Los registros restantes"],
  ["航海日誌の断片", "Un fragmento del diario"],
  ["密書の筆跡", "La letra de la carta"],
  ["艦長の秘密", "El secreto del capitán"],
  ["真犯人の手がかり", "La pista del culpable"],
  ["最後の証言", "El último testimonio"],
  ["真相への道", "El camino hacia la verdad"],
  ["日誌の復元", "La reconstrucción del diario"],
  ["運命の選択", "La elección decisiva"],
  ["海に消えた航海日誌", "El diario perdido en el mar"],
] as const;

const ui: Record<Lang, Record<string, string>> = {
  ja: {
    back: "タイトルへ戻る",
    start: "この章を始める",
    mission: "任務",
    listen: "物語を聞く",
    speak: "スペイン語で声に出そう",
    writing: "航海日誌を書く",
    placeholder: "スペイン語で考えを書いてみよう……",
    submit: "記録を確認する",
    next: "次の章へ",
    previous: "前の章へ",
    choose: "どう行動する？",
    evidence: "手がかり",
    progress: "章の進行",
    done: "記録を受け付けたよ。自分の文章を読み返してみよう。",
    ending: "第50章まで到達した！航海の物語はひとまず完結だ。",
    hint: "例文",
    option1: "船員に詳しく話を聞く",
    option2: "航海日誌と海図を調べる",
    option3: "艦長に直接報告する",
  },
  es: {
    back: "Volver al título",
    start: "Comenzar este capítulo",
    mission: "Misión",
    listen: "Escuchar la historia",
    speak: "Habla en español",
    writing: "Escribir el diario",
    placeholder: "Escribe tus ideas en español...",
    submit: "Revisar el diario",
    next: "Siguiente capítulo",
    previous: "Capítulo anterior",
    choose: "¿Qué vas a hacer?",
    evidence: "Pista",
    progress: "Progreso",
    done: "Registro recibido. Lee tu texto una vez más.",
    ending: "¡Has llegado al capítulo 50! La travesía concluye por ahora.",
    hint: "Frase modelo",
    option1: "Preguntar al marinero",
    option2: "Examinar el diario y el mapa",
    option3: "Informar directamente al capitán",
  },
  de: {
    back: "Zurück zum Titel",
    start: "Kapitel beginnen",
    mission: "Auftrag",
    listen: "Geschichte anhören",
    speak: "Auf Spanisch sprechen",
    writing: "Das Logbuch schreiben",
    placeholder: "Schreibe deine Gedanken auf Spanisch...",
    submit: "Logbuch überprüfen",
    next: "Nächstes Kapitel",
    previous: "Vorheriges Kapitel",
    choose: "Wie handelst du?",
    evidence: "Hinweis",
    progress: "Fortschritt",
    done: "Eintrag erfasst. Lies deinen Text noch einmal.",
    ending: "Du hast Kapitel 50 erreicht. Die Reise endet vorerst.",
    hint: "Beispielsatz",
    option1: "Den Matrosen befragen",
    option2: "Logbuch und Karte untersuchen",
    option3: "Den Kapitän direkt informieren",
  },
  zh: {
    back: "返回标题",
    start: "开始本章",
    mission: "任务",
    listen: "听故事",
    speak: "用西班牙语朗读",
    writing: "写航海日志",
    placeholder: "试着用西班牙语写下你的想法……",
    submit: "检查日志",
    next: "下一章",
    previous: "上一章",
    choose: "你会怎么做？",
    evidence: "线索",
    progress: "章节进度",
    done: "记录已提交。请再读一遍自己的文章。",
    ending: "你已到达第50章！本次航行暂告一段落。",
    hint: "例句",
    option1: "详细询问船员",
    option2: "调查航海日志和海图",
    option3: "直接向船长报告",
  },
  en: {
    back: "Back to title",
    start: "Start this chapter",
    mission: "Mission",
    listen: "Listen to the story",
    speak: "Speak in Spanish",
    writing: "Write your logbook",
    placeholder: "Write your thoughts in Spanish...",
    submit: "Review logbook",
    next: "Next chapter",
    previous: "Previous chapter",
    choose: "What will you do?",
    evidence: "Clue",
    progress: "Chapter progress",
    done: "Entry received. Read your writing once more.",
    ending: "You reached Chapter 50! The voyage concludes for now.",
    hint: "Model sentence",
    option1: "Question the sailor",
    option2: "Examine the logbook and map",
    option3: "Report directly to the captain",
  },
  it: {
    back: "Torna al titolo",
    start: "Inizia il capitolo",
    mission: "Missione",
    listen: "Ascolta la storia",
    speak: "Parla in spagnolo",
    writing: "Scrivi il diario di bordo",
    placeholder: "Scrivi le tue idee in spagnolo...",
    submit: "Controlla il diario",
    next: "Capitolo successivo",
    previous: "Capitolo precedente",
    choose: "Come agirai?",
    evidence: "Indizio",
    progress: "Avanzamento",
    done: "Testo ricevuto. Rileggi ciò che hai scritto.",
    ending: "Hai raggiunto il capitolo 50! Il viaggio termina per ora.",
    hint: "Frase modello",
    option1: "Interrogare il marinaio",
    option2: "Esaminare il diario e la mappa",
    option3: "Informare direttamente il capitano",
  },
};

const story: Record<Lang, (title: string, chapter: number) => string> = {
  ja: (title, n) =>
    `第${n}章「${title}」。艦内で新たな手がかりが見つかった。船員たちの証言は一致せず、誰かが重要な事実を隠しているようだ。あなたは限られた時間の中で情報を集め、仲間を危険から守らなければならない。`,
  es: (title, n) =>
    `Capítulo ${n}: «${title}». A bordo aparece una nueva pista. Los testimonios de los marineros no coinciden y parece que alguien oculta información importante. Debes reunir pruebas y proteger a tus compañeros antes de que sea demasiado tarde.`,
  de: (title, n) =>
    `Kapitel ${n}: „${title}“. An Bord taucht eine neue Spur auf. Die Aussagen der Matrosen widersprechen sich. Jemand scheint wichtige Informationen zu verbergen. Du musst Beweise sammeln und deine Kameraden schützen.`,
  zh: (title, n) =>
    `第${n}章：${title}。船上出现了新的线索。水手们的证词互相矛盾，似乎有人隐瞒了重要信息。你必须及时收集证据，保护同伴。`,
  en: (title, n) =>
    `Chapter ${n}: "${title}". A new clue appears aboard the ship. The sailors' accounts contradict each other, and someone seems to be hiding important information. You must gather evidence and protect your companions in time.`,
  it: (title, n) =>
    `Capitolo ${n}: «${title}». A bordo appare un nuovo indizio. Le testimonianze dei marinai sono contraddittorie e qualcuno sembra nascondere informazioni importanti. Devi raccogliere prove e proteggere i tuoi compagni.`,
};

const buttonStyle: React.CSSProperties = {
  padding: "12px 16px",
  border: "1px solid #d8ad70",
  borderRadius: "9px",
  background: "#203d50",
  color: "#fff7e8",
  fontSize: "15px",
  cursor: "pointer",
};

export default function ArmadaChapter1Page() {
  const [lang, setLang] = useState<Lang>("ja");
  const [chapter, setChapter] = useState(0);
  const [started, setStarted] = useState(false);
  const [choice, setChoice] = useState<number | null>(null);
  const [diary, setDiary] = useState("");
  const [feedback, setFeedback] = useState("");
  const [clues, setClues] = useState(0);

  const t = ui[lang];
  const [titleJa, titleEs] = chapters[chapter];
  const title =
    lang === "ja" ? titleJa :
    lang === "es" ? titleEs :
    lang === "de" ? `Kapitel ${chapter + 1}` :
    lang === "zh" ? `第${chapter + 1}章` :
    lang === "en" ? `Chapter ${chapter + 1}` :
    `Capitolo ${chapter + 1}`;

  const phrase = "Debemos descubrir la verdad antes de zarpar.";

  function readAloud(text: string) {
    if (!("speechSynthesis" in window)) {
      setFeedback("このブラウザでは音声読み上げを利用できません。");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-ES";
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  }

  function selectChoice(index: number) {
    setChoice(index);
    setClues((old) => old + (index === 1 ? 1 : 0));
    setFeedback("");
  }

  function moveChapter(next: number) {
    setChapter(next);
    setChoice(null);
    setDiary("");
    setFeedback("");
    setStarted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #101d2d, #203d50 60%, #72533d)",
        color: "#fff7e8",
        padding: "24px 16px 48px",
        fontFamily: "Georgia, serif",
      }}
    >
      <div style={{ maxWidth: 780, margin: "0 auto" }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 24,
          }}
        >
          <a href="/armada" style={{ color: "#f0d6ae" }}>
            ← {t.back}
          </a>
          <select
            aria-label="Language"
            value={lang}
            onChange={(e) => setLang(e.target.value as Lang)}
            style={{
              padding: 10,
              borderRadius: 8,
              background: "#fff7e8",
              color: "#182431",
            }}
          >
            {languages.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </header>

        <section
          style={{
            padding: "28px 22px",
            border: "1px solid rgba(255,230,190,.4)",
            borderRadius: 18,
            background: "rgba(10,20,32,.42)",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 44 }}>⚓</div>
            <p style={{ color: "#e8c58f", letterSpacing: 3, fontSize: 12 }}>
              THE SPANISH ARMADA · 1588
            </p>
            <p style={{ color: "#f0d6ae" }}>
              {chapter + 1} / {chapters.length}
            </p>
            <div
              style={{
                height: 6,
                background: "#42515b",
                borderRadius: 6,
                overflow: "hidden",
                margin: "12px 0 24px",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${((chapter + 1) / chapters.length) * 100}%`,
                  background: "#d8ad70",
                }}
              />
            </div>
            <h1 style={{ fontSize: "clamp(28px, 6vw, 42px)", lineHeight: 1.4 }}>
              {title}
            </h1>
            {!started && (
              <>
                <p style={{ lineHeight: 1.9 }}>
                  {lang === "ja"
                    ? "無敵艦隊の船に乗り込み、密書の謎を追え。あなたの選択が航海の記録を変えていく。"
                    : lang === "es"
                    ? "Sube a bordo de la Armada y descubre el misterio de la carta. Tus decisiones cambiarán el rumbo de la historia."
                    : story[lang](title, chapter + 1)}
                </p>
                <button style={buttonStyle} onClick={() => setStarted(true)}>
                  {t.start} ➜
                </button>
              </>
            )}
          </div>

          {started && (
            <>
              <h2 style={{ color: "#e8c58f", marginTop: 28 }}>
                📜 {t.mission}
              </h2>
              <p style={{ lineHeight: 2 }}>
                {story[lang](title, chapter + 1)}
              </p>

              <section style={panelStyle}>
                <h3>🎧 {t.listen}</h3>
                <p style={{ lineHeight: 1.8 }}>{phrase}</p>
                <button style={buttonStyle} onClick={() => readAloud(phrase)}>
                  ▶ {t.listen}
                </button>
              </section>

              <section style={panelStyle}>
                <h3>🎙️ {t.speak}</h3>
                <p>{t.hint}: {phrase}</p>
                <button style={buttonStyle} onClick={() => readAloud(phrase)}>
                  🔊 {phrase}
                </button>
                <p style={{ fontSize: 13, lineHeight: 1.8, color: "#e2d5c3" }}>
                  {lang === "ja"
                    ? "音声を聞いてから、自分でも声に出して読もう。"
                    : "Escucha la frase y repítela en voz alta."}
                </p>
              </section>

              <section style={panelStyle}>
                <h3>🕵️ {t.choose}</h3>
                {[t.option1, t.option2, t.option3].map((option, index) => (
                  <button
                    key={option}
                    onClick={() => selectChoice(index)}
                    style={{
                      ...buttonStyle,
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      marginTop: 10,
                      background: choice === index ? "#8b6948" : "#203d50",
                    }}
                  >
                    {choice === index ? "✓ " : `${index + 1}. `}
                    {option}
                  </button>
                ))}
                {choice !== null && (
                  <p role="status" style={{ lineHeight: 1.9, color: "#f0d6ae" }}>
                    {lang === "ja"
                      ? choice === 1
                        ? "海図と日誌から手がかりを発見！証拠を集めた。"
                        : "行動を開始した。別の方法も試して手がかりを集めよう。"
                      : choice === 1
                      ? "Has encontrado una pista en el mapa y el diario."
                      : "Has comenzado la investigación. Busca más pistas."}
                  </p>
                )}
                <p style={{ color: "#e8c58f" }}>
                  {t.evidence}: {clues}
                </p>
              </section>

              <section style={panelStyle}>
                <h3>✍️ {t.writing}</h3>
                <p style={{ lineHeight: 1.8 }}>
                  {lang === "ja"
                    ? "今日の調査結果や、次に何をすべきかをスペイン語で記録しよう。"
                    : "Describe en español tus descubrimientos y tu próximo paso."}
                </p>
                <textarea
                  value={diary}
                  onChange={(e) => setDiary(e.target.value)}
                  placeholder={t.placeholder}
                  rows={5}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: 12,
                    borderRadius: 8,
                    fontSize: 16,
                    lineHeight: 1.7,
                    background: "#fffaf0",
                    color: "#182431",
                  }}
                />
                <button
                  style={buttonStyle}
                  onClick={() => setFeedback(t.done)}
                >
                  {t.submit}
                </button>
                {feedback && (
                  <p role="status" style={{ color: "#f0d6ae", lineHeight: 1.8 }}>
                    {feedback}
                  </p>
                )}
              </section>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}>
                <button
                  style={buttonStyle}
                  disabled={chapter === 0}
                  onClick={() => moveChapter(chapter - 1)}
                >
                  ← {t.previous}
                </button>
                {chapter < chapters.length - 1 ? (
                  <button
                    style={{ ...buttonStyle, background: "#d8ad70", color: "#182431" }}
                    onClick={() => moveChapter(chapter + 1)}
                  >
                    {t.next} ➜
                  </button>
                ) : (
                  <p style={{ color: "#f0d6ae", lineHeight: 1.8 }}>
                    {t.ending}
                  </p>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

const panelStyle: React.CSSProperties = {
  marginTop: 20,
  padding: 18,
  borderRadius: 12,
  background: "rgba(255,255,255,.08)",
};
