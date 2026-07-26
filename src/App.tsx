import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { AuthLayout } from './layouts/AuthLayout';
import { Login } from './views/auth/Login';
import { ForgotPassword } from './views/auth/ForgotPassword';
import { DashboardLayout } from './layouts/DashboardLayout';
import { DashboardHome } from './views/dashboard/DashboardHome';
import { Websites } from './views/websites/Websites';
import { DemoLinks } from './views/demo-links/DemoLinks';
import { IframeAuthCheck } from './views/auth/IframeAuthCheck';

import { ErrorBoundary } from './components/ErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public/Auth Routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
            </Route>

            {/* Cross-Domain Protection Auth Frame */}
            <Route path="/iframe-auth-check" element={<IframeAuthCheck />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<DashboardHome />} />
                <Route path="websites" element={<Websites />} />
                <Route path="demo-links" element={<DemoLinks />} />
              </Route>
            </Route>

            {/* Fallback Redirection */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
        
        {/* Global Premium Feedback Notification Toasts */}
        <Toaster 
          position="top-right" 
          toastOptions={{
            duration: 3500,
            style: {
              background: '#FFFFFF',
              color: '#111111',
              border: '1px solid rgba(234, 230, 223, 0.8)',
              borderRadius: '14px',
              fontSize: '12px',
              fontWeight: 600,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
              fontFamily: 'Outfit, Inter, sans-serif',
            },
            success: {
              iconTheme: {
                primary: '#FB7C29',
                secondary: '#FFFFFF',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#FFFFFF',
              },
            },
          }} 
        />
      </AuthProvider>
    </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
