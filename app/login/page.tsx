"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  type ConfirmationResult,
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

      if (code.includes("captcha") || code.includes("recaptcha")) {
        setError("認証確認に失敗しました。再度お試しください。");
        return;
      }

      if (
        code.includes("unauthorized-domain") ||
        code.includes("operation-not-allowed")
      ) {
        setError("Firebaseの認証設定を確認してください。");
        return;
      }
    }

    setError(
      "処理に失敗しました。入力内容とFirebaseの設定を確認してください。"
    );
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
        setError(
          "認証欄を読み込めませんでした。ページを再読み込みしてください。"
        );
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
      setMessage(
        "SMSを送信しました。届いた確認コードを入力してください。"
      );
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

  const fieldStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px 14px",
    border: "1px solid #E1E5DE",
    borderRadius: 11,
    background: "#FBFCFA",
    color: "#252A25",
    fontSize: 15,
    outlineColor: "#718675",
    marginTop: 7,
  };

  const primaryButton: React.CSSProperties = {
    width: "100%",
    padding: "13px 16px",
    border: 0,
    borderRadius: 11,
    background: "#354B3B",
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: 650,
    cursor: "pointer",
    transition: "background .18s ease, transform .18s ease",
  };

  const secondaryButton: React.CSSProperties = {
    ...primaryButton,
    background: "#F2F4F0",
    color: "#354B3B",
    border: "1px solid #E1E5DE",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        boxSizing: "border-box",
        padding: "36px 20px 56px",
        background:
          "radial-gradient(ellipse at 50% 0%, #E9EFE8 0%, #F6F7F4 43%, #F8F8F6 100%)",
        color: "#252A25",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <style>{`
        .login-action:hover {
          filter: brightness(1.04);
        }

        @media (max-width:520px) {
          .login-card {
            padding: 25px 20px !important;
          }

          .login-shell {
            padding-top: 64px !important;
          }
        }
      `}</style>

      <div
        className="login-shell"
        style={{
          width: "100%",
          maxWidth: 460,
          paddingTop: 20,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 25 }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 11,
              textDecoration: "none",
              color: "#2B3B2E",
            }}
          >
            <span
              style={{
                width: 43,
                height: 43,
                display: "grid",
                placeItems: "center",
                borderRadius: 15,
                background: "#354B3B",
                color: "#FFFFFF",
                fontWeight: 800,
                fontSize: 20,
                boxShadow: "0 7px 16px #354B3B25",
              }}
            >
              A
            </span>
            <span
              style={{
                fontSize: 23,
                fontWeight: 760,
                letterSpacing: "-1px",
              }}
            >
              Anki
            </span>
          </Link>

          <p
            style={{
              color: "#838B80",
              fontSize: 11,
              letterSpacing: "2px",
              fontWeight: 700,
              margin: "13px 0 0",
            }}
          >
            MAKE ROOM FOR LEARNING
          </p>
        </div>

        <section
          id="login-auth"
          className="login-card"
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: 32,
            borderRadius: 23,
            border: "1px solid rgba(224,229,221,.9)",
            background: "rgba(255,255,255,.91)",
            boxShadow:
              "0 18px 55px rgba(40,54,40,.07), 0 2px 8px rgba(40,54,40,.025)",
            backdropFilter: "blur(18px)",
          }}
        >
          <div style={{ marginBottom: 23 }}>
            <p
              style={{
                color: "#718675",
                fontSize: 10,
                fontWeight: 750,
                letterSpacing: "2px",
                margin: 0,
              }}
            >
              ログイン・新規登録
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 5,
              padding: 4,
              background: "#F2F4F0",
              borderRadius: 12,
              marginBottom: 22,
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
                  padding: "10px 12px",
                  border: 0,
                  borderRadius: 9,
                  background: mode === item ? "#FFFFFF" : "transparent",
                  color: mode === item ? "#354B3B" : "#7E877C",
                  fontSize: 13,
                  fontWeight: mode === item ? 700 : 550,
                  boxShadow:
                    mode === item ? "0 1px 4px #1F2A1F12" : "none",
                  cursor: "pointer",
                }}
              >
                {item === "email" ? "メールアドレス" : "電話番号"}
              </button>
            ))}
          </div>

          {mode === "email" && (
            <form
              onSubmit={handleEmailSubmit}
              style={{ display: "grid", gap: 15 }}
            >
              <label
                style={{
                  display: "block",
                  color: "#424A40",
                  fontSize: 12,
                  fontWeight: 650,
                }}
              >
                メールアドレス
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={fieldStyle}
                />
              </label>

              <label
                style={{
                  display: "block",
                  color: "#424A40",
                  fontSize: 12,
                  fontWeight: 650,
                }}
              >
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
                  placeholder="••••••••"
                  style={fieldStyle}
                />
              </label>

              <button
                className="login-action"
                type="submit"
                disabled={loading}
                style={{
                  ...primaryButton,
                  marginTop: 3,
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading
                  ? "処理中…"
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
                style={secondaryButton}
              >
                {isRegister ? "ログインに戻る" : "アカウントを新規登録"}
              </button>

              {!isRegister && (
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  style={{
                    border: 0,
                    background: "transparent",
                    color: "#718675",
                    fontSize: 12,
                    padding: 5,
                    cursor: "pointer",
                  }}
                >
                  パスワードを忘れた場合
                </button>
              )}
            </form>
          )}

          {mode === "phone" && (
            <div style={{ display: "grid", gap: 15 }}>
              <label
                style={{
                  display: "block",
                  color: "#424A40",
                  fontSize: 12,
                  fontWeight: 650,
                }}
              >
                電話番号（国番号付き）
                <input
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+81..."
                  style={fieldStyle}
                />
              </label>

              <p
                style={{
                  color: "#838B80",
                  fontSize: 12,
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                例：日本は +81、中国は +86。先頭の0を省く国があります。
              </p>

              <div ref={recaptchaContainer} />

              {!confirmation ? (
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleSendSms}
                  style={{
                    ...primaryButton,
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? "送信中…" : "SMS確認コードを送信"}
                </button>
              ) : (
                <>
                  <label
                    style={{
                      display: "block",
                      color: "#424A40",
                      fontSize: 12,
                      fontWeight: 650,
                    }}
                  >
                    SMS確認コード
                    <input
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={smsCode}
                      onChange={(e) => setSmsCode(e.target.value)}
                      style={fieldStyle}
                    />
                  </label>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleVerifySms}
                    style={{
                      ...primaryButton,
                      opacity: loading ? 0.7 : 1,
                    }}
                  >
                    {loading ? "確認中…" : "コードを確認してログイン"}
                  </button>
                </>
              )}
            </div>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              margin: "22px 0 17px",
              color: "#A0A69D",
              fontSize: 11,
            }}
          >
            <span
              style={{
                height: 1,
                background: "#E8EBE5",
                flex: 1,
              }}
            />
            または
            <span
              style={{
                height: 1,
                background: "#E8EBE5",
                flex: 1,
              }}
            />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            style={{
              ...secondaryButton,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              background: "#FFFFFF",
              opacity: loading ? 0.7 : 1,
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 38.05 46.98 31.88 46.98 24.55z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.14 1.44-4.89 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
              />
            </svg>
            Googleでログイン
          </button>

          {message && (
            <p
              role="status"
              style={{
                color: "#3F7650",
                background: "#F0F7EF",
                border: "1px solid #DCEBDD",
                borderRadius: 10,
                padding: 12,
                fontSize: 12,
                lineHeight: 1.6,
                margin: "16px 0 0",
              }}
            >
              {message}
            </p>
          )}

          {error && (
            <p
              role="alert"
              style={{
                color: "#A53E36",
                background: "#FFF3F1",
                border: "1px solid #F2DAD6",
                borderRadius: 10,
                padding: 12,
                fontSize: 12,
                lineHeight: 1.6,
                margin: "16px 0 0",
              }}
            >
              {error}
            </p>
          )}

          <p
            style={{
              margin: "23px 0 0",
              paddingTop: 18,
              borderTop: "1px solid #EDF0EA",
              color: "#8A9187",
              fontSize: 11,
              lineHeight: 1.8,
              textAlign: "center",
            }}
          >
            ログインすると、アカウントを使って学習記録を管理できます。
          </p>
        </section>

        <p
          style={{
            textAlign: "center",
            margin: "18px 0 0",
            fontSize: 11,
            color: "#9AA095",
          }}
        >
          A calm space for your daily progress.
        </p>
      </div>
    </main>
  );
}