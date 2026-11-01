
"use client";

import Link from "next/link";
import { stories } from "@/lib/stories";
import { useAppLanguage } from "@/app/component/AppLanguage";

type Language = "ja" | "de" | "en" | "zh-CN" | "zh-TW" | "es";

const translations: Record<
  Language,
  {
    description: string;
    empty: string;
    start: string;
  }
> = {
  ja: {
    description: "物語を楽しみながら、少しずつ言葉の世界を広げよう。",
    empty: "物語はまだ登録されていません。",
    start: "物語を始める",
  },
  de: {
    description:
      "Entdecke die Welt der Sprachen und genieße dabei spannende Geschichten.",
    empty: "Es wurden noch keine Geschichten hinzugefügt.",
    start: "Geschichte starten",
  },
  en: {
    description:
      "Explore the world of languages while enjoying exciting stories.",
    empty: "No stories have been added yet.",
    start: "Start Story",
  },
  "zh-CN": {
    description: "在享受故事的同时，一步步拓展语言的世界。",
    empty: "目前还没有添加任何故事。",
    start: "开始故事",
  },
  "zh-TW": {
    description: "在享受故事的同時，一步步拓展語言的世界。",
    empty: "目前還沒有新增任何故事。",
    start: "開始故事",
  },
  es: {
    description:
      "Amplía poco a poco tu mundo de idiomas mientras disfrutas de historias.",
    empty: "Todavía no se ha añadido ninguna historia.",
    start: "Comenzar historia",
  },
};

export default function StoriesPage() {
  const { language } = useAppLanguage();

  const currentLanguage: Language =
    language in translations ? (language as Language) : "ja";

  const t = translations[currentLanguage];

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "90px 24px 56px",
        boxSizing: "border-box",
        background: "#f6f7f4",
        color: "#303830",
      }}
    >
      <div style={{ maxWidth: "1080px", margin: "0 auto" }}>
        <p
          style={{
            margin: "0 0 10px",
            color: "#718675",
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          Language Learning Workspace
        </p>

        <h1
          style={{
            margin: "0",
            fontSize: "clamp(28px, 4vw, 40px)",
            fontWeight: 700,
            letterSpacing: "-0.04em",
          }}
        >
          Language Quest
        </h1>

        <p
          style={{
            margin: "12px 0 32px",
            color: "#7b827a",
            fontSize: "15px",
            lineHeight: 1.8,
          }}
        >
          {t.description}
        </p>

        {stories.length === 0 ? (
          <div
            style={{
              padding: "32px",
              border: "1px solid #e5e9e2",
              borderRadius: "20px",
              background: "#ffffff",
              color: "#7b827a",
            }}
          >
            {t.empty}
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "20px",
            }}
          >
            {stories.map((story) => (
              <Link
                key={story.id}
                href={"/stories/" + story.id}
                style={{
                  display: "block",
                  padding: "26px",
                  border: "1px solid #e5e9e2",
                  borderRadius: "22px",
                  background: "#ffffff",
                  color: "inherit",
                  textDecoration: "none",
                  boxShadow: "0 4px 18px rgba(45, 60, 45, 0.035)",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                }}
              >
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "20px",
                    borderRadius: "14px",
                    background: "#edf2eb",
                    color: "#718675",
                    fontSize: "20px",
                  }}
                >
                  ✦
                </div>

                <h2
                  style={{
                    margin: "0 0 10px",
                    fontSize: "19px",
                    fontWeight: 650,
                    lineHeight: 1.5,
                  }}
                >
                  {story.title}
                </h2>

                <p
                  style={{
                    margin: 0,
                    color: "#718075",
                    fontSize: "13px",
                  }}
                >
                  {t.start}　→
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
