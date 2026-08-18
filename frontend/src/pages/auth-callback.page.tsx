import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import supabase from "../lib/supabaseClient";
import { fetchMe } from "../features/auth/services/auth.services";

/**
 * Landing route for Supabase OAuth (Google) redirects, and for the
 * emailRedirectTo confirmation link. Resolves the session, then checks
 * whether a `public.users` row already exists for this auth user:
 *  - exists    -> /home
 *  - missing   -> /setup-profile (first-time Google sign-in, or a just
 *                 confirmed email/password signup)
 */
const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    const resolveSession = async () => {
      const { data, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !data.session) {
        setError("We couldn't sign you in. Please try again.");
        setTimeout(() => navigate("/login", { replace: true }), 1500);
        return;
      }

      try {
        const { userInfo } = await fetchMe();
        navigate(userInfo ? "/home" : "/auth/setup-profile", { replace: true });
      } catch (fetchError) {
        console.error("Error checking profile:", fetchError);

        navigate("/setup-profile", { replace: true });
      }
    };

    resolveSession();
  }, [navigate]);

  return (
    <div className="bg-paper font-body flex min-h-screen items-center justify-center px-6">
      <div className="flex flex-col items-center gap-3">
        {error ? (
          <div className="alert-error rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        ) : (
          <>
            <span
              className="h-8 w-8 animate-spin rounded-full border-2"
              style={{
                borderColor: "var(--sky-200)",
                borderTopColor: "var(--sky-500)",
              }}
            />
            <p className="text-sm text-ink-soft">Signing you in...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallbackPage;
