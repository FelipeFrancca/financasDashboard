import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { Visibility, VisibilityOff, Lock as LockIcon } from "@mui/icons-material";
import { authService } from "../services/api";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Token inválido");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setIsLoading(true);

    try {
      await authService.resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Erro ao redefinir senha");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      >
        <Container maxWidth="sm">
          <Paper elevation={24} sx={{ p: 4 }}>
            <Alert severity="error">
              Token de redefinição inválido ou ausente.
            </Alert>
            <Button
              fullWidth
              variant="contained"
              sx={{ mt: 2 }}
              onClick={() => navigate("/login")}
            >
              Voltar para Login
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <Container maxWidth="sm">
        <Paper elevation={24} sx={{ p: 4 }}>
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <LockIcon sx={{ fontSize: 60, color: "primary.main", mb: 2 }} />
            <Typography variant="h5" component="h1" fontWeight="bold" gutterBottom>
              Redefinir Senha
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Digite sua nova senha abaixo
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {success ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Senha redefinida com sucesso! Redirecionando para login...
              </Typography>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Nova Senha"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                margin="normal"
                autoComplete="new-password"
                helperText="Mínimo de 6 caracteres"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth
                label="Confirmar Nova Senha"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                margin="normal"
                autoComplete="new-password"
                error={confirmPassword.length > 0 && password !== confirmPassword}
                helperText={
                  confirmPassword.length > 0 && password !== confirmPassword
                    ? "As senhas não coincidem"
                    : ""
                }
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isLoading}
                sx={{ mt: 3 }}
              >
                {isLoading ? <CircularProgress size={24} /> : "Redefinir Senha"}
              </Button>
            </form>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
