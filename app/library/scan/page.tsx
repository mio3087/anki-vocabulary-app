
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "little-library-books-v1";

type BookDraft = {
  id: string;
  title: string;
  author: string;
  isbn: string;
  totalPages: string;
  selected: boolean;
  searching?: boolean;
  info?: string;
};

type SourceFile = {
  id: string;
  file: File;
  url: string;
  kind: "image" | "pdf";
};

type GoogleBook = {
  title?: string;
  authors?: string[];
  pageCount?: number;
  industryIdentifiers?: { type: string; identifier: string }[];
};

type SavedBook = {
  id: number;
  title: string;
  author: string;
  isbn: string;
  totalPages: string;
  category: string;
  status: string;
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
      setMessage("カメラを利用できません。localhostまたはHTTPSで開いてください。");
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
      setMessage("カメラを起動できません。ブラウザのカメラ使用を許可してください。");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (cameraRef.current) cameraRef.current.srcObject = null;
    setCameraOpen(false);
  }

  function addFiles(files: File[]) {
    const accepted = files.filter(
      (file) =>
        file.type.startsWith("image/") ||
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf")
    );

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

    if (accepted.length !== files.length) {
      setMessage("画像またはPDFファイルを選択してください。");
    } else {
      setMessage("");
    }

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

    if (!video?.videoWidth || !video.videoHeight) {
      setMessage("カメラ映像を準備しています。少し待ってください。");
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
        setMessage("撮影しました。「読み取り」を押してください。");
      },
      "image/jpeg",
      0.95
    );
  }

  function removeSource(id: string) {
    const target = sources.find((source) => source.id === id);

    if (target) {
      URL.revokeObjectURL(target.url);
      urlsRef.current = urlsRef.current.filter((url) => url !== target.url);
    }

    setSources((current) => current.filter((source) => source.id !== id));
    setDrafts([]);
    setPreviewText("");
    setMessage("");
  }

  // ISBN-10 / ISBN-13 の候補を文章から抽出
  function extractISBNs(text: string): string[] {
    const normalized = text
      .replace(/[‐‑‒–—―ー]/g, "-")
      .replace(/[０-９]/g, (char) =>
        String.fromCharCode(char.charCodeAt(0) - 0xFEE0)
      );

    const candidates = normalized.match(
      /(?:ISBN(?:-1[03])?\s*:?\s*)?(?:97[89][-\s]?)?(?:\d[-\s]?){9,12}[\dXx]/gi
    ) ?? [];

    const valid: string[] = [];

    for (const candidate of candidates) {
      const digits = candidate.replace(/^ISBN(?:-1[03])?\s*:?\s*/i, "")
        .replace(/[-\s]/g, "")
        .toUpperCase();

      if (digits.length === 13 && /^\d{13}$/.test(digits)) {
        const sum = digits
          .slice(0, 12)
          .split("")
          .reduce(
            (total, digit, index) =>
              total + Number(digit) * (index % 2 === 0 ? 1 : 3),
            0
          );

        const check = (10 - (sum % 10)) % 10;
        if (check === Number(digits[12])) valid.push(digits);
      } else if (digits.length === 10 && /^\d{9}[\dX]$/.test(digits)) {
        const sum = digits
          .split("")
          .reduce(
            (total, digit, index) =>
              total + (digit === "X" ? 10 : Number(digit)) * (10 - index),
            0
          );

        if (sum % 11 === 0) valid.push(digits);
      }
    }

    return Array.from(new Set(valid));
  }

  // Google Books API から書誌情報を検索
  async function lookupBook(id: string, isbnOverride?: string) {
    const draft = drafts.find((item) => item.id === id);
    const isbn = (isbnOverride ?? draft?.isbn ?? "").replace(/[-\s]/g, "");

    if (!isbn) {
      setDrafts((current) =>
        current.map((item) =>
          item.id === id
            ? { ...item, info: "先にISBNを入力してください。" }
            : item
        )
      );
      return;
    }

    setDrafts((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, isbn, searching: true, info: "書籍情報を検索中…" }
          : item
      )
    );

    try {
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=isbn:${encodeURIComponent(isbn)}&maxResults=10`
      );

      if (!response.ok) throw new Error("書籍情報サービスに接続できませんでした。");

      const data = await response.json();
      const items: { volumeInfo?: GoogleBook }[] = data.items ?? [];

      const normalizedISBN = (value: string) =>
        value.replace(/[-\s]/g, "").toUpperCase();

      const exact = items.find((item) =>
        item.volumeInfo?.industryIdentifiers?.some(
          (identifier) => normalizedISBN(identifier.identifier) === normalizedISBN(isbn)
        )
      );

      const volume = (exact ?? items[0])?.volumeInfo;

      if (!volume) {
        setDrafts((current) =>
          current.map((item) =>
            item.id === id
              ? {
                  ...item,
                  searching: false,
                  info: "書籍情報が見つかりませんでした。タイトルや著者を手入力できます。",
                }
              : item
          )
        );
        return;
      }

      const resultISBN =
        volume.industryIdentifiers?.find((item) => item.type === "ISBN_13")
          ?.identifier ??
        volume.industryIdentifiers?.find((item) => item.type === "ISBN_10")
          ?.identifier ??
        isbn;

      setDrafts((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                title: volume.title || item.title,
                author: volume.authors?.join(", ") || item.author,
                isbn: resultISBN,
                totalPages:
                  volume.pageCount && volume.pageCount > 0
                    ? String(volume.pageCount)
                    : item.totalPages,
                searching: false,
                info: volume.pageCount
                  ? "書籍情報を取得しました。内容を確認してください。"
                  : "書名・著者を取得しました。総ページ数は登録されていないため、必要なら手入力してください。",
              }
            : item
        )
      );
    } catch (error) {
      console.error(error);
      setDrafts((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                searching: false,
                info: "検索に失敗しました。インターネット接続を確認するか、情報を手入力してください。",
              }
            : item
        )
      );
    }
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
      let pageCount = 0;

      for (let i = 0; i < sources.length; i++) {
        const source = sources[i];

        setMessage(`読み取り中：${i + 1}/${sources.length} ファイル`);

        if (source.kind === "pdf") {
          const buffer = await source.file.arrayBuffer();
          const pdf = await pdfjs.getDocument({
            data: new Uint8Array(buffer),
          }).promise;

          pageCount += pdf.numPages;

          for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
            setMessage(
              `PDF読み取り中：${i + 1}/${sources.length} ファイル、${pageNumber}/${pdf.numPages} ページ`
            );

            const page = await pdf.getPage(pageNumber);
            const content = await page.getTextContent();
            let pageText = content.items
              .map((item) => ("str" in item ? item.str : ""))
              .join(" ");

            // 文字データのないスキャンPDFはOCRで読み取る
            if (!pageText.trim()) {
              if (!Tesseract) Tesseract = await import("tesseract.js");

              const viewport = page.getViewport({ scale: 2 });
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

              const result = await Tesseract.recognize(canvas, "jpn+eng");
              pageText = result.data.text;
              canvas.width = 0;
              canvas.height = 0;
            }

            extractedTexts.push(
              `【${source.file.name}・${pageNumber}ページ】\n${pageText}`
            );
          }
        } else {
          if (!Tesseract) Tesseract = await import("tesseract.js");

          const result = await Tesseract.recognize(source.file, "jpn+eng");
          extractedTexts.push(`【${source.file.name}】\n${result.data.text}`);
        }
      }

      setPdfPages(pageCount);

      const allText = extractedTexts.join("\n\n---\n\n").trim();
      setPreviewText(allText);

      if (!allText) {
        setMessage("文字を読み取れませんでした。写真を明るくして撮り直してください。");
        return;
      }

      const isbns = extractISBNs(allText);

      // ISBNが見つかった場合はISBNごとに候補を作成。
      // ISBNがない場合も、タイトルなどを手入力できる候補を用意。
      const nextDrafts: BookDraft[] = isbns.length
        ? isbns.map((isbn, index) => ({
            id: `${Date.now()}-${index}-${Math.random()}`,
            title: "",
            author: "",
            isbn,
            totalPages: "",
            selected: true,
            info: "ISBNを検出しました。書籍情報を検索してください。",
          }))
        : [
            {
              id: `${Date.now()}-${Math.random()}`,
              title: "",
              author: "",
              isbn: "",
              totalPages: "",
              selected: true,
              info: "ISBNが検出されませんでした。表紙・裏表紙を撮影するか、項目を手入力してください。",
            },
          ];

      setDrafts(nextDrafts);
      setMessage(
        isbns.length
          ? `読み取り完了。ISBNを${isbns.length}件検出しました。書籍情報を検索できます。`
          : "読み取り完了。ただしISBNは検出できませんでした。候補を手入力してください。"
      );

      // React state更新を待たず、作成した候補のISBNを検索する
      if (isbns.length) {
        for (const draft of nextDrafts) {
          await lookupBook(draft.id, draft.isbn);
        }
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
    field: "title" | "author" | "isbn" | "totalPages",
    value: string
  ) {
    setDrafts((current) =>
      current.map((book) =>
        book.id === id ? { ...book, [field]: value, info: "" } : book
      )
    );
  }

  function toggleDraft(id: string) {
    setDrafts((current) =>
      current.map((book) =>
        book.id === id ? { ...book, selected: !book.selected } : book
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
      setMessage("登録する本を選択し、タイトルを入力してください。");
      return;
    }

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const parsed: unknown = saved ? JSON.parse(saved) : [];

      if (!Array.isArray(parsed)) {
        throw new Error("本棚の保存データが正しくありません。");
      }

      const existing = parsed as SavedBook[];
      const existingISBNs = new Set(
        existing
          .map((book) => (book.isbn || "").replace(/[-\s]/g, "").toUpperCase())
          .filter(Boolean)
      );

      const addedISBNs = new Set<string>();
      const addedTitles = new Set<string>();

      const newBooks: SavedBook[] = selected
        .filter((book) => {
          const isbn = book.isbn.replace(/[-\s]/g, "").toUpperCase();
          const title = book.title.trim().toLowerCase();

          if (isbn && (existingISBNs.has(isbn) || addedISBNs.has(isbn))) {
            return false;
          }

          if (!isbn && addedTitles.has(title)) return false;

          if (isbn) addedISBNs.add(isbn);
          else addedTitles.add(title);

          return true;
        })
        .map((book, index) => ({
          id: Date.now() + index,
          title: book.title.trim(),
          author: book.author.trim(),
          isbn: book.isbn.trim(),
          totalPages: book.totalPages.trim(),
          category: "その他",
          status: "未読",
        }));

      if (!newBooks.length) {
        setMessage("選択した本はすでに本棚に登録されているようです。ISBNを確認してください。");
        return;
      }

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([...existing, ...newBooks])
      );

      setDrafts((current) =>
        current.filter(
          (draft) =>
            !newBooks.some(
              (book) =>
                book.title === draft.title.trim() &&
                book.isbn === draft.isbn.trim()
            )
        )
      );

      setMessage(`${newBooks.length}冊を本棚に登録しました。`);
    } catch (error) {
      console.error(error);
      setMessage("登録できませんでした。本棚の保存データを確認してください。");
    }
  }

  const navClass =
    "rounded-xl border border-[#D9DCD4] bg-white px-4 py-2.5 text-sm transition hover:bg-[#F0F2ED]";

  return (
    <main className="min-h-screen bg-[#F7F7F5] px-5 py-8 text-[#30332F] sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/library" className="text-sm text-[#697D6B] hover:underline">
          ← Libraryトップ
        </Link>

        <nav className="mt-5 flex flex-wrap gap-2">
          <Link href="/library" className={navClass}>Libraryトップ</Link>
          <Link href="/library/books" className={navClass}>本棚</Link>
          <Link
            href="/library/scan"
            className="rounded-xl bg-[#718675] px-4 py-2.5 text-sm text-white"
          >
            本・教材を読み取る
          </Link>
          <Link href="/library/pdf" className={navClass}>PDF Reader</Link>
        </nav>

        <h1 className="mt-7 text-2xl font-semibold tracking-tight">
          本・教材を読み取る
        </h1>
        <p className="mt-2 text-sm text-[#777D75]">
          表紙や裏表紙を撮影し、ISBNから書名・著者・総ページ数を検索します。
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
            onChange={(event) => addFiles(Array.from(event.target.files ?? []))}
          />
          <input
            ref={pdfRef}
            type="file"
            accept="application/pdf,.pdf"
            multiple
            className="hidden"
            onChange={(event) => addFiles(Array.from(event.target.files ?? []))}
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
                    <p className="truncate text-sm font-medium">{source.file.name}</p>
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
            disabled={!sources.length || scanning}
            className="mt-5 rounded-xl bg-[#718675] px-4 py-3 text-sm font-medium text-white hover:bg-[#5F7563] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {scanning ? "読み取り・書籍検索中…" : "読み取り・書籍情報を検索"}
          </button>

          {message && (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#697D6B]">
              {message}
            </p>
          )}
        </section>

        {previewText && (
          <section className="mt-7 rounded-2xl border border-[#E6E7E1] bg-white p-5">
            <h2 className="text-base font-semibold">読み取り文章</h2>
            {pdfPages > 0 && (
              <p className="mt-2 text-xs text-[#858980]">
                PDFページ数：{pdfPages}
              </p>
            )}
            <pre className="mt-4 max-h-[360px] overflow-auto whitespace-pre-wrap break-words rounded-xl bg-[#F7F7F5] p-4 text-sm leading-6">
              {previewText}
            </pre>
          </section>
        )}

        {drafts.length > 0 && (
          <section className="mt-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold">
                書籍情報（{drafts.length}件）
              </h2>
              <button
                type="button"
                onClick={registerBooks}
                className="rounded-xl bg-[#718675] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#5F7563]"
              >
                選択した本を本棚に登録
              </button>
            </div>

            <p className="mt-2 text-xs leading-5 text-[#858980]">
              自動取得した情報を確認してください。取得できない項目は手入力できます。総ページ数には本の最後のページ番号を入力してください。
            </p>

            <div className="mt-4 space-y-4">
              {drafts.map((book, index) => (
                <article
                  key={book.id}
                  className="rounded-2xl border border-[#E6E7E1] bg-white p-5"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <label className="flex items-center gap-2 text-sm font-medium">
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
                      候補を削除
                    </button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="text-xs text-[#777D75]">
                      タイトル
                      <input
                        value={book.title}
                        onChange={(event) =>
                          updateDraft(book.id, "title", event.target.value)
                        }
                        placeholder="本のタイトル"
                        className="mt-1 w-full rounded-xl border border-[#D9DCD4] px-3 py-2.5 text-sm text-[#30332F]"
                      />
                    </label>

                    <label className="text-xs text-[#777D75]">
                      著者
                      <input
                        value={book.author}
                        onChange={(event) =>
                          updateDraft(book.id, "author", event.target.value)
                        }
                        placeholder="著者名"
                        className="mt-1 w-full rounded-xl border border-[#D9DCD4] px-3 py-2.5 text-sm text-[#30332F]"
                      />
                    </label>

                    <label className="text-xs text-[#777D75]">
                      ISBN
                      <input
                        value={book.isbn}
                        onChange={(event) =>
                          updateDraft(book.id, "isbn", event.target.value)
                        }
                        placeholder="ISBN-13 または ISBN-10"
                        className="mt-1 w-full rounded-xl border border-[#D9DCD4] px-3 py-2.5 text-sm text-[#30332F]"
                      />
                    </label>

                    <label className="text-xs text-[#777D75]">
                      総ページ数
                      <input
                        type="number"
                        min="1"
                        value={book.totalPages}
                        onChange={(event) =>
                          updateDraft(book.id, "totalPages", event.target.value)
                        }
                        placeholder="例：320"
                        className="mt-1 w-full rounded-xl border border-[#D9DCD4] px-3 py-2.5 text-sm text-[#30332F]"
                      />
                    </label>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => lookupBook(book.id)}
                      disabled={book.searching || !book.isbn.trim()}
                      className="rounded-xl border border-[#D9DCD4] px-4 py-2.5 text-sm hover:bg-[#F0F2ED] disabled:opacity-50"
                    >
                      {book.searching ? "検索中…" : "ISBNから情報を再検索"}
                    </button>
                    {book.info && (
                      <p className="text-xs leading-5 text-[#697D6B]">
                        {book.info}
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>

            <button
              type="button"
              onClick={registerBooks}
              className="mt-5 rounded-xl bg-[#718675] px-4 py-3 text-sm font-medium text-white hover:bg-[#5F7563]"
            >
              選択した本を本棚に登録
            </button>
          </section>
        )}

        <footer className="mt-10 border-t border-[#E6E7E1] pt-5 text-sm text-[#697D6B]">
          <Link href="/library/books" className="hover:underline">本棚を見る</Link>
          <span className="mx-3 text-[#C5C9C0]">/</span>
          <Link href="/library/pdf" className="hover:underline">PDF Reader</Link>
          <span className="mx-3 text-[#C5C9C0]">/</span>
          <Link href="/library" className="hover:underline">Libraryトップ</Link>
        </footer>
      </div>
    </main>
  );
}
