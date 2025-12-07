import { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
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
  Alert,
  AlertTitle,
  Collapse,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Google as GoogleIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import { showWarning, showErrorWithRetry } from "../utils/notifications";
import { Logo } from "../components/Logo";

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

// Helper to manage failed login attempts in sessionStorage
const FAILED_ATTEMPTS_KEY = "loginFailedAttempts";

const getFailedAttempts = (): number => {
  const attempts = sessionStorage.getItem(FAILED_ATTEMPTS_KEY);
  return attempts ? parseInt(attempts, 10) : 0;
};

const incrementFailedAttempts = (): number => {
  const current = getFailedAttempts();
  const newCount = current + 1;
  sessionStorage.setItem(FAILED_ATTEMPTS_KEY, newCount.toString());
  return newCount;
};

const resetFailedAttempts = (): void => {
  sessionStorage.removeItem(FAILED_ATTEMPTS_KEY);
};

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login, register, isAuthenticated, isLoading: authLoading, requestPasswordReset, resetPasswordWithCode } = useAuth();
  const theme = useTheme();

  const [tab, setTab] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<{ message: string; code?: string } | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(getFailedAttempts());

  // Forgot Password State
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetStep, setResetStep] = useState(0); // 0: Request Code, 1: Verify Code & New Password
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // Login Form
  const { register: registerLogin, handleSubmit: handleSubmitLogin, watch: watchLogin, formState: { errors: loginErrors } } = useForm({
    defaultValues: {
      email: "",
      password: "",
      rememberMe: true
    }
  });

  // Forgot Password Form
  const { handleSubmit: handleSubmitReset, control: controlReset, formState: { errors: resetErrors }, setValue: setValueReset } = useForm({
    defaultValues: {
      email: "",
      code: "",
      newPassword: ""
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

  // Toggle Forgot Password View
  const toggleForgotPassword = () => {
    if (!isForgotPassword) {
      // Switching TO forgot password - pre-fill email
      const loginEmail = watchLogin("email");
      if (loginEmail) {
        setValueReset("email", loginEmail);
      }
      setResetEmailSent(false);
      setResetError(null);
      setResetStep(0);
    }
    setIsForgotPassword(!isForgotPassword);
    setLoginError(null);
  };

  // Handle Password Reset Submit
  const onResetSubmit = async (data: any) => {
    setIsLoading(true);
    setResetError(null);
    try {
      if (resetStep === 0) {
        // Step 1: Request Code
        await requestPasswordReset(data.email);
        setResetStep(1);
      } else {
        // Step 2: Verify Code and Set New Password
        await resetPasswordWithCode(data.email, data.code, data.newPassword);
        setResetEmailSent(true);
      }
    } catch (err: any) {
      setResetError(err.message || "Erro ao solicitar redefinição de senha");
    } finally {
      setIsLoading(false);
    }
  };



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
      showErrorWithRetry(
        "Falha na autenticação com Google. Verifique se as credenciais OAuth estão configuradas corretamente no arquivo .env do backend.",
        handleGoogleLogin,
        { title: "Erro de Autenticação" }
      );
    }
  }, [searchParams]);

  const from = (location.state as any)?.from?.pathname || "/dashboards";

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
    setLoginError(null); // Clear errors when switching tabs
    setIsForgotPassword(false); // Reset to login view when switching tabs
  };

  const onLoginSubmit = async (data: any) => {
    setIsLoading(true);
    setLoginError(null);

    try {
      await login(data.email, data.password, data.rememberMe);
      // Login successful - reset failed attempts
      resetFailedAttempts();
      setFailedAttempts(0);
      navigate(from, { replace: true });
    } catch (err: any) {
      // Increment failed attempts
      const attempts = incrementFailedAttempts();
      setFailedAttempts(attempts);

      // Display specific error based on error code
      const errorCode = err.code;
      let errorMessage = err.message || "Erro ao fazer login";

      if (errorCode === "EMAIL_NOT_FOUND") {
        errorMessage = "Email não encontrado. Verifique se o email está correto ou crie uma nova conta.";
      } else if (errorCode === "INVALID_PASSWORD") {
        errorMessage = "Senha incorreta. Verifique sua senha e tente novamente.";
      }

      setLoginError({ message: errorMessage, code: errorCode });
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
      showErrorWithRetry(err, () => onRegisterSubmit(data), { title: "Erro ao Criar Conta" });
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
              <Logo variant="full" width={200} sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Gerencie suas finanças pessoais com facilidade
              </Typography>
            </Box>

            {/* Tabs - Hide when in Forgot Password mode for cleaner UI */}
            <Collapse in={!isForgotPassword}>
              <Tabs value={tab} onChange={handleTabChange} variant="fullWidth" sx={{ mb: 2 }}>
                <Tab label="Login" />
                <Tab label="Criar Conta" />
              </Tabs>
            </Collapse>

            {/* Forgot Password Header - Show only when active */}
            <Collapse in={isForgotPassword}>
              <Box sx={{ textAlign: "center", mb: 2 }}>
                <Typography variant="h6" color="primary">
                  Redefinir Senha
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Informe seu email para receber o link de redefinição
                </Typography>
              </Box>
            </Collapse>

            {/* Login Tab */}
            <TabPanel value={tab} index={0}>
              {/* Error Display */}
              <Collapse in={!!loginError && !isForgotPassword}>
                <Alert
                  severity={loginError?.code === "EMAIL_NOT_FOUND" ? "warning" : "error"}
                  sx={{ mb: 2 }}
                  onClose={() => setLoginError(null)}
                >
                  <AlertTitle>
                    {loginError?.code === "EMAIL_NOT_FOUND" ? "Email não encontrado" : "Erro de Autenticação"}
                  </AlertTitle>
                  {loginError?.message}
                </Alert>
              </Collapse>

              {/* Failed Attempts Warning */}
              <Collapse in={failedAttempts >= 3 && !isForgotPassword}>
                <Alert
                  severity="info"
                  icon={<WarningIcon />}
                  sx={{ mb: 2 }}
                >
                  <AlertTitle>Muitas tentativas falhadas</AlertTitle>
                  Você tentou fazer login {failedAttempts} vezes sem sucesso.
                  {" "}
                  <Link
                    component="button"
                    type="button"
                    variant="body2"
                    onClick={toggleForgotPassword}
                    sx={{ fontWeight: "bold", textDecoration: "underline" }}
                  >
                    Considere redefinir sua senha
                  </Link>
                  {" "}caso tenha esquecido.
                </Alert>
              </Collapse>

              {/* Login Form */}
              <Collapse in={!isForgotPassword}>
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
                      onClick={toggleForgotPassword}
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
              </Collapse>

              {/* Forgot Password Form */}
              <Collapse in={isForgotPassword}>
                {resetEmailSent ? (
                  <Box sx={{ textAlign: "center", py: 2 }}>
                    <Alert severity="success" sx={{ mb: 3 }}>
                      <AlertTitle>Senha Redefinida!</AlertTitle>
                      Sua senha foi alterada com sucesso. Você já pode fazer login.
                    </Alert>
                    <Button
                      variant="outlined"
                      onClick={toggleForgotPassword}
                      fullWidth
                    >
                      Voltar para Login
                    </Button>
                  </Box>
                ) : (
                  <form onSubmit={handleSubmitReset(onResetSubmit)}>
                    <Collapse in={!!resetError}>
                      <Alert severity="error" sx={{ mb: 2 }}>
                        {resetError}
                      </Alert>
                    </Collapse>

                    <Controller
                      name="email"
                      control={controlReset}
                      rules={{
                        required: "Email é obrigatório",
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Email inválido"
                        }
                      }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Email"
                          type="email"
                          margin="normal"
                          autoComplete="email"
                          disabled={resetStep === 1}
                          error={!!resetErrors.email}
                          helperText={resetErrors.email?.message as string}
                          InputLabelProps={{ shrink: !!field.value || undefined }}
                        />
                      )}
                    />

                    <Collapse in={resetStep === 1}>
                      <Controller
                        name="code"
                        control={controlReset}
                        rules={{
                          required: resetStep === 1 ? "Código é obrigatório" : false,
                          minLength: { value: 4, message: "Código deve ter 4 dígitos" },
                          maxLength: { value: 4, message: "Código deve ter 4 dígitos" }
                        }}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Código de Verificação (4 dígitos)"
                            margin="normal"
                            inputProps={{ maxLength: 4 }}
                            error={!!resetErrors.code}
                            helperText={resetErrors.code?.message as string}
                          />
                        )}
                      />

                      <Controller
                        name="newPassword"
                        control={controlReset}
                        rules={{
                          required: resetStep === 1 ? "Nova senha é obrigatória" : false,
                          minLength: { value: 8, message: "Senha deve ter no mínimo 8 caracteres" }
                        }}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Nova Senha"
                            type={showPassword ? "text" : "password"}
                            margin="normal"
                            error={!!resetErrors.newPassword}
                            helperText={resetErrors.newPassword?.message as string}
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
                        )}
                      />
                    </Collapse>

                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      size="large"
                      disabled={isLoading}
                      sx={{ mt: 2, mb: 2 }}
                    >
                      {isLoading ? <CircularProgress size={24} /> : (resetStep === 0 ? "Enviar Código de Verificação" : "Redefinir Senha")}
                    </Button>

                    <Button
                      fullWidth
                      variant="text"
                      onClick={toggleForgotPassword}
                      disabled={isLoading}
                    >
                      Voltar para Login
                    </Button>
                  </form>
                )}
              </Collapse>
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
