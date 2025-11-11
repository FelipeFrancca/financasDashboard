import { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import {
  Box,
  Container,
  Paper,
  Tabs,
  Tab,
  TextField,
  Button,
  Typography,
  Link,
  Divider,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Google as GoogleIcon,
  AccountBalance as AccountBalanceIcon,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login, register } = useAuth();

  const [tab, setTab] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for Google OAuth error
  useEffect(() => {
    const googleError = searchParams.get("error");
    if (googleError === "google_auth_failed") {
      setError(
        "Falha na autenticação com Google. Verifique se as credenciais OAuth estão configuradas corretamente no arquivo .env do backend. Consulte GOOGLE_OAUTH_SETUP.md para instruções."
      );
    }
  }, [searchParams]);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form state
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");

  const from = (location.state as any)?.from?.pathname || "/";

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
    setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(loginEmail, loginPassword);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.error || "Erro ao fazer login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (registerPassword !== registerConfirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    if (registerPassword.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setIsLoading(true);

    try {
      await register(registerEmail, registerPassword, registerName);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.error || "Erro ao criar conta");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:5000/api/auth/google";
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
        <Paper elevation={24} sx={{ overflow: "hidden" }}>
          <Box sx={{ p: 4 }}>
            {/* Logo/Header */}
            <Box sx={{ textAlign: "center", mb: 3 }}>
              <AccountBalanceIcon sx={{ fontSize: 60, color: "primary.main", mb: 1 }} />
              <Typography variant="h4" component="h1" fontWeight="bold">
                Finanças Dashboard
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Gerencie suas finanças pessoais com facilidade
              </Typography>
            </Box>

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {/* Tabs */}
            <Tabs value={tab} onChange={handleTabChange} variant="fullWidth" sx={{ mb: 2 }}>
              <Tab label="Login" />
              <Tab label="Criar Conta" />
            </Tabs>

            {/* Login Tab */}
            <TabPanel value={tab} index={0}>
              <form onSubmit={handleLogin}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  margin="normal"
                  autoComplete="email"
                />
                <TextField
                  fullWidth
                  label="Senha"
                  type={showPassword ? "text" : "password"}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  margin="normal"
                  autoComplete="current-password"
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

                <Box sx={{ textAlign: "right", mt: 1, mb: 2 }}>
                  <Link
                    component="button"
                    type="button"
                    variant="body2"
                    onClick={() => navigate("/forgot-password")}
                  >
                    Esqueceu sua senha?
                  </Link>
                </Box>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={isLoading}
                  sx={{ mb: 2 }}
                >
                  {isLoading ? <CircularProgress size={24} /> : "Entrar"}
                </Button>
              </form>
            </TabPanel>

            {/* Register Tab */}
            <TabPanel value={tab} index={1}>
              <form onSubmit={handleRegister}>
                <TextField
                  fullWidth
                  label="Nome"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  margin="normal"
                  autoComplete="name"
                />
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  required
                  margin="normal"
                  autoComplete="email"
                />
                <TextField
                  fullWidth
                  label="Senha"
                  type={showPassword ? "text" : "password"}
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
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
                  label="Confirmar Senha"
                  type={showPassword ? "text" : "password"}
                  value={registerConfirmPassword}
                  onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                  required
                  margin="normal"
                  autoComplete="new-password"
                  error={
                    registerConfirmPassword.length > 0 &&
                    registerPassword !== registerConfirmPassword
                  }
                  helperText={
                    registerConfirmPassword.length > 0 &&
                    registerPassword !== registerConfirmPassword
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
                  sx={{ mt: 3, mb: 2 }}
                >
                  {isLoading ? <CircularProgress size={24} /> : "Criar Conta"}
                </Button>
              </form>
            </TabPanel>

            {/* Divider */}
            <Divider sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                OU
              </Typography>
            </Divider>

            {/* Google Login */}
            <Button
              fullWidth
              variant="outlined"
              size="large"
              startIcon={<GoogleIcon />}
              onClick={handleGoogleLogin}
              sx={{ mb: 2 }}
            >
              Continuar com Google
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
