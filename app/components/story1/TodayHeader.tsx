
"use client";

import { useEffect, useState } from "react";
import { useAppLanguage } from "@/app/component/AppLanguage";

type TodayHeaderProps = {
  completedCount?: number;
  totalCount?: number;
  totalTarget?: number;
};

type LanguageCode = "ja" | "de" | "en" | "zh-CN" | "zh-TW" | "es";

type Season = "spring" | "summer" | "autumn" | "winter";
type TimeOfDay = "morning" | "day" | "evening" | "night";

type Scene = {
  image: string;
  location: string;
  greeting: string;
  message: string;
  overlay: string;
};

type SceneText = {
  location: string;
  greeting: string;
  message: string;
};

const sceneImages: Record<Season, Record<TimeOfDay, string>> = {
  spring: {
    morning: "/images/landscapes/spring-morning.jpg",
    day: "/images/landscapes/spring-day.jpg",
    evening: "/images/landscapes/spring-evening.jpg",
    night: "/images/landscapes/spring-night.jpg",
  },
  summer: {
    morning: "/images/landscapes/summer-morning.jpg",
    day: "/images/landscapes/summer-day.jpg",
    evening: "/images/landscapes/summer-evening.jpg",
    night: "/images/landscapes/summer-night.jpg",
  },
  autumn: {
    morning: "/images/landscapes/autumn-morning.jpg",
    day: "/images/landscapes/autumn-day.jpg",
    evening: "/images/landscapes/autumn-evening.jpg",
    night: "/images/landscapes/autumn-night.jpg",
  },
  winter: {
    morning: "/images/landscapes/winter-morning.jpg",
    day: "/images/landscapes/winter-day.jpg",
    evening: "/images/landscapes/winter-evening.jpg",
    night: "/images/landscapes/winter-night.jpg",
  },
};

const overlays: Record<Season, Record<TimeOfDay, string>> = {
  spring: {
    morning: "from-rose-950/55 via-slate-900/15 to-transparent",
    day: "from-slate-900/55 via-slate-900/10 to-transparent",
    evening: "from-indigo-950/65 via-orange-950/15 to-transparent",
    night: "from-slate-950/75 via-indigo-950/35 to-transparent",
  },
  summer: {
    morning: "from-blue-950/55 via-blue-900/15 to-transparent",
    day: "from-blue-950/60 via-blue-900/10 to-transparent",
    evening: "from-indigo-950/65 via-orange-950/15 to-transparent",
    night: "from-slate-950/75 via-indigo-950/30 to-transparent",
  },
  autumn: {
    morning: "from-amber-950/55 via-slate-900/15 to-transparent",
    day: "from-amber-950/55 via-slate-900/10 to-transparent",
    evening: "from-orange-950/65 via-indigo-950/15 to-transparent",
    night: "from-slate-950/80 via-amber-950/25 to-transparent",
  },
  winter: {
    morning: "from-slate-950/50 via-blue-950/10 to-transparent",
    day: "from-slate-950/55 via-blue-950/10 to-transparent",
    evening: "from-indigo-950/70 via-slate-900/20 to-transparent",
    night: "from-slate-950/80 via-indigo-950/35 to-transparent",
  },
};

const sceneTexts: Record<
  LanguageCode,
  Record<Season, Record<TimeOfDay, SceneText>>
> = {
  ja: {
    spring: {
      morning: {
        location: "日本・京都",
        greeting: "おはようございます",
        message: "新しい一日。新しい発見を。",
      },
      day: {
        location: "オランダ・キューケンホフ",
        greeting: "こんにちは",
        message: "好奇心のままに、学んでみよう。",
      },
      evening: {
        location: "フランス・パリ",
        greeting: "お疲れさまです",
        message: "今日の努力を、明日の力に。",
      },
      night: {
        location: "日本・京都",
        greeting: "こんばんは",
        message: "静かな夜に、自分のペースで。",
      },
    },
    summer: {
      morning: {
        location: "ギリシャ・サントリーニ島",
        greeting: "おはようございます",
        message: "今日も、好きなことをコツコツと。",
      },
      day: {
        location: "イタリア・アマルフィ",
        greeting: "こんにちは",
        message: "青空のように、視野を広げよう。",
      },
      evening: {
        location: "スペイン・バルセロナ",
        greeting: "お疲れさまです",
        message: "一歩ずつ、世界が広がっていく。",
      },
      night: {
        location: "イタリア・アマルフィ",
        greeting: "こんばんは",
        message: "今日もよく頑張りました。",
      },
    },
    autumn: {
      morning: {
        location: "カナダ・バンフ",
        greeting: "おはようございます",
        message: "焦らず、自分らしい歩幅で。",
      },
      day: {
        location: "ドイツ・バイエルン",
        greeting: "こんにちは",
        message: "学ぶほどに、世界は面白くなる。",
      },
      evening: {
        location: "チェコ・プラハ",
        greeting: "お疲れさまです",
        message: "積み重ねた時間を大切に。",
      },
      night: {
        location: "チェコ・プラハ",
        greeting: "こんばんは",
        message: "今日の自分に、小さな拍手を。",
      },
    },
    winter: {
      morning: {
        location: "スイス・アルプス",
        greeting: "おはようございます",
        message: "澄んだ空気と、新しい気持ちで。",
      },
      day: {
        location: "フィンランド・ラップランド",
        greeting: "こんにちは",
        message: "今日の小さな一歩を大切に。",
      },
      evening: {
        location: "アイスランド",
        greeting: "お疲れさまです",
        message: "温かい気持ちで、一日を締めくくろう。",
      },
      night: {
        location: "ノルウェー・ロフォーテン諸島",
        greeting: "こんばんは",
        message: "ゆっくり休んで、また明日。",
      },
    },
  },

  de: {
    spring: {
      morning: {
        location: "Kyoto, Japan",
        greeting: "Guten Morgen",
        message: "Ein neuer Tag. Neue Entdeckungen.",
      },
      day: {
        location: "Keukenhof, Niederlande",
        greeting: "Guten Tag",
        message: "Lerne mit Neugier und Freude.",
      },
      evening: {
        location: "Paris, Frankreich",
        greeting: "Schön, dass du heute da warst",
        message: "Was du heute lernst, stärkt dich morgen.",
      },
      night: {
        location: "Kyoto, Japan",
        greeting: "Guten Abend",
        message: "Genieße die Ruhe und lerne in deinem Tempo.",
      },
    },
    summer: {
      morning: {
        location: "Santorin, Griechenland",
        greeting: "Guten Morgen",
        message: "Widme dich auch heute den Dingen, die du liebst.",
      },
      day: {
        location: "Amalfiküste, Italien",
        greeting: "Guten Tag",
        message: "Erweitere deinen Horizont wie den blauen Himmel.",
      },
      evening: {
        location: "Barcelona, Spanien",
        greeting: "Du hast heute viel geschafft",
        message: "Mit jedem Schritt wird deine Welt ein Stück größer.",
      },
      night: {
        location: "Amalfiküste, Italien",
        greeting: "Guten Abend",
        message: "Du hast heute dein Bestes gegeben.",
      },
    },
    autumn: {
      morning: {
        location: "Banff, Kanada",
        greeting: "Guten Morgen",
        message: "Keine Eile. Geh deinen eigenen Weg.",
      },
      day: {
        location: "Bayern, Deutschland",
        greeting: "Guten Tag",
        message: "Je mehr du lernst, desto spannender wird die Welt.",
      },
      evening: {
        location: "Prag, Tschechien",
        greeting: "Du hast heute viel geschafft",
        message: "Schätze die Zeit, die du investiert hast.",
      },
      night: {
        location: "Prag, Tschechien",
        greeting: "Guten Abend",
        message: "Schenke dir selbst einen kleinen Applaus.",
      },
    },
    winter: {
      morning: {
        location: "Schweizer Alpen",
        greeting: "Guten Morgen",
        message: "Mit klarer Luft und neuer Energie.",
      },
      day: {
        location: "Lappland, Finnland",
        greeting: "Guten Tag",
        message: "Jeder kleine Schritt zählt.",
      },
      evening: {
        location: "Island",
        greeting: "Du hast heute viel geschafft",
        message: "Lass den Tag mit einem warmen Gefühl ausklingen.",
      },
      night: {
        location: "Lofoten, Norwegen",
        greeting: "Guten Abend",
        message: "Erhol dich gut. Bis morgen!",
      },
    },
  },

  en: {
    spring: {
      morning: {
        location: "Kyoto, Japan",
        greeting: "Good morning",
        message: "A new day. A new discovery.",
      },
      day: {
        location: "Keukenhof, Netherlands",
        greeting: "Hello",
        message: "Follow your curiosity and enjoy learning.",
      },
      evening: {
        location: "Paris, France",
        greeting: "Well done today",
        message: "Today's effort becomes tomorrow's strength.",
      },
      night: {
        location: "Kyoto, Japan",
        greeting: "Good evening",
        message: "Take your time and enjoy the quiet evening.",
      },
    },
    summer: {
      morning: {
        location: "Santorini, Greece",
        greeting: "Good morning",
        message: "Make time for what you love today.",
      },
      day: {
        location: "Amalfi, Italy",
        greeting: "Hello",
        message: "Broaden your horizons like the blue sky.",
      },
      evening: {
        location: "Barcelona, Spain",
        greeting: "Well done today",
        message: "With every step, your world grows a little wider.",
      },
      night: {
        location: "Amalfi, Italy",
        greeting: "Good evening",
        message: "You did a great job today.",
      },
    },
    autumn: {
      morning: {
        location: "Banff, Canada",
        greeting: "Good morning",
        message: "No rush. Move at your own pace.",
      },
      day: {
        location: "Bavaria, Germany",
        greeting: "Hello",
        message: "The more you learn, the more fascinating the world becomes.",
      },
      evening: {
        location: "Prague, Czechia",
        greeting: "Well done today",
        message: "Treasure the time and effort you've put in.",
      },
      night: {
        location: "Prague, Czechia",
        greeting: "Good evening",
        message: "Give yourself a little applause today.",
      },
    },
    winter: {
      morning: {
        location: "Swiss Alps",
        greeting: "Good morning",
        message: "A fresh start with crisp air and a clear mind.",
      },
      day: {
        location: "Lapland, Finland",
        greeting: "Hello",
        message: "Every little step matters.",
      },
      evening: {
        location: "Iceland",
        greeting: "Well done today",
        message: "End the day with a warm heart.",
      },
      night: {
        location: "Lofoten Islands, Norway",
        greeting: "Good evening",
        message: "Rest well, and see you tomorrow.",
      },
    },
  },

  "zh-CN": {
    spring: {
      morning: {
        location: "日本・京都",
        greeting: "早上好",
        message: "新的一天，新的发现。",
      },
      day: {
        location: "荷兰・库肯霍夫",
        greeting: "你好",
        message: "跟随好奇心，享受学习的乐趣。",
      },
      evening: {
        location: "法国・巴黎",
        greeting: "今天辛苦了",
        message: "今天的努力，会成为明天的力量。",
      },
      night: {
        location: "日本・京都",
        greeting: "晚上好",
        message: "在安静的夜晚，按照自己的节奏学习。",
      },
    },
    summer: {
      morning: {
        location: "希腊・圣托里尼岛",
        greeting: "早上好",
        message: "今天也坚持做自己喜欢的事吧。",
      },
      day: {
        location: "意大利・阿马尔菲",
        greeting: "你好",
        message: "像蓝天一样，开阔自己的视野。",
      },
      evening: {
        location: "西班牙・巴塞罗那",
        greeting: "今天辛苦了",
        message: "一步一步，世界也在不断扩大。",
      },
      night: {
        location: "意大利・阿马尔菲",
        greeting: "晚上好",
        message: "今天也做得很棒！",
      },
    },
    autumn: {
      morning: {
        location: "加拿大・班夫",
        greeting: "早上好",
        message: "不用着急，按照自己的步调前进。",
      },
      day: {
        location: "德国・巴伐利亚",
        greeting: "你好",
        message: "学得越多，世界就越有趣。",
      },
      evening: {
        location: "捷克・布拉格",
        greeting: "今天辛苦了",
        message: "珍惜自己一点一滴积累的时间。",
      },
      night: {
        location: "捷克・布拉格",
        greeting: "晚上好",
        message: "给今天的自己一个小小的掌声吧。",
      },
    },
    winter: {
      morning: {
        location: "瑞士・阿尔卑斯山",
        greeting: "早上好",
        message: "带着清新的空气和全新的心情开始今天。",
      },
      day: {
        location: "芬兰・拉普兰",
        greeting: "你好",
        message: "珍惜今天迈出的一小步。",
      },
      evening: {
        location: "冰岛",
        greeting: "今天辛苦了",
        message: "带着温暖的心情结束今天吧。",
      },
      night: {
        location: "挪威・罗弗敦群岛",
        greeting: "晚上好",
        message: "好好休息，明天再见。",
      },
    },
  },

  "zh-TW": {
    spring: {
      morning: {
        location: "日本・京都",
        greeting: "早安",
        message: "新的一天，新的發現。",
      },
      day: {
        location: "荷蘭・庫肯霍夫",
        greeting: "你好",
        message: "跟隨好奇心，享受學習的樂趣。",
      },
      evening: {
        location: "法國・巴黎",
        greeting: "今天辛苦了",
        message: "今天的努力，會成為明天的力量。",
      },
      night: {
        location: "日本・京都",
        greeting: "晚安",
        message: "在安靜的夜晚，按照自己的步調學習。",
      },
    },
    summer: {
      morning: {
        location: "希臘・聖托里尼島",
        greeting: "早安",
        message: "今天也持續做自己喜歡的事吧。",
      },
      day: {
        location: "義大利・阿瑪菲",
        greeting: "你好",
        message: "像藍天一樣，開闊自己的視野。",
      },
      evening: {
        location: "西班牙・巴塞隆納",
        greeting: "今天辛苦了",
        message: "一步一步，世界也在不斷擴大。",
      },
      night: {
        location: "義大利・阿瑪菲",
        greeting: "晚安",
        message: "今天也做得很棒！",
      },
    },
    autumn: {
      morning: {
        location: "加拿大・班夫",
        greeting: "早安",
        message: "不用著急，按照自己的步調前進。",
      },
      day: {
        location: "德國・巴伐利亞",
        greeting: "你好",
        message: "學得越多，世界就越有趣。",
      },
      evening: {
        location: "捷克・布拉格",
        greeting: "今天辛苦了",
        message: "珍惜自己一點一滴累積的時間。",
      },
      night: {
        location: "捷克・布拉格",
        greeting: "晚安",
        message: "給今天的自己一個小小的掌聲吧。",
      },
    },
    winter: {
      morning: {
        location: "瑞士・阿爾卑斯山",
        greeting: "早安",
        message: "帶著清新的空氣和全新的心情開始今天。",
      },
      day: {
        location: "芬蘭・拉普蘭",
        greeting: "你好",
        message: "珍惜今天踏出的一小步。",
      },
      evening: {
        location: "冰島",
        greeting: "今天辛苦了",
        message: "帶著溫暖的心情結束今天吧。",
      },
      night: {
        location: "挪威・羅弗敦群島",
        greeting: "晚安",
        message: "好好休息，明天再見。",
      },
    },
  },

  es: {
    spring: {
      morning: {
        location: "Kioto, Japón",
        greeting: "Buenos días",
        message: "Un nuevo día. Un nuevo descubrimiento.",
      },
      day: {
        location: "Keukenhof, Países Bajos",
        greeting: "Hola",
        message: "Sigue tu curiosidad y disfruta aprendiendo.",
      },
      evening: {
        location: "París, Francia",
        greeting: "Buen trabajo hoy",
        message: "El esfuerzo de hoy será la fuerza de mañana.",
      },
      night: {
        location: "Kioto, Japón",
        greeting: "Buenas noches",
        message: "Disfruta de la tranquilidad y aprende a tu ritmo.",
      },
    },
    summer: {
      morning: {
        location: "Santorini, Grecia",
        greeting: "Buenos días",
        message: "Dedica también hoy un rato a lo que te gusta.",
      },
      day: {
        location: "Amalfi, Italia",
        greeting: "Hola",
        message: "Amplía tus horizontes como el cielo azul.",
      },
      evening: {
        location: "Barcelona, España",
        greeting: "Buen trabajo hoy",
        message: "Paso a paso, tu mundo se hace cada vez más grande.",
      },
      night: {
        location: "Amalfi, Italia",
        greeting: "Buenas noches",
        message: "Hoy también has hecho un gran trabajo.",
      },
    },
    autumn: {
      morning: {
        location: "Banff, Canadá",
        greeting: "Buenos días",
        message: "Sin prisas, avanza a tu propio ritmo.",
      },
      day: {
        location: "Baviera, Alemania",
        greeting: "Hola",
        message: "Cuanto más aprendes, más fascinante se vuelve el mundo.",
      },
      evening: {
        location: "Praga, Chequia",
        greeting: "Buen trabajo hoy",
        message: "Valora todo el tiempo que has dedicado.",
      },
      night: {
        location: "Praga, Chequia",
        greeting: "Buenas noches",
        message: "Regálate un pequeño aplauso por el día de hoy.",
      },
    },
    winter: {
      morning: {
        location: "Alpes suizos",
        greeting: "Buenos días",
        message: "Empieza con aire fresco y una nueva actitud.",
      },
      day: {
        location: "Laponia, Finlandia",
        greeting: "Hola",
        message: "Valora cada pequeño paso de hoy.",
      },
      evening: {
        location: "Islandia",
        greeting: "Buen trabajo hoy",
        message: "Termina el día con una sensación cálida.",
      },
      night: {
        location: "Islas Lofoten, Noruega",
        greeting: "Buenas noches",
        message: "Descansa bien. ¡Hasta mañana!",
      },
    },
  },
};

