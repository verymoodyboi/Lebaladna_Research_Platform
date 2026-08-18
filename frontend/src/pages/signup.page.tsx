import React, { useRef, useState, type FormEvent } from "react";
import { Camera } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import {
  createProfile,
  signupWithEmail,
  uploadPfp,
} from "../features/auth/services/auth.services";

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

      .focus-brand:focus-visible {
        outline: 2px solid var(--sky-500);
        outline-offset: 2px;
      }

      .link-brand { color: var(--sky-700); font-weight: 500; }
      .link-brand:hover { text-decoration: underline; }

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

interface PfpUploadProps {
  onFileSelected: (file: File | null) => void;
  disabled?: boolean;
}

function PfpUpload({
  onFileSelected,
  disabled,
}: PfpUploadProps): React.ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    onFileSelected(file);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        className="pfp-dropzone focus-brand flex h-20 w-20 items-center justify-center overflow-hidden rounded-full disabled:cursor-not-allowed disabled:opacity-60"
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Profile preview"
            className="h-full w-full object-cover"
          />
        ) : (
          <Camera
            className="h-6 w-6 text-sage-700"
            style={{ color: "var(--sage-700)" }}
          />
        )}
      </button>
      <span className="text-xs text-ink-soft">Add a photo (optional)</span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        disabled={disabled}
        className="hidden"
      />
    </div>
  );
}

const SignupPage = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setInfoMessage("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { user, session } = await signupWithEmail(email, password);

      if (!user) {
        throw new Error("Unable to create account. Please try again.");
      }

      if (!session) {
        setInfoMessage(
          "Check your inbox to confirm your email, then sign in to finish setting up your profile.",
        );
        return;
      }

      navigate("/home", { replace: true });
    } catch (error) {
      console.error("Signup error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to create your account. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Set up your account to start managing beneficiary surveys."
    >
      <div className="flex flex-col gap-5">
        {error && (
          <div className="alert-error rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}
        {infoMessage && (
          <div className="alert-success rounded-xl px-4 py-3 text-sm">
            {infoMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex w-full flex-col gap-1.5" htmlFor="email">
            <span className="text-sm font-medium text-ink">Email</span>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              disabled={loading}
              className="input-brand focus-brand w-full rounded-xl px-3.5 py-2.5 text-sm text-ink disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>

          <label className="flex w-full flex-col gap-1.5" htmlFor="password">
            <span className="text-sm font-medium text-ink">Password</span>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={loading}
              className="input-brand focus-brand w-full rounded-xl px-3.5 py-2.5 text-sm text-ink disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>

          <label
            className="flex w-full flex-col gap-1.5"
            htmlFor="confirmPassword"
          >
            <span className="text-sm font-medium text-ink">
              Confirm password
            </span>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              disabled={loading}
              className="input-brand focus-brand w-full rounded-xl px-3.5 py-2.5 text-sm text-ink disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary focus-brand mt-1 w-full rounded-xl py-3 text-sm font-semibold"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="text-center text-sm text-ink-soft">
          Already have an account?{" "}
          <Link to="/login" className="link-brand">
            Sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
};

export default SignupPage;
