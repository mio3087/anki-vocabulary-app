"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAppLanguage } from "@/app/component/AppLanguage";

const BOOKS_KEY = "little-library-books-v1";
const LOGS_KEY = "little-library-reading-logs-v1";

type Language = "ja" | "de" | "en" | "zh-CN" | "zh-TW" | "es";

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

const translations = {
  ja: {
    loading: "読書記録を読み込んでいます…",
    opening: "読書画面を開いています…",
    library: "Library",
    bookshelf: "本棚",
    pdfReader: "PDFリーダー",
    readingJournal: "READING JOURNAL",
    readingTime: "読書時間",
    pagesRead: "読んだページ",
    recordCount: "記録回数",
    minutes: "分",
    pages: "ページ",
    times: "回",
    chooseBookTitle: "読書記録をつける本を選ぼう",
    chooseBookDescription:
      "読書記録を開くには、本棚から対象の本を選んでください。",
    chooseBook: "本棚から本を選ぶ →",
    todayTitle: "今日の読書を記録",
    todayDescription:
      "少し読んだだけでも、立派な一歩。気づいたことも残しておこう。",
    startPage: "読み始めたページ",
    endPage: "読み終えたページ",
    readingMinutes: "読書時間（分）",
    learned: "今日、学んだこと・心に残ったこと",
    learnedPlaceholder:
      "新しく知ったこと、気になった言葉、感想など…",
    save: "読書記録を保存",
    invalidInput: "ページ数と読書時間を確認してください。",
    totalPagesError: (total: string) =>
      `この本の総ページ数は${total}ページです。`,
    saved: "読書記録を保存しました。おつかれさま！",
    saveError:
      "保存できませんでした。ブラウザの保存容量をご確認ください。",
    history: "Reading History",
    historyDescription: "この本について残した記録",
    noRecords: "まだ記録はありません。",
    firstRecord: "最初の読書記録を残してみよう。",
    pagesUnit: "ページ",
    pagesReadUnit: "ページ分",
    backToBookshelf: "本棚に戻る",
    libraryTop: "Library トップ",
  },

  de: {
    loading: "Lesedaten werden geladen…",
    opening: "Leseseite wird geöffnet…",
    library: "Library",
    bookshelf: "Bücherregal",
    pdfReader: "PDF-Reader",
    readingJournal: "LESETAGEBUCH",
    readingTime: "Lesezeit",
    pagesRead: "Gelesene Seiten",
    recordCount: "Einträge",
    minutes: "Min.",
    pages: "Seiten",
    times: "Mal",
    chooseBookTitle: "Wähle ein Buch für dein Lesetagebuch",
    chooseBookDescription:
      "Wähle ein Buch aus deinem Bücherregal aus, um einen Leseeintrag zu erstellen.",
    chooseBook: "Buch auswählen →",
    todayTitle: "Heutige Lektüre festhalten",
    todayDescription:
      "Auch ein paar gelesene Seiten sind ein schöner Fortschritt. Halte auch deine Gedanken fest.",
    startPage: "Erste gelesene Seite",
    endPage: "Letzte gelesene Seite",
    readingMinutes: "Lesezeit (Minuten)",
    learned: "Was hast du heute gelernt oder was ist dir im Gedächtnis geblieben?",
    learnedPlaceholder:
      "Neue Erkenntnisse, interessante Wörter oder deine Gedanken…",
    save: "Leseeintrag speichern",
    invalidInput: "Bitte überprüfe die Seitenzahlen und die Lesezeit.",
    totalPagesError: (total: string) =>
      `Dieses Buch hat insgesamt ${total} Seiten.`,
    saved: "Dein Leseeintrag wurde gespeichert. Gute Arbeit!",
    saveError:
      "Speichern fehlgeschlagen. Bitte überprüfe den verfügbaren Speicherplatz deines Browsers.",
    history: "Reading History",
    historyDescription: "Deine bisherigen Einträge zu diesem Buch",
    noRecords: "Noch keine Einträge vorhanden.",
    firstRecord: "Erstelle deinen ersten Leseeintrag.",
    pagesUnit: "Seiten",
    pagesReadUnit: "Seiten gelesen",
    backToBookshelf: "← Zurück zum Bücherregal",
    libraryTop: "Library-Startseite",
  },

  en: {
    loading: "Loading your reading records…",
    opening: "Opening the reading page…",
    library: "Library",
    bookshelf: "Bookshelf",
    pdfReader: "PDF Reader",
    readingJournal: "READING JOURNAL",
    readingTime: "Reading time",
    pagesRead: "Pages read",
    recordCount: "Entries",
    minutes: "min",
    pages: "pages",
    times: "entries",
    chooseBookTitle: "Choose a book to track your reading",
    chooseBookDescription:
      "Select a book from your bookshelf to open its reading journal.",
    chooseBook: "Choose from bookshelf →",
    todayTitle: "Record today's reading",
    todayDescription:
      "Even a few pages are a meaningful step forward. Take a moment to record what you noticed, too.",
    startPage: "Starting page",
    endPage: "Last page read",
    readingMinutes: "Reading time (minutes)",
    learned: "What you learned or found memorable today",
    learnedPlaceholder:
      "Something new you learned, interesting words, your thoughts…",
    save: "Save reading record",
    invalidInput: "Please check the page numbers and reading time.",
    totalPagesError: (total: string) =>
      `This book has ${total} pages in total.`,
    saved: "Your reading record has been saved. Well done!",
    saveError:
      "Could not save your record. Please check your browser's available storage.",
    history: "Reading History",
    historyDescription: "Your reading records for this book",
    noRecords: "There are no records yet.",
    firstRecord: "Create your first reading record.",
    pagesUnit: "pages",
    pagesReadUnit: "pages read",
    backToBookshelf: "← Back to bookshelf",
    libraryTop: "Library home",
  },

  "zh-CN": {
    loading: "正在加载阅读记录…",
    opening: "正在打开阅读页面…",
    library: "Library",
    bookshelf: "书架",
    pdfReader: "PDF阅读器",
    readingJournal: "阅读记录",
    readingTime: "阅读时间",
    pagesRead: "已读页数",
    recordCount: "记录次数",
    minutes: "分钟",
    pages: "页",
    times: "次",
    chooseBookTitle: "选择一本要记录阅读情况的书",
    chooseBookDescription:
      "请从书架中选择一本书，然后打开它的阅读记录。",
    chooseBook: "从书架选择书籍 →",
    todayTitle: "记录今天的阅读",
    todayDescription:
      "即使只读了几页，也是值得肯定的一步。也把自己的发现记录下来吧。",
    startPage: "开始阅读的页码",
    endPage: "读到的最后一页",
    readingMinutes: "阅读时间（分钟）",
    learned: "今天学到的内容或印象深刻的地方",
    learnedPlaceholder: "新了解到的知识、有意思的词语、读后感等…",
    save: "保存阅读记录",
    invalidInput: "请检查页码和阅读时间是否正确。",
    totalPagesError: (total: string) =>
      `这本书的总页数为 ${total} 页。`,
    saved: "阅读记录已保存。辛苦了！",
    saveError: "保存失败。请检查浏览器的可用存储空间。",
    history: "Reading History",
    historyDescription: "关于这本书的阅读记录",
    noRecords: "还没有阅读记录。",
    firstRecord: "试着留下第一条阅读记录吧。",
    pagesUnit: "页",
    pagesReadUnit: "页",
    backToBookshelf: "← 返回书架",
    libraryTop: "Library 首页",
  },

  "zh-TW": {
    loading: "正在載入閱讀紀錄…",
    opening: "正在開啟閱讀頁面…",
    library: "Library",
    bookshelf: "書架",
    pdfReader: "PDF閱讀器",
    readingJournal: "閱讀紀錄",
    readingTime: "閱讀時間",
    pagesRead: "已讀頁數",
    recordCount: "紀錄次數",
    minutes: "分鐘",
    pages: "頁",
    times: "次",
    chooseBookTitle: "選擇一本要記錄閱讀情況的書",
    chooseBookDescription:
      "請從書架中選擇一本書，然後開啟它的閱讀紀錄。",
    chooseBook: "從書架選擇書籍 →",
    todayTitle: "記錄今天的閱讀",
    todayDescription:
      "即使只讀了幾頁，也是值得肯定的一步。也把自己的發現記錄下來吧。",
    startPage: "開始閱讀的頁碼",
    endPage: "讀到的最後一頁",
    readingMinutes: "閱讀時間（分鐘）",
    learned: "今天學到的內容或印象深刻的地方",
    learnedPlaceholder: "新了解到的知識、有趣的詞語、讀後感等…",
    save: "儲存閱讀紀錄",
    invalidInput: "請確認頁碼和閱讀時間是否正確。",
    totalPagesError: (total: string) =>
      `這本書的總頁數為 ${total} 頁。`,
    saved: "閱讀紀錄已儲存。辛苦了！",
    saveError: "儲存失敗。請檢查瀏覽器的可用儲存空間。",
    history: "Reading History",
    historyDescription: "關於這本書的閱讀紀錄",
    noRecords: "還沒有閱讀紀錄。",
    firstRecord: "試著留下第一筆閱讀紀錄吧。",
    pagesUnit: "頁",
    pagesReadUnit: "頁",
    backToBookshelf: "← 返回書架",
    libraryTop: "Library 首頁",
  },

  es: {
    loading: "Cargando tus registros de lectura…",
    opening: "Abriendo la página de lectura…",
    library: "Library",
    bookshelf: "Estantería",
    pdfReader: "Lector de PDF",
    readingJournal: "DIARIO DE LECTURA",
    readingTime: "Tiempo de lectura",
    pagesRead: "Páginas leídas",
    recordCount: "Registros",
    minutes: "min",
    pages: "páginas",
    times: "veces",
    chooseBookTitle: "Elige un libro para registrar tu lectura",
    chooseBookDescription:
      "Selecciona un libro de tu estantería para abrir su diario de lectura.",
    chooseBook: "Elegir un libro de la estantería →",
    todayTitle: "Registrar la lectura de hoy",
    todayDescription:
      "Aunque solo hayas leído unas páginas, es un buen avance. Anota también lo que hayas descubierto.",
    startPage: "Primera página leída",
    endPage: "Última página leída",
    readingMinutes: "Tiempo de lectura (minutos)",
    learned: "Lo que has aprendido o lo que te ha llamado la atención hoy",
    learnedPlaceholder:
      "Algo nuevo que has aprendido, palabras interesantes, tus impresiones…",
    save: "Guardar registro de lectura",
    invalidInput: "Comprueba los números de página y el tiempo de lectura.",
    totalPagesError: (total: string) =>
      `Este libro tiene ${total} páginas en total.`,
    saved: "Tu registro de lectura se ha guardado. ¡Buen trabajo!",
    saveError:
      "No se pudo guardar. Comprueba el espacio de almacenamiento disponible en tu navegador.",
    history: "Reading History",
    historyDescription: "Tus registros de lectura de este libro",
    noRecords: "Todavía no hay registros.",
    firstRecord: "Crea tu primer registro de lectura.",
    pagesUnit: "páginas",
    pagesReadUnit: "páginas leídas",
    backToBookshelf: "← Volver a la estantería",
    libraryTop: "Inicio de Library",
  },
};

const localeMap: Record<Language, string> = {
  ja: "ja-JP",
  de: "de-DE",
  en: "en-US",
  "zh-CN": "zh-CN",
  "zh-TW": "zh-TW",
  es: "es-ES",
};

const linkClass =
  "text-sm font-medium text-[var(--anki-theme-dark)] underline-offset-4 transition hover:text-[var(--anki-theme-color)] hover:underline";

const buttonClass =
  "w-full rounded-xl border border-[var(--anki-theme-color)] bg-[var(--anki-theme-light)] px-4 py-3 text-sm font-semibold text-[var(--anki-theme-dark)] transition hover:bg-[var(--anki-theme-soft)]";

const inputClass =
  "mt-2 block w-full rounded-xl border border-[#D5D8D0] bg-white px-3 py-3 text-black outline-none placeholder:text-[#858980] focus:border-[var(--anki-theme-color)] focus:ring-2 focus:ring-[var(--anki-theme-light)]";

function ReadContent() {
  const { language } = useAppLanguage();

  const currentLanguage: Language =
    language in translations ? (language as Language) : "ja";

  const t = translations[currentLanguage];

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
  const [messageType, setMessageType] = useState<
    "success" | "error" | ""
  >("");

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
      setMessage(t.invalidInput);
      setMessageType("error");
      return;
    }

    if (book.totalPages && end > Number(book.totalPages)) {
      setMessage(t.totalPagesError(book.totalPages));
      setMessageType("error");
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
      setMessage(t.saved);
      setMessageType("success");
      setLearned("");
      setStartPage(String(end + 1));
      setEndPage(String(end + 1));
    } catch (error) {
      console.error("読書記録を保存できませんでした。", error);
      setMessage(t.saveError);
      setMessageType("error");
    }
  }

  function formatDate(date: string) {
    const parsedDate = new Date(`${date}T00:00:00`);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return new Intl.DateTimeFormat(localeMap[currentLanguage], {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(parsedDate);
  }

  if (!loaded) {
    return (
      <main className="min-h-screen bg-[#F7F7F5] p-8 text-black">
        {t.loading}
      </main>
    );
  }

  if (bookId === null || !Number.isFinite(bookId) || !book) {
    return (
      <main className="min-h-screen bg-[#F7F7F5] px-5 py-8 text-[#30332F] sm:px-8">
        <div className="mx-auto max-w-3xl">
          <Link href="/library" className={linkClass}>
            ← {t.library}
          </Link>

          <section className="mt-8 rounded-2xl border border-[#E6E7E1] bg-white p-7">
            <p className="text-xs tracking-[0.2em] text-[#858980]">
              LITTLE LIBRARY
            </p>
            <h1 className="mt-3 text-xl font-semibold">
              {t.chooseBookTitle}
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#777D75]">
              {t.chooseBookDescription}
            </p>

            <Link
              href="/library/books"
              className="mt-5 inline-flex rounded-xl border border-[var(--anki-theme-color)] bg-[var(--anki-theme-light)] px-5 py-3 text-sm font-semibold text-[var(--anki-theme-dark)] transition hover:bg-[var(--anki-theme-soft)]"
            >
              {t.chooseBook}
            </Link>
          </section>
        </div>
      </main>
    );
  }

  const bookLogs = logs.filter((log) => log.bookId === book.id);

  const totalMinutes = bookLogs.reduce(
    (sum, log) => sum + log.minutes,
    0
  );

  const totalPagesRead = bookLogs.reduce(
    (sum, log) =>
      sum + Math.max(0, log.endPage - log.startPage + 1),
    0
  );

  return (
    <main className="min-h-screen bg-[#F7F7F5] px-5 py-8 text-[#30332F] sm:px-8">
      <div className="mx-auto max-w-3xl">
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link href="/library" className={linkClass}>
            ← {t.library}
          </Link>
          <Link href="/library/books" className={linkClass}>
            {t.bookshelf}
          </Link>
          <Link href="/library/pdf" className={linkClass}>
            {t.pdfReader}
          </Link>
        </nav>

        <header className="mt-8">
          <p className="text-xs tracking-[0.2em] text-[#858980]">
            {t.readingJournal}
          </p>

          <h1 className="mt-3 break-words text-3xl font-semibold tracking-tight">
            {book.title}
          </h1>

          {book.author && (
            <p className="mt-2 text-sm text-[#858980]">
              {book.author}
            </p>
          )}

          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-[#E6E7E1] bg-white p-3 sm:p-4">
              <p className="text-xs text-[#858980]">
                {t.readingTime}
              </p>
              <p className="mt-2 text-xl font-semibold text-[var(--anki-theme-dark)]">
                {totalMinutes}
                <span className="ml-1 text-xs font-normal">
                  {t.minutes}
                </span>
              </p>
            </div>

            <div className="rounded-2xl border border-[#E6E7E1] bg-white p-3 sm:p-4">
              <p className="text-xs text-[#858980]">
                {t.pagesRead}
              </p>
              <p className="mt-2 text-xl font-semibold text-[var(--anki-theme-dark)]">
                {totalPagesRead}
                <span className="ml-1 text-xs font-normal">
                  {t.pages}
                </span>
              </p>
            </div>

            <div className="rounded-2xl border border-[#E6E7E1] bg-white p-3 sm:p-4">
              <p className="text-xs text-[#858980]">
                {t.recordCount}
              </p>
              <p className="mt-2 text-xl font-semibold text-[var(--anki-theme-dark)]">
                {bookLogs.length}
                <span className="ml-1 text-xs font-normal">
                  {t.times}
                </span>
              </p>
            </div>
          </div>
        </header>

        <section className="mt-8 rounded-2xl border border-[#E6E7E1] bg-white p-5 sm:p-6">
          <h2 className="text-base font-semibold">
            {t.todayTitle}
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#858980]">
            {t.todayDescription}
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm">
              {t.startPage}
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
              {t.endPage}
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
              {t.readingMinutes}
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
              {t.learned}
              <textarea
                value={learned}
                onChange={(e) => setLearned(e.target.value)}
                rows={4}
                placeholder={t.learnedPlaceholder}
                className={`${inputClass} leading-6`}
              />
            </label>
          </div>

          <button
            type="button"
            onClick={saveReading}
            className={`mt-5 ${buttonClass}`}
          >
            {t.save}
          </button>

          {message && (
            <p
              role="status"
              className={`mt-3 text-sm ${
                messageType === "success"
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
            <h2 className="text-base font-semibold">
              {t.history}
            </h2>
            <p className="mt-1 text-xs text-[#858980]">
              {t.historyDescription}
            </p>
          </div>

          {bookLogs.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-[#D9DCD4] bg-white/60 p-8 text-center">
              <p className="text-sm text-[#777D75]">
                {t.noRecords}
              </p>
              <p className="mt-2 text-xs text-[#858980]">
                {t.firstRecord}
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
                    <time className="text-sm font-medium">
                      {formatDate(log.date)}
                    </time>

                    <span className="rounded-lg bg-[var(--anki-theme-light)] px-3 py-1.5 text-xs text-[var(--anki-theme-dark)]">
                      {log.minutes} {t.minutes}
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-[#30332F]">
                    {log.startPage}〜{log.endPage} {t.pagesUnit}
                    <span className="ml-2 text-xs text-[#858980]">
                      （
                      {Math.max(
                        0,
                        log.endPage - log.startPage + 1
                      )}
                      {t.pagesReadUnit}）
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
            {t.backToBookshelf}
          </Link>
          <span className="mx-3 text-[#D9DCD4]">/</span>
          <Link href="/library" className={linkClass}>
            {t.libraryTop}
          </Link>
        </footer>
      </div>
    </main>
  );
}

export default function ReadPage() {
  const { language } = useAppLanguage();

  const currentLanguage: Language =
    language in translations ? (language as Language) : "ja";

  const t = translations[currentLanguage];

  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#F7F7F5] p-8 text-black">
          {t.opening}
        </main>
      }
    >
      <ReadContent />
    </Suspense>
  );
}