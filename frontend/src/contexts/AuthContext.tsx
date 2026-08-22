import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

import supabase from "../lib/supabaseClient";
import { api } from "../lib/api";

import type { Session, User } from "@supabase/supabase-js";
import type { ReactNode } from "react";

type AuthStatus =
  | "loading"
  | "unauthenticated"
  | "authenticated"
  | "profileSetup"
  | "pending";

interface UserInfo {
  user_id: string;
  first_name: string;
  last_name: string;
  username: string;
  auth_id: string;
  bio: string | null;
  role: string | null;
  pfp_path: string | null;
  autherized: any;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  status: AuthStatus;
  userInfo: UserInfo | null;
  username: string;
  getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  status: "loading",
  userInfo: null,
  username: "",
  getAccessToken: async () => null,
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const getAccessToken = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session?.access_token ?? null;
  }, []);

  const isGoogleUser = (user: User) => {
    return (
      user.app_metadata?.provider === "google" ||
      user.identities?.some((identity) => identity.provider === "google") ===
        true
    );
  };

  const loadProfile = useCallback(async (currentSession: Session) => {
    setSession(currentSession);
    setUser(currentSession.user);

    try {
      const response = await api.get("/auth/me");

      const profile = response.data?.userInfo ?? null;

      if (profile) {
        console.log("userInfo.autherized:", profile.autherized);

        setUserInfo(profile);
        setStatus(profile.autherized === false ? "pending" : "authenticated");
        return;
      }

      setUserInfo(null);

      if (isGoogleUser(currentSession.user)) {
        setStatus("profileSetup");
      } else {
        setStatus("unauthenticated");
      }
    } catch (error) {
      console.error("Error loading user profile:", error);

      setUserInfo(null);

      /*
       * A missing profile for a Google-authenticated user
       * means they need to complete their application profile.
       *
       * Once /auth/me has a proper 404 response contract,
       * this can be made more precise by checking the status code.
       */
      if (isGoogleUser(currentSession.user)) {
        setStatus("profileSetup");
      } else {
        setStatus("unauthenticated");
      }
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          setSession(null);
          setUser(null);
          setUserInfo(null);
          setStatus("unauthenticated");
          return;
        }

        await loadProfile(session);
      } catch (error) {
        console.error("Auth initialization error:", error);

        setSession(null);
        setUser(null);
        setUserInfo(null);
        setStatus("unauthenticated");
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        setSession(null);
        setUser(null);
        setUserInfo(null);
        setStatus("unauthenticated");
        return;
      }

      await loadProfile(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        status,
        userInfo,
        username: userInfo?.username ?? "",
        getAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
