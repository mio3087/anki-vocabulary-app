"use client";

import Link from "next/link";
import { stories } from "@/lib/stories";

export default function StoriesPage() {
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
          物語を楽しみながら、少しずつ言葉の世界を広げよう。
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
            物語はまだ登録されていません。
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
                  物語を始める　→
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}