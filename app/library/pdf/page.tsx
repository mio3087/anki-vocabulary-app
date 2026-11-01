"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAppLanguage } from "@/app/component/AppLanguage";

const STORAGE_KEY = "little-library-books-v1";

type Book = {
  id: number;
  title: string;
  author?: string;
};

type Language = "ja" | "de" | "en" | "zh-CN" | "zh-TW" | "es";

const translations: Record<Language, {
  library: string;
  bookshelf: string;
  scanBook: string;
  pageDescription: string;
  openPdf: string;
  pdfDescription: string;
  selectPdf: string;
  invalidFile: string;
  closePdf: string;
  pdfReader: string;
  emptyTitle: string;
  emptyDescription: string;
  readingRecord: string;
  recordDescription: string;
  selectBook: string;
  selectBookPlaceholder: string;
  goToRecord: string;
  registerBookFirst: string;
  registerBook: string;
  notice: string;
  backToLibrary: string;
  selectBookError: string;
}> = {
  ja: {
    library: "← Library",
    bookshelf: "本棚",
    scanBook: "本をスキャン",
    pageDescription: "電子教材や本を開いて、自分のペースで読もう。",
    openPdf: "PDFを開く",
    pdfDescription: "パソコンに保存されているPDFファイルを選択してください。",
    selectPdf: "読みたいPDF",
    invalidFile: "PDFファイルを選んでください。",
    closePdf: "PDFを閉じる",
    pdfReader: "PDFリーダー",
    emptyTitle: "読みたい本を開こう",
    emptyDescription: "上からPDFを選ぶと、ここに表示されます。ページ移動や拡大縮小はPDFビューアーで操作できます。",
    readingRecord: "読書記録",
    recordDescription: "読んでいる本を本棚から選ぶと、その本の読書記録をつけられます。",
    selectBook: "記録する本",
    selectBookPlaceholder: "本を選択してください",
    goToRecord: "選んだ本の読書記録へ →",
    registerBookFirst: "まずは本棚に本を登録してください。",
    registerBook: "本棚で本を登録する →",
    notice: "選択したPDFはこのブラウザ内で開きます。現在、PDFファイルそのものは保存・同期されません。ページを離れたあとに再び読む場合は、もう一度ファイルを選んでください。",
    backToLibrary: "← Little Library トップへ戻る",
    selectBookError: "先に読書記録をつける本を選んでください。",
  },
  de: {
    library: "← Library",
    bookshelf: "Bücherregal",
    scanBook: "Buch scannen",
    pageDescription: "Öffne digitale Lernmaterialien oder Bücher und lies in deinem eigenen Tempo.",
    openPdf: "PDF öffnen",
    pdfDescription: "Bitte wähle eine PDF-Datei aus, die auf deinem Computer gespeichert ist.",
    selectPdf: "PDF auswählen",
    invalidFile: "Bitte wähle eine PDF-Datei aus.",
    closePdf: "PDF schließen",
    pdfReader: "PDF-Reader",
    emptyTitle: "Öffne ein Buch zum Lesen",
    emptyDescription: "Wähle oben eine PDF-Datei aus, um sie hier anzuzeigen. Seitenwechsel und Zoom kannst du im PDF-Viewer steuern.",
    readingRecord: "Leseprotokoll",
    recordDescription: "Wähle ein Buch aus deinem Bücherregal aus, um deine Leseaktivitäten zu dokumentieren.",
    selectBook: "Buch für den Eintrag",
    selectBookPlaceholder: "Bitte ein Buch auswählen",
    goToRecord: "Zum Leseprotokoll des ausgewählten Buches →",
    registerBookFirst: "Bitte füge zuerst ein Buch zu deinem Bücherregal hinzu.",
    registerBook: "Buch ins Bücherregal aufnehmen →",
    notice: "Die ausgewählte PDF-Datei wird in diesem Browser geöffnet. Die PDF-Datei selbst wird derzeit weder gespeichert noch synchronisiert. Wenn du sie nach dem Verlassen dieser Seite erneut lesen möchtest, wähle die Datei bitte noch einmal aus.",
    backToLibrary: "← Zurück zur Little Library",
    selectBookError: "Bitte wähle zuerst ein Buch für dein Leseprotokoll aus.",
  },
  en: {
    library: "← Library",
    bookshelf: "Bookshelf",
    scanBook: "Scan a book",
    pageDescription: "Open digital learning materials or books and read at your own pace.",
    openPdf: "Open PDF",
    pdfDescription: "Please select a PDF file saved on your computer.",
    selectPdf: "Choose a PDF",
    invalidFile: "Please select a PDF file.",
    closePdf: "Close PDF",
    pdfReader: "PDF Reader",
    emptyTitle: "Open a book to start reading",
    emptyDescription: "Select a PDF above to display it here. You can navigate pages and zoom in or out using the PDF viewer.",
    readingRecord: "Reading Journal",
    recordDescription: "Select a book from your bookshelf to keep a reading record for it.",
    selectBook: "Book to record",
    selectBookPlaceholder: "Please select a book",
    goToRecord: "Go to the reading journal for this book →",
    registerBookFirst: "Please add a book to your bookshelf first.",
    registerBook: "Add a book to your bookshelf →",
    notice: "The selected PDF is opened in this browser. The PDF file itself is not currently saved or synced. If you want to read it again after leaving this page, please select the file again.",
    backToLibrary: "← Back to Little Library",
    selectBookError: "Please select a book to record your reading first.",
  },
  "zh-CN": {
    library: "← Library",
    bookshelf: "书架",
    scanBook: "扫描书籍",
    pageDescription: "打开电子教材或书籍，按照自己的节奏阅读吧。",
    openPdf: "打开 PDF",
    pdfDescription: "请选择保存在电脑中的 PDF 文件。",
    selectPdf: "选择 PDF 文件",
    invalidFile: "请选择 PDF 文件。",
    closePdf: "关闭 PDF",
    pdfReader: "PDF 阅读器",
    emptyTitle: "打开想读的书吧",
    emptyDescription: "选择上方的 PDF 文件后，就会显示在这里。可以使用 PDF 阅读器翻页和缩放。",
    readingRecord: "阅读记录",
    recordDescription: "从书架中选择正在阅读的书籍，即可记录这本书的阅读情况。",
    selectBook: "选择要记录的书籍",
    selectBookPlaceholder: "请选择一本书",
    goToRecord: "前往所选书籍的阅读记录 →",
    registerBookFirst: "请先在书架中添加书籍。",
    registerBook: "在书架中添加书籍 →",
    notice: "所选 PDF 仅在当前浏览器中打开。目前 PDF 文件本身不会被保存或同步。离开此页面后，如果想再次阅读，请重新选择文件。",
    backToLibrary: "← 返回 Little Library 首页",
    selectBookError: "请先选择要记录阅读情况的书籍。",
  },
  "zh-TW": {
    library: "← Library",
    bookshelf: "書架",
    scanBook: "掃描書籍",
    pageDescription: "開啟電子教材或書籍，按照自己的步調閱讀吧。",
    openPdf: "開啟 PDF",
    pdfDescription: "請選擇儲存在電腦中的 PDF 檔案。",
    selectPdf: "選擇 PDF 檔案",
    invalidFile: "請選擇 PDF 檔案。",
    closePdf: "關閉 PDF",
    pdfReader: "PDF 閱讀器",
    emptyTitle: "開啟想讀的書吧",
    emptyDescription: "選擇上方的 PDF 檔案後，就會顯示在這裡。可以使用 PDF 閱讀器翻頁和縮放。",
    readingRecord: "閱讀紀錄",
    recordDescription: "從書架中選擇正在閱讀的書籍，即可記錄這本書的閱讀情況。",
    selectBook: "選擇要記錄的書籍",
    selectBookPlaceholder: "請選擇一本書",
    goToRecord: "前往所選書籍的閱讀紀錄 →",
    registerBookFirst: "請先在書架中新增書籍。",
    registerBook: "在書架中新增書籍 →",
    notice: "所選 PDF 僅在目前瀏覽器中開啟。目前 PDF 檔案本身不會被儲存或同步。離開此頁面後，如果想再次閱讀，請重新選擇檔案。",
    backToLibrary: "← 返回 Little Library 首頁",
    selectBookError: "請先選擇要記錄閱讀情況的書籍。",
  },
  es: {
    library: "← Library",
    bookshelf: "Estantería",
    scanBook: "Escanear un libro",
    pageDescription: "Abre materiales de estudio digitales o libros y lee a tu propio ritmo.",
    openPdf: "Abrir PDF",
    pdfDescription: "Selecciona un archivo PDF guardado en tu ordenador.",
    selectPdf: "Seleccionar PDF",
    invalidFile: "Por favor, selecciona un archivo PDF.",
    closePdf: "Cerrar PDF",
    pdfReader: "Lector de PDF",
    emptyTitle: "Abre un libro para empezar a leer",
    emptyDescription: "Selecciona un PDF arriba para mostrarlo aquí. Puedes cambiar de página y ajustar el zoom desde el visor de PDF.",
    readingRecord: "Registro de lectura",
    recordDescription: "Selecciona un libro de tu estantería para registrar tu actividad de lectura.",
    selectBook: "Libro que quieres registrar",
    selectBookPlaceholder: "Selecciona un libro",
    goToRecord: "Ir al registro de lectura del libro seleccionado →",
    registerBookFirst: "Primero, añade un libro a tu estantería.",
    registerBook: "Añadir un libro a la estantería →",
    notice: "El PDF seleccionado se abre en este navegador. Actualmente, el archivo PDF no se guarda ni se sincroniza. Si quieres volver a leerlo después de salir de esta página, tendrás que seleccionarlo de nuevo.",
    backToLibrary: "← Volver a Little Library",
    selectBookError: "Primero, selecciona el libro cuya lectura quieres registrar.",
  },
};

const linkClass =
  "text-sm font-medium text-[var(--anki-theme-dark)] transition hover:text-[var(--anki-theme-color)] hover:underline underline-offset-4";

const buttonClass =
  "inline-flex rounded-xl bg-[var(--anki-theme-color)] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90";

const selectClass =
  "mt-1.5 block w-full rounded-xl border border-[#E1E3DC] bg-white px-3 py-3 text-sm text-[#30332F] outline-none focus:border-[var(--anki-theme-color)] focus:ring-2 focus:ring-[var(--anki-theme-light)]";

export default function PdfReaderPage() {
  const { language } = useAppLanguage();

  const currentLanguage: Language =
    language in translations ? (language as Language) : "ja";

  const t = translations[currentLanguage];

  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");

  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBookId, setSelectedBookId] = useState("");

  // 本棚の本を読み込む
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
    }
  }, []);

  // PDFを閉じるとき、作成したURLを解放する
  useEffect(() => {
    return () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl);
    };
  }, [fileUrl]);

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      setError(t.invalidFile);
      return;
    }

    setFileUrl((currentUrl) => {
      if (currentUrl) URL.revokeObjectURL(currentUrl);
      return URL.createObjectURL(file);
    });

    setFileName(file.name);
    setError("");
  }

  function closePdf() {
    if (fileUrl) URL.revokeObjectURL(fileUrl);

    setFileUrl("");
    setFileName("");
    setError("");
  }

  return (
    <main className="min-h-screen bg-[#F7F7F5] px-5 py-8 text-[#30332F] sm:px-8">
      <div className="mx-auto max-w-6xl">
        {/* ページ間ナビゲーション */}
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <Link href="/library" className={linkClass}>
            {t.library}
          </Link>
          <Link href="/library/books" className={linkClass}>
            {t.bookshelf}
          </Link>
          <Link href="/library/scan" className={linkClass}>
            {t.scanBook}
          </Link>
        </nav>

        {/* タイトル */}
        <header className="mt-8">
          <p className="text-xs tracking-[0.2em] text-[#858980]">
            LITTLE LIBRARY
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            PDF Reader
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#777D75]">
            {t.pageDescription}
          </p>
        </header>

        {/* PDF選択 */}
        <section className="mt-8 rounded-2xl border border-[#E6E7E1] bg-white p-5 sm:p-6">
          <h2 className="text-base font-semibold">{t.openPdf}</h2>
          <p className="mt-1 text-xs leading-5 text-[#858980]">
            {t.pdfDescription}
          </p>

          <label className="mt-5 block text-sm font-medium">
            {t.selectPdf}
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="mt-2 block w-full text-sm file:mr-3 file:rounded-xl file:border-0 file:bg-[var(--anki-theme-light)] file:px-4 file:py-3 file:text-sm file:font-medium file:text-[var(--anki-theme-dark)] hover:file:bg-[var(--anki-theme-soft)]"
            />
          </label>

          {error && (
            <p role="alert" className="mt-3 text-sm text-red-600">
              {error}
            </p>
          )}

          {fileName && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#F7F7F5] p-3">
              <p className="break-all text-sm text-[var(--anki-theme-dark)]">
                {fileName}
              </p>
              <button
                type="button"
                onClick={closePdf}
                className="shrink-0 text-xs text-[#858980] transition hover:text-red-600"
              >
                {t.closePdf}
              </button>
            </div>
          )}
        </section>

        {/* PDF表示エリア */}
        <section className="mt-5 overflow-hidden rounded-2xl border border-[#E6E7E1] bg-white">
          {fileUrl ? (
            <iframe
              key={fileUrl}
              src={fileUrl}
              title={t.pdfReader}
              className="h-[75vh] min-h-[500px] w-full"
            />
          ) : (
            <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--anki-theme-light)]">
                <span className="text-xl font-medium text-[var(--anki-theme-dark)]">
                  PDF
                </span>
              </div>
              <h2 className="mt-5 text-base font-medium">
                {t.emptyTitle}
              </h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-[#858980]">
                {t.emptyDescription}
              </p>
            </div>
          )}
        </section>

        {/* 読書記録につなぐ */}
        <section className="mt-5 rounded-2xl border border-[#E6E7E1] bg-white p-5 sm:p-6">
          <h2 className="text-base font-semibold">{t.readingRecord}</h2>
          <p className="mt-2 text-sm leading-6 text-[#777D75]">
            {t.recordDescription}
          </p>

          {books.length > 0 ? (
            <>
              <label className="mt-4 block text-xs text-[#777D75]">
                {t.selectBook}
                <select
                  value={selectedBookId}
                  onChange={(e) => setSelectedBookId(e.target.value)}
                  className={selectClass}
                >
                  <option value="">{t.selectBookPlaceholder}</option>
                  {books.map((book) => (
                    <option key={book.id} value={book.id}>
                      {book.title}
                    </option>
                  ))}
                </select>
              </label>

              <Link
                href={
                  selectedBookId
                    ? `/library/read?id=${selectedBookId}`
                    : "/library/books"
                }
                onClick={(event) => {
                  if (!selectedBookId) {
                    event.preventDefault();
                    setError(t.selectBookError);
                  } else {
                    setError("");
                  }
                }}
                className={`mt-4 ${buttonClass}`}
              >
                {t.goToRecord}
              </Link>
            </>
          ) : (
            <div className="mt-4 rounded-xl bg-[#F7F7F5] p-4">
              <p className="text-sm text-[#777D75]">
                {t.registerBookFirst}
              </p>
              <Link
                href="/library/books"
                className={`mt-3 ${buttonClass}`}
              >
                {t.registerBook}
              </Link>
            </div>
          )}
        </section>

        {/* 注意書き */}
        <p className="mt-5 text-xs leading-6 text-[#858980]">
          {t.notice}
        </p>

        <footer className="mt-8 border-t border-[#E6E7E1] pt-5">
          <Link href="/library" className={linkClass}>
            {t.backToLibrary}
          </Link>
        </footer>
      </div>
    </main>
  );
}