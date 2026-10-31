
"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Target,
  Search,
  Brain,
  ChartNoAxesColumn,
  CheckCircle2,
  Headphones,
  PenLine,
  MessageCircle,
  Lightbulb,
} from "lucide-react";

const steps = [
  {
    number: "01",
    title: "分析する教材を選ぶ",
    description:
      "実際に学習した文章・ニュース・音声などを選びます。教材を最後まで学習してからでも、途中で難しさを感じた段階でも構いません。",
    action: "言語とスキルを選び、教材名を入力する",
    result: "どの言語の、どの能力を検証した記録なのかが分かります。",
    icon: BookOpen,
  },
  {
    number: "02",
    title: "理解度を予測する",
    description:
      "答え合わせや辞書での確認をする前に、自分がどれくらい理解できたと思うかを考えます。",
    action: "自信度のスライダーを動かす",
    result: "自分の主観的な理解度を記録できます。",
    icon: Target,
  },
  {
    number: "03",
    title: "実際に理解できているか検証する",
    description:
      "ここがReality Checkの中心です。単に分かった気がするかではなく、実際に知識を使えるかを確認します。",
    action: "下のスキル別の検証方法を試す",
    result: "理解できている部分と、理解できていない部分を区別できます。",
    icon: Search,
  },
  {
    number: "04",
    title: "実際の理解度を評価する",
    description:
      "検証して分かったことをもとに、実際の理解度を数値で入力します。",
    action: "実際の理解度のスライダーを動かす",
    result: "自信度と実際の理解度の差が明らかになります。",
    icon: Brain,
  },
  {
    number: "05",
    title: "誤解の種類を記録する",
    description:
      "今回どこでつまずいたのかを選びます。複数選択できます。",
    action: "語彙・文法・構造・推論などを選択する",
    result: "自分が繰り返し間違える原因を分析できるようになります。",
    icon: Lightbulb,
  },
  {
    number: "06",
    title: "分析結果を保存する",
    description:
      "気づいたことや、次回気をつけたいことをメモして保存します。",
    action: "分析内容を確認して保存する",
    result: "検証した教材数、誤解の傾向、理解度の変化を蓄積できます。",
    icon: CheckCircle2,
  },
];

const skills = [
  {
    title: "Reading",
    subtitle: "文章を読む",
    icon: BookOpen,
    checks: [
      "文章を閉じて、内容を自分の言葉で説明できるか",
      "重要な単語を文脈に合った意味で理解しているか",
      "筆者の主張と、その根拠を説明できるか",
      "文章の前後関係や因果関係を理解しているか",
    ],
    discovery:
      "読めたつもりでも、語彙・文構造・論理関係を誤解していたことが分かります。",
  },
  {
    title: "Listening",
    subtitle: "音声を聞く",
    icon: Headphones,
    checks: [
      "聞いた内容を音声なしで説明できるか",
      "否定・条件・数字を正確に聞き取れたか",
      "聞き取れなかった箇所と意味が分からなかった箇所を区別できるか",
      "音声の内容を別の言葉で言い換えられるか",
    ],
    discovery:
      "音が聞こえなかったのか、聞こえたのに意味を理解できなかったのかが分かります。",
  },
  {
    title: "Writing",
    subtitle: "文章を書く",
    icon: PenLine,
    checks: [
      "伝えたい内容を外国語で組み立てられるか",
      "文法や語彙を適切に使えているか",
      "母語からの直訳になっていないか",
      "読み手に意図が正しく伝わる文章か",
    ],
    discovery:
      "知っている単語や文法を、実際の文章で使えているかが分かります。",
  },
  {
    title: "Speaking",
    subtitle: "言葉で伝える",
    icon: MessageCircle,
    checks: [
      "準備なしで質問に答えられるか",
      "言いたいことをすぐに言葉にできるか",
      "別の表現を使って説明し直せるか",
      "予想外の質問にも対応できるか",
    ],
    discovery:
      "知識として知っていることと、会話中に瞬時に使えることの違いが分かります。",
  },
];

