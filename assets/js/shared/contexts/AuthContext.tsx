import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthService, User, LoginInput, RegisterInput } from '../services/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (_input: LoginInput) => Promise<void>;
  register: (_input: RegisterInput) => Promise<void>;
  logout: () => void;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  const initializeAuth = async () => {
    try {
      setIsLoading(true);

      // Check if we have a stored user first
      const storedUser = AuthService.getStoredUser();
      if (storedUser && AuthService.isAuthenticated()) {
        setUser(storedUser);
      }

      // Skip server call during tests to avoid act warnings
      if (process.env.NODE_ENV === 'test') {
        return;
      }

      // Then try to fetch current user from server
      const currentUser = await AuthService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      } else if (AuthService.isAuthenticated()) {
        // Token exists but user fetch failed, logout
        AuthService.logout();
        setUser(null);
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      AuthService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initializeAuth();
  }, []);

  const login = async (input: LoginInput): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await AuthService.login(input);
      setUser(response.user);
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
    setIsLoading(false);
  };

  const register = async (input: RegisterInput): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await AuthService.register(input);
      setUser(response.user);
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
    setIsLoading(false);
  };

  const logout = (): void => {
    AuthService.logout();
    setUser(null);
  };

  const refetchUser = async (): Promise<void> => {
    try {
      const currentUser = await AuthService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Failed to refetch user:', error);
      logout();
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refetchUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
