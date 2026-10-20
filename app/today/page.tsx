
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type TaskType = "教材の学習" | "単語の暗記・復習";
type TaskStatus = "未着手" | "進行中" | "完了";
type RepeatType = "なし" | "毎日" | "毎週";
type TaskUnit = "単語" | "ページ" | "章" | "回" | "分";

type Task = {
  id: string;
  title: string;
  type: TaskType;
  material: string;
  target: number;
  unit: TaskUnit;
  scheduledDate: string;
  dueDate: string;
  status: TaskStatus;
  repeat: RepeatType;
  repeatDays: number[];
};

function todayString() {
  const now = new Date();
  const local = new Date(
    now.getTime() - now.getTimezoneOffset() * 60000
  );
  return local.toISOString().slice(0, 10);
}

function formatTargets(tasks: Task[], onlyRemaining = false) {
  const filtered = onlyRemaining
    ? tasks.filter((task) => task.status !== "完了")
    : tasks;

  const units: TaskUnit[] = ["単語", "ページ", "章", "回", "分"];

  const totals = units
    .map((unit) => {
      const amount = filtered
        .filter((task) => task.unit === unit)
        .reduce((sum, task) => sum + task.target, 0);

      return amount > 0 ? `${amount}${unit}` : "";
    })
    .filter(Boolean);

  return totals.length > 0 ? totals.join("・") : "0";
}

export default function TodayPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  // ログイン状態を確認
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setAuthReady(true);
      },
      () => {
        setError("ログイン状態を確認できませんでした。");
        setAuthReady(true);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // ログイン中のユーザーのタスクをFirestoreから取得
  useEffect(() => {
    if (!authReady) return;

    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const tasksRef = collection(db, "users", user.uid, "tasks");

    const unsubscribe = onSnapshot(
      tasksRef,
      (snapshot) => {
        const loadedTasks: Task[] = snapshot.docs.map((item) => {
          const data = item.data();

          return {
            id: item.id,
            title: String(data.title ?? ""),
            type: (data.type ?? "教材の学習") as TaskType,
            material: String(data.material ?? ""),
            target: Number(data.target ?? 0),
            unit: (data.unit ?? "単語") as TaskUnit,
            scheduledDate: String(data.scheduledDate ?? ""),
            dueDate: String(data.dueDate ?? ""),
            status: (data.status ?? "未着手") as TaskStatus,
            repeat: (data.repeat ?? "なし") as RepeatType,
            repeatDays: Array.isArray(data.repeatDays)
              ? data.repeatDays.map(Number)
              : [],
          };
        });

        setTasks(loadedTasks);
        setLoading(false);
      },
      () => {
        setError("タスクを読み込めませんでした。");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [authReady, user]);

  // タスク管理で今日の日付に設定されているタスクだけ表示
  const todayTasks = useMemo(() => {
    const today = todayString();

    return tasks
      .filter((task) => task.scheduledDate === today)
      .sort((a, b) => a.title.localeCompare(b.title, "ja"));
  }, [tasks]);

  const completedCount = todayTasks.filter(
    (task) => task.status === "完了"
  ).length;

  const totalCount = todayTasks.length;

  const remainingCount = totalCount - completedCount;

  const progress =
    totalCount === 0
      ? 0
      : Math.round((completedCount / totalCount) * 100);

  const dateText = new Intl.DateTimeFormat("ja-JP", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date());

  // Firestore上のタスクの完了状態を更新
  async function toggleTask(task: Task) {
    if (!user || savingId) return;

    setSavingId(task.id);
    setError("");

    try {
      const taskRef = doc(
        db,
        "users",
        user.uid,
        "tasks",
        task.id
      );

      await updateDoc(taskRef, {
        status: task.status === "完了" ? "未着手" : "完了",
        updatedAt: serverTimestamp(),
      });
    } catch {
      setError("完了状態を保存できませんでした。もう一度お試しください。");
    } finally {
      setSavingId(null);
    }
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
              flexWrap: "wrap",
            }}
          >
            <h1 style={{ fontSize: 30, margin: "6px 0" }}>
              今日のノルマ
            </h1>

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
              今日の進捗 {completedCount}/{totalCount}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              marginTop: 12,
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
        </header>

        {/* エラーメッセージ */}
        {error && (
          <p
            role="alert"
            style={{
              background: "#fff0ed",
              color: "#9b3024",
              padding: 14,
              borderRadius: 12,
              fontWeight: 700,
              overflowWrap: "anywhere",
            }}
          >
            {error}
          </p>
        )}

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

          <p style={{ fontSize: 16, fontWeight: 700 }}>
            今日の予定：{formatTargets(todayTasks)}
          </p>

          <p
            style={{
              fontSize: 14,
              color: "#756b5c",
              marginBottom: 0,
            }}
          >
            残りの目標：{formatTargets(todayTasks, true)}
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

        {!authReady || loading ? (
          <section
            style={{
              background: "#fffdf6",
              border: "3px solid #302a22",
              borderRadius: 24,
              padding: 24,
              textAlign: "center",
              fontWeight: 700,
            }}
          >
            タスクを読み込んでいます…
          </section>
        ) : !user ? (
          <section
            style={{
              background: "#fffdf6",
              border: "3px solid #302a22",
              borderRadius: 24,
              padding: 24,
              textAlign: "center",
            }}
          >
            <p style={{ fontWeight: 700 }}>
              タスクを表示するにはログインしてください。
            </p>
            <Link
              href="/login"
              style={{
                display: "inline-block",
                padding: "12px 20px",
                borderRadius: 24,
                background: "#302a22",
                color: "#fffdf6",
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              ログイン・新規登録
            </Link>
          </section>
        ) : todayTasks.length === 0 ? (
          <section
            style={{
              background: "#fffdf6",
              border: "3px solid #302a22",
              borderRadius: 24,
              padding: 24,
              textAlign: "center",
              boxShadow: "4px 5px 0 #302a22",
            }}
          >
            <p style={{ fontSize: 18, fontWeight: 700 }}>
              今日のタスクはまだありません。
            </p>
            <p style={{ color: "#756b5c", lineHeight: 1.8 }}>
              タスク管理ページで、実施日を今日に設定してタスクを登録してください。
            </p>
            <Link
              href="/tasks"
              style={{
                display: "inline-block",
                padding: "12px 20px",
                borderRadius: 24,
                background: "#302a22",
                color: "#fffdf6",
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              ＋ タスクを登録する
            </Link>
          </section>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {todayTasks.map((task) => {
              const completed = task.status === "完了";

              return (
                <section
                  key={task.id}
                  style={{
                    background: "#fffdf6",
                    border: "3px solid #302a22",
                    borderRadius: 24,
                    padding: 20,
                    boxShadow: "4px 5px 0 #302a22",
                    opacity: completed ? 0.78 : 1,
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
                      onClick={() => toggleTask(task)}
                      disabled={savingId !== null}
                      aria-label={
                        completed
                          ? "未完了に戻す"
                          : "タスクを完了する"
                      }
                      style={{
                        width: 34,
                        height: 34,
                        flexShrink: 0,
                        borderRadius: "50%",
                        border: "2px solid #655b4d",
                        background: completed
                          ? "#548c68"
                          : "#fffdf6",
                        color: "#ffffff",
                        fontSize: 20,
                        cursor: savingId ? "wait" : "pointer",
                      }}
                    >
                      {completed ? "✓" : ""}
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
                        {task.type}
                      </span>

                      <h3
                        style={{
                          margin: "0 0 8px",
                          fontSize: 21,
                          overflowWrap: "anywhere",
                          textDecoration: completed
                            ? "line-through"
                            : "none",
                        }}
                      >
                        {task.title}
                      </h3>

                      {task.material && (
                        <p
                          style={{
                            margin: "0 0 8px",
                            color: "#655b4d",
                            fontSize: 14,
                          }}
                        >
                          教材・デッキ：{task.material}
                        </p>
                      )}

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

                      {task.repeat !== "なし" && (
                        <p
                          style={{
                            margin: "8px 0 0",
                            color: "#756b5c",
                            fontSize: 13,
                          }}
                        >
                          繰り返し設定：{task.repeat}
                        </p>
                      )}
                    </div>

                    <span
                      style={{
                        fontSize: 13,
                        color: completed ? "#548c68" : "#8a7b66",
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {completed ? "完了" : task.status}
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
                          "このボタンは現在、学習ゲームとは接続していません。"
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
              );
            })}
          </div>
        )}

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
              label: "残りタスク",
              value: `${remainingCount}件`,
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
