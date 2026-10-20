
"use client";

import Link from "next/link";
import { useState } from "react";


type Task = {
  id: number;
  title: string;
  deck: string;
  target: number;
  unit: string;
  completed: boolean;
};

const initialTasks: Task[] = [
  {
    id: 1,
    title: "中級閲読",
    deck: "中国語",
    target: 50,
    unit: "単語",
    completed: false,
  },
  {
    id: 2,
    title: "HSK 7-9級",
    deck: "中国語",
    target: 30,
    unit: "単語",
    completed: false,
  },
  {
    id: 3,
    title: "ドイツ語の復習",
    deck: "ドイツ語",
    target: 20,
    unit: "単語",
    completed: false,
  },
];

export default function TodayPage() {
  const [tasks, setTasks] = useState(initialTasks);

  const completedCount = tasks.filter(
    (task) => task.completed
  ).length;

  const totalCount = tasks.length;

  const totalTarget = tasks.reduce(
    (sum, task) => sum + task.target,
    0
  );

  const remainingTarget = tasks
    .filter((task) => !task.completed)
    .reduce((sum, task) => sum + task.target, 0);

  const progress =
    totalCount === 0
      ? 0
      : Math.round((completedCount / totalCount) * 100);

  const today = new Date();

  const dateText = new Intl.DateTimeFormat("ja-JP", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(today);

  function toggleTask(id: number) {
    setTasks((current) =>
      current.map((task) =>
        task.id === id
          ? { ...task, completed: !task.completed }
          : task
      )
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#d9c49f",
        color: "#302a22",
        padding: "28px 18px 115px",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Noto Sans JP", sans-serif',
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: 650, margin: "0 auto" }}>
        {/* ヘッダー */}
        <header style={{ marginBottom: 26 }}>
          <p
            style={{
              margin: 0,
              fontSize: 17,
              color: "#665b4a",
              fontWeight: 700,
            }}
          >
            {dateText}
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
            }}
          >
            <h1 style={{ fontSize: 30, margin: "6px 0" }}>
              今日のノルマ
            </h1>
            

            
<div
  style={{
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 20,
  }}
>
  <Link
    href="/"
    style={{
      display: "inline-block",
      padding: "10px 16px",
      borderRadius: 10,
      background: "#e8eefc",
      color: "#23345b",
      textDecoration: "none",
      fontWeight: 700,
    }}
  >
    🏠 最初のページへ
  </Link>

  <Link
    href="/plan"
    style={{
      display: "inline-block",
      padding: "10px 16px",
      borderRadius: 10,
      background: "#e4f5e9",
      color: "#205c38",
      textDecoration: "none",
      fontWeight: 700,
    }}
  >
    📅 学習計画へ
  </Link>
</div>


            <span
              style={{
                background: "#f7e8c9",
                border: "2px solid #302a22",
                borderRadius: 30,
                padding: "9px 15px",
                fontWeight: 700,
                whiteSpace: "nowrap",
              }}
            >
              🔥 0日
            </span>
          </div>
        </header>

        {/* 今日の目標 */}
        <section
          style={{
            background: "#fffdf6",
            border: "3px solid #302a22",
            borderRadius: 26,
            padding: 24,
            boxShadow: "4px 6px 0 #302a22",
            marginBottom: 30,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
            }}
          >
            <h2 style={{ fontSize: 23, margin: 0 }}>
              今日の学習目標
            </h2>
            <strong style={{ fontSize: 22 }}>
              {completedCount}/{totalCount}
            </strong>
          </div>

          <p style={{ color: "#756b5c", fontWeight: 600 }}>
            タスク完了率 {progress}%
          </p>

          <div
            style={{
              height: 12,
              background: "#e8dfcc",
              borderRadius: 20,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: "#548c68",
                borderRadius: 20,
                transition: "width 0.2s",
              }}
            />
          </div>

          <p
            style={{
              fontSize: 17,
              fontWeight: 700,
              marginBottom: 0,
            }}
          >
            今日の予定：{totalTarget}単語
          </p>
        </section>

        {/* タスク一覧 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <h2 style={{ fontSize: 22, margin: 0 }}>
            今日のタスク
          </h2>

          <Link
            href="/tasks"
            style={{
              color: "#994638",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            すべて見る →
          </Link>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {tasks.map((task) => (
            <section
              key={task.id}
              style={{
                background: "#fffdf6",
                border: "3px solid #302a22",
                borderRadius: 24,
                padding: 20,
                boxShadow: "4px 5px 0 #302a22",
                opacity: task.completed ? 0.78 : 1,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                }}
              >
                <button
                  type="button"
                  onClick={() => toggleTask(task.id)}
                  aria-label={
                    task.completed
                      ? "未完了に戻す"
                      : "タスクを完了する"
                  }
                  style={{
                    width: 34,
                    height: 34,
                    flexShrink: 0,
                    borderRadius: "50%",
                    border: "2px solid #655b4d",
                    background: task.completed
                      ? "#548c68"
                      : "#fffdf6",
                    color: "#ffffff",
                    fontSize: 20,
                    cursor: "pointer",
                  }}
                >
                  {task.completed ? "✓" : ""}
                </button>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "4px 10px",
                      borderRadius: 20,
                      background: "#f3e6c9",
                      color: "#6b5840",
                      fontSize: 12,
                      fontWeight: 700,
                      marginBottom: 8,
                    }}
                  >
                    {task.deck}
                  </span>

                  <h3
                    style={{
                      margin: "0 0 8px",
                      fontSize: 21,
                      textDecoration: task.completed
                        ? "line-through"
                        : "none",
                    }}
                  >
                    {task.title}
                  </h3>

                  <p
                    style={{
                      margin: 0,
                      color: "#655b4d",
                      fontSize: 15,
                    }}
                  >
                    今日の目標：{task.target}
                    {task.unit}
                  </p>
                </div>

                <span
                  style={{
                    fontSize: 13,
                    color: task.completed
                      ? "#548c68"
                      : "#8a7b66",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                  }}
                >
                  {task.completed ? "完了" : "未完了"}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  marginTop: 18,
                }}
              >
                <Link
                  href="/plan"
                  style={{
                    flex: 1,
                    textAlign: "center",
                    padding: "12px 8px",
                    border: "2px solid #302a22",
                    borderRadius: 24,
                    color: "#302a22",
                    textDecoration: "none",
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  学習計画
                </Link>

                <button
                  type="button"
                  onClick={() =>
                    alert(
                      "次の段階で既存の学習ゲームと接続します。"
                    )
                  }
                  style={{
                    flex: 1,
                    padding: "12px 8px",
                    background: "#302a22",
                    color: "#fffdf6",
                    border: "2px solid #302a22",
                    borderRadius: 24,
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  学習を始める →
                </button>
              </div>
            </section>
          ))}
        </div>

        {/* 今日のまとめ */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 10,
            marginTop: 28,
          }}
        >
          {[
            {
              label: "完了タスク",
              value: `${completedCount}/${totalCount}`,
            },
            {
              label: "残り単語",
              value: `${remainingTarget}`,
            },
            {
              label: "達成率",
              value: `${progress}%`,
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                background: "#f2e4c7",
                borderRadius: 20,
                padding: "16px 10px",
                minWidth: 0,
              }}
            >
              <p
                style={{
                  margin: "0 0 8px",
                  fontSize: 12,
                  color: "#6c604e",
                  fontWeight: 700,
                }}
              >
                {item.label}
              </p>
              <strong
                style={{
                  fontSize: 19,
                  overflowWrap: "anywhere",
                }}
              >
                {item.value}
              </strong>
            </div>
          ))}
        </section>

        {/* ページ間の移動 */}
        <nav
          style={{
            display: "flex",
            justifyContent: "space-around",
            gap: 8,
            marginTop: 32,
            flexWrap: "wrap",
          }}
        >
          {[
            { href: "/decks", label: "デッキ" },
            { href: "/plans", label: "学習計画" },
            { href: "/tasks", label: "タスク管理" },
            { href: "/calendar", label: "学習カレンダー" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                color: "#302a22",
                fontSize: 13,
                fontWeight: 700,
                textDecoration: "none",
                padding: "8px 4px",
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </main>
  );
}
