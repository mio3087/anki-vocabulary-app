
export type LanguageId = string;

export type LanguageInfo = {
  id: LanguageId;
  name: string;
  color: string;
  lightColor: string;
  studyCountries: string[];
  speakingCountries: string[];
};

export const languages: LanguageInfo[] = [
  {
    id: "de",
    name: "ドイツ語",
    color: "#718675",
    lightColor: "#DCE6DD",
    // ドイツ語が公用語・主要な使用言語である地域
    studyCountries: [
      "040", // オーストリア
      "276", // ドイツ
      "756", // スイス
      "438", // リヒテンシュタイン
      "442", // ルクセンブルク
      "056", // ベルギー（ドイツ語圏あり）
    ],
    speakingCountries: [],
  },
  {
    id: "es",
    name: "スペイン語",
    color: "#D58A52",
    lightColor: "#F5E1CF",
    // スペイン語が公用語・広く使われる国
    studyCountries: [
      "724", // スペイン
      "032", // アルゼンチン
      "068", // ボリビア
      "152", // チリ
      "170", // コロンビア
      "188", // コスタリカ
      "192", // キューバ
      "214", // ドミニカ共和国
      "218", // エクアドル
      "222", // エルサルバドル
      "320", // グアテマラ
      "340", // ホンジュラス
      "484", // メキシコ
      "558", // ニカラグア
      "591", // パナマ
      "600", // パラグアイ
      "604", // ペルー
      "858", // ウルグアイ
      "862", // ベネズエラ
      "226", // 赤道ギニア
    ],
    speakingCountries: [],
  },
  {
    id: "en",
    name: "英語",
    color: "#9B83C8",
    lightColor: "#E8DFF5",
    studyCountries: [
      "826", // イギリス
      "840", // アメリカ
      "124", // カナダ
      "036", // オーストラリア
      "554", // ニュージーランド
      "372", // アイルランド
      "356", // インド
      "710", // 南アフリカ
      "234", // フェロー諸島ではなく、フェロー諸島のコード
      "566", // ナイジェリア
      "288", // ガーナ
      "404", // ケニア
      "800", // ウガンダ
      "050", // バングラデシュ
      "458", // マレーシア
      "702", // シンガポール
      "356", // インド
      "044", // バハマ
      "052", // バルバドス
      "090", // ソロモン諸島
      "548", // バヌアツ
      "690", // セーシェル
      "426", // レソト
      "748", // エスワティニ
      "516", // ナミビア
      "072", // ボツワナ
      "894", // ザンビア
      "716", // ジンバブエ
      "388", // ジャマイカ
      ".tt",
    ],
    speakingCountries: [],
  },
  {
    id: "zh",
    name: "中国語",
    color: "#C96C70",
    lightColor: "#F1D9DA",
    studyCountries: [
      "156", // 中国
      "158", // 台湾
      "702", // シンガポール
    ],
    speakingCountries: [],
  },
  {
    id: "ko",
    name: "韓国語",
    color: "#8D79B7",
    lightColor: "#E5DFF1",
    studyCountries: [
      "410", // 韓国
      "408", // 北朝鮮
    ],
    speakingCountries: [],
  },
  {
    id: "it",
    name: "イタリア語",
    color: "#B39A35",
    lightColor: "#F3EDCF",
    studyCountries: [
      "380", // イタリア
      "674", // サンマリノ
      "336", // バチカン市国
      "756", // スイス（イタリア語圏あり）
    ],
    speakingCountries: [],
  },
];
