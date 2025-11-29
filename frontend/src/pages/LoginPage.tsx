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
  InputAdornment,
  IconButton,
  CircularProgress,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Google as GoogleIcon,
  AccountBalance as AccountBalanceIcon,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import { showError, showWarning } from "../utils/notifications";

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
  const { login, register, isAuthenticated, isLoading: authLoading } = useAuth();

  const [tab, setTab] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate("/dashboards", { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Check for Google OAuth error
  useEffect(() => {
    const googleError = searchParams.get("error");
    if (googleError === "google_auth_failed") {
      showError(
        "Falha na autenticação com Google. Verifique se as credenciais OAuth estão configuradas corretamente no arquivo .env do backend.",
        { title: "Erro de Autenticação" }
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

  const from = (location.state as any)?.from?.pathname || "/dashboards";

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(loginEmail, loginPassword, rememberMe);
      navigate(from, { replace: true });
    } catch (err: any) {
      showError(err, { title: "Erro ao Fazer Login" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (registerPassword !== registerConfirmPassword) {
      showWarning("As senhas não coincidem", { title: "Validação" });
      return;
    }

    if (registerPassword.length < 8) {
      showWarning("A senha deve ter pelo menos 8 caracteres", { title: "Validação" });
      return;
    }

    // Validação de senha: deve conter maiúscula, minúscula e número
    const hasUpperCase = /[A-Z]/.test(registerPassword);
    const hasLowerCase = /[a-z]/.test(registerPassword);
    const hasNumber = /\d/.test(registerPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      showWarning(
        "A senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número",
        { title: "Validação" }
      );
      return;
    }

    setIsLoading(true);

    try {
      await register(registerEmail, registerPassword, registerName);
      navigate(from, { replace: true });
    } catch (err: any) {
      showError(err, { title: "Erro ao Criar Conta" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
    window.location.href = `${apiUrl}/api/auth/google`;
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

                <FormControlLabel
                  control={
                    <Checkbox
                      value="remember"
                      color="primary"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                  }
                  label="Permanecer conectado"
                />

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
                  helperText="Mínimo 8 caracteres, incluindo maiúscula, minúscula e número"
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
