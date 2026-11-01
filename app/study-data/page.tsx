
"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { useAppLanguage } from "@/app/component/AppLanguage";
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

type AppLanguage = "ja" | "de" | "en" | "zh-CN" | "zh-TW" | "es";

const translations: Record<AppLanguage, Record<string, string>> = {
  ja: {
    eyebrow: "YOUR PROGRESS",
    title: "学習記録",
    subtitle: "積み重ねた学習を、振り返る。",
    loading: "学習記録を読み込み中...",
    loadError: "学習記録を読み込めませんでした。",
    overview: "OVERVIEW",
    total: "累計",
    sessions: "セッション",
    answered: "回答数",
    questions: "問",
    correct: "正解",
    incorrect: "不正解",
    accuracy: "正答率",
    studyTime: "学習時間",
    history: "HISTORY",
    historyTitle: "学習履歴",
    records: "件",
    emptyTitle: "ここから始めよう。",
    emptyDescription: "まだ学習記録がありません。\n単語を学習すると、ここに記録されます。",
    noDeckName: "デッキ名なし",
    delete: "削除",
    deleteConfirm: "この学習記録を削除しますか？",
    deleteError: "学習記録の削除に失敗しました。",
    minutes: "分",
    seconds: "秒",
    time: "時間",
  },

  de: {
    eyebrow: "YOUR PROGRESS",
    title: "Lernverlauf",
    subtitle: "Blicke auf deine bisherigen Lernfortschritte zurück.",
    loading: "Lernaufzeichnungen werden geladen...",
    loadError: "Die Lernaufzeichnungen konnten nicht geladen werden.",
    overview: "OVERVIEW",
    total: "Gesamt",
    sessions: "Sitzungen",
    answered: "Beantwortet",
    questions: " Fragen",
    correct: "Richtig",
    incorrect: "Falsch",
    accuracy: "Trefferquote",
    studyTime: "Lernzeit",
    history: "HISTORY",
    historyTitle: "Lernhistorie",
    records: "Einträge",
    emptyTitle: "Hier beginnt deine Lernreise.",
    emptyDescription: "Noch keine Lernaufzeichnungen vorhanden.\nSobald du mit dem Lernen beginnst, erscheinen deine Einträge hier.",
    noDeckName: "Unbenanntes Deck",
    delete: "Löschen",
    deleteConfirm: "Möchtest du diesen Lerneintrag wirklich löschen?",
    deleteError: "Der Lerneintrag konnte nicht gelöscht werden.",
    minutes: "Min.",
    seconds: "Sek.",
    time: "Zeit",
  },

  en: {
    eyebrow: "YOUR PROGRESS",
    title: "Study Records",
    subtitle: "Look back on everything you've learned.",
    loading: "Loading study records...",
    loadError: "Failed to load study records.",
    overview: "OVERVIEW",
    total: "Total",
    sessions: "sessions",
    answered: "Answered",
    questions: " questions",
    correct: "Correct",
    incorrect: "Incorrect",
    accuracy: "Accuracy",
    studyTime: "Study Time",
    history: "HISTORY",
    historyTitle: "Study History",
    records: "records",
    emptyTitle: "Your journey starts here.",
    emptyDescription: "No study records yet.\nYour records will appear here once you start studying.",
    noDeckName: "Untitled Deck",
    delete: "Delete",
    deleteConfirm: "Are you sure you want to delete this study record?",
    deleteError: "Failed to delete the study record.",
    minutes: "min",
    seconds: "sec",
    time: "Time",
  },

  "zh-CN": {
    eyebrow: "YOUR PROGRESS",
    title: "学习记录",
    subtitle: "回顾每一次积累的学习成果。",
    loading: "正在加载学习记录...",
    loadError: "无法加载学习记录。",
    overview: "OVERVIEW",
    total: "累计",
    sessions: "次学习",
    answered: "答题数",
    questions: "题",
    correct: "正确",
    incorrect: "错误",
    accuracy: "正确率",
    studyTime: "学习时间",
    history: "HISTORY",
    historyTitle: "学习历史",
    records: "条记录",
    emptyTitle: "从这里开始吧。",
    emptyDescription: "目前还没有学习记录。\n开始学习单词后，记录就会显示在这里。",
    noDeckName: "未命名牌组",
    delete: "删除",
    deleteConfirm: "确定要删除这条学习记录吗？",
    deleteError: "删除学习记录失败。",
    minutes: "分钟",
    seconds: "秒",
    time: "用时",
  },

  "zh-TW": {
    eyebrow: "YOUR PROGRESS",
    title: "學習紀錄",
    subtitle: "回顧每一次累積的學習成果。",
    loading: "正在載入學習紀錄...",
    loadError: "無法載入學習紀錄。",
    overview: "OVERVIEW",
    total: "累計",
    sessions: "次學習",
    answered: "作答數",
    questions: "題",
    correct: "答對",
    incorrect: "答錯",
    accuracy: "答對率",
    studyTime: "學習時間",
    history: "HISTORY",
    historyTitle: "學習歷史",
    records: "筆紀錄",
    emptyTitle: "從這裡開始吧。",
    emptyDescription: "目前還沒有學習紀錄。\n開始學習單字後，紀錄就會顯示在這裡。",
    noDeckName: "未命名牌組",
    delete: "刪除",
    deleteConfirm: "確定要刪除這筆學習紀錄嗎？",
    deleteError: "刪除學習紀錄失敗。",
    minutes: "分鐘",
    seconds: "秒",
    time: "用時",
  },

  es: {
    eyebrow: "YOUR PROGRESS",
    title: "Registro de estudio",
    subtitle: "Repasa todo lo que has aprendido.",
    loading: "Cargando registros de estudio...",
    loadError: "No se pudieron cargar los registros de estudio.",
    overview: "OVERVIEW",
    total: "Total",
    sessions: "sesiones",
    answered: "Respondidas",
    questions: " preguntas",
    correct: "Correctas",
    incorrect: "Incorrectas",
    accuracy: "Porcentaje de aciertos",
    studyTime: "Tiempo de estudio",
    history: "HISTORY",
    historyTitle: "Historial de estudio",
    records: "registros",
    emptyTitle: "Tu camino comienza aquí.",
    emptyDescription: "Todavía no hay registros de estudio.\nTus registros aparecerán aquí cuando empieces a estudiar vocabulario.",
    noDeckName: "Mazo sin nombre",
    delete: "Eliminar",
    deleteConfirm: "¿Seguro que quieres eliminar este registro de estudio?",
    deleteError: "No se pudo eliminar el registro de estudio.",
    minutes: "min",
    seconds: "s",
    time: "Tiempo",
  },
};

const localeMap: Record<AppLanguage, string> = {
  ja: "ja-JP",
  de: "de-DE",
  en: "en-GB",
  "zh-CN": "zh-CN",
  "zh-TW": "zh-TW",
  es: "es-ES",
};

export default function StudyDataPage() {
  const { language } = useAppLanguage();

  const currentLanguage = (
    language in translations ? language : "ja"
  ) as AppLanguage;

  const text = translations[currentLanguage];
  const locale = localeMap[currentLanguage];

  const [studyRecords, setStudyRecords] = useState<StudyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function formatDuration(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;

    if (minutes === 0) {
      return `${remaining}${text.seconds}`;
    }

    if (remaining === 0) {
      return `${minutes}${text.minutes}`;
    }

    return `${minutes}${text.minutes} ${remaining}${text.seconds}`;
  }

  function formatNumber(value: number) {
    return value.toLocaleString(locale);
  }

  function formatDate(dateString: string) {
    if (!dateString) return "";

    const date = new Date(`${dateString}T12:00:00`);

    if (Number.isNaN(date.getTime())) {
      return dateString;
    }

    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  }

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
        console.error("Study record loading error:", err);
        setError("loadError");
      } finally {
        setLoading(false);
      }
    }

    loadRecords();
  }, []);

  const deleteStudyRecord = async (recordId: string) => {
    if (!window.confirm(text.deleteConfirm)) {
      return;
    }

    try {
      await deleteDoc(doc(db, "studyRecords", recordId));

      setStudyRecords((records) =>
        records.filter((record) => record.id !== recordId)
      );
    } catch (err) {
      console.error("Study record deletion error:", err);
      window.alert(text.deleteError);
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
        <p className="study-data-eyebrow">{text.eyebrow}</p>

        <h1>{text.title}</h1>

        <p className="study-data-subtitle">{text.subtitle}</p>
      </header>

      {loading ? (
        <p className="study-data-message">{text.loading}</p>
      ) : error ? (
        <p className="study-data-message">{text[error]}</p>
      ) : (
        <>
          <section className="study-data-summary">
            <div className="study-data-section-heading">
              <div>
                <p className="study-data-eyebrow">{text.overview}</p>
                <h2>{text.total}</h2>
              </div>

              <span className="study-data-session-count">
                {formatNumber(studyRecords.length)} {text.sessions}
              </span>
            </div>

            <div className="study-data-stats">
              <div className="study-data-stat study-data-stat-wide">
                <span>{text.answered}</span>
                <strong>{formatNumber(totalAnswered)}</strong>
                <small>{text.questions}</small>
              </div>

              <div className="study-data-stat">
                <span>{text.correct}</span>
                <strong>{formatNumber(totalCorrect)}</strong>
                <small>{text.questions}</small>
              </div>

              <div className="study-data-stat">
                <span>{text.incorrect}</span>
                <strong>{formatNumber(totalIncorrect)}</strong>
                <small>{text.questions}</small>
              </div>

              <div className="study-data-stat study-data-rate">
                <span>{text.accuracy}</span>
                <strong>{overallRate}</strong>
                <small>%</small>
              </div>

              <div className="study-data-stat">
                <span>{text.studyTime}</span>
                <strong>{formatDuration(totalDuration)}</strong>
              </div>
            </div>
          </section>

          <section className="study-data-history">
            <div className="study-data-section-heading">
              <div>
                <p className="study-data-eyebrow">{text.history}</p>
                <h2>{text.historyTitle}</h2>
              </div>

              <span className="study-data-session-count">
                {formatNumber(studyRecords.length)} {text.records}
              </span>
            </div>

            {studyRecords.length === 0 ? (
              <div className="study-data-empty">
                <h3>{text.emptyTitle}</h3>
                <p>{text.emptyDescription}</p>
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
                            {formatDate(record.date)}
                            {record.time ? ` · ${record.time}` : ""}
                          </p>

                          <h3>
                            {record.deckName || text.noDeckName}
                          </h3>
                        </div>

                        <button
                          type="button"
                          className="study-data-delete"
                          onClick={() => deleteStudyRecord(record.id)}
                        >
                          {text.delete}
                        </button>
                      </div>

                      <div className="study-data-record-stats">
                        <span>
                          {text.answered} {formatNumber(record.answered)}
                          {text.questions}
                        </span>

                        <span className="study-data-record-rate">
                          {text.accuracy} {rate}%
                        </span>

                        <span>
                          {text.correct} {formatNumber(record.correct)}
                          {text.questions}
                        </span>

                        <span>
                          {text.incorrect} {formatNumber(record.incorrect)}
                          {text.questions}
                        </span>

                        <span>
                          {text.time} {formatDuration(record.duration)}
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
          color: var(--anki-theme-dark);
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
          background: var(--anki-theme-light);
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

        .study-data-stat-wide strong,
        .study-data-rate strong {
          color: var(--anki-theme-dark);
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
          white-space: pre-line;
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
          border-color: var(--anki-theme-color);
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

        .study-data-record-rate {
          color: var(--anki-theme-dark);
          font-weight: 600;
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
