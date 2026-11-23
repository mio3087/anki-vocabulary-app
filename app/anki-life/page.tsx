
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";

import {
  doc,
  collection,
  getDoc,
  getDocs,
  runTransaction,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type Reward = {
  id: string;
  name: string;
  category: string;
  price: number;
  emoji: string;
  redeemed: boolean;
};

type LifeData = {
  coins: number;
  xp: number;
  petLevel: number;
  islandLevel: number;
  totalSessions: number;
  totalCards: number;
  rewards: Reward[];
  items: string[];
  milestoneClaims?: Record<string, string>;
};

type AnswerEntry = {
  order: number;
  cardId: string;
  front: string;
  pinyin: string;
  japanese: string;
  example: string;
  exampleJapanese: string;
  correct: boolean;
};

type AnswerSession = {
  id: string;
  deckName: string;
  mode: string;
  createdAt: number;
  answered: number;
  correct: number;
  incorrect: number;
  cards: AnswerEntry[];
};

const INITIAL_DATA: LifeData = {
  coins: 0,
  xp: 0,
  petLevel: 1,
  islandLevel: 1,
  totalSessions: 0,
  totalCards: 0,
  rewards: [],
  items: [],
  milestoneClaims: {},
};

const XP_MILESTONES = [
  { xp: 10000, emoji: "☕", title: "カフェ・スイーツ", description: "好きなカフェやスイーツを楽しむ" },
  { xp: 50000, emoji: "📚", title: "本を購入", description: "気になっていた本を1冊選ぶ" },
  { xp: 100000, emoji: "🛍️", title: "タオバオで買い物解禁", description: "予算を確認してから買い物を楽しむ" },
] as const;

const GAME_ITEMS = [
  { id: "apple", name: "りんご", emoji: "🍎", price: 30 },
  { id: "cake", name: "ケーキ", emoji: "🍰", price: 80 },
  { id: "flower", name: "お花", emoji: "🌷", price: 100 },
  { id: "hat", name: "ぼうし", emoji: "🎩", price: 150 },
  { id: "bed", name: "ふかふかベッド", emoji: "🛏️", price: 200 },
  { id: "toy", name: "おもちゃ", emoji: "🧸", price: 250 },
];

const cardStyle: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E8E8E5",
  borderRadius: 18,
  padding: 20,
};

const buttonStyle: React.CSSProperties = {
  border: 0,
  borderRadius: 12,
  padding: "11px 16px",
  background: "#647D6B",
  color: "#FFFFFF",
  fontWeight: 700,
  cursor: "pointer",
};


