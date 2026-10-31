"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { exportBackup, restoreBackup, type RestoreResult } from "@/lib/backup";

const presets = [
  { name: "セージ", color: "#718675" },
  { name: "ブルー", color: "#647A91" },
  { name: "ラベンダー", color: "#8B7DB8" },
  { name: "モノクロ", color: "#454A46" },
];
const appLanguages = [
  { value: "ja", label: "日本語" },
  { value: "de", label: "Deutsch" },
  { value: "en", label: "English" },
  { value: "zh-CN", label: "简体中文" },
  { value: "zh-TW", label: "繁體中文" },
  { value: "es", label: "Español" },
];
const studyLanguages = [
  { value: "de-DE", label: "ドイツ語" },
  { value: "es-ES", label: "スペイン語" },
  { value: "zh-CN", label: "中国語（簡体字）" },
  { value: "zh-TW", label: "繁體中文（中国語・繁体字）" },
  { value: "ko-KR", label: "韓国語" },
  { value: "it-IT", label: "イタリア語" },
  { value: "en-US", label: "英語" },
];

export default function SettingsPage() {
  const [themeColor, setThemeColor] = useState("#718675");
  const [customColor, setCustomColor] = useState("#718675");
  const [autoRead, setAutoRead] = useState(true);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [appLanguage, setAppLanguage] = useState("ja");
  const [studyLanguage, setStudyLanguage] = useState("de-DE");
  const [saved, setSaved] = useState(false);
    // バックアップ・復元用の状態
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupMessage, setBackupMessage] = useState("");
  const [backupError, setBackupError] = useState("");
  const [restoreResult, setRestoreResult] = useState<RestoreResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ログイン状態を確認
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // JSONバックアップをダウンロード
  async function handleExportBackup() {
    if (!user) {
      setBackupError("バックアップにはログインが必要です。");
      return;
    }

    setBackupLoading(true);
    setBackupMessage("");
    setBackupError("");
    setRestoreResult(null);

    try {
      await exportBackup(user);
      setBackupMessage("バックアップファイルをダウンロードしました。");
    } catch (error) {
      console.error(error);
      setBackupError("バックアップに失敗しました。もう一度お試しください。");
    } finally {
      setBackupLoading(false);
    }
  }

  // ファイル選択画面を開く
  function handleSelectRestore() {
    fileInputRef.current?.click();
  }

  // JSONファイルから復元
  async function handleRestoreFile(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    // 同じファイルを再選択できるようにする
    event.target.value = "";

    if (!file) return;

    if (!user) {
      setBackupError("復元にはログインが必要です。");
      return;
    }

    const confirmed = window.confirm(
      "このバックアップファイルのデータを復元しますか？\n\n" +
      "同じIDのデータは更新されます。\n" +
      "バックアップに含まれない既存データは削除されません。\n\n" +
      "復元前に、現在のデータもバックアップしておくことをおすすめします。"
    );

    if (!confirmed) return;

    setBackupLoading(true);
    setBackupMessage("");
    setBackupError("");
    setRestoreResult(null);

    try {
      const result = await restoreBackup(file, user);

      setRestoreResult(result);
      setBackupMessage(
        "復元が完了しました。保存データを画面に反映するため、ページを再読み込みしてください。"
      );
    } catch (error) {
      console.error(error);
      setBackupError(
        error instanceof Error
          ? error.message
          : "復元に失敗しました。"
      );
    } finally {
      setBackupLoading(false);
    }
  }

  useEffect(() => {
    const read = (key: string, fallback: string) => {
      try { return window.localStorage.getItem(key) ?? fallback; }
      catch { return fallback; }
    };
    const color = read("anki-theme-color", "#718675");
    if (/^#[0-9a-fA-F]{6}$/.test(color)) {
      setThemeColor(color);
      setCustomColor(color);
    }
    setAutoRead(read("anki-auto-read", "true") === "true");
    const rate = Number(read("anki-speech-rate", "1.0"));
    if (Number.isFinite(rate) && rate >= 0.5 && rate <= 2.0 && Math.round((rate - 0.5) / 0.25) === (rate - 0.5) / 0.25) setSpeechRate(rate);
    setAppLanguage(read("anki-app-language", "ja"));
    setStudyLanguage(read("anki-study-language", "de-DE"));
  }, []);

  function saveSettings() {
    try {
      localStorage.setItem("anki-theme-color", themeColor);
      localStorage.setItem("anki-custom-color", themeColor);
      localStorage.setItem("anki-auto-read", String(autoRead));
      localStorage.setItem("anki-speech-rate", String(speechRate));
      localStorage.setItem("anki-app-language", appLanguage);
      localStorage.setItem("anki-study-language", studyLanguage);
      document.documentElement.style.setProperty("--anki-theme-color", themeColor);
      setSaved(true);
    } catch {
      setSaved(false);
      alert("設定を保存できませんでした。ブラウザーの保存設定をご確認ください。");
    }
  }

  function previewVoice() {
    if (!("speechSynthesis" in window)) {
      alert("このブラウザーでは音声読み上げに対応していません。");
      return;
    }
    window.speechSynthesis.cancel();
    const sample = studyLanguage.startsWith("zh") ? "你好，欢迎学习。" :
      studyLanguage.startsWith("de") ? "Hallo! Lass uns lernen." :
      studyLanguage.startsWith("es") ? "¡Hola! Vamos a aprender." :
      studyLanguage.startsWith("ko") ? "안녕하세요. 함께 공부해요." :
      studyLanguage.startsWith("it") ? "Ciao! Impariamo insieme." :
      "Hello! Let's learn together.";
    const utterance = new SpeechSynthesisUtterance(sample);
    utterance.rate = speechRate;
    utterance.lang = studyLanguage;
    window.speechSynthesis.speak(utterance);
  }

  const inputStyle = {
    width: "100%", boxSizing: "border-box" as const,
    border: "1px solid #DADDD6", borderRadius: "10px",
    padding: "11px 12px", background: "#FFFFFF", color: "#252824", fontSize: "14px",
  };
  const cardStyle = {
    background: "#FFFFFF", border: "1px solid #E8E9E5",
    borderRadius: "16px", padding: "22px",
  };

  return (
    <main style={{
      minHeight: "100vh", background: "#F7F7F5", color: "#252824",
      padding: "28px 18px 56px",
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <div style={{ maxWidth: "760px", margin: "0 auto" }}>
        
        <header style={{ marginBottom: "26px" }}>
          <p style={{ color: "#718675", fontSize: "11px", fontWeight: 700, letterSpacing: "2px", margin: "0 0 8px" }}>PERSONALIZE YOUR STUDY</p>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 36px)", letterSpacing: "-1.2px", margin: 0 }}>設定</h1>
    
        </header>

        <div style={{ display: "grid", gap: "16px" }}>
          <section style={cardStyle}>
            <h2 style={{ fontSize: "16px", margin: "0 0 5px" }}>外観</h2>
            <p style={{ color: "#858780", fontSize: "13px", margin: "0 0 18px" }}>アプリのアクセントカラー</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(125px, 1fr))", gap: "10px" }}>
              {presets.map((preset) => {
                const active = themeColor.toUpperCase() === preset.color;
                return <button key={preset.color} type="button" onClick={() => { setThemeColor(preset.color); setCustomColor(preset.color); setSaved(false); }} aria-pressed={active}
                  style={{ display: "flex", alignItems: "center", gap: "9px", padding: "10px", border: active ? "2px solid #718675" : "1px solid #E8E9E5", borderRadius: "11px", background: active ? "#F2F5F0" : "#FFFFFF", cursor: "pointer", color: "#30352F", textAlign: "left" }}>
                  <span style={{ width: "22px", height: "22px", borderRadius: "50%", background: preset.color, flexShrink: 0 }} />
                  <span style={{ fontSize: "12px", fontWeight: 600 }}>{preset.name}</span>
                </button>;
              })}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "12px", alignItems: "end", marginTop: "18px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600 }}>カスタムカラー（HEX）
                <input value={customColor} onChange={(event) => {
                  const value = event.target.value;
                  setCustomColor(value);
                  if (/^#[0-9a-fA-F]{6}$/.test(value)) { setThemeColor(value.toUpperCase()); setSaved(false); }
                }} style={{ ...inputStyle, marginTop: "8px", fontFamily: "monospace" }} />
              </label>
              <input aria-label="カラーピッカー" type="color" value={/^#[0-9a-fA-F]{6}$/.test(customColor) ? customColor : themeColor}
                onChange={(event) => { setCustomColor(event.target.value.toUpperCase()); setThemeColor(event.target.value.toUpperCase()); setSaved(false); }}
                style={{ width: "48px", height: "44px", padding: "3px", border: "1px solid #DADDD6", borderRadius: "10px", background: "#fff" }} />
            </div>
            <div style={{ marginTop: "14px", height: "8px", borderRadius: "99px", background: `linear-gradient(90deg, ${themeColor}, #FFFFFF)` }} />
          </section>

          <section style={cardStyle}>
            <h2 style={{ fontSize: "16px", margin: "0 0 5px" }}>単語カード・音声</h2>
            <p style={{ color: "#858780", fontSize: "13px", margin: "0 0 18px" }}>読み上げ方法を調整できます。</p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 650 }}>自動読み上げ</div>
                <div style={{ color: "#858780", fontSize: "12px", marginTop: "4px" }}>学習中にカードが切り替わると自動で読み上げます。</div>
              </div>
              <button type="button" role="switch" aria-label="単語カードの自動読み上げ" aria-checked={autoRead} onClick={() => { setAutoRead(!autoRead); setSaved(false); }}
                style={{ width: "52px", height: "30px", border: 0, borderRadius: "99px", padding: "3px", background: autoRead ? "#718675" : "#C9CCC6", cursor: "pointer", display: "flex", justifyContent: autoRead ? "flex-end" : "flex-start", alignItems: "center", flexShrink: 0 }}>
                <span style={{ width: "24px", height: "24px", background: "#FFFFFF", borderRadius: "50%", boxShadow: "0 1px 4px #0002" }} />
              </button>
            </div>
            <div style={{ marginTop: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <label htmlFor="speech-rate" style={{ fontSize: "14px", fontWeight: 650 }}>音声の再生速度</label>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "#5E7562" }}>{speechRate.toFixed(1)}倍</span>
              </div>
              <input id="speech-rate" type="range" min="0.5" max="2" step="0.25" value={speechRate} onChange={(event) => { setSpeechRate(Number(event.target.value)); setSaved(false); }} style={{ width: "100%", accentColor: "#718675" }} />
              <div style={{ display: "flex", justifyContent: "space-between", color: "#858780", fontSize: "11px" }}><span>ゆっくり 0.5倍</span><span>標準 1.0倍</span><span>速い 2.0倍</span></div>
              <button type="button" onClick={previewVoice} style={{ marginTop: "14px", padding: "9px 13px", border: "1px solid #DDE3DA", borderRadius: "10px", background: "#F7F9F5", color: "#435747", cursor: "pointer", fontWeight: 600 }}>音声を試聴</button>
            </div>
          </section>

          <section style={cardStyle}>
            <h2 style={{ fontSize: "16px", margin: "0 0 5px" }}>言語</h2>
            <p style={{ color: "#858780", fontSize: "13px", margin: "0 0 18px" }}>アプリの表示言語と学習する言語を分けて設定できます。</p>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "16px" }}>アプリの表示言語
              <select value={appLanguage} onChange={(event) => { setAppLanguage(event.target.value); setSaved(false); }} style={{ ...inputStyle, display: "block", marginTop: "8px" }}>
                {appLanguages.map((language) => <option key={language.value} value={language.value}>{language.label}</option>)}
              </select>
            </label>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600 }}>学習する言語（音声の言語にも使用）
              <select value={studyLanguage} onChange={(event) => { setStudyLanguage(event.target.value); setSaved(false); }} style={{ ...inputStyle, display: "block", marginTop: "8px" }}>
                {studyLanguages.map((language) => <option key={language.value} value={language.value}>{language.label}</option>)}
              </select>
            </label>
            <p style={{ color: "#858780", fontSize: "12px", lineHeight: 1.6, margin: "12px 0 0" }}>※ 表示言語の設定は保存されます。アプリ全体の表示を選んだ言語に切り替えるには、各ページの多言語対応を順次追加する必要があります。学習言語は単語カードの読み上げ言語にも反映されます。</p>
          </section>

          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
                      {/* データ管理 */}
          <section style={cardStyle}>
            <h2 style={{ fontSize: "16px", margin: "0 0 5px" }}>
              データ管理
            </h2>

            <p style={{
              color: "#858780",
              fontSize: "13px",
              lineHeight: 1.7,
              margin: "0 0 20px"
            }}>
              学習データやアプリの設定をJSONファイルに保存できます。
              別の端末への移行や、大切なデータの保管に利用できます。
            </p>

            <div style={{
              display: "grid",
              gap: "12px",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))"
            }}>
              <button
                type="button"
                onClick={handleExportBackup}
                disabled={backupLoading || authLoading || !user}
                style={{
                  padding: "13px 16px",
                  border: "1px solid #DDE3DA",
                  borderRadius: "11px",
                  background: "#F3F6F1",
                  color: "#435747",
                  fontSize: "14px",
                  fontWeight: 650,
                  cursor: backupLoading || !user ? "not-allowed" : "pointer",
                  opacity: backupLoading || !user ? 0.5 : 1
                }}
              >
                JSONバックアップを保存
              </button>

              <button
                type="button"
                onClick={handleSelectRestore}
                disabled={backupLoading || authLoading || !user}
                style={{
                  padding: "13px 16px",
                  border: "1px solid #DADDD6",
                  borderRadius: "11px",
                  background: "#FFFFFF",
                  color: "#30352F",
                  fontSize: "14px",
                  fontWeight: 650,
                  cursor: backupLoading || !user ? "not-allowed" : "pointer",
                  opacity: backupLoading || !user ? 0.5 : 1
                }}
              >
                JSONファイルから復元
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleRestoreFile}
              style={{ display: "none" }}
            />

            <p style={{
              color: "#858780",
              fontSize: "12px",
              lineHeight: 1.7,
              margin: "16px 0 0"
            }}>
              ※ 復元は既存データをすべて消去する操作ではありません。
              同じIDのデータを更新し、バックアップに含まれないデータは残します。
            </p>

            {authLoading && (
              <p style={{ fontSize: "13px", color: "#858780" }}>
                ログイン状態を確認しています……
              </p>
            )}

            {!authLoading && !user && (
              <p style={{ fontSize: "13px", color: "#A45B50" }}>
                バックアップ・復元にはログインが必要です。
              </p>
            )}

            {backupLoading && (
              <p style={{ fontSize: "13px", color: "#68756A" }}>
                データを処理しています。しばらくお待ちください……
              </p>
            )}

            {backupMessage && (
              <p role="status" style={{
                color: "#52735A",
                fontSize: "13px",
                lineHeight: 1.7,
                marginTop: "16px"
              }}>
                {backupMessage}
              </p>
            )}

            {backupError && (
              <p role="alert" style={{
                color: "#B04D43",
                fontSize: "13px",
                lineHeight: 1.7,
                marginTop: "16px"
              }}>
                {backupError}
              </p>
            )}

            {restoreResult && (
              <div style={{
                marginTop: "16px",
                padding: "14px",
                borderRadius: "10px",
                background: "#F7F8F5",
                fontSize: "13px",
                lineHeight: 1.9
              }}>
                <strong>復元結果</strong>
                <div>デッキ：{restoreResult.decks}件</div>
                <div>フォルダ：{restoreResult.folders}件</div>
                <div>単語：{restoreResult.words}件</div>
                <div>教材：{restoreResult.materials}件</div>
                <div>タスク：{restoreResult.tasks}件</div>
                <div>カレンダー：{restoreResult.calendarData ? "復元済み" : "対象データなし"}</div>
                <div>Little Moments：{restoreResult.littleMoments ? "復元済み" : "対象データなし・未復元"}</div>
                <div>ブラウザ保存データ：{restoreResult.localStorage}件</div>

                {restoreResult.warnings.length > 0 && (
                  <div style={{ marginTop: "10px", color: "#A45B50" }}>
                    <strong>注意事項</strong>
                    {restoreResult.warnings.map((warning, index) => (
                      <p key={index} style={{ margin: "5px 0" }}>
                        ・{warning}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
            {saved && <span role="status" style={{ color: "#52735A", fontSize: "13px", fontWeight: 600 }}>設定を保存しました</span>}
            <button type="button" onClick={saveSettings} style={{ padding: "12px 20px", border: 0, borderRadius: "11px", background: "#252824", color: "#FFFFFF", fontSize: "14px", fontWeight: 650, cursor: "pointer" }}>設定を保存</button>
          </div>
        </div>
      </div>
    </main>
  );
}
