

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";

type Mood = "happy" | "calm" | "grateful" | "tired" | "sad";

type Moment = {
  date: string;
  mood: Mood;
  highlights: string;
  note: string;
  updatedAt: string;
};

const STORAGE_KEY = "anki-little-moments-v1";

const moods: {
  id: Mood;
  emoji: string;
  label: string;
  color: string;
  background: string;
}[] = [
  { id: "happy", emoji: "☀️", label: "嬉しい", color: "#997344", background: "#FBF0D9" },
  { id: "calm", emoji: "🌿", label: "穏やか", color: "#577761", background: "#EAF1E9" },
  { id: "grateful", emoji: "🌷", label: "感動", color: "#AD747B", background: "#F8E9EB" },
  { id: "tired", emoji: "☁️", label: "疲れた", color: "#77788A", background: "#EEEEF4" },
  { id: "sad", emoji: "🌧️", label: "落ち込み", color: "#64859A", background: "#E8F0F5" },
];

const weekdays = ["月", "火", "水", "木", "金", "土", "日"];

function formatDate(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatLongDate(date: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date(`${date}T12:00:00`));
}

function getMood(id: Mood) {
  return moods.find((item) => item.id === id) ?? moods[1];
}

function loadLocal(): Moment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item): item is Moment =>
        item &&
        typeof item.date === "string" &&
        typeof item.highlights === "string" &&
        typeof item.note === "string"
    );
  } catch {
    return [];
  }
}

