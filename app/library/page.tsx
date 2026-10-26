
"use client";

import Link from "next/link";

const pages = [
  {
    title: "本棚",
    description: "登録した本を一覧で見る・管理する",
    href: "/library/books",
    icon: "▤",
  },
  {
    title: "本をスキャン",
    description: "本の写真やPDFから書誌情報を読み取る",
    href: "/library/scan",
    icon: "⌕",
  },
  {
    title: "PDFリーダー",
    description: "PDFの教材や本を開いて読む",
    href: "/library/pdf",
    icon: "▧",
  },
  {
    title: "読書記録",
    description: "読んだページや時間、気づきを記録する",
    href: "/library/books",
    icon: "✎",
  },
];

export default function LibraryPage() {
  return (
    <main className="min-h-screen bg-[#F7F7F5] px-5 py-8 text-[#30332F] sm:px-10">
      <div className="mx-auto max-w-5xl">

        <header className="mt-10">
          <p className="text-xs tracking-[0.25em] text-[#858980]">
            YOUR PERSONAL LIBRARY
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Little Library
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-[#777D75]">
            本を登録し、読み、記録する。
            小さな読書の積み重ねを、自分だけの知識に変えていこう。
          </p>
        </header>

        <section className="mt-10 grid gap-4 sm:grid-cols-2">
          {pages.map((page) => (
            <Link
              key={page.href + page.title}
              href={page.href}
              className="group rounded-2xl border border-[#E6E7E1] bg-white p-6 transition hover:-translate-y-0.5 hover:border-[#B8C5B8] hover:shadow-sm"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F0F2ED] text-xl text-[#718675]">
                {page.icon}
              </div>

              <h2 className="mt-5 text-lg font-medium group-hover:text-[#718675]">
                {page.title}
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#858980]">
                {page.description}
              </p>

              <p className="mt-5 text-sm text-[#718675]">
                開く →
              </p>
            </Link>
          ))}
        </section>

        <footer className="mt-12 border-t border-[#E6E7E1] pt-5 text-xs text-[#858980]">
          LITTLE LIBRARY · Read, learn, and remember.
        </footer>
      </div>
    </main>
  );
}
