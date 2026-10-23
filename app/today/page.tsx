
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

type Plan = {
  id: string;
  deckName: string;
  totalItems: number;
  startDate: string;
  deadline: string;
  rounds: number;
  weekdays: number[];
  createdAt: string;
};

type TaskStatus = "未着手" | "進行中" | "完了";
type TaskType = "教材の学習" | "単語の暗記・復習";
type TaskUnit = "単語" | "ページ" | "分" | "章" | "回";

type StudyTask = {
  id: string;
  title: string;
  type: TaskType;
  material: string;
  target: number;
  unit: TaskUnit;
  startDate: string;
  scheduledDate: string;
  dueDate: string;
  status: TaskStatus;
  repeat: "なし" | "毎日" | "毎週";
  repeatDays: number[];
};

const PLAN_STORAGE_KEY = "anki-study-plans-v1";

const navigation = [
  { label: "ホーム", href: "/", number: "00" },
  { label: "今日のノルマ", href: "/today", number: "01" },
  { label: "学習カレンダー", href: "/calendar", number: "02" },
  { label: "タスク管理", href: "/tasks", number: "03" },
  { label: "学習計画", href: "/plan", number: "04" },
  { label: "Little Moments", href: "/little-moments", number: "05" },
];

const ink = "#20231F";
const muted = "#777C74";
const line = "#DCDD D6".replace(" ", "");
const accent = "#425D4B";

function dateString(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function weekdayIndex(date = new Date()) {
  return (date.getDay() + 6) % 7;
}

function countStudyDays(start: string, end: string, weekdays: number[]) {
  if (!start || !end || start > end || weekdays.length === 0) return 0;

  const from = new Date(`${start}T12:00:00`);
  const to = new Date(`${end}T12:00:00`);
  let count = 0;

  for (
    const date = new Date(from);
    date <= to;
    date.setDate(date.getDate() + 1)
  ) {
    if (weekdays.includes((date.getDay() + 6) % 7)) count++;
  }

  return count;
}

function normalizeTask(
  id: string,
  data: Record<string, unknown>
): StudyTask {
  const units: TaskUnit[] = ["単語", "ページ", "分", "章", "回"];
  const statuses: TaskStatus[] = ["未着手", "進行中", "完了"];
  const repeats = ["なし", "毎日", "毎週"] as const;

  return {
    id,
    title: typeof data.title === "string" ? data.title : "名称未設定",
    type:
      data.type === "教材の学習"
        ? "教材の学習"
        : "単語の暗記・復習",
    material: typeof data.material === "string" ? data.material : "",
    target: typeof data.target === "number" ? data.target : 0,
    unit: units.includes(data.unit as TaskUnit)
      ? (data.unit as TaskUnit)
      : "単語",
    startDate: typeof data.startDate === "string" ? data.startDate : "",
    scheduledDate:
      typeof data.scheduledDate === "string" ? data.scheduledDate : "",
    dueDate: typeof data.dueDate === "string" ? data.dueDate : "",
    status: statuses.includes(data.status as TaskStatus)
      ? (data.status as TaskStatus)
      : "未着手",
    repeat: repeats.includes(data.repeat as (typeof repeats)[number])
      ? (data.repeat as (typeof repeats)[number])
      : "なし",
    repeatDays: Array.isArray(data.repeatDays)
      ? data.repeatDays.filter(
          (value): value is number =>
            typeof value === "number" && value >= 0 && value <= 6
        )
      : [],
  };
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#777C74]">
      {children}
    </p>
  );
}

export default function TodayPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  const today = dateString();
  const todayWeekday = weekdayIndex();

  const now = new Date();
  const formattedDate = new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(now);

  const englishDate = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(now)
    .toUpperCase();

  useEffect(() => {
    function refreshPlans() {
      try {
        const saved = localStorage.getItem(PLAN_STORAGE_KEY);
        const parsed = saved ? JSON.parse(saved) : [];
        setPlans(Array.isArray(parsed) ? parsed : []);
      } catch (error) {
        console.error("学習計画の読み込みに失敗しました", error);
      }
    }

    refreshPlans();
    window.addEventListener("storage", refreshPlans);
    window.addEventListener("focus", refreshPlans);

    return () => {
      window.removeEventListener("storage", refreshPlans);
      window.removeEventListener("focus", refreshPlans);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!authReady) return;

    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      collection(db, "users", user.uid, "tasks"),
      (snapshot) => {
        const nextTasks = snapshot.docs.map((taskDoc) =>
          normalizeTask(
            taskDoc.id,
            taskDoc.data() as Record<string, unknown>
          )
        );

        setTasks(nextTasks);
        setLoading(false);
        setErrorMessage("");
      },
      (error) => {
        console.error("タスクの取得に失敗しました", error);
        setErrorMessage("タスクを読み込めませんでした。");
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [authReady, user]);

  useEffect(() => {
    if (!menuOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  const todaysPlans = useMemo(
    () =>
      plans.filter(
        (plan) =>
          plan.startDate <= today &&
          plan.deadline >= today &&
          plan.weekdays.includes(todayWeekday)
      ),
    [plans, today, todayWeekday]
  );

  const todaysTasks = useMemo(
    () =>
      tasks
        .filter((task) => {
          if (task.scheduledDate === today) return true;

          if (
            task.repeat === "毎日" &&
            task.startDate &&
            task.startDate <= today &&
            (!task.dueDate || task.dueDate >= today)
          ) {
            return true;
          }

          if (
            task.repeat === "毎週" &&
            task.startDate &&
            task.startDate <= today &&
            (!task.dueDate || task.dueDate >= today) &&
            task.repeatDays.includes(todayWeekday)
          ) {
            return true;
          }

          return false;
        })
        .sort((a, b) => {
          if (a.status === "完了" && b.status !== "完了") return 1;
          if (a.status !== "完了" && b.status === "完了") return -1;
          return a.title.localeCompare(b.title, "ja");
        }),
    [tasks, today, todayWeekday]
  );

  const completedCount = todaysTasks.filter(
    (task) => task.status === "完了"
  ).length;

  const totalCount = todaysTasks.length;
  const remainingCount = Math.max(0, totalCount - completedCount);

  const progress =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const plannedDailyTotal = todaysPlans.reduce((sum, plan) => {
    const studyDays = countStudyDays(
      plan.startDate,
      plan.deadline,
      plan.weekdays
    );

    if (studyDays === 0) return sum;

    return sum + Math.ceil((plan.totalItems * plan.rounds) / studyDays);
  }, 0);

  async function toggleTask(task: StudyTask) {
    if (!user) {
      setErrorMessage("タスクの更新にはログインが必要です。");
      return;
    }

    setUpdatingTaskId(task.id);
    setErrorMessage("");

    const nextStatus: TaskStatus =
      task.status === "完了" ? "進行中" : "完了";

    try {
      await updateDoc(doc(db, "users", user.uid, "tasks", task.id), {
        status: nextStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("タスクの更新に失敗しました", error);
      setErrorMessage("更新できませんでした。もう一度お試しください。");
    } finally {
      setUpdatingTaskId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F7F5] text-[#20231F]">
      {/* Navigation drawer */}
      <button
        type="button"
        onClick={() => setMenuOpen(true)}
        aria-label="メニューを開く"
        aria-expanded={menuOpen}
        className="fixed left-5 top-5 z-40 flex h-10 w-10 items-center justify-center border border-[#DCDD D6] bg-[#F7F7F5] text-[#20231F] transition hover:bg-white"
        style={{ borderColor: line }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="square" />
        </svg>
      </button>

      {menuOpen && (
        <button
          type="button"
          aria-label="メニューを閉じる"
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/25"
        />
      )}

      <aside
        aria-label="メインメニュー"
        aria-hidden={!menuOpen}
        className={`fixed inset-y-0 left-0 z-50 flex w-[280px] max-w-[85vw] flex-col border-r bg-[#F7F7F5] p-6 transition-transform duration-300 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ borderColor: line }}
      >
        <div
          className="flex items-center justify-between border-b pb-5"
          style={{ borderColor: line }}
        >
          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            tabIndex={menuOpen ? 0 : -1}
            className="text-sm font-semibold tracking-[0.18em]"
          >
            YOUR ANKI
            <span className="mt-1 block text-[10px] font-normal tracking-normal text-[#777C74]">
              PERSONAL LEARNING SYSTEM
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            aria-label="メニューを閉じる"
            className="flex h-8 w-8 items-center justify-center text-xl text-[#777C74] hover:bg-white"
          >
            ×
          </button>
        </div>

        <p className="mb-3 mt-8 text-[10px] font-semibold tracking-[0.2em] text-[#777C74]">
          WORKSPACE
        </p>

        <nav>
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              tabIndex={menuOpen ? 0 : -1}
              aria-current={item.href === "/today" ? "page" : undefined}
              className={`grid grid-cols-[30px_1fr] items-center border-b py-3 text-sm transition ${
                item.href === "/today"
                  ? "font-semibold text-[#425D4B]"
                  : "text-[#555B53] hover:text-[#20231F]"
              }`}
              style={{ borderColor: line }}
            >
              <span className="font-mono text-[10px] text-[#858A82]">
                {item.number}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto border-t pt-4" style={{ borderColor: line }}>
          <p className="text-[10px] tracking-[0.15em] text-[#777C74]">
            LEARN AT YOUR OWN PACE
          </p>
        </div>
      </aside>

      {/* Main content */}
      <div className="mx-auto max-w-6xl px-5 pb-12 pt-7 sm:px-8 md:px-12 md:pt-10">
        <header
          className="mb-10 border-b pb-7 pl-14 sm:mb-12 sm:pb-9"
          style={{ borderColor: line }}
        >
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <SectionLabel>DAILY OVERVIEW / {englishDate}</SectionLabel>
              <h1 className="mt-4 text-3xl font-semibold tracking-[-0.045em] sm:text-5xl">
                今日のノルマ
              </h1>
              <p className="mt-3 text-sm text-[#777C74]">{formattedDate}</p>
            </div>

            <Link
              href="/tasks"
              className="inline-flex items-center gap-3 border px-4 py-3 text-sm transition hover:bg-white"
              style={{ borderColor: line }}
            >
              タスク管理
              <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </header>

        {errorMessage && (
          <div
            role="alert"
            className="mb-6 border-l-2 bg-white px-4 py-3 text-sm text-[#8A5145]"
            style={{ borderColor: "#A86B5C" }}
          >
            {errorMessage}
          </div>
        )}

        {/* Overview metrics */}
        <section className="mb-12">
          <div className="mb-4 flex items-center justify-between">
            <SectionLabel>01 / PROGRESS</SectionLabel>
            <span className="text-[10px] tracking-[0.12em] text-[#777C74]">
              TODAY
            </span>
          </div>

          <div
            className="grid grid-cols-2 border-l border-t sm:grid-cols-4"
            style={{ borderColor: line }}
          >
            <article
              className="min-h-[145px] border-b border-r p-4 sm:p-5"
              style={{ borderColor: line }}
            >
              <p className="text-xs text-[#777C74]">達成率</p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="font-mono text-4xl font-medium tracking-[-0.06em] sm:text-5xl">
                  {progress}
                </span>
                <span className="text-sm text-[#777C74]">%</span>
              </div>
              <div
                className="mt-4 h-[3px] w-full"
                style={{ backgroundColor: "#E2E3DD" }}
                role="progressbar"
                aria-label="今日のタスク達成率"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${progress}%`,
                    backgroundColor: accent,
                  }}
                />
              </div>
            </article>

            <article
              className="min-h-[145px] border-b border-r p-4 sm:p-5"
              style={{ borderColor: line }}
            >
              <p className="text-xs text-[#777C74]">完了タスク</p>
              <div className="mt-5 flex items-baseline gap-2">
                <span className="font-mono text-4xl font-medium tracking-[-0.06em] sm:text-5xl">
                  {String(completedCount).padStart(2, "0")}
                </span>
                <span className="text-xs text-[#777C74]">
                  / {String(totalCount).padStart(2, "0")}
                </span>
              </div>
              <p className="mt-4 text-[11px] text-[#777C74]">完了 / 全タスク</p>
            </article>

            <article
              className="min-h-[145px] border-b border-r p-4 sm:p-5"
              style={{ borderColor: line }}
            >
              <p className="text-xs text-[#777C74]">残り</p>
              <div className="mt-5 flex items-baseline gap-2">
                <span className="font-mono text-4xl font-medium tracking-[-0.06em] sm:text-5xl">
                  {String(remainingCount).padStart(2, "0")}
                </span>
                <span className="text-xs text-[#777C74]">件</span>
              </div>
              <p className="mt-4 text-[11px] text-[#777C74]">未完了のタスク</p>
            </article>

            <article
              className="min-h-[145px] border-b border-r p-4 sm:p-5"
              style={{ borderColor: line }}
            >
              <p className="text-xs text-[#777C74]">学習計画</p>
              <div className="mt-5 flex items-baseline gap-2">
                <span className="font-mono text-4xl font-medium tracking-[-0.06em] sm:text-5xl">
                  {String(todaysPlans.length).padStart(2, "0")}
                </span>
                <span className="text-xs text-[#777C74]">件</span>
              </div>
              <p className="mt-4 text-[11px] text-[#777C74]">
                目標 {plannedDailyTotal.toLocaleString("ja-JP")} 項目 / 日
              </p>
            </article>
          </div>
        </section>

        {/* Today's tasks */}
        <section className="mb-12">
          <div
            className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b pb-4"
            style={{ borderColor: line }}
          >
            <div>
              <SectionLabel>02 / TASK REGISTER</SectionLabel>
              <h2 className="mt-2 text-xl font-semibold tracking-tight">
                今日やること
              </h2>
            </div>
            <Link
              href="/tasks"
              className="text-xs text-[#425D4B] hover:underline"
            >
              すべてのタスク ↗
            </Link>
          </div>

          {!authReady || loading ? (
            <p className="py-8 text-sm text-[#777C74]">
              タスクを読み込んでいます…
            </p>
          ) : !user ? (
            <div className="border-y py-8">
              <p className="font-medium">ログインが必要です</p>
              <p className="mt-2 text-sm text-[#777C74]">
                ログインすると、登録したタスクがここに表示されます。
              </p>
            </div>
          ) : todaysTasks.length === 0 ? (
            <div className="border-y py-10">
              <p className="text-lg font-medium">今日のタスクはありません</p>
              <p className="mt-2 text-sm text-[#777C74]">
                タスク管理から予定を追加すると、ここに表示されます。
              </p>
              <Link
                href="/tasks"
                className="mt-5 inline-flex items-center gap-2 border px-4 py-3 text-sm hover:bg-white"
                style={{ borderColor: line }}
              >
                タスクを追加する <span aria-hidden="true">↗</span>
              </Link>
            </div>
          ) : (
            <div className="border-t" style={{ borderColor: line }}>
              {todaysTasks.map((task, index) => (
                <article
                  key={task.id}
                  className="grid grid-cols-[28px_32px_minmax(0,1fr)_auto] items-start gap-3 border-b py-4 sm:grid-cols-[40px_32px_minmax(0,1fr)_auto] sm:gap-4 sm:py-5"
                  style={{ borderColor: line }}
                >
                  <span className="pt-1 font-mono text-[11px] text-[#858A82]">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <button
                    type="button"
                    disabled={updatingTaskId === task.id}
                    onClick={() => toggleTask(task)}
                    aria-label={`「${task.title}」を${
                      task.status === "完了" ? "未完了に戻す" : "完了にする"
                    }`}
                    className={`mt-0.5 flex h-6 w-6 items-center justify-center border text-xs transition disabled:opacity-50 ${
                      task.status === "完了"
                        ? "border-[#425D4B] bg-[#425D4B] text-white"
                        : "border-[#BFC4BB] text-transparent hover:border-[#425D4B]"
                    }`}
                  >
                    ✓
                  </button>

                  <div className="min-w-0">
                    <p
                      className={`break-words text-sm font-medium ${
                        task.status === "完了"
                          ? "text-[#858A82] line-through"
                          : "text-[#20231F]"
                      }`}
                    >
                      {task.title}
                    </p>
                    <p className="mt-1 text-xs text-[#777C74]">
                      {task.type}
                      {task.material ? ` / ${task.material}` : ""}
                    </p>
                    {task.target > 0 && (
                      <p className="mt-2 font-mono text-xs text-[#425D4B]">
                        TARGET · {task.target.toLocaleString("ja-JP")}{" "}
                        {task.unit}
                      </p>
                    )}
                  </div>

                  <span
                    className={`whitespace-nowrap pt-1 text-[10px] ${
                      task.status === "完了"
                        ? "text-[#425D4B]"
                        : task.status === "進行中"
                          ? "text-[#92783F]"
                          : "text-[#777C74]"
                    }`}
                  >
                    {task.status}
                  </span>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Today's study plans */}
        <section>
          <div
            className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b pb-4"
            style={{ borderColor: line }}
          >
            <div>
              <SectionLabel>03 / STUDY PLAN</SectionLabel>
              <h2 className="mt-2 text-xl font-semibold tracking-tight">
                今日の学習計画
              </h2>
            </div>
            <Link
              href="/plan"
              className="text-xs text-[#425D4B] hover:underline"
            >
              学習計画を管理 ↗
            </Link>
          </div>

          {todaysPlans.length === 0 ? (
            <div className="border-y py-8">
              <p className="font-medium">今日対象の計画はありません</p>
              <p className="mt-2 text-sm text-[#777C74]">
                学習計画で期間と学習曜日を設定してください。
              </p>
              <Link
                href="/plan"
                className="mt-5 inline-flex items-center gap-2 border px-4 py-3 text-sm hover:bg-white"
                style={{ borderColor: line }}
              >
                計画を作成する <span aria-hidden="true">↗</span>
              </Link>
            </div>
          ) : (
            <div
              className="grid grid-cols-1 border-l border-t sm:grid-cols-2"
              style={{ borderColor: line }}
            >
              {todaysPlans.map((plan, index) => {
                const studyDays = countStudyDays(
                  plan.startDate,
                  plan.deadline,
                  plan.weekdays
                );

                const dailyTarget =
                  studyDays > 0
                    ? Math.ceil((plan.totalItems * plan.rounds) / studyDays)
                    : 0;

                return (
                  <article
                    key={plan.id}
                    className="border-b border-r p-5 sm:p-6"
                    style={{ borderColor: line }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <SectionLabel>
                        PLAN {String(index + 1).padStart(2, "0")}
                      </SectionLabel>
                      <span className="text-[10px] text-[#777C74]">
                        DEADLINE / {plan.deadline}
                      </span>
                    </div>

                    <h3 className="mt-5 break-words text-base font-semibold">
                      {plan.deckName}
                    </h3>
                    <p className="mt-2 text-xs text-[#777C74]">
                      {plan.rounds} 周 ·{" "}
                      {plan.totalItems.toLocaleString("ja-JP")} 項目
                    </p>

                    <div
                      className="mt-6 flex items-end justify-between border-t pt-4"
                      style={{ borderColor: line }}
                    >
                      <div>
                        <p className="text-xs text-[#777C74]">本日の目標</p>
                        <p className="mt-2 font-mono text-3xl font-medium tracking-[-0.05em] text-[#425D4B]">
                          {dailyTarget.toLocaleString("ja-JP")}
                          <span className="ml-2 font-sans text-xs tracking-normal text-[#777C74]">
                            項目
                          </span>
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <footer
          className="mt-12 flex flex-wrap justify-between gap-3 border-t pt-5"
          style={{ borderColor: line }}
        >
          <p className="text-[10px] tracking-[0.12em] text-[#777C74]">
            YOUR ANKI / PERSONAL LEARNING SYSTEM
          </p>
          <p className="text-xs text-[#777C74]">
            予定の編集はタスク管理・学習計画から行えます。
          </p>
        </footer>
      </div>
    </main>
  );
}
