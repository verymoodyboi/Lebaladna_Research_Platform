// src/pages/pending.page.tsx
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const POLL_INTERVAL_MS = 5000;

const PendingPage = () => {
  const { userInfo, status, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const pollingRef = useRef<number | null>(null);

  // Redirect to the origin page once authorization lands.
  useEffect(() => {
    if (status === "authenticated") {
      navigate("/", { replace: true });
    }
  }, [status, navigate]);

  // Re-check the profile on mount (covers a stale in-memory status) and
  // keep polling while we sit on this page, in case an admin approves
  // the account without the user refreshing the page themselves.
  useEffect(() => {
    void refreshProfile();

    pollingRef.current = window.setInterval(() => {
      void refreshProfile();
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollingRef.current !== null) {
        window.clearInterval(pollingRef.current);
      }
    };
  }, [refreshProfile]);

  return (
    <div className="bg-paper font-body flex min-h-screen items-center justify-center px-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="font-display text-2xl font-semibold text-ink">
          Account pending approval
        </h1>
        <p className="max-w-sm text-sm text-ink-soft">
          Hi {userInfo?.first_name ?? ""}, your account is awaiting
          authorization. This page will refresh automatically and take you in
          once an admin approves it.
        </p>
      </div>
    </div>
  );
};

export default PendingPage;
