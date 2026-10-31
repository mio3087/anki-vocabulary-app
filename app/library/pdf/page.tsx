
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "little-library-books-v1";

type Book = {
  id: number;
  title: string;
  author?: string;
};

const linkClass =
  "text-sm font-medium text-[var(--anki-theme-dark)] transition hover:text-[var(--anki-theme-color)] hover:underline underline-offset-4";

const buttonClass =
  "inline-flex rounded-xl bg-[var(--anki-theme-color)] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90";

const selectClass =
  "mt-1.5 block w-full rounded-xl border border-[#E1E3DC] bg-white px-3 py-3 text-sm text-[#30332F] outline-none focus:border-[var(--anki-theme-color)] focus:ring-2 focus:ring-[var(--anki-theme-light)]";

export default function PdfReaderPage() {
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
      setError("PDFファイルを選んでください。");
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
            ← Library
          </Link>
          <Link href="/library/books" className={linkClass}>
            本棚
          </Link>
          <Link href="/library/scan" className={linkClass}>
            本をスキャン
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
            電子教材や本を開いて、自分のペースで読もう。
          </p>
        </header>

        {/* PDF選択 */}
        <section className="mt-8 rounded-2xl border border-[#E6E7E1] bg-white p-5 sm:p-6">
          <h2 className="text-base font-semibold">PDFを開く</h2>
          <p className="mt-1 text-xs leading-5 text-[#858980]">
            パソコンに保存されているPDFファイルを選択してください。
          </p>

          <label className="mt-5 block text-sm font-medium">
            読みたいPDF
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
                PDFを閉じる
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
              title="PDFリーダー"
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
                読みたい本を開こう
              </h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-[#858980]">
                上からPDFを選ぶと、ここに表示されます。
                ページ移動や拡大縮小はPDFビューアーで操作できます。
              </p>
            </div>
          )}
        </section>

        {/* 読書記録につなぐ */}
        <section className="mt-5 rounded-2xl border border-[#E6E7E1] bg-white p-5 sm:p-6">
          <h2 className="text-base font-semibold">読書記録</h2>
          <p className="mt-2 text-sm leading-6 text-[#777D75]">
            読んでいる本を本棚から選ぶと、その本の読書記録をつけられます。
          </p>

          {books.length > 0 ? (
            <>
              <label className="mt-4 block text-xs text-[#777D75]">
                記録する本
                <select
                  value={selectedBookId}
                  onChange={(e) => setSelectedBookId(e.target.value)}
                  className={selectClass}
                >
                  <option value="">本を選択してください</option>
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
                    setError("先に読書記録をつける本を選んでください。");
                  } else {
                    setError("");
                  }
                }}
                className={`mt-4 ${buttonClass}`}
              >
                選んだ本の読書記録へ →
              </Link>
            </>
          ) : (
            <div className="mt-4 rounded-xl bg-[#F7F7F5] p-4">
              <p className="text-sm text-[#777D75]">
                まずは本棚に本を登録してください。
              </p>
              <Link
                href="/library/books"
                className={`mt-3 ${buttonClass}`}
              >
                本棚で本を登録する →
              </Link>
            </div>
          )}
        </section>

        {/* 注意書き */}
        <p className="mt-5 text-xs leading-6 text-[#858980]">
          選択したPDFはこのブラウザ内で開きます。現在、PDFファイルそのものは保存・同期されません。ページを離れたあとに再び読む場合は、もう一度ファイルを選んでください。
        </p>

        <footer className="mt-8 border-t border-[#E6E7E1] pt-5">
          <Link href="/library" className={linkClass}>
            ← Little Library トップへ戻る
          </Link>
        </footer>
      </div>
    </main>
  );
}