
"use client";

import Link from "next/link";
import { stories } from "@/lib/stories";

export default function StoriesPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px 20px",
        background: "#101827",
        color: "#f8fafc",
      }}
    >
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <Link
          href="/"
          style={{ color: "#93c5fd", textDecoration: "none" }}
        >
          ← ホームに戻る
        </Link>

        <h1 style={{ fontSize: 32, marginTop: 24 }}>
          Language Quest
        </h1>

        <p style={{ color: "#cbd5e1" }}>
          50の物語から選ぼう。言葉を学び、歴史の謎を解こう。
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
            gap: 16,
            marginTop: 28,
          }}
        >
          {stories.map((story) => (
            <Link
              key={story.id}
              href={`/stories/${story.id}`}
              style={{
                display: "block",
                padding: 20,
                borderRadius: 14,
                border: "1px solid #334155",
                background: "#1e293b",
                color: "#f8fafc",
                textDecoration: "none",
              }}
            >
              <div style={{ color: "#93c5fd", fontSize: 13 }}>
                STORY {String(story.id).padStart(2, "0")}
                {" · "}
                {story.era}
              </div>

              <h2
  style={{
    fontSize: 19,
    margin: "12px 0",
    color: "#000000",
  }}
>
  {story.title}
</h2>

              <p style={{ color: "#cbd5e1", fontSize: 14 }}>
                {story.description}
              </p>

              <div style={{ marginTop: 16, color: "#86efac" }}>
                物語を始める →
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
