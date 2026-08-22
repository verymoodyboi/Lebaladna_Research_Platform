// src/pages/pending.page.tsx
import { useAuth } from "../contexts/AuthContext";

const PendingPage = () => {
  const { userInfo } = useAuth();

  return (
    <div className="bg-paper font-body flex min-h-screen items-center justify-center px-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="font-display text-2xl font-semibold text-ink">
          Account pending approval
        </h1>
        <p className="max-w-sm text-sm text-ink-soft">
          Hi {userInfo?.first_name ?? ""}, your account is awaiting authorization.
          You'll be able to access the app once an admin approves it.
        </p>
      </div>
    </div>
  );
};

export default PendingPage;
