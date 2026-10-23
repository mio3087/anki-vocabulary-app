
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
} from "firebase/firestore";

type StudyRecord = {
  id: string;
  date: string;
  time?: string;
  startedAt?: number;
  deckName: string;
  answered: number;
  correct: number;
  incorrect: number;
  duration: number;
};

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;

  if (minutes === 0) return `${remaining}秒`;
  if (remaining === 0) return `${minutes}分`;
  return `${minutes}分${remaining}秒`;
}

export default function StudyDataPage() {
  const [studyRecords, setStudyRecords] = useState<StudyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    async function loadRecords() {
      try {
        const snapshot = await getDocs(
          collection(db, "studyRecords")
        );

        const records: StudyRecord[] = snapshot.docs.map((item) => {
          const data = item.data();

          return {
            id: item.id,
            date: data.date || "",
            time: data.time || "",
            startedAt: Number(data.startedAt || 0),
            deckName: data.deckName || "",
            answered: Number(data.answered || 0),
            correct: Number(data.correct || 0),
            incorrect: Number(data.incorrect || 0),
            duration: Number(data.duration || 0),
          };
        });

        records.sort((a, b) => {
          if (a.startedAt && b.startedAt) {
            return b.startedAt - a.startedAt;
          }
          return b.date.localeCompare(a.date);
        });

        setStudyRecords(records);
      } catch (err) {
        console.error("学習記録の読み込みエラー:", err);
        setError("学習記録を読み込めませんでした。");
      } finally {
        setLoading(false);
      }
    }

    loadRecords();
  }, []);

  const deleteStudyRecord = async (recordId: string) => {
    if (!window.confirm("この学習記録を削除しますか？")) {
      return;
    }

    try {
      await deleteDoc(doc(db, "studyRecords", recordId));

      setStudyRecords((records) =>
        records.filter((record) => record.id !== recordId)
      );
    } catch (err) {
      console.error("学習記録の削除エラー:", err);
      window.alert("学習記録の削除に失敗しました。");
    }
  };

  const totalAnswered = studyRecords.reduce(
    (sum, record) => sum + record.answered,
    0
  );

  const totalCorrect = studyRecords.reduce(
    (sum, record) => sum + record.correct,
    0
  );

  const totalIncorrect = studyRecords.reduce(
    (sum, record) => sum + record.incorrect,
    0
  );

  const totalDuration = studyRecords.reduce(
    (sum, record) => sum + record.duration,
    0
  );

  const overallRate =
    totalAnswered > 0
      ? Math.round((totalCorrect / totalAnswered) * 100)
      : 0;

  return (
    <main className="study-data-page">
      <button
        type="button"
        className="study-data-menu-button"
        aria-label={menuOpen ? "メニューを閉じる" : "メニューを開く"}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span className={`menu-line menu-line-top${menuOpen ? " menu-line-open" : ""}`} />
        <span className={`menu-line menu-line-middle${menuOpen ? " menu-line-open" : ""}`} />
        <span className={`menu-line menu-line-bottom${menuOpen ? " menu-line-open" : ""}`} />
      </button>

      {menuOpen && (
        <>
          <button
            type="button"
            className="study-data-menu-backdrop"
            aria-label="メニューを閉じる"
            onClick={() => setMenuOpen(false)}
          />
          <nav className="study-data-menu" aria-label="メインメニュー">
            <div className="study-data-menu-brand">
              <span className="study-data-menu-mark">A</span>
              <div>
                <strong>Anki</strong>
                <p>LANGUAGE LEARNING WORKSPACE</p>
              </div>
            </div>

            <p className="study-data-menu-label">YOUR ANKI</p>
            <Link href="/" className="study-data-menu-link" onClick={() => setMenuOpen(false)}><span>⌂</span>ホーム</Link>
            <Link href="/today" className="study-data-menu-link" onClick={() => setMenuOpen(false)}><span>✳</span>今日のノルマ</Link>
            <Link href="/calendar" className="study-data-menu-link" onClick={() => setMenuOpen(false)}><span>▦</span>学習カレンダー</Link>
            <Link href="/tasks" className="study-data-menu-link" onClick={() => setMenuOpen(false)}><span>✓</span>タスク管理</Link>
            <Link href="/plan" className="study-data-menu-link" onClick={() => setMenuOpen(false)}><span>↗</span>学習計画</Link>
            <Link href="/study-data" className="study-data-menu-link study-data-menu-active" onClick={() => setMenuOpen(false)}><span>▤</span>学習記録</Link>

            <div className="study-data-menu-footer">YOUR PROGRESS, YOUR PACE.</div>
          </nav>
        </>
      )}

      <header className="study-data-header">
        <p className="study-data-eyebrow">YOUR PROGRESS</p>
        <h1>学習記録</h1>
        <p className="study-data-subtitle">
          積み重ねた学習を、振り返る。
        </p>
      </header>


      {loading ? (
        <p className="study-data-message">学習記録を読み込み中...</p>
      ) : error ? (
        <p className="study-data-message">{error}</p>
      ) : (
        <>
          <section className="study-data-summary">
            <div className="study-data-section-heading">
              <div>
                <p className="study-data-eyebrow">OVERVIEW</p>
                <h2>累計</h2>
              </div>
              <span className="study-data-session-count">
                {studyRecords.length} セッション
              </span>
            </div>

            <div className="study-data-stats">
              <div className="study-data-stat study-data-stat-wide">
                <span>回答数</span>
                <strong>{totalAnswered}</strong>
                <small>問</small>
              </div>

              <div className="study-data-stat">
                <span>正解</span>
                <strong>{totalCorrect}</strong>
                <small>問</small>
              </div>

              <div className="study-data-stat">
                <span>不正解</span>
                <strong>{totalIncorrect}</strong>
                <small>問</small>
              </div>

              <div className="study-data-stat">
                <span>正答率</span>
                <strong>{overallRate}</strong>
                <small>%</small>
              </div>

              <div className="study-data-stat">
                <span>学習時間</span>
                <strong>{formatDuration(totalDuration)}</strong>
              </div>
            </div>
          </section>

          <section className="study-data-history">
            <div className="study-data-section-heading">
              <div>
                <p className="study-data-eyebrow">HISTORY</p>
                <h2>学習履歴</h2>
              </div>
              <span className="study-data-session-count">
                {studyRecords.length} 件
              </span>
            </div>

            {studyRecords.length === 0 ? (
              <div className="study-data-empty">
                <h3>ここから始めよう。</h3>
                <p>
                  まだ学習記録がありません。
                  <br />
                  単語を学習すると、ここに記録されます。
                </p>
              </div>
            ) : (
              <div className="study-data-record-list">
                {studyRecords.map((record) => {
                  const rate =
                    record.answered > 0
                      ? Math.round(
                          (record.correct / record.answered) * 100
                        )
                      : 0;

                  return (
                    <article
                      key={record.id}
                      className="study-data-record"
                    >
                      <div className="study-data-record-top">
                        <div>
                          <p className="study-data-record-date">
                            {record.date}
                            {record.time ? ` · ${record.time}` : ""}
                          </p>
                          <h3>
                            {record.deckName || "デッキ名なし"}
                          </h3>
                        </div>

                        <button
                          type="button"
                          className="study-data-delete"
                          onClick={() => deleteStudyRecord(record.id)}
                        >
                          削除
                        </button>
                      </div>

                      <div className="study-data-record-stats">
                        <span>回答 {record.answered}問</span>
                        <span>正答率 {rate}%</span>
                        <span>正解 {record.correct}問</span>
                        <span>不正解 {record.incorrect}問</span>
                        <span>
                          時間 {formatDuration(record.duration)}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}

      <style jsx>{`
        .study-data-menu-button {
          position: fixed;
          top: 20px;
          left: 20px;
          z-index: 130;
          display: flex;
          width: 46px;
          height: 46px;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 5px;
          border: 1px solid #e1e7df;
          border-radius: 14px;
          background: #ffffff;
          color: #35473b;
          box-shadow: 0 4px 16px rgba(35, 48, 38, 0.08);
          cursor: pointer;
        }

        .study-data-menu-button:hover {
          background: #edf2ec;
          border-color: #cbd7cb;
        }

        .menu-line {
          display: block;
          width: 18px;
          height: 2px;
          border-radius: 2px;
          background: #35473b;
          transition: transform 180ms ease, opacity 180ms ease;
        }

        .menu-line-top.menu-line-open {
          transform: translateY(7px) rotate(45deg);
        }

        .menu-line-middle.menu-line-open {
          opacity: 0;
        }

        .menu-line-bottom.menu-line-open {
          transform: translateY(-7px) rotate(-45deg);
        }

        .study-data-menu-backdrop {
          position: fixed;
          inset: 0;
          z-index: 140;
          width: 100%;
          height: 100%;
          border: 0;
          background: rgba(27, 35, 29, 0.25);
          backdrop-filter: blur(3px);
          cursor: default;
        }

        .study-data-menu {
          position: fixed;
          top: 12px;
          bottom: 12px;
          left: 12px;
          z-index: 150;
          display: flex;
          width: min(300px, calc(100vw - 24px));
          flex-direction: column;
          padding: 28px 18px 18px;
          overflow-y: auto;
          border: 1px solid #e7ebe5;
          border-radius: 22px;
          background: #fbfcfa;
          box-shadow: 0 18px 60px rgba(25, 38, 28, 0.14);
          animation: study-data-menu-in 180ms ease-out;
        }

        .study-data-menu-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 8px 28px;
        }

        .study-data-menu-mark {
          display: grid;
          width: 40px;
          height: 40px;
          flex-shrink: 0;
          place-items: center;
          border: 1px solid #dce5db;
          border-radius: 13px;
          background: #edf2ec;
          color: #354b3c;
          font-size: 20px;
          font-weight: 600;
        }

        .study-data-menu-brand strong {
          color: #2c382f;
          font-size: 17px;
          font-weight: 650;
          letter-spacing: -0.04em;
        }

        .study-data-menu-brand p {
          margin: 4px 0 0;
          color: #929b92;
          font-size: 8px;
          letter-spacing: 0.1em;
        }

        .study-data-menu-label {
          margin: 0 10px 10px;
          color: #99a197;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.15em;
        }

        .study-data-menu-link {
          display: flex;
          min-height: 45px;
          align-items: center;
          gap: 13px;
          padding: 0 12px;
          border-radius: 11px;
          color: #59645b;
          font-size: 13px;
          text-decoration: none;
          transition: background 150ms ease, color 150ms ease;
        }

        .study-data-menu-link > span {
          display: inline-grid;
          width: 20px;
          flex-shrink: 0;
          place-items: center;
          color: #849184;
          font-size: 17px;
        }

        .study-data-menu-link:hover {
          background: #f0f3ee;
          color: #2d4534;
        }

        .study-data-menu-link.study-data-menu-active {
          background: #eaf0e8;
          color: #2d4935;
          font-weight: 600;
        }

        .study-data-menu-link.study-data-menu-active > span {
          color: #42694b;
        }

        .study-data-menu-footer {
          margin-top: auto;
          padding: 18px 10px 4px;
          border-top: 1px solid #e9ece7;
          color: #a0a79f;
          font-size: 9px;
          letter-spacing: 0.12em;
        }

        @keyframes study-data-menu-in {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @media (max-width: 480px) {
          .study-data-menu-button {
            top: 14px;
            left: 14px;
          }

          .study-data-header {
            padding-top: 38px;
          }
        }

        .study-data-page {
          min-height: 100vh;
          padding: 48px 24px 80px;
          background: #f7f8f6;
          color: #292f2b;
        }

        .study-data-header,
        .study-data-summary,
        .study-data-history {
          width: 100%;
          max-width: 820px;
          margin-right: auto;
          margin-left: auto;
        }

        .study-data-header {
          margin-bottom: 36px;
        }

        .study-data-eyebrow {
          margin: 0 0 8px;
          color: #829084;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.16em;
        }

        .study-data-header h1 {
          margin: 0;
          font-size: clamp(30px, 5vw, 42px);
          font-weight: 600;
          letter-spacing: -0.045em;
        }

        .study-data-subtitle {
          margin-top: 12px;
          color: #818981;
          font-size: 14px;
        }

        .study-data-summary,
        .study-data-history {
          margin-bottom: 36px;
        }

        .study-data-section-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 18px;
        }

        .study-data-section-heading h2 {
          margin: 0;
          font-size: 21px;
          font-weight: 600;
          letter-spacing: -0.03em;
        }

        .study-data-session-count {
          color: #8b938c;
          font-size: 12px;
          white-space: nowrap;
        }

        .study-data-stats {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 1px;
          overflow: hidden;
          border: 1px solid #e6e9e4;
          border-radius: 18px;
          background: #e6e9e4;
        }

        .study-data-stat {
          display: flex;
          min-height: 112px;
          flex-wrap: wrap;
          align-content: center;
          align-items: baseline;
          gap: 5px 8px;
          padding: 20px;
          background: #fff;
        }

        .study-data-stat-wide {
          grid-column: 1 / -1;
          min-height: 132px;
          background: #edf2ec;
        }

        .study-data-stat span {
          width: 100%;
          color: #7b857c;
          font-size: 12px;
        }

        .study-data-stat strong {
          font-size: 29px;
          font-weight: 600;
          letter-spacing: -0.04em;
        }

        .study-data-stat small {
          color: #879087;
          font-size: 12px;
        }

        .study-data-empty {
          padding: 42px 24px;
          border: 1px dashed #d8ded7;
          border-radius: 18px;
          text-align: center;
          background: #fff;
        }

        .study-data-empty h3 {
          margin: 0 0 8px;
          font-size: 16px;
          font-weight: 600;
        }

        .study-data-empty p,
        .study-data-message {
          color: #818981;
          font-size: 13px;
          line-height: 1.9;
        }

        .study-data-record-list {
          display: grid;
          gap: 12px;
        }

        .study-data-record {
          padding: 22px;
          border: 1px solid #e6e9e4;
          border-radius: 16px;
          background: #fff;
          transition: border-color 160ms ease;
        }

        .study-data-record:hover {
          border-color: #c8d4c9;
        }

        .study-data-record-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 18px;
        }

        .study-data-record-date {
          margin: 0 0 8px;
          color: #8b938c;
          font-size: 11px;
        }

        .study-data-record h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }

        .study-data-delete {
          padding: 5px 0 5px 10px;
          border: 0;
          background: transparent;
          color: #a07878;
          font-size: 12px;
          cursor: pointer;
        }

        .study-data-delete:hover {
          color: #b44848;
        }

        .study-data-record-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 10px 18px;
          color: #69736b;
          font-size: 12px;
        }

        @media (min-width: 600px) {
          .study-data-stats {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }

          .study-data-stat-wide {
            grid-column: span 2;
          }
        }

        @media (max-width: 480px) {
          .study-data-page {
            padding: 30px 16px 56px;
          }

          .study-data-stat {
            padding: 16px;
          }

          .study-data-record {
            padding: 17px;
          }
        }
      `}</style>
    </main>
  );
}
