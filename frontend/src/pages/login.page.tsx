import React, { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  fetchMe,
  loginWithEmail,
  loginWithGoogle,
} from "../features/auth/services/auth.services";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FieldErrors {
  email?: string;
  password?: string;
}

/**
 * Shared brand style block — mirrors home.page.tsx exactly (same CSS
 * variables, type pairing, and utility classes) so every screen in the
 * app reads as one visual system.
 */
function BrandStyle(): React.ReactElement {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap');

      :root {
        --sage-50:  #F3F9E9;
        --sage-100: #E7F2D3;
        --sage-200: #D5E9B3;
        --sage-300: #BFDE8C;
        --sage-500: #a8d45c;
        --sage-700: #5F8329;
        --sky-50:   #EAF8FD;
        --sky-100:  #D2F0FB;
        --sky-200:  #A9E3F6;
        --sky-300:  #7FD5F1;
        --sky-500:  #00aff0;
        --sky-700:  #046895;
        --ink:      #25321F;
        --ink-soft: #5B6A54;
        --paper:    #F8FAF3;
        --rose-50:  #FDF1F0;
        --rose-600: #C1483F;
      }

      .font-display { font-family: 'Fraunces', serif; }
      .font-body { font-family: 'Inter', sans-serif; }

      .bg-paper { background-color: var(--paper); }
      .text-ink { color: var(--ink); }
      .text-ink-soft { color: var(--ink-soft); }

      .avatar-ring {
        background: linear-gradient(135deg, var(--sage-500), var(--sky-500));
      }

      .auth-card {
        border: 1px solid #EEF1E6;
        position: relative;
        overflow: hidden;
      }
      .auth-card::before {
        content: "";
        position: absolute;
        inset: 0 0 auto 0;
        height: 4px;
        background: linear-gradient(90deg, var(--sage-500), var(--sky-500));
      }

      .btn-primary {
        background: linear-gradient(135deg, var(--sage-500), var(--sky-500));
        color: white;
        transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
      }
      .btn-primary:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 12px 24px -12px rgba(0, 175, 240, 0.45);
      }
      .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

      .btn-secondary {
        background: white;
        color: var(--ink);
        border: 1px solid #E3E8DA;
        transition: background-color 0.15s ease, border-color 0.15s ease;
      }
      .btn-secondary:hover:not(:disabled) {
        background-color: var(--sage-50);
        border-color: var(--sage-300);
      }
      .btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }

      .input-brand {
        border: 1px solid #E3E8DA;
        background-color: white;
        transition: border-color 0.15s ease, box-shadow 0.15s ease;
      }
      .input-brand:focus { border-color: var(--sky-300); }
      .input-brand:disabled { background-color: var(--sage-50); }
      .input-brand.input-invalid { border-color: var(--rose-600); }

      .focus-brand:focus-visible {
        outline: 2px solid var(--sky-500);
        outline-offset: 2px;
      }

      .link-brand { color: var(--sky-700); font-weight: 500; }
      .link-brand:hover { text-decoration: underline; }

      .field-error {
        color: var(--rose-600);
        font-size: 0.75rem;
      }

      .divider-brand {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        color: var(--ink-soft);
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .divider-brand::before,
      .divider-brand::after {
        content: "";
        flex: 1;
        height: 1px;
        background-color: #EAEEE1;
      }

      .alert-error {
        background-color: var(--rose-50);
        color: var(--rose-600);
        border: 1px solid #F5D9D6;
      }
      .alert-success {
        background-color: var(--sage-50);
        color: var(--sage-700);
        border: 1px solid var(--sage-200);
      }

      .pfp-dropzone {
        border: 1.5px dashed var(--sage-300);
        background-color: var(--sage-50);
        transition: border-color 0.15s ease, background-color 0.15s ease;
      }
      .pfp-dropzone:hover { border-color: var(--sky-300); background-color: var(--sky-50); }

      .animate-riseIn {
        opacity: 0;
        animation: riseIn 0.5s ease-out forwards;
      }
      @keyframes riseIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      @media (prefers-reduced-motion: reduce) {
        .animate-riseIn { animation: none !important; opacity: 1 !important; transform: none !important; }
      }
    `}</style>
  );
}

function Logomark(): React.ReactElement {
  return (
    <img
      width="45"
      height="45"
      aria-hidden="true"
      src="https://lxxnumywddjyjnoqirxe.supabase.co/storage/v1/object/public/assits/logo_1.png"
    />
  );
}

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

function AuthShell({
  title,
  subtitle,
  children,
}: AuthShellProps): React.ReactElement {
  return (
    <div className="bg-paper font-body flex min-h-screen flex-col">
      <BrandStyle />

      <header className="flex items-center gap-3 px-6 py-6 sm:px-10">
        <Logomark />
        <div className="leading-tight">
          <p className="font-display text-lg font-semibold text-ink">
            Lebaladna
          </p>
          <p className="text-xs uppercase tracking-wide text-ink-soft">
            Smart Research
          </p>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 pb-16">
        <div
          className="auth-card animate-riseIn w-full max-w-md rounded-3xl bg-white p-8 shadow-sm sm:p-10"
          style={{ animationDelay: "60ms" }}
        >
          <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
            {title}
          </h1>
          <p className="mt-2 text-sm text-ink-soft">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </main>
    </div>
  );
}

const LoginPage = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};

    if (!email.trim()) {
      errors.email = "Email is required.";
    } else if (!EMAIL_REGEX.test(email.trim())) {
      errors.email = "Enter a valid email address.";
    }

    if (!password) {
      errors.password = "Password is required.";
    }

    return errors;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");

    const errors = validate();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setLoading(true);

    try {
      await loginWithEmail(email.trim(), password);

      // A confirmed email/password user might still be missing their
      // public.users row (e.g. they signed up, confirmed by email, and
      // this is their first login) — send them to finish setup.
      const { userInfo } = await fetchMe();

      if (!userInfo) {
        navigate("/auth/setup-profile", { replace: true });
      } else if (userInfo.autherized === false) {
        console.log("userInfo.autherized:", userInfo.autherized);
        navigate("/pending", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (error) {
      console.error("Login error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to sign in. Please check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setGoogleLoading(true);

    try {
      await loginWithGoogle();
    } catch (error) {
      console.error("Google login error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to continue with Google.",
      );

      setGoogleLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue to the survey system."
    >
      <div className="flex flex-col gap-5">
        {error && (
          <div className="alert-error rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-4"
        >
          <label className="flex w-full flex-col gap-1.5" htmlFor="email">
            <span className="text-sm font-medium text-ink">Email</span>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (fieldErrors.email) {
                  setFieldErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              aria-invalid={Boolean(fieldErrors.email)}
              disabled={loading || googleLoading}
              className={`input-brand focus-brand w-full rounded-xl px-3.5 py-2.5 text-sm text-ink disabled:cursor-not-allowed disabled:opacity-60 ${
                fieldErrors.email ? "input-invalid" : ""
              }`}
            />
            {fieldErrors.email && (
              <span className="field-error">{fieldErrors.email}</span>
            )}
          </label>

          <label className="flex w-full flex-col gap-1.5" htmlFor="password">
            <span className="text-sm font-medium text-ink">Password</span>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (fieldErrors.password) {
                  setFieldErrors((prev) => ({ ...prev, password: undefined }));
                }
              }}
              aria-invalid={Boolean(fieldErrors.password)}
              disabled={loading || googleLoading}
              className={`input-brand focus-brand w-full rounded-xl px-3.5 py-2.5 text-sm text-ink disabled:cursor-not-allowed disabled:opacity-60 ${
                fieldErrors.password ? "input-invalid" : ""
              }`}
            />
            {fieldErrors.password && (
              <span className="field-error">{fieldErrors.password}</span>
            )}
          </label>

          <div className="text-right">
            <Link
              to="#"
              className="text-sm text-ink-soft transition-colors hover:text-ink hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="btn-primary focus-brand w-full rounded-xl py-3 text-sm font-semibold"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="divider-brand">or</div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading || googleLoading}
          className="btn-secondary focus-brand w-full rounded-xl py-3 text-sm font-medium"
        >
          {googleLoading ? "Connecting..." : "Continue with Google"}
        </button>

        <p className="text-center text-sm text-ink-soft">
          Don't have an account?{" "}
          <Link to="/signup" className="link-brand">
            Create one
          </Link>
        </p>
      </div>
    </AuthShell>
  );
};

export default LoginPage;