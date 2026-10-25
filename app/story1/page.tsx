

"use client";

import { useState } from "react";

type Language = "ja" | "zh-CN" | "zh-TW" | "en" | "de" | "es" | "it";
type Screen = "title" | "intro" | "guide";






const translations: Record<Language, Record<string, string>> = {
  ja: {
    language: "表示言語",
    eyebrow: "STORY 01 · 中国戦国時代",
    title: "戦国策",
    subtitle: "― 天下への道 ―",
    tagline: "言葉を武器に、乱世を生き抜け。",
    description: "中国語を学びながら、外交官として歴史を動かそう。",
    start: "物語を始める",
    guide: "ゲームの遊び方",
    back: "← デッキ一覧に戻る",
    chapter: "第1章",
    chapterTitle: "秦国からの密書",
    intro: "あなたは小国に仕える若き外交官。ある朝、強国・秦から一通の密書が届いた。その文面には、同盟の申し出が記されていた。",
    letter: "若贵国愿与秦国结盟，我国愿意提供援助。",
    question: "この手紙は何を意味しているでしょう？",
    placeholder: "次の開発段階で、選択肢と正誤判定を追加します。",
    titleBack: "タイトルに戻る",
    guideTitle: "ゲームの遊び方",
    guide1: "物語を読み、中国語の会話や手紙に触れよう。",
    guide2: "登場人物の発言から、相手の意図や本音を考えよう。",
    guide3: "外交方針を選び、あなたの判断で物語を進めよう。",
    guide4: "表示言語はいつでも変更できます。",
  },
  "zh-CN": {
    language: "显示语言",
    eyebrow: "故事 01 · 中国战国时代",
    title: "战国策",
    subtitle: "― 通往天下之路 ―",
    tagline: "以言语为武器，在乱世中生存。",
    description: "学习中文，成为改变历史的外交官。",
    start: "开始故事",
    guide: "游戏玩法",
    back: "← 返回卡组列表",
    chapter: "第一章",
    chapterTitle: "来自秦国的密信",
    intro: "你是一名侍奉小国的年轻外交官。一天清晨，你收到了一封来自强国秦国的密信。信中提出了结盟的请求。",
    letter: "若贵国愿与秦国结盟，我国愿意提供援助。",
    question: "这封信表达了什么意思？",
    placeholder: "后续版本将加入选项和答案判断。",
    titleBack: "返回标题",
    guideTitle: "游戏玩法",
    guide1: "阅读故事，学习中文对话和书信。",
    guide2: "根据人物的发言，推测对方的意图。",
    guide3: "选择外交策略，用你的决定推动故事发展。",
    guide4: "随时可以更改显示语言。",
  },
  "zh-TW": {
    language: "顯示語言",
    eyebrow: "故事 01 · 中國戰國時代",
    title: "戰國策",
    subtitle: "― 通往天下之路 ―",
    tagline: "以言語為武器，在亂世中生存。",
    description: "學習中文，成為改變歷史的外交官。",
    start: "開始故事",
    guide: "遊戲玩法",
    back: "← 返回牌組列表",
    chapter: "第一章",
    chapterTitle: "來自秦國的密信",
    intro: "你是一名侍奉小國的年輕外交官。一天清晨，你收到了一封來自強國秦國的密信。信中提出了結盟的請求。",
    letter: "若贵国愿与秦国结盟，我国愿意提供援助。",
    question: "這封信表達了什麼意思？",
    placeholder: "後續版本將加入選項和答案判定。",
    titleBack: "返回標題",
    guideTitle: "遊戲玩法",
    guide1: "閱讀故事，學習中文對話與書信。",
    guide2: "根據人物的發言，推測對方的意圖。",
    guide3: "選擇外交策略，用你的決定推動故事發展。",
    guide4: "隨時可以更改顯示語言。",
  },
  en: {
    language: "Display language",
    eyebrow: "STORY 01 · WARRING STATES CHINA",
    title: "Strategies of the Warring States",
    subtitle: "― The Road to Unification ―",
    tagline: "Survive a turbulent age with words as your weapon.",
    description: "Learn Chinese and change history as a diplomat.",
    start: "Begin the Story",
    guide: "How to Play",
    back: "← Back to Decks",
    chapter: "CHAPTER 01",
    chapterTitle: "A Secret Letter from Qin",
    intro: "You are a young diplomat serving a small state. One morning, a secret letter arrives from the powerful state of Qin, proposing an alliance.",
    letter: "若贵国愿与秦国结盟，我国愿意提供援助。",
    question: "What is Qin proposing in this letter?",
    placeholder: "Choices and answer checking will be added in a future update.",
    titleBack: "Back to Title",
    guideTitle: "How to Play",
    guide1: "Read the story and explore Chinese dialogue and letters.",
    guide2: "Infer each character's intentions from what they say.",
    guide3: "Choose diplomatic strategies to shape the story.",
    guide4: "You can change the display language at any time.",
  },
  de: {
    language: "Anzeigesprache",
    eyebrow: "STORY 01 · CHINA IN DER ZEIT DER STREITENDEN REICHE",
    title: "Die Strategien der Streitenden Reiche",
    subtitle: "― Der Weg zur Einheit ―",
    tagline: "Überlebe eine turbulente Zeit mit Worten als Waffe.",
    description: "Lerne Chinesisch und verändere als Diplomat die Geschichte.",
    start: "Geschichte beginnen",
    guide: "Spielanleitung",
    back: "← Zurück zu den Decks",
    chapter: "KAPITEL 01",
    chapterTitle: "Ein geheimer Brief aus Qin",
    intro: "Du bist ein junger Diplomat im Dienst eines kleinen Staates. Eines Morgens erhältst du einen geheimen Brief aus dem mächtigen Staat Qin, in dem ein Bündnis vorgeschlagen wird.",
    letter: "若贵国愿与秦国结盟，我国愿意提供援助。",
    question: "Was schlägt Qin in diesem Brief vor?",
    placeholder: "Antwortmöglichkeiten und Auswertung folgen in einem späteren Update.",
    titleBack: "Zurück zum Titel",
    guideTitle: "Spielanleitung",
    guide1: "Lies die Geschichte und entdecke chinesische Dialoge und Briefe.",
    guide2: "Deute die Absichten der Figuren anhand ihrer Aussagen.",
    guide3: "Wähle diplomatische Strategien und beeinflusse den Verlauf der Geschichte.",
    guide4: "Du kannst die Anzeigesprache jederzeit ändern.",
  },
  es: {
    language: "Idioma de visualización",
    eyebrow: "HISTORIA 01 · CHINA EN LOS REINOS COMBATIENTES",
    title: "Las estrategias de los Reinos Combatientes",
    subtitle: "― El camino hacia la unificación ―",
    tagline: "Sobrevive a una época turbulenta usando las palabras como arma.",
    description: "Aprende chino y cambia la historia como diplomático.",
    start: "Comenzar la historia",
    guide: "Cómo jugar",
    back: "← Volver a los mazos",
    chapter: "CAPÍTULO 01",
    chapterTitle: "Una carta secreta de Qin",
    intro: "Eres un joven diplomático al servicio de un pequeño estado. Una mañana recibes una carta secreta del poderoso estado de Qin, que propone una alianza.",
    letter: "若贵国愿与秦国结盟，我国愿意提供援助。",
    question: "¿Qué propone Qin en esta carta?",
    placeholder: "Las opciones y la corrección de respuestas se añadirán más adelante.",
    titleBack: "Volver al título",
    guideTitle: "Cómo jugar",
    guide1: "Lee la historia y descubre diálogos y cartas en chino.",
    guide2: "Deduce las intenciones de los personajes a partir de sus palabras.",
    guide3: "Elige estrategias diplomáticas para cambiar el rumbo de la historia.",
    guide4: "Puedes cambiar el idioma de visualización en cualquier momento.",
  },
  it: {
    language: "Lingua dell'interfaccia",
    eyebrow: "STORIA 01 · CINA DEGLI STATI COMBATTENTI",
    title: "Le strategie degli Stati Combattenti",
    subtitle: "― La via verso l'unificazione ―",
    tagline: "Sopravvivi a un'epoca turbolenta usando le parole come arma.",
    description: "Impara il cinese e cambia la storia nei panni di un diplomatico.",
    start: "Inizia la storia",
    guide: "Come si gioca",
    back: "← Torna ai mazzi",
    chapter: "CAPITOLO 01",
    chapterTitle: "Una lettera segreta da Qin",
    intro: "Sei un giovane diplomatico al servizio di un piccolo stato. Una mattina ricevi una lettera segreta dal potente stato di Qin, che propone un'alleanza.",
    letter: "若贵国愿与秦国结盟，我国愿意提供援助。",
    question: "Che cosa propone Qin in questa lettera?",
    placeholder: "Le opzioni e la verifica delle risposte saranno aggiunte in un aggiornamento futuro.",
    titleBack: "Torna al titolo",
    guideTitle: "Come si gioca",
    guide1: "Leggi la storia ed esplora dialoghi e lettere in cinese.",
    guide2: "Deduce le intenzioni dei personaggi dalle loro parole.",
    guide3: "Scegli strategie diplomatiche per influenzare la storia.",
    guide4: "Puoi cambiare la lingua dell'interfaccia in qualsiasi momento.",
  },
};

const languageNames: Record<Language, string> = {
  ja: "日本語",
  "zh-CN": "简体中文",
  "zh-TW": "繁體中文",
  en: "English",
  de: "Deutsch",
  es: "Español",
  it: "Italiano",
};





export default function Story1Page() {
  const [language, setLanguage] = useState<Language>("ja");
  const [screen, setScreen] = useState<Screen>("title");
  
  const t = translations[language];

  const buttonStyle: React.CSSProperties = {
    display: "block",
    width: "100%",
    maxWidth: "340px",
    margin: "14px auto",
    padding: "15px 18px",
    borderRadius: "10px",
    border: "2px solid #f0d58c",
    background: "#f0d58c",
    color: "#17251e",
    fontSize: "16px",
    fontWeight: 800,
    cursor: "pointer",
    boxSizing: "border-box",
  };

  const secondaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    background: "#20372d",
    color: "#ffffff",
    border: "2px solid #e4c879",
  };

  const panelStyle: React.CSSProperties = {
    marginTop: "28px",
    padding: "24px",
    border: "2px solid #d8b968",
    borderRadius: "14px",
    background: "#f9f3e5",
    color: "#202a22",
    textAlign: "left",
    boxShadow: "0 8px 24px rgba(0,0,0,0.22)",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "24px 18px 48px",
        boxSizing: "border-box",
        background: "linear-gradient(160deg, #14251f, #30483a 55%, #101b18)",
        color: "#fff8e8",
        fontFamily: "serif",
      }}
    >

            <button
        type="button"
        aria-label={menuOpen ? "メニューを閉じる" : "メニューを開く"}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
        style={{
          position: "fixed",
          top: "18px",
          left: "18px",
          zIndex: 1002,
          display: "flex",
          width: "46px",
          height: "46px",
          padding: 0,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "5px",
          border: "1px solid #dce1d9",
          borderRadius: "15px",
          background: "rgba(255,255,255,0.94)",
          color: "#26372d",
          boxShadow: "0 6px 20px rgba(0,0,0,0.18)",
          cursor: "pointer",
          backdropFilter: "blur(14px)",
        }}
      >
        <span style={{ width: "17px", height: "2px", background: "currentColor", borderRadius: "2px" }} />
        <span style={{ width: "17px", height: "2px", background: "currentColor", borderRadius: "2px" }} />
        <span style={{ width: "17px", height: "2px", background: "currentColor", borderRadius: "2px" }} />
      </button>

      {menuOpen && (
        <>
          <button
            type="button"
            aria-label="メニューを閉じる"
            onClick={() => setMenuOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1000,
              border: 0,
              background: "rgba(0,0,0,0.45)",
            }}
          />

          <nav
            aria-label="サイトナビゲーション"
            style={{
              position: "fixed",
              top: "74px",
              left: "18px",
              zIndex: 1001,
              width: "min(290px, calc(100vw - 36px))",
              padding: "16px 12px",
              border: "1px solid #e1e6dd",
              borderRadius: "18px",
              background: "#fdfdfb",
              boxShadow: "0 20px 60px rgba(0,0,0,0.28)",
              boxSizing: "border-box",
              fontFamily: "sans-serif",
            }}
          >
            <p style={{ margin: "4px 12px 12px", color: "#7b857b", fontSize: "11px", fontWeight: 800, letterSpacing: "2px" }}>
              MENU
            </p>

            {[
              { href: "/", icon: "⌂", label: "ホーム" },
              { href: "/today", icon: "✓", label: "今日のノルマ" },
              { href: "/plan", icon: "▦", label: "学習計画" },
              { href: "/tasks", icon: "☷", label: "タスク管理" },
              { href: "/materials", icon: "▤", label: "教材管理" },
              { href: "/calendar", icon: "▦", label: "カレンダー" },
              { href: "/stories", icon: "📖", label: "50の物語" },
              { href: "/story1", icon: "🏯", label: "戦国策" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "11px 12px",
                  margin: "3px 0",
                  borderRadius: "12px",
                  color: "#30382f",
                  textDecoration: "none",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                <span
                  style={{
                    display: "grid",
                    placeItems: "center",
                    width: "30px",
                    height: "30px",
                    borderRadius: "9px",
                    background: "#eef2eb",
                    color: "#4d6651",
                  }}
                >
                  {item.icon}
                </span>
                {item.label}
              </a>
            ))}
          </nav>
        </>
      )}
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        <div style={{ textAlign: "right", marginBottom: "24px" }}>
          <label
            htmlFor="story-language"
            style={{
              display: "block",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: 700,
              marginBottom: "8px",
            }}
          >
            🌐 {t.language}
          </label>
          <select
            id="story-language"
            value={language}
            onChange={(event) =>
              setLanguage(event.target.value as Language)
            }
            style={{
              padding: "10px 12px",
              borderRadius: "8px",
              border: "2px solid #e4c879",
              background: "#ffffff",
              color: "#17251e",
              fontSize: "15px",
              fontWeight: 700,
            }}
          >
            {(Object.keys(languageNames) as Language[]).map((code) => (
              <option key={code} value={code}>
                {languageNames[code]}
              </option>
            ))}
          </select>
        </div>

        <header style={{ textAlign: "center", paddingTop: "3vh" }}>
          <p
            style={{
              color: "#ffe39a",
              letterSpacing: "2px",
              fontSize: "12px",
              fontWeight: 800,
              lineHeight: 1.8,
            }}
          >
            {t.eyebrow}
          </p>

          <div style={{ fontSize: "64px", margin: "20px 0" }}>🏯</div>

          <h1
            style={{
              fontSize: "clamp(30px, 6vw, 46px)",
              color: "#ffffff",
              margin: "12px 0",
              lineHeight: 1.4,
              textShadow: "0 2px 8px #000000",
            }}
          >
            {t.title}
          </h1>

          <p
            style={{
              color: "#ffe39a",
              fontSize: "20px",
              fontWeight: 700,
            }}
          >
            {t.subtitle}
          </p>

          <p style={{ fontSize: "18px", lineHeight: 1.9, color: "#ffffff" }}>
            {t.tagline}
          </p>

          <p style={{ fontSize: "15px", lineHeight: 1.9, color: "#f4f0e6" }}>
            {t.description}
          </p>
        </header>

        {screen === "title" && (
          <div style={{ marginTop: "30px", textAlign: "center" }}>
            
            
<button
  onClick={() => {
    window.location.href = "/story1/1";
  }}
  style={{
    ...buttonStyle,
    maxWidth: "360px",
    padding: "18px 24px",
    fontSize: "18px",
    background: "#f0d58c",
    color: "#17251e",
    border: "2px solid #fff0b5",
    boxShadow: "0 4px 14px rgba(0,0,0,0.3)",
  }}
>
  ⚔️ {t.start}　➜
</button>


            <button
              onClick={() => setScreen("guide")}
              style={secondaryButtonStyle}
            >
              📜 {t.guide}
            </button>


                        <button
              onClick={() => {
                window.location.href = "/stories";
              }}
              style={{
                ...secondaryButtonStyle,
                maxWidth: "360px",
              }}
            >
              📚 50の物語から選ぶ ➜
            </button>

            <a
              href="/"
              style={{
                display: "inline-block",
                marginTop: "18px",
                color: "#ffffff",
                fontWeight: 700,
                textDecoration: "underline",
                textUnderlineOffset: "4px",
              }}
            >
              {t.back}
            </a>
          </div>
        )}

        {screen === "intro" && (
          <section style={panelStyle}>
            <p
              style={{
                color: "#705018",
                fontSize: "13px",
                fontWeight: 900,
                letterSpacing: "1px",
              }}
            >
              {t.chapter}
            </p>

            <h2
              style={{
                color: "#202a22",
                fontSize: "26px",
                lineHeight: 1.5,
              }}
            >
              {t.chapterTitle}
            </h2>

            <p style={{ lineHeight: 2, fontSize: "16px" }}>{t.intro}</p>

            <blockquote
              lang={language.startsWith("zh") ? language : "zh-CN"}
              style={{
                margin: "20px 0",
                padding: "18px",
                borderLeft: "4px solid #a77a28",
                background: "#eee4cd",
                color: "#18251e",
                fontSize: "19px",
                lineHeight: 1.9,
                fontWeight: 700,
              }}
            >
              {t.letter}
            </blockquote>

            <p style={{ color: "#3d2b10", fontWeight: 800, lineHeight: 1.8 }}>
              {t.question}
            </p>

            <p style={{ color: "#514b40", fontSize: "13px", lineHeight: 1.8 }}>
              {t.placeholder}
            </p>

            <button
              onClick={() => setScreen("title")}
              style={{
                ...secondaryButtonStyle,
                marginTop: "24px",
                background: "#20372d",
                color: "#ffffff",
              }}
            >
              {t.titleBack}
            </button>
          </section>
        )}

        {screen === "guide" && (
          <section style={panelStyle}>
            <h2
              style={{
                color: "#202a22",
                fontSize: "26px",
                lineHeight: 1.5,
                marginTop: 0,
              }}
            >
              📜 {t.guideTitle}
            </h2>

            <ol
              style={{
                paddingLeft: "24px",
                color: "#202a22",
                fontSize: "16px",
                lineHeight: 2,
              }}
            >
              <li>{t.guide1}</li>
              <li>{t.guide2}</li>
              <li>{t.guide3}</li>
              <li>{t.guide4}</li>
            </ol>

            <button
              onClick={() => setScreen("title")}
              style={{
                ...secondaryButtonStyle,
                marginTop: "24px",
                background: "#20372d",
                color: "#ffffff",
              }}
            >
              {t.titleBack}
            </button>
          </section>
        )}
      </div>
    </main>
  );
}
