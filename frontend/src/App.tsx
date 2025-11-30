import { useState, useMemo, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, CircularProgress } from '@mui/material';
import { createAppTheme } from './theme/theme';
import { AuthProvider } from './contexts/AuthContext';
import { initSwalTheme, applySwalTheme } from './utils/swalTheme';
import PrivateRoute from './components/PrivateRoute';

// Lazy imports
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const GoogleCallbackPage = lazy(() => import('./pages/GoogleCallbackPage'));
const SharedPreviewPage = lazy(() => import('./pages/SharedPreviewPage'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const DashboardLayout = lazy(() => import('./layouts/DashboardLayout'));
const DashboardFinancial = lazy(() => import('./pages/DashboardFinancial'));
const AccountsPage = lazy(() => import('./pages/AccountsPage'));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'));
const GoalsPage = lazy(() => import('./pages/GoalsPage'));
const BudgetsPage = lazy(() => import('./pages/BudgetsPage'));
const RecurrencesPage = lazy(() => import('./pages/RecurrencesPage'));
const TransfersPage = lazy(() => import('./pages/TransfersPage'));
const AlertsPage = lazy(() => import('./pages/AlertsPage'));

const PageLoader = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <CircularProgress />
  </Box>
);

function App() {
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('finance-dashboard-theme');
    return (saved === 'light' ? 'light' : 'dark') as 'light' | 'dark';
  });

  const theme = useMemo(() => createAppTheme(mode), [mode]);

  // Inicializa tema do SweetAlert2
  useEffect(() => {
    initSwalTheme();
  }, []);

  // Atualiza tema do SweetAlert2 quando o modo mudar
  useEffect(() => {
    applySwalTheme(mode);
  }, [mode]);

  const toggleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    localStorage.setItem('finance-dashboard-theme', newMode);
  };

  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/auth/callback" element={<GoogleCallbackPage />} />
              <Route path="/shared/:code" element={<SharedPreviewPage />} />

              {/* Private routes */}
              <Route
                path="/dashboards"
                element={
                  <PrivateRoute>
                    <HomePage mode={mode} onToggleTheme={toggleTheme} />
                  </PrivateRoute>
                }
              />

              <Route
                path="/dashboard/:dashboardId"
                element={
                  <PrivateRoute>
                    <DashboardLayout mode={mode} onToggleTheme={toggleTheme} />
                  </PrivateRoute>
                }
              >
                <Route index element={<DashboardFinancial />} />
                <Route path="accounts" element={<AccountsPage />} />
                <Route path="categories" element={<CategoriesPage />} />
                <Route path="goals" element={<GoalsPage />} />
                <Route path="budgets" element={<BudgetsPage />} />
                <Route path="recurrences" element={<RecurrencesPage />} />
                <Route path="transfers" element={<TransfersPage />} />
                <Route path="alerts" element={<AlertsPage />} />
              </Route>

              {/* Catch all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
