
export type StoryChoice = {
  text: string;
  next: number;
  score: number;
};

export type StoryScene = {
  speaker: string;
  chinese: string;
  pinyin: string;
  japanese: string;
  question: string;
  choices: StoryChoice[];
};

export type StoryChapter = {
  id: number;
  title: string;
  scenes: StoryScene[];
};

export const chapters: StoryChapter[] = [
  {
    id: 1,
    title: "秦国からの密書",
    scenes: [
      {
        speaker: "秦国の使者",
        chinese: "若贵国愿与秦国结盟，我国愿意提供援助。",
        pinyin:
          "Ruò guìguó yuàn yǔ Qín guó jiéméng, wǒ guó yuànyì tígōng yuánzhù.",
        japanese:
          "もし貴国が秦国との同盟を望むなら、我が国は援助を提供する用意があります。",
        question: "使者の提案を理解できましたか？",
        choices: [
          {
            text: "援助と引き換えに同盟を提案している",
            next: 1,
            score: 1,
          },
          {
            text: "秦国が直ちに戦争を始めると宣言している",
            next: 1,
            score: 0,
          },
          {
            text: "秦国が貴国への援助を拒否している",
            next: 1,
            score: 0,
          },
        ],
      },
      {
        speaker: "秦国の使者",
        chinese: "不知贵国对此有何看法？",
        pinyin: "Bù zhī guìguó duì cǐ yǒu hé kànfǎ?",
        japanese: "この件について、貴国はどのようにお考えでしょうか？",
        question: "外交官として、どう返答しますか？",
        choices: [
          {
            text: "请问，秦国希望我们提供什么？",
            next: 2,
            score: 1,
          },
          { text: "我们不想听。", next: 2, score: 0 },
          { text: "我不知道。", next: 2, score: 0 },
        ],
      },
      {
        speaker: "秦国の使者",
        chinese: "我们希望贵国认真考虑这次结盟。",
        pinyin:
          "Wǒmen xīwàng guìguó rènzhēn kǎolǜ zhè cì jiéméng.",
        japanese:
          "我々は貴国が今回の同盟を真剣に検討することを望みます。",
        question: "次は君主に報告しましょう。",
        choices: [
          {
            text: "同盟の条件と危険性を君主に報告する",
            next: 3,
            score: 1,
          },
          {
            text: "内容を確認せず同盟を承諾する",
            next: 3,
            score: 0,
          },
          {
            text: "手紙を隠して報告しない",
            next: 3,
            score: 0,
          },
        ],
      },
    ],
  },
];
