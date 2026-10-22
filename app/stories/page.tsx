"use client";

import { useState } from "react";
import Link from "next/link";
import { stories } from "@/lib/stories";

const navigationLinks = [
  { href: "/", icon: "⌂", label: "ホーム" },
  { href: "/today", icon: "✓", label: "今日のノルマ" },
  { href: "/plan", icon: "▦", label: "学習計画" },
  { href: "/tasks", icon: "☷", label: "タスク管理" },
  { href: "/materials", icon: "▤", label: "教材管理" },
  { href: "/calendar", icon: "▦", label: "カレンダー" },
  { href: "/armada", icon: "⚓", label: "無敵艦隊" },
  { href: "/stories", icon: "📖", label: "Language Quest" },
];

export default function StoriesPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="stories-page">
      <button
        type="button"
        className="stories-menu-trigger"
        aria-label={menuOpen ? "メニューを閉じる" : "メニューを開く"}
        aria-expanded={menuOpen}
        aria-controls="stories-navigation-menu"
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span />
        <span />
        <span />
      </button>

      {menuOpen && (
        <>
          <button
            type="button"
            className="stories-menu-backdrop"
            aria-label="メニューを閉じる"
            onClick={() => setMenuOpen(false)}
          />

          <nav
            id="stories-navigation-menu"
            className="stories-menu-panel"
            aria-label="サイトナビゲーション"
          >
            <div className="stories-menu-heading">MENU</div>

            {navigationLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="stories-menu-link"
                onClick={() => setMenuOpen(false)}
              >
                <span className="stories-menu-icon">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        </>
      )}

      <div className="stories-content">
        <h1 className="stories-title">Language Quest</h1>

        <p className="stories-description">
          50の物語から選ぼう。言葉を学び、歴史の謎を解こう。
        </p>

        <div className="stories-grid">
          {stories.map((story) => (
            <Link
              key={story.id}
              href={`/stories/${story.id}`}
              className="stories-card"
            >
              <div className="stories-era">
                STORY {String(story.id).padStart(2, "0")}
                {" · "}
                {story.era}
              </div>

              <h2 className="stories-card-title">{story.title}</h2>

              <p className="stories-card-description">
                {story.description}
              </p>

              <div className="stories-card-action">
                物語を始める →
              </div>
            </Link>
          ))}
        </div>
      </div>

      <style jsx>{`
        .stories-page {
          min-height: 100vh;
          padding: 90px 24px 48px;
          background:
            radial-gradient(
              circle at 85% 0%,
              rgba(69, 104, 145, 0.2),
              transparent 35%
            ),
            #101827;
          color: #f8fafc;
          box-sizing: border-box;
        }

        .stories-content {
          max-width: 1000px;
          margin: 0 auto;
        }

        .stories-title {
          margin: 12px 0 10px;
          font-size: clamp(30px, 5vw, 42px);
          font-weight: 750;
          letter-spacing: -1.2px;
        }

        .stories-description {
          margin: 0;
          color: #bdc9d8;
          font-size: 15px;
          line-height: 1.8;
        }

        .stories-grid {
          display: grid;
          grid-template-columns: repeat(
            auto-fit,
            minmax(min(100%, 230px), 1fr)
          );
          gap: 16px;
          margin-top: 30px;
        }

        .stories-card {
          display: block;
          min-width: 0;
          padding: 22px;
          border: 1px solid rgba(148, 163, 184, 0.22);
          border-radius: 18px;
          background: rgba(30, 41, 59, 0.78);
          color: #f8fafc;
          text-decoration: none;
          box-sizing: border-box;
          transition:
            transform 0.18s ease,
            border-color 0.18s ease,
            background 0.18s ease;
        }

        .stories-card:hover {
          transform: translateY(-3px);
          border-color: rgba(147, 197, 253, 0.65);
          background: rgba(39, 54, 76, 0.95);
        }

        .stories-era {
          color: #93c5fd;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.8px;
        }

        .stories-card-title {
          margin: 14px 0 12px;
          color: #f8fafc;
          font-size: 20px;
          line-height: 1.5;
          overflow-wrap: anywhere;
        }

        .stories-card-description {
          color: #cbd5e1;
          font-size: 14px;
          line-height: 1.8;
          overflow-wrap: anywhere;
        }

        .stories-card-action {
          margin-top: 20px;
          color: #86efac;
          font-size: 14px;
          font-weight: 650;
        }

        .stories-menu-trigger {
          position: fixed;
          top: 18px;
          left: 18px;
          z-index: 1002;
          display: flex;
          width: 46px;
          height: 46px;
          padding: 0;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 5px;
          border: 1px solid rgba(220, 225, 217, 0.95);
          border-radius: 15px;
          background: rgba(255, 255, 255, 0.94);
          color: #26372d;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.16);
          cursor: pointer;
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }

        .stories-menu-trigger span {
          display: block;
          width: 17px;
          height: 2px;
          border-radius: 2px;
          background: currentColor;
        }

        .stories-menu-backdrop {
          position: fixed;
          inset: 0;
          z-index: 1000;
          border: 0;
          background: rgba(3, 8, 18, 0.48);
          backdrop-filter: blur(2px);
        }

        .stories-menu-panel {
          position: fixed;
          top: 74px;
          left: 18px;
          z-index: 1001;
          width: min(290px, calc(100vw - 36px));
          padding: 16px 12px;
          border: 1px solid rgba(148, 163, 184, 0.25);
          border-radius: 18px;
          background: #fdfdfb;
          color: #26372d;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.28);
          box-sizing: border-box;
        }

        .stories-menu-heading {
          padding: 5px 12px 12px;
          color: #7b857b;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.8px;
        }

        .stories-menu-link {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 11px 12px;
          margin: 3px 0;
          border: 1px solid transparent;
          border-radius: 12px;
          background: transparent;
          color: #30382f;
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
          box-sizing: border-box;
          transition:
            background 0.15s ease,
            border-color 0.15s ease;
        }

        .stories-menu-link:hover {
          background: #f0f3ed;
          border-color: #e5eae1;
        }

        .stories-menu-icon {
          display: grid;
          place-items: center;
          width: 30px;
          height: 30px;
          flex: 0 0 30px;
          border-radius: 9px;
          background: #eef2eb;
          color: #4d6651;
          font-size: 15px;
        }

        @media (max-width: 640px) {
          .stories-page {
            padding: 78px 16px 32px;
          }

          .stories-menu-trigger {
            top: 12px;
            left: 12px;
            width: 42px;
            height: 42px;
          }

          .stories-menu-panel {
            top: 64px;
            left: 12px;
            width: min(290px, calc(100vw - 24px));
          }

          .stories-card {
            padding: 19px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .stories-card,
          .stories-menu-link {
            transition: none;
          }
        }
      `}</style>
    </main>
  );
}