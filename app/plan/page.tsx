
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

const weekdayLabels = [
  "月",
  "火",
  "水",
  "木",
  "金",
  "土",
  "日",
];

function localDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function countStudyDays(
  start: string,
  end: string,
  weekdays: number[]
) {
  if (!start || !end || end < start || weekdays.length === 0) {
    return 0;
  }

  const current = new Date(`${start}T12:00:00`);
  const last = new Date(`${end}T12:00:00`);
  let count = 0;

  while (current <= last) {
    // JavaScript: 日曜=0、月曜=1 ... 土曜=6
    const day = (current.getDay() + 6) % 7;

    if (weekdays.includes(day)) {
      count++;
    }

    current.setDate(current.getDate() + 1);
  }

  return count;
}

export default function PlansPage() {
  const today = localDateString(new Date());

  const [deckName, setDeckName] = useState("");
  const [totalItems, setTotalItems] = useState("5000");
  const [startDate, setStartDate] = useState(today);
  const [deadline, setDeadline] = useState("");
  const [rounds, setRounds] = useState("3");
  const [weekdays, setWeekdays] = useState<number[]>([
    0, 1, 2, 3, 4,
  ]);

  const [plans, setPlans] = useState<Plan[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  // 保存済み計画を読み込む
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);

      if (stored) {
        const parsed: unknown = JSON.parse(stored);

        if (Array.isArray(parsed)) {
          setPlans(parsed as Plan[]);
        }
      }
    } catch {
      setError("保存済みの計画を読み込めませんでした。");
    } finally {
      setLoaded(true);
    }
  }, []);

  // 計画をブラウザ内に保存する
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

  const studyDays = countStudyDays(
    startDate,
    deadline,
    weekdays
  );

  const dailyTarget =
    studyDays > 0
      ? Math.ceil((total * roundCount) / studyDays)
      : 0;

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

    if (!deckName.trim()) {
      setError("教材名を入力してください。");
      return;
    }

    if (total <= 0 || !Number.isInteger(total)) {
      setError("総単語数・総ページ数は1以上の整数にしてください。");
      return;
    }

    if (
      roundCount <= 0 ||
      !Number.isInteger(roundCount) ||
      roundCount > 100
    ) {
      setError("周回数は1〜100の整数にしてください。");
      return;
    }

    if (!startDate || !deadline || deadline < startDate) {
      setError("期限は開始日以降に設定してください。");
      return;
    }

    if (weekdays.length === 0) {
      setError("学習する曜日を1日以上選択してください。");
      return;
    }

    const days = countStudyDays(
      startDate,
      deadline,
      weekdays
    );

    if (days === 0) {
      setError("期間内に学習できる曜日がありません。");
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
    setError("");
  }

  function deletePlan(id: string) {
    if (!window.confirm("この学習計画を削除しますか？")) {
      return;
    }

    setPlans((current) =>
      current.filter((plan) => plan.id !== id)
    );
  }

  function getPlanDailyTarget(plan: Plan) {
    const days = countStudyDays(
      plan.startDate,
      plan.deadline,
      plan.weekdays
    );

    return days > 0
      ? Math.ceil((plan.totalItems * plan.rounds) / days)
      : 0;
  }

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box" as const,
    padding: "13px 14px",
    border: "1px solid #cbbd9f",
    borderRadius: 12,
    background: "#fffdf6",
    color: "#302a22",
    fontSize: 16,
  };

  const labelStyle = {
    display: "block",
    fontWeight: 700,
    marginBottom: 8,
    fontSize: 15,
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#d9c49f",
        color: "#302a22",
        padding: "28px 18px 60px",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Noto Sans JP", sans-serif',
      }}
    >
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <header style={{ marginBottom: 26 }}>
          <Link
            href="/today"
            style={{
              color: "#76503a",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            ← 今日のノルマ
          </Link>

          <p
            style={{
              color: "#71634f",
              fontWeight: 700,
              marginBottom: 4,
              marginTop: 22,
            }}
          >
            STUDY PLANNER
          </p>

          <h1 style={{ fontSize: 30, margin: "4px 0 8px" }}>
            学習計画
          </h1>

          <p style={{ color: "#655947", lineHeight: 1.8 }}>
            期限と目標を決めて、今日やることを明確にしよう。
          </p>
        </header>

        <section
          style={{
            background: "#fffdf6",
            border: "2px solid #302a22",
            borderRadius: 24,
            padding: 22,
            boxShadow: "4px 5px 0 #302a22",
            marginBottom: 30,
          }}
        >
          <h2 style={{ marginTop: 0, fontSize: 22 }}>
            ＋ 新しい学習計画
          </h2>

          <form onSubmit={savePlan}>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle} htmlFor="deckName">
                教材・デッキ名
              </label>
              <input
                id="deckName"
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                placeholder="例：HSK7-9級、台湾華語中級"
                style={inputStyle}
                required
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle} htmlFor="totalItems">
                総単語数・総ページ数
              </label>
              <input
                id="totalItems"
                type="number"
                min="1"
                step="1"
                value={totalItems}
                onChange={(e) => setTotalItems(e.target.value)}
                style={inputStyle}
                required
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 12,
                marginBottom: 20,
              }}
            >
              <div>
                <label style={labelStyle} htmlFor="startDate">
                  開始日
                </label>
                <input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={inputStyle}
                  required
                />
              </div>

              <div>
                <label style={labelStyle} htmlFor="deadline">
                  完了期限
                </label>
                <input
                  id="deadline"
                  type="date"
                  min={startDate}
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  style={inputStyle}
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: 22 }}>
              <label style={labelStyle} htmlFor="rounds">
                目標周回数
              </label>
              <select
                id="rounds"
                value={rounds}
                onChange={(e) => setRounds(e.target.value)}
                style={inputStyle}
              >
                {[1, 2, 3, 4, 5, 6, 7, 10, 15, 20].map(
                  (number) => (
                    <option key={number} value={number}>
                      {number}周
                    </option>
                  )
                )}
              </select>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>
                学習する曜日
              </label>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                  gap: 5,
                }}
              >
                {weekdayLabels.map((label, index) => {
                  const selected = weekdays.includes(index);

                  return (
                    <button
                      key={label}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleWeekday(index)}
                      style={{
                        padding: "12px 0",
                        borderRadius: 12,
                        border: selected
                          ? "2px solid #302a22"
                          : "1px solid #cbbd9f",
                        background: selected
                          ? "#302a22"
                          : "#fffdf6",
                        color: selected ? "#fffdf6" : "#655947",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <p style={{ color: "#786b58", fontSize: 13 }}>
                選択した曜日だけを学習予定日として計算します。
              </p>
            </div>

            <div
              style={{
                background: "#f3e7cf",
                borderRadius: 18,
                padding: 18,
                marginBottom: 22,
              }}
            >
              <p style={{ margin: "0 0 8px", fontWeight: 700 }}>
                1日の学習量（目安）
              </p>

              <p
                style={{
                  margin: "0 0 8px",
                  fontSize: 30,
                  fontWeight: 800,
                }}
              >
                {dailyTarget.toLocaleString()}
                <span style={{ fontSize: 15, marginLeft: 6 }}>
                  回/日
                </span>
              </p>

              <p style={{ margin: 0, color: "#71634f", fontSize: 13 }}>
                学習予定日 {studyDays}日・合計
                {(total * roundCount).toLocaleString()}回分
              </p>
            </div>

            {error && (
              <p
                role="alert"
                style={{
                  color: "#a12f26",
                  fontWeight: 700,
                  lineHeight: 1.7,
                }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              style={{
                width: "100%",
                padding: 16,
                background: "#302a22",
                color: "#fffdf6",
                border: "none",
                borderRadius: 18,
                fontSize: 17,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              学習計画を保存する
            </button>
          </form>
        </section>

        <section>
          <h2 style={{ fontSize: 23, marginBottom: 16 }}>
            保存した学習計画
          </h2>

          {!loaded ? (
            <p>読み込み中...</p>
          ) : plans.length === 0 ? (
            <div
              style={{
                background: "#f3e7cf",
                padding: 24,
                borderRadius: 20,
                textAlign: "center",
                color: "#71634f",
                lineHeight: 1.8,
              }}
            >
              まだ学習計画がありません。
              <br />
              上のフォームから最初の計画を作成しましょう。
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              {plans.map((plan) => (
                <article
                  key={plan.id}
                  style={{
                    background: "#fffdf6",
                    border: "2px solid #302a22",
                    borderRadius: 22,
                    padding: 20,
                    boxShadow: "3px 4px 0 #302a22",
                  }}
                >
                  <h3 style={{ fontSize: 21, marginTop: 0 }}>
                    {plan.deckName}
                  </h3>

                  <p>
                    教材数：{plan.totalItems.toLocaleString()}
                  </p>

                  <p>目標：{plan.rounds}周</p>

                  <p>
                    期間：{plan.startDate} ～ {plan.deadline}
                  </p>

                  <p>
                    曜日：
                    {plan.weekdays
                      .map((day) => weekdayLabels[day])
                      .join("・")}
                  </p>

                  <div
                    style={{
                      background: "#f3e7cf",
                      borderRadius: 14,
                      padding: 14,
                      marginTop: 14,
                    }}
                  >
                    <span style={{ color: "#71634f", fontSize: 13 }}>
                      1日の学習目安
                    </span>
                    <p
                      style={{
                        fontSize: 25,
                        fontWeight: 800,
                        margin: "4px 0",
                      }}
                    >
                      {getPlanDailyTarget(plan).toLocaleString()}回
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => deletePlan(plan.id)}
                    style={{
                      marginTop: 16,
                      padding: "10px 16px",
                      borderRadius: 12,
                      border: "1px solid #a64c3d",
                      background: "#fffdf6",
                      color: "#a64c3d",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    計画を削除
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        <nav
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            marginTop: 30,
          }}
        >
          <Link href="/today" style={{ color: "#65412f" }}>
            今日のノルマ
          </Link>
          <Link href="/tasks" style={{ color: "#65412f" }}>
            タスク管理
          </Link>
          <Link href="/calendar" style={{ color: "#65412f" }}>
            学習カレンダー
          </Link>
        </nav>
      </div>
    </main>
  );
}
