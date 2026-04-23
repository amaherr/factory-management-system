import axios from 'axios';
import type { UserRole } from './enums/user.enums';

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  roles: UserRole[];
  status: 'active' | 'inactive';
  lastLogin?: string;
  token?: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const authService = {
  async login(phone: string, pin: string): Promise<User> {
    try {
      // Configure axios to include cookies
      axios.defaults.withCredentials = true;

      const response = await axios.post<{ message: string; data: User }>(`${API_URL}/users/login`, {
        phoneNumber: phone,
        password: pin,
      });

      if (response.data && response.data.data) {
        return response.data.data;
      }

      return response.data as unknown as User;
    } catch (error: any) {
      if (error?.code === 'ERR_NETWORK') {
        throw new Error('Network/CORS error: unable to reach authentication server');
      }
      const message = error?.response?.data?.message || 'Login failed';
      throw new Error(message);
    }
  },

  logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  },

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr && userStr !== 'undefined') {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('Failed to parse user from local storage:', error);
        localStorage.removeItem('user');
        return null;
      }
    }
    if (userStr === 'undefined') {
      localStorage.removeItem('user');
    }
    return null;
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  },
};
