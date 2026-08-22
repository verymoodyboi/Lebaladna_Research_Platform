import React, { useState } from "react";

import { loginWithGoogle } from "../features/auth/services/auth.services";

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

      .focus-brand:focus-visible {
        outline: 2px solid var(--sky-500);
        outline-offset: 2px;
      }

      .alert-error {
        background-color: var(--rose-50);
        color: var(--rose-600);
        border: 1px solid #F5D9D6;
      }

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

function GoogleIcon(): React.ReactElement {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
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
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

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

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="btn-secondary focus-brand flex w-full items-center justify-center gap-2.5 rounded-xl py-3 text-sm font-medium"
        >
          <GoogleIcon />
          {googleLoading ? "Connecting..." : "Continue with Google"}
        </button>
      </div>
    </AuthShell>
  );
};

export default LoginPage;