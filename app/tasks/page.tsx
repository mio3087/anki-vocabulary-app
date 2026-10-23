
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type TaskType = "教材の学習" | "単語の暗記・復習";
type TaskStatus = "未着手" | "進行中" | "完了";
type RepeatType = "なし" | "毎日" | "毎週";

type StudyTask = {
  id: string;
  title: string;
  type: TaskType;
  material: string;
  target: number;
  unit: "単語" | "ページ" | "分" | "章" | "回";
  startDate: string;
  scheduledDate: string;
  dueDate: string;
  status: TaskStatus;
  repeat: RepeatType;
  repeatDays: number[];
};

const todayString = () => {
  const now = new Date();
  const local = new Date(
    now.getTime() - now.getTimezoneOffset() * 60000
  );
  return local.toISOString().slice(0, 10);
};

const emptyForm = () => ({
  title: "",
  type: "教材の学習" as TaskType,
  material: "",
  target: 50,
  unit: "単語" as StudyTask["unit"],
  startDate: todayString(),
  scheduledDate: todayString(),
  dueDate: todayString(),
  repeat: "なし" as RepeatType,
  repeatDays: [] as number[],
});

const weekdays = ["日", "月", "火", "水", "木", "金", "土"];

const navigationItems = [
  { href: "/", icon: "⌂", label: "ホーム" },
  { href: "/today", icon: "✳", label: "今日のノルマ" },
  { href: "/calendar", icon: "▦", label: "学習カレンダー" },
  { href: "/tasks", icon: "✓", label: "タスク管理" },
  { href: "/plan", icon: "↗", label: "学習計画" },
  { href: "/decks", icon: "▤", label: "単語帳・デッキ" },
  { href: "/little-moments", icon: "♡", label: "Little Moments" },
];

