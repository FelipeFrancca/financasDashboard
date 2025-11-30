import { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
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
  useTheme,
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
  const theme = useTheme();

  const [tab, setTab] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Login Form
  const { register: registerLogin, handleSubmit: handleSubmitLogin, formState: { errors: loginErrors } } = useForm({
    defaultValues: {
      email: "",
      password: "",
      rememberMe: true
    }
  });

  // Register Form
  const {
    register: registerSignUp,
    handleSubmit: handleSubmitSignUp,
    watch,
    formState: { errors: signUpErrors }
  } = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: ""
    }
  });



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

  const from = (location.state as any)?.from?.pathname || "/dashboards";

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };

  const onLoginSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password, data.rememberMe);
      navigate(from, { replace: true });
    } catch (err: any) {
      showError(err, { title: "Erro ao Fazer Login" });
    } finally {
      setIsLoading(false);
    }
  };

  const onRegisterSubmit = async (data: any) => {
    if (data.password !== data.confirmPassword) {
      showWarning("As senhas não coincidem", { title: "Validação" });
      return;
    }

    // Validação de senha: deve conter maiúscula, minúscula e número
    const hasUpperCase = /[A-Z]/.test(data.password);
    const hasLowerCase = /[a-z]/.test(data.password);
    const hasNumber = /\d/.test(data.password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      showWarning(
        "A senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número",
        { title: "Validação" }
      );
      return;
    }

    setIsLoading(true);
    try {
      await register(data.email, data.password, data.name);
      navigate(from, { replace: true });
    } catch (err: any) {
      showError(err, { title: "Erro ao Criar Conta" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Use URL relativa quando VITE_API_URL não está definida (produção)
    const apiUrl = import.meta.env.VITE_API_URL === undefined || import.meta.env.VITE_API_URL === '' 
      ? '' 
      : import.meta.env.VITE_API_URL;
    window.location.href = `${apiUrl}/api/auth/google`;
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        background: theme.palette.gradients?.auth || "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
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
              <form onSubmit={handleSubmitLogin(onLoginSubmit)}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  margin="normal"
                  autoComplete="email"
                  error={!!loginErrors.email}
                  helperText={loginErrors.email?.message as string}
                  {...registerLogin("email", { required: "Email é obrigatório" })}
                />
                <TextField
                  fullWidth
                  label="Senha"
                  type={showPassword ? "text" : "password"}
                  margin="normal"
                  autoComplete="current-password"
                  error={!!loginErrors.password}
                  helperText={loginErrors.password?.message as string}
                  {...registerLogin("password", { required: "Senha é obrigatória" })}
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
                      color="primary"
                      {...registerLogin("rememberMe")}
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
              <form onSubmit={handleSubmitSignUp(onRegisterSubmit)}>
                <TextField
                  fullWidth
                  label="Nome"
                  margin="normal"
                  autoComplete="name"
                  {...registerSignUp("name", { required: "Nome é obrigatório" })}
                  error={!!signUpErrors.name}
                  helperText={signUpErrors.name?.message as string}
                />
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  margin="normal"
                  autoComplete="email"
                  {...registerSignUp("email", {
                    required: "Email é obrigatório",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Email inválido"
                    }
                  })}
                  error={!!signUpErrors.email}
                  helperText={signUpErrors.email?.message as string}
                />
                <TextField
                  fullWidth
                  label="Senha"
                  type={showPassword ? "text" : "password"}
                  margin="normal"
                  autoComplete="new-password"
                  helperText={signUpErrors.password?.message as string || "Mínimo 8 caracteres, incluindo maiúscula, minúscula e número"}
                  error={!!signUpErrors.password}
                  {...registerSignUp("password", {
                    required: "Senha é obrigatória",
                    minLength: {
                      value: 8,
                      message: "Mínimo de 8 caracteres"
                    }
                  })}
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
                  margin="normal"
                  autoComplete="new-password"
                  error={!!signUpErrors.confirmPassword}
                  helperText={signUpErrors.confirmPassword?.message as string}
                  {...registerSignUp("confirmPassword", {
                    required: "Confirmação de senha é obrigatória",
                    validate: (val: string) => {
                      if (watch('password') != val) {
                        return "As senhas não coincidem";
                      }
                    },
                  })}
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
