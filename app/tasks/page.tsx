
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

  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });
  }, []);

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
        setError("タスクを読み込めませんでした。Firestoreのルールを確認してください。");
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

  const saveTask = async (event: React.FormEvent<HTMLFormElement>) => {
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
      setError("保存できませんでした。Firestoreのルールや通信状態を確認してください。");
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

  const changeStatus = async (task: StudyTask, status: TaskStatus) => {
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
    border: "1px solid #d6ccbd",
    borderRadius: 8,
    background: "#fffdf9",
    color: "#332d25",
    fontSize: 14,
  };

  const buttonStyle: React.CSSProperties = {
    padding: "9px 14px",
    border: "1px solid #cfc3b2",
    borderRadius: 8,
    background: "#f5efe5",
    color: "#332d25",
    cursor: "pointer",
  };

  return (
    <main style={pageStyle}>
      <header style={{ marginBottom: 24 }}>
        <p style={{ color: "#8b7355", marginBottom: 4 }}>ANKI / STUDY</p>
        <h1 style={{ fontSize: 30, margin: "0 0 8px" }}>タスク管理</h1>
        <p style={{ color: "#71685d", margin: 0 }}>
          学習タスクをまとめて管理し、毎日の勉強を進めましょう。
        </p>
      </header>
      
      <nav
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 24,
        }}
      >
        <Link href="/">🏠 デッキ一覧に戻る</Link>

        <Link
          href="/plan"
        >
          📅 学習計画へ戻る
        </Link>
      </nav>


      {!authReady && <p>ログイン状態を確認しています...</p>}

      {authReady && !user && (
        <section
          style={{
            padding: 16,
            borderRadius: 12,
            background: "#fff4df",
            marginBottom: 20,
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
            padding: 12,
            background: "#fff0ed",
            color: "#9b3025",
            borderRadius: 8,
          }}
        >
          {error}
        </p>
      )}

      <section
        style={{
          border: "1px solid #e4dbce",
          borderRadius: 14,
          padding: 18,
          marginBottom: 24,
          background: "#fffdf9",
        }}
      >
        <h2 style={{ fontSize: 20, marginTop: 0 }}>
          {editingId ? "タスクを編集" : "新しいタスクを登録"}
        </h2>

        <form onSubmit={saveTask}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 14,
            }}
          >
            <label>
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

            <label>
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

            <label>
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

            <label>
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

            <label>
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

            <label>
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

            <label>
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

            <label>
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

            <label>
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
                marginTop: 16,
                border: "1px solid #e4dbce",
                borderRadius: 8,
              }}
            >
              <legend>繰り返す曜日</legend>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                {weekdays.map((day, index) => (
                  <label key={day}>
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
                <p style={{ color: "#9b3025", fontSize: 13 }}>
                  曜日を1つ以上選んでください。
                </p>
              )}
            </fieldset>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <button
              type="submit"
              disabled={!user || saving || (form.repeat === "毎週" && form.repeatDays.length === 0)}
              style={{
                ...buttonStyle,
                background: "#655947",
                color: "white",
                opacity: !user || saving ? 0.6 : 1,
              }}
            >
              {saving ? "保存中..." : editingId ? "変更を保存" : "タスクを登録"}
            </button>

            {editingId && (
              <button type="button" onClick={resetForm} style={buttonStyle}>
                編集をキャンセル
              </button>
            )}
          </div>
        </form>
      </section>

      <section>
        <h2 style={{ fontSize: 22 }}>タスク一覧</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 10,
            marginBottom: 16,
          }}
        >
          <label>
            状態・日付で絞り込み
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

          <label>
            実施予定日で絞り込み
            <input
              style={inputStyle}
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </label>

          <label>
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
          <p>タスクを読み込んでいます...</p>
        ) : !user ? (
          <p>ログインすると保存済みのタスクが表示されます。</p>
        ) : visibleTasks.length === 0 ? (
          <p
            style={{
              padding: 24,
              textAlign: "center",
              background: "#f8f4ed",
              borderRadius: 12,
            }}
          >
            該当するタスクはありません。上のフォームから登録できます。
          </p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {visibleTasks.map((task) => (
              <article
                key={task.id}
                style={{
                  border: "1px solid #e4dbce",
                  borderRadius: 12,
                  padding: 16,
                  background: "#fffdf9",
                  opacity: task.status === "完了" ? 0.72 : 1,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ flex: "1 1 220px" }}>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 8,
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
                      />
                      <strong
                        style={{
                          textDecoration:
                            task.status === "完了" ? "line-through" : "none",
                        }}
                      >
                        {task.title}
                      </strong>
                    </label>

                    <p style={{ color: "#71685d", fontSize: 14 }}>
                      {task.type}
                      {task.material ? ` ・ ${task.material}` : ""}
                      {` ・ 目標 ${task.target}${task.unit}`}
                    </p>

                    <p style={{ fontSize: 13, marginBottom: 0 }}>
                      実施日：{task.scheduledDate || "未設定"}
                      {" ・ "}期限：{task.dueDate || "未設定"}
                    </p>

                    <p style={{ fontSize: 13, color: "#71685d" }}>
                      繰り返し：{task.repeat}
                      {task.repeat === "毎週" && task.repeatDays.length > 0
                        ? `（${task.repeatDays.map((d) => weekdays[d]).join("・")}）`
                        : ""}
                    </p>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                    }}
                  >
                    <select
                      aria-label={`${task.title}の状態`}
                      style={{ ...inputStyle, width: 120 }}
                      value={task.status}
                      onChange={(e) =>
                        changeStatus(task, e.target.value as TaskStatus)
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
                      style={buttonStyle}
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
          marginTop: 28,
          textAlign: "center",
          color: "#71685d",
          fontSize: 13,
        }}
      >
        {user
          ? "ログイン中：Firestoreに保存"
          : "未ログイン：タスクの保存にはログインが必要です"}
      </footer>
    </main>
  );
}
