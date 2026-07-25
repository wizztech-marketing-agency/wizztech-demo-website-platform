import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  const { user, isLoading } = useAuth();

  // If already logged in, redirect to dashboard
  if (user && !isLoading) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen relative flex flex-col justify-center items-center px-4 sm:px-6 py-12 select-none overflow-hidden bg-background">
      {/* Background Mesh Gradient Grids */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] rounded-full bg-primary/5 blur-[120px] animate-pulse duration-[8s]" />
        <div className="absolute -bottom-[40%] -right-[20%] w-[80%] h-[80%] rounded-full bg-primary/3 blur-[120px] animate-pulse duration-[12s]" />
      </div>

      {/* Center Layout Card Wrapper */}
      <div className="w-full max-w-[460px] z-10">
        <Outlet />
      </div>

      {/* Footer Branding */}
      <div className="mt-8 text-center z-10">
        <p className="text-[11px] font-medium tracking-widest uppercase text-secondary/60 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" /> WizzTech Website Protection Platform
        </p>
      </div>
    </div>
  );
};
