import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { Box, Flex } from '@chakra-ui/react';

// Import layouts
import AuthLayout from './layouts/AuthLayout';
import MainLayout from './layouts/MainLayout';

// Import pages
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import TasksPage from './pages/tasks/TasksPage';
import TaskDetailPage from './pages/tasks/TaskDetailPage';
import EmailsPage from './pages/emails/EmailsPage';
import EmailDetailPage from './pages/emails/EmailDetailPage';
import TeamsPage from './pages/teams/TeamsPage';
import TeamDetailPage from './pages/teams/TeamDetailPage';
import ProfilePage from './pages/profile/ProfilePage';
import SettingsPage from './pages/settings/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';

// Import components
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoadingScreen from './components/common/LoadingScreen';

// Import selectors and actions
import { RootState } from './store';
import { setLanguage } from './store/slices/uiSlice';
import { useDirection } from './context/DirectionContext';

const App: React.FC = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, loading } = useSelector((state: RootState) => state.auth);
  const { currentLanguage } = useSelector((state: RootState) => state.ui);
  const { i18n } = useTranslation();
  const { direction, setDirection } = useDirection();

  // Sync language with i18n and UI state
  useEffect(() => {
    if (i18n.language !== currentLanguage) {
      i18n.changeLanguage(currentLanguage);
      
      // Update direction based on language
      if (currentLanguage === 'he') {
        setDirection('rtl');
      } else {
        setDirection('ltr');
      }
    }
  }, [currentLanguage, i18n, setDirection]);

  // Detect browser language on first load
  useEffect(() => {
    // Detect browser language preference if not already set
    const browserLang = navigator.language.split('-')[0];
    if (['he', 'en'].includes(browserLang) && !currentLanguage) {
      dispatch(setLanguage(browserLang as 'he' | 'en'));
    }
  }, [dispatch, currentLanguage]);

  // Add Hebrew font preloading
  useEffect(() => {
    // Preload Hebrew fonts
    const fontLinks = [
      { href: 'https://fonts.googleapis.com/css2?family=Assistant:wght@400;500;600;700&display=swap', rel: 'stylesheet' },
      { href: 'https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700&display=swap', rel: 'stylesheet' }
    ];

    fontLinks.forEach(link => {
      const linkElement = document.createElement('link');
      linkElement.rel = link.rel;
      linkElement.href = link.href;
      document.head.appendChild(linkElement);
    });
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Box dir={direction}>
      <Routes>
        {/* Auth routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
          <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />
          <Route path="/forgot-password" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <ForgotPasswordPage />} />
        </Route>

        {/* Protected routes */}
        <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            
            {/* Tasks routes */}
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/tasks/:taskId" element={<TaskDetailPage />} />
            
            {/* Emails routes */}
            <Route path="/emails" element={<EmailsPage />} />
            <Route path="/emails/:emailId" element={<EmailDetailPage />} />
            
            {/* Teams routes */}
            <Route path="/teams" element={<TeamsPage />} />
            <Route path="/teams/:teamId" element={<TeamDetailPage />} />
            
            {/* User routes */}
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* 404 route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Box>
  );
};

export default App; 