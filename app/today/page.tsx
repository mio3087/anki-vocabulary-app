
"use client";

import Link from "next/link";
import { useState } from "react";
import TodayHeader from "@/app/components/story1/TodayHeader";
type Task = {
  id: number;
  title: string;
  deck: string;
  target: number;
  unit: string;
  completed: boolean;
  time: string;
  category: "language" | "reading" | "health";
};


const initialTasks: Task[] = [];

const categoryStyles = {
  language: "bg-blue-50 text-blue-700",
  reading: "bg-orange-50 text-orange-700",
  health: "bg-emerald-50 text-emerald-700",
};

export default function TodayPage() {
  const [tasks, setTasks] = useState(initialTasks);

  const completedCount = tasks.filter(
    (task) => task.completed
  ).length;

  const totalCount = tasks.length;

  const progress = totalCount
    ? Math.round((completedCount / totalCount) * 100)
    : 0;

  const totalTarget = tasks.reduce(
    (sum, task) => sum + task.target,
    0
  );

  const remainingTarget = tasks
    .filter((task) => !task.completed)
    .reduce((sum, task) => sum + task.target, 0);

  const today = new Date();

  const dateText = new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
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
    <main className="min-h-screen bg-[#f5f7fb] text-slate-800">
      <div className="mx-auto max-w-5xl px-4 pb-28 pt-6 sm:px-8 sm:pt-10">

        {/* ヘッダー */}
        <TodayHeader
  completedCount={completedCount}
  totalCount={totalCount}
  totalTarget={totalTarget}
/>

        {/* 今日のノルマ */}
        <section className="mb-8 rounded-[1.75rem] border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(39,61,99,0.04)] sm:p-7">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium tracking-widest text-slate-400">
                DAILY GOALS
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight">
                今日のノルマ
              </h2>
            </div>

            <span className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700">
              {completedCount} / {totalCount} 完了
            </span>
          </div>

          <div className="mb-6 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
            <span>今日の学習目標</span>
            <span>合計 {totalTarget}{tasks.every(t => t.unit === "単語") ? "単語" : "（各タスクの目標）"}</span>
          </div>

          <div className="divide-y divide-slate-100">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`group flex items-center gap-3 py-4 transition-opacity ${
                  task.completed ? "opacity-60" : ""
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleTask(task.id)}
                  aria-label={
                    task.completed
                      ? `${task.title}を未完了に戻す`
                      : `${task.title}を完了する`
                  }
                  aria-pressed={task.completed}
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all ${
                    task.completed
                      ? "border-blue-500 bg-blue-500 text-white"
                      : "border-slate-300 bg-white hover:border-blue-400"
                  }`}
                >
                  {task.completed && (
                    <span className="text-sm">✓</span>
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-sm font-medium ${
                        task.completed
                          ? "text-slate-400 line-through"
                          : "text-slate-800"
                      }`}
                    >
                      {task.title}
                    </span>

                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                        categoryStyles[task.category]
                      }`}
                    >
                      {task.deck}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-slate-400">
                    目標 {task.target}{task.unit}
                  </p>
                </div>

                <span className="shrink-0 text-xs tabular-nums text-slate-400">
                  {task.time}
                </span>
              </div>
            ))}
          </div>

          <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
            {completedCount === totalCount
              ? "素晴らしい！今日のノルマを達成しました 🎉"
              : `あと ${totalCount - completedCount} 件。自分のペースで進めましょう。`}
          </p>
        </section>

        {/* サマリー */}
        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
            <p className="text-sm text-slate-400">完了したタスク</p>
            <p className="mt-2 text-2xl font-semibold">
              {completedCount}
              <span className="ml-1 text-sm font-normal text-slate-400">
                / {totalCount} 件
              </span>
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
            <p className="text-sm text-slate-400">残りの目標数</p>
            <p className="mt-2 text-2xl font-semibold">
              {remainingTarget}
              <span className="ml-1 text-sm font-normal text-slate-400">
                単位
              </span>
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
            <p className="text-sm text-slate-400">今日のひとこと</p>
            <p className="mt-2 text-base font-medium">
              Small steps, big changes.
            </p>
          </div>
        </section>

        {/* 関連ページ */}
        <section>
          <h2 className="mb-4 text-lg font-semibold">
            次にやること
          </h2>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Link
              href="/plan"
              className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-5 transition hover:border-blue-200 hover:bg-blue-50/40"
            >
              <div>
                <p className="font-medium">学習計画</p>
                <p className="mt-1 text-sm text-slate-400">
                  目標と学習スケジュールを確認
                </p>
              </div>
              <span className="text-xl text-slate-400">›</span>
            </Link>

            <Link
              href="/tasks"
              className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-5 transition hover:border-blue-200 hover:bg-blue-50/40"
            >
              <div>
                <p className="font-medium">タスク管理</p>
                <p className="mt-1 text-sm text-slate-400">
                  やることを整理する
                </p>
              </div>
              <span className="text-xl text-slate-400">›</span>
            </Link>

            <Link
              href="/calendar"
              className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-5 transition hover:border-blue-200 hover:bg-blue-50/40"
            >
              <div>
                <p className="font-medium">カレンダー</p>
                <p className="mt-1 text-sm text-slate-400">
                  予定と学習日を確認
                </p>
              </div>
              <span className="text-xl text-slate-400">›</span>
            </Link>

            <Link
              href="/decks"
              className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-5 transition hover:border-blue-200 hover:bg-blue-50/40"
            >
              <div>
                <p className="font-medium">単語デッキ</p>
                <p className="mt-1 text-sm text-slate-400">
                  学習する教材を選ぶ
                </p>
              </div>
              <span className="text-xl text-slate-400">›</span>
            </Link>
          </div>
        </section>

        <footer className="mt-10 text-center text-xs text-slate-400">
          今日の小さな努力が、明日の自分をつくる。
        </footer>
      </div>

      {/* モバイル用ナビゲーション */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200/80 bg-white/90 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center justify-around">
          {[
            { href: "/", icon: "⌂", label: "ホーム" },
            { href: "/tasks", icon: "✓", label: "タスク" },
            { href: "/plan", icon: "▤", label: "学習計画" },
            { href: "/calendar", icon: "▦", label: "カレンダー" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex min-w-0 flex-col items-center gap-1 px-2 py-1 text-blue-600 transition hover:text-blue-800"
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-[10px] font-medium">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </nav>
    </main>
  );
}
