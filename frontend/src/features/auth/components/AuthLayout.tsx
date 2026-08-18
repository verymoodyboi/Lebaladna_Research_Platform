import type { ReactNode } from "react";
import { Box, Container, Paper, Typography } from "@mui/material";

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

const AuthLayout = ({ title, subtitle, children }: AuthLayoutProps) => {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        py: 4,
        bgcolor: "background.default",
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            p: { xs: 3, sm: 5 },
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h4"
              // fontWeight={700}
              sx={{ mb: 1 }}
            >
              {title}
            </Typography>

            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>

          {children}
        </Paper>
      </Container>
    </Box>
  );
};

export default AuthLayout;