export default function RealityCheckGuidePage() {
  const themeColor = "var(--anki-theme-color)";
  const themeDark = "var(--anki-theme-dark)";
  const themeLight = "var(--anki-theme-light)";
  const themeSoft = "var(--anki-theme-soft)";

  return (
    <main className="min-h-screen bg-[#f7f8f5] px-5 py-10 text-[#303a32]">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/understanding-analytics"
          className="mb-8 inline-flex items-center gap-2 text-sm transition hover:opacity-70"
          style={{ color: themeDark }}
        >
          <ArrowLeft size={16} />
          Reality Check に戻る
        </Link>

        <header className="mb-12">
          <p
            className="mb-3 text-xs font-semibold tracking-[0.2em]"
            style={{ color: themeDark }}
          >
            REALITY CHECK / USER GUIDE
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            「分かったつもり」を見つける
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-[#68766b]">
            自分では理解できたと思っていても、実際には説明できない、
            思い出せない、使えないことがあります。
            Reality Checkは、その認識と実力の差を見つけるための記録ツールです。
          </p>
        </header>

        <section className="mb-14">
          <h2 className="mb-6 text-xl font-semibold">基本の使い方</h2>
          <div className="space-y-4">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <article
                  key={step.number}
                  className="rounded-2xl border border-[#e5e9e3] bg-white p-5 sm:p-6"
                >
                  <div className="flex gap-4">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor: themeLight,
                        color: themeDark,
                      }}
                    >
                      <Icon size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-xs font-semibold tracking-widest"
                        style={{ color: themeDark }}
                      >
                        STEP {step.number}
                      </p>
                      <h3 className="mt-1 text-base font-semibold">
                        {step.title}
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-[#68766b]">
                        {step.description}
                      </p>
                      <div
                        className="mt-4 rounded-xl p-4"
                        style={{ backgroundColor: themeLight }}
                      >
                        <p
                          className="text-xs font-semibold"
                          style={{ color: themeDark }}
                        >
                          操作すること
                        </p>
                        <p className="mt-1 text-sm">{step.action}</p>
                        <p
                          className="mt-3 text-xs font-semibold"
                          style={{ color: themeDark }}
                        >
                          分かるようになること
                        </p>
                        <p className="mt-1 text-sm leading-6 text-[#68766b]">
                          {step.result}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mb-14">
          <h2 className="mb-2 text-xl font-semibold">
            スキル別の検証方法
          </h2>
          <p className="mb-6 text-sm leading-6 text-[#68766b]">
            どのスキルを選んだかによって、実際に確認する内容が変わります。
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {skills.map((skill) => {
              const Icon = skill.icon;
              return (
                <article
                  key={skill.title}
                  className="rounded-2xl border border-[#e5e9e3] bg-white p-5"
                >
                  <div className="flex items-center gap-3">
                    <Icon size={20} style={{ color: themeColor }} />
                    <div>
                      <h3 className="font-semibold">{skill.title}</h3>
                      <p className="text-xs text-[#829184]">
                        {skill.subtitle}
                      </p>
                    </div>
                  </div>
                  <ul className="mt-5 space-y-3">
                    {skill.checks.map((check) => (
                      <li
                        key={check}
                        className="flex gap-2 text-sm leading-6 text-[#59665c]"
                      >
                        <span
                          className="mt-0.5 font-semibold"
                          style={{ color: themeColor }}
                        >
                          ✓
                        </span>
                        <span>{check}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 border-t border-[#edf0eb] pt-4">
                    <p
                      className="text-xs font-semibold"
                      style={{ color: themeDark }}
                    >
                      この検証で分かること
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#68766b]">
                      {skill.discovery}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section
          className="mb-12 rounded-2xl border p-6 sm:p-8"
          style={{
            borderColor: themeSoft,
            backgroundColor: themeLight,
          }}
        >
          <p
            className="text-xs font-semibold tracking-widest"
            style={{ color: themeDark }}
          >
            UNDERSTANDING GAP
          </p>
          <h2 className="mt-3 text-xl font-semibold">
            自信度と実際の理解度の差に注目する
          </h2>
          <p className="mt-3 text-sm leading-7 text-[#59665c]">
            例えば、自分では80%理解できたと思っていたのに、
            検証してみると実際には50%しか理解できていなかった場合、
            その差は30ポイントです。
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white p-4">
              <p className="text-xs text-[#829184]">自信度</p>
              <p
                className="mt-1 text-3xl font-semibold"
                style={{ color: themeDark }}
              >
                80%
              </p>
            </div>
            <div className="rounded-xl bg-white p-4">
              <p className="text-xs text-[#829184]">実際の理解度</p>
              <p className="mt-1 text-3xl font-semibold text-orange-500">
                50%
              </p>
            </div>
          </div>
          <p
            className="mt-4 text-sm font-semibold"
            style={{ color: themeDark }}
          >
            理解度の見積もりに30ポイントの差があることが分かります。
          </p>
        </section>

        <section className="mb-12">
          <h2 className="mb-3 text-xl font-semibold">
            記録するときの大切なルール
          </h2>
          <ul className="space-y-3 text-sm leading-7 text-[#59665c]">
            <li>・自信度は、答え合わせや調査をする前に入力する。</li>
            <li>・実際の理解度は、検証した結果をもとに入力する。</li>
            <li>・分からなかったことを無理に理解できたことにしない。</li>
            <li>・一度の結果だけで自分の能力を決めつけない。</li>
            <li>・同じ誤解が繰り返されていないか、記録を蓄積して確認する。</li>
          </ul>
        </section>

        <div className="rounded-2xl border border-[#e5e9e3] bg-white p-6 text-center">
          <ChartNoAxesColumn
            className="mx-auto"
            style={{ color: themeColor }}
            size={25}
          />
          <h2 className="mt-3 text-lg font-semibold">
            さっそく検証してみましょう
          </h2>
          <p className="mt-2 text-sm text-[#68766b]">
            小さな教材ひとつから始めて大丈夫です。
          </p>
          <Link
            href="/understanding-analytics/new"
            className="mt-5 inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: themeColor }}
          >
            新しい分析を記録する
          </Link>
        </div>
      </div>
    </main>
  );
}
