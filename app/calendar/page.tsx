
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
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
const WEEKDAYS = ["月", "火", "水", "木", "金", "土", "日"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const EMPTY_DATA: CalendarData = {
  tasks: [],
  logs: [],
  exams: [],
};

function dateString(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function shiftMonth(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function readLocalData(): CalendarData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_DATA;

    const parsed = JSON.parse(raw);

    return {
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      logs: Array.isArray(parsed.logs) ? parsed.logs : [],
      exams: Array.isArray(parsed.exams) ? parsed.exams : [],
    };
  } catch {
    return EMPTY_DATA;
  }
}

function formatDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return `${year}年${month}月${day}日`;
}

function daysBetween(from: string, to: string) {
  const a = new Date(`${from}T12:00:00`);
  const b = new Date(`${to}T12:00:00`);
  return Math.round((b.getTime() - a.getTime()) / 86400000);
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
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [taskTitle, setTaskTitle] = useState("");
  const [taskTarget, setTaskTarget] = useState("20");
  const [taskUnit, setTaskUnit] = useState<StudyTask["unit"]>("単語");

  const [words, setWords] = useState("0");
  const [pages, setPages] = useState("0");
  const [minutes, setMinutes] = useState("0");
  const [note, setNote] = useState("");

  const [examName, setExamName] = useState("");
  const [examDate, setExamDate] = useState("");

  const [menuOpen, setMenuOpen] = useState(false);
  // Authentication and initial data loading
  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!active) return;

      setLoaded(false);
      setUser(currentUser);
      setMessage("");

      try {
        let data = EMPTY_DATA;

        if (currentUser) {
          const snapshot = await getDoc(
            doc(db, "calendarData", currentUser.uid)
          );

          if (!active) return;

          if (snapshot.exists()) {
            const saved = snapshot.data();
            data = {
              tasks: Array.isArray(saved.tasks) ? saved.tasks : [],
              logs: Array.isArray(saved.logs) ? saved.logs : [],
              exams: Array.isArray(saved.exams) ? saved.exams : [],
            };
          }
        } else {
          data = readLocalData();
        }

        if (!active) return;

        setTasks(data.tasks);
        setLogs(data.logs);
        setExams(data.exams);
      } catch (error) {
        console.error("Calendar loading error:", error);

        if (!active) return;

        setMessage("データを読み込めませんでした。保存先の設定をご確認ください。");

        const fallback = readLocalData();
        setTasks(fallback.tasks);
        setLogs(fallback.logs);
        setExams(fallback.exams);
      } finally {
        if (active) setLoaded(true);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  // Save changes
  useEffect(() => {
    if (!loaded) return;

    let active = true;

    async function saveData() {
      const data: CalendarData = { tasks, logs, exams };

      if (!user) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          if (active) setMessage("");
        } catch (error) {
          console.error("Local save error:", error);
          if (active) setMessage("ブラウザへの保存に失敗しました。");
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
        console.error("Firestore save error:", error);

        if (active) {
          setMessage("保存に失敗しました。ログイン状態と保存先の設定をご確認ください。");
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

  // Reflect the selected day's saved log in the editor
  const selectedLog = logs.find((log) => log.date === selectedDate);

  useEffect(() => {
    setWords(String(selectedLog?.words ?? 0));
    setPages(String(selectedLog?.pages ?? 0));
    setMinutes(String(selectedLog?.minutes ?? 0));
    setNote(selectedLog?.note ?? "");
  }, [selectedDate, selectedLog?.words, selectedLog?.pages,
      selectedLog?.minutes, selectedLog?.note]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;

  const calendarCells = useMemo(() => {
    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: (string | null)[] = [
      ...Array.from({ length: firstWeekday }, () => null),
      ...Array.from({ length: daysInMonth }, (_, index) =>
        dateString(new Date(year, month, index + 1))
      ),
    ];

    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [year, month]);

  const monthTasks = tasks.filter((task) => task.date.startsWith(monthPrefix));
  const monthLogs = logs.filter((log) => log.date.startsWith(monthPrefix));
  const completedTasks = monthTasks.filter((task) => task.completed).length;

  const completionRate = monthTasks.length
    ? Math.round((completedTasks / monthTasks.length) * 100)
    : 0;

  const studyDays = new Set(
    monthLogs
      .filter((log) => log.words > 0 || log.pages > 0 || log.minutes > 0)
      .map((log) => log.date)
  ).size;

  const totalWords = monthLogs.reduce((sum, log) => sum + log.words, 0);
  const totalPages = monthLogs.reduce((sum, log) => sum + log.pages, 0);
  const totalMinutes = monthLogs.reduce((sum, log) => sum + log.minutes, 0);

  const selectedTasks = tasks.filter((task) => task.date === selectedDate);
  const selectedDone = selectedTasks.filter((task) => task.completed).length;

  const selectedHasStudy = Boolean(
    selectedLog &&
    (selectedLog.words > 0 || selectedLog.pages > 0 || selectedLog.minutes > 0)
  );

  const sortedExams = [...exams].sort((a, b) => a.date.localeCompare(b.date));
  const upcomingExams = sortedExams.filter((exam) => exam.date >= today);

  function goToToday() {
    setCurrentMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    setSelectedDate(today);
  }

  function selectDay(date: string) {
    setSelectedDate(date);
    setMessage("");
  }

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
        task.id === id ? { ...task, completed: !task.completed } : task
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

    if (![wordCount, pageCount, minuteCount].every(
      (value) => Number.isInteger(value) && value >= 0
    )) {
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

    setLogs((current) => [
      ...current.filter((log) => log.date !== selectedDate),
      newLog,
    ].sort((a, b) => a.date.localeCompare(b.date)));

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
      { id: crypto.randomUUID(), name: examName.trim(), date: examDate },
    ]);

    setExamName("");
    setExamDate("");
    setMessage("");
  }

  function deleteExam(id: string) {
    setExams((current) => current.filter((exam) => exam.id !== id));
  }

  const inputClass = "field";
  const selectedDateLabel = formatDate(selectedDate);

  return (
    <main className="calendar-page">
      <div className="shell">
        
<header className="topbar">
  <Link href="/" className="brand">
    <span className="brand-mark">a.</span>
    <span>
      ANKI <span className="brand-muted">/ YOUR LEARNING</span>
    </span>
  </Link>
</header>

<button
  type="button"
  className={`anki-menu-trigger ${menuOpen ? "is-open" : ""}`}
  onClick={() => setMenuOpen((open) => !open)}
  aria-label={menuOpen ? "メニューを閉じる" : "メニューを開く"}
  aria-expanded={menuOpen}
  aria-controls="anki-global-menu"
>
  <span />
  <span />
  <span />
</button>

{menuOpen && (
  <>
    <button
      type="button"
      className="anki-menu-overlay"
      aria-label="メニューを閉じる"
      onClick={() => setMenuOpen(false)}
    />

    <nav
      id="anki-global-menu"
      className="anki-menu-panel"
      aria-label="共通ナビゲーション"
    >
      <div className="anki-menu-heading">
        <span className="anki-menu-logo">a.</span>
        <div>
          <strong>ANKI</strong>
          <span>YOUR LEARNING SPACE</span>
        </div>
      </div>

      <div className="anki-menu-section">YOUR ANKI</div>

      {[
        { href: "/", icon: "⌂", label: "ホーム" },
        { href: "/today", icon: "✳", label: "今日のノルマ" },
        { href: "/calendar", icon: "▦", label: "学習カレンダー" },
        { href: "/tasks", icon: "✓", label: "タスク管理" },
        { href: "/plan", icon: "↗", label: "学習計画" },
        { href: "/decks", icon: "▤", label: "単語デッキ" },
        { href: "/little-moments", icon: "🐾", label: "Little Moments" },
      ].map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`anki-menu-link ${
            item.href === "/calendar" ? "anki-menu-active" : ""
          }`}
          onClick={() => setMenuOpen(false)}
        >
          <span className="anki-menu-icon">{item.icon}</span>
          <span>{item.label}</span>
          {item.href === "/calendar" && (
            <span className="anki-menu-current">CURRENT</span>
          )}
        </Link>
      ))}

      <div className="anki-menu-footer">
        Make progress, one little step at a time.
      </div>
    </nav>
  </>
)}


        <section className="hero">
          <div>
            <p className="eyebrow">YOUR PERSONAL LEARNING SPACE</p>
            <h1>Calendar<span className="title-period">.</span></h1>
            <p className="hero-description">
              小さな積み重ねが、未来の自分をつくる。
            </p>
          </div>

          <button className="button button-primary hero-today" onClick={goToToday}>
            <span aria-hidden="true">↗</span> 今日に戻る
          </button>
        </section>

        {message && (
          <div className="notice" role="alert">
            <span>!</span> {message}
            <button onClick={() => setMessage("")} aria-label="メッセージを閉じる">
              ×
            </button>
          </div>
        )}

        {!loaded ? (
          <div className="loading">
            <span className="loading-dot" />
            学習データを読み込んでいます…
          </div>
        ) : (
          <>
            <section className="stats-grid" aria-label="今月の学習サマリー">
              <article className="stat-card">
                <div className="stat-top">
                  <span className="stat-label">STUDY DAYS</span>
                  <span className="stat-icon">◷</span>
                </div>
                <div className="stat-value">{studyDays}<span> 日</span></div>
                <div className="stat-caption">今月、学習した日数</div>
              </article>

              <article className="stat-card">
                <div className="stat-top">
                  <span className="stat-label">TASK COMPLETION</span>
                  <span className="stat-icon">✓</span>
                </div>
                <div className="stat-value">{completionRate}<span>%</span></div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${completionRate}%` }} />
                </div>
                <div className="stat-caption">{completedTasks} / {monthTasks.length} タスク完了</div>
              </article>

              <article className="stat-card">
                <div className="stat-top">
                  <span className="stat-label">VOCABULARY</span>
                  <span className="stat-icon">文</span>
                </div>
                <div className="stat-value">{totalWords.toLocaleString()}</div>
                <div className="stat-caption">今月、学習した単語</div>
              </article>

              <article className="stat-card">
                <div className="stat-top">
                  <span className="stat-label">STUDY TIME</span>
                  <span className="stat-icon">◷</span>
                </div>
                <div className="stat-value">
                  {Math.floor(totalMinutes / 60)}
                  <span> h </span>
                  {totalMinutes % 60}
                  <span> m</span>
                </div>
                <div className="stat-caption">
                  {totalPages.toLocaleString()} ページ学習
                </div>
              </article>
            </section>

            <section className="calendar-card">
              <div className="calendar-heading">
                <div>
                  <p className="eyebrow">YOUR SCHEDULE</p>
                  <h2>{MONTHS[month]} <span>{year}</span></h2>
                  <p className="muted">{year}年{month + 1}月の学習予定と記録</p>
                </div>

                <div className="month-controls">
                  <button
                    className="icon-button"
                    onClick={() => setCurrentMonth(shiftMonth(currentMonth, -1))}
                    aria-label="前の月"
                  >‹</button>
                  <button className="button button-subtle" onClick={goToToday}>
                    今日
                  </button>
                  <button
                    className="icon-button"
                    onClick={() => setCurrentMonth(shiftMonth(currentMonth, 1))}
                    aria-label="次の月"
                  >›</button>
                </div>
              </div>

              <div className="calendar-grid">
                {WEEKDAYS.map((day, index) => (
                  <div
                    key={day}
                    className={`weekday ${index === 5 ? "saturday" : ""} ${index === 6 ? "sunday" : ""}`}
                  >
                    {day}
                  </div>
                ))}

                {calendarCells.map((date, index) => {
                  if (!date) {
                    return <div className="day-cell day-empty" key={`empty-${index}`} />;
                  }

                  const dayTasks = tasks.filter((task) => task.date === date);
                  const done = dayTasks.filter((task) => task.completed).length;
                  const dayLog = logs.find((log) => log.date === date);
                  const dayExams = exams.filter((exam) => exam.date === date);
                  const hasStudy = Boolean(
                    dayLog &&
                    (dayLog.words > 0 || dayLog.pages > 0 || dayLog.minutes > 0)
                  );
                  const isSelected = date === selectedDate;
                  const isToday = date === today;
                  const dayNumber = Number(date.slice(-2));
                  const weekday = (new Date(`${date}T12:00:00`).getDay() + 6) % 7;

                  return (
                    <button
                      key={date}
                      type="button"
                      onClick={() => selectDay(date)}
                      aria-pressed={isSelected}
                      aria-label={`${formatDate(date)}${isToday ? "、今日" : ""}`}
                      className={[
                        "day-cell",
                        isSelected ? "day-selected" : "",
                        isToday ? "day-today" : "",
                        weekday === 5 ? "day-saturday" : "",
                        weekday === 6 ? "day-sunday" : "",
                      ].filter(Boolean).join(" ")}
                    >
                      <span className="day-number">{dayNumber}</span>
                      {isToday && <span className="today-label">TODAY</span>}

                      <div className="day-markers">
                        {hasStudy && <span className="marker marker-study" title="学習記録あり" />}
                        {dayTasks.length > 0 && (
                          <span className={`marker marker-task ${done === dayTasks.length ? "marker-done" : ""}`} title="タスクあり" />
                        )}
                        {dayExams.length > 0 && <span className="marker marker-exam" title="試験日" />}
                      </div>

                      {dayTasks.length > 0 && (
                        <span className="day-task-count">{done}/{dayTasks.length}</span>
                      )}

                      {dayExams.length > 0 && (
                        <span className="day-exam-label">試験</span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="calendar-legend">
                <span><i className="legend-dot legend-study" /> 学習記録</span>
                <span><i className="legend-dot legend-task" /> タスク</span>
                <span><i className="legend-dot legend-exam" /> 試験日</span>
              </div>
            </section>

            <div className="content-grid">
              <section className="panel tasks-panel">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">DAILY FOCUS</p>
                    <h2>今日のタスク</h2>
                    <p className="muted">{selectedDateLabel}</p>
                  </div>
                  <span className="count-pill">
                    {selectedDone}/{selectedTasks.length}
                  </span>
                </div>

                {selectedTasks.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon">＋</span>
                    <p>まだタスクがありません</p>
                    <span>下のフォームから予定を追加できます。</span>
                  </div>
                ) : (
                  <div className="task-list">
                    {selectedTasks.map((task) => (
                      <div className="task-row" key={task.id}>
                        <input
                          className="task-checkbox"
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => toggleTask(task.id)}
                          aria-label={`${task.title}を完了にする`}
                        />
                        <div className="task-content">
                          <span className={`task-title ${task.completed ? "task-completed" : ""}`}>
                            {task.title}
                          </span>
                          <span className="task-meta">
                            目標 {task.target.toLocaleString()} {task.unit}
                          </span>
                        </div>
                        <button
                          className="text-button danger"
                          onClick={() => deleteTask(task.id)}
                        >
                          削除
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="form-divider" />
                <h3 className="form-title">タスクを追加</h3>

                <form
                  className="stack-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    addTask();
                  }}
                >
                  <label className="form-field">
                    <span>タスク名</span>
                    <input
                      className={inputClass}
                      value={taskTitle}
                      onChange={(event) => setTaskTitle(event.target.value)}
                      placeholder="例：中国語の単語復習"
                      maxLength={120}
                    />
                  </label>

                  <div className="form-row">
                    <label className="form-field">
                      <span>目標量</span>
                      <input
                        className={inputClass}
                        type="number"
                        min="1"
                        step="1"
                        value={taskTarget}
                        onChange={(event) => setTaskTarget(event.target.value)}
                      />
                    </label>

                    <label className="form-field">
                      <span>単位</span>
                      <select
                        className={inputClass}
                        value={taskUnit}
                        onChange={(event) => setTaskUnit(event.target.value as StudyTask["unit"])}
                      >
                        <option value="単語">単語</option>
                        <option value="ページ">ページ</option>
                        <option value="分">分</option>
                      </select>
                    </label>
                  </div>

                  <button className="button button-primary button-full" type="submit">
                    ＋ タスクを追加
                  </button>
                </form>
              </section>

              <section className="panel log-panel">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">DAILY JOURNAL</p>
                    <h2>学習の記録</h2>
                    <p className="muted">{selectedDateLabel}</p>
                  </div>
                  <span className="journal-icon">✎</span>
                </div>

                <p className="section-description">
                  できたことを記録し、小さな進歩を残しましょう。
                </p>

                <form
                  className="stack-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    saveLog();
                  }}
                >
                  <div className="form-row three-columns">
                    <label className="form-field">
                      <span>単語数</span>
                      <input
                        className={inputClass}
                        type="number"
                        min="0"
                        step="1"
                        value={words}
                        onChange={(event) => setWords(event.target.value)}
                      />
                    </label>
                    <label className="form-field">
                      <span>ページ数</span>
                      <input
                        className={inputClass}
                        type="number"
                        min="0"
                        step="1"
                        value={pages}
                        onChange={(event) => setPages(event.target.value)}
                      />
                    </label>
                    <label className="form-field">
                      <span>時間（分）</span>
                      <input
                        className={inputClass}
                        type="number"
                        min="0"
                        step="1"
                        value={minutes}
                        onChange={(event) => setMinutes(event.target.value)}
                      />
                    </label>
                  </div>

                  <label className="form-field">
                    <span>今日のメモ</span>
                    <textarea
                      className={`${inputClass} note-field`}
                      rows={4}
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      placeholder="今日できたこと、気づいたこと、次にやりたいこと…"
                      maxLength={2000}
                    />
                  </label>

                  <button className="button button-primary button-full" type="submit">
                    記録を保存する
                  </button>
                </form>

                {selectedHasStudy && (
                  <div className="saved-indicator">
                    <span className="saved-dot" />
                    この日の学習記録を保存済み
                  </div>
                )}
              </section>
            </div>

            <section className="panel exams-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">UPCOMING MILESTONES</p>
                  <h2>試験日カウントダウン</h2>
                  <p className="muted">目標の日まで、一歩ずつ。</p>
                </div>
                <span className="milestone-icon">◎</span>
              </div>

              {sortedExams.length === 0 ? (
                <div className="empty-state exam-empty">
                  <span className="empty-icon">◎</span>
                  <p>試験日を登録してみましょう</p>
                  <span>大切な目標をカレンダーに残せます。</span>
                </div>
              ) : (
                <div className="exam-list">
                  {sortedExams.map((exam) => {
                    const remaining = daysBetween(today, exam.date);
                    const past = remaining < 0;

                    return (
                      <article className="exam-row" key={exam.id}>
                        <div className="exam-date-block">
                          <span>{Number(exam.date.slice(5, 7))}月</span>
                          <strong>{Number(exam.date.slice(8, 10))}</strong>
                        </div>
                        <div className="exam-info">
                          <strong>{exam.name}</strong>
                          <span>{exam.date.replaceAll("-", " / ")}</span>
                        </div>
                        <div className="exam-countdown">
                          <strong>
                            {remaining === 0 ? "今日！" : past ? `${Math.abs(remaining)}日前` : `あと ${remaining} 日`}
                          </strong>
                          <span>{past ? "終了した試験" : remaining === 0 ? "本番の日" : "KEEP GOING"}</span>
                        </div>
                        <button
                          className="text-button danger"
                          onClick={() => deleteExam(exam.id)}
                        >
                          削除
                        </button>
                      </article>
                    );
                  })}
                </div>
              )}

              {exams.length < 5 && (
                <>
                  <div className="form-divider" />
                  <form
                    className="exam-form"
                    onSubmit={(event) => {
                      event.preventDefault();
                      addExam();
                    }}
                  >
                    <label className="form-field">
                      <span>試験名</span>
                      <input
                        className={inputClass}
                        value={examName}
                        onChange={(event) => setExamName(event.target.value)}
                        placeholder="例：TOCFL CAT"
                        maxLength={100}
                      />
                    </label>
                    <label className="form-field">
                      <span>試験日</span>
                      <input
                        className={inputClass}
                        type="date"
                        min={today}
                        value={examDate}
                        onChange={(event) => setExamDate(event.target.value)}
                      />
                    </label>
                    <button className="button button-primary exam-add-button" type="submit">
                      ＋ 試験日を登録
                    </button>
                  </form>
                  <p className="form-hint">{exams.length}/5 件登録済み</p>
                </>
              )}
            </section>

            {upcomingExams.length > 0 && (
              <section className="next-exam">
                <div className="next-exam-symbol">✦</div>
                <div className="next-exam-copy">
                  <span className="eyebrow">YOUR NEXT MILESTONE</span>
                  <h2>{upcomingExams[0].name}</h2>
                  <p>{formatDate(upcomingExams[0].date)} に向けて準備中</p>
                </div>
                <div className="next-exam-days">
                  <strong>{daysBetween(today, upcomingExams[0].date)}</strong>
                  <span>DAYS TO GO</span>
                </div>
              </section>
            )}
          </>
        )}

        <footer className="footer">
          <div className="footer-brand">a.</div>
          <p>Make progress, one little step at a time.</p>
          <div className="save-status">
            <span className={`status-dot ${saving ? "status-saving" : ""}`} />
            {!loaded
              ? "読み込み中"
              : saving
                ? "保存中…"
                : user
                  ? "クラウドに保存"
                  : "このブラウザに保存"}
          </div>
          <nav className="footer-links">
            <Link href="/">ホーム</Link>
            <Link href="/today">今日のノルマ</Link>
            <Link href="/plan">学習計画</Link>
            <Link href="/decks">教材・デッキ</Link>
          </nav>
        </footer>
      </div>

      <style jsx>{`
        :global(*) {
          box-sizing: border-box;
        }

        .calendar-page {
          --bg: #f6f6f3;
          --surface: #ffffff;
          --text: #242522;
          --muted: #8a8c85;
          --line: #e9e9e4;
          --accent: #303c32;
          --accent-soft: #edf1e9;
          --green: #81977b;
          --orange: #d6a06a;
          min-height: 100vh;
          padding: 0 24px 60px;
          background: var(--bg);
          color: var(--text);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
            "Noto Sans JP", sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        .shell {
          width: 100%;
          max-width: 1120px;
          margin: 0 auto;
        }

        .topbar {
          min-height: 72px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          border-bottom: 1px solid var(--line);
        }

        .brand {
          display: inline-flex;
          align-items: center;
          gap: 11px;
          color: var(--text);
          font-size: 12px;
          font-weight: 750;
          letter-spacing: .13em;
          text-decoration: none;
        }

        .brand-mark, .footer-brand {
          display: inline-grid;
          place-items: center;
          width: 32px;
          height: 32px;
          border-radius: 10px;
          background: var(--accent);
          color: white;
          font-size: 19px;
          letter-spacing: -2px;
          font-weight: 750;
        }

        .brand-muted {
          color: var(--muted);
          font-weight: 500;
          letter-spacing: .07em;
        }

        .top-links, .footer-links {
          display: flex;
          align-items: center;
          gap: 24px;
          flex-wrap: wrap;
        }

        .top-links a, .footer-links a {
          color: #777970;
          font-size: 12px;
          text-decoration: none;
          transition: color .15s;
        }

        .top-links a:hover, .footer-links a:hover {
          color: var(--text);
        }

        .hero {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 20px;
          padding: 44px 0 30px;
        }

        .eyebrow {
          margin: 0 0 10px;
          color: #85877e;
          font-size: 10px;
          font-weight: 750;
          letter-spacing: .16em;
        }

        .hero h1 {
          margin: 0;
          font-size: clamp(35px, 5vw, 49px);
          line-height: 1.08;
          font-weight: 650;
          letter-spacing: -.055em;
        }

        .title-period {
          color: #91a188;
        }

        .hero-description {
          margin: 13px 0 0;
          color: #85877e;
          font-size: 13px;
          line-height: 1.8;
        }

        .button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 40px;
          padding: 0 16px;
          border: 1px solid transparent;
          border-radius: 11px;
          font: inherit;
          font-size: 12px;
          font-weight: 650;
          cursor: pointer;
          transition: background .15s, transform .15s, border-color .15s;
        }

        .button:active, .icon-button:active {
          transform: scale(.98);
        }

        .button-primary {
          background: var(--accent);
          color: #fff;
        }

        .button-primary:hover {
          background: #465749;
        }

        .button-subtle {
          border-color: var(--line);
          background: #fff;
          color: #50534b;
        }

        .button-subtle:hover, .icon-button:hover {
          background: #f4f5f0;
        }

        .hero-today {
          flex-shrink: 0;
          margin-bottom: 3px;
        }

        .notice {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 18px;
          padding: 12px 14px;
          border: 1px solid #ead6cb;
          border-radius: 12px;
          background: #fff8f3;
          color: #915741;
          font-size: 12px;
          line-height: 1.7;
        }

        .notice > span {
          display: grid;
          place-items: center;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #f5e5da;
          font-weight: 750;
        }

        .notice button {
          margin-left: auto;
          border: 0;
          background: transparent;
          color: inherit;
          font-size: 19px;
          cursor: pointer;
        }

        .loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          min-height: 220px;
          color: var(--muted);
          font-size: 13px;
        }

        .loading-dot, .status-dot, .saved-dot {
          display: inline-block;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #89a182;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 20px;
        }

        .stat-card, .calendar-card, .panel {
          border: 1px solid var(--line);
          border-radius: 18px;
          background: var(--surface);
          box-shadow: 0 2px 8px rgba(33, 37, 30, .018);
        }

        .stat-card {
          min-width: 0;
          padding: 20px;
        }

        .stat-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .stat-label {
          color: #8b8d85;
          font-size: 9px;
          font-weight: 750;
          letter-spacing: .11em;
        }

        .stat-icon {
          display: grid;
          place-items: center;
          width: 29px;
          height: 29px;
          border-radius: 9px;
          background: #f3f4ef;
          color: #65745e;
          font-size: 14px;
        }

        .stat-value {
          margin-top: 18px;
          font-size: clamp(24px, 3vw, 31px);
          line-height: 1.1;
          font-weight: 650;
          letter-spacing: -.045em;
          overflow-wrap: anywhere;
        }

        .stat-value > span {
          color: #777a71;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0;
        }

        .stat-caption {
          margin-top: 9px;
          color: #96978f;
          font-size: 11px;
          line-height: 1.6;
        }

        .progress-track {
          height: 4px;
          margin-top: 13px;
          overflow: hidden;
          border-radius: 10px;
          background: #eff0eb;
        }

        .progress-fill {
          height: 100%;
          border-radius: inherit;
          background: #8da085;
          transition: width .25s;
        }

        .calendar-card {
          padding: 28px;
        }

        .calendar-heading, .panel-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .calendar-heading h2 {
          margin: 0;
          font-size: 25px;
          line-height: 1.3;
          font-weight: 650;
          letter-spacing: -.04em;
        }

        .calendar-heading h2 span {
          color: #9a9b94;
          font-size: 15px;
          font-weight: 450;
          letter-spacing: 0;
        }

        .muted {
          margin: 7px 0 0;
          color: #96978f;
          font-size: 11px;
          line-height: 1.6;
        }

        .month-controls {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .icon-button {
          display: grid;
          place-items: center;
          width: 37px;
          height: 37px;
          border: 1px solid var(--line);
          border-radius: 11px;
          background: #fff;
          color: #484a43;
          font-size: 24px;
          line-height: 1;
          cursor: pointer;
          transition: background .15s;
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          gap: 5px;
          margin-top: 26px;
        }

        .weekday {
          padding: 10px 0 13px;
          color: #93958d;
          font-size: 11px;
          font-weight: 650;
          text-align: center;
        }

        .saturday {
          color: #8296ae;
        }

        .sunday {
          color: #c18b83;
        }

        .day-cell {
          position: relative;
          display: flex;
          min-width: 0;
          min-height: 83px;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 10px 2px 7px;
          border: 1px solid transparent;
          border-radius: 12px;
          background: transparent;
          color: #42443e;
          font: inherit;
          cursor: pointer;
          transition: background .15s, border-color .15s;
        }

        button.day-cell:hover:not(.day-selected) {
          border-color: #e8e9e2;
          background: #f8f9f5;
        }

        .day-empty {
          pointer-events: none;
        }

        .day-number {
          display: grid;
          place-items: center;
          width: 29px;
          height: 29px;
          border-radius: 9px;
          font-size: 12px;
          font-weight: 550;
        }

        .day-saturday .day-number {
          color: #8296ae;
        }

        .day-sunday .day-number {
          color: #c18b83;
        }

        .day-today:not(.day-selected) .day-number {
          background: var(--accent-soft);
          color: #42563f;
          font-weight: 750;
        }

        .day-selected {
          border-color: var(--accent) !important;
          background: var(--accent) !important;
          color: #fff;
          box-shadow: 0 3px 8px rgba(48, 60, 50, .12);
        }

        .day-selected .day-number,
        .day-selected .day-saturday .day-number,
        .day-selected .day-sunday .day-number {
          color: #fff;
        }

        .today-label {
          color: #8eaa88;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: .06em;
        }

        .day-selected .today-label {
          color: #c9dbc4;
        }

        .day-markers {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          min-height: 5px;
          margin-top: 2px;
        }

        .marker, .legend-dot {
          display: inline-block;
          width: 5px;
          height: 5px;
          border-radius: 50%;
        }

        .marker-study, .legend-study {
          background: #88a17f;
        }

        .marker-task, .legend-task {
          background: #8da4c1;
        }

        .marker-done {
          background: #c4d6b8;
        }

        .marker-exam, .legend-exam {
          background: #d9a16b;
        }

        .day-selected .marker-study,
        .day-selected .marker-task,
        .day-selected .marker-exam {
          background: #fff;
        }

        .day-task-count {
          color: #8b8e85;
          font-size: 9px;
          font-weight: 550;
        }

        .day-selected .day-task-count {
          color: #e0e6dd;
        }

        .day-exam-label {
          max-width: 100%;
          color: #b47c48;
          font-size: 9px;
        }

        .day-selected .day-exam-label {
          color: #f2d5b5;
        }

        .calendar-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 18px;
          margin-top: 20px;
          padding-top: 17px;
          border-top: 1px solid #f0f0ec;
        }

        .calendar-legend span {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #85877f;
          font-size: 10px;
        }

        .content-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          align-items: start;
          gap: 18px;
          margin-top: 20px;
        }

        .panel {
          min-width: 0;
          padding: 25px;
        }

        .panel-heading h2 {
          margin: 0;
          font-size: 19px;
          font-weight: 650;
          letter-spacing: -.035em;
        }

        .count-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 43px;
          padding: 7px 10px;
          border-radius: 9px;
          background: #f0f2ec;
          color: #596951;
          font-size: 11px;
          font-weight: 750;
        }

        .journal-icon, .milestone-icon {
          display: grid;
          place-items: center;
          width: 37px;
          height: 37px;
          flex-shrink: 0;
          border-radius: 11px;
          background: #f2f3ed;
          color: #697c61;
          font-size: 20px;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 26px 8px;
          text-align: center;
        }

        .empty-icon {
          display: grid;
          place-items: center;
          width: 37px;
          height: 37px;
          border: 1px solid #e9eae4;
          border-radius: 12px;
          color: #8a9882;
          font-size: 20px;
        }

        .empty-state p {
          margin: 12px 0 5px;
          font-size: 12px;
          font-weight: 650;
        }

        .empty-state > span:last-child {
          color: #999a93;
          font-size: 10px;
          line-height: 1.7;
        }

        .task-list {
          display: grid;
          gap: 0;
          margin-top: 15px;
        }

        .task-row {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 13px 0;
          border-bottom: 1px solid #f0f0ec;
        }

        .task-checkbox {
          width: 17px;
          height: 17px;
          flex-shrink: 0;
          accent-color: #63795d;
          cursor: pointer;
        }

        .task-content {
          display: flex;
          min-width: 0;
          flex: 1;
          flex-direction: column;
          gap: 5px;
        }

        .task-title {
          overflow-wrap: anywhere;
          font-size: 12px;
          font-weight: 600;
          line-height: 1.6;
        }

        .task-completed {
          color: #9b9d95;
          text-decoration: line-through;
        }

        .task-meta {
          color: #96978f;
          font-size: 10px;
        }

        .text-button {
          flex-shrink: 0;
          padding: 6px 3px;
          border: 0;
          background: transparent;
          font: inherit;
          font-size: 10px;
          cursor: pointer;
        }

        .danger {
          color: #b77d70;
        }

        .danger:hover {
          color: #8d4133;
        }

        .form-divider {
          height: 1px;
          margin: 20px 0;
          background: var(--line);
        }

        .form-title {
          margin: 0 0 15px;
          font-size: 13px;
          font-weight: 650;
        }

        .stack-form {
          display: grid;
          gap: 14px;
          margin-top: 18px;
        }

        .form-field {
          display: flex;
          min-width: 0;
          flex-direction: column;
          gap: 7px;
        }

        .form-field > span {
          color: #686b62;
          font-size: 11px;
          font-weight: 600;
        }

        .field {
          width: 100%;
          min-width: 0;
          min-height: 41px;
          padding: 10px 12px;
          border: 1px solid #e5e6df;
          border-radius: 10px;
          outline: none;
          background: #fcfcfa;
          color: #30322c;
          font: inherit;
          font-size: 12px;
          transition: border-color .15s, box-shadow .15s;
        }

        .field::placeholder {
          color: #b1b2aa;
        }

        .field:focus {
          border-color: #8b9b84;
          box-shadow: 0 0 0 3px rgba(139, 155, 132, .12);
        }

        .note-field {
          min-height: 100px;
          resize: vertical;
          line-height: 1.8;
        }

        .form-row {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .three-columns {
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
        }

        .button-full {
          width: 100%;
          margin-top: 2px;
        }

        .section-description {
          margin: 16px 0 0;
          color: #898b82;
          font-size: 11px;
          line-height: 1.8;
        }

        .saved-indicator {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-top: 15px;
          color: #7e9077;
          font-size: 10px;
        }

        .saved-dot {
          width: 6px;
          height: 6px;
        }

        .exams-panel {
          margin-top: 20px;
        }

        .exam-list {
          margin-top: 18px;
        }

        .exam-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 0;
          border-bottom: 1px solid #f0f0ec;
        }

        .exam-date-block {
          display: flex;
          width: 53px;
          height: 57px;
          flex-shrink: 0;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1px;
          border-radius: 12px;
          background: #f3f3ed;
        }

        .exam-date-block span {
          color: #888a80;
          font-size: 9px;
        }

        .exam-date-block strong {
          font-size: 22px;
          font-weight: 650;
          line-height: 1.2;
        }

        .exam-info {
          display: flex;
          min-width: 0;
          flex: 1;
          flex-direction: column;
          gap: 6px;
        }

        .exam-info strong {
          overflow-wrap: anywhere;
          font-size: 12px;
          font-weight: 650;
        }

        .exam-info span {
          color: #92948b;
          font-size: 10px;
        }

        .exam-countdown {
          display: flex;
          flex-shrink: 0;
          flex-direction: column;
          align-items: flex-end;
          gap: 5px;
        }

        .exam-countdown strong {
          font-size: 14px;
          font-weight: 700;
        }

        .exam-countdown span {
          color: #96988e;
          font-size: 8px;
          letter-spacing: .09em;
        }

        .exam-form {
          display: grid;
          grid-template-columns: 1fr 1fr auto;
          align-items: end;
          gap: 12px;
        }

        .exam-add-button {
          white-space: nowrap;
        }

        .form-hint {
          margin: 12px 0 0;
          color: #a0a197;
          font-size: 10px;
        }

        .next-exam {
          display: flex;
          align-items: center;
          gap: 18px;
          margin-top: 20px;
          padding: 25px;
          border: 1px solid #e2e7dc;
          border-radius: 18px;
          background: #eef1e9;
        }

        .next-exam-symbol {
          display: grid;
          place-items: center;
          width: 48px;
          height: 48px;
          flex-shrink: 0;
          border: 1px solid #dce3d5;
          border-radius: 15px;
          background: rgba(255,255,255,.55);
          color: #7c9273;
          font-size: 23px;
        }

        .next-exam-copy {
          min-width: 0;
          flex: 1;
        }

        .next-exam-copy .eyebrow {
          margin-bottom: 6px;
          color: #7d8e75;
        }

        .next-exam-copy h2 {
          margin: 0;
          overflow-wrap: anywhere;
          font-size: 17px;
          font-weight: 650;
        }

        .next-exam-copy p {
          margin: 6px 0 0;
          color: #808779;
          font-size: 11px;
        }

        .next-exam-days {
          display: flex;
          flex-shrink: 0;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }

        .next-exam-days strong {
          color: #41523c;
          font-size: 32px;
          font-weight: 650;
          letter-spacing: -.05em;
        }

        .next-exam-days span {
          color: #82917b;
          font-size: 8px;
          font-weight: 750;
          letter-spacing: .1em;
        }

        .footer {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding-top: 42px;
          text-align: center;
        }

        .footer-brand {
          width: 29px;
          height: 29px;
          border-radius: 9px;
          font-size: 17px;
        }

        .footer > p {
          margin: 11px 0 15px;
          color: #96978f;
          font-size: 10px;
          letter-spacing: .02em;
        }

        .save-status {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #85877f;
          font-size: 10px;
        }

        .status-dot {
          width: 6px;
          height: 6px;
        }

        .status-saving {
          background: #d6a06a;
        }

        .footer-links {
          justify-content: center;
          gap: 20px;
          margin-top: 19px;
        }

        @media (max-width: 760px) {
          .calendar-page {
            padding: 0 16px 40px;
          }

          .topbar {
            min-height: 65px;
          }

          .top-links {
            gap: 13px;
          }

          .top-links a {
            font-size: 10px;
          }

          .stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
          }

          .stat-card {
            padding: 16px;
          }

          .calendar-card {
            padding: 19px 13px;
          }

          .calendar-grid {
            gap: 2px;
            margin-top: 19px;
          }

          .day-cell {
            min-height: 70px;
            padding: 7px 0 5px;
            border-radius: 9px;
          }

          .day-number {
            width: 26px;
            height: 26px;
            font-size: 11px;
          }

          .content-grid {
            grid-template-columns: 1fr;
            gap: 15px;
          }

          .panel {
            padding: 20px;
          }

          .exam-form {
            grid-template-columns: 1fr 1fr;
          }

          .exam-add-button {
            grid-column: 1 / -1;
          }
        }

        @media (max-width: 480px) {
          .calendar-page {
            padding-right: 12px;
            padding-left: 12px;
          }

          .topbar {
            align-items: flex-start;
            flex-direction: column;
            justify-content: center;
            gap: 12px;
            padding: 15px 0;
          }

          .top-links {
            width: 100%;
            justify-content: space-between;
          }

          .brand {
            font-size: 11px;
          }

          .hero {
            align-items: flex-start;
            padding: 32px 0 22px;
          }

          .hero h1 {
            font-size: 36px;
          }

          .hero-description {
            max-width: 235px;
            font-size: 11px;
          }

          .hero-today {
            min-height: 35px;
            padding: 0 10px;
            font-size: 10px;
          }

          .stat-card {
            padding: 13px;
            border-radius: 14px;
          }

          .stat-label {
            font-size: 8px;
            letter-spacing: .06em;
          }

          .stat-value {
            margin-top: 14px;
            font-size: 25px;
          }

          .calendar-heading h2 {
            font-size: 21px;
          }

          .calendar-heading h2 span {
            font-size: 12px;
          }

          .calendar-heading .eyebrow {
            font-size: 9px;
          }

          .month-controls {
            gap: 4px;
          }

          .icon-button {
            width: 31px;
            height: 34px;
          }

          .button-subtle {
            min-height: 34px;
            padding: 0 10px;
          }

          .weekday {
            padding: 8px 0 10px;
            font-size: 10px;
          }

          .day-cell {
            min-height: 62px;
          }

          .day-number {
            width: 23px;
            height: 23px;
          }

          .today-label {
            font-size: 7px;
          }

          .day-task-count {
            font-size: 8px;
          }

          .calendar-legend {
            gap: 12px;
          }

          .calendar-legend span {
            font-size: 9px;
          }

          .three-columns {
            gap: 6px;
          }

          .three-columns .field {
            padding: 9px 6px;
            font-size: 11px;
          }

          .form-row {
            gap: 9px;
          }

          .exam-row {
            gap: 9px;
          }

          .exam-date-block {
            width: 43px;
            height: 51px;
          }

          .exam-info strong {
            font-size: 11px;
          }

          .exam-countdown strong {
            font-size: 12px;
          }

          .exam-countdown span {
            font-size: 7px;
          }

          .next-exam {
            gap: 12px;
            padding: 18px 14px;
          }

          .next-exam-symbol {
            width: 38px;
            height: 38px;
          }

          .next-exam-copy h2 {
            font-size: 14px;
          }

          .next-exam-days strong {
            font-size: 26px;
          }

          .footer-links {
            gap: 14px;
          }
        }

        
/* 左上に固定するハンバーガーボタン */
.anki-menu-trigger {
  position: fixed;
  top: 16px;
  left: 16px;
  z-index: 1002;

  display: flex;
  width: 46px;
  height: 46px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;

  padding: 0;
  border: 1px solid #e8e9e3;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 4px 16px rgba(30, 35, 28, 0.08);

  cursor: pointer;
  transition:
    background 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.anki-menu-trigger:hover {
  background: #f1f3ed;
  box-shadow: 0 6px 20px rgba(30, 35, 28, 0.12);
}

.anki-menu-trigger:active {
  transform: scale(0.96);
}

.anki-menu-trigger span {
  display: block;
  width: 18px;
  height: 2px;
  border-radius: 2px;
  background: #303c32;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

/* 開いたときに × へ変形 */
.anki-menu-trigger.is-open span:first-child {
  transform: translateY(7px) rotate(45deg);
}

.anki-menu-trigger.is-open span:nth-child(2) {
  opacity: 0;
}

.anki-menu-trigger.is-open span:last-child {
  transform: translateY(-7px) rotate(-45deg);
}

/* 背景のオーバーレイ */
.anki-menu-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  width: 100%;
  height: 100%;
  border: none;
  background: rgba(25, 29, 24, 0.28);
  backdrop-filter: blur(3px);
  cursor: pointer;
}

/* スライド式の共通メニュー */
.anki-menu-panel {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 1001;

  display: flex;
  width: min(300px, 86vw);
  flex-direction: column;
  gap: 6px;
  overflow-y: auto;

  padding: 86px 20px 24px;
  border-right: 1px solid #e8e9e3;
  background: #fbfbf8;
  box-shadow: 12px 0 40px rgba(25, 29, 24, 0.08);

  animation: anki-menu-in 0.22s ease-out;
}

.anki-menu-heading {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 4px 24px;
  border-bottom: 1px solid #e8e9e3;
}

.anki-menu-logo {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 13px;
  background: #303c32;
  color: white;
  font-size: 24px;
  font-weight: 750;
  letter-spacing: -2px;
}

.anki-menu-heading div {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.anki-menu-heading strong {
  color: #303c32;
  font-size: 13px;
  letter-spacing: 0.14em;
}

.anki-menu-heading div > span {
  color: #96988e;
  font-size: 9px;
  letter-spacing: 0.09em;
}

.anki-menu-section {
  margin: 22px 8px 10px;
  color: #96988e;
  font-size: 10px;
  font-weight: 750;
  letter-spacing: 0.15em;
}

.anki-menu-link {
  display: flex;
  min-height: 46px;
  align-items: center;
  gap: 12px;
  padding: 0 12px;
  border-radius: 12px;
  color: #5e6258;
  font-size: 12px;
  text-decoration: none;
  transition: background 0.15s ease, color 0.15s ease;
}

.anki-menu-link:hover {
  background: #f0f2ec;
  color: #303c32;
}

.anki-menu-active {
  background: #e9eee5;
  color: #303c32;
  font-weight: 700;
}

.anki-menu-icon {
  display: grid;
  width: 25px;
  height: 25px;
  flex-shrink: 0;
  place-items: center;
  font-size: 17px;
}

.anki-menu-current {
  margin-left: auto;
  color: #84947c;
  font-size: 8px;
  font-weight: 750;
  letter-spacing: 0.06em;
}

.anki-menu-footer {
  margin-top: auto;
  padding: 24px 6px 0;
  color: #96988e;
  font-size: 10px;
  line-height: 1.8;
}

@keyframes anki-menu-in {
  from {
    opacity: 0;
    transform: translateX(-12px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 左上ボタンとロゴが重ならないようにする */
.topbar {
  padding-left: 58px;
}

@media (max-width: 480px) {
  .anki-menu-trigger {
    top: 12px;
    left: 12px;
    width: 42px;
    height: 42px;
  }

  .topbar {
    padding-left: 52px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .anki-menu-trigger,
  .anki-menu-trigger span,
  .anki-menu-link {
    transition: none;
  }

  .anki-menu-panel {
    animation: none;
  }
}

      `}</style>
    </main>
  );
}
