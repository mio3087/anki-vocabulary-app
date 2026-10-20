
"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type MaterialType = "book" | "deck";

type StudyRange = {
  start: number;
  end: number;
  date: string;
};

type Material = {
  id: string;
  name: string;
  language: string;
  type: MaterialType;
  total: number;
  studyRanges: StudyRange[];
  createdAt: number;
};

const LANGUAGES = [
  "中国語",
  "ドイツ語",
  "スペイン語",
  "英語",
  "イタリア語",
  "韓国語",
  "日本語",
  "その他",
];

function getToday(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// 重複した学習範囲をまとめて、学習済みページ・単語数を計算する
function getCoveredCount(ranges: StudyRange[]): number {
  if (ranges.length === 0) return 0;

  const sorted = [...ranges].sort((a, b) => a.start - b.start);

  let covered = 0;
  let currentStart = sorted[0].start;
  let currentEnd = sorted[0].end;

  for (let i = 1; i < sorted.length; i++) {
    const range = sorted[i];

    if (range.start <= currentEnd + 1) {
      currentEnd = Math.max(currentEnd, range.end);
    } else {
      covered += currentEnd - currentStart + 1;
      currentStart = range.start;
      currentEnd = range.end;
    }
  }

  covered += currentEnd - currentStart + 1;
  return covered;
}

function getProgress(material: Material): number {
  if (material.total <= 0) return 0;

  return Math.min(
    100,
    Math.round(
      (getCoveredCount(material.studyRanges) / material.total) * 100
    )
  );
}

export default function MaterialsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [language, setLanguage] = useState("中国語");
  const [type, setType] = useState<MaterialType>("book");
  const [total, setTotal] = useState("100");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState("");
  const [rangeStart, setRangeStart] = useState("1");
  const [rangeEnd, setRangeEnd] = useState("10");

  // ログイン状態を確認する
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthChecked(true);
    });

    return () => unsubscribe();
  }, []);

  // ログインユーザー本人の教材だけを読み込む
  useEffect(() => {
    let cancelled = false;

    async function loadMaterials() {
      if (!authChecked) return;

      if (!user) {
        setMaterials([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const snapshot = await getDocs(
          collection(db, "users", user.uid, "materials")
        );

        const loaded: Material[] = snapshot.docs.map((item) => {
          const data = item.data();

          const rawRanges: unknown[] = Array.isArray(data.studyRanges)
            ? data.studyRanges
            : [];

          const studyRanges: StudyRange[] = rawRanges.flatMap((value) => {
            if (
              typeof value !== "object" ||
              value === null ||
              !("start" in value) ||
              !("end" in value) ||
              !("date" in value)
            ) {
              return [];
            }

            const range = value as {
              start: unknown;
              end: unknown;
              date: unknown;
            };

            if (
              typeof range.start !== "number" ||
              typeof range.end !== "number" ||
              typeof range.date !== "string" ||
              !Number.isFinite(range.start) ||
              !Number.isFinite(range.end)
            ) {
              return [];
            }

            return [{
              start: range.start,
              end: range.end,
              date: range.date,
            }];
          });

          return {
            id: item.id,
            name: typeof data.name === "string" ? data.name : "",
            language:
              typeof data.language === "string"
                ? data.language
                : "その他",
            type: data.type === "deck" ? "deck" : "book",
            total:
              typeof data.total === "number" && data.total > 0
                ? Math.floor(data.total)
                : 1,
            studyRanges,
            createdAt:
              typeof data.createdAt === "number" ? data.createdAt : 0,
          };
        });

        loaded.sort((a, b) => b.createdAt - a.createdAt);

        if (!cancelled) {
          setMaterials(loaded);
        }
      } catch (err) {
        console.error(err);

        if (!cancelled) {
          setError(
            "教材を読み込めませんでした。Firestoreのセキュリティルールや接続設定を確認してください。"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadMaterials();

    return () => {
      cancelled = true;
    };
  }, [user, authChecked]);

  // 教材の新規登録・編集
  async function handleSaveMaterial(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      setError("教材を保存するにはログインしてください。");
      return;
    }

    const trimmedName = name.trim();
    const parsedTotal = Number(total);

    if (!trimmedName) {
      setError("教材名を入力してください。");
      return;
    }

    if (
      !Number.isSafeInteger(parsedTotal) ||
      parsedTotal < 1 ||
      parsedTotal > 10000000
    ) {
      setError("総ページ数・総単語数は1以上の整数で入力してください。");
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (editingId) {
        await updateDoc(
          doc(db, "users", user.uid, "materials", editingId),
          {
            name: trimmedName,
            language,
            type,
            total: parsedTotal,
          }
        );

        setMaterials((previous) =>
          previous.map((material) =>
            material.id === editingId
              ? {
                  ...material,
                  name: trimmedName,
                  language,
                  type,
                  total: parsedTotal,
                }
              : material
          )
        );
      } else {
        const newMaterial = {
          name: trimmedName,
          language,
          type,
          total: parsedTotal,
          studyRanges: [] as StudyRange[],
          createdAt: Date.now(),
        };

        const result = await addDoc(
          collection(db, "users", user.uid, "materials"),
          newMaterial
        );

        setMaterials((previous) => [
          {
            id: result.id,
            ...newMaterial,
          },
          ...previous,
        ]);
      }

      setName("");
      setLanguage("中国語");
      setType("book");
      setTotal("100");
      setEditingId(null);
    } catch (err) {
      console.error(err);
      setError(
        "保存できませんでした。Firestoreのセキュリティルールを確認してください。"
      );
    } finally {
      setSaving(false);
    }
  }

  // 編集フォームに教材の情報を入れる
  function startEditing(material: Material) {
    setEditingId(material.id);
    setName(material.name);
    setLanguage(material.language);
    setType(material.type);
    setTotal(String(material.total));

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEditing() {
    setEditingId(null);
    setName("");
    setLanguage("中国語");
    setType("book");
    setTotal("100");
    setError("");
  }

  // 学習範囲を記録する
  async function handleRecordStudy(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      setError("学習記録を保存するにはログインしてください。");
      return;
    }

    const material = materials.find((item) => item.id === selectedId);
    const start = Number(rangeStart);
    const end = Number(rangeEnd);

    if (!material) {
      setError("学習する教材を選んでください。");
      return;
    }

    
if (
  !Number.isSafeInteger(start) ||
  !Number.isSafeInteger(end) ||
  start < 1 ||
  end < start
) {
  setError(
    "開始番号は1以上、終了番号は開始番号以上の整数で入力してください。"
  );
  return;
}


    const newRange: StudyRange = {
      start,
      end,
      date: getToday(),
    };

    setSaving(true);
    setError("");

    try {
      await updateDoc(
        doc(db, "users", user.uid, "materials", material.id),
        {
          studyRanges: [
            ...material.studyRanges,
            newRange,
          ],
        }
      );

      setMaterials((previous) =>
        previous.map((item) =>
          item.id === material.id
            ? {
                ...item,
                studyRanges: [...item.studyRanges, newRange],
              }
            : item
        )
      );

    
    } catch (err) {
      console.error(err);
      setError(
        "学習記録を保存できませんでした。Firestoreのセキュリティルールを確認してください。"
      );
    } finally {
      setSaving(false);
    }
  }

  // 教材を削除する
  async function handleDelete(material: Material) {
    if (!user) return;

    const confirmed = window.confirm(
      `「${material.name}」を削除しますか？\nこの教材の学習記録も削除されます。`
    );

    if (!confirmed) return;

    setError("");

    try {
      await deleteDoc(
        doc(db, "users", user.uid, "materials", material.id)
      );

      setMaterials((previous) =>
        previous.filter((item) => item.id !== material.id)
      );

      if (selectedId === material.id) {
        setSelectedId("");
      }

      if (editingId === material.id) {
        cancelEditing();
      }
    } catch (err) {
      console.error(err);
      setError("削除できませんでした。Firestoreの設定を確認してください。");
    }
  }

  if (!authChecked || loading) {
    return (
      <main style={styles.page}>
        <p>教材を読み込んでいます...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main style={styles.page}>
        <div style={styles.container}>
          <h1 style={styles.title}>📚 教材一覧</h1>
          <p>教材を登録・保存するにはログインしてください。</p>
          <Link href="/login" style={styles.primaryLink}>
            ログインする
          </Link>
          <p style={{ marginTop: 20 }}>
            <Link href="/today" style={styles.textLink}>
              今日の学習へ戻る
            </Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div>
            <p style={styles.eyebrow}>STUDY LIBRARY</p>
            <h1 style={styles.title}>📚 教材一覧</h1>
            <p style={styles.subtitle}>
              本も単語帳も、進み具合を見える化しよう。
            </p>
          </div>
          <Link href="/today" style={styles.primaryLink}>
            今日の学習へ →
          </Link>
        </header>

        <nav style={styles.nav}>
          <Link href="/plans" style={styles.navLink}>
            学習計画
          </Link>
          <Link href="/today" style={styles.navLink}>
            今日の学習
          </Link>
        </nav>

        {error && (
          <div role="alert" style={styles.error}>
            {error}
          </div>
        )}

        <section style={styles.panel}>
          <h2 style={styles.heading}>
            {editingId ? "✏️ 教材を編集" : "➕ 教材を登録"}
          </h2>

          <form onSubmit={handleSaveMaterial} style={styles.form}>
            <label style={styles.label}>
              教材名
              <input
                style={styles.input}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="例：HSK7-9級、ドイツ語問題集"
                maxLength={150}
                required
              />
            </label>

            <div style={styles.twoColumns}>
              <label style={styles.label}>
                言語
                <select
                  style={styles.input}
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                >
                  {LANGUAGES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label style={styles.label}>
                教材の種類
                <select
                  style={styles.input}
                  value={type}
                  onChange={(event) =>
                    setType(event.target.value as MaterialType)
                  }
                >
                  <option value="book">本・問題集（ページ数）</option>
                  <option value="deck">暗記デッキ（単語数）</option>
                </select>
              </label>
            </div>

            <label style={styles.label}>
              総{type === "book" ? "ページ数" : "単語数"}
              <input
                style={styles.input}
                type="number"
                min="1"
                max="10000000"
                step="1"
                value={total}
                onChange={(event) => setTotal(event.target.value)}
                required
              />
            </label>

            <div style={styles.buttonRow}>
              <button
                type="submit"
                disabled={saving}
                style={styles.primaryButton}
              >
                {saving
                  ? "保存中..."
                  : editingId
                    ? "変更を保存"
                    : "教材を登録"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={cancelEditing}
                  style={styles.secondaryButton}
                >
                  編集をキャンセル
                </button>
              )}
            </div>
          </form>
        </section>

        <section style={styles.panel}>
          <h2 style={styles.heading}>📝 学習した範囲を記録</h2>
          <p style={styles.description}>
            例：1〜20ページ、または1〜20番の単語。以前記録した範囲を
            もう一度入力しても、進捗は二重に加算されません。
          </p>

          {materials.length === 0 ? (
            <p>まずは上のフォームから教材を登録してください。</p>
          ) : (
            <form onSubmit={handleRecordStudy} style={styles.form}>
              <label style={styles.label}>
                学習する教材
                <select
                  style={styles.input}
                  value={selectedId}
                  onChange={(event) => {
                    const id = event.target.value;
                    setSelectedId(id);

                    const material = materials.find(
                      (item) => item.id === id
                    );

                    if (material) {
                      setRangeStart("1");
                      setRangeEnd(String(Math.min(10, material.total)));
                    }
                  }}
                  required
                >
                  <option value="">教材を選択してください</option>
                  {materials.map((material) => (
                    <option key={material.id} value={material.id}>
                      {material.name}（全{material.total}
                      {material.type === "book" ? "ページ" : "単語"}）
                    </option>
                  ))}
                </select>
              </label>

              {(() => {
                const selected = materials.find(
                  (item) => item.id === selectedId
                );

                if (!selected) return null;

                const unit =
                  selected.type === "book" ? "ページ" : "番の単語";

                return (
                  <>
                    <div style={styles.twoColumns}>
                      
<label style={styles.label}>
  開始番号
  <input
    style={styles.input}
    type="number"
    min="1"
    step="1"
    value={rangeStart}
    onChange={(event) => setRangeStart(event.target.value)}
    required
  />
</label>


                    
<label style={styles.label}>
  終了番号
  <input
    style={styles.input}
    type="number"
    min="1"
    step="1"
    value={rangeEnd}
    onChange={(event) => setRangeEnd(event.target.value)}
    required
  />
</label>

                    </div>

                    <p style={styles.description}>
                      1〜{selected.total.toLocaleString()}
                      {unit}の範囲で記録できます。
                    </p>
                  </>
                );
              })()}

              <button
                type="submit"
                disabled={saving || !selectedId}
                style={styles.primaryButton}
              >
                {saving ? "記録中..." : "学習記録を保存"}
              </button>
            </form>
          )}
        </section>

        <section>
          <h2 style={styles.heading}>📖 登録した教材</h2>

          {materials.length === 0 ? (
            <div style={styles.empty}>
              <p style={{ fontSize: 32, margin: 0 }}>🌱</p>
              <p>まだ教材がありません。</p>
              <p>最初の教材を登録してみましょう！</p>
            </div>
          ) : (
            <div style={styles.materialList}>
              {materials.map((material) => {
                const covered = getCoveredCount(material.studyRanges);
                const progress = getProgress(material);
                const unit =
                  material.type === "book" ? "ページ" : "単語";

                return (
                  <article key={material.id} style={styles.materialCard}>
                    <div style={styles.cardTop}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={styles.tag}>
                          {material.language}
                        </span>
                        <span style={styles.tag}>
                          {material.type === "book"
                            ? "📕 本・問題集"
                            : "🗂️ 暗記デッキ"}
                        </span>
                        <h3 style={styles.cardTitle}>{material.name}</h3>
                        <p style={styles.description}>
                          学習済み {covered.toLocaleString()} /{" "}
                          {material.total.toLocaleString()}
                          {unit}
                        </p>
                      </div>

                      <strong style={styles.percentage}>
                        {progress}%
                      </strong>
                    </div>

                    <div
                      style={styles.progressTrack}
                      role="progressbar"
                      aria-label={`${material.name}の学習進捗`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={progress}
                    >
                      <div
                        style={{
                          ...styles.progressBar,
                          width: `${progress}%`,
                        }}
                      />
                    </div>

                    <p style={styles.smallText}>
                      記録した学習範囲：{material.studyRanges.length}件
                    </p>

                    {material.studyRanges.length > 0 && (
                      <details style={styles.details}>
                        <summary>学習記録を見る</summary>
                        <ul style={styles.rangeList}>
                          {[...material.studyRanges]
                            .reverse()
                            .map((range, index) => (
                              <li key={`${range.date}-${range.start}-${range.end}-${index}`}>
                                {range.date}：{range.start}〜{range.end}
                                {unit}
                              </li>
                            ))}
                        </ul>
                      </details>
                    )}

                    <div style={styles.buttonRow}>
                      <button
                        type="button"
                        onClick={() => startEditing(material)}
                        style={styles.secondaryButton}
                      >
                        編集
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(material)}
                        style={styles.deleteButton}
                      >
                        削除
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <footer style={styles.footer}>
          <Link href="/plans" style={styles.textLink}>
            学習計画へ
          </Link>
          {"　・　"}
          <Link href="/today" style={styles.textLink}>
            今日の学習へ
          </Link>
        </footer>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "32px 16px 60px",
    background: "#f5f0e6",
    color: "#302a22",
    boxSizing: "border-box",
  },
  container: {
    width: "100%",
    maxWidth: 850,
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 20,
    flexWrap: "wrap",
    marginBottom: 24,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 3,
    margin: "0 0 8px",
    color: "#8a6b45",
  },
  title: {
    fontSize: "clamp(28px, 5vw, 40px)",
    lineHeight: 1.2,
    margin: "0 0 10px",
    fontWeight: 900,
  },
  subtitle: {
    margin: 0,
    color: "#675d50",
    lineHeight: 1.7,
  },
  primaryLink: {
    display: "inline-block",
    padding: "12px 16px",
    borderRadius: 14,
    background: "#302a22",
    color: "#fffdf6",
    textDecoration: "none",
    fontWeight: 800,
  },
  nav: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  navLink: {
    display: "inline-block",
    padding: "9px 14px",
    border: "1px solid #b9a98f",
    borderRadius: 12,
    color: "#302a22",
    textDecoration: "none",
    fontWeight: 700,
    background: "#fffdf6",
  },
  panel: {
    padding: 22,
    marginBottom: 24,
    border: "2px solid #302a22",
    borderRadius: 22,
    background: "#fffdf6",
    boxShadow: "4px 5px 0 #302a22",
  },
  heading: {
    fontSize: 22,
    lineHeight: 1.4,
    margin: "0 0 18px",
    fontWeight: 900,
  },
  description: {
    color: "#675d50",
    lineHeight: 1.7,
    fontSize: 14,
  },
  form: {
    display: "grid",
    gap: 16,
  },
  label: {
    display: "grid",
    gap: 8,
    fontWeight: 800,
    fontSize: 14,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 13px",
    border: "1px solid #b9a98f",
    borderRadius: 12,
    background: "#ffffff",
    color: "#302a22",
    fontSize: 16,
  },
  twoColumns: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 14,
  },
  buttonRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
  },
  primaryButton: {
    padding: "12px 17px",
    border: "2px solid #302a22",
    borderRadius: 12,
    background: "#302a22",
    color: "#fffdf6",
    fontWeight: 800,
    fontSize: 14,
    cursor: "pointer",
  },
  secondaryButton: {
    padding: "10px 14px",
    border: "1px solid #8c7c64",
    borderRadius: 12,
    background: "#fffdf6",
    color: "#302a22",
    fontWeight: 800,
    cursor: "pointer",
  },
  deleteButton: {
    padding: "10px 14px",
    border: "1px solid #b64c43",
    borderRadius: 12,
    background: "#fff5f3",
    color: "#9c3028",
    fontWeight: 800,
    cursor: "pointer",
  },
  error: {
    padding: 14,
    marginBottom: 20,
    border: "1px solid #d88b83",
    borderRadius: 12,
    background: "#fff0ed",
    color: "#922e25",
    lineHeight: 1.6,
  },
  empty: {
    padding: 30,
    border: "1px dashed #b9a98f",
    borderRadius: 18,
    textAlign: "center",
    background: "#fffdf6",
    lineHeight: 1.7,
  },
  materialList: {
    display: "grid",
    gap: 18,
  },
  materialCard: {
    padding: 20,
    border: "2px solid #302a22",
    borderRadius: 20,
    background: "#fffdf6",
    boxShadow: "3px 4px 0 #302a22",
    minWidth: 0,
  },
  cardTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  tag: {
    display: "inline-block",
    margin: "0 6px 8px 0",
    padding: "5px 9px",
    borderRadius: 999,
    background: "#eee3ce",
    color: "#594630",
    fontSize: 12,
    fontWeight: 800,
  },
  cardTitle: {
    margin: "5px 0 8px",
    fontSize: 20,
    lineHeight: 1.5,
    overflowWrap: "anywhere",
  },
  percentage: {
    fontSize: 25,
    whiteSpace: "nowrap",
  },
  progressTrack: {
    width: "100%",
    height: 13,
    marginTop: 14,
    overflow: "hidden",
    borderRadius: 999,
    background: "#e4dccd",
  },
  progressBar: {
    height: "100%",
    borderRadius: 999,
    background: "#64876a",
    transition: "width 0.25s ease",
  },
  smallText: {
    margin: "10px 0",
    fontSize: 12,
    color: "#756b5d",
  },
  details: {
    marginTop: 12,
    lineHeight: 1.8,
    fontSize: 14,
  },
  rangeList: {
    paddingLeft: 22,
  },
  footer: {
    marginTop: 30,
    textAlign: "center",
    fontSize: 14,
  },
  textLink: {
    color: "#594630",
    fontWeight: 800,
  },
};
