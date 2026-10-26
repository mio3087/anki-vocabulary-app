
"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import "./reading-sanctuary.css";

const BOOKS_KEY = "little-library-books-v1";
const READING_KEY = "reading-sanctuary-progress-v1";

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

type ReadingProgress = {
  bookId: number;
  currentPage: number;
  pagesRead: number;
  totalMinutes: number;
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
    totalPages: Math.max(0, Number(item.totalPages) || 0),
    category: categories.includes(item.category as Category)
      ? (item.category as Category)
      : "その他",
    status: statuses.includes(item.status as ReadingStatus)
      ? (item.status as ReadingStatus)
      : "未読",
  };
}

function readJson(key: string): unknown {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function normalizeProgress(value: unknown): ReadingProgress[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (item): item is Record<string, unknown> =>
        !!item && typeof item === "object"
    )
    .filter((item) => typeof item.bookId === "number")
    .map((item) => ({
      bookId: item.bookId as number,
      currentPage: Math.max(0, Number(item.currentPage) || 0),
      pagesRead: Math.max(0, Number(item.pagesRead) || 0),
      totalMinutes: Math.max(0, Number(item.totalMinutes) || 0),
    }));
}

export default function ReadingSanctuary() {
  const [books, setBooks] = useState<Book[]>([]);
  const [progressList, setProgressList] = useState<ReadingProgress[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [isbn, setIsbn] = useState("");
  const [totalPages, setTotalPages] = useState("");
  const [category, setCategory] = useState<Category>("その他");
  const [status, setStatus] = useState<ReadingStatus>("未読");
  const [editingId, setEditingId] = useState<number | null>(null);

  const [activeBookId, setActiveBookId] = useState("");
  const [pagesInput, setPagesInput] = useState("10");
  const [minutesInput, setMinutesInput] = useState("20");
  const [filter, setFilter] = useState("すべて");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const savedBooks = readJson(BOOKS_KEY);
    const normalizedBooks = Array.isArray(savedBooks)
      ? savedBooks
          .map(normalizeBook)
          .filter((book): book is Book => book !== null)
      : [];

    const savedProgress = normalizeProgress(readJson(READING_KEY));

    setBooks(normalizedBooks);
    setProgressList(
      savedProgress.filter((progress) =>
        normalizedBooks.some((book) => book.id === progress.bookId)
      )
    );
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;

    try {
      localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
      localStorage.setItem(READING_KEY, JSON.stringify(progressList));
    } catch {
      setMessage("保存できませんでした。ブラウザの空き容量を確認してください。");
    }
  }, [books, progressList, loaded]);

  function getProgress(bookId: number): ReadingProgress {
    return (
      progressList.find((item) => item.bookId === bookId) ?? {
        bookId,
        currentPage: 0,
        pagesRead: 0,
        totalMinutes: 0,
      }
    );
  }

  function resetBookForm() {
    setTitle("");
    setAuthor("");
    setIsbn("");
    setTotalPages("");
    setCategory("その他");
    setStatus("未読");
    setEditingId(null);
  }

  function saveBook(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanTitle = title.trim();
    const pageCount = totalPages.trim() === "" ? 0 : Number(totalPages);

    if (!cleanTitle) {
      setMessage("本のタイトルを入力してください。");
      return;
    }

    if (!Number.isInteger(pageCount) || pageCount < 0) {
      setMessage("総ページ数は0以上の整数で入力してください。");
      return;
    }

    const id = editingId ?? Date.now();

    const nextBook: Book = {
      id,
      title: cleanTitle,
      author: author.trim(),
      isbn: isbn.trim(),
      totalPages: pageCount,
      category,
      status,
    };

    if (editingId !== null) {
      setBooks((current) =>
        current.map((book) => (book.id === editingId ? nextBook : book))
      );

      setProgressList((current) =>
        current.map((item) => {
          if (item.bookId !== editingId || pageCount === 0) return item;
          return {
            ...item,
            currentPage: Math.min(item.currentPage, pageCount),
          };
        })
      );

      setMessage("✓ 本の情報を更新しました。");
    } else {
      setBooks((current) => [nextBook, ...current]);
      setMessage("✦ 新しい本を本棚に追加しました。");
    }

    resetBookForm();
  }

  function startEditing(book: Book) {
    setEditingId(book.id);
    setTitle(book.title);
    setAuthor(book.author);
    setIsbn(book.isbn);
    setTotalPages(book.totalPages ? String(book.totalPages) : "");
    setCategory(book.category);
    setStatus(book.status);
    setMessage("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function deleteBook(book: Book) {
    if (!window.confirm(`「${book.title}」と読書記録を削除しますか？`)) {
      return;
    }

    setBooks((current) => current.filter((item) => item.id !== book.id));
    setProgressList((current) =>
      current.filter((item) => item.bookId !== book.id)
    );

    if (activeBookId === String(book.id)) setActiveBookId("");
    if (editingId === book.id) resetBookForm();

    setMessage("本と読書記録を削除しました。");
  }

  function recordReading(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const bookId = Number(activeBookId);
    const book = books.find((item) => item.id === bookId);
    const pages = Number(pagesInput);
    const minutes = Number(minutesInput);

    if (!book) {
      setMessage("記録する本を選択してください。");
      return;
    }

    if (book.status === "読了") {
      setMessage("この本は読了済みです。");
      return;
    }

    if (
      !Number.isInteger(pages) ||
      pages < 0 ||
      !Number.isInteger(minutes) ||
      minutes < 1 ||
      pages > 100000 ||
      minutes > 1440
    ) {
      setMessage("ページ数は0以上、読書時間は1〜1440分で入力してください。");
      return;
    }

    const previous = getProgress(bookId);
    const remaining =
      book.totalPages > 0
        ? Math.max(0, book.totalPages - previous.currentPage)
        : pages;
    const actualPages =
      book.totalPages > 0 ? Math.min(pages, remaining) : pages;
    const newCurrentPage = previous.currentPage + actualPages;
    const isCompleted =
      book.totalPages > 0 && newCurrentPage >= book.totalPages;

    setProgressList((current) => {
      const existing = current.some((item) => item.bookId === bookId);

      const updated: ReadingProgress = {
        bookId,
        currentPage: newCurrentPage,
        pagesRead: previous.pagesRead + actualPages,
        totalMinutes: previous.totalMinutes + minutes,
      };

      return existing
        ? current.map((item) => (item.bookId === bookId ? updated : item))
        : [...current, updated];
    });

    setBooks((current) =>
      current.map((item) =>
        item.id === bookId
          ? { ...item, status: isCompleted ? "読了" : "読書中" }
          : item
      )
    );

    setMessage(
      isCompleted
        ? `✦「${book.title}」を読了しました！`
        : `✓ ${actualPages}ページ・${minutes}分を記録しました。`
    );
  }

  const stats = useMemo(() => {
    const pagesRead = progressList.reduce(
      (sum, item) => sum + item.pagesRead,
      0
    );

    const minutes = progressList.reduce(
      (sum, item) => sum + item.totalMinutes,
      0
    );

    const completed = books.filter((book) => book.status === "読了").length;
    const xp = minutes + pagesRead * 2 + completed * 50;
    const level = Math.floor(xp / 100) + 1;

    return {
      pagesRead,
      minutes,
      completed,
      xp,
      level,
      progress: xp % 100,
    };
  }, [books, progressList]);

  // 読了した本の冊数に応じて、本棚の演出を4段階で変化させる
  const bookshelfLevel = Math.min(
    4,
    Math.floor(stats.completed / 3) + 1
  );

  const readableBooks = books.filter((book) => book.status !== "読了");

  const visibleBooks =
    filter === "すべて"
      ? books
      : filter === "読了"
        ? books.filter((book) => book.status === "読了")
        : filter === "読書中"
          ? books.filter((book) => book.status === "読書中")
          : books.filter((book) => book.category === filter);

  if (!loaded) {
    return (
      <main className="lgrowth-page">
        <p className="lgrowth-loading">図書館の扉を開いています……</p>
      </main>
    );
  }

  return (
    <main className="lgrowth-page">
      <header className="lgrowth-header">
        <div>
          <p className="lgrowth-eyebrow">YOUR PERSONAL READING SANCTUARY</p>
          <h1>The Living Library</h1>
          <p className="lgrowth-subtitle">
            一冊読むたびに、あなたの図書館が育っていく。
          </p>
        </div>

        <div className="lgrowth-level-badge">
          <span>LIBRARY LEVEL</span>
          <strong>{stats.level}</strong>
        </div>
      </header>

      <section
        className={`lgrowth-room lgrowth-room--${Math.min(stats.level, 4)}`}
        aria-label={`レベル${stats.level}の図書館`}
      >
        <div className="lgrowth-room-top">
          <span className="lgrowth-room-label">THE GRAND LIBRARY</span>
          <span className="lgrowth-room-level">LEVEL {stats.level}</span>
        </div>

        <div className="lgrowth-window">
          <div className="lgrowth-window-glow" />
          <div className="lgrowth-window-cross lgrowth-window-cross--vertical" />
          <div className="lgrowth-window-cross lgrowth-window-cross--horizontal" />
        </div>

        <div className="lgrowth-arch">
          <div className="lgrowth-arch-inner">
            <span className="lgrowth-star lgrowth-star--one">✦</span>
            <span className="lgrowth-star lgrowth-star--two">✧</span>
            <span className="lgrowth-star lgrowth-star--three">✦</span>
            <div className="lgrowth-arch-message">
              <span>EVERY PAGE</span>
              <strong>opens a door</strong>
            </div>
          </div>
        </div>

        <div className="lgrowth-room-shelves">
          {Array.from({ length: Math.min(3 + stats.level, 8) }).map(
            (_, index) => (
              <div className="lgrowth-decorative-shelf" key={index}>
                {Array.from({ length: 7 }).map((__, bookIndex) => (
                  <span
                    className={`lgrowth-decorative-book lgrowth-decorative-book--${
                      (index + bookIndex + stats.level) % 6
                    }`}
                    key={bookIndex}
                    style={{
                      height: `${30 + ((index * 13 + bookIndex * 7) % 28)}px`,
                    }}
                  />
                ))}
              </div>
            )
          )}
        </div>

        {stats.level >= 2 && (
          <div className="lgrowth-room-decoration lgrowth-room-decoration--left">
            ✧
          </div>
        )}

        {stats.level >= 3 && (
          <div className="lgrowth-room-decoration lgrowth-room-decoration--right">
            ✦
          </div>
        )}

        {stats.level >= 4 && <div className="lgrowth-room-crown">♕</div>}

        <div className="lgrowth-room-floor">
          <span>EST. BY YOUR CURIOSITY</span>
        </div>
      </section>

      <section className="lgrowth-illustrated-library">
        <div className="lgrowth-section-heading">
          <div>
            <p className="lgrowth-eyebrow">YOUR GROWING BOOKSHELF</p>
            <h2>育っていく本棚</h2>
          </div>

          <span className="lgrowth-book-count">
            {stats.completed} BOOKS COMPLETED
          </span>
        </div>

        <div
          className={`lgrowth-illustrated-library__frame lgrowth-illustrated-library__frame--${bookshelfLevel}`}
        >
          <img
            src="/images/library/bookshelf.png"
            alt="白い背表紙の本が並ぶ、The Living Libraryの本棚"
            className="lgrowth-illustrated-library__image"
          />

          <div
            className="lgrowth-illustrated-library__glow"
            aria-hidden="true"
          />
        </div>

        <div className="lgrowth-illustrated-library__caption">
          <span>✦</span>
          {stats.completed === 0
            ? "最初の一冊を読み終えると、本棚が育ち始めます。"
            : stats.completed < 3
              ? `読了した本は${stats.completed}冊。図書館に最初の光が宿りました。`
              : stats.completed < 6
                ? `${stats.completed}冊読了！本棚が少しずつ輝きを増しています。`
                : stats.completed < 9
                  ? `${stats.completed}冊読了！図書館に魔法の光が広がっています。`
                  : `${stats.completed}冊以上読了！あなたの図書館が豊かに育ちました。`}
        </div>
      </section>

      <section className="lgrowth-progress-panel">
        <div className="lgrowth-progress-heading">
          <div>
            <p className="lgrowth-eyebrow">YOUR JOURNEY</p>
            <h2>図書館の成長記録</h2>
          </div>
          <span className="lgrowth-xp">{stats.xp} XP</span>
        </div>

        <div
          className="lgrowth-progress-track"
          role="progressbar"
          aria-label="次のレベルまでの進捗"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={stats.progress}
        >
          <div
            className="lgrowth-progress-fill"
            style={{ width: `${stats.progress}%` }}
          />
        </div>

        <div className="lgrowth-progress-caption">
          <span>LEVEL {stats.level}</span>
          <span>次のレベルまであと {100 - stats.progress} XP</span>
        </div>

        <div className="lgrowth-stats">
          <div className="lgrowth-stat">
            <span className="lgrowth-stat-icon">▤</span>
            <span className="lgrowth-stat-label">読んだページ</span>
            <strong>{stats.pagesRead.toLocaleString()}</strong>
            <small>ページ</small>
          </div>

          <div className="lgrowth-stat">
            <span className="lgrowth-stat-icon">◷</span>
            <span className="lgrowth-stat-label">読書時間</span>
            <strong>{stats.minutes.toLocaleString()}</strong>
            <small>分</small>
          </div>

          <div className="lgrowth-stat">
            <span className="lgrowth-stat-icon">✧</span>
            <span className="lgrowth-stat-label">読了した本</span>
            <strong>{stats.completed}</strong>
            <small>冊</small>
          </div>
        </div>
      </section>

      <div className="lgrowth-columns">
        <section
          className={`lgrowth-panel lgrowth-panel--book ${
            editingId !== null ? "lgrowth-panel--editing" : ""
          }`}
          id="book-form"
        >
          <div className="lgrowth-panel-heading">
            <span className="lgrowth-panel-symbol" aria-hidden="true">
              {editingId !== null ? "✎" : "＋"}
            </span>

            <div>
              <p className="lgrowth-eyebrow">BOOK DETAILS</p>
              <h2>{editingId !== null ? "本の情報を編集" : "本を本棚に迎える"}</h2>
            </div>
          </div>

          <p className="lgrowth-description">
            {editingId !== null
              ? "内容を変更して、下の保存ボタンを押してください。"
              : "新しい本を登録します。タイトルを入力して追加してください。"}
          </p>

          <form className="lgrowth-form" onSubmit={saveBook}>
            <label>
              本のタイトル <span>*</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="本のタイトルを入力"
                maxLength={200}
                required
              />
            </label>

            <label>
              著者
              <input
                value={author}
                onChange={(event) => setAuthor(event.target.value)}
                placeholder="著者名（任意）"
              />
            </label>

            <label>
              ISBN
              <input
                value={isbn}
                onChange={(event) => setIsbn(event.target.value)}
                placeholder="ISBN（任意）"
              />
            </label>

            <label>
              総ページ数
              <input
                type="number"
                min="0"
                step="1"
                value={totalPages}
                onChange={(event) => setTotalPages(event.target.value)}
                placeholder="例：320"
              />
            </label>

            <div className="lgrowth-form-row">
              <label>
                分類
                <select
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value as Category)
                  }
                >
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                読書状況
                <select
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value as ReadingStatus)
                  }
                >
                  {statuses.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <button
              className="lgrowth-button lgrowth-button--primary"
              type="submit"
            >
              <span aria-hidden="true">{editingId !== null ? "✓" : "＋"}</span>
              {editingId !== null ? "変更を保存する" : "本を登録して本棚に追加"}
            </button>

            {editingId !== null && (
              <button
                className="lgrowth-button lgrowth-button--secondary"
                type="button"
                onClick={() => {
                  resetBookForm();
                  setMessage("編集をキャンセルしました。");
                }}
              >
                キャンセル
              </button>
            )}
          </form>
        </section>

        <section
          className="lgrowth-panel lgrowth-panel--reading"
          id="reading-form"
        >
          <div className="lgrowth-panel-heading">
            <span className="lgrowth-panel-symbol" aria-hidden="true">
              ↗
            </span>

            <div>
              <p className="lgrowth-eyebrow">A LITTLE MOMENT</p>
              <h2>今日の読書を記録</h2>
            </div>
          </div>

          <p className="lgrowth-description">
            読んだ本・ページ数・時間を入力して、読書の成果を保存します。
          </p>

          {readableBooks.length === 0 ? (
            <div className="lgrowth-action-empty">
              <span aria-hidden="true">✧</span>
              <p>読書を記録するには、まず本を登録してください。</p>

              <button
                type="button"
                className="lgrowth-button lgrowth-button--secondary"
                onClick={() => {
                  document
                    .getElementById("book-form")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                ＋ 本を登録する
              </button>
            </div>
          ) : (
            <form className="lgrowth-form" onSubmit={recordReading}>
              <label>
                読んだ本
                <select
                  className={activeBookId ? "lgrowth-input--selected" : ""}
                  value={activeBookId}
                  onChange={(event) => setActiveBookId(event.target.value)}
                  required
                >
                  <option value="">▼ 記録する本を選択</option>
                  {readableBooks.map((book) => (
                    <option key={book.id} value={String(book.id)}>
                      {book.title}
                    </option>
                  ))}
                </select>
              </label>

              {activeBookId && (
                <p className="lgrowth-selected-note">
                  ✓ 「{books.find((book) => String(book.id) === activeBookId)?.title}」を記録します
                </p>
              )}

              <div className="lgrowth-form-row">
                <label>
                  今回読んだページ数
                  <input
                    type="number"
                    min="0"
                    max="100000"
                    step="1"
                    value={pagesInput}
                    onChange={(event) => setPagesInput(event.target.value)}
                    required
                  />
                  <small className="lgrowth-field-hint">今回読んだ分</small>
                </label>

                <label>
                  読書時間（分）
                  <input
                    type="number"
                    min="1"
                    max="1440"
                    step="1"
                    value={minutesInput}
                    onChange={(event) => setMinutesInput(event.target.value)}
                    required
                  />
                  <small className="lgrowth-field-hint">1〜1440分</small>
                </label>
              </div>

              <button
                className="lgrowth-button lgrowth-button--dark"
                type="submit"
              >
                <span aria-hidden="true">✦</span>
                この内容で読書を記録
                <span className="lgrowth-button-arrow" aria-hidden="true">
                  →
                </span>
              </button>
            </form>
          )}
        </section>
      </div>

      {message && (
        <p className="lgrowth-message" role="status">
          <span aria-hidden="true">✦</span> {message}
        </p>
      )}

      <section className="lgrowth-book-section">
        <div className="lgrowth-section-heading">
          <div>
            <p className="lgrowth-eyebrow">YOUR COLLECTION</p>
            <h2>本棚の本たち</h2>
          </div>

          <span className="lgrowth-book-count">{books.length} BOOKS</span>
        </div>

        <div className="lgrowth-library-toolbar">
          <span className="lgrowth-toolbar-label">本を絞り込む</span>

          <div className="lgrowth-filter-list">
            {["すべて", "読書中", "読了", ...categories].map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={filter === item}
                className={`lgrowth-filter ${
                  filter === item ? "lgrowth-filter--active" : ""
                }`}
                onClick={() => setFilter(item)}
              >
                {filter === item && (
                  <span aria-hidden="true" className="lgrowth-filter-check">
                    ✓
                  </span>
                )}
                {item}
              </button>
            ))}
          </div>
        </div>

        {visibleBooks.length === 0 ? (
          <div className="lgrowth-empty-library">
            <span className="lgrowth-empty-symbol">✧</span>
            <h3>
              {books.length === 0
                ? "最初の一冊を迎えよう。"
                : "この分類には本がありません。"}
            </h3>
            <p>
              {books.length === 0
                ? "「本を本棚に迎える」から登録できます。"
                : "別の分類を選ぶと、登録した本を確認できます。"}
            </p>

            {books.length === 0 && (
              <button
                type="button"
                className="lgrowth-button lgrowth-button--primary lgrowth-empty-cta"
                onClick={() =>
                  document
                    .getElementById("book-form")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
              >
                ＋ 最初の本を登録する
              </button>
            )}
          </div>
        ) : (
          <div className="lgrowth-book-list">
            {visibleBooks.map((book, index) => {
              const progress = getProgress(book.id);
              const percent =
                book.status === "読了"
                  ? 100
                  : book.totalPages > 0
                    ? Math.min(
                        100,
                        Math.round(
                          (progress.currentPage / book.totalPages) * 100
                        )
                      )
                    : 0;

              const isActive = activeBookId === String(book.id);

              return (
                <article
                  className={`lgrowth-book-card ${
                    isActive ? "lgrowth-book-card--active" : ""
                  }`}
                  key={book.id}
                >
                  <div
                    className={`lgrowth-book-spine lgrowth-book-spine--${index % 6}`}
                    aria-hidden="true"
                  >
                    <span>{book.status === "読了" ? "✦" : "❖"}</span>
                  </div>

                  <div className="lgrowth-book-content">
                    <div className="lgrowth-book-title-row">
                      <div className="lgrowth-book-title">
                        <h3>{book.title}</h3>
                        <p className="lgrowth-book-author">
                          {book.author || "著者未登録"}
                        </p>
                      </div>

                      <span
                        className={`lgrowth-status-pill ${
                          book.status === "読了"
                            ? "lgrowth-status-pill--done"
                            : book.status === "読書中"
                              ? "lgrowth-status-pill--reading"
                              : "lgrowth-status-pill--unread"
                        }`}
                      >
                        <span aria-hidden="true">
                          {book.status === "読了"
                            ? "✓"
                            : book.status === "読書中"
                              ? "◷"
                              : "○"}
                        </span>
                        {book.status}
                      </span>
                    </div>

                    <div className="lgrowth-book-tags">
                      <span>{book.category}</span>
                      {book.totalPages > 0 && (
                        <span>全 {book.totalPages.toLocaleString()} ページ</span>
                      )}
                    </div>

                    <div
                      className="lgrowth-book-progress-track"
                      role="progressbar"
                      aria-label={`${book.title}の読書進捗`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={percent}
                    >
                      <div
                        className="lgrowth-book-progress-fill"
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="lgrowth-book-meta">
                      <span>
                        {progress.currentPage.toLocaleString()} /{" "}
                        {book.totalPages > 0
                          ? book.totalPages.toLocaleString()
                          : "—"}{" "}
                        ページ
                      </span>
                      <strong>{percent}%</strong>
                    </div>

                    <p className="lgrowth-book-minutes">
                      累計 {progress.totalMinutes.toLocaleString()} 分 ·
                      記録済み {progress.pagesRead.toLocaleString()} ページ
                    </p>

                    {book.isbn && (
                      <p className="lgrowth-book-minutes">ISBN: {book.isbn}</p>
                    )}

                    <div className="lgrowth-book-actions">
                      {book.status !== "読了" ? (
                        <button
                          type="button"
                          className={`lgrowth-small-button lgrowth-small-button--read ${
                            isActive ? "lgrowth-small-button--selected" : ""
                          }`}
                          aria-pressed={isActive}
                          onClick={() => {
                            setActiveBookId(String(book.id));
                            setMessage(
                              `「${book.title}」を記録対象に選びました。ページ数と時間を入力してください。`
                            );
                            document
                              .getElementById("reading-form")
                              ?.scrollIntoView({
                                behavior: "smooth",
                                block: "center",
                              });
                          }}
                        >
                          <span aria-hidden="true">
                            {isActive ? "✓" : "▶"}
                          </span>
                          {isActive ? "記録対象に選択中" : "この本を読む"}
                        </button>
                      ) : (
                        <span className="lgrowth-finished-note">
                          ✓ 読了しました
                        </span>
                      )}

                      <button
                        type="button"
                        className="lgrowth-small-button lgrowth-small-button--edit"
                        onClick={() => startEditing(book)}
                      >
                        <span aria-hidden="true">✎</span>
                        編集
                      </button>

                      <button
                        type="button"
                        className="lgrowth-small-button lgrowth-small-button--delete"
                        onClick={() => deleteBook(book)}
                      >
                        <span aria-hidden="true">×</span>
                        削除
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <footer className="lgrowth-footer">
        <span>THE LIVING LIBRARY</span>
        <p>急がなくていい。一ページずつ、あなたの世界を広げよう。</p>
      </footer>
    </main>
  );
}