function CatPet({ level }: { level: number }) {
  const isAdult = level >= 10;
  const isChild = level >= 5;
  const bodyY = isAdult ? 112 : isChild ? 119 : 128;
  const bodyRx = isAdult ? 48 : isChild ? 42 : 35;
  const bodyRy = isAdult ? 43 : isChild ? 37 : 31;
  const headR = isAdult ? 48 : isChild ? 43 : 39;
  const headY = isAdult ? 67 : isChild ? 73 : 81;

  return (
    <svg
      width="190"
      height="178"
      viewBox="0 0 190 178"
      role="img"
      aria-label={isAdult ? "大人の猫" : isChild ? "子どもの猫" : "赤ちゃん猫"}
      style={{ overflow: "visible", filter: "drop-shadow(0 7px 5px rgba(91, 91, 65, 0.12))" }}
    >
      {/* しっぽ */}
      <path
        d={isAdult ? "M128 127 C160 145 164 111 151 99" : "M119 132 C147 145 151 119 139 111"}
        fill="none"
        stroke="#D9A879"
        strokeWidth={isAdult ? 15 : 12}
        strokeLinecap="round"
      />
      {/* 体 */}
      <ellipse cx="94" cy={bodyY} rx={bodyRx} ry={bodyRy} fill="#F2D7B8" />
      {/* おなか */}
      <ellipse cx="94" cy={bodyY + 3} rx={bodyRx * 0.57} ry={bodyRy * 0.65} fill="#FFF1DE" />
      {/* 足 */}
      <ellipse cx="69" cy="151" rx="17" ry="10" fill="#EBC9A7" />
      <ellipse cx="117" cy="151" rx="17" ry="10" fill="#EBC9A7" />
      {/* 耳 */}
      <path d="M55 58 L51 15 Q52 8 60 15 L83 39 Z" fill="#EBC99F" stroke="#C99D76" strokeWidth="2" strokeLinejoin="round" />
      <path d="M135 58 L139 15 Q138 8 130 15 L107 39 Z" fill="#EBC99F" stroke="#C99D76" strokeWidth="2" strokeLinejoin="round" />
      <path d="M59 43 L57 24 L72 41 Z" fill="#EFAEAE" />
      <path d="M131 43 L133 24 L118 41 Z" fill="#EFAEAE" />
      {/* 顔 */}
      <circle cx="95" cy={headY} r={headR} fill="#F8E2C8" stroke="#C99D76" strokeWidth="2" />
      {/* 目 */}
      <ellipse cx="79" cy={headY - 2} rx="4.2" ry="6" fill="#51463D" />
      <ellipse cx="111" cy={headY - 2} rx="4.2" ry="6" fill="#51463D" />
      <circle cx="80.5" cy={headY - 4} r="1.3" fill="#FFFFFF" />
      <circle cx="112.5" cy={headY - 4} r="1.3" fill="#FFFFFF" />
      {/* 鼻と口 */}
      <path d={`M91 ${headY + 10} Q95 ${headY + 6} 99 ${headY + 10} Q95 ${headY + 15} 91 ${headY + 10}`} fill="#D98F91" />
      <path d={`M95 ${headY + 14} Q91 ${headY + 21} 86 ${headY + 18} M95 ${headY + 14} Q99 ${headY + 21} 104 ${headY + 18}`} fill="none" stroke="#80675A" strokeWidth="1.8" strokeLinecap="round" />
      {/* ほっぺ */}
      <ellipse cx="66" cy={headY + 13} rx="8" ry="4.5" fill="#EFAEAE" opacity="0.7" />
      <ellipse cx="124" cy={headY + 13} rx="8" ry="4.5" fill="#EFAEAE" opacity="0.7" />
      {/* ひげ */}
      <path d={`M57 ${headY + 9} L38 ${headY + 5} M57 ${headY + 16} L39 ${headY + 19} M133 ${headY + 9} L152 ${headY + 5} M133 ${headY + 16} L151 ${headY + 19}`} stroke="#B99578" strokeWidth="1.5" strokeLinecap="round" />
      {isAdult && <path d="M76 28 Q95 17 114 28" fill="none" stroke="#D7A77F" strokeWidth="3" strokeLinecap="round" />}
    </svg>
  );
}

export default function AnkiLifePage() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [data, setData] = useState<LifeData>(INITIAL_DATA);
  const [loading, setLoading] = useState(true);
  const [rewardName, setRewardName] = useState("");
  const [rewardPrice, setRewardPrice] = useState("800");
  const [rewardCategory, setRewardCategory] = useState("本・教材");
  const [message, setMessage] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [historySessions, setHistorySessions] = useState<AnswerSession[]>([]);
  const [historyFilter, setHistoryFilter] = useState<"all" | "correct" | "incorrect">("all");
  const [selectedSession, setSelectedSession] = useState<string>("all");


  const stateRef = (uid: string) =>
    doc(db, "users", uid, "ankiLife", "state");

  useEffect(() => {
    return onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);

      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const snapshot = await getDoc(stateRef(currentUser.uid));

        if (snapshot.exists()) {
          const saved = snapshot.data() as Partial<LifeData>;
          setData({
            ...INITIAL_DATA,
            ...saved,
            rewards: Array.isArray(saved.rewards) ? saved.rewards : [],
            items: Array.isArray(saved.items) ? saved.items : [],
            milestoneClaims: saved.milestoneClaims && typeof saved.milestoneClaims === "object" ? saved.milestoneClaims : {},
          });
        } else {
          // 未作成の状態は画面内だけ初期化。読み込み中にFirestoreへ0を書き込まない。
          setData(INITIAL_DATA);
        }
      } catch (error) {
        console.error("Anki Life読み込みエラー:", error);
        const detail = error instanceof Error ? error.message : String(error);
        setMessage(`データを読み込めませんでした。Firebase詳細: ${detail}`);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  const loadAnswerHistory = async (uid: string) => {
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const snapshot = await getDocs(collection(db, "users", uid, "ankiLife", "state", "rewardEvents"));
      const sessions: AnswerSession[] = snapshot.docs.map((item) => {
        const saved = item.data();
        return {
          id: item.id,
          deckName: String(saved.deckName ?? "名称未設定"),
          mode: String(saved.mode ?? "unknown"),
          createdAt: Number(saved.createdAt ?? 0),
          answered: Number(saved.answered ?? 0),
          correct: Number(saved.correct ?? 0),
          incorrect: Number(saved.incorrect ?? 0),
          cards: Array.isArray(saved.cards) ? saved.cards.map((card: Partial<AnswerEntry>, index: number) => ({
            order: Number(card.order ?? index + 1),
            cardId: String(card.cardId ?? ""),
            front: String(card.front ?? ""),
            pinyin: String(card.pinyin ?? ""),
            japanese: String(card.japanese ?? ""),
            example: String(card.example ?? ""),
            exampleJapanese: String(card.exampleJapanese ?? ""),
            correct: card.correct === true,
          })) : [],
        };
      }).sort((a, b) => b.createdAt - a.createdAt);
      setHistorySessions(sessions);
    } catch (error) {
      setHistoryError(`回答履歴を取得できませんでした: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setHistoryLoading(false);
    }
  };

  const toggleAnswerHistory = () => {
    if (!historyOpen && user) void loadAnswerHistory(user.uid);
    setHistoryOpen((previous) => !previous);
  };

  // ショップ操作では学習XP・学習回数を上書きしない。
  // 直近のFirestore値に対してコイン差分とショップの変更だけを適用する。
  const saveData = async (next: LifeData) => {
    if (!user) return false;
    const coinDelta = next.coins - data.coins;
    try {
      const updated = await runTransaction(db, async (transaction) => {
        const ref = stateRef(user.uid);
        const snapshot = await transaction.get(ref);
        const current = snapshot.exists() ? snapshot.data() as Partial<LifeData> : {};
        const currentCoins = Number(current.coins ?? 0);
        if (currentCoins + coinDelta < 0) {
          throw new Error("コインが不足しています。最新の残高を確認してください。");
        }
        const changes = {
          coins: currentCoins + coinDelta,
          items: next.items,
          rewards: next.rewards,
        };
        transaction.set(ref, changes, { merge: true });
        return {
          ...INITIAL_DATA,
          ...current,
          ...changes,
          milestoneClaims: current.milestoneClaims || {},
        } as LifeData;
      });
      setData(updated);
      return true;
    } catch (error) {
      console.error("Anki Life保存エラー:", error);
      const detail = error instanceof Error ? error.message : String(error);
      setMessage(`保存に失敗しました。Firebase詳細: ${detail}`);
      return false;
    }
  };

  const claimMilestone = async (requiredXp: number) => {
    if (!user) return;
    const milestone = XP_MILESTONES.find((item) => item.xp === requiredXp);
    if (!milestone) return;

    try {
      // 最新のXPをFirestore内で確認し、二重受取を防ぐ。
      const nextData = await runTransaction(db, async (transaction) => {
        const ref = stateRef(user.uid);
        const snapshot = await transaction.get(ref);
        if (!snapshot.exists()) throw new Error("学習データが見つかりません。");
        const current = snapshot.data() as LifeData;
        const claims = current.milestoneClaims || {};
        if ((current.xp || 0) < requiredXp) throw new Error("必要なXPに到達していません。");
        if (claims[String(requiredXp)]) throw new Error("このご褒美は受取済みです。");
        const nextClaims = { ...claims, [String(requiredXp)]: new Date().toISOString() };
        transaction.update(ref, { milestoneClaims: nextClaims });
        return { ...INITIAL_DATA, ...current, milestoneClaims: nextClaims };
      });
      setData(nextData);
      setMessage(`🎉 ${milestone.title}を解禁しました！`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ご褒美の受取に失敗しました。");
    }
  };

  const buyItem = async (item: (typeof GAME_ITEMS)[number]) => {
    if (data.coins < item.price) {
      setMessage("コインが足りません。少し学習して集めましょう！");
      return;
    }

    if (data.items.includes(item.id)) {
      setMessage("このアイテムはもう持っています！");
      return;
    }

    if (!(await saveData({
      ...data,
      coins: data.coins - item.price,
      items: [...data.items, item.id],
    }))) return;
    setMessage(`${item.emoji} ${item.name}を手に入れました！`);
  };

  const addReward = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = rewardName.trim();
    const price = Number(rewardPrice);

    if (!name || !Number.isFinite(price) || price <= 0) {
      setMessage("ご褒美の名前とポイントを正しく入力してください。");
      return;
    }

    const emoji =
      rewardCategory === "本・教材" ? "📚" :
      rewardCategory === "食べ物" ? "🍫" :
      rewardCategory === "お出かけ" ? "☕" : "🎁";

    const reward: Reward = {
      id: crypto.randomUUID(),
      name,
      category: rewardCategory,
      price: Math.floor(price),
      emoji,
      redeemed: false,
    };

    if (!(await saveData({
      ...data,
      rewards: [...data.rewards, reward],
    }))) return;

    setRewardName("");
    setRewardPrice("800");
    setMessage("ご褒美を登録しました！");
  };

  const redeemReward = async (reward: Reward) => {
    if (reward.redeemed) return;

    if (data.coins < reward.price) {
      setMessage("あと少し！コインを集めましょう。");
      return;
    }

    const nextRewards = data.rewards.map((item) =>
      item.id === reward.id ? { ...item, redeemed: true } : item
    );

    if (!(await saveData({
      ...data,
      coins: data.coins - reward.price,
      rewards: nextRewards,
    }))) return;

    setMessage(`🎉「${reward.name}」を交換しました！実際のご褒美を楽しんでね。`);
  };

  if (!authReady || loading) {
    return (
      <main style={{ padding: 40, textAlign: "center" }}>
        Anki Lifeを準備しています…
      </main>
    );
  }

  if (!user) {
    return (
      <main style={{ maxWidth: 600, margin: "60px auto", padding: 24 }}>
        <h1>Anki Life 🌱</h1>
        <p>ペットのデータを保存するにはログインしてください。</p>
        <a href="/" style={{ color: "#647D6B" }}>Ankiに戻る</a>
      </main>
    );
  }

  const petStage =
    data.petLevel >= 10 ? "大人" :
    data.petLevel >= 5 ? "子ども" : "赤ちゃん";

  const xpProgress = data.xp % 100;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F6F7F2",
        color: "#28352D",
        padding: "28px 18px 70px",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <header style={{ marginBottom: 24 }}>
          <p style={{ color: "#849187", fontSize: 11, letterSpacing: 2 }}>
            YOUR LITTLE WORLD
          </p>
          <h1 style={{ fontSize: 30, margin: "5px 0" }}>Anki Life 🌱</h1>
          <p style={{ color: "#78847B", margin: 0 }}>
            勉強した分だけ、世界が少しずつ育っていく。
          </p>
        </header>

        {message && (
          <div
            style={{
              ...cardStyle,
              marginBottom: 16,
              background: "#F0F6EF",
              color: "#49664F",
            }}
          >
            {message}
            <button
              onClick={() => setMessage("")}
              style={{ float: "right", border: 0, background: "none", cursor: "pointer" }}
            >
              ✕
            </button>
          </div>
        )}

        <section
          style={{
            ...cardStyle,
            background: "linear-gradient(135deg, #EAF4E8, #F7F1E5)",
            marginBottom: 18,
            textAlign: "center",
          }}
        >
          <p style={{ color: "#718675", fontSize: 12, fontWeight: 700 }}>
            YOUR PET
          </p>
          <div style={{ display: "flex", justifyContent: "center", margin: "8px auto 2px" }}>
            <CatPet level={data.petLevel} />
          </div>
          <p style={{ margin: 4, color: "#78847B" }}>
            {petStage} · レベル {data.petLevel}
          </p>

          <div style={{ maxWidth: 340, margin: "18px auto 6px" }}>
            <div
              style={{
                height: 12,
                borderRadius: 20,
                background: "#DDE6DA",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${xpProgress}%`,
                  height: "100%",
                  background: "#7CA47D",
                  borderRadius: 20,
                }}
              />
            </div>
            <small style={{ color: "#718675" }}>
              次のレベルまで {100 - xpProgress} XP
            </small>
          </div>
          <p style={{ fontSize: 13, color: "#718675" }}>
            今日も来てくれてありがとう！
          </p>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: 10,
            marginBottom: 18,
          }}
        >
          {[
            ["🪙", "コイン", data.coins],
            ["⭐", "経験値", data.xp],
            ["📖", "学習回数", data.totalSessions],
            ["📝", "回答カード", data.totalCards],
          ].map(([emoji, label, value]) => (
            <div
              key={String(label)}
              style={{ ...cardStyle, ...(label === "回答カード" ? { cursor: "pointer", borderColor: "#A4BBA5" } : {}) }}
              onClick={label === "回答カード" ? toggleAnswerHistory : undefined}
              role={label === "回答カード" ? "button" : undefined}
              tabIndex={label === "回答カード" ? 0 : undefined}
              onKeyDown={label === "回答カード" ? (event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  toggleAnswerHistory();
                }
              } : undefined}
            >
              <div style={{ fontSize: 23 }}>{emoji}</div>
              <div style={{ color: "#849187", fontSize: 12 }}>{label}</div>
              <strong style={{ fontSize: 23 }}>{value}</strong>
              {label === "回答カード" && <div style={{ fontSize: 11, color: "#647D6B", marginTop: 5 }}>履歴を見る {historyOpen ? "▲" : "▼"}</div>}
            </div>
          ))}
        </section>

        {historyOpen && (
          <section style={{ ...cardStyle, marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h2 style={{ margin: 0 }}>📝 回答カード履歴</h2>
              <button type="button" style={buttonStyle} onClick={() => user && void loadAnswerHistory(user.uid)} disabled={historyLoading}>更新</button>
            </div>
            <p style={{ color: "#78847B", fontSize: 13 }}>通常学習・タイムアタックの回答を、回答順で振り返れます。</p>
            {historyLoading && <p>履歴を読み込み中…</p>}
            {historyError && <p style={{ color: "#B45353" }}>{historyError}</p>}
            {!historyLoading && !historyError && (
              <>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                  <select aria-label="学習セッション" value={selectedSession} onChange={(event) => setSelectedSession(event.target.value)} style={{ padding: 10, borderRadius: 10, border: "1px solid #DDE6DA", maxWidth: "100%" }}>
                    <option value="all">すべての学習</option>
                    {historySessions.map((session) => (
                      <option key={session.id} value={session.id}>
                        {new Date(session.createdAt).toLocaleString("ja-JP")} · {session.deckName} · {session.mode === "normal" ? "通常学習" : session.mode === "unknown" ? "旧記録" : `タイムアタック ${session.mode}`}
                      </option>
                    ))}
                  </select>
                  <select aria-label="正誤フィルター" value={historyFilter} onChange={(event) => setHistoryFilter(event.target.value as "all" | "correct" | "incorrect")} style={{ padding: 10, borderRadius: 10, border: "1px solid #DDE6DA" }}>
                    <option value="all">すべて</option>
                    <option value="correct">正解のみ</option>
                    <option value="incorrect">不正解のみ</option>
                  </select>
                </div>
                {historySessions.length === 0 && <p>まだ保存済みの学習履歴がありません。</p>}
                {historySessions.filter((session) => selectedSession === "all" || session.id === selectedSession).map((session) => {
                  const visibleCards = session.cards.filter((card) => historyFilter === "all" || (historyFilter === "correct" ? card.correct : !card.correct));
                  return (
                    <div key={session.id} style={{ marginBottom: 16, border: "1px solid #E8E8E5", borderRadius: 14, padding: 14 }}>
                      <strong>{session.deckName}</strong>
                      <p style={{ color: "#78847B", fontSize: 12, margin: "6px 0 12px" }}>
                        {new Date(session.createdAt).toLocaleString("ja-JP")} · {session.mode === "normal" ? "通常学習" : session.mode === "unknown" ? "旧記録" : `タイムアタック ${session.mode}`} · {session.answered}問（正解{session.correct}・不正解{session.incorrect}）
                      </p>
                      {session.cards.length === 0 ? (
                        <p style={{ color: "#78847B", fontSize: 13 }}>この学習はカード詳細の保存開始前の記録です。回答数のみ確認できます。</p>
                      ) : visibleCards.length === 0 ? (
                        <p style={{ color: "#78847B", fontSize: 13 }}>この条件に一致するカードはありません。</p>
                      ) : visibleCards.map((card, index) => (
                        <div key={`${session.id}-${card.order}-${index}`} style={{ padding: "12px 0", borderTop: "1px solid #EDF0EA" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
                            <strong>{card.order}. {card.front || "（表面なし）"}</strong>
                            <span style={{ color: card.correct ? "#39744B" : "#B45353", fontSize: 12, whiteSpace: "nowrap" }}>{card.correct ? "✓ 正解" : "✕ 不正解"}</span>
                          </div>
                          {card.pinyin && <div style={{ fontSize: 12, color: "#78847B" }}>{card.pinyin}</div>}
                          {card.japanese && <div style={{ fontSize: 14, marginTop: 3 }}>{card.japanese}</div>}
                          {card.example && <div style={{ fontSize: 13, marginTop: 5 }}>{card.example}</div>}
                          {card.exampleJapanese && <div style={{ fontSize: 12, color: "#78847B" }}>{card.exampleJapanese}</div>}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </>
            )}
          </section>
        )}

        <section style={{ ...cardStyle, marginBottom: 18 }}>
          <h2 style={{ marginTop: 0 }}>🎯 XP達成ご褒美</h2>
          <p style={{ color: "#78847B", fontSize: 13 }}>
            累計XPで解禁！ XPやコインは消費しません。受取記録はFirebaseに保存されます。
          </p>
          <div style={{ display: "grid", gap: 12 }}>
            {XP_MILESTONES.map((milestone) => {
              const claimed = Boolean(data.milestoneClaims?.[String(milestone.xp)]);
              const unlocked = data.xp >= milestone.xp;
              const remaining = Math.max(0, milestone.xp - data.xp);
              const progress = Math.min(100, Math.max(0, (data.xp / milestone.xp) * 100));
              return (
                <div key={milestone.xp} style={{ border: "1px solid #E8E8E5", borderRadius: 14, padding: 15 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div>
                      <strong>{milestone.emoji} {milestone.title}</strong>
                      <div style={{ color: "#78847B", fontSize: 12, marginTop: 4 }}>
                        {milestone.xp.toLocaleString("ja-JP")} XP · {milestone.description}
                      </div>
                    </div>
                    <button
                      type="button"
                      style={{ ...buttonStyle, background: claimed ? "#AAB5AA" : "#647D6B", opacity: !unlocked ? 0.6 : 1 }}
                      disabled={!unlocked || claimed}
                      onClick={() => claimMilestone(milestone.xp)}
                    >
                      {claimed ? "受取済み" : unlocked ? "ご褒美を解禁" : `あと ${remaining.toLocaleString("ja-JP")} XP`}
                    </button>
                  </div>
                  <div role="progressbar" aria-label={`${milestone.title}の進捗`} aria-valuenow={Math.min(data.xp, milestone.xp)} aria-valuemin={0} aria-valuemax={milestone.xp} style={{ height: 9, background: "#E7ECE4", borderRadius: 20, overflow: "hidden", marginTop: 12 }}>
                    <div style={{ width: `${progress}%`, height: "100%", background: "#7CA47D", borderRadius: 20 }} />
                  </div>
                </div>
              );
            })}
          </div>
          <p style={{ color: "#78847B", fontSize: 12, marginBottom: 0 }}>
            ※ 現実の買い物は自動実行されません。タオバオのご褒美も予算内で利用してください。
          </p>
        </section>

        <section style={{ ...cardStyle, marginBottom: 18 }}>
          <h2 style={{ marginTop: 0 }}>🏝️ あなたの島</h2>
          <div
            style={{
              minHeight: 150,
              borderRadius: 16,
              background: "linear-gradient(#DDF0F5 0 42%, #C9E2B9 42% 100%)",
              display: "grid",
              placeItems: "center",
              textAlign: "center",
              fontSize: 38,
            }}
          >
            <div>
              <div>
                🌳　{data.islandLevel >= 3 ? "🏡" : "🌱"}　🌼
              </div>
              <div>
                {data.items.includes("flower") ? "🌷" : "🌿"}
                {"　"}
                {data.items.includes("bed") ? (
                  <span style={{ fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif' }}>🛏️</span>
                ) : (
                  <span
                    role="img"
                    aria-label="石"
                    style={{ fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif' }}
                  >
                    {'\u{1FAA8}\uFE0F'}
                  </span>
                )}
                {"　"}
                {data.items.includes("toy") ? "🧸" : "🌿"}
              </div>
              <small style={{ fontSize: 12, color: "#536A53" }}>
                ISLAND LEVEL {data.islandLevel}
              </small>
            </div>
          </div>
          <p style={{ color: "#78847B", fontSize: 13 }}>
            学習で経験値を集めると、ペットと島が成長します。
          </p>
        </section>

        <section style={{ ...cardStyle, marginBottom: 18 }}>
          <h2 style={{ marginTop: 0 }}>🛍️ ペットのお店</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(135px, 1fr))",
              gap: 10,
            }}
          >
            {GAME_ITEMS.map((item) => {
              const owned = data.items.includes(item.id);
              return (
                <div
                  key={item.id}
                  style={{
                    border: "1px solid #E8E8E5",
                    borderRadius: 14,
                    padding: 12,
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 34 }}>{item.emoji}</div>
                  <strong>{item.name}</strong>
                  <p style={{ color: "#849187", fontSize: 12 }}>
                    🪙 {item.price}
                  </p>
                  <button
                    style={{
                      ...buttonStyle,
                      width: "100%",
                      background: owned ? "#AAB5AA" : "#647D6B",
                    }}
                    disabled={owned}
                    onClick={() => buyItem(item)}
                  >
                    {owned ? "購入済み" : "交換する"}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        <section style={{ ...cardStyle, marginBottom: 18 }}>
          <h2 style={{ marginTop: 0 }}>🎁 現実のご褒美ショップ</h2>
          <p style={{ color: "#78847B", fontSize: 13 }}>
            欲しい本や教材、お菓子などを登録して、学習コインで交換しよう。
          </p>

          <form onSubmit={addReward}>
            <label style={{ display: "block", fontSize: 12, marginBottom: 5 }}>
              ご褒美の名前
            </label>
            <input
              value={rewardName}
              onChange={(e) => setRewardName(e.target.value)}
              placeholder="例：気になっていた中国語の本"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: 12,
                border: "1px solid #DDE2DA",
                borderRadius: 10,
                marginBottom: 10,
              }}
            />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              <div>
                <label style={{ fontSize: 12 }}>カテゴリー</label>
                <select
                  value={rewardCategory}
                  onChange={(e) => setRewardCategory(e.target.value)}
                  style={{
                    width: "100%",
                    padding: 12,
                    border: "1px solid #DDE2DA",
                    borderRadius: 10,
                    marginTop: 5,
                  }}
                >
                  <option>本・教材</option>
                  <option>食べ物</option>
                  <option>お出かけ</option>
                  <option>その他</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12 }}>必要コイン</label>
                <input
                  type="number"
                  min="1"
                  value={rewardPrice}
                  onChange={(e) => setRewardPrice(e.target.value)}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: 12,
                    border: "1px solid #DDE2DA",
                    borderRadius: 10,
                    marginTop: 5,
                  }}
                />
              </div>
            </div>
            <button type="submit" style={{ ...buttonStyle, marginTop: 12 }}>
              ＋ ご褒美を登録
            </button>
          </form>

          <div style={{ marginTop: 18, display: "grid", gap: 10 }}>
            {data.rewards.map((reward) => (
              <div
                key={reward.id}
                style={{
                  border: "1px solid #E8E8E5",
                  borderRadius: 12,
                  padding: 13,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div>
                  <strong>{reward.emoji} {reward.name}</strong>
                  <div style={{ color: "#849187", fontSize: 12 }}>
                    {reward.category} · 🪙 {reward.price}
                  </div>
                </div>
                <button
                  style={{
                    ...buttonStyle,
                    background: reward.redeemed ? "#AAB5AA" : "#647D6B",
                  }}
                  disabled={reward.redeemed}
                  onClick={() => redeemReward(reward)}
                >
                  {reward.redeemed ? "交換済み" : "交換"}
                </button>
              </div>
            ))}
            {data.rewards.length === 0 && (
              <p style={{ color: "#849187", fontSize: 13 }}>
                まだご褒美がありません。最初のご褒美を登録してみましょう！
              </p>
            )}
          </div>
        </section>

        <footer style={{ textAlign: "center", color: "#9AA49B", fontSize: 12 }}>
          Small steps, little rewards, big growth. 🌱
        </footer>
      </div>
    </main>
  );
}
