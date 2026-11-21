
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";

import {
  doc,
  getDoc,
  runTransaction,
  setDoc,
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
};

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
          });
        } else {
          await setDoc(stateRef(currentUser.uid), INITIAL_DATA);
          setData(INITIAL_DATA);
        }
      } catch (error) {
        console.error("Anki Life読み込みエラー:", error);
        setMessage("データを読み込めませんでした。");
      } finally {
        setLoading(false);
      }
    });
  }, []);

  const saveData = async (next: LifeData) => {
    if (!user) return;

    setData(next);

    try {
      await setDoc(stateRef(user.uid), next, { merge: true });
    } catch (error) {
      console.error("Anki Life保存エラー:", error);
      setMessage("保存に失敗しました。通信状態を確認してください。");
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

    await saveData({
      ...data,
      coins: data.coins - item.price,
      items: [...data.items, item.id],
    });
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

    await saveData({
      ...data,
      rewards: [...data.rewards, reward],
    });

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

    await saveData({
      ...data,
      coins: data.coins - reward.price,
      rewards: nextRewards,
    });

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
            <div key={String(label)} style={cardStyle}>
              <div style={{ fontSize: 23 }}>{emoji}</div>
              <div style={{ color: "#849187", fontSize: 12 }}>{label}</div>
              <strong style={{ fontSize: 23 }}>{value}</strong>
            </div>
          ))}
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
