"use client";

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

  useEffect(() => {
    async function loadRecords() {
      try {
        const snapshot = await getDocs(collection(db, "studyRecords"));

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
        }
      `}</style>
    </main>
  );
}