import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '../services/api';

interface User {
  carnet?: string;
  username?: string;
  nombre: string;
  rol: string;
  tipo?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (credential: string, password?: string, isCpf?: boolean) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { localStorage.removeItem('user'); }
    }
  }, []);

  const login = async (credential: string, password?: string, isCpf = false) => {
    let data: any;

    if (isCpf) {
      // CPF login with username + password
      const res = await api.post('/auth/cpf-login', { username: credential, password });
      data = res.data;
    } else if (password) {
      // SSO login (from Portal)
      const res = await api.post('/auth/sso-login', { token: credential });
      data = res.data;
    } else {
      // Dev login (only carnet, temporary)
      const res = await api.post('/auth/dev-login', { carnet: credential });
      data = res.data;
    }

    localStorage.setItem('token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/control-acceso/login';
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
