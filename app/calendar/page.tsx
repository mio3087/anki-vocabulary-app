
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import {
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";

type StudyTask = {
  id: string;
  date: string;
  title: string;
  target: number;
  unit: "単語" | "ページ" | "分";
  completed: boolean;
};

type StudyLog = {
  date: string;
  words: number;
  pages: number;
  minutes: number;
  note: string;
};

type Exam = {
  id: string;
  name: string;
  date: string;
};

type CalendarData = {
  tasks: StudyTask[];
  logs: StudyLog[];
  exams: Exam[];
};

const STORAGE_KEY = "anki-calendar-data-v1";

const emptyData: CalendarData = {
  tasks: [],
  logs: [],
  exams: [],
};

const weekdayLabels = ["月", "火", "水", "木", "金", "土", "日"];

function dateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function shiftMonth(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function loadLocalData(): CalendarData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyData;

    const parsed = JSON.parse(raw);

    return {
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      logs: Array.isArray(parsed.logs) ? parsed.logs : [],
      exams: Array.isArray(parsed.exams) ? parsed.exams : [],
    };
  } catch {
    return emptyData;
  }
}

export default function CalendarPage() {
  const today = dateString(new Date());

  const [currentMonth, setCurrentMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState(today);

  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [logs, setLogs] = useState<StudyLog[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);

  const [user, setUser] = useState<User | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const [taskTitle, setTaskTitle] = useState("");
  const [taskTarget, setTaskTarget] = useState("20");
  const [taskUnit, setTaskUnit] = useState<StudyTask["unit"]>("単語");

  const [words, setWords] = useState("0");
  const [pages, setPages] = useState("0");
  const [minutes, setMinutes] = useState("0");
  const [note, setNote] = useState("");

  const [examName, setExamName] = useState("");
  const [examDate, setExamDate] = useState("");

  // ログイン状態に応じて保存済みデータを読み込む
  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!active) return;

      setLoaded(false);
      setUser(currentUser);
      setMessage("");

      try {
        let data: CalendarData;

        if (currentUser) {
          const ref = doc(db, "calendarData", currentUser.uid);
          const snapshot = await getDoc(ref);

          if (!active) return;

          if (snapshot.exists()) {
            const saved = snapshot.data();

            data = {
              tasks: Array.isArray(saved.tasks) ? saved.tasks : [],
              logs: Array.isArray(saved.logs) ? saved.logs : [],
              exams: Array.isArray(saved.exams) ? saved.exams : [],
            };
          } else {
            data = emptyData;
          }
        } else {
          data = loadLocalData();
        }

        if (!active) return;

        setTasks(data.tasks);
        setLogs(data.logs);
        setExams(data.exams);
      } catch (error) {
        console.error("カレンダーの読み込みエラー:", error);

        if (!active) return;

        setMessage(
          "保存データを読み込めませんでした。Firestoreのセキュリティルールを確認してください。"
        );

        const data = loadLocalData();
        setTasks(data.tasks);
        setLogs(data.logs);
        setExams(data.exams);
      } finally {
        if (active) setLoaded(true);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  // 変更を保存する
  useEffect(() => {
    if (!loaded) return;

    let active = true;

    async function saveData() {
      const data: CalendarData = { tasks, logs, exams };

      if (!user) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          setMessage("");
        } catch (error) {
          console.error("ローカル保存エラー:", error);
          setMessage("ブラウザへの保存に失敗しました。");
        }
        return;
      }

      setSaving(true);

      try {
        await setDoc(
          doc(db, "calendarData", user.uid),
          {
            ...data,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );

        if (active) setMessage("");
      } catch (error) {
        console.error("Firestore保存エラー:", error);

        if (active) {
          setMessage(
            "Firestoreへの保存に失敗しました。ログイン状態とセキュリティルールを確認してください。"
          );
        }
      } finally {
        if (active) setSaving(false);
      }
    }

    void saveData();

    return () => {
      active = false;
    };
  }, [tasks, logs, exams, loaded, user]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarCells: (string | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) =>
      dateString(new Date(year, month, index + 1))
    ),
  ];

  while (calendarCells.length % 7 !== 0) {
    calendarCells.push(null);
  }

  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;

  const monthTasks = tasks.filter((task) =>
    task.date.startsWith(monthPrefix)
  );

  const monthLogs = logs.filter((log) =>
    log.date.startsWith(monthPrefix)
  );

  const completedTasks = monthTasks.filter((task) => task.completed).length;

  const completionRate =
    monthTasks.length > 0
      ? Math.round((completedTasks / monthTasks.length) * 100)
      : 0;

  const studyDays = new Set(
    monthLogs
      .filter(
        (log) =>
          log.words > 0 || log.pages > 0 || log.minutes > 0
      )
      .map((log) => log.date)
  ).size;

  const totalWords = monthLogs.reduce((sum, log) => sum + log.words, 0);
  const totalPages = monthLogs.reduce((sum, log) => sum + log.pages, 0);
  const totalMinutes = monthLogs.reduce((sum, log) => sum + log.minutes, 0);

  const selectedTasks = tasks.filter(
    (task) => task.date === selectedDate
  );

  const selectedLog = logs.find((log) => log.date === selectedDate);

  const upcomingExams = exams
    .filter((exam) => exam.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));

  function addTask() {
    if (!taskTitle.trim()) {
      setMessage("タスク名を入力してください。");
      return;
    }

    const target = Number(taskTarget);

    if (!Number.isInteger(target) || target < 1) {
      setMessage("目標量は1以上の整数にしてください。");
      return;
    }

    setTasks((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        date: selectedDate,
        title: taskTitle.trim(),
        target,
        unit: taskUnit,
        completed: false,
      },
    ]);

    setTaskTitle("");
    setMessage("");
  }

  function toggleTask(id: string) {
    setTasks((current) =>
      current.map((task) =>
        task.id === id
          ? { ...task, completed: !task.completed }
          : task
      )
    );
  }

  function deleteTask(id: string) {
    setTasks((current) => current.filter((task) => task.id !== id));
  }

  function saveLog() {
    const wordCount = Number(words);
    const pageCount = Number(pages);
    const minuteCount = Number(minutes);

    if (
      ![wordCount, pageCount, minuteCount].every(
        (value) => Number.isInteger(value) && value >= 0
      )
    ) {
      setMessage("学習量は0以上の整数にしてください。");
      return;
    }

    const newLog: StudyLog = {
      date: selectedDate,
      words: wordCount,
      pages: pageCount,
      minutes: minuteCount,
      note: note.trim(),
    };

    setLogs((current) => {
      const others = current.filter((log) => log.date !== selectedDate);
      return [...others, newLog].sort((a, b) =>
        a.date.localeCompare(b.date)
      );
    });

    setMessage("");
  }

  function addExam() {
    if (!examName.trim() || !examDate) {
      setMessage("試験名と試験日を入力してください。");
      return;
    }

    if (exams.length >= 5) {
      setMessage("試験日は最大5件まで登録できます。");
      return;
    }

    setExams((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        name: examName.trim(),
        date: examDate,
      },
    ]);

    setExamName("");
    setExamDate("");
    setMessage("");
  }

  function daysUntil(date: string) {
    const target = new Date(`${date}T12:00:00`);
    const base = new Date(`${today}T12:00:00`);

    return Math.round(
      (target.getTime() - base.getTime()) / (24 * 60 * 60 * 1000)
    );
  }

  const panelStyle = {
    background: "#fffdf6",
    border: "2px solid #302a22",
    borderRadius: 20,
    padding: 18,
    boxShadow: "3px 4px 0 #302a22",
    marginBottom: 22,
  } as const;

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box" as const,
    padding: 11,
    border: "1px solid #cbbd9f",
    borderRadius: 10,
    background: "#fffdf6",
    color: "#302a22",
    fontSize: 15,
    marginTop: 5,
  };

  const buttonStyle = {
    padding: "10px 14px",
    border: "1px solid #302a22",
    borderRadius: 10,
    background: "#302a22",
    color: "#fffdf6",
    fontWeight: 700,
    cursor: "pointer",
  } as const;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#d9c49f",
        color: "#302a22",
        padding: "24px 14px 50px",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Noto Sans JP", sans-serif',
      }}
    >
      <div style={{ maxWidth: 850, margin: "0 auto" }}>
        <header style={{ marginBottom: 24 }}>
          <Link
            href="/"
            style={{ color: "#65412f", fontWeight: 700 }}
          >
            ← 最初のページへ
          </Link>

          <p style={{ marginBottom: 4, marginTop: 22, color: "#71634f" }}>
            STUDY CALENDAR
          </p>

          <h1 style={{ fontSize: 30, margin: "4px 0 8px" }}>
            学習カレンダー
          </h1>

          <p style={{ lineHeight: 1.8, color: "#655947" }}>
            学習予定と実績を記録して、毎月の積み重ねを確認しよう。
          </p>

          <nav style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <Link href="/today" style={{ color: "#65412f" }}>
              今日のノルマ
            </Link>
            <Link href="/plan" style={{ color: "#65412f" }}>
              学習計画
            </Link>
            <Link href="/decks" style={{ color: "#65412f" }}>
              教材・デッキ
            </Link>
          </nav>
        </header>

        {message && (
          <p
            role="alert"
            style={{
              background: "#fff0e8",
              border: "1px solid #a64c3d",
              borderRadius: 12,
              padding: 12,
              color: "#8b2e22",
              lineHeight: 1.7,
            }}
          >
            {message}
          </p>
        )}

        <section style={panelStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              style={buttonStyle}
              onClick={() => setCurrentMonth(shiftMonth(currentMonth, -1))}
            >
              ← 前月
            </button>

            <h2 style={{ fontSize: 23, margin: 0 }}>
              {year}年 {month + 1}月
            </h2>

            <button
              type="button"
              style={buttonStyle}
              onClick={() => setCurrentMonth(shiftMonth(currentMonth, 1))}
            >
              翌月 →
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
              gap: 5,
              marginTop: 18,
            }}
          >
            {weekdayLabels.map((label) => (
              <div
                key={label}
                style={{
                  textAlign: "center",
                  fontWeight: 700,
                  padding: "8px 0",
                  color: "#655947",
                }}
              >
                {label}
              </div>
            ))}

            {calendarCells.map((date, index) => {
              const dayTasks = date
                ? tasks.filter((task) => task.date === date)
                : [];

              const done = dayTasks.filter((task) => task.completed).length;
              const isSelected = date === selectedDate;
              const isToday = date === today;

              return (
                <button
                  key={date ?? `blank-${index}`}
                  type="button"
                  disabled={!date}
                  onClick={() => date && setSelectedDate(date)}
                  style={{
                    minHeight: 76,
                    minWidth: 0,
                    padding: "6px 2px",
                    borderRadius: 10,
                    border: isSelected
                      ? "2px solid #302a22"
                      : "1px solid #d8c8aa",
                    background: !date
                      ? "transparent"
                      : isSelected
                        ? "#ead5ad"
                        : "#fffdf6",
                    color: "#302a22",
                    cursor: date ? "pointer" : "default",
                    textAlign: "center",
                    fontWeight: isToday ? 800 : 500,
                  }}
                >
                  {date && (
                    <>
                      <div>{Number(date.slice(-2))}</div>
                      {isToday && (
                        <div style={{ fontSize: 10 }}>今日</div>
                      )}
                      {dayTasks.length > 0 && (
                        <div
                          style={{
                            fontSize: 10,
                            marginTop: 4,
                            lineHeight: 1.4,
                          }}
                        >
                          {done}/{dayTasks.length} 完了
                        </div>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </div>

          <p style={{ color: "#71634f", fontSize: 13, marginBottom: 0 }}>
            日付を選ぶと、その日のタスクと学習記録を編集できます。
          </p>
        </section>

        <section style={panelStyle}>
          <h2 style={{ marginTop: 0 }}>
            {selectedDate} の学習タスク
          </h2>

          {selectedTasks.length === 0 ? (
            <p style={{ color: "#71634f" }}>まだタスクがありません。</p>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {selectedTasks.map((task) => (
                <div
                  key={task.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    borderBottom: "1px solid #e5d8bf",
                    paddingBottom: 10,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task.id)}
                    aria-label={`${task.title}を完了にする`}
                    style={{ width: 20, height: 20 }}
                  />

                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        textDecoration: task.completed ? "line-through" : "none",
                      }}
                    >
                      {task.title}
                    </div>
                    <small>
                      目標 {task.target.toLocaleString()} {task.unit}
                    </small>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteTask(task.id)}
                    style={{
                      border: "1px solid #a64c3d",
                      background: "#fffdf6",
                      color: "#a64c3d",
                      borderRadius: 8,
                      padding: 7,
                      cursor: "pointer",
                    }}
                  >
                    削除
                  </button>
                </div>
              ))}
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 12,
              marginTop: 20,
            }}
          >
            <label>
              タスク名
              <input
                value={taskTitle}
                onChange={(event) => setTaskTitle(event.target.value)}
                placeholder="例：中国語の単語復習"
                style={inputStyle}
              />
            </label>

            <label>
              目標量
              <input
                type="number"
                min="1"
                step="1"
                value={taskTarget}
                onChange={(event) => setTaskTarget(event.target.value)}
                style={inputStyle}
              />
            </label>

            <label>
              単位
              <select
                value={taskUnit}
                onChange={(event) =>
                  setTaskUnit(event.target.value as StudyTask["unit"])
                }
                style={inputStyle}
              >
                <option value="単語">単語</option>
                <option value="ページ">ページ</option>
                <option value="分">分</option>
              </select>
            </label>
          </div>

          <button
            type="button"
            onClick={addTask}
            style={{ ...buttonStyle, marginTop: 14 }}
          >
            ＋ この日にタスクを追加
          </button>
        </section>

        <section style={panelStyle}>
          <h2 style={{ marginTop: 0 }}>
            {selectedDate} の学習実績
          </h2>

          <p style={{ color: "#71634f", fontSize: 13 }}>
            この日の記録を保存すると、同じ日付の記録が更新されます。
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
              gap: 12,
            }}
          >
            <label>
              学習した単語数
              <input
                type="number"
                min="0"
                step="1"
                value={words}
                onChange={(event) => setWords(event.target.value)}
                style={inputStyle}
              />
            </label>

            <label>
              学習したページ数
              <input
                type="number"
                min="0"
                step="1"
                value={pages}
                onChange={(event) => setPages(event.target.value)}
                style={inputStyle}
              />
            </label>

            <label>
              学習時間（分）
              <input
                type="number"
                min="0"
                step="1"
                value={minutes}
                onChange={(event) => setMinutes(event.target.value)}
                style={inputStyle}
              />
            </label>
          </div>

          <label style={{ display: "block", marginTop: 14 }}>
            メモ
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="例：第3課を復習。苦手な単語を重点的に確認。"
              rows={3}
              style={inputStyle}
            />
          </label>

          <button
            type="button"
            onClick={saveLog}
            style={{ ...buttonStyle, marginTop: 14 }}
          >
            学習実績を記録する
          </button>

          {selectedLog && (
            <p style={{ color: "#655947", marginBottom: 0 }}>
              現在保存されている記録：単語 {selectedLog.words}・ページ{" "}
              {selectedLog.pages}・{selectedLog.minutes} 分
            </p>
          )}
        </section>

        <section style={panelStyle}>
          <h2 style={{ marginTop: 0 }}>試験日カウントダウン</h2>
          <p style={{ color: "#71634f" }}>
            最大5件まで登録できます。
          </p>

          {exams.length === 0 ? (
            <p>試験日はまだ登録されていません。</p>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {exams
                .slice()
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((exam) => {
                  const remaining = daysUntil(exam.date);

                  return (
                    <div
                      key={exam.id}
                      style={{
                        padding: 14,
                        borderRadius: 12,
                        background: "#f3e7cf",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <div>
                        <strong>{exam.name}</strong>
                        <div style={{ fontSize: 13, marginTop: 4 }}>
                          {exam.date}
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <strong style={{ fontSize: 20 }}>
                          {remaining === 0
                            ? "今日！"
                            : `あと ${remaining} 日`}
                        </strong>
                        <div>
                          <button
                            type="button"
                            onClick={() =>
                              setExams((current) =>
                                current.filter((item) => item.id !== exam.id)
                              )
                            }
                            style={{
                              border: "none",
                              background: "transparent",
                              color: "#a64c3d",
                              cursor: "pointer",
                              padding: "5px 0",
                            }}
                          >
                            削除
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {exams.length < 5 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: 12,
                marginTop: 18,
              }}
            >
              <label>
                試験名
                <input
                  value={examName}
                  onChange={(event) => setExamName(event.target.value)}
                  placeholder="例：HSK試験"
                  style={inputStyle}
                />
              </label>

              <label>
                試験日
                <input
                  type="date"
                  min={today}
                  value={examDate}
                  onChange={(event) => setExamDate(event.target.value)}
                  style={inputStyle}
                />
              </label>
            </div>
          )}

          {exams.length < 5 && (
            <button
              type="button"
              onClick={addExam}
              style={{ ...buttonStyle, marginTop: 14 }}
            >
              ＋ 試験日を登録
            </button>
          )}
        </section>

        <section style={panelStyle}>
          <h2 style={{ marginTop: 0 }}>
            {year}年{month + 1}月の学習統計
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(135px, 1fr))",
              gap: 12,
            }}
          >
            {[
              { label: "学習した日数", value: `${studyDays} 日` },
              { label: "タスク完了率", value: `${completionRate}%` },
              { label: "学習単語数", value: totalWords.toLocaleString() },
              { label: "学習ページ数", value: totalPages.toLocaleString() },
              {
                label: "学習時間",
                value: `${Math.floor(totalMinutes / 60)}時間${totalMinutes % 60}分`,
              },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  background: "#f3e7cf",
                  borderRadius: 14,
                  padding: 14,
                }}
              >
                <div style={{ fontSize: 13, color: "#71634f" }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 23, fontWeight: 800, marginTop: 6 }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 13, color: "#71634f", marginBottom: 0 }}>
            タスク完了率は、今月登録したタスクのうち完了した割合です。
          </p>
        </section>

        {upcomingExams.length > 0 && (
          <section style={{ ...panelStyle, marginBottom: 22 }}>
            <h2 style={{ marginTop: 0 }}>次の試験</h2>
            {upcomingExams.slice(0, 3).map((exam) => (
              <p key={exam.id}>
                <strong>{exam.name}</strong>：あと {daysUntil(exam.date)} 日
              </p>
            ))}
          </section>
        )}

        
        <footer style={{ textAlign: "center", color: "#655947" }}>
  {!loaded
    ? "保存データを読み込み中..."
    : saving
      ? "Firestoreに保存中..."
      : user
        ? "ログイン中：Firestore保存"
        : "未ログイン：このブラウザに保存"}
</footer>


        <nav
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 16,
            marginTop: 24,
          }}
        >
          <Link href="/" style={{ color: "#65412f" }}>
            最初のページ
          </Link>
          <Link href="/today" style={{ color: "#65412f" }}>
            今日のノルマ
          </Link>
          <Link href="/plan" style={{ color: "#65412f" }}>
            学習計画
          </Link>
        </nav>
      </div>
    </main>
  );
}
