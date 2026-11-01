
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/app/component/LanguageContext";

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
  Library,
  BookOpen,
  Brain,
} from "lucide-react";

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
  boxSizing: "border-box" as const,
};

export default function AnkiSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { language } = useLanguage();

  const sections = [
    {
      title: t("nav.study"),
      items: [
        { label: t("nav.today"), href: "/today", icon: Sun },
        {
          label: t("nav.studyData"),
          href: "/study-data",
          icon: ChartNoAxesColumn,
        },
        {
          label: t("nav.realityCheck"),
          href: "/understanding-analytics",
          icon: Brain,
        },
        {
          label: t("nav.calendar"),
          href: "/calendar",
          icon: CalendarDays,
        },
        { label: t("nav.decks"), href: "/", icon: Layers3 },
        {
          label: t("nav.materials"),
          href: "/materials",
          icon: BookOpen,
        },
        { label: t("nav.plan"), href: "/plan", icon: Route },
        { label: t("nav.tasks"), href: "/tasks", icon: ListChecks },
        { label: t("nav.world"), href: "/language-world", icon: Map },
        {
          label: t("nav.library"),
          href: "/library",
          icon: Library,
        },
      ],
    },
    {
      title: t("nav.games"),
      items: [
        { label: t("nav.quest"), href: "/game", icon: Swords },
        {
          label: t("nav.armada"),
          href: "/armada",
          icon: Sailboat,
        },
        {
          label: t("nav.story"),
          href: "/story1",
          icon: Castle,
        },
        {
          label: t("nav.moments"),
          href: "/little-moments",
          icon: PawPrint,
        },
      ],
    },
    {
      title: t("nav.preferences"),
      items: [
        {
          label: t("nav.settings"),
          href: "/settings",
          icon: Settings2,
        },
      ],
    },
  ];

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const applyTheme = () => {
      const savedColor = localStorage.getItem("anki-theme-color");

      const color =
        savedColor && /^#[0-9a-fA-F]{6}$/.test(savedColor)
          ? savedColor
          : "#718675";

      document.documentElement.style.setProperty(
        "--anki-theme-color",
        color
      );
    };

    applyTheme();

    window.addEventListener("storage", applyTheme);

    return () => {
      window.removeEventListener("storage", applyTheme);
    };
  }, []);

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
      <div className="fixed left-4 top-4 z-[60]">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t("nav.open")}
          aria-expanded={open}
          aria-controls="anki-sidebar"
          style={squareButtonStyle}
          className="rounded-2xl border border-stone-200/80
            bg-[#F7F6F2]/95 text-stone-700
            shadow-sm backdrop-blur
            transition-all duration-200
            hover:bg-white hover:shadow-md active:scale-95"
        >
          <Menu size={21} strokeWidth={1.7} />
        </button>
      </div>

      {open && (
        <button
          type="button"
          aria-label={t("nav.close")}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[70] bg-stone-950/30
            backdrop-blur-[2px]"
        />
      )}

      <aside
        id="anki-sidebar"
        aria-label={t("sidebar.mainMenu")}
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
        <div
          className="flex items-center justify-between border-b
            border-stone-200/80 px-5 py-5"
        >
          <Link
            href="/materials"
            onClick={() => setOpen(false)}
            className="flex min-w-0 items-center gap-3"
          >
            <span
              className="flex h-10 w-10 shrink-0 items-center
                justify-center rounded-xl text-lg
                font-semibold text-white"
              style={{ background: "var(--anki-theme-color)" }}
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

          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={t("nav.close")}
            style={squareButtonStyle}
            className="ml-2 rounded-2xl border
              border-stone-200/80 text-stone-500
              transition hover:bg-stone-200/70 hover:text-stone-900
              active:scale-95"
          >
            <X size={21} strokeWidth={1.7} />
          </button>
        </div>

        <nav
          className="flex-1 space-y-6 overflow-y-auto px-3 py-6"
          aria-label={t("sidebar.navigation")}
        >
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
                        text-sm transition-all duration-200
                        ${
                          active
                            ? "font-medium"
                            : "text-stone-600 hover:bg-stone-200/60 hover:text-stone-900"
                        }`}
                      style={
                        active
                          ? {
                              background:
                                "var(--anki-theme-light)",
                              color:
                                "var(--anki-theme-dark)",
                            }
                          : undefined
                      }
                    >
                      <Icon
                        size={19}
                        strokeWidth={1.65}
                        className="shrink-0 transition-colors"
                        style={{
                          color: active
                            ? "var(--anki-theme-color)"
                            : undefined,
                        }}
                      />

                      <span className="min-w-0 flex-1">
                        {item.label}
                      </span>

                      {active && (
                        <span
                          className="h-1.5 w-1.5 shrink-0
                            rounded-full"
                          style={{
                            background:
                              "var(--anki-theme-color)",
                          }}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </nav>

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
                {t("nav.login")}
              </span>
              <span className="mt-0.5 block text-xs text-stone-300">
                {t("nav.loginDescription")}
              </span>
            </span>

            <ArrowUpRight size={18} />
          </Link>

          <p
            className="mt-4 text-center text-[10px]
              tracking-wide text-stone-400"
          >
            {t("sidebar.tagline")}
          </p>
        </div>
      </aside>
    </>
  );
}
