import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, UserPen } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { logout } from "../features/auth/services/auth.services";
import EditProfileModal from "../features/profile/components/EditProfileModal";

/** Shared brand tokens + utility classes used across the app. */
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
      .bg-sage-50 { background-color: var(--sage-50); }
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

      .alert-error {
        background-color: var(--rose-50);
        color: var(--rose-600);
        border: 1px solid #F5D9D6;
      }

      .pfp-dropzone {
        border: 1.5px dashed var(--sage-300);
        background-color: var(--sage-50);
        transition: border-color 0.15s ease, background-color 0.15s ease;
      }
      .pfp-dropzone:hover { border-color: var(--sky-300); background-color: var(--sky-50); }

      .profile-menu {
        border: 1px solid #EEF1E6;
        animation: riseIn 0.15s ease-out forwards;
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
      onClick={() => {
        const navigate = useNavigate();
        navigate("/");
      }}
      width="45"
      height="45"
      aria-hidden="true"
      src="https://lxxnumywddjyjnoqirxe.supabase.co/storage/v1/object/public/assits/logo_1.png"
    />
  );
}

export interface HeaderUserInfo {
  first_name?: string;
  last_name?: string;
  username?: string;
  bio?: string;
  role?: string;
  pfp_path?: string;
}

interface ProfileMenuProps {
  userInfo?: HeaderUserInfo;
}

function ProfileMenu({ userInfo }: ProfileMenuProps): React.ReactElement {
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const name = userInfo?.username || "";
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleLogout = async () => {
    setLoggingOut(true);

    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      setLoggingOut(false);
    }
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="group flex items-center gap-2 rounded-full py-1 pl-1 pr-3 transition-colors duration-200 hover:bg-sage-50 focus-brand"
      >
        {userInfo?.pfp_path ? (
          <img
            src={`https://lxxnumywddjyjnoqirxe.supabase.co/storage/v1/object/public/pfps/${userInfo.pfp_path}`}
            alt={name}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <span className="avatar-ring flex h-10 w-10 items-center justify-center rounded-full font-display text-sm font-semibold text-white">
            {initials}
          </span>
        )}
        <span className="hidden flex-col items-start leading-tight sm:flex">
          <span className="text-sm font-medium text-ink">{name}</span>
          <span className="text-xs text-ink-soft">
            {userInfo?.role || "Field Officer"}
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 text-ink-soft transition-transform duration-200 ${open ? "rotate-180" : "group-hover:translate-y-0.5"}`}
        />
      </button>

      {open && (
        <div className="profile-menu absolute right-0 top-full z-40 mt-2 w-48 overflow-hidden rounded-xl bg-white py-1.5 shadow-lg">
          <button
            type="button"
            onClick={() => {
              setEditOpen(true);
              setOpen(false);
            }}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-ink transition-colors hover:bg-sage-50"
          >
            <UserPen className="h-4 w-4 text-ink-soft" />
            Edit profile
          </button>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-ink transition-colors hover:bg-sage-50 disabled:opacity-60"
          >
            <LogOut className="h-4 w-4 text-ink-soft" />
            {loggingOut ? "Signing out..." : "Logout"}
          </button>
        </div>
      )}

      <EditProfileModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        userInfo={userInfo}
      />
    </div>
  );
}

interface HeaderProps {
  userInfo?: HeaderUserInfo;
}

function Header({ userInfo }: HeaderProps): React.ReactElement {
  return (
    <header className="flex items-center justify-between px-6 py-6 sm:px-10">
      <div className="flex items-center gap-3">
        <Logomark />
        <div className="leading-tight">
          <p className="font-display text-lg font-semibold text-ink">
            Lebaladna
          </p>
          <p className="text-xs uppercase tracking-wide text-ink-soft">
            Smart Research
          </p>
        </div>
      </div>
      <ProfileMenu userInfo={userInfo} />
    </header>
  );
}

interface BodyProps {
  children: React.ReactNode;
  className?: string;
}

function Body({ children, className = "" }: BodyProps): React.ReactElement {
  return <main className={`px-6 pb-16 sm:px-10 ${className}`}>{children}</main>;
}

function Footer(): React.ReactElement {
  return (
    <footer className="border-t border-[#EEF1E6] px-6 py-6 text-center text-xs text-ink-soft sm:px-10">
      © {new Date().getFullYear()} Lebaladna Smart Research. All rights
      reserved.
    </footer>
  );
}

interface LayoutProps {
  children: React.ReactNode;
}

function Layout({ children }: LayoutProps): React.ReactElement {
  return (
    <div className="bg-paper font-body flex min-h-screen flex-col">
      <BrandStyle />
      {children}
    </div>
  );
}

Layout.Header = Header;
Layout.Body = Body;
Layout.Footer = Footer;

export default Layout;
