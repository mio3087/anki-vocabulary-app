"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

const STORAGE_KEY = "little-library-books-v1";

const categories = ["語学", "小説", "教養", "歴史", "実用書", "漫画", "その他"] as const;
const statuses = ["未読", "読書中", "読了"] as const;

type Category = (typeof categories)[number];
type ReadingStatus = (typeof statuses)[number];

type Book = {
  id: number;
  title: string;
  author: string;
  isbn: string;
  totalPages: number;
  category: Category;
  status: ReadingStatus;
};

const emptyBook = {
  title: "",
  author: "",
  isbn: "",
  totalPages: "",
  category: "その他" as Category,
  status: "未読" as ReadingStatus,
};

function normalizeBook(value: unknown): Book | null {
  if (!value || typeof value !== "object") return null;

  const item = value as Record<string, unknown>;
  if (typeof item.title !== "string" || !item.title.trim()) return null;

  return {
    id: typeof item.id === "number" ? item.id : Date.now(),
    title: item.title,
    author: typeof item.author === "string" ? item.author : "",
    isbn: typeof item.isbn === "string" ? item.isbn : "",
    totalPages: Number(item.totalPages) || 0,
    category: categories.includes(item.category as Category)
      ? (item.category as Category)
      : "その他",
    status: statuses.includes(item.status as ReadingStatus)
      ? (item.status as ReadingStatus)
      : "未読",
  };
}

function readBooks(): Book[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeBook).filter((book): book is Book => book !== null);
  } catch {
    return [];
  }
}

const buttonClass =
  "inline-flex items-center justify-center rounded-xl border border-[var(--anki-theme-soft)] bg-[var(--anki-theme-light)] px-4 py-2 text-sm font-medium text-[var(--anki-theme-dark)] transition hover:bg-[var(--anki-theme-soft)]";

const primaryButtonClass =
  "inline-flex items-center justify-center rounded-xl border border-[var(--anki-theme-color)] bg-[var(--anki-theme-color)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--anki-theme-dark)]";

const linkClass =
  "inline-flex items-center justify-center rounded-xl border border-[var(--anki-theme-soft)] bg-[var(--anki-theme-light)] px-4 py-2 text-sm font-medium text-[var(--anki-theme-dark)] transition hover:bg-[var(--anki-theme-soft)]";

const inputClass =
  "library-field w-full rounded-xl border border-[#D5D8D0] bg-white px-4 py-3 text-sm text-black outline-none placeholder:text-gray-500 transition focus:border-[var(--anki-theme-color)] focus:ring-2 focus:ring-[var(--anki-theme-light)]";

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState("すべて");
  const [form, setForm] = useState(emptyBook);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setBooks(readBooks());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
    } catch {
      setMessage("保存できませんでした。ブラウザの空き容量をご確認ください。");
    }
  }, [books, loaded]);

  function saveBooks(nextBooks: Book[]) {
    setBooks(nextBooks);
    setMessage("保存しました。");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = form.title.trim();
    if (!title) {
      setMessage("本のタイトルを入力してください。");
      return;
    }

    const book: Book = {
      id: editingId ?? Date.now(),
      title,
      author: form.author.trim(),
      isbn: form.isbn.trim(),
      totalPages: Math.max(0, Number(form.totalPages) || 0),
      category: form.category,
      status: form.status,
    };

    if (editingId !== null) {
      saveBooks(books.map((item) => (item.id === editingId ? book : item)));
      setMessage("本の情報を更新しました。");
    } else {
      saveBooks([book, ...books]);
      setMessage("本を本棚に登録しました。");
    }

    setForm(emptyBook);
    setEditingId(null);
  }

  function startEditing(book: Book) {
    setEditingId(book.id);
    setForm({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      totalPages: book.totalPages ? String(book.totalPages) : "",
      category: book.category,
      status: book.status,
    });
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEditing() {
    setEditingId(null);
    setForm(emptyBook);
    setMessage("");
  }

  function deleteBook(book: Book) {
    if (!window.confirm(`「${book.title}」を本棚から削除しますか？`)) return;

    saveBooks(books.filter((item) => item.id !== book.id));

    if (editingId === book.id) {
      setEditingId(null);
      setForm(emptyBook);
    }
    setMessage("本を削除しました。");
  }

  const visibleBooks =
    filter === "すべて"
      ? books
      : books.filter((book) => book.category === filter);

  const readCount = books.filter((book) => book.status === "読了").length;
  const readingCount = books.filter((book) => book.status === "読書中").length;

  if (!loaded) {
    return (
      <main className="min-h-screen bg-[#F7F7F2] px-5 py-12 text-black">
        <div className="mx-auto max-w-5xl">
          <p>Little Library</p>
          <h1 className="mt-3 text-2xl font-semibold">本棚を読み込み中…</h1>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F7F2] px-4 py-8 text-black sm:px-8 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10">
          <Link href="/library" className={linkClass}>
            ← Little Library
          </Link>

          <div className="mt-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-[var(--anki-theme-dark)]">
                Your Personal Library
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--anki-theme-dark)] sm:text-4xl">
                My Bookshelf
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-7 text-[#666a60]">
                読みたい本も、読みかけの本も。一冊ずつ、自分だけの本棚に記録していきましょう。
              </p>
            </div>

            <Link href="/library/scan" className={primaryButtonClass}>
              ＋ 本をスキャンして登録
            </Link>
          </div>
        </header>

        <section className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { label: "本棚の本", value: books.length },
            { label: "読書中", value: readingCount },
            { label: "読了", value: readCount },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-[#E6E7E1] bg-white p-5"
            >
              <p className="text-sm text-[#666a60]">{item.label}</p>
              <p className="mt-2 text-3xl font-semibold text-[var(--anki-theme-dark)]">
                {item.value}
              </p>
              <p className="mt-1 text-xs text-[#85877f]">冊</p>
            </div>
          ))}
        </section>

        <section className="mb-10 rounded-3xl border border-[#E6E7E1] bg-white p-5 sm:p-7">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--anki-theme-dark)]">
              Book Details
            </p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--anki-theme-dark)]">
              {editingId !== null ? "本の情報を編集" : "本を本棚に登録"}
            </h2>
            <p className="mt-2 text-sm text-[#77796f]">
              タイトル以外は、わかる項目だけ入力すれば大丈夫です。
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#4e554b]">
                タイトル（必須）
              </label>
              <input
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                placeholder="本のタイトル"
                required
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#4e554b]">著者</label>
                <input
                  value={form.author}
                  onChange={(event) => setForm({ ...form, author: event.target.value })}
                  placeholder="著者名"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#4e554b]">ISBN</label>
                <input
                  value={form.isbn}
                  onChange={(event) => setForm({ ...form, isbn: event.target.value })}
                  placeholder="ISBN"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#4e554b]">総ページ数</label>
                <input
                  type="number"
                  min="0"
                  value={form.totalPages}
                  onChange={(event) => setForm({ ...form, totalPages: event.target.value })}
                  placeholder="例：320"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#4e554b]">分類</label>
                <select
                  value={form.category}
                  onChange={(event) => setForm({ ...form, category: event.target.value as Category })}
                  className={inputClass}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#4e554b]">読書状況</label>
                <select
                  value={form.status}
                  onChange={(event) => setForm({ ...form, status: event.target.value as ReadingStatus })}
                  className={inputClass}
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button type="submit" className={primaryButtonClass}>
                {editingId !== null ? "変更を保存" : "＋ 本棚に登録"}
              </button>

              {editingId !== null && (
                <button type="button" onClick={cancelEditing} className={buttonClass}>
                  編集をキャンセル
                </button>
              )}

              {message && (
                <p aria-live="polite" className="text-sm text-[#66705f]">{message}</p>
              )}
            </div>
          </form>
        </section>

        <section>
          <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--anki-theme-dark)]">
                Collection
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--anki-theme-dark)]">
                本棚
              </h2>
              <p className="mt-2 text-sm text-[#77796f]">{visibleBooks.length} 冊の本</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {["すべて", ...categories].map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setFilter(category)}
                  className={`rounded-full border px-4 py-2 text-xs font-medium transition ${
                    filter === category
                      ? "border-[var(--anki-theme-color)] bg-[var(--anki-theme-light)] text-[var(--anki-theme-dark)]"
                      : "border-[#E2E5DC] bg-white text-[#555b51] hover:border-[var(--anki-theme-soft)] hover:bg-[var(--anki-theme-light)]"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {visibleBooks.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#D8DDD3] bg-white/70 px-6 py-16 text-center">
              <p className="text-lg font-medium text-[#50574d]">
                {books.length === 0 ? "本棚はまだ空です" : "この分類には本がありません"}
              </p>
              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[#77796f]">
                {books.length === 0
                  ? "上のフォームから登録するか、本をスキャンして本棚に加えましょう。"
                  : "別の分類を選択すると、登録した本を確認できます。"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {visibleBooks.map((book) => (
                <article
                  key={book.id}
                  className="flex min-w-0 flex-col rounded-2xl border border-[#E6E7E1] bg-white p-5 transition hover:border-[var(--anki-theme-soft)] sm:p-6"
                >
                  <div className="flex flex-1 gap-4">
                    <div className="flex h-32 w-20 shrink-0 items-center justify-center rounded-lg bg-[var(--anki-theme-light)] text-center text-xs leading-5 text-[var(--anki-theme-dark)]">
                      <span className="break-words px-2">{book.category}</span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-[var(--anki-theme-light)] px-3 py-1 text-xs text-[var(--anki-theme-dark)]">
                          {book.category}
                        </span>
                        <span className="rounded-full bg-[#F5F3ED] px-3 py-1 text-xs text-[#686b62]">
                          {book.status}
                        </span>
                      </div>

                      <h3 className="break-words text-base font-semibold leading-6 text-[#30352e]">
                        {book.title}
                      </h3>
                      <p className="mt-2 break-words text-sm text-[#77796f]">
                        {book.author || "著者未登録"}
                      </p>

                      {book.totalPages > 0 && (
                        <p className="mt-3 text-xs text-[#85877f]">{book.totalPages} ページ</p>
                      )}

                      {book.isbn && (
                        <p className="mt-1 break-all text-xs text-[#85877f]">ISBN: {book.isbn}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-[#EEF0EA] pt-4">
                    <Link href={`/library/read?id=${book.id}`} className={linkClass}>
                      読書記録 →
                    </Link>

                    <button type="button" onClick={() => startEditing(book)} className={buttonClass}>
                      編集
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteBook(book)}
                      className="inline-flex items-center justify-center rounded-xl border border-[#ead8d0] bg-[#fcf3ee] px-4 py-2 text-sm font-medium text-[#a66f65] transition hover:bg-[#f8e8e1]"
                    >
                      削除
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <footer className="mt-12 border-t border-[#E6E7E1] pb-8 pt-6">
          <Link href="/library" className={linkClass}>
            ← Little Library トップへ戻る
          </Link>
        </footer>
      </div>
    </main>
  );
}