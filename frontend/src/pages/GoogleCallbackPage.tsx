import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useAuth } from "../contexts/AuthContext";

export default function GoogleCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setTokens } = useAuth();

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");

    if (accessToken && refreshToken) {
      setTokens(accessToken, refreshToken);
      navigate("/", { replace: true });
    } else {
      // If no tokens, redirect to login with error
      navigate("/login", { replace: true });
    }
  }, [searchParams, setTokens, navigate]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        gap: 2,
      }}
    >
      <CircularProgress size={60} />
      <Typography variant="h6">Autenticando com Google...</Typography>
    </Box>
  );
}
