import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";

import { useAuth } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { status } = useAuth();

  if (status === "loading") {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace />;
  }

  if (status === "profileSetup") {
    return <Navigate to="/profile/setup" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