// 日付ごとに記録をまとめ、新しい記録を優先する
function mergeEntries(remote: Moment[], local: Moment[]): Moment[] {
  const map = new Map<string, Moment>();

  for (const entry of [...remote, ...local]) {
    const previous = map.get(entry.date);

    if (
      !previous ||
      (entry.updatedAt || "") >= (previous.updatedAt || "")
    ) {
      map.set(entry.date, entry);
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
}


    export default function LittleMomentsPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  const today = formatDate(new Date());


  const [currentMonth, setCurrentMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState(today);

  const [entries, setEntries] = useState<Moment[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [mood, setMood] = useState<Mood>("calm");
  const [highlights, setHighlights] = useState("");
  const [note, setNote] = useState("");
  const [showAllEntries, setShowAllEntries] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // ログイン状態を確認し、記録を読み込む
  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoaded(false);
      setUser(currentUser);
      setMessage("");

      try {
        // まずブラウザにあるバックアップを読み込む
        const localEntries = loadLocal();
        let remoteEntries: Moment[] = [];

        // ログイン中ならFirestoreからも読み込む
        if (currentUser) {
          const ref = doc(db, "littleMoments", currentUser.uid);
          const snapshot = await getDoc(ref);

          if (!active) return;

          if (snapshot.exists()) {
            const saved = snapshot.data().entries;

            if (Array.isArray(saved)) {
              remoteEntries = saved.filter(
                (item): item is Moment =>
                  item &&
                  typeof item.date === "string" &&
                  typeof item.highlights === "string" &&
                  typeof item.note === "string"
              );
            }
          }
        }

        if (!active) return;

        // 両方の記録を統合する
        const merged = mergeEntries(remoteEntries, localEntries);

        setEntries(merged);

        // 統合した記録をブラウザにバックアップ
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));

        // Firestoreが空で、ブラウザに記録がある場合は復元を試みる
        if (
          currentUser &&
          remoteEntries.length === 0 &&
          merged.length > 0
        ) {
          await setDoc(
            doc(db, "littleMoments", currentUser.uid),
            {
              entries: merged,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        }
      } catch (error) {
        console.error("little moments 読み込みエラー:", error);

        if (!active) return;

        // Firestoreが読めなくてもブラウザの記録を表示する
        setEntries(loadLocal());
        setMessage(
          "クラウドの記録を読み込めませんでした。ブラウザのバックアップを表示しています。"
        );
      } finally {
        if (active) setLoaded(true);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  // 選択した日の記録を入力欄に表示する
  useEffect(() => {
    if (!loaded) return;

    const entry = entries.find((item) => item.date === selectedDate);

    setMood(entry?.mood ?? "calm");
    setHighlights(entry?.highlights ?? "");
    setNote(entry?.note ?? "");
    setConfirmDelete(false);
  }, [entries, selectedDate, loaded]);

  // 記録を保存する
  async function saveEntry() {
    if (!loaded || saving) return;

    const entry: Moment = {
      date: selectedDate,
      mood,
      highlights: highlights.trim(),
      note: note.trim(),
      updatedAt: new Date().toISOString(),
    };

    const newEntries = [
      ...entries.filter((item) => item.date !== selectedDate),
      entry,
    ].sort((a, b) => a.date.localeCompare(b.date));

    setSaving(true);
    setMessage("");

    try {
      // 先にブラウザに保存する
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newEntries));
      setEntries(newEntries);

      // ログイン中ならFirestoreにも保存する
      if (user) {
        await setDoc(
          doc(db, "littleMoments", user.uid),
          {
            entries: newEntries,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }

      setMessage(
        user
          ? "記録を保存しました 🌿"
          : "このブラウザに記録を保存しました 🌿"
      );
      setConfirmDelete(false);
    } catch (error) {
      console.error("little moments 保存エラー:", error);

      setMessage(
        "ブラウザには記録を保存しました。クラウド保存に失敗した可能性があるため、Firebaseの設定を確認してください。"
      );
    } finally {
      setSaving(false);
    }
  }

  // 記録を削除する
  async function deleteEntry() {
    if (!loaded || saving) return;

    const newEntries = entries.filter(
      (item) => item.date !== selectedDate
    );

    setSaving(true);
    setMessage("");

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newEntries));
      setEntries(newEntries);

      if (user) {
        await setDoc(
          doc(db, "littleMoments", user.uid),
          {
            entries: newEntries,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }

      setMood("calm");
      setHighlights("");
      setNote("");
      setConfirmDelete(false);
      setMessage("記録を削除しました。");
    } catch (error) {
      console.error("little moments 削除エラー:", error);
      setMessage(
        "ブラウザ側は更新しましたが、クラウド側の更新に失敗した可能性があります。"
      );
    } finally {
      setSaving(false);
    }
  }

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const calendarCells = useMemo(() => {
    const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
    const days = new Date(year, month + 1, 0).getDate();

    const cells: (string | null)[] = [
      ...Array.from({ length: firstDay }, () => null),
      ...Array.from({ length: days }, (_, index) =>
        formatDate(new Date(year, month, index + 1))
      ),
    ];

    while (cells.length % 7 !== 0) cells.push(null);

    return cells;
  }, [year, month]);

  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;

  const monthEntries = entries
    .filter((entry) => entry.date.startsWith(monthPrefix))
    .sort((a, b) => b.date.localeCompare(a.date));

  const selectedEntry = entries.find(
    (entry) => entry.date === selectedDate
  );

  const recordedDays = monthEntries.filter(
    (entry) => entry.highlights.trim() || entry.note.trim()
  ).length;

  const moodCounts = moods.map((item) => ({
    ...item,
    count: monthEntries.filter((entry) => entry.mood === item.id).length,
  }));

  const favoriteMood = [...moodCounts]
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)[0];

  const panel =
    "rounded-[1.6rem] border border-[#e8e4d9] bg-[#fffefa] p-5 shadow-[0_8px_28px_rgba(65,76,57,0.045)] sm:p-7";

  const secondaryButton =
    "rounded-xl border border-[#e3dfd3] bg-white px-4 py-2.5 text-sm font-medium text-[#5b6557] transition hover:bg-[#f5f5ed]";

  const primaryButton =
    "rounded-xl bg-[#536e59] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#425b48] disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <main className="min-h-screen bg-[#f7f6ef] px-4 pb-12 pt-7 text-[#373e35] sm:px-7 sm:pt-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">



        



          <div className="mt-7 flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#9b9a85]">
                A collection of little joys
              </p>
              <h1 className="mt-2 text-4xl font-medium tracking-tight text-[#425344] sm:text-5xl">
                Little Moments
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-[#777b6d] sm:text-base">
                大きな出来事じゃなくてもいい。
                <br className="hidden sm:block" />
                今日の小さな幸せを、ここに残そう。
              </p>
            </div>

            <div className="hidden h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#e9eee3] text-4xl sm:flex">
              🌿
            </div>
          </div>

        </header>

        {message && (
          <p
            role="status"
            className="mb-5 rounded-xl border border-[#dce5d7] bg-[#f0f5ed] p-4 text-sm leading-6 text-[#526b56]"
          >
            {message}
          </p>
        )}

        {!loaded && (
          <div className={`${panel} mb-6 text-sm text-[#798273]`}>
            🌿 記録を読み込んでいます...
          </div>
        )}

        <section className={`${panel} mb-6`}>
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-medium tracking-widest text-[#a09c88]">
                A MOMENT FOR YOURSELF
              </p>
              <h2 className="mt-2 text-xl font-medium text-[#425344]">
                {formatLongDate(today)}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#858577]">
                今日はどんな一日だった？
                <br />
                ほんの小さなことでも、書き留めておこう。
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedDate(today);
                setCurrentMonth(
                  new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                );
              }}
              className="self-start rounded-full bg-[#eaf0e5] px-4 py-2.5 text-sm font-medium text-[#526b56] transition hover:bg-[#dfe9d9] sm:self-center"
            >
              今日を記録する ↗
            </button>
          </div>
        </section>

        <section className={`${panel} mb-6`}>
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.2em] text-[#a09c88]">
                YOUR MONTH
              </p>
              <h2 className="mt-1 text-2xl font-medium tracking-tight text-[#425344]">
                {year}年 {month + 1}月
              </h2>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                aria-label="前月"
                onClick={() =>
                  setCurrentMonth((current) =>
                    new Date(current.getFullYear(), current.getMonth() - 1, 1)
                  )
                }
                className={secondaryButton}
              >
                ←
              </button>
              <button
                type="button"
                aria-label="翌月"
                onClick={() =>
                  setCurrentMonth((current) =>
                    new Date(current.getFullYear(), current.getMonth() + 1, 1)
                  )
                }
                className={secondaryButton}
              >
                →
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {weekdays.map((day, index) => (
              <div
                key={day}
                className={`py-2 text-center text-xs font-medium ${
                  index === 5
                    ? "text-[#7995a2]"
                    : index === 6
                      ? "text-[#c18c8e]"
                      : "text-[#aaa797]"
                }`}
              >
                {day}
              </div>
            ))}

            {calendarCells.map((date, index) => {
              const entry = date
                ? entries.find((item) => item.date === date)
                : undefined;

              const isSelected = date === selectedDate;
              const isToday = date === today;

              return (
                <button
                  key={date ?? `blank-${index}`}
                  type="button"
                  disabled={!date || !loaded}
                  onClick={() => date && setSelectedDate(date)}
                  aria-pressed={isSelected}
                  className={`flex min-h-[58px] min-w-0 flex-col items-center justify-center gap-1 rounded-xl border text-sm transition sm:min-h-[76px] ${
                    !date
                      ? "border-transparent bg-transparent"
                      : isSelected
                        ? "border-[#708873] bg-[#eaf0e5] text-[#425344] shadow-sm"
                        : isToday
                          ? "border-[#d8b4a9] bg-[#fcf1ed] text-[#6c5b50]"
                          : "border-transparent bg-[#faf9f3] text-[#62675c] hover:border-[#e0e4d8] hover:bg-[#f1f3eb]"
                  }`}
                >
                  {date && (
                    <>
                      <span className={isToday ? "font-bold" : "font-medium"}>
                        {Number(date.slice(-2))}
                      </span>
                      <span className="text-base leading-none sm:text-lg">
                        {entry ? getMood(entry.mood).emoji : ""}
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-[#969585]">
            <span>🌿 記録した日には気分が表示されるよ</span>
            <span>選んだ日：{selectedDate}</span>
          </div>
        </section>

        <section className={`${panel} mb-6`}>
          <div>
            <p className="text-[11px] font-semibold tracking-[0.2em] text-[#a09c88]">
              YOUR LITTLE JOURNAL
            </p>
            <h2 className="mt-2 text-xl font-medium text-[#425344]">
              {formatLongDate(selectedDate)}
            </h2>
            <p className="mt-2 text-sm text-[#89897b]">
              どんな気持ちも、そのまま大切に。
            </p>
          </div>

          <div className="mt-7">
            <label className="mb-3 block text-sm font-medium text-[#596454]">
              今日の気分
            </label>
            <div className="grid grid-cols-5 gap-2">
              {moods.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMood(item.id)}
                  aria-pressed={mood === item.id}
                  className={`flex flex-col items-center gap-2 rounded-2xl border p-2 py-4 transition sm:py-5 ${
                    mood === item.id
                      ? "border-[#829783] shadow-sm"
                      : "border-[#ebe8dd] bg-white hover:bg-[#faf9f3]"
                  }`}
                  style={{
                    background: mood === item.id ? item.background : undefined,
                  }}
                >
                  <span className="text-2xl sm:text-3xl">{item.emoji}</span>
                  <span
                    className="text-[10px] font-medium sm:text-xs"
                    style={{
                      color: mood === item.id ? item.color : "#8d8c7e",
                    }}
                  >
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-7">
            <label htmlFor="highlights" className="block text-sm font-medium text-[#596454]">
              ✿ 今日の小さな幸せ
            </label>
            <p className="mt-1 text-xs leading-5 text-[#999787]">
              例：おいしいコーヒーを飲んだ。面白いアイデアが浮かんだ。
            </p>
            <textarea
              id="highlights"
              value={highlights}
              onChange={(event) => setHighlights(event.target.value)}
              placeholder="今日、心がちょっと嬉しくなったことは？"
              rows={3}
              className="mt-3 w-full resize-y rounded-2xl border border-[#e7e4d8] bg-[#fdfcf7] p-4 text-sm leading-7 text-[#424a40] outline-none transition placeholder:text-[#b0ad9e] focus:border-[#94a592] focus:ring-2 focus:ring-[#eaf0e5]"
            />
          </div>

          <div className="mt-6">
            <label htmlFor="note" className="block text-sm font-medium text-[#596454]">
              今日のこと、自由に書こう
            </label>
            <p className="mt-1 text-xs leading-5 text-[#999787]">
              感じたこと、考えたこと、忘れたくない瞬間。
            </p>
            <textarea
              id="note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Dear diary..."
              rows={5}
              className="mt-3 w-full resize-y rounded-2xl border border-[#e7e4d8] bg-[#fdfcf7] p-4 text-sm leading-7 text-[#424a40] outline-none transition placeholder:text-[#b0ad9e] focus:border-[#94a592] focus:ring-2 focus:ring-[#eaf0e5]"
            />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={saveEntry}
              disabled={!loaded || saving}
              className={primaryButton}
            >
              {saving
                ? "保存中..."
                : selectedEntry
                  ? "記録を更新する ↗"
                  : "この日の記録を保存する ↗"}
            </button>

            {selectedEntry && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                disabled={saving}
                className="rounded-xl px-4 py-3 text-sm text-[#a27d78] transition hover:bg-[#fbefeb]"
              >
                削除
              </button>
            )}
          </div>

          {confirmDelete && (
            <div className="mt-4 rounded-xl border border-[#ead8d0] bg-[#fcf3ee] p-4">
              <p className="text-sm text-[#825b51]">
                {selectedDate} の記録を削除しますか？
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={deleteEntry}
                  disabled={saving}
                  className="rounded-lg bg-[#a66f65] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  削除する
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className={secondaryButton}
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}
        </section>

        <section className={`${panel} mb-6`}>
          <p className="text-[11px] font-semibold tracking-[0.2em] text-[#a09c88]">
            A MONTH TO REMEMBER
          </p>
          <h2 className="mt-2 text-xl font-medium text-[#425344]">
            {month + 1}月の振り返り
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#89897b]">
            小さな瞬間も、集まれば大切な思い出になる。
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-[#edf1e7] p-4">
              <p className="text-xs text-[#78866f]">記録した日</p>
              <p className="mt-2 text-3xl font-medium text-[#506650]">
                {monthEntries.length}<span className="ml-1 text-sm">日</span>
              </p>
            </div>

            <div className="rounded-2xl bg-[#f8e9e9] p-4">
              <p className="text-xs text-[#a77f83]">今月の気分</p>
              <p className="mt-2 text-2xl">{favoriteMood?.emoji ?? "🌷"}</p>
              <p className="mt-1 text-sm text-[#926f72]">
                {favoriteMood?.label ?? "これから記録しよう"}
              </p>
            </div>

            <div className="col-span-2 rounded-2xl bg-[#f6f0e2] p-4 sm:col-span-1">
              <p className="text-xs text-[#9b8b69]">思い出を書いた日</p>
              <p className="mt-2 text-3xl font-medium text-[#82734f]">
                {recordedDays}<span className="ml-1 text-sm">日</span>
              </p>
            </div>
          </div>

          {monthEntries.length > 0 && (
            <div className="mt-5 border-t border-[#eeeadd] pt-5">
              <h3 className="text-sm font-medium text-[#596454]">今月の気分</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {moodCounts.filter((item) => item.count > 0).map((item) => (
                  <span
                    key={item.id}
                    className="rounded-full px-3 py-2 text-xs"
                    style={{ color: item.color, background: item.background }}
                  >
                    {item.emoji} {item.label} · {item.count}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className={`${panel} mb-7`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.2em] text-[#a09c88]">
                LITTLE MEMORIES
              </p>
              <h2 className="mt-2 text-xl font-medium text-[#425344]">
                最近の記録
              </h2>
            </div>

            {monthEntries.length > 0 && (
              <button
                type="button"
                onClick={() => setShowAllEntries((current) => !current)}
                className="text-sm text-[#71806c] hover:text-[#425344]"
              >
                {showAllEntries ? "閉じる ↑" : "もっと見る ↓"}
              </button>
            )}
          </div>

          {monthEntries.length === 0 ? (
            <div className="mt-6 rounded-2xl bg-[#faf9f3] px-5 py-8 text-center">
              <p className="text-3xl">🌼</p>
              <p className="mt-3 text-sm text-[#73796c]">
                この月の記録はまだありません。
              </p>
              <p className="mt-2 text-xs leading-6 text-[#a19f90]">
                今日の小さな幸せから、始めてみよう。
              </p>
            </div>
          ) : (
            <div className="mt-5 divide-y divide-[#eeeadd]">
              {(showAllEntries ? monthEntries : monthEntries.slice(0, 3)).map((entry) => {
                const entryMood = getMood(entry.mood);

                return (
                  <button
                    key={entry.date}
                    type="button"
                    onClick={() => setSelectedDate(entry.date)}
                    className="flex w-full items-start gap-3 py-4 text-left transition hover:bg-[#faf9f3]"
                  >
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl"
                      style={{ background: entryMood.background }}
                    >
                      {entryMood.emoji}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs text-[#9b9a89]">
                        {formatLongDate(entry.date)}
                      </span>
                      <span className="mt-1 block truncate text-sm font-medium text-[#52604f]">
                        {entry.highlights || entry.note || "気分を記録した日"}
                      </span>
                      {entry.highlights && entry.note && (
                        <span className="mt-1 block truncate text-xs text-[#999787]">
                          {entry.note}
                        </span>
                      )}
                    </span>
                    <span className="pt-1 text-[#b1b09e]">›</span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <footer className="pb-5 text-center">
          <p className="text-sm text-[#87907d]">Every little moment matters.</p>
          <p className="mt-3 text-xs text-[#aaa895]">
            {!loaded
              ? "記録を読み込み中..."
              : saving
                ? "保存中..."
                : user
                  ? "☁️ Firestore ＋ ブラウザにバックアップ"
                  : "🌿 このブラウザに保存"}
          </p>
          <Link
            href="/"
            className="mt-5 inline-block text-xs text-[#8b9282] hover:text-[#52604f]"
          >
            ← Anki home
          </Link>
        </footer>
      </div>
    </main>
  );
}