export default function TasksPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [search, setSearch] = useState("");

  // ハンバーガーメニューの状態
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });
  }, []);

  // Escapeキーでもメニューを閉じる
  useEffect(() => {
    if (!menuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

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
        const loadedTasks = snapshot.docs.map((item) => {
          const data = item.data();

          return {
            id: item.id,
            title: String(data.title ?? ""),
            type: data.type as TaskType,
            material: String(data.material ?? ""),
            target: Number(data.target ?? 0),
            unit: data.unit as StudyTask["unit"],
            startDate: String(data.startDate ?? ""),
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
      (err) => {
        console.error("タスク読み込みエラー:", err);
        setError(
          "タスクを読み込めませんでした。Firestoreのルールを確認してください。"
        );
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [authReady, user]);

  const visibleTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        if (filter === "today" && task.scheduledDate !== todayString()) {
          return false;
        }
        if (filter === "open" && task.status === "完了") return false;
        if (filter === "done" && task.status !== "完了") return false;

        if (
          filter === "overdue" &&
          (!task.dueDate ||
            task.dueDate >= todayString() ||
            task.status === "完了")
        ) {
          return false;
        }

        if (dateFilter && task.scheduledDate !== dateFilter) return false;

        const term = search.trim().toLowerCase();

        if (
          term &&
          !task.title.toLowerCase().includes(term) &&
          !task.material.toLowerCase().includes(term)
        ) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const dateA = a.dueDate || "9999-12-31";
        const dateB = b.dueDate || "9999-12-31";
        return dateA.localeCompare(dateB);
      });
  }, [tasks, filter, dateFilter, search]);

  const resetForm = () => {
    setForm(emptyForm());
    setEditingId(null);
  };

  const saveTask = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!user) {
      setError("タスクを保存するにはログインしてください。");
      return;
    }

    if (!form.title.trim()) {
      setError("タスク名を入力してください。");
      return;
    }

    if (form.target < 0) {
      setError("目標量は0以上にしてください。");
      return;
    }

    if (
      form.startDate &&
      form.scheduledDate &&
      form.scheduledDate < form.startDate
    ) {
      setError("実施予定日は開始日以降にしてください。");
      return;
    }

    if (
      form.scheduledDate &&
      form.dueDate &&
      form.dueDate < form.scheduledDate
    ) {
      setError("期限は実施予定日以降にしてください。");
      return;
    }

    if (form.repeat === "毎週" && form.repeatDays.length === 0) {
      setError("繰り返す曜日を1つ以上選んでください。");
      return;
    }

    setSaving(true);
    setError("");

    const taskData = {
      title: form.title.trim(),
      type: form.type,
      material: form.material.trim(),
      target: Number(form.target),
      unit: form.unit,
      startDate: form.startDate,
      scheduledDate: form.scheduledDate,
      dueDate: form.dueDate,
      repeat: form.repeat,
      repeatDays: form.repeat === "毎週" ? form.repeatDays : [],
      updatedAt: serverTimestamp(),
    };

    try {
      const tasksRef = collection(db, "users", user.uid, "tasks");

      if (editingId) {
        await updateDoc(doc(tasksRef, editingId), taskData);
      } else {
        await addDoc(tasksRef, {
          ...taskData,
          status: "未着手",
          createdAt: serverTimestamp(),
        });
      }

      resetForm();
    } catch (err) {
      console.error("タスク保存エラー:", err);
      setError(
        "保存できませんでした。Firestoreのルールや通信状態を確認してください。"
      );
    } finally {
      setSaving(false);
    }
  };

  const editTask = (task: StudyTask) => {
    setEditingId(task.id);

    setForm({
      title: task.title,
      type: task.type,
      material: task.material,
      target: task.target,
      unit: task.unit,
      startDate: task.startDate || todayString(),
      scheduledDate: task.scheduledDate || todayString(),
      dueDate: task.dueDate || task.scheduledDate || todayString(),
      repeat: task.repeat,
      repeatDays: task.repeatDays,
    });

    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const changeStatus = async (
    task: StudyTask,
    status: TaskStatus
  ) => {
    if (!user) return;

    try {
      await updateDoc(
        doc(db, "users", user.uid, "tasks", task.id),
        { status, updatedAt: serverTimestamp() }
      );
      setError("");
    } catch (err) {
      console.error("状態更新エラー:", err);
      setError("状態を更新できませんでした。");
    }
  };

  const removeTask = async (task: StudyTask) => {
    if (!user) return;
    if (!window.confirm(`「${task.title}」を削除しますか？`)) return;

    try {
      await deleteDoc(doc(db, "users", user.uid, "tasks", task.id));

      if (editingId === task.id) resetForm();

      setError("");
    } catch (err) {
      console.error("タスク削除エラー:", err);
      setError("削除できませんでした。");
    }
  };

  const toggleDay = (day: number) => {
    setForm((current) => ({
      ...current,
      repeatDays: current.repeatDays.includes(day)
        ? current.repeatDays.filter((item) => item !== day)
        : [...current.repeatDays, day].sort((a, b) => a - b),
    }));
  };

  const pageStyle: React.CSSProperties = {
    maxWidth: 1000,
    margin: "0 auto",
    padding: "24px 16px 48px",
    color: "#332d25",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    padding: 10,
    border: "1px solid #e5ded3",
    borderRadius: 10,
    background: "#fffdf9",
    color: "#332d25",
    fontSize: 14,
    marginTop: 6,
  };

  const buttonStyle: React.CSSProperties = {
    padding: "9px 14px",
    border: "1px solid #ded5c8",
    borderRadius: 10,
    background: "#f5efe5",
    color: "#332d25",
    cursor: "pointer",
    fontSize: 13,
    transition: "background 0.2s ease",
  };

  const sectionStyle: React.CSSProperties = {
    border: "1px solid #eee8df",
    borderRadius: 18,
    padding: 22,
    marginBottom: 24,
    background: "#fffdf9",
    boxShadow: "0 4px 20px rgba(55, 43, 29, 0.025)",
  };

  return (
    <main style={pageStyle}>
      {/* ハンバーガーボタン */}
      <button
        type="button"
        aria-label={menuOpen ? "メニューを閉じる" : "メニューを開く"}
        aria-expanded={menuOpen}
        aria-controls="anki-sidebar"
        onClick={() => setMenuOpen((open) => !open)}
        style={{
          position: "fixed",
          top: 16,
          left: 16,
          zIndex: 1002,
          width: 46,
          height: 46,
          border: "1px solid #e8e2d9",
          borderRadius: 14,
          background: "#fffdf9",
          color: "#332d25",
          fontSize: 23,
          cursor: "pointer",
          boxShadow: "0 4px 16px rgba(40, 30, 20, 0.07)",
          display: "grid",
          placeItems: "center",
        }}
      >
        {menuOpen ? "×" : "☰"}
      </button>

      {/* 背景オーバーレイ */}
      {menuOpen && (
        <button
          type="button"
          aria-label="メニューを閉じる"
          onClick={() => setMenuOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            width: "100%",
            height: "100%",
            border: "none",
            borderRadius: 0,
            background: "rgba(35, 30, 25, 0.24)",
            backdropFilter: "blur(2px)",
            cursor: "pointer",
          }}
        />
      )}

      {/* サイドメニュー */}
      <aside
        id="anki-sidebar"
        aria-label="メインメニュー"
        aria-hidden={!menuOpen}
        style={{
          position: "fixed",
          top: 0,
          left: menuOpen ? 0 : -290,
          bottom: 0,
          zIndex: 1001,
          width: 270,
          boxSizing: "border-box",
          padding: "88px 20px 24px",
          background: "#fffdf9",
          borderRight: "1px solid #e8e2d9",
          boxShadow: "8px 0 32px rgba(40, 30, 20, 0.08)",
          transition: "left 0.25s ease",
          overflowY: "auto",
          visibility: menuOpen ? "visible" : "hidden",
        }}
      >
        <p
          style={{
            color: "#a08b70",
            fontSize: 11,
            letterSpacing: 3,
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          YOUR ANKI
        </p>

        <h2
          style={{
            fontSize: 25,
            letterSpacing: -1,
            margin: "0 0 30px",
            color: "#332d25",
          }}
        >
          Anki
        </h2>

        <p
          style={{
            fontSize: 10,
            color: "#a69a89",
            letterSpacing: 1.5,
            margin: "0 0 10px 12px",
          }}
        >
          MENU
        </p>

        <nav style={{ display: "grid", gap: 5 }}>
          {navigationItems.map((item) => {
            const active = item.href === "/tasks";

            return (
              <Link
                key={item.href}
                href={item.href}
                tabIndex={menuOpen ? 0 : -1}
                onClick={() => setMenuOpen(false)}
                aria-current={active ? "page" : undefined}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 13,
                  padding: "12px 14px",
                  borderRadius: 12,
                  textDecoration: "none",
                  color: active ? "#65513a" : "#62594f",
                  background: active ? "#f2ece2" : "transparent",
                  fontSize: 14,
                  fontWeight: active ? 700 : 500,
                  transition: "background 0.2s ease",
                }}
              >
                <span
                  style={{
                    width: 22,
                    fontSize: 18,
                    textAlign: "center",
                  }}
                >
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div
          style={{
            marginTop: 32,
            padding: "15px 13px",
            borderRadius: 13,
            background: "#f8f4ed",
          }}
        >
          <p
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#655947",
              margin: "0 0 5px",
            }}
          >
            YOUR OWN PACE
          </p>
          <p
            style={{
              fontSize: 11,
              color: "#8b8072",
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            自分のペースで、少しずつ。
          </p>
        </div>
      </aside>

      {/* ページヘッダー */}
      <header
        style={{
          marginBottom: 28,
          paddingTop: 12,
          paddingLeft: 54,
        }}
      >
        <p
          style={{
            color: "#a08b70",
            fontSize: 11,
            letterSpacing: 2,
            marginBottom: 7,
          }}
        >
          ANKI / STUDY
        </p>

        <h1
          style={{
            fontSize: 30,
            fontWeight: 650,
            letterSpacing: -1.2,
            margin: "0 0 9px",
            color: "#332d25",
          }}
        >
          タスク管理
        </h1>

        <p
          style={{
            color: "#8b8175",
            fontSize: 14,
            lineHeight: 1.8,
            margin: 0,
          }}
        >
          学習タスクを整理して、毎日の勉強を少しずつ進めましょう。
        </p>
      </header>

      {!authReady && (
        <p style={{ color: "#8b8175" }}>
          ログイン状態を確認しています...
        </p>
      )}

      {authReady && !user && (
        <section
          style={{
            padding: 16,
            borderRadius: 14,
            background: "#fff4df",
            marginBottom: 20,
            fontSize: 14,
          }}
        >
          タスクをFirestoreに保存するにはログインしてください。
          ログイン後、このページを再読み込みしてください。
        </section>
      )}

      {error && (
        <p
          role="alert"
          style={{
            padding: 14,
            background: "#fff0ed",
            color: "#9b3025",
            borderRadius: 12,
            fontSize: 14,
          }}
        >
          {error}
        </p>
      )}

      {/* タスク登録・編集 */}
      <section style={sectionStyle}>
        <div style={{ marginBottom: 22 }}>
          <p
            style={{
              color: "#a08b70",
              fontSize: 10,
              letterSpacing: 2,
              margin: "0 0 7px",
            }}
          >
            CREATE & ORGANIZE
          </p>

          <h2
            style={{
              fontSize: 20,
              letterSpacing: -0.5,
              margin: 0,
            }}
          >
            {editingId ? "タスクを編集" : "新しいタスクを登録"}
          </h2>
        </div>

        <form onSubmit={saveTask}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
            }}
          >
            <label style={{ fontSize: 13, fontWeight: 500 }}>
              タスク名 *
              <input
                style={inputStyle}
                value={form.title}
                onChange={(e) =>
                  setForm({ ...form, title: e.target.value })
                }
                placeholder="例：中国語の単語復習"
                required
              />
            </label>

            <label style={{ fontSize: 13, fontWeight: 500 }}>
              タスクの種類
              <select
                style={inputStyle}
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value as TaskType })
                }
              >
                <option>教材の学習</option>
                <option>単語の暗記・復習</option>
              </select>
            </label>

            <label style={{ fontSize: 13, fontWeight: 500 }}>
              教材・デッキ名
              <input
                style={inputStyle}
                value={form.material}
                onChange={(e) =>
                  setForm({ ...form, material: e.target.value })
                }
                placeholder="例：華文閱讀測驗 中級"
              />
            </label>

            <label style={{ fontSize: 13, fontWeight: 500 }}>
              目標量
              <input
                style={inputStyle}
                type="number"
                min="0"
                value={form.target}
                onChange={(e) =>
                  setForm({
                    ...form,
                    target: Number(e.target.value),
                  })
                }
              />
            </label>

            <label style={{ fontSize: 13, fontWeight: 500 }}>
              単位
              <select
                style={inputStyle}
                value={form.unit}
                onChange={(e) =>
                  setForm({
                    ...form,
                    unit: e.target.value as StudyTask["unit"],
                  })
                }
              >
                <option value="単語">単語</option>
                <option value="ページ">ページ</option>
                <option value="分">分</option>
                <option value="章">章</option>
                <option value="回">回</option>
              </select>
            </label>

            <label style={{ fontSize: 13, fontWeight: 500 }}>
              開始日
              <input
                style={inputStyle}
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value })
                }
                required
              />
            </label>

            <label style={{ fontSize: 13, fontWeight: 500 }}>
              実施予定日
              <input
                style={inputStyle}
                type="date"
                value={form.scheduledDate}
                onChange={(e) =>
                  setForm({ ...form, scheduledDate: e.target.value })
                }
                required
              />
            </label>

            <label style={{ fontSize: 13, fontWeight: 500 }}>
              期限
              <input
                style={inputStyle}
                type="date"
                value={form.dueDate}
                onChange={(e) =>
                  setForm({ ...form, dueDate: e.target.value })
                }
                required
              />
            </label>

            <label style={{ fontSize: 13, fontWeight: 500 }}>
              繰り返し
              <select
                style={inputStyle}
                value={form.repeat}
                onChange={(e) =>
                  setForm({
                    ...form,
                    repeat: e.target.value as RepeatType,
                  })
                }
              >
                <option>なし</option>
                <option>毎日</option>
                <option>毎週</option>
              </select>
            </label>
          </div>

          {form.repeat === "毎週" && (
            <fieldset
              style={{
                marginTop: 20,
                padding: 14,
                border: "1px solid #e8e0d5",
                borderRadius: 12,
              }}
            >
              <legend style={{ fontSize: 13, padding: "0 6px" }}>
                繰り返す曜日
              </legend>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 14,
                }}
              >
                {weekdays.map((day, index) => (
                  <label
                    key={day}
                    style={{ fontSize: 13, cursor: "pointer" }}
                  >
                    <input
                      type="checkbox"
                      checked={form.repeatDays.includes(index)}
                      onChange={() => toggleDay(index)}
                    />{" "}
                    {day}曜日
                  </label>
                ))}
              </div>

              {form.repeatDays.length === 0 && (
                <p
                  style={{
                    color: "#9b3025",
                    fontSize: 12,
                    marginBottom: 0,
                  }}
                >
                  曜日を1つ以上選んでください。
                </p>
              )}
            </fieldset>
          )}

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              marginTop: 22,
            }}
          >
            <button
              type="submit"
              disabled={
                !user ||
                saving ||
                (form.repeat === "毎週" && form.repeatDays.length === 0)
              }
              style={{
                ...buttonStyle,
                padding: "11px 20px",
                background: "#655947",
                color: "#fff",
                borderColor: "#655947",
                opacity: !user || saving ? 0.6 : 1,
              }}
            >
              {saving
                ? "保存中..."
                : editingId
                  ? "変更を保存"
                  : "＋ タスクを登録"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                style={buttonStyle}
              >
                編集をキャンセル
              </button>
            )}
          </div>
        </form>
      </section>

      {/* タスク一覧 */}
      <section>
        <div style={{ marginBottom: 20 }}>
          <p
            style={{
              color: "#a08b70",
              fontSize: 10,
              letterSpacing: 2,
              margin: "0 0 7px",
            }}
          >
            YOUR STUDY LIST
          </p>

          <h2
            style={{
              fontSize: 22,
              letterSpacing: -0.7,
              margin: "0 0 6px",
            }}
          >
            タスク一覧
          </h2>

          <p
            style={{
              fontSize: 13,
              color: "#8b8175",
              margin: 0,
            }}
          >
            {visibleTasks.length} 件のタスク
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <label style={{ fontSize: 13, fontWeight: 500 }}>
            状態で絞り込み
            <select
              style={inputStyle}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">すべて</option>
              <option value="today">今日のタスク</option>
              <option value="open">未完了</option>
              <option value="done">完了済み</option>
              <option value="overdue">期限切れ</option>
            </select>
          </label>

          <label style={{ fontSize: 13, fontWeight: 500 }}>
            実施予定日
            <input
              style={inputStyle}
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </label>

          <label style={{ fontSize: 13, fontWeight: 500 }}>
            タスク・教材を検索
            <input
              style={inputStyle}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="キーワードを入力"
            />
          </label>
        </div>

        {loading ? (
          <p style={{ color: "#8b8175" }}>
            タスクを読み込んでいます...
          </p>
        ) : !user ? (
          <p style={{ color: "#8b8175" }}>
            ログインすると保存済みのタスクが表示されます。
          </p>
        ) : visibleTasks.length === 0 ? (
          <div
            style={{
              padding: "40px 20px",
              textAlign: "center",
              background: "#f8f5ef",
              borderRadius: 16,
              border: "1px solid #eee8df",
            }}
          >
            <p style={{ fontSize: 26, margin: "0 0 10px" }}>✳</p>
            <p
              style={{
                fontSize: 14,
                color: "#655947",
                margin: "0 0 6px",
              }}
            >
              該当するタスクはありません
            </p>
            <p
              style={{
                fontSize: 12,
                color: "#8b8175",
                margin: 0,
              }}
            >
              条件を変更するか、上のフォームから登録できます。
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {visibleTasks.map((task) => (
              <article
                key={task.id}
                style={{
                  border: "1px solid #eee8df",
                  borderRadius: 16,
                  padding: 18,
                  background: "#fffdf9",
                  opacity: task.status === "完了" ? 0.72 : 1,
                  boxShadow: "0 3px 14px rgba(55, 43, 29, 0.025)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 16,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ flex: "1 1 220px" }}>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={task.status === "完了"}
                        onChange={(e) =>
                          changeStatus(
                            task,
                            e.target.checked ? "完了" : "未着手"
                          )
                        }
                        style={{ marginTop: 4 }}
                      />

                      <strong
                        style={{
                          fontSize: 16,
                          lineHeight: 1.6,
                          fontWeight: 600,
                          textDecoration:
                            task.status === "完了"
                              ? "line-through"
                              : "none",
                        }}
                      >
                        {task.title}
                      </strong>
                    </label>

                    <p
                      style={{
                        color: "#71685d",
                        fontSize: 13,
                        lineHeight: 1.8,
                        margin: "9px 0",
                      }}
                    >
                      {task.type}
                      {task.material ? ` ・ ${task.material}` : ""}
                      {` ・ 目標 ${task.target}${task.unit}`}
                    </p>

                    <p
                      style={{
                        fontSize: 12,
                        color: "#8b8175",
                        margin: "6px 0",
                      }}
                    >
                      実施日：{task.scheduledDate || "未設定"}
                      {" ・ "}
                      期限：{task.dueDate || "未設定"}
                    </p>

                    <p
                      style={{
                        fontSize: 12,
                        color: "#8b8175",
                        margin: "6px 0 0",
                      }}
                    >
                      繰り返し：{task.repeat}
                      {task.repeat === "毎週" &&
                      task.repeatDays.length > 0
                        ? `（${task.repeatDays
                            .map((d) => weekdays[d])
                            .join("・")}）`
                        : ""}
                    </p>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <select
                      aria-label={`${task.title}の状態`}
                      style={{
                        ...inputStyle,
                        width: 120,
                        marginTop: 0,
                      }}
                      value={task.status}
                      onChange={(e) =>
                        changeStatus(
                          task,
                          e.target.value as TaskStatus
                        )
                      }
                    >
                      <option>未着手</option>
                      <option>進行中</option>
                      <option>完了</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => editTask(task)}
                      style={buttonStyle}
                    >
                      編集
                    </button>

                    <button
                      type="button"
                      onClick={() => removeTask(task)}
                      style={{
                        ...buttonStyle,
                        color: "#9b5145",
                        background: "#fff9f7",
                      }}
                    >
                      削除
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer
        style={{
          marginTop: 36,
          paddingTop: 20,
          borderTop: "1px solid #eee8df",
          textAlign: "center",
          color: "#9b9081",
          fontSize: 12,
        }}
      >
        {user
          ? "ログイン中 · Firestoreに保存"
          : "未ログイン · タスクの保存にはログインが必要です"}
      </footer>
    </main>
  );
}
