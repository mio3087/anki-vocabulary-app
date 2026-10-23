"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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

function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
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
    const jsDay = date.getDay();
    const mondayBasedDay = (jsDay + 6) % 7;
    if (weekdays.includes(mondayBasedDay)) count++;
  }

  return count;
}

function dailyTarget(plan: Plan) {
  const days = countStudyDays(
    plan.startDate,
    plan.deadline,
    plan.weekdays
  );
  if (days === 0) return 0;
  return Math.ceil((plan.totalItems * plan.rounds) / days);
}

function remainingDays(deadline: string) {
  if (!deadline) return 0;
  const end = new Date(`${deadline}T00:00:00`);
  const today = new Date(`${todayString()}T00:00:00`);
  return Math.ceil((end.getTime() - today.getTime()) / 86400000);
}

export default function StudyPlanPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [deckName, setDeckName] = useState("");
  const [totalItems, setTotalItems] = useState("100");
  const [startDate, setStartDate] = useState(todayString());
  const [deadline, setDeadline] = useState("");
  const [rounds, setRounds] = useState("1");
  const [weekdays, setWeekdays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setPlans(JSON.parse(saved));
    } catch (error) {
      console.error("学習計画の読み込みに失敗しました", error);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
  }, [plans, loaded]);

  const filteredPlans = useMemo(() => {
    return plans
      .filter((plan) =>
        plan.deckName.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => a.deadline.localeCompare(b.deadline));
  }, [plans, search]);

  function toggleWeekday(day: number) {
    setWeekdays((current) =>
      current.includes(day)
        ? current.filter((d) => d !== day)
        : [...current, day].sort((a, b) => a - b)
    );
  }

  function addPlan(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const total = Number(totalItems);
    const roundCount = Number(rounds);

    if (!deckName.trim()) {
      alert("教材名を入力してください。");
      return;
    }

    if (!Number.isFinite(total) || total <= 0) {
      alert("教材の総量は1以上で入力してください。");
      return;
    }

    if (!Number.isFinite(roundCount) || roundCount <= 0) {
      alert("周回数は1以上で入力してください。");
      return;
    }

    if (!deadline || deadline < startDate) {
      alert("期限は開始日以降の日付にしてください。");
      return;
    }

    if (weekdays.length === 0) {
      alert("学習する曜日を1つ以上選んでください。");
      return;
    }

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
    setTotalItems("100");
    setRounds("1");
  }

  function deletePlan(id: string) {
    if (!window.confirm("この学習計画を削除しますか？")) return;
    setPlans((current) => current.filter((plan) => plan.id !== id));
  }

  const today = todayString();

  return (
    <main className="min-h-screen bg-[#f6f7f4] text-[#20251f]">
      <div className="mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-12">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#71806c]">
              Your Anki · Planning
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              学習計画
            </h1>
            <p className="mt-2 text-sm text-[#7c8278]">
              ゴールから逆算して、毎日の学習量を決める。
            </p>
          </div>
          <Link
            href="/today"
            className="rounded-full border border-[#dfe4da] bg-white px-5 py-3 text-sm transition hover:bg-[#edf1e9]"
          >
            今日のノルマ →
          </Link>
        </header>

        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <section className="h-fit rounded-3xl border border-[#e5e8e0] bg-white p-6 shadow-sm md:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#829079]">
              New plan
            </p>
            <h2 className="mt-2 text-xl font-semibold">計画を作成</h2>
            <p className="mt-2 text-sm leading-6 text-[#858b81]">
              登録した計画から、学習日数と1日あたりの目標量を自動計算します。
            </p>

            <form onSubmit={addPlan} className="mt-6 space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-medium">教材名</span>
                <input
                  value={deckName}
                  onChange={(e) => setDeckName(e.target.value)}
                  placeholder="例：ドイツ語 C1 単語"
                  className="w-full rounded-xl border border-[#e1e5dc] bg-[#fbfcfa] px-4 py-3 outline-none transition focus:border-[#819477]"
                  required
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium">教材の総量</span>
                  <input
                    type="number"
                    min="1"
                    value={totalItems}
                    onChange={(e) => setTotalItems(e.target.value)}
                    className="w-full rounded-xl border border-[#e1e5dc] bg-[#fbfcfa] px-4 py-3 outline-none focus:border-[#819477]"
                    required
                  />
                  <span className="mt-1 block text-xs text-[#92978f]">
                    単語・ページなど
                  </span>
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium">周回数</span>
                  <input
                    type="number"
                    min="1"
                    value={rounds}
                    onChange={(e) => setRounds(e.target.value)}
                    className="w-full rounded-xl border border-[#e1e5dc] bg-[#fbfcfa] px-4 py-3 outline-none focus:border-[#819477]"
                    required
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium">開始日</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-xl border border-[#e1e5dc] bg-[#fbfcfa] px-3 py-3 text-sm outline-none focus:border-[#819477]"
                    required
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium">期限</span>
                  <input
                    type="date"
                    value={deadline}
                    min={startDate}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full rounded-xl border border-[#e1e5dc] bg-[#fbfcfa] px-3 py-3 text-sm outline-none focus:border-[#819477]"
                    required
                  />
                </label>
              </div>

              <div>
                <span className="mb-3 block text-sm font-medium">
                  学習する曜日
                </span>
                <div className="grid grid-cols-7 gap-1.5">
                  {weekdayLabels.map((label, index) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => toggleWeekday(index)}
                      className={`rounded-lg py-3 text-sm transition ${
                        weekdays.includes(index)
                          ? "bg-[#52684d] text-white"
                          : "bg-[#f1f3ee] text-[#81877d] hover:bg-[#e7ebe2]"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-[#52684d] px-4 py-3.5 text-sm font-medium text-white transition hover:bg-[#40563b]"
              >
                ＋ 学習計画を追加
              </button>
            </form>
          </section>

          <section>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#829079]">
                  Overview
                </p>
                <h2 className="mt-2 text-xl font-semibold">登録済みの計画</h2>
              </div>
              <span className="text-sm text-[#858b81]">
                {plans.length} 件
              </span>
            </div>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="教材名で検索..."
              className="mb-4 w-full rounded-xl border border-[#e5e8e0] bg-white px-4 py-3 outline-none focus:border-[#819477]"
            />

            {filteredPlans.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[#d9dfd3] bg-white/60 px-6 py-16 text-center">
                <p className="text-base font-medium text-[#5d6658]">
                  {search ? "該当する計画がありません" : "まだ計画がありません"}
                </p>
                <p className="mt-2 text-sm text-[#92978f]">
                  左側のフォームから最初の計画を作成しましょう。
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPlans.map((plan) => {
                  const perDay = dailyTarget(plan);
                  const daysLeft = remainingDays(plan.deadline);
                  const studyDays = countStudyDays(
                    plan.startDate,
                    plan.deadline,
                    plan.weekdays
                  );
                  const isActive =
                    plan.startDate <= today && plan.deadline >= today;

                  return (
                    <article
                      key={plan.id}
                      className="rounded-3xl border border-[#e5e8e0] bg-white p-5 shadow-sm md:p-6"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs ${
                                isActive
                                  ? "bg-[#e8efe4] text-[#52684d]"
                                  : daysLeft < 0
                                  ? "bg-[#f7e9e5] text-[#9b5a4c]"
                                  : "bg-[#f0f1ed] text-[#7b8176]"
                              }`}
                            >
                              {isActive
                                ? "計画期間中"
                                : daysLeft < 0
                                ? "期限超過"
                                : "開始前"}
                            </span>
                            <span className="text-xs text-[#92978f]">
                              {plan.rounds} 周
                            </span>
                          </div>
                          <h3 className="mt-3 break-words text-lg font-semibold">
                            {plan.deckName}
                          </h3>
                          <p className="mt-1 text-sm text-[#858b81]">
                            {plan.startDate} ～ {plan.deadline}
                          </p>
                        </div>
                        <button
                          onClick={() => deletePlan(plan.id)}
                          className="shrink-0 rounded-full px-3 py-2 text-sm text-[#969b92] transition hover:bg-[#f8eeeb] hover:text-[#a55e4e]"
                          aria-label={`${plan.deckName}を削除`}
                        >
                          削除
                        </button>
                      </div>

                      <div className="mt-5 grid grid-cols-3 gap-2">
                        <div className="rounded-2xl bg-[#f7f8f5] p-3">
                          <p className="text-xs text-[#858b81]">教材の総量</p>
                          <p className="mt-1 text-lg font-semibold">
                            {plan.totalItems.toLocaleString()}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-[#f7f8f5] p-3">
                          <p className="text-xs text-[#858b81]">学習日数</p>
                          <p className="mt-1 text-lg font-semibold">
                            {studyDays}
                            <span className="ml-1 text-xs font-normal">日</span>
                          </p>
                        </div>
                        <div className="rounded-2xl bg-[#edf2e9] p-3">
                          <p className="text-xs text-[#687961]">1日あたり</p>
                          <p className="mt-1 text-lg font-semibold text-[#52684d]">
                            {perDay.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-[#858b81]">
                        <span>
                          学習曜日：{plan.weekdays
                            .slice()
                            .sort((a, b) => a - b)
                            .map((d) => weekdayLabels[d])
                            .join("・")}
                        </span>
                        <span>
                          {daysLeft >= 0
                            ? `期限まで ${daysLeft} 日`
                            : `${Math.abs(daysLeft)} 日経過`}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <footer className="mt-12 flex flex-wrap gap-3 border-t border-[#e2e6dd] pt-6 text-sm text-[#81877d]">
          <Link href="/today" className="hover:text-[#52684d]">今日のノルマ</Link>
          <Link href="/tasks" className="hover:text-[#52684d]">タスク管理</Link>
          <Link href="/calendar" className="hover:text-[#52684d]">学習カレンダー</Link>
        </footer>
      </div>
    </main>
  );
}