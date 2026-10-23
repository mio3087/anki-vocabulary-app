
"use client";

import { useEffect, useState } from "react";

type TodayHeaderProps = {
  completedCount: number;
  totalCount: number;
  totalTarget: number;
};

type Season = "spring" | "summer" | "autumn" | "winter";
type TimeOfDay = "morning" | "day" | "evening" | "night";

type Scene = {
  image: string;
  location: string;
  greeting: string;
  message: string;
  overlay: string;
};

const scenes: Record<Season, Record<TimeOfDay, Scene>> = {
  spring: {
    morning: {
      image: "/images/landscapes/spring-morning.jpg",
      location: "日本・京都",
      greeting: "おはようございます",
      message: "新しい一日。新しい発見を。",
      overlay: "from-rose-950/55 via-slate-900/15 to-transparent",
    },
    day: {
      image: "/images/landscapes/spring-day.jpg",
      location: "オランダ・キューケンホフ",
      greeting: "こんにちは",
      message: "好奇心のままに、学んでみよう。",
      overlay: "from-slate-900/55 via-slate-900/10 to-transparent",
    },
    evening: {
      image: "/images/landscapes/spring-evening.jpg",
      location: "フランス・パリ",
      greeting: "お疲れさまです",
      message: "今日の努力を、明日の力に。",
      overlay: "from-indigo-950/65 via-orange-950/15 to-transparent",
    },
    night: {
      image: "/images/landscapes/spring-night.jpg",
      location: "日本・京都",
      greeting: "こんばんは",
      message: "静かな夜に、自分のペースで。",
      overlay: "from-slate-950/75 via-indigo-950/35 to-transparent",
    },
  },

  summer: {
    morning: {
      image: "/images/landscapes/summer-morning.jpg",
      location: "ギリシャ・サントリーニ島",
      greeting: "おはようございます",
      message: "今日も、好きなことをコツコツと。",
      overlay: "from-blue-950/55 via-blue-900/15 to-transparent",
    },
    day: {
      image: "/images/landscapes/summer-day.jpg",
      location: "イタリア・アマルフィ",
      greeting: "こんにちは",
      message: "青空のように、視野を広げよう。",
      overlay: "from-blue-950/60 via-blue-900/10 to-transparent",
    },
    evening: {
      image: "/images/landscapes/summer-evening.jpg",
      location: "スペイン・バルセロナ",
      greeting: "お疲れさまです",
      message: "一歩ずつ、世界が広がっていく。",
      overlay: "from-indigo-950/65 via-orange-950/15 to-transparent",
    },
    night: {
      image: "/images/landscapes/summer-night.jpg",
      location: "イタリア・アマルフィ",
      greeting: "こんばんは",
      message: "今日もよく頑張りました。",
      overlay: "from-slate-950/75 via-indigo-950/30 to-transparent",
    },
  },

  autumn: {
    morning: {
      image: "/images/landscapes/autumn-morning.jpg",
      location: "カナダ・バンフ",
      greeting: "おはようございます",
      message: "焦らず、自分らしい歩幅で。",
      overlay: "from-amber-950/55 via-slate-900/15 to-transparent",
    },
    day: {
      image: "/images/landscapes/autumn-day.jpg",
      location: "ドイツ・バイエルン",
      greeting: "こんにちは",
      message: "学ぶほどに、世界は面白くなる。",
      overlay: "from-amber-950/55 via-slate-900/10 to-transparent",
    },
    evening: {
      image: "/images/landscapes/autumn-evening.jpg",
      location: "チェコ・プラハ",
      greeting: "お疲れさまです",
      message: "積み重ねた時間を大切に。",
      overlay: "from-orange-950/65 via-indigo-950/15 to-transparent",
    },
    night: {
      image: "/images/landscapes/autumn-night.jpg",
      location: "チェコ・プラハ",
      greeting: "こんばんは",
      message: "今日の自分に、小さな拍手を。",
      overlay: "from-slate-950/80 via-amber-950/25 to-transparent",
    },
  },

  winter: {
    morning: {
      image: "/images/landscapes/winter-morning.jpg",
      location: "スイス・アルプス",
      greeting: "おはようございます",
      message: "澄んだ空気と、新しい気持ちで。",
      overlay: "from-slate-950/50 via-blue-950/10 to-transparent",
    },
    day: {
      image: "/images/landscapes/winter-day.jpg",
      location: "フィンランド・ラップランド",
      greeting: "こんにちは",
      message: "今日の小さな一歩を大切に。",
      overlay: "from-slate-950/55 via-blue-950/10 to-transparent",
    },
    evening: {
      image: "/images/landscapes/winter-evening.jpg",
      location: "アイスランド",
      greeting: "お疲れさまです",
      message: "温かい気持ちで、一日を締めくくろう。",
      overlay: "from-indigo-950/70 via-slate-900/20 to-transparent",
    },
    night: {
      image: "/images/landscapes/winter-night.jpg",
      location: "ノルウェー・ロフォーテン諸島",
      greeting: "こんばんは",
      message: "ゆっくり休んで、また明日。",
      overlay: "from-slate-950/80 via-indigo-950/35 to-transparent",
    },
  },
};

function getSeason(date: Date): Season {
  const month = date.getMonth() + 1;

  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
}

function getTimeOfDay(date: Date): TimeOfDay {
  const hour = date.getHours();

  if (hour >= 5 && hour < 11) return "morning";
  if (hour >= 11 && hour < 16) return "day";
  if (hour >= 16 && hour < 19) return "evening";
  return "night";
}

export default function TodayHeader({
  completedCount,
  totalCount,
  totalTarget,
}: TodayHeaderProps) {
  const [now, setNow] = useState<Date | null>(null);
  const [imageFailed, setImageFailed] = useState(false);

  // 初回表示と、その後の時間帯変更を反映
  useEffect(() => {
    const updateTime = () => setNow(new Date());

    updateTime();

    const timer = window.setInterval(updateTime, 60_000);

    return () => window.clearInterval(timer);
  }, []);

  const season = now ? getSeason(now) : "summer";
  const timeOfDay = now ? getTimeOfDay(now) : "morning";
  const scene = scenes[season][timeOfDay];

  // 背景画像が変わったらエラー状態をリセット
  useEffect(() => {
    setImageFailed(false);
  }, [scene.image]);

  const progress = totalCount
    ? Math.round((completedCount / totalCount) * 100)
    : 0;

  const dateText = now
    ? new Intl.DateTimeFormat("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
      }).format(now)
    : "";

  return (
    <header className="relative isolate mb-8 overflow-hidden rounded-[28px] bg-gradient-to-br from-sky-100 via-blue-100 to-indigo-200 shadow-sm">
      {/* 背景写真 */}
      {!imageFailed && (
        <img
          key={scene.image}
          src={scene.image}
          alt=""
          aria-hidden="true"
          onError={() => setImageFailed(true)}
          className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
        />
      )}

      {/* 写真の明るさに応じて文字を読みやすくする */}
      <div
        aria-hidden="true"
        className={`absolute inset-0 -z-10 bg-gradient-to-r ${scene.overlay}`}
      />

      <div className="p-5 sm:p-8 lg:p-10">
        {/* 日付と風景の情報 */}
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-medium tracking-wide text-white/90 drop-shadow sm:text-sm">
            {dateText}
          </p>

          <span className="rounded-full border border-white/50 bg-white/20 px-3 py-1.5 text-xs text-white backdrop-blur-md">
            {scene.location}
          </span>
        </div>

        {/* 挨拶 */}
        <div className="mb-8 mt-8 max-w-xl">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-white drop-shadow-md sm:text-4xl lg:text-5xl">
            {scene.greeting}
            <span className="ml-2 inline-block">☀️</span>
          </h1>

          <p className="mt-4 text-sm leading-7 text-white drop-shadow sm:text-base">
            {scene.message}
            <br />
            小さな一歩が、未来の自分につながります。
          </p>
        </div>

        {/* 進捗カード */}
        <section
          aria-label="今日の学習進捗"
          className="rounded-2xl border border-white/70 bg-white/85 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl sm:p-6"
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-6">
            <div className="flex items-center gap-4">
              <div
                className="relative flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(#4385c8 ${progress}%, #dce7f3 ${progress}% 100%)`,
                }}
                role="img"
                aria-label={`達成率 ${progress}%`}
              >
                <div className="flex h-[62px] w-[62px] items-center justify-center rounded-full bg-white text-lg font-semibold text-[#244f7d]">
                  {progress}%
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-[#244f7d]">
                  今日の達成率
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {completedCount} / {totalCount} 件完了
                </p>
              </div>
            </div>

            <div className="hidden h-12 w-px bg-slate-200 sm:block" />

            <div>
              <p className="text-sm text-slate-500">
                ◎　今日の学習目標
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-[#244f7d]">
                {totalTarget.toLocaleString()}
                <span className="ml-2 text-sm font-normal text-slate-500">
                  目標単語数
                </span>
              </p>
            </div>
          </div>

          <div className="mt-5 border-t border-slate-200/80 pt-4 text-right">
            <p className="font-serif text-sm italic tracking-wide text-[#6083a9]">
              Small steps, big changes.
            </p>
          </div>
        </section>
      </div>
    </header>
  );
}
