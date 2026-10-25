
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  X,
  Menu,
  Sun,
  ChartNoAxesColumn,
  CalendarDays,
  Layers3,
  Route,
  ListChecks,
  Swords,
  Sailboat,
  Castle,
  PawPrint,
  Settings2,
  UserRound,
  ArrowUpRight,
  Map,
} from "lucide-react";

const sections = [
  {
    title: "YOUR STUDY",
    items: [
      { label: "今日のノルマ", href: "/today", icon: Sun },
      { label: "学習記録", href: "/records", icon: ChartNoAxesColumn },
      { label: "学習カレンダー", href: "/calendar", icon: CalendarDays },
      { label: "暗記デッキ管理", href: "/decks", icon: Layers3 },
      { label: "学習計画", href: "/study-plan", icon: Route },
      { label: "タスク管理", href: "/tasks", icon: ListChecks },
      { label: "世界地図", href: "/language-world", icon: Map },
    ],
  },
  {
    title: "GAMES & STORIES",
    items: [
      { label: "Language Quest", href: "/games", icon: Swords },
      { label: "無敵艦隊 · スペイン語", href: "/armada", icon: Sailboat },
      { label: "戦国策 · 中国語", href: "/sengoku", icon: Castle },
      { label: "Little Moments", href: "/little-moments", icon: PawPrint },
    ],
  },
  {
    title: "PREFERENCES",
    items: [{ label: "設定", href: "/settings", icon: Settings2 }],
  },
];

const squareButtonStyle = {
  width: "48px",
  height: "48px",
  minWidth: "48px",
  minHeight: "48px",
  padding: 0,
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
} as const;

export default function AnkiSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <>
      {/* 左上の共通メニューボタン */}
      <div className="fixed left-4 top-4 z-[60]">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="メニューを開く"
          aria-expanded={open}
          aria-controls="anki-sidebar"
          style={squareButtonStyle}
          className="rounded-2xl border border-stone-200/80
            bg-[#F7F6F2]/95 text-stone-700
            shadow-sm backdrop-blur
            transition-all duration-200
            hover:bg-white hover:shadow-md active:scale-95"
        >
          <Menu
            size={21}
            strokeWidth={1.7}
            className="block shrink-0"
          />
        </button>
      </div>

      {/* 背景 */}
      {open && (
        <button
          type="button"
          aria-label="メニューを閉じる"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[70] bg-stone-950/30
            backdrop-blur-[2px]"
        />
      )}

      {/* サイドメニュー */}
      <aside
        id="anki-sidebar"
        aria-label="メインメニュー"
        aria-hidden={!open}
        className={`fixed inset-y-0 left-0 z-[80]
          flex w-[min(340px,88vw)] flex-col
          border-r border-stone-200/80 bg-[#F7F6F2]
          text-stone-800 shadow-2xl
          transition-transform duration-300 ease-out
          ${
            open
              ? "translate-x-0"
              : "-translate-x-full pointer-events-none"
          }`}
      >
        {/* ヘッダー */}
        <div
          className="flex items-center justify-between border-b
            border-stone-200/80 px-5 py-5"
        >
          <Link
            href="/decks"
            onClick={() => setOpen(false)}
            className="flex min-w-0 items-center gap-3"
          >
            <span
              className="flex h-10 w-10 shrink-0 items-center
                justify-center rounded-xl bg-[#292D27] text-lg
                font-semibold text-white"
            >
              A
            </span>

            <span className="min-w-0">
              <span
                className="block text-lg font-semibold
                  tracking-tight text-stone-900"
              >
                Anki
              </span>
              <span
                className="block text-[9px] font-medium
                  tracking-[0.12em] text-stone-500"
              >
                LANGUAGE LEARNING WORKSPACE
              </span>
            </span>
          </Link>

          {/* 閉じるボタン */}
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="メニューを閉じる"
            style={squareButtonStyle}
            className="ml-2 rounded-2xl border
              border-stone-200/80 text-stone-500
              transition hover:bg-stone-200/70 hover:text-stone-900
              active:scale-95"
          >
            <X
              size={21}
              strokeWidth={1.7}
              className="block shrink-0"
            />
          </button>
        </div>

        {/* メニュー項目 */}
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-6">
          {sections.map((section) => (
            <section key={section.title}>
              <h2
                className="mb-2 px-3 text-[10px] font-semibold
                  tracking-[0.16em] text-stone-500"
              >
                {section.title}
              </h2>

              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;

                  const active =
                    pathname === item.href ||
                    (item.href !== "/" &&
                      pathname.startsWith(`${item.href}/`));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={`group flex min-h-11 items-center
                        gap-3 rounded-xl px-3 py-2.5
                        text-sm transition-colors
                        ${
                          active
                            ? "bg-[#E7E9DF] font-medium text-[#455840]"
                            : "text-stone-600 hover:bg-stone-200/60 hover:text-stone-900"
                        }`}
                    >
                      <Icon
                        size={19}
                        strokeWidth={1.65}
                        className={`shrink-0 ${
                          active
                            ? "text-[#52664D]"
                            : "text-stone-500 group-hover:text-stone-700"
                        }`}
                      />

                      <span className="min-w-0 flex-1">
                        {item.label}
                      </span>

                      {active && (
                        <span
                          className="h-1.5 w-1.5 shrink-0
                            rounded-full bg-[#71846A]"
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </nav>

        {/* 下部 */}
        <div className="border-t border-stone-200/80 p-4">
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-xl
              bg-[#292D27] p-3.5 text-white
              transition hover:bg-[#3A4037]"
          >
            <UserRound size={20} strokeWidth={1.7} />

            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">
                ログイン・新規登録
              </span>
              <span className="mt-0.5 block text-xs text-stone-300">
                学習データを管理する
              </span>
            </span>

            <ArrowUpRight size={18} />
          </Link>

          <p
            className="mt-4 text-center text-[10px]
              tracking-wide text-stone-400"
          >
            A quiet space to keep learning.
          </p>
        </div>
      </aside>
    </>
  );
}
