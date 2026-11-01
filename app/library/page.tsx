"use client";

import Link from "next/link";
import { useAppLanguage } from "@/app/component/AppLanguage";

type Language = "ja" | "de" | "en" | "zh-CN" | "zh-TW" | "es";

const translations = {
  ja: {
    eyebrow: "YOUR PERSONAL LIBRARY",
    title: "Little Library",
    description:
      "本を登録し、読み、記録する。\n小さな読書の積み重ねを、自分だけの知識に変えていこう。",
    pages: [
      {
        title: "本棚",
        description: "登録した本を一覧で見る・管理する",
        action: "開く",
      },
      {
        title: "本をスキャン",
        description: "本の写真やPDFから書誌情報を読み取る",
        action: "開く",
      },
      {
        title: "PDFリーダー",
        description: "PDFの教材や本を開いて読む",
        action: "開く",
      },
      {
        title: "読書記録",
        description: "読んだページや時間、気づきを記録する",
        action: "開く",
      },
    ],
    footer: "LITTLE LIBRARY · Read, learn, and remember.",
  },

  de: {
    eyebrow: "YOUR PERSONAL LIBRARY",
    title: "Little Library",
    description:
      "Füge Bücher hinzu, lies sie und halte deine Fortschritte fest.\nVerwandle kleine Leseschritte in dein eigenes Wissen.",
    pages: [
      {
        title: "Bücherregal",
        description: "Alle hinzugefügten Bücher ansehen und verwalten",
        action: "Öffnen",
      },
      {
        title: "Buch scannen",
        description: "Bibliografische Informationen aus Buchfotos oder PDFs erkennen",
        action: "Öffnen",
      },
      {
        title: "PDF-Reader",
        description: "PDF-Lehrmaterialien und Bücher öffnen und lesen",
        action: "Öffnen",
      },
      {
        title: "Leseprotokoll",
        description: "Gelesene Seiten, Lesezeit und Erkenntnisse festhalten",
        action: "Öffnen",
      },
    ],
    footer: "LITTLE LIBRARY · Read, learn, and remember.",
  },

  en: {
    eyebrow: "YOUR PERSONAL LIBRARY",
    title: "Little Library",
    description:
      "Add books, read, and keep track of your progress.\nTurn small reading moments into knowledge of your own.",
    pages: [
      {
        title: "Bookshelf",
        description: "Browse and manage your registered books",
        action: "Open",
      },
      {
        title: "Scan a Book",
        description: "Extract bibliographic information from book photos or PDFs",
        action: "Open",
      },
      {
        title: "PDF Reader",
        description: "Open and read PDF study materials and books",
        action: "Open",
      },
      {
        title: "Reading Log",
        description: "Record pages read, reading time, and insights",
        action: "Open",
      },
    ],
    footer: "LITTLE LIBRARY · Read, learn, and remember.",
  },

  "zh-CN": {
    eyebrow: "YOUR PERSONAL LIBRARY",
    title: "Little Library",
    description:
      "添加书籍、阅读，并记录自己的进度。\n把一点一滴的阅读积累，变成属于自己的知识。",
    pages: [
      {
        title: "书架",
        description: "查看和管理已添加的书籍",
        action: "打开",
      },
      {
        title: "扫描书籍",
        description: "从书籍照片或 PDF 中识别书目信息",
        action: "打开",
      },
      {
        title: "PDF 阅读器",
        description: "打开并阅读 PDF 学习资料和书籍",
        action: "打开",
      },
      {
        title: "阅读记录",
        description: "记录阅读页数、时间和心得",
        action: "打开",
      },
    ],
    footer: "LITTLE LIBRARY · Read, learn, and remember.",
  },

  "zh-TW": {
    eyebrow: "YOUR PERSONAL LIBRARY",
    title: "Little Library",
    description:
      "新增書籍、閱讀，並記錄自己的進度。\n把一點一滴的閱讀累積，轉化成屬於自己的知識。",
    pages: [
      {
        title: "書架",
        description: "查看及管理已新增的書籍",
        action: "開啟",
      },
      {
        title: "掃描書籍",
        description: "從書籍照片或 PDF 中辨識書目資訊",
        action: "開啟",
      },
      {
        title: "PDF 閱讀器",
        description: "開啟並閱讀 PDF 學習資料和書籍",
        action: "開啟",
      },
      {
        title: "閱讀紀錄",
        description: "記錄閱讀頁數、時間和心得",
        action: "開啟",
      },
    ],
    footer: "LITTLE LIBRARY · Read, learn, and remember.",
  },

  es: {
    eyebrow: "YOUR PERSONAL LIBRARY",
    title: "Little Library",
    description:
      "Añade libros, léelos y registra tus avances.\nConvierte cada pequeño momento de lectura en conocimiento propio.",
    pages: [
      {
        title: "Estantería",
        description: "Consultar y gestionar los libros registrados",
        action: "Abrir",
      },
      {
        title: "Escanear un libro",
        description: "Extraer información bibliográfica de fotos de libros o PDF",
        action: "Abrir",
      },
      {
        title: "Lector de PDF",
        description: "Abrir y leer materiales de estudio y libros en PDF",
        action: "Abrir",
      },
      {
        title: "Registro de lectura",
        description: "Registrar páginas leídas, tiempo de lectura e ideas",
        action: "Abrir",
      },
    ],
    footer: "LITTLE LIBRARY · Read, learn, and remember.",
  },
} as const;

const pages = [
  {
    href: "/library/books",
    icon: "▤",
  },
  {
    href: "/library/scan",
    icon: "⌕",
  },
  {
    href: "/library/pdf",
    icon: "▧",
  },
  {
    href: "/library/books",
    icon: "✎",
  },
];

export default function LibraryPage() {
  const { language } = useAppLanguage();

  const currentLanguage: Language =
    language in translations ? (language as Language) : "ja";

  const t = translations[currentLanguage];

  return (
    <main className="min-h-screen bg-[#F7F7F5] px-5 py-8 text-[#30332F] sm:px-10">
      <div className="mx-auto max-w-5xl">
        <header className="mt-10">
          <p className="text-xs tracking-[0.25em] text-[#858980]">
            {t.eyebrow}
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            {t.title}
          </h1>

          <p className="mt-3 max-w-xl whitespace-pre-line text-sm leading-7 text-[#777D75]">
            {t.description}
          </p>
        </header>

        <section className="mt-10 grid gap-4 sm:grid-cols-2">
          {pages.map((page, index) => {
            const translatedPage = t.pages[index];

            return (
              <Link
                key={`${page.href}-${index}`}
                href={page.href}
                className="group rounded-2xl border border-[#E6E7E1] bg-white p-6 transition hover:-translate-y-0.5 hover:border-[#B8C5B8] hover:shadow-sm"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F0F2ED] text-xl text-[#718675]">
                  {page.icon}
                </div>

                <h2 className="mt-5 text-lg font-medium group-hover:text-[#718675]">
                  {translatedPage.title}
                </h2>

                <p className="mt-2 text-sm leading-6 text-[#858980]">
                  {translatedPage.description}
                </p>

                <p className="mt-5 text-sm text-[#718675]">
                  {translatedPage.action} →
                </p>
              </Link>
            );
          })}
        </section>

        <footer className="mt-12 border-t border-[#E6E7E1] pt-5 text-xs text-[#858980]">
          {t.footer}
        </footer>
      </div>
    </main>
  );
}