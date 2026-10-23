
"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

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

const STORAGE_KEY = "anki-study-plans-v1";
const weekdayLabels = ["月", "火", "水", "木", "金", "土", "日"];
const weekdayNames = ["月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日", "日曜日"];
const fmt = new Intl.NumberFormat("ja-JP");

function localDateString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function countStudyDays(start: string, end: string, weekdays: number[]) {
  if (!start || !end || end < start || weekdays.length === 0) return 0;
  const current = new Date(`${start}T12:00:00`);
  const last = new Date(`${end}T12:00:00`);
  let count = 0;

  while (current <= last) {
    if (weekdays.includes((current.getDay() + 6) % 7)) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

function remainingDays(deadline: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(`${deadline}T00:00:00`);
  return Math.round((end.getTime() - today.getTime()) / 86400000);
}

function dailyTarget(plan: Plan) {
  const days = countStudyDays(plan.startDate, plan.deadline, plan.weekdays);
  return days ? Math.ceil((plan.totalItems * plan.rounds) / days) : 0;
}

function formatDate(value: string) {
  if (!value) return "未設定";
  return new Intl.DateTimeFormat("ja-JP", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

export default function PlansPage() {
  const today = localDateString(new Date());
  const [deckName, setDeckName] = useState("");
  const [totalItems, setTotalItems] = useState("5000");
  const [startDate, setStartDate] = useState(today);
  const [deadline, setDeadline] = useState("");
  const [rounds, setRounds] = useState("3");
  const [weekdays, setWeekdays] = useState<number[]>([0, 1, 2, 3, 4]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"deadline" | "createdAt">("deadline");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed)) setPlans(parsed as Plan[]);
      }
    } catch {
      setError("保存済みの計画を読み込めませんでした。");
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
    } catch {
      setError("保存できませんでした。ブラウザの保存容量を確認してください。");
    }
  }, [plans, loaded]);

  const total = Math.max(0, Number(totalItems) || 0);
  const roundCount = Math.max(0, Number(rounds) || 0);
  const studyDays = countStudyDays(startDate, deadline, weekdays);
  const estimate = studyDays > 0 ? Math.ceil((total * roundCount) / studyDays) : 0;
  const activePlans = plans.filter((plan) => remainingDays(plan.deadline) >= 0);
  const totalDaily = activePlans.reduce((sum, plan) => sum + dailyTarget(plan), 0);

  const filteredPlans = plans
    .filter((plan) => plan.deckName.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) =>
      sortBy === "deadline"
        ? a.deadline.localeCompare(b.deadline)
        : b.createdAt.localeCompare(a.createdAt)
    );

  function toggleWeekday(day: number) {
    setWeekdays((current) =>
      current.includes(day)
        ? current.filter((value) => value !== day)
        : [...current, day].sort((a, b) => a - b)
    );
  }

  function savePlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!deckName.trim()) return setError("教材名を入力してください。");
    if (!Number.isInteger(total) || total <= 0) return setError("項目数は1以上の整数にしてください。");
    if (!Number.isInteger(roundCount) || roundCount < 1 || roundCount > 100) {
      return setError("周回数は1〜100の整数にしてください。");
    }
    if (!startDate || !deadline || deadline < startDate) {
      return setError("期限は開始日以降に設定してください。");
    }
    if (weekdays.length === 0) return setError("学習する曜日を選択してください。");
    if (studyDays === 0) return setError("期間内に学習できる曜日がありません。");

    const newPlan: Plan = {
      id: crypto.randomUUID(),
      deckName: deckName.trim(),
      totalItems: total,
      startDate,
      deadline,
      rounds: roundCount,
      weekdays,
      createdAt: new Date().toISOString(),
    };

    setPlans((current) => [newPlan, ...current]);
    setDeckName("");
    setError("");
  }

  function deletePlan(id: string) {
    if (!window.confirm("この学習計画を削除しますか？")) return;
    setPlans((current) => current.filter((plan) => plan.id !== id));
  }

  const inputClass =
    "w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100";
  const labelClass = "mb-2 block text-sm font-medium text-slate-700";

  return (
    <main className="min-h-screen bg-[#F7F8FA] text-slate-800">
      <div className="mx-auto max-w-6xl px-4 pb-12 pt-5 sm:px-8 sm:pt-8">
        <header className="mb-8">
          <div className="mb-8 flex items-center justify-between gap-4">
            <details className="relative">
              <summary
                aria-label="ナビゲーションメニュー"
                className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 [&::-webkit-details-marker]:hidden"
              >
                <span aria-hidden="true" className="flex flex-col gap-[5px]">
                  <span className="h-[2px] w-5 rounded bg-current" />
                  <span className="h-[2px] w-5 rounded bg-current" />
                  <span className="h-[2px] w-5 rounded bg-current" />
                </span>
              </summary>
              <nav className="absolute left-0 top-14 z-50 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                <Link href="/today" className="block rounded-xl px-4 py-3 text-sm hover:bg-slate-50">今日のノルマ</Link>
                <Link href="/plan" className="block rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold">学習計画</Link>
                <Link href="/tasks" className="block rounded-xl px-4 py-3 text-sm hover:bg-slate-50">タスク管理</Link>
                <Link href="/calendar" className="block rounded-xl px-4 py-3 text-sm hover:bg-slate-50">学習カレンダー</Link>
              </nav>
            </details>

            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-medium text-slate-600">Learning workspace</span>
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Plan your progress</p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">学習計画<span className="text-slate-300">.</span></h1>
              <p className="mt-3 text-sm leading-7 text-slate-500 sm:text-base">学びを設計する。小さな積み重ねを、確かな力に。</p>
            </div>
            <p className="text-sm text-slate-500">
              {new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short" }).format(new Date())}
            </p>
          </div>
        </header>

        <section className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { label: "すべての計画", value: loaded ? fmt.format(plans.length) : "—", note: "これまでに作成した計画" },
            { label: "進行中・期限内", value: loaded ? fmt.format(activePlans.length) : "—", note: "期限を迎えていない計画" },
            { label: "1日の学習目安", value: loaded ? fmt.format(totalDaily) : "—", note: "期限内の計画から算出", unit: "項目" },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">{item.label}</p>
              <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
                {item.value}<span className="ml-2 text-sm font-normal text-slate-400">{item.unit ?? "件"}</span>
              </p>
              <p className="mt-2 text-xs text-slate-400">{item.note}</p>
            </div>
          ))}
        </section>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
              <h2 className="font-semibold text-slate-900">＋ 新しい学習計画</h2>
              <p className="mt-1 text-xs text-slate-400">ゴールから逆算して、学習を設計する</p>
            </div>

            <form onSubmit={savePlan} className="space-y-5 p-5 sm:p-6">
              <div>
                <label htmlFor="deckName" className={labelClass}>教材・デッキ名</label>
                <input id="deckName" value={deckName} onChange={(e) => setDeckName(e.target.value)} placeholder="例：HSK 7–9級、台湾華語中級" className={inputClass} required />
              </div>

              <div>
                <label htmlFor="totalItems" className={labelClass}>総単語数・総ページ数</label>
                <input id="totalItems" type="number" min="1" step="1" value={totalItems} onChange={(e) => setTotalItems(e.target.value)} className={inputClass} required />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="startDate" className={labelClass}>開始日</label>
                  <input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} required />
                </div>
                <div>
                  <label htmlFor="deadline" className={labelClass}>完了期限</label>
                  <input id="deadline" type="date" min={startDate} value={deadline} onChange={(e) => setDeadline(e.target.value)} className={inputClass} required />
                </div>
              </div>

              <div>
                <label htmlFor="rounds" className={labelClass}>目標周回数</label>
                <select id="rounds" value={rounds} onChange={(e) => setRounds(e.target.value)} className={inputClass}>
                  {[1, 2, 3, 4, 5, 6, 7, 10, 15, 20].map((n) => <option key={n} value={n}>{n} 周</option>)}
                </select>
              </div>

              <fieldset>
                <legend className={labelClass}>学習する曜日</legend>
                <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                  {weekdayLabels.map((label, index) => {
                    const selected = weekdays.includes(index);
                    return (
                      <button
                        key={label}
                        type="button"
                        aria-label={weekdayNames[index]}
                        aria-pressed={selected}
                        onClick={() => toggleWeekday(index)}
                        className={`rounded-xl border py-3 text-sm font-medium transition ${selected ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"}`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-400">選択した曜日を学習日として計算します。</p>
              </fieldset>

              <div className="rounded-xl border border-blue-100 bg-[#F5F8FD] p-4 sm:p-5">
                <p className="text-sm font-medium text-slate-600">1日の学習量（目安）</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">
                  {fmt.format(estimate)} <span className="text-sm font-normal text-slate-500">項目 / 日</span>
                </p>
                <p className="mt-3 border-t border-blue-100 pt-3 text-xs leading-6 text-slate-500">
                  学習予定日 <strong className="text-slate-700">{studyDays}日</strong>
                  <span className="mx-2 text-slate-300">/</span>
                  合計 <strong className="text-slate-700">{fmt.format(total * roundCount)}項目分</strong>
                </p>
                {studyDays === 0 && <p className="mt-2 text-xs text-amber-700">開始日・期限・曜日を設定すると目安が表示されます。</p>}
              </div>

              {error && <p role="alert" className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

              <button type="submit" className="w-full rounded-xl bg-slate-900 px-5 py-4 text-sm font-medium text-white transition hover:bg-slate-800">
                学習計画を保存する <span aria-hidden="true">→</span>
              </button>
            </form>
          </section>

          <section className="min-w-0">
            <div className="mb-5">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Your library</p>
              <h2 className="text-xl font-semibold text-slate-900">保存した学習計画</h2>
              <p className="mt-1 text-sm text-slate-500">{loaded ? `${plans.length} 件の計画` : "読み込み中..."}</p>
            </div>

            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
              <input aria-label="学習計画を検索" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="教材名で検索..." className={inputClass} />
              <select aria-label="並び替え" value={sortBy} onChange={(e) => setSortBy(e.target.value as "deadline" | "createdAt")} className={`${inputClass} sm:w-auto`}>
                <option value="deadline">期限が近い順</option>
                <option value="createdAt">新しく作成した順</option>
              </select>
            </div>

            {!loaded ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">学習計画を読み込んでいます...</div>
            ) : plans.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                <p className="font-medium text-slate-800">最初の計画をつくりましょう</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">教材と期限を設定すると、今日から必要な学習量が見えてきます。</p>
              </div>
            ) : filteredPlans.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
                <p className="text-sm text-slate-500">「{search}」に一致する計画はありません。</p>
                <button type="button" onClick={() => setSearch("")} className="mt-3 text-sm font-medium text-blue-700">検索をクリア</button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPlans.map((plan) => {
                  const remaining = remainingDays(plan.deadline);
                  const status = remaining < 0 ? "期限超過" : remaining === 0 ? "本日期限" : "進行中";
                  const statusClass = remaining < 0 ? "bg-rose-50 text-rose-700" : remaining === 0 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700";
                  const scheduled = countStudyDays(plan.startDate, plan.deadline, plan.weekdays);

                  return (
                    <article key={plan.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 sm:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="break-words font-semibold text-slate-900">{plan.deckName}</h3>
                            <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${statusClass}`}>{status}</span>
                          </div>
                          <p className="mt-2 text-xs text-slate-500">{fmt.format(plan.totalItems)}項目 <span className="mx-1 text-slate-300">·</span> {plan.rounds}周</p>
                        </div>
                        <button type="button" onClick={() => deletePlan(plan.id)} aria-label={`${plan.deckName}の計画を削除`} className="shrink-0 rounded-lg px-3 py-2 text-xs text-slate-400 hover:bg-rose-50 hover:text-rose-600">削除</button>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-[11px] text-slate-500">1日の学習目安</p>
                          <p className="mt-1 text-xl font-semibold text-slate-900">{fmt.format(dailyTarget(plan))}<span className="ml-1 text-xs font-normal text-slate-500">項目</span></p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-[11px] text-slate-500">{remaining < 0 ? "期限から" : "残り日数"}</p>
                          <p className={`mt-1 text-xl font-semibold ${remaining < 0 ? "text-rose-600" : "text-slate-900"}`}>{Math.abs(remaining)}<span className="ml-1 text-xs font-normal text-slate-500">日</span></p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span>{formatDate(plan.startDate)} – {formatDate(plan.deadline)}</span>
                        <span className="text-slate-300">·</span>
                        <span>{plan.weekdays.map((day) => weekdayLabels[day]).join("・")}</span>
                      </div>
                      <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-400">
                        学習予定 {scheduled}日 · 合計 {fmt.format(plan.totalItems * plan.rounds)}項目分
                      </p>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <footer className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6">
          <p className="text-xs text-slate-400">Anki Workspace · Make learning intentional.</p>
          <nav aria-label="関連ページ" className="flex flex-wrap gap-4 text-sm">
            <Link href="/today" className="text-slate-500 hover:text-slate-900">今日のノルマ</Link>
            <Link href="/tasks" className="text-slate-500 hover:text-slate-900">タスク管理</Link>
            <Link href="/calendar" className="text-slate-500 hover:text-slate-900">学習カレンダー</Link>
          </nav>
        </footer>
      </div>
    </main>
  );
}
