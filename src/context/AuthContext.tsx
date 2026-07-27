import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  storedPassword: string;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updateProfileName: (fullName: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [storedPassword, setStoredPassword] = useState<string>(() => {
    return localStorage.getItem('wizztech_current_password') || '';
  });

  // Synchronize state with Supabase Auth session on mount and when state changes
  useEffect(() => {
    // 1. Initial active session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    }).catch(() => {
      setIsLoading(false);
    });

    // 2. Subscribe to auth session updates
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Login via Supabase
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.session) {
        setSession(data.session);
        setUser(data.user);
        // Persist entered password locally for current password preview feature
        localStorage.setItem('wizztech_current_password', password);
        setStoredPassword(password);
        toast.success('Successfully logged in');
        return { success: true };
      }

      return { success: false, error: 'Authentication failed' };
    } catch (e: any) {
      return { success: false, error: e.message || 'An unexpected error occurred' };
    } finally {
      setIsLoading(false);
    }
  };

  // Update User Password
  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      localStorage.setItem('wizztech_current_password', newPassword);
      setStoredPassword(newPassword);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to update password' };
    }
  };

  // Update Profile Name
  const updateProfileName = async (fullName: string) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: { full_name: fullName, name: fullName },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        setUser(data.user);
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to update profile name' };
    }
  };

  // Logout via Supabase
  const logout = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error(error.message);
      } else {
        setSession(null);
        setUser(null);
        toast.success('Logged out successfully');
      }
    } catch (e: any) {
      toast.error('Logout error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        storedPassword,
        login,
        logout,
        updatePassword,
        updateProfileName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
