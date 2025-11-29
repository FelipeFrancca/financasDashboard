import { useState, useMemo, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { createAppTheme } from './theme/theme';
import { AuthProvider } from './contexts/AuthContext';
import { initSwalTheme, applySwalTheme } from './utils/swalTheme';
import PrivateRoute from './components/PrivateRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import GoogleCallbackPage from './pages/GoogleCallbackPage';
import SharedPreviewPage from './pages/SharedPreviewPage';
import LandingPage from './pages/LandingPage';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardFinancial from './pages/DashboardFinancial';
import AccountsPage from './pages/AccountsPage';
import CategoriesPage from './pages/CategoriesPage';
import GoalsPage from './pages/GoalsPage';
import BudgetsPage from './pages/BudgetsPage';
import RecurrencesPage from './pages/RecurrencesPage';
import TransfersPage from './pages/TransfersPage';
import AlertsPage from './pages/AlertsPage';

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
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
