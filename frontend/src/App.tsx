import { useState, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { createAppTheme } from './theme/theme';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import GoogleCallbackPage from './pages/GoogleCallbackPage';
import SharedPreviewPage from './pages/SharedPreviewPage';

function App() {
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('finance-dashboard-theme');
    return (saved === 'light' ? 'light' : 'dark') as 'light' | 'dark';
  });

  const theme = useMemo(() => createAppTheme(mode), [mode]);

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
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/auth/callback" element={<GoogleCallbackPage />} />
            <Route path="/shared/:code" element={<SharedPreviewPage />} />

            {/* Private routes */}
            <Route
              path="/"
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
                  <HomePage mode={mode} onToggleTheme={toggleTheme} />
                </PrivateRoute>
              }
            />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
