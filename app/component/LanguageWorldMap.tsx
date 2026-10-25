
"use client";

import { useEffect, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
} from "react-simple-maps";

import { languages as defaultLanguages } from "../data/language-countries";

const geoUrl =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const PROGRESS_KEY = "language-world-progress";
const LANGUAGES_KEY = "language-world-custom-languages";

const levels = [
  { value: 0, label: "未学習", description: "まだこれから" },
  { value: 1, label: "学習中", description: "淡い色" },
  { value: 2, label: "少し話せる", description: "中くらいの色" },
  { value: 3, label: "話せる！", description: "濃い色" },
] as const;

type Language = {
  id: string;
  name: string;
  color: string;
  lightColor: string;
  studyCountries: string[];
  speakingCountries: string[];
};

type Progress = Record<string, number>;

type SelectedCountry = {
  id: string;
  name: string;
} | null;

function getCountryId(id: string | number) {
  return String(id).padStart(3, "0");
}

function getKey(languageId: string, countryId: string) {
  return `${languageId}:${countryId}`;
}

function getLightColor(hex: string) {
  const value = hex.replace("#", "");
  const number = parseInt(value, 16);

  if (value.length !== 6 || Number.isNaN(number)) {
    return "#DCE6DD";
  }

  const mix = (channel: number) =>
    Math.round(channel + (255 - channel) * 0.78);

  const channels = [
    (number >> 16) & 255,
    (number >> 8) & 255,
    number & 255,
  ];

  return (
    "#" +
    channels
      .map((channel) => mix(channel).toString(16).padStart(2, "0"))
      .join("")
  );
}

function getColor(language: Language, level: number) {
  if (level === 1) return language.lightColor;
  if (level === 2) return `${language.color}B3`;
  if (level === 3) return language.color;
  return "#E8E8E3";
}

// 言語名から自動で色付けする国を判定するための国コード（ISO numeric）。
// 国単位の地図なので、複数言語が使われる国は国全体が色付きます。
const automaticCountrySets: Record<string, string[]> = {
  "フランス語": [
    "250", "056", "756", "124", "442", "492", "204", "854", "140",
    "148", "174", "384", "180", "178", "262", "226", "266", "450",
    "466", "466", "562", "646", "690", "768", "332", "324", "686",
    "624", "430", "450", "678", "548", "638",
  ],
  "ポルトガル語": [
    "076", "620", "024", "508", "624", "132", "678", "626", "226",
  ],
  "ロシア語": ["643", "112", "398", "417", "417", "762", "795"],
  "日本語": ["392"],
  "オランダ語": ["528", "056", "740", "740"],
  "韓国語": ["410", "408"],
  "中国語": ["156", "158", "702"],
  "イタリア語": ["380", "674", "336", "756"],
  "ドイツ語": ["276", "040", "756", "438", "442", "056"],
  "スペイン語": [
    "724", "032", "068", "152", "170", "188", "192", "214", "218",
    "222", "320", "340", "484", "558", "591", "600", "604", "858",
    "862", "226", "068",
  ],
  "英語": [
    "826", "840", "124", "036", "554", "372", "356", "710", "566",
    "288", "404", "800", "050", "458", "702", "044", "052", "090",
    "548", "690", "426", "748", "516", "072", "894", "716", "388",
    "780",
  ],
};

function getAutomaticCountries(language: Language) {
  const normalizedName = language.name.trim().toLowerCase();
  const byName =
    automaticCountrySets[language.name.trim()] ??
    Object.entries(automaticCountrySets).find(
      ([name]) => name.toLowerCase() === normalizedName
    )?.[1] ??
    [];
  return Array.from(new Set([...language.studyCountries, ...byName]));
}

