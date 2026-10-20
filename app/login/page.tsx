
"use client";

import { useEffect, useRef, useState } from "react";
import {
  ConfirmationResult,
  GoogleAuthProvider,
  RecaptchaVerifier,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  sendPasswordResetEmail,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";

type LoginMode = "google" | "email" | "phone";

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<LoginMode>("email");
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [confirmation, setConfirmation] =
    useState<ConfirmationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const recaptchaContainer = useRef<HTMLDivElement>(null);
  const recaptchaVerifier = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    return () => {
      recaptchaVerifier.current?.clear();
      recaptchaVerifier.current = null;
    };
  }, []);

  function showError(err: unknown) {
    console.error(err);

    if (
      err instanceof Error &&
      "code" in err &&
      typeof err.code === "string"
    ) {
      const code = err.code;

      if (code.includes("email-already-in-use")) {
        setError("このメールアドレスは登録済みです。ログインしてください。");
        return;
      }

      if (code.includes("invalid-email")) {
        setError("メールアドレスの形式を確認してください。");
        return;
      }

      if (
        code.includes("weak-password") ||
        code.includes("password-too-short")
      ) {
        setError("パスワードは6文字以上にしてください。");
        return;
      }

      if (
        code.includes("wrong-password") ||
        code.includes("invalid-credential")
      ) {
        setError("ログイン情報を確認してください。");
        return;
      }

      if (code.includes("popup-closed-by-user")) {
        setError("Googleログインがキャンセルされました。");
        return;
      }

      if (
        code.includes("captcha") ||
        code.includes("recaptcha")
      ) {
        setError("認証確認に失敗しました。再度お試しください。");
        return;
      }

      if (
        code.includes("unauthorized-domain") ||
        code.includes("operation-not-allowed")
      ) {
        setError(
          "Firebaseの認証設定を確認してください。"
        );
        return;
      }
    }

    setError("処理に失敗しました。入力内容とFirebaseの設定を確認してください。");
  }

  async function handleGoogleLogin() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push("/");
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
      } else {
        await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
      }

      router.push("/game");
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordReset() {
    if (!email.trim()) {
      setError("先にメールアドレスを入力してください。");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setMessage(
        "パスワード再設定メールを送信しました。受信箱をご確認ください。"
      );
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendSms() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (!phone.trim().startsWith("+")) {
        setError(
          "国番号を付けて入力してください。例：日本は +81、中国は +86"
        );
        return;
      }

      if (!recaptchaContainer.current) {
        setError("認証欄を読み込めませんでした。ページを再読み込みしてください。");
        return;
      }

      if (!recaptchaVerifier.current) {
        recaptchaVerifier.current = new RecaptchaVerifier(
          auth,
          recaptchaContainer.current,
          { size: "normal" }
        );
      }

      const result = await signInWithPhoneNumber(
        auth,
        phone.trim(),
        recaptchaVerifier.current
      );

      setConfirmation(result);
      setMessage("SMSを送信しました。届いた確認コードを入力してください。");
    } catch (err) {
      recaptchaVerifier.current?.clear();
      recaptchaVerifier.current = null;
      showError(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifySms() {
    if (!confirmation || !smsCode.trim()) {
      setError("SMSの確認コードを入力してください。");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await confirmation.confirm(smsCode.trim());
      router.push("/game");
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box" as const,
    padding: "12px",
    border: "1px solid #475569",
    borderRadius: 8,
    background: "#0f172a",
    color: "#f8fafc",
    fontSize: 16,
  };

  const buttonStyle = {
    width: "100%",
    padding: "13px",
    border: "none",
    borderRadius: 8,
    background: "#2563eb",
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold" as const,
    cursor: "pointer",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "#101827",
        color: "#f8fafc",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 440,
          padding: 28,
          borderRadius: 18,
          background: "#1e293b",
          boxSizing: "border-box",
        }}
      >
        <h1 style={{ textAlign: "center", fontSize: 30 }}>
          Language Quest
        </h1>

        <p style={{ textAlign: "center", color: "#cbd5e1" }}>
          世界中の仲間と、言語の冒険へ。
        </p>

        <div
          style={{
            display: "flex",
            gap: 8,
            margin: "24px 0",
          }}
        >
          {(["email", "phone"] as LoginMode[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setMode(item);
                setError("");
                setMessage("");
              }}
              style={{
                ...buttonStyle,
                background: mode === item ? "#2563eb" : "#334155",
              }}
            >
              {item === "email" ? "メール" : "電話番号"}
            </button>
          ))}
        </div>

        {mode === "email" && (
          <form
            onSubmit={handleEmailSubmit}
            style={{ display: "grid", gap: 14 }}
          >
            <label>
              メールアドレス
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={inputStyle}
              />
            </label>

            <label>
              パスワード（6文字以上）
              <input
                type="password"
                autoComplete={
                  isRegister ? "new-password" : "current-password"
                }
                minLength={6}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              style={buttonStyle}
            >
              {loading
                ? "処理中..."
                : isRegister
                  ? "メールで新規登録"
                  : "メールでログイン"}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError("");
                setMessage("");
              }}
              style={{
                ...buttonStyle,
                background: "#334155",
              }}
            >
              {isRegister
                ? "ログインに戻る"
                : "アカウントを新規登録"}
            </button>

            {!isRegister && (
              <button
                type="button"
                onClick={handlePasswordReset}
                style={{
                  ...buttonStyle,
                  background: "transparent",
                  color: "#93c5fd",
                }}
              >
                パスワードを忘れた場合
              </button>
            )}
          </form>
        )}

        {mode === "phone" && (
          <div style={{ display: "grid", gap: 14 }}>
            <label>
              電話番号（国番号付き）
              <input
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+81..."
                style={inputStyle}
              />
            </label>

            <p style={{ color: "#cbd5e1", fontSize: 13 }}>
              例：日本は +81、中国は +86。先頭の0を省く国があります。
            </p>

            <div ref={recaptchaContainer} />

            {!confirmation ? (
              <button
                type="button"
                disabled={loading}
                onClick={handleSendSms}
                style={buttonStyle}
              >
                {loading ? "送信中..." : "SMS確認コードを送信"}
              </button>
            ) : (
              <>
                <label>
                  SMS確認コード
                  <input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={smsCode}
                    onChange={(e) => setSmsCode(e.target.value)}
                    style={inputStyle}
                  />
                </label>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleVerifySms}
                  style={buttonStyle}
                >
                  {loading ? "確認中..." : "コードを確認してログイン"}
                </button>
              </>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            ...buttonStyle,
            marginTop: 18,
            background: "#f8fafc",
            color: "#111827",
          }}
        >
          Googleでログイン
        </button>

        {message && (
          <p style={{ color: "#86efac", marginTop: 18 }}>
            {message}
          </p>
        )}

        {error && (
          <p style={{ color: "#fca5a5", marginTop: 18 }}>
            {error}
          </p>
        )}

        <p
          style={{
            marginTop: 24,
            color: "#94a3b8",
            fontSize: 12,
            textAlign: "center",
          }}
        >
          ログインすることで、アカウントを使って学習記録を管理できます。
        </p>
      </section>
    </main>
  );
}
