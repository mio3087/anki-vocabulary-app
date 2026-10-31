"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const BOOKS_KEY = "little-library-books-v1";
const LOGS_KEY = "little-library-reading-logs-v1";

type Book = {
  id: number;
  title: string;
  author?: string;
  totalPages?: string;
  status?: string;
};

type ReadingLog = {
  id: string;
  bookId: number;
  bookTitle: string;
  date: string;
  startPage: number;
  endPage: number;
  minutes: number;
  learned: string;
};

const linkClass =
  "text-sm font-medium text-[var(--anki-theme-dark)] underline-offset-4 transition hover:text-[var(--anki-theme-color)] hover:underline";

const buttonClass =
  "w-full rounded-xl border border-[var(--anki-theme-color)] bg-[var(--anki-theme-light)] px-4 py-3 text-sm font-semibold text-[var(--anki-theme-dark)] transition hover:bg-[var(--anki-theme-soft)]";

const inputClass =
  "mt-2 block w-full rounded-xl border border-[#D5D8D0] bg-white px-3 py-3 text-black outline-none placeholder:text-[#858980] focus:border-[var(--anki-theme-color)] focus:ring-2 focus:ring-[var(--anki-theme-light)]";

function ReadContent() {
  const searchParams = useSearchParams();
  const rawBookId = searchParams.get("id");
  const bookId = rawBookId ? Number(rawBookId) : null;

  const [books, setBooks] = useState<Book[]>([]);
  const [logs, setLogs] = useState<ReadingLog[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [startPage, setStartPage] = useState("1");
  const [endPage, setEndPage] = useState("1");
  const [minutes, setMinutes] = useState("15");
  const [learned, setLearned] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const savedBooks = localStorage.getItem(BOOKS_KEY);
      const savedLogs = localStorage.getItem(LOGS_KEY);

      if (savedBooks) {
        const parsed: unknown = JSON.parse(savedBooks);
        if (Array.isArray(parsed)) setBooks(parsed as Book[]);
      }

      if (savedLogs) {
        const parsed: unknown = JSON.parse(savedLogs);
        if (Array.isArray(parsed)) setLogs(parsed as ReadingLog[]);
      }
    } catch (error) {
      console.error("読書データを読み込めませんでした。", error);
    } finally {
      setLoaded(true);
    }
  }, []);

  const book = books.find((item) => item.id === bookId);

  function saveReading() {
    if (!book) return;

    const start = Number(startPage);
    const end = Number(endPage);
    const time = Number(minutes);

    if (
      !Number.isInteger(start) ||
      !Number.isInteger(end) ||
      !Number.isInteger(time) ||
      start < 1 ||
      end < start ||
      time < 1
    ) {
      setMessage("ページ数と読書時間を確認してください。");
      return;
    }

    if (book.totalPages && end > Number(book.totalPages)) {
      setMessage(`この本の総ページ数は${book.totalPages}ページです。`);
      return;
    }

    const log: ReadingLog = {
      id: `${Date.now()}`,
      bookId: book.id,
      bookTitle: book.title,
      date: new Date().toLocaleDateString("sv-SE"),
      startPage: start,
      endPage: end,
      minutes: time,
      learned: learned.trim(),
    };

    const updatedLogs = [log, ...logs];

    const updatedBooks = books.map((item) =>
      item.id === book.id ? { ...item, status: "読書中" } : item
    );

    try {
      localStorage.setItem(LOGS_KEY, JSON.stringify(updatedLogs));
      localStorage.setItem(BOOKS_KEY, JSON.stringify(updatedBooks));

      setLogs(updatedLogs);
      setBooks(updatedBooks);
      setMessage("読書記録を保存しました。おつかれさま！");
      setLearned("");
      setStartPage(String(end + 1));
      setEndPage(String(end + 1));
    } catch (error) {
      console.error("読書記録を保存できませんでした。", error);
      setMessage("保存できませんでした。ブラウザの保存容量をご確認ください。");
    }
  }

  if (!loaded) {
    return (
      <main className="min-h-screen bg-[#F7F7F5] p-8 text-black">
        読書記録を読み込んでいます…
      </main>
    );
  }

  if (bookId === null || !Number.isFinite(bookId) || !book) {
    return (
      <main className="min-h-screen bg-[#F7F7F5] px-5 py-8 text-[#30332F] sm:px-8">
        <div className="mx-auto max-w-3xl">
          <Link href="/library" className={linkClass}>
            ← Library
          </Link>

          <section className="mt-8 rounded-2xl border border-[#E6E7E1] bg-white p-7">
            <p className="text-xs tracking-[0.2em] text-[#858980]">
              LITTLE LIBRARY
            </p>
            <h1 className="mt-3 text-xl font-semibold">
              読書記録をつける本を選ぼう
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#777D75]">
              読書記録を開くには、本棚から対象の本を選んでください。
            </p>

            <Link
              href="/library/books"
              className="mt-5 inline-flex rounded-xl border border-[var(--anki-theme-color)] bg-[var(--anki-theme-light)] px-5 py-3 text-sm font-semibold text-[var(--anki-theme-dark)] transition hover:bg-[var(--anki-theme-soft)]"
            >
              本棚から本を選ぶ →
            </Link>
          </section>
        </div>
      </main>
    );
  }

  const bookLogs = logs.filter((log) => log.bookId === book.id);
  const totalMinutes = bookLogs.reduce((sum, log) => sum + log.minutes, 0);
  const totalPagesRead = bookLogs.reduce(
    (sum, log) => sum + Math.max(0, log.endPage - log.startPage + 1),
    0
  );

  return (
    <main className="min-h-screen bg-[#F7F7F5] px-5 py-8 text-[#30332F] sm:px-8">
      <div className="mx-auto max-w-3xl">
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link href="/library" className={linkClass}>
            ← Library
          </Link>
          <Link href="/library/books" className={linkClass}>
            本棚
          </Link>
          <Link href="/library/pdf" className={linkClass}>
            PDFリーダー
          </Link>
        </nav>

        <header className="mt-8">
          <p className="text-xs tracking-[0.2em] text-[#858980]">
            READING JOURNAL
          </p>
          <h1 className="mt-3 break-words text-3xl font-semibold tracking-tight">
            {book.title}
          </h1>

          {book.author && (
            <p className="mt-2 text-sm text-[#858980]">{book.author}</p>
          )}

          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-[#E6E7E1] bg-white p-3 sm:p-4">
              <p className="text-xs text-[#858980]">読書時間</p>
              <p className="mt-2 text-xl font-semibold text-[var(--anki-theme-dark)]">
                {totalMinutes}
                <span className="ml-1 text-xs font-normal">分</span>
              </p>
            </div>

            <div className="rounded-2xl border border-[#E6E7E1] bg-white p-3 sm:p-4">
              <p className="text-xs text-[#858980]">読んだページ</p>
              <p className="mt-2 text-xl font-semibold text-[var(--anki-theme-dark)]">
                {totalPagesRead}
                <span className="ml-1 text-xs font-normal">ページ</span>
              </p>
            </div>

            <div className="rounded-2xl border border-[#E6E7E1] bg-white p-3 sm:p-4">
              <p className="text-xs text-[#858980]">記録回数</p>
              <p className="mt-2 text-xl font-semibold text-[var(--anki-theme-dark)]">
                {bookLogs.length}
                <span className="ml-1 text-xs font-normal">回</span>
              </p>
            </div>
          </div>
        </header>

        <section className="mt-8 rounded-2xl border border-[#E6E7E1] bg-white p-5 sm:p-6">
          <h2 className="text-base font-semibold">今日の読書を記録</h2>
          <p className="mt-2 text-sm leading-6 text-[#858980]">
            少し読んだだけでも、立派な一歩。気づいたことも残しておこう。
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm">
              読み始めたページ
              <input
                type="number"
                min="1"
                step="1"
                value={startPage}
                onChange={(e) => setStartPage(e.target.value)}
                className={inputClass}
              />
            </label>

            <label className="text-sm">
              読み終えたページ
              <input
                type="number"
                min="1"
                step="1"
                value={endPage}
                onChange={(e) => setEndPage(e.target.value)}
                className={inputClass}
              />
            </label>

            <label className="text-sm sm:col-span-2">
              読書時間（分）
              <input
                type="number"
                min="1"
                step="1"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className={inputClass}
              />
            </label>

            <label className="text-sm sm:col-span-2">
              今日、学んだこと・心に残ったこと
              <textarea
                value={learned}
                onChange={(e) => setLearned(e.target.value)}
                rows={4}
                placeholder="新しく知ったこと、気になった言葉、感想など…"
                className={`${inputClass} leading-6`}
              />
            </label>
          </div>

          <button
            type="button"
            onClick={saveReading}
            className={`mt-5 ${buttonClass}`}
          >
            読書記録を保存
          </button>

          {message && (
            <p
              role="status"
              className={`mt-3 text-sm ${
                message.includes("保存しました")
                  ? "text-[var(--anki-theme-dark)]"
                  : "text-red-600"
              }`}
            >
              {message}
            </p>
          )}
        </section>

        <section className="mt-9">
          <div>
            <h2 className="text-base font-semibold">Reading History</h2>
            <p className="mt-1 text-xs text-[#858980]">
              この本について残した記録
            </p>
          </div>

          {bookLogs.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-[#D9DCD4] bg-white/60 p-8 text-center">
              <p className="text-sm text-[#777D75]">
                まだ記録はありません。
              </p>
              <p className="mt-2 text-xs text-[#858980]">
                最初の読書記録を残してみよう。
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {bookLogs.map((log) => (
                <article
                  key={log.id}
                  className="rounded-2xl border border-[#E6E7E1] bg-white p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <time className="text-sm font-medium">{log.date}</time>
                    <span className="rounded-lg bg-[var(--anki-theme-light)] px-3 py-1.5 text-xs text-[var(--anki-theme-dark)]">
                      {log.minutes} 分
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-[#30332F]">
                    {log.startPage}〜{log.endPage} ページ
                    <span className="ml-2 text-xs text-[#858980]">
                      （{Math.max(0, log.endPage - log.startPage + 1)}ページ分）
                    </span>
                  </p>

                  {log.learned && (
                    <p className="mt-3 whitespace-pre-wrap border-t border-[#F0F0EB] pt-3 text-sm leading-7 text-[#30332F]">
                      {log.learned}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        <footer className="mt-10 border-t border-[#E6E7E1] pt-5">
          <Link href="/library/books" className={linkClass}>
            ← 本棚に戻る
          </Link>
          <span className="mx-3 text-[#D9DCD4]">/</span>
          <Link href="/library" className={linkClass}>
            Library トップ
          </Link>
        </footer>
      </div>
    </main>
  );
}

export default function ReadPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#F7F7F5] p-8 text-black">
          読書画面を開いています…
        </main>
      }
    >
      <ReadContent />
    </Suspense>
  );
}