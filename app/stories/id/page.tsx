
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { stories } from "@/lib/stories";

const texts: Record<string, { intro: string; question: string; choices: string[]; answer: number; dialogue: string }> = {
  "1": {
    intro: "秦国から密書が届いた。隣国との同盟を結ぶべきか、あなたの判断が国の未来を左右する。",
    question: "密書を受け取った外交官として、最初に何をする？",
    choices: ["内容と条件を慎重に確認する", "すぐに返事を送る", "何も読まずに破棄する"],
    answer: 0,
    dialogue: "若贵国愿与秦国结盟，我国愿意提供援助。",
  },
  "2": {
    intro: "無敵艦隊の航海中、嵐が近づいている。船員たちの報告を聞き、決断しよう。",
    question: "嵐が近づいたとき、まず何をする？",
    choices: ["船員の報告を集める", "警告を無視する", "航海日誌を捨てる"],
    answer: 0,
    dialogue: "Debemos escuchar los informes de la tripulación.",
  },
  "3": {
    intro: "城に秘密の手紙が届いた。書記官として、その意味を読み解こう。",
    question: "手紙の内容が不明確なとき、どうする？",
    choices: ["証拠を集めて確認する", "根拠なく結論を出す", "手紙を隠す"],
    answer: 0,
    dialogue: "Wir müssen die Nachricht sorgfältig prüfen.",
  },
};

export default function StoryDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const story = stories.find((item) => item.id === Number(id));
  const chapter = texts[id];

  const [selected, setSelected] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  if (!story) {
    return (
      <main style={{ padding: 32 }}>
        <h1>物語が見つかりません</h1>
        <Link href="/stories">物語一覧へ戻る</Link>
      </main>
    );
  }

  const intro =
    chapter?.intro ??
    `${story.description} 証言を集め、状況を整理し、あなた自身の判断で物語を進めよう。`;

  const question =
    chapter?.question ?? "次に取るべき行動はどれ？";

  const choices =
    chapter?.choices ?? [
      "情報を集めて慎重に判断する",
      "確認せずに決める",
      "何もしない",
    ];

  const answer = chapter?.answer ?? 0;

  const dialogue =
    chapter?.dialogue ??
    "Wir müssen die Wahrheit herausfinden.";

  function speak(text: string, lang: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("このブラウザでは音声読み上げを利用できません。");
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang =
      lang === "zh"
        ? "zh-CN"
        : lang === "es"
          ? "es-ES"
          : lang === "de"
            ? "de-DE"
            : lang === "it"
              ? "it-IT"
              : "en-US";

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
          ← 50の物語へ戻る
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
          <h2>物語</h2>
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
          <h2>聞いてみよう</h2>

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
            🔊 音声を再生
          </button>

          <h3 style={{ marginTop: 24 }}>声に出して練習しよう</h3>

          <p style={{ color: "#cbd5e1", lineHeight: 1.8 }}>
            音声を聞いたら、同じ文を声に出して読んでみよう。
            読み上げを何度でも再生できるよ。
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
          <h2>あなたの決断</h2>
          <p>{question}</p>

          <div style={{ display: "grid", gap: 10 }}>
            {choices.map((choice, index) => (
              <button
                key={choice}
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
            決断を確認する
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
                ? "正解！情報を確認してから判断するのが大切だね。"
                : "別の選択肢も考えてみよう。証拠を集めて判断することが重要だよ。"}
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
              ← 前の物語
            </Link>
          ) : (
            <span />
          )}

          {story.id < 50 && (
            <Link
              href={`/stories/${story.id + 1}`}
              style={{ color: "#93c5fd" }}
            >
              次の物語 →
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