const uiTranslations: Record<LanguageCode, {
  dateLocale: string;
  dateLabel: string;
  greetingExtra: string;
  progressLabel: string;
  completed: string;
  targetLabel: string;
  targetUnit: string;
  ariaProgress: (progress: number) => string;
  motto: string;
}> = {
  ja: {
    dateLocale: "ja-JP",
    dateLabel: "今日の日付",
    greetingExtra: "小さな一歩が、未来の自分につながります。",
    progressLabel: "今日の達成率",
    completed: "件完了",
    targetLabel: "今日の学習目標",
    targetUnit: "目標単語数",
    ariaProgress: (progress) => `達成率 ${progress}%`,
    motto: "Small steps, big changes.",
  },
  de: {
    dateLocale: "de-DE",
    dateLabel: "Heutiges Datum",
    greetingExtra: "Jeder kleine Schritt bringt dich deiner Zukunft näher.",
    progressLabel: "Heutiger Fortschritt",
    completed: "Aufgaben erledigt",
    targetLabel: "Heutiges Lernziel",
    targetUnit: "Zielwortzahl",
    ariaProgress: (progress) => `Fortschritt ${progress}%`,
    motto: "Small steps, big changes.",
  },
  en: {
    dateLocale: "en-US",
    dateLabel: "Today's date",
    greetingExtra: "Every small step brings you closer to your future.",
    progressLabel: "Today's progress",
    completed: "completed",
    targetLabel: "Today's learning goal",
    targetUnit: "Target words",
    ariaProgress: (progress) => `${progress}% completed`,
    motto: "Small steps, big changes.",
  },
  "zh-CN": {
    dateLocale: "zh-CN",
    dateLabel: "今天的日期",
    greetingExtra: "每一个小小的进步，都在连接更好的未来。",
    progressLabel: "今日完成率",
    completed: "项已完成",
    targetLabel: "今日学习目标",
    targetUnit: "目标单词数",
    ariaProgress: (progress) => `完成率 ${progress}%`,
    motto: "Small steps, big changes.",
  },
  "zh-TW": {
    dateLocale: "zh-TW",
    dateLabel: "今天的日期",
    greetingExtra: "每一個小小的進步，都在連結更好的未來。",
    progressLabel: "今日完成率",
    completed: "項已完成",
    targetLabel: "今日學習目標",
    targetUnit: "目標單字數",
    ariaProgress: (progress) => `完成率 ${progress}%`,
    motto: "Small steps, big changes.",
  },
  es: {
    dateLocale: "es-ES",
    dateLabel: "Fecha de hoy",
    greetingExtra: "Cada pequeño paso te acerca a tu futuro.",
    progressLabel: "Progreso de hoy",
    completed: "completadas",
    targetLabel: "Objetivo de aprendizaje de hoy",
    targetUnit: "Palabras objetivo",
    ariaProgress: (progress) => `${progress}% completado`,
    motto: "Small steps, big changes.",
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
  completedCount = 0,
  totalCount = 0,
  totalTarget = 0,
}: TodayHeaderProps) {
  const { language } = useAppLanguage();

  const currentLanguage: LanguageCode =
    language in uiTranslations ? (language as LanguageCode) : "ja";

  const ui = uiTranslations[currentLanguage];

  const [now, setNow] = useState<Date | null>(null);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    const updateTime = () => setNow(new Date());

    updateTime();

    const timer = window.setInterval(updateTime, 60_000);

    return () => window.clearInterval(timer);
  }, []);

  const season = now ? getSeason(now) : "summer";
  const timeOfDay = now ? getTimeOfDay(now) : "morning";

  const scene: Scene = {
    image: sceneImages[season][timeOfDay],
    location: sceneTexts[currentLanguage][season][timeOfDay].location,
    greeting: sceneTexts[currentLanguage][season][timeOfDay].greeting,
    message: sceneTexts[currentLanguage][season][timeOfDay].message,
    overlay: overlays[season][timeOfDay],
  };

  useEffect(() => {
    setImageFailed(false);
  }, [scene.image]);

  const safeCompletedCount = Number.isFinite(completedCount)
    ? Math.max(0, completedCount)
    : 0;

  const safeTotalCount = Number.isFinite(totalCount)
    ? Math.max(0, totalCount)
    : 0;

  const safeTotalTarget = Number.isFinite(totalTarget)
    ? Math.max(0, totalTarget)
    : 0;

  const progress =
    safeTotalCount > 0
      ? Math.min(
          100,
          Math.round((safeCompletedCount / safeTotalCount) * 100)
        )
      : 0;

  const dateText = now
    ? new Intl.DateTimeFormat(ui.dateLocale, {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
      }).format(now)
    : "";

  return (
    <header className="relative isolate mb-8 overflow-hidden rounded-[28px] bg-gradient-to-br from-sky-100 via-blue-100 to-indigo-200 shadow-sm">
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

      <div
        aria-hidden="true"
        className={`absolute inset-0 -z-10 bg-gradient-to-r ${scene.overlay}`}
      />

      <div className="p-5 sm:p-8 lg:p-10">
        <div className="flex items-center justify-between gap-4">
          <p
            aria-label={ui.dateLabel}
            className="text-xs font-medium tracking-wide text-white/90 drop-shadow sm:text-sm"
          >
            {dateText}
          </p>

          <span className="rounded-full border border-white/50 bg-white/20 px-3 py-1.5 text-xs text-white backdrop-blur-md">
            {scene.location}
          </span>
        </div>

        <div className="mb-8 mt-8 max-w-xl">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-white drop-shadow-md sm:text-4xl lg:text-5xl">
            {scene.greeting}
            <span className="ml-2 inline-block">☀️</span>
          </h1>

          <p className="mt-4 text-sm leading-7 text-white drop-shadow sm:text-base">
            {scene.message}
            <br />
            {ui.greetingExtra}
          </p>
        </div>

        <section
          aria-label={ui.progressLabel}
          className="rounded-2xl border border-white/70 bg-white/85 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl sm:p-6"
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-6">
            <div className="flex items-center gap-4">
              <div
                className="relative flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(var(--anki-theme-color) ${progress}%, var(--anki-theme-light) ${progress}% 100%)`,
                }}
                role="img"
                aria-label={ui.ariaProgress(progress)}
              >
                <div
                  className="flex h-[62px] w-[62px] items-center justify-center rounded-full bg-white text-lg font-semibold"
                  style={{ color: "var(--anki-theme-dark)" }}
                >
                  {progress}%
                </div>
              </div>

              <div>
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--anki-theme-dark)" }}
                >
                  {ui.progressLabel}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {safeCompletedCount.toLocaleString(ui.dateLocale)} /{" "}
                  {safeTotalCount.toLocaleString(ui.dateLocale)}{" "}
                  {ui.completed}
                </p>
              </div>
            </div>

            <div className="hidden h-12 w-px bg-slate-200 sm:block" />

            <div>
              <p className="text-sm text-slate-500">
                ◎　{ui.targetLabel}
              </p>
              <p
                className="mt-2 text-2xl font-semibold tracking-tight"
                style={{ color: "var(--anki-theme-dark)" }}
              >
                {safeTotalTarget.toLocaleString(ui.dateLocale)}
                <span className="ml-2 text-sm font-normal text-slate-500">
                  {ui.targetUnit}
                </span>
              </p>
            </div>
          </div>

          <div className="mt-5 border-t border-slate-200/80 pt-4 text-right">
            <p
              className="font-serif text-sm italic tracking-wide"
              style={{ color: "var(--anki-theme-color)" }}
            >
              {ui.motto}
            </p>
          </div>
        </section>
      </div>
    </header>
  );
}
