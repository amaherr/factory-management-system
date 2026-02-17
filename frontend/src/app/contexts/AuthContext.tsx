import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'Admin' | 'Sales' | 'Inventory' | 'Accounting' | 'Planning';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'inactive';
  lastLogin?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demo
const MOCK_USERS: Record<string, { password: string; user: User }> = {
  'admin@factory.com': {
    password: 'admin123',
    user: {
      id: '1',
      name: 'Admin User',
      email: 'admin@factory.com',
      role: 'Admin',
      status: 'active',
    },
  },
  'sales@factory.com': {
    password: 'sales123',
    user: {
      id: '2',
      name: 'Sales User',
      email: 'sales@factory.com',
      role: 'Sales',
      status: 'active',
    },
  },
  'inventory@factory.com': {
    password: 'inventory123',
    user: {
      id: '3',
      name: 'Inventory Manager',
      email: 'inventory@factory.com',
      role: 'Inventory',
      status: 'active',
    },
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for stored session
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email: string, password: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    const mockUser = MOCK_USERS[email];
    if (!mockUser || mockUser.password !== password) {
      throw new Error('Invalid credentials');
    }

    const userWithLogin = {
      ...mockUser.user,
      lastLogin: new Date().toISOString(),
    };

    setUser(userWithLogin);
    localStorage.setItem('user', JSON.stringify(userWithLogin));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
