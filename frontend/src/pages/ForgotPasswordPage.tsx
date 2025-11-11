import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";
import { ArrowBack, Email as EmailIcon } from "@mui/icons-material";
import { authService } from "../services/api";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await authService.forgotPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || "Erro ao enviar email");
    } finally {
      setIsLoading(false);
    }
  };

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
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate("/login")}
            sx={{ mb: 2 }}
          >
            Voltar para Login
          </Button>

          <Box sx={{ textAlign: "center", mb: 3 }}>
            <EmailIcon sx={{ fontSize: 60, color: "primary.main", mb: 2 }} />
            <Typography variant="h5" component="h1" fontWeight="bold" gutterBottom>
              Esqueceu sua senha?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Digite seu email e enviaremos um link para redefinir sua senha
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
                Se o email estiver cadastrado, você receberá um link de redefinição em instantes.
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Verifique também sua caixa de spam.
              </Typography>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                margin="normal"
                autoComplete="email"
                autoFocus
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isLoading}
                sx={{ mt: 3 }}
              >
                {isLoading ? <CircularProgress size={24} /> : "Enviar Link de Redefinição"}
              </Button>
            </form>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