export default function LanguageWorldMap() {
  const [languageList, setLanguageList] = useState<Language[]>(
    defaultLanguages
  );
  const [selectedLanguageId, setSelectedLanguageId] = useState(
    defaultLanguages[0]?.id ?? ""
  );
  const [selectedCountry, setSelectedCountry] =
    useState<SelectedCountry>(null);
  const [progress, setProgress] = useState<Progress>({});
  const [newLanguageName, setNewLanguageName] = useState("");
  const [newLanguageColor, setNewLanguageColor] = useState("#718675");
  const [showAddLanguage, setShowAddLanguage] = useState(false);
  const [editingLanguageId, setEditingLanguageId] = useState<string | null>(
    null
  );
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("#718675");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const savedLanguages = localStorage.getItem(LANGUAGES_KEY);
      const savedProgress = localStorage.getItem(PROGRESS_KEY);

      if (savedLanguages) {
        const parsed = JSON.parse(savedLanguages) as Language[];

        if (Array.isArray(parsed) && parsed.length > 0) {
          setLanguageList(parsed);
          setSelectedLanguageId(parsed[0].id);
        }
      }

      if (savedProgress) {
        setProgress(JSON.parse(savedProgress) as Progress);
      }
    } catch {
      console.warn("Language Worldの保存データを読み込めませんでした。");
    }

    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;

    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
      localStorage.setItem(LANGUAGES_KEY, JSON.stringify(languageList));
    } catch {
      console.warn("Language Worldの保存に失敗しました。");
    }
  }, [progress, languageList, ready]);

  const selectedLanguage = languageList.find(
    (language) => language.id === selectedLanguageId
  );

  function getLevel(languageId: string, countryId: string) {
    const key = getKey(languageId, countryId);

    // ユーザーが個別設定した値（未学習の0も含む）を最優先する。
    if (Object.prototype.hasOwnProperty.call(progress, key)) {
      return progress[key];
    }

    const language = languageList.find((item) => item.id === languageId);
    if (!language) return 0;

    if (language.speakingCountries.includes(countryId)) return 3;
    if (getAutomaticCountries(language).includes(countryId)) return 1;

    return 0;
  }

  function updateLevel(level: number) {
    if (!selectedCountry) return;

    const key = getKey(selectedLanguageId, selectedCountry.id);

    setProgress((previous) => {
      const next = { ...previous };

      // 0も保存しておくことで、自動色付けされた国を手動で未学習に戻せる。
      next[key] = level;
      return next;
    });
  }

  function colorAllStudyCountries(level: number) {
    if (!selectedLanguage) return;

    setProgress((previous) => {
      const next = { ...previous };

      for (const countryId of getAutomaticCountries(selectedLanguage)) {
        const key = getKey(selectedLanguage.id, countryId);
        // 一括解除も明示的な0として保存し、自動色付けに戻らないようにする。
        next[key] = level;
      }

      return next;
    });
  }

  function addLanguage() {
    const name = newLanguageName.trim();

    if (!name) {
      alert("言語名を入力してね。");
      return;
    }

    if (
      languageList.some(
        (language) => language.name.toLowerCase() === name.toLowerCase()
      )
    ) {
      alert("この言語はすでに登録されているよ。");
      return;
    }

    const newLanguage: Language = {
      id: `custom-${Date.now()}`,
      name,
      color: newLanguageColor,
      lightColor: getLightColor(newLanguageColor),
      studyCountries: [],
      speakingCountries: [],
    };

    setLanguageList((previous) => [...previous, newLanguage]);
    setSelectedLanguageId(newLanguage.id);
    setSelectedCountry(null);
    setNewLanguageName("");
    setShowAddLanguage(false);
  }

  function startEditing(language: Language) {
    setEditingLanguageId(language.id);
    setEditName(language.name);
    setEditColor(language.color);
    setShowAddLanguage(false);
  }

  function saveEdit() {
    const name = editName.trim();

    if (!editingLanguageId || !name) {
      alert("言語名を入力してね。");
      return;
    }

    if (
      languageList.some(
        (language) =>
          language.id !== editingLanguageId &&
          language.name.toLowerCase() === name.toLowerCase()
      )
    ) {
      alert("この言語名はすでに使われているよ。");
      return;
    }

    setLanguageList((previous) =>
      previous.map((language) =>
        language.id === editingLanguageId
          ? {
              ...language,
              name,
              color: editColor,
              lightColor: getLightColor(editColor),
            }
          : language
      )
    );

    setEditingLanguageId(null);
  }

  function deleteLanguage(language: Language) {
    const confirmed = window.confirm(
      `「${language.name}」を削除する？\n\nこの言語の国別学習記録も削除されます。この操作は取り消せません。`
    );

    if (!confirmed) return;

    setLanguageList((previous) =>
      previous.filter((item) => item.id !== language.id)
    );

    setProgress((previous) => {
      const next = { ...previous };

      for (const key of Object.keys(next)) {
        if (key.startsWith(`${language.id}:`)) {
          delete next[key];
        }
      }

      return next;
    });

    if (selectedLanguageId === language.id) {
      const remaining = languageList.filter(
        (item) => item.id !== language.id
      );

      setSelectedLanguageId(remaining[0]?.id ?? "");
      setSelectedCountry(null);
    }

    if (editingLanguageId === language.id) {
      setEditingLanguageId(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl rounded-2xl bg-white p-4 shadow-sm md:p-6">
      <h1 className="text-2xl font-semibold text-gray-800">
        Language World
      </h1>

      <p className="mt-2 text-sm leading-6 text-gray-500">
        世界のどこで使われる言語でも、自分だけの学習地図に。
      </p>

      <h2 className="mt-6 text-sm font-semibold text-gray-700">
        ① 学習言語を選ぶ
      </h2>

      <div className="mt-3 flex flex-wrap gap-2">
        {languageList.map((language) => (
          <button
            key={language.id}
            type="button"
            onClick={() => {
              setSelectedLanguageId(language.id);
              setSelectedCountry(null);
            }}
            className="rounded-xl border px-4 py-2 text-sm font-medium transition"
            style={{
              backgroundColor:
                selectedLanguageId === language.id
                  ? language.color
                  : "#FFFFFF",
              color:
                selectedLanguageId === language.id
                  ? "#FFFFFF"
                  : "#374151",
              borderColor: language.color,
            }}
          >
            {language.name}
          </button>
        ))}

        <button
          type="button"
          onClick={() => {
            setShowAddLanguage((previous) => !previous);
            setEditingLanguageId(null);
          }}
          className="rounded-xl border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          ＋ 言語を追加
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {languageList.map((language) => (
          <div
            key={language.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 px-3 py-3"
          >
            <div className="flex items-center gap-2">
              <span
                className="h-4 w-4 rounded-full"
                style={{ backgroundColor: language.color }}
              />
              <span className="text-sm font-medium text-gray-700">
                {language.name}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => startEditing(language)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
              >
                編集
              </button>
              <button
                type="button"
                onClick={() => deleteLanguage(language)}
                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
              >
                削除
              </button>
            </div>
          </div>
        ))}
      </div>

      {editingLanguageId && (
        <section className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <h3 className="text-sm font-semibold text-gray-800">
            言語を編集
          </h3>

          <label className="mt-3 block text-sm text-gray-600">
            言語名
          </label>
          <input
            value={editName}
            onChange={(event) => setEditName(event.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
          />

          <label className="mt-4 block text-sm text-gray-600">
            テーマカラー
          </label>
          <div className="mt-2 flex items-center gap-3">
            <input
              type="color"
              value={editColor}
              onChange={(event) => setEditColor(event.target.value)}
              className="h-10 w-14 cursor-pointer"
            />
            <span className="text-sm text-gray-500">
              {editColor.toUpperCase()}
            </span>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={saveEdit}
              className="rounded-xl px-4 py-2 text-sm text-white"
              style={{ backgroundColor: editColor }}
            >
              変更を保存
            </button>
            <button
              type="button"
              onClick={() => setEditingLanguageId(null)}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600"
            >
              キャンセル
            </button>
          </div>
        </section>
      )}

      {showAddLanguage && (
        <section className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <h3 className="text-sm font-semibold text-gray-800">
            新しい言語を登録
          </h3>

          <label className="mt-3 block text-sm text-gray-600">
            言語名
          </label>
          <input
            value={newLanguageName}
            onChange={(event) => setNewLanguageName(event.target.value)}
            placeholder="例：フランス語、アラビア語"
            className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
          />

          <label className="mt-4 block text-sm text-gray-600">
            テーマカラー
          </label>
          <div className="mt-2 flex items-center gap-3">
            <input
              type="color"
              value={newLanguageColor}
              onChange={(event) => setNewLanguageColor(event.target.value)}
              className="h-10 w-14 cursor-pointer"
            />
            <span className="text-sm text-gray-500">
              {newLanguageColor.toUpperCase()}
            </span>
          </div>

          <button
            type="button"
            onClick={addLanguage}
            className="mt-4 rounded-xl px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: newLanguageColor }}
          >
            この言語を追加
          </button>
        </section>
      )}

      {selectedLanguage && getAutomaticCountries(selectedLanguage).length > 0 && (
        <section className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <h2 className="text-sm font-semibold text-gray-800">
            対象国を一括で色付け
          </h2>

          <p className="mt-1 text-sm leading-6 text-gray-500">
            {selectedLanguage.name}が使われる対象国をまとめて塗り、あとから国ごとに色を変更できます。
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => colorAllStudyCountries(1)}
              className="rounded-xl border px-3 py-2 text-sm font-medium transition hover:opacity-80"
              style={{
                backgroundColor: selectedLanguage.lightColor,
                borderColor: selectedLanguage.color,
                color: "#374151",
              }}
            >
              学習中の色にする
            </button>

            <button
              type="button"
              onClick={() => colorAllStudyCountries(2)}
              className="rounded-xl border px-3 py-2 text-sm font-medium transition hover:opacity-80"
              style={{
                backgroundColor: `${selectedLanguage.color}B3`,
                borderColor: selectedLanguage.color,
                color: "#263126",
              }}
            >
              少し話せる色にする
            </button>

            <button
              type="button"
              onClick={() => colorAllStudyCountries(3)}
              className="rounded-xl px-3 py-2 text-sm font-medium text-white transition hover:opacity-80"
              style={{ backgroundColor: selectedLanguage.color }}
            >
              話せる色にする
            </button>

            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    `${selectedLanguage.name}の対象国の色をすべて解除しますか？`
                  )
                ) {
                  colorAllStudyCountries(0);
                }
              }}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-100"
            >
              対象国の色を解除
            </button>
          </div>
        </section>
      )}

      <h2 className="mt-6 text-sm font-semibold text-gray-700">
        ② 地図上の国をクリック
      </h2>

      <div className="mt-3">
        <ComposableMap
          projection="geoEqualEarth"
          width={900}
          height={500}
          style={{ width: "100%", height: "auto" }}
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const countryId = getCountryId(geo.id);
                const level = getLevel(selectedLanguageId, countryId);
                const isSelected = selectedCountry?.id === countryId;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onClick={() =>
                      setSelectedCountry({
                        id: countryId,
                        name:
                          geo.properties?.name ?? `国コード ${countryId}`,
                      })
                    }
                    fill={
                      selectedLanguage
                        ? getColor(selectedLanguage, level)
                        : "#E8E8E3"
                    }
                    stroke={isSelected ? "#303830" : "#FFFFFF"}
                    strokeWidth={isSelected ? 1.8 : 0.6}
                    style={{
                      default: { outline: "none", cursor: "pointer" },
                      hover: {
                        fill: selectedLanguage?.color ?? "#718675",
                        outline: "none",
                        cursor: "pointer",
                      },
                      pressed: { outline: "none" },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>
      </div>

      {selectedLanguage && (
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
          {levels.map((level) => (
            <div key={level.value} className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-sm border border-gray-200"
                style={{
                  backgroundColor: getColor(selectedLanguage, level.value),
                }}
              />
              {level.label}
            </div>
          ))}
        </div>
      )}

      {selectedCountry && selectedLanguage && (
        <section className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs text-gray-500">選択した国</p>

          <h2 className="mt-1 text-lg font-semibold text-gray-800">
            {selectedCountry.name}
          </h2>

          <p className="mt-1 text-sm text-gray-600">
            {selectedLanguage.name}の学習状況
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {levels.map((level) => {
              const isActive =
                getLevel(selectedLanguageId, selectedCountry.id) ===
                level.value;

              return (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => updateLevel(level.value)}
                  className="rounded-xl border bg-white p-3 text-left transition hover:bg-gray-100"
                  style={{
                    borderColor: isActive
                      ? selectedLanguage.color
                      : "#E5E7EB",
                    borderWidth: isActive ? 2 : 1,
                  }}
                >
                  <span
                    className="mb-2 block h-4 w-4 rounded"
                    style={{
                      backgroundColor: getColor(
                        selectedLanguage,
                        level.value
                      ),
                    }}
                  />
                  <span className="block text-sm font-medium text-gray-800">
                    {level.label}
                  </span>
                  <span className="mt-1 block text-xs text-gray-500">
                    {level.description}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="mt-3 text-xs text-gray-500">
            変更はこのブラウザに自動保存されるよ。
          </p>
        </section>
      )}

      <p className="mt-4 text-xs leading-5 text-gray-400">
        言語ごとに学習状況を個別に保存します。データは現在のブラウザ内に保存されます。
      </p>
    </div>
  );
}
