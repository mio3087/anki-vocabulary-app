
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "little-library-books-v1";

const categories = [
  "語学",
  "小説",
  "教養",
  "歴史",
  "実用書",
  "漫画",
  "その他",
] as const;

const statuses = ["未読", "読書中", "読了"] as const;

type Book = {
  id: number;
  title: string;
  author: string;
  isbn: string;
  totalPages: string;
  category: (typeof categories)[number];
  status: (typeof statuses)[number];
};

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [isbn, setIsbn] = useState("");
  const [totalPages, setTotalPages] = useState("");
  const [category, setCategory] = useState<Book["category"]>("語学");
  const [status, setStatus] = useState<Book["status"]>("未読");
  const [filter, setFilter] = useState("すべて");

  // 保存済みの本を読み込む
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed: unknown = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          setBooks(parsed as Book[]);
        }
      }
    } catch (error) {
      console.error("本棚データを読み込めませんでした。", error);
    } finally {
      setLoaded(true);
    }
  }, []);

  // 本棚データを自動保存
  useEffect(() => {
    if (!loaded) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
    } catch (error) {
      console.error("本棚データを保存できませんでした。", error);
    }
  }, [books, loaded]);

  // 本を登録
  function addBook(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    const newBook: Book = {
      id: Date.now(),
      title: trimmedTitle,
      author: author.trim(),
      isbn: isbn.trim(),
      totalPages,
      category,
      status,
    };

    setBooks((current) => [...current, newBook]);

    setTitle("");
    setAuthor("");
    setIsbn("");
    setTotalPages("");
    setCategory("語学");
    setStatus("未読");
  }

  // 本を削除
  function deleteBook(id: number) {
    if (!window.confirm("この本を本棚から削除しますか？")) return;

    setBooks((current) => current.filter((book) => book.id !== id));
  }

  const visibleBooks =
    filter === "すべて"
      ? books
      : books.filter((book) => book.category === filter);

  if (!loaded) {
    return (
      <main className="min-h-screen bg-[#F7F7F5] px-5 py-8 text-[#30332F] sm:px-8">
        <div className="mx-auto max-w-5xl text-sm text-[#858980]">
          本棚を読み込んでいます…
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F7F5] px-5 py-8 text-[#30332F] sm:px-8">
      <div className="mx-auto max-w-5xl">
        {/* ページ移動リンク */}
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <Link
            href="/library"
            className="text-[#718675] transition hover:text-[#52664D]"
          >
            ← Library
          </Link>
          <Link
            href="/library/scan"
            className="text-[#777D75] transition hover:text-[#52664D]"
          >
            本をスキャン
          </Link>
          <Link
            href="/library/pdf"
            className="text-[#777D75] transition hover:text-[#52664D]"
          >
            PDFリーダー
          </Link>
        </nav>

        {/* ページタイトル */}
        <header className="mt-8">
          <p className="text-xs tracking-[0.2em] text-[#858980]">
            LITTLE LIBRARY
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            本棚
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#777D75]">
            読みたい本、読んでいる本、読み終えた本をここに。
          </p>
        </header>

        {/* 本の登録 */}
        <section className="mt-8 rounded-2xl border border-[#E6E7E1] bg-white p-5 sm:p-6">
          <h2 className="text-base font-semibold">本を登録する</h2>
          <p className="mt-1 text-xs text-[#858980]">
            タイトルだけでも登録できます。
          </p>

          <form
            onSubmit={addBook}
            className="mt-5 grid gap-4 sm:grid-cols-2"
          >
            <label className="text-xs text-[#777D75] sm:col-span-2">
              タイトル *
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="本のタイトル"
                className="mt-1.5 block w-full rounded-xl border border-[#E1E3DC] bg-white px-3 py-3 text-sm text-[#30332F] outline-none transition focus:border-[#718675]"
              />
            </label>

            <label className="text-xs text-[#777D75]">
              著者
              <input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="著者名"
                className="mt-1.5 block w-full rounded-xl border border-[#E1E3DC] px-3 py-3 text-sm outline-none focus:border-[#718675]"
              />
            </label>

            <label className="text-xs text-[#777D75]">
              ISBN
              <input
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                placeholder="ISBN（任意）"
                className="mt-1.5 block w-full rounded-xl border border-[#E1E3DC] px-3 py-3 text-sm outline-none focus:border-[#718675]"
              />
            </label>

            <label className="text-xs text-[#777D75]">
              総ページ数
              <input
                type="number"
                min="1"
                value={totalPages}
                onChange={(e) => setTotalPages(e.target.value)}
                placeholder="例：320"
                className="mt-1.5 block w-full rounded-xl border border-[#E1E3DC] px-3 py-3 text-sm outline-none focus:border-[#718675]"
              />
            </label>

            <label className="text-xs text-[#777D75]">
              分類
              <select
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as Book["category"])
                }
                className="mt-1.5 block w-full rounded-xl border border-[#E1E3DC] bg-white px-3 py-3 text-sm text-[#30332F]"
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs text-[#777D75] sm:col-span-2">
              読書状況
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as Book["status"])
                }
                className="mt-1.5 block w-full rounded-xl border border-[#E1E3DC] bg-white px-3 py-3 text-sm text-[#30332F]"
              >
                {statuses.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="submit"
              className="rounded-xl bg-[#718675] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#5E7563] sm:col-span-2"
            >
              ＋ 本棚に登録
            </button>
          </form>
        </section>

        {/* 登録済みの本 */}
        <section className="mt-9">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">My Books</h2>
              <p className="mt-1 text-xs text-[#858980]">
                登録した本：{books.length} 冊
              </p>
            </div>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              aria-label="分類で絞り込む"
              className="rounded-xl border border-[#E1E3DC] bg-white px-3 py-2.5 text-xs text-[#30332F]"
            >
              <option value="すべて">すべての分類</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 space-y-3">
            {visibleBooks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#D9DCD4] bg-white/60 p-10 text-center">
                <p className="text-sm font-medium text-[#626A60]">
                  {books.length === 0
                    ? "本棚はまだ空です"
                    : "この分類には本がありません"}
                </p>
                <p className="mt-2 text-xs leading-5 text-[#858980]">
                  {books.length === 0
                    ? "上のフォームから、最初の一冊を登録してみましょう。"
                    : "別の分類を選んでください。"}
                </p>
              </div>
            ) : (
              visibleBooks.map((book) => (
                <article
                  key={book.id}
                  className="flex flex-col justify-between gap-4 rounded-2xl border border-[#E6E7E1] bg-white p-5 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0">
                    <h3 className="break-words text-base font-medium">
                      {book.title}
                    </h3>

                    {book.author && (
                      <p className="mt-1.5 text-sm text-[#858980]">
                        {book.author}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-lg bg-[#F0F2ED] px-2.5 py-1.5 text-[#52664D]">
                        {book.category}
                      </span>
                      <span className="rounded-lg bg-[#F5F5F2] px-2.5 py-1.5 text-[#777D75]">
                        {book.status}
                      </span>
                      {book.totalPages && (
                        <span className="rounded-lg bg-[#F5F5F2] px-2.5 py-1.5 text-[#777D75]">
                          {book.totalPages} ページ
                        </span>
                      )}
                    </div>

                    {book.isbn && (
                      <p className="mt-2 text-xs text-[#858980]">
                        ISBN：{book.isbn}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <Link
                      href={`/library/read?id=${book.id}`}
                      className="rounded-xl bg-[#718675] px-4 py-2.5 text-xs font-medium text-white transition hover:bg-[#5E7563]"
                    >
                      読書記録 →
                    </Link>

                    <button
                      type="button"
                      onClick={() => deleteBook(book.id)}
                      className="rounded-xl border border-[#E6E7E1] px-3 py-2.5 text-xs text-[#858980] transition hover:border-red-200 hover:text-red-600"
                    >
                      削除
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        {/* 下部ナビゲーション */}
        <footer className="mt-10 border-t border-[#E6E7E1] pt-5">
          <Link
            href="/library"
            className="text-sm text-[#718675] transition hover:text-[#52664D]"
          >
            ← Little Library トップへ戻る
          </Link>
        </footer>
      </div>
    </main>
  );
}
