
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
import { useAppLanguage } from "@/app/component/AppLanguage";

type LoginMode = "google" | "email" | "phone";
type AppLanguage = "ja" | "de" | "en" | "zh-CN" | "zh-TW" | "es";

const translations: Record<AppLanguage, Record<string, string>> = {
  ja: {
    heading: "ログイン・新規登録",
    emailTab: "メールアドレス",
    phoneTab: "電話番号",
    email: "メールアドレス",
    password: "パスワード（6文字以上）",
    emailLogin: "メールでログイン",
    emailRegister: "メールで新規登録",
    processing: "処理中…",
    backLogin: "ログインに戻る",
    createAccount: "アカウントを新規登録",
    forgotPassword: "パスワードを忘れた場合",
    phone: "電話番号（国番号付き）",
    phoneExample: "例：日本は +81、中国は +86。先頭の0を省く国があります。",
    sendSms: "SMS確認コードを送信",
    sending: "送信中…",
    smsCode: "SMS確認コード",
    verifying: "確認中…",
    verifySms: "コードを確認してログイン",
    or: "または",
    google: "Googleでログイン",
    footer: "ログインすると、アカウントを使って学習記録を管理できます。",
    emailRegistered: "このメールアドレスは登録済みです。ログインしてください。",
    invalidEmail: "メールアドレスの形式を確認してください。",
    weakPassword: "パスワードは6文字以上にしてください。",
    invalidCredential: "ログイン情報を確認してください。",
    popupClosed: "Googleログインがキャンセルされました。",
    captcha: "認証確認に失敗しました。再度お試しください。",
    firebaseSettings: "Firebaseの認証設定を確認してください。",
    generalError: "処理に失敗しました。入力内容とFirebaseの設定を確認してください。",
    enterEmail: "先にメールアドレスを入力してください。",
    resetSent: "パスワード再設定メールを送信しました。受信箱をご確認ください。",
    countryCode: "国番号を付けて入力してください。例：日本は +81、中国は +86",
    recaptchaError: "認証欄を読み込めませんでした。ページを再読み込みしてください。",
    smsSent: "SMSを送信しました。届いた確認コードを入力してください。",
    enterSms: "SMSの確認コードを入力してください。",
    resetError: "パスワード再設定に失敗しました。入力内容を確認してください。",
  },
  de: {
    heading: "Anmelden / Registrieren",
    emailTab: "E-Mail",
    phoneTab: "Telefonnummer",
    email: "E-Mail-Adresse",
    password: "Passwort (mindestens 6 Zeichen)",
    emailLogin: "Mit E-Mail anmelden",
    emailRegister: "Mit E-Mail registrieren",
    processing: "Wird verarbeitet…",
    backLogin: "Zurück zur Anmeldung",
    createAccount: "Neues Konto erstellen",
    forgotPassword: "Passwort vergessen?",
    phone: "Telefonnummer (mit Ländervorwahl)",
    phoneExample: "Beispiel: Japan +81, China +86. In einigen Ländern entfällt die führende 0.",
    sendSms: "SMS-Code senden",
    sending: "Wird gesendet…",
    smsCode: "SMS-Bestätigungscode",
    verifying: "Wird überprüft…",
    verifySms: "Code bestätigen und anmelden",
    or: "oder",
    google: "Mit Google anmelden",
    footer: "Nach der Anmeldung kannst du deine Lernfortschritte mit deinem Konto verwalten.",
    emailRegistered: "Diese E-Mail-Adresse ist bereits registriert. Bitte melde dich an.",
    invalidEmail: "Bitte überprüfe das Format deiner E-Mail-Adresse.",
    weakPassword: "Das Passwort muss mindestens 6 Zeichen lang sein.",
    invalidCredential: "Bitte überprüfe deine Anmeldedaten.",
    popupClosed: "Die Google-Anmeldung wurde abgebrochen.",
    captcha: "Die Verifizierung ist fehlgeschlagen. Bitte versuche es erneut.",
    firebaseSettings: "Bitte überprüfe die Firebase-Authentifizierungseinstellungen.",
    generalError: "Der Vorgang ist fehlgeschlagen. Bitte überprüfe deine Eingaben und die Firebase-Einstellungen.",
    enterEmail: "Bitte gib zuerst deine E-Mail-Adresse ein.",
    resetSent: "Die E-Mail zum Zurücksetzen des Passworts wurde gesendet. Bitte überprüfe deinen Posteingang.",
    countryCode: "Bitte gib die Nummer mit Ländervorwahl ein. Beispiel: Japan +81, China +86.",
    recaptchaError: "Das Verifizierungsfeld konnte nicht geladen werden. Bitte lade die Seite neu.",
    smsSent: "Die SMS wurde gesendet. Bitte gib den erhaltenen Bestätigungscode ein.",
    enterSms: "Bitte gib den SMS-Bestätigungscode ein.",
    resetError: "Das Zurücksetzen des Passworts ist fehlgeschlagen. Bitte überprüfe deine Eingaben.",
  },
  en: {
    heading: "Log in / Sign up",
    emailTab: "Email",
    phoneTab: "Phone",
    email: "Email Address",
    password: "Password (at least 6 characters)",
    emailLogin: "Log in with Email",
    emailRegister: "Sign up with Email",
    processing: "Processing…",
    backLogin: "Back to Log In",
    createAccount: "Create an Account",
    forgotPassword: "Forgot your password?",
    phone: "Phone Number (with country code)",
    phoneExample: "Example: Japan +81, China +86. Some countries omit the leading 0.",
    sendSms: "Send SMS Verification Code",
    sending: "Sending…",
    smsCode: "SMS Verification Code",
    verifying: "Verifying…",
    verifySms: "Verify Code and Log In",
    or: "or",
    google: "Log in with Google",
    footer: "Log in to manage your study records with your account.",
    emailRegistered: "This email address is already registered. Please log in.",
    invalidEmail: "Please check the format of your email address.",
    weakPassword: "Your password must contain at least 6 characters.",
    invalidCredential: "Please check your login credentials.",
    popupClosed: "Google login was cancelled.",
    captcha: "Verification failed. Please try again.",
    firebaseSettings: "Please check your Firebase authentication settings.",
    generalError: "The operation failed. Please check your input and Firebase settings.",
    enterEmail: "Please enter your email address first.",
    resetSent: "A password reset email has been sent. Please check your inbox.",
    countryCode: "Please enter your phone number with a country code. Example: Japan +81, China +86.",
    recaptchaError: "Could not load the verification field. Please reload the page.",
    smsSent: "An SMS has been sent. Please enter the verification code you received.",
    enterSms: "Please enter the SMS verification code.",
    resetError: "Could not reset your password. Please check your input.",
  },
  "zh-CN": {
    heading: "登录 / 注册",
    emailTab: "电子邮箱",
    phoneTab: "电话号码",
    email: "电子邮箱地址",
    password: "密码（至少6个字符）",
    emailLogin: "使用邮箱登录",
    emailRegister: "使用邮箱注册",
    processing: "处理中…",
    backLogin: "返回登录",
    createAccount: "注册新账号",
    forgotPassword: "忘记密码？",
    phone: "电话号码（含国家区号）",
    phoneExample: "例如：日本 +81，中国 +86。部分国家需要省略开头的0。",
    sendSms: "发送短信验证码",
    sending: "发送中…",
    smsCode: "短信验证码",
    verifying: "验证中…",
    verifySms: "验证并登录",
    or: "或者",
    google: "使用 Google 登录",
    footer: "登录后，你可以使用账号管理自己的学习记录。",
    emailRegistered: "该邮箱已注册，请直接登录。",
    invalidEmail: "请检查邮箱地址格式。",
    weakPassword: "密码至少需要6个字符。",
    invalidCredential: "请检查登录信息。",
    popupClosed: "已取消 Google 登录。",
    captcha: "验证失败，请重试。",
    firebaseSettings: "请检查 Firebase 身份验证设置。",
    generalError: "操作失败。请检查输入内容和 Firebase 设置。",
    enterEmail: "请先输入邮箱地址。",
    resetSent: "密码重置邮件已发送，请检查收件箱。",
    countryCode: "请输入带国家区号的电话号码。例如：日本 +81，中国 +86。",
    recaptchaError: "无法加载验证区域，请重新加载页面。",
    smsSent: "短信已发送，请输入收到的验证码。",
    enterSms: "请输入短信验证码。",
    resetError: "密码重置失败，请检查输入内容。",
  },
  "zh-TW": {
    heading: "登入／註冊",
    emailTab: "電子郵件",
    phoneTab: "電話號碼",
    email: "電子郵件地址",
    password: "密碼（至少6個字元）",
    emailLogin: "使用電子郵件登入",
    emailRegister: "使用電子郵件註冊",
    processing: "處理中…",
    backLogin: "返回登入",
    createAccount: "註冊新帳號",
    forgotPassword: "忘記密碼？",
    phone: "電話號碼（含國碼）",
    phoneExample: "例如：日本 +81，中國 +86。部分國家需要省略開頭的0。",
    sendSms: "傳送簡訊驗證碼",
    sending: "傳送中…",
    smsCode: "簡訊驗證碼",
    verifying: "驗證中…",
    verifySms: "確認驗證碼並登入",
    or: "或",
    google: "使用 Google 登入",
    footer: "登入後，你可以使用帳號管理自己的學習記錄。",
    emailRegistered: "此電子郵件地址已註冊，請直接登入。",
    invalidEmail: "請確認電子郵件地址格式。",
    weakPassword: "密碼至少需要6個字元。",
    invalidCredential: "請確認登入資訊。",
    popupClosed: "已取消 Google 登入。",
    captcha: "驗證失敗，請再試一次。",
    firebaseSettings: "請檢查 Firebase 驗證設定。",
    generalError: "操作失敗。請檢查輸入內容與 Firebase 設定。",
    enterEmail: "請先輸入電子郵件地址。",
    resetSent: "密碼重設郵件已寄出，請查看收件匣。",
    countryCode: "請輸入含國碼的電話號碼。例如：日本 +81，中國 +86。",
    recaptchaError: "無法載入驗證區域，請重新整理頁面。",
    smsSent: "簡訊已傳送，請輸入收到的驗證碼。",
    enterSms: "請輸入簡訊驗證碼。",
    resetError: "密碼重設失敗，請檢查輸入內容。",
  },
  es: {
    heading: "Iniciar sesión / Registrarse",
    emailTab: "Correo electrónico",
    phoneTab: "Teléfono",
    email: "Correo electrónico",
    password: "Contraseña (al menos 6 caracteres)",
    emailLogin: "Iniciar sesión con correo",
    emailRegister: "Registrarse con correo",
    processing: "Procesando…",
    backLogin: "Volver a iniciar sesión",
    createAccount: "Crear una cuenta",
    forgotPassword: "¿Olvidaste tu contraseña?",
    phone: "Número de teléfono (con prefijo internacional)",
    phoneExample: "Ejemplo: Japón +81, China +86. En algunos países se omite el 0 inicial.",
    sendSms: "Enviar código de verificación por SMS",
    sending: "Enviando…",
    smsCode: "Código de verificación SMS",
    verifying: "Verificando…",
    verifySms: "Verificar código e iniciar sesión",
    or: "o",
    google: "Iniciar sesión con Google",
    footer: "Inicia sesión para gestionar tus registros de estudio con tu cuenta.",
    emailRegistered: "Esta dirección de correo ya está registrada. Inicia sesión.",
    invalidEmail: "Comprueba el formato de tu dirección de correo.",
    weakPassword: "La contraseña debe tener al menos 6 caracteres.",
    invalidCredential: "Comprueba tus datos de inicio de sesión.",
    popupClosed: "Se canceló el inicio de sesión con Google.",
    captcha: "La verificación ha fallado. Inténtalo de nuevo.",
    firebaseSettings: "Comprueba la configuración de autenticación de Firebase.",
    generalError: "No se pudo completar la operación. Comprueba los datos y la configuración de Firebase.",
    enterEmail: "Introduce primero tu dirección de correo.",
    resetSent: "Se ha enviado un correo para restablecer la contraseña. Revisa tu bandeja de entrada.",
    countryCode: "Introduce el número con el prefijo internacional. Ejemplo: Japón +81, China +86.",
    recaptchaError: "No se pudo cargar el campo de verificación. Recarga la página.",
    smsSent: "Se ha enviado un SMS. Introduce el código de verificación recibido.",
    enterSms: "Introduce el código de verificación SMS.",
    resetError: "No se pudo restablecer la contraseña. Comprueba los datos introducidos.",
  },
};

export default function LoginPage() {
  const router = useRouter();
  const { language: appLanguage } = useAppLanguage();

  const currentLanguage = (
    translations[appLanguage as AppLanguage] ? appLanguage : "ja"
  ) as AppLanguage;

  const t = translations[currentLanguage];

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
        setError(t.emailRegistered);
        return;
      }

      if (code.includes("invalid-email")) {
        setError(t.invalidEmail);
        return;
      }

      if (
        code.includes("weak-password") ||
        code.includes("password-too-short")
      ) {
        setError(t.weakPassword);
        return;
      }

      if (
        code.includes("wrong-password") ||
        code.includes("invalid-credential")
      ) {
        setError(t.invalidCredential);
        return;
      }

      if (code.includes("popup-closed-by-user")) {
        setError(t.popupClosed);
        return;
      }

      if (code.includes("captcha") || code.includes("recaptcha")) {
        setError(t.captcha);
        return;
      }

      if (
        code.includes("unauthorized-domain") ||
        code.includes("operation-not-allowed")
      ) {
        setError(t.firebaseSettings);
        return;
      }
    }

    setError(t.generalError);
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
      setError(t.enterEmail);
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setMessage(t.resetSent);
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
        setError(t.countryCode);
        return;
      }

      if (!recaptchaContainer.current) {
        setError(t.recaptchaError);
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
      setMessage(t.smsSent);
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
      setError(t.enterSms);
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
    border: "1px solid var(--anki-theme-soft)",
    borderRadius: 11,
    background: "#FBFCFA",
    color: "#252A25",
    fontSize: 15,
    outlineColor: "var(--anki-theme-color)",
    marginTop: 7,
    accentColor: "var(--anki-theme-color)",
  };

  const primaryButton: React.CSSProperties = {
    width: "100%",
    padding: "13px 16px",
    border: 0,
    borderRadius: 11,
    background: "var(--anki-theme-color)",
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: 650,
    cursor: "pointer",
    transition: "background .18s ease, transform .18s ease",
  };

  const secondaryButton: React.CSSProperties = {
    ...primaryButton,
    background: "var(--anki-theme-light)",
    color: "var(--anki-theme-dark)",
    border: "1px solid var(--anki-theme-soft)",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        boxSizing: "border-box",
        padding: "36px 20px 56px",
        background:
          "radial-gradient(ellipse at 50% 0%, var(--anki-theme-light) 0%, #F6F7F4 43%, #F8F8F6 100%)",
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

        .login-action:disabled {
          cursor: not-allowed;
          opacity: .7;
        }

        .login-field:focus {
          border-color: var(--anki-theme-color) !important;
          outline: 2px solid var(--anki-theme-light);
          outline-offset: 1px;
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
              color: "var(--anki-theme-dark)",
            }}
          >
            <span
              style={{
                width: 43,
                height: 43,
                display: "grid",
                placeItems: "center",
                borderRadius: 15,
                background: "var(--anki-theme-color)",
                color: "#FFFFFF",
                fontWeight: 800,
                fontSize: 20,
                boxShadow: "0 7px 16px var(--anki-theme-light)",
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
            border: "1px solid var(--anki-theme-soft)",
            background: "rgba(255,255,255,.91)",
            boxShadow:
              "0 18px 55px rgba(40,54,40,.07), 0 2px 8px rgba(40,54,40,.025)",
            backdropFilter: "blur(18px)",
          }}
        >
          <div style={{ marginBottom: 23 }}>
            <p
              style={{
                color: "var(--anki-theme-dark)",
                fontSize: 10,
                fontWeight: 750,
                letterSpacing: "2px",
                margin: 0,
              }}
            >
              {t.heading}
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 5,
              padding: 4,
              background: "var(--anki-theme-light)",
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
                  color:
                    mode === item
                      ? "var(--anki-theme-dark)"
                      : "#7E877C",
                  fontSize: 13,
                  fontWeight: mode === item ? 700 : 550,
                  boxShadow:
                    mode === item ? "0 1px 4px #1F2A1F12" : "none",
                  cursor: "pointer",
                }}
              >
                {item === "email" ? t.emailTab : t.phoneTab}
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
                {t.email}
                <input
                  className="login-field"
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
                {t.password}
                <input
                  className="login-field"
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
                  ? t.processing
                  : isRegister
                    ? t.emailRegister
                    : t.emailLogin}
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
                {isRegister ? t.backLogin : t.createAccount}
              </button>

              {!isRegister && (
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  disabled={loading}
                  style={{
                    border: 0,
                    background: "transparent",
                    color: "var(--anki-theme-dark)",
                    fontSize: 12,
                    padding: 5,
                    cursor: "pointer",
                  }}
                >
                  {t.forgotPassword}
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
                {t.phone}
                <input
                  className="login-field"
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
                {t.phoneExample}
              </p>

              <div ref={recaptchaContainer} />

              {!confirmation ? (
                <button
                  className="login-action"
                  type="button"
                  disabled={loading}
                  onClick={handleSendSms}
                  style={{
                    ...primaryButton,
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? t.sending : t.sendSms}
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
                    {t.smsCode}
                    <input
                      className="login-field"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={smsCode}
                      onChange={(e) => setSmsCode(e.target.value)}
                      style={fieldStyle}
                    />
                  </label>

                  <button
                    className="login-action"
                    type="button"
                    disabled={loading}
                    onClick={handleVerifySms}
                    style={{
                      ...primaryButton,
                      opacity: loading ? 0.7 : 1,
                    }}
                  >
                    {loading ? t.verifying : t.verifySms}
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
            {t.or}
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
            {t.google}
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
            {t.footer}
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
