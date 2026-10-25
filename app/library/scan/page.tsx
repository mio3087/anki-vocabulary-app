
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "little-library-books-v1";

type BookDraft = {
  id: string;
  title: string;
  author: string;
  isbn: string;
  selected: boolean;
};

type SourceFile = {
  id: string;
  file: File;
  url: string;
  kind: "image" | "pdf";
};

export default function LibraryScanPage() {
  const cameraRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);
  const urlsRef = useRef<string[]>([]);

  const [sources, setSources] = useState<SourceFile[]>([]);
  const [drafts, setDrafts] = useState<BookDraft[]>([]);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [pdfPages, setPdfPages] = useState(0);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      urlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  async function startCamera() {
    setMessage("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage(
        "この環境ではカメラを利用できません。localhostまたはHTTPSで開いているか確認してください。"
      );
      return;
    }

    try {
      streamRef.current?.getTracks().forEach((track) => track.stop());

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });

      streamRef.current = stream;
      setCameraOpen(true);

      requestAnimationFrame(() => {
        if (cameraRef.current) {
          cameraRef.current.srcObject = stream;
          cameraRef.current.play().catch(() => {
            setMessage("カメラ映像を開始できません。ブラウザの権限を確認してください。");
          });
        }
      });
    } catch (error) {
      console.error(error);
      setMessage(
        "カメラを起動できませんでした。ブラウザのカメラ使用を許可してください。"
      );
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (cameraRef.current) {
      cameraRef.current.srcObject = null;
    }

    setCameraOpen(false);
  }

  function addFiles(files: File[]) {
    const accepted = files.filter(
      (file) =>
        file.type.startsWith("image/") ||
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf")
    );

    if (accepted.length !== files.length) {
      setMessage("画像またはPDFファイルを選択してください。");
    } else {
      setMessage("");
    }

    const next: SourceFile[] = accepted.map((file, index) => {
      const url = URL.createObjectURL(file);
      urlsRef.current.push(url);

      return {
        id: `${Date.now()}-${index}-${Math.random()}`,
        file,
        url,
        kind:
          file.type === "application/pdf" ||
          file.name.toLowerCase().endsWith(".pdf")
            ? "pdf"
            : "image",
      };
    });

    if (next.length) {
      setSources((current) => [...current, ...next]);
      setDrafts([]);
      setPreviewText("");
    }

    if (photoRef.current) photoRef.current.value = "";
    if (pdfRef.current) pdfRef.current.value = "";
  }

  function takePhoto() {
    const video = cameraRef.current;

    if (!video || !video.videoWidth || !video.videoHeight) {
      setMessage("カメラ映像を準備しています。少し待ってから撮影してください。");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    if (!context) {
      setMessage("撮影に失敗しました。");
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setMessage("写真を作成できませんでした。");
          return;
        }

        const file = new File([blob], `book-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });

        addFiles([file]);
        stopCamera();
        setMessage("撮影しました。読み取りボタンで内容を確認できます。");
      },
      "image/jpeg",
      0.92
    );
  }

  function removeSource(id: string) {
    setSources((current) => {
      const target = current.find((item) => item.id === id);

      if (target) {
        URL.revokeObjectURL(target.url);
        urlsRef.current = urlsRef.current.filter(
          (url) => url !== target.url
        );
      }

      return current.filter((item) => item.id !== id);
    });

    setDrafts([]);
    setPreviewText("");
    setMessage("");
  }

  function extractBooks(text: string): BookDraft[] {
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.replace(/\s+/g, " ").trim())
      .filter(
        (line) =>
          line.length >= 2 &&
          !/^(ISBN|出版|発行|定価|価格|http|www\.)/i.test(line)
      );

    const matches = [
      ...text.matchAll(
        /(?:ISBN(?:-1[03])?\s*:?\s*)?((?:97[89][-\s]?)?(?:\d[-\s]?){9,12}[\dX])/gi
      ),
    ];

    const isbns = Array.from(
      new Set(
        matches
          .map((match) => match[1].replace(/[-\s]/g, ""))
          .filter((isbn) => isbn.length === 10 || isbn.length === 13)
      )
    );

    const count = Math.max(lines.length, isbns.length);

    return Array.from({ length: count }, (_, index) => ({
      id: `${Date.now()}-${index}-${Math.random()}`,
      title: lines[index] ?? "",
      author: "",
      isbn: isbns[index] ?? "",
      selected: Boolean(lines[index] || isbns[index]),
    })).filter((book) => book.title || book.isbn);
  }

  async function readFiles() {
    if (!sources.length) {
      setMessage("先に写真またはPDFを選択してください。");
      return;
    }

    setScanning(true);
    setMessage("読み取りを開始しています…");
    setPreviewText("");
    setDrafts([]);
    setPdfPages(0);

    const extractedTexts: string[] = [];

    try {
      const pdfjs = await import("pdfjs-dist");

      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url
      ).toString();

      let Tesseract: typeof import("tesseract.js") | null = null;

      for (let i = 0; i < sources.length; i++) {
        const source = sources[i];

        setMessage(`読み取り中：${i + 1}/${sources.length} ファイル`);

        if (source.kind === "pdf") {
          const buffer = await source.file.arrayBuffer();
          const pdf = await pdfjs.getDocument({
            data: new Uint8Array(buffer),
          }).promise;

          setPdfPages((current) => current + pdf.numPages);

          for (
            let pageNumber = 1;
            pageNumber <= pdf.numPages;
            pageNumber++
          ) {
            setMessage(
              `PDF読み取り中：ファイル${i + 1}、${pageNumber}/${pdf.numPages}ページ`
            );

            const page = await pdf.getPage(pageNumber);
            const content = await page.getTextContent();
            const pageText = content.items
              .map((item) => ("str" in item ? item.str : ""))
              .join(" ");

            if (pageText.trim()) {
              extractedTexts.push(
                `【${source.file.name}・${pageNumber}ページ】\n${pageText}`
              );
            } else {
              if (!Tesseract) {
                Tesseract = await import("tesseract.js");
              }

              const viewport = page.getViewport({ scale: 1.6 });
              const canvas = document.createElement("canvas");
              canvas.width = Math.ceil(viewport.width);
              canvas.height = Math.ceil(viewport.height);

              const context = canvas.getContext("2d");
              if (!context) continue;

              await page.render({
                canvas,
                canvasContext: context,
                viewport,
              }).promise;

              const result = await Tesseract.recognize(
                canvas,
                "jpn+eng"
              );

              extractedTexts.push(
                `【${source.file.name}・${pageNumber}ページ（OCR）】\n${result.data.text}`
              );

              canvas.width = 0;
              canvas.height = 0;
            }
          }
        } else {
          if (!Tesseract) {
            Tesseract = await import("tesseract.js");
          }

          const result = await Tesseract.recognize(
            source.file,
            "jpn+eng"
          );

          extractedTexts.push(
            `【${source.file.name}】\n${result.data.text}`
          );
        }
      }

      const allText = extractedTexts.join("\n\n---\n\n").trim();
      setPreviewText(allText);

      if (!allText) {
        setMessage(
          "文字を読み取れませんでした。画像の鮮明さやPDFの内容を確認してください。"
        );
      } else {
        setDrafts(extractBooks(allText));
        setMessage(
          "読み取りが完了しました。文章と登録候補を確認してください。"
        );
      }
    } catch (error) {
      console.error(error);
      setMessage(
        "読み取りに失敗しました。pdfjs-dist と tesseract.js がインストールされているか確認してください。"
      );
    } finally {
      setScanning(false);
    }
  }

  function updateDraft(
    id: string,
    field: "title" | "author" | "isbn",
    value: string
  ) {
    setDrafts((current) =>
      current.map((book) =>
        book.id === id ? { ...book, [field]: value } : book
      )
    );
  }

  function toggleDraft(id: string) {
    setDrafts((current) =>
      current.map((book) =>
        book.id === id
          ? { ...book, selected: !book.selected }
          : book
      )
    );
  }

  function removeDraft(id: string) {
    setDrafts((current) => current.filter((book) => book.id !== id));
  }

  function registerBooks() {
    const selected = drafts.filter(
      (book) => book.selected && book.title.trim()
    );

    if (!selected.length) {
      setMessage("登録対象を選択し、タイトルを入力してください。");
      return;
    }

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const parsed: unknown = saved ? JSON.parse(saved) : [];

      if (!Array.isArray(parsed)) {
        throw new Error("保存データの形式が正しくありません。");
      }

      const existing = parsed as Array<Record<string, unknown>>;
      const isbns = new Set(
        existing
          .map((book) =>
            typeof book.isbn === "string"
              ? book.isbn.replace(/[-\s]/g, "")
              : ""
          )
          .filter(Boolean)
      );

      const addedIsbns = new Set<string>();

      const newBooks = selected
        .filter((book) => {
          const isbn = book.isbn.replace(/[-\s]/g, "");

          if (!isbn) return true;
          if (isbns.has(isbn) || addedIsbns.has(isbn)) return false;

          addedIsbns.add(isbn);
          return true;
        })
        .map((book, index) => ({
          id: Date.now() + index,
          title: book.title.trim(),
          author: book.author.trim(),
          isbn: book.isbn.trim(),
          totalPages: "",
          category: "その他",
          status: "未読",
        }));

      if (!newBooks.length) {
        setMessage("選択した本はすべて登録済みです。ISBNを確認してください。");
        return;
      }

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([...existing, ...newBooks])
      );

      const registeredKeys = new Set(
        newBooks.map(
          (book) => `${book.title}\u0000${book.author}\u0000${book.isbn}`
        )
      );

      setDrafts((current) =>
        current.filter(
          (book) =>
            !registeredKeys.has(
              `${book.title.trim()}\u0000${book.author.trim()}\u0000${book.isbn.trim()}`
            )
        )
      );

      setMessage(
        `${newBooks.length}冊を本棚に登録しました。`
      );
    } catch (error) {
      console.error(error);
      setMessage(
        "登録できませんでした。本棚の保存データを確認してください。"
      );
    }
  }

  const navClass =
    "rounded-xl border border-[#D9DCD4] bg-white px-4 py-2.5 text-sm transition hover:bg-[#F0F2ED]";

  return (
    <main className="min-h-screen bg-[#F7F7F5] px-5 py-8 text-[#30332F] sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/library"
          className="text-sm text-[#697D6B] hover:underline"
        >
          ← Libraryトップ
        </Link>

        <nav className="mt-5 flex flex-wrap gap-2">
          <Link href="/library" className={navClass}>
            Libraryトップ
          </Link>
          <Link href="/library/books" className={navClass}>
            本棚
          </Link>
          <Link
            href="/library/scan"
            className="rounded-xl bg-[#718675] px-4 py-2.5 text-sm text-white"
          >
            本・教材を読み取る
          </Link>
          <Link href="/library/pdf" className={navClass}>
            PDF Reader
          </Link>
        </nav>

        <h1 className="mt-7 text-2xl font-semibold tracking-tight">
          本・教材を読み取る
        </h1>

        <p className="mt-2 text-sm text-[#777D75]">
          本の写真やPDFを読み取り、内容を確認してから本棚に登録できます。
        </p>

        <section className="mt-6 rounded-2xl border border-[#E6E7E1] bg-white p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={startCamera}
              className="rounded-xl border border-[#D9DCD4] px-4 py-3 text-sm font-medium hover:bg-[#F0F2ED]"
            >
              カメラを起動
            </button>
            <button
              type="button"
              onClick={() => photoRef.current?.click()}
              className="rounded-xl border border-[#D9DCD4] px-4 py-3 text-sm font-medium hover:bg-[#F0F2ED]"
            >
              写真を選択
            </button>
            <button
              type="button"
              onClick={() => pdfRef.current?.click()}
              className="rounded-xl border border-[#D9DCD4] px-4 py-3 text-sm font-medium hover:bg-[#F0F2ED]"
            >
              PDFを選択
            </button>
          </div>

          <input
            ref={photoRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(event) =>
              addFiles(Array.from(event.target.files ?? []))
            }
          />
          <input
            ref={pdfRef}
            type="file"
            accept="application/pdf,.pdf"
            multiple
            className="hidden"
            onChange={(event) =>
              addFiles(Array.from(event.target.files ?? []))
            }
          />

          {cameraOpen && (
            <div className="mt-5 space-y-3">
              <video
                ref={cameraRef}
                autoPlay
                playsInline
                muted
                className="max-h-[65vh] w-full rounded-xl bg-black object-contain"
              />
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={takePhoto}
                  className="rounded-xl bg-[#30332F] px-4 py-2.5 text-sm text-white"
                >
                  撮影する
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="rounded-xl border border-[#D9DCD4] px-4 py-2.5 text-sm"
                >
                  カメラを閉じる
                </button>
              </div>
            </div>
          )}

          {sources.length > 0 && (
            <div className="mt-5 space-y-3">
              <h2 className="text-sm font-semibold">
                選択したファイル（{sources.length}件）
              </h2>

              {sources.map((source) => (
                <div
                  key={source.id}
                  className="flex items-center gap-3 rounded-xl border border-[#E6E7E1] p-3"
                >
                  {source.kind === "image" ? (
                    <img
                      src={source.url}
                      alt={source.file.name}
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-[#F0F2ED] text-sm font-semibold">
                      PDF
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {source.file.name}
                    </p>
                    <p className="text-xs text-[#858980]">
                      {(source.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeSource(source.id)}
                    className="text-xs text-[#858980] hover:text-red-600"
                  >
                    削除
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={readFiles}
            disabled={sources.length === 0 || scanning}
            className="mt-5 rounded-xl border border-[#D9DCD4] px-4 py-3 text-sm font-medium hover:bg-[#F0F2ED] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {scanning ? "読み取り中…" : "読み取り・プレビュー"}
          </button>

          {message && (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#697D6B]">
              {message}
            </p>
          )}
        </section>

        {previewText && (
          <section className="mt-7 rounded-2xl border border-[#E6E7E1] bg-white p-5">
            <h2 className="text-base font-semibold">
              読み取り文章のプレビュー
            </h2>
            {pdfPages > 0 && (
              <p className="mt-2 text-xs text-[#858980]">
                PDFページ数：{pdfPages}
              </p>
            )}
            <pre className="mt-4 max-h-[480px] overflow-auto whitespace-pre-wrap break-words rounded-xl bg-[#F7F7F5] p-4 text-sm leading-6">
              {previewText}
            </pre>
          </section>
        )}

        {drafts.length > 0 && (
          <section className="mt-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold">
                本の登録候補（{drafts.length}件）
              </h2>
              <button
                type="button"
                onClick={registerBooks}
                className="rounded-xl border border-[#D9DCD4] bg-white px-4 py-2.5 text-sm font-medium hover:bg-[#F0F2ED]"
              >
                選択した本を一括登録
              </button>
            </div>

            <p className="mt-2 text-xs leading-5 text-[#858980]">
              OCRはタイトル以外の文章も読み取ることがあります。不要な候補を削除し、タイトルを確認してから登録してください。
            </p>

            <div className="mt-3 space-y-3">
              {drafts.map((book, index) => (
                <article
                  key={book.id}
                  className="rounded-xl border border-[#E6E7E1] bg-white p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={book.selected}
                        onChange={() => toggleDraft(book.id)}
                      />
                      登録対象 {index + 1}
                    </label>
                    <button
                      type="button"
                      onClick={() => removeDraft(book.id)}
                      className="text-xs text-[#858980] hover:text-red-600"
                    >
                      削除
                    </button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className="text-xs text-[#777D75]">
                      タイトル
                      <input
                        value={book.title}
                        onChange={(event) =>
                          updateDraft(book.id, "title", event.target.value)
                        }
                        placeholder="タイトル"
                        className="mt-1 w-full rounded-lg border border-[#E1E3DC] px-3 py-2 text-sm text-[#30332F]"
                      />
                    </label>
                    <label className="text-xs text-[#777D75]">
                      著者
                      <input
                        value={book.author}
                        onChange={(event) =>
                          updateDraft(book.id, "author", event.target.value)
                        }
                        placeholder="著者"
                        className="mt-1 w-full rounded-lg border border-[#E1E3DC] px-3 py-2 text-sm text-[#30332F]"
                      />
                    </label>
                    <label className="text-xs text-[#777D75]">
                      ISBN
                      <input
                        value={book.isbn}
                        onChange={(event) =>
                          updateDraft(book.id, "isbn", event.target.value)
                        }
                        placeholder="ISBN"
                        className="mt-1 w-full rounded-lg border border-[#E1E3DC] px-3 py-2 text-sm text-[#30332F]"
                      />
                    </label>
                  </div>
                </article>
              ))}
            </div>

            <button
              type="button"
              onClick={registerBooks}
              className="mt-4 rounded-xl border border-[#D9DCD4] bg-white px-4 py-2.5 text-sm font-medium hover:bg-[#F0F2ED]"
            >
              選択した本を一括登録
            </button>
          </section>
        )}

        <footer className="mt-10 border-t border-[#E6E7E1] pt-5 text-sm text-[#697D6B]">
          <Link href="/library/books" className="hover:underline">
            本棚を見る
          </Link>
          <span className="mx-3 text-[#C5C9C0]">/</span>
          <Link href="/library/pdf" className="hover:underline">
            PDF Reader
          </Link>
          <span className="mx-3 text-[#C5C9C0]">/</span>
          <Link href="/library" className="hover:underline">
            Libraryトップ
          </Link>
        </footer>
      </div>
    </main>
  );
}
