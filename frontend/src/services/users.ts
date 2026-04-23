import axios from 'axios';
import type { UserRole } from './enums/user.enums';
import { getApiBaseUrl } from './apiBase';

const API_URL = getApiBaseUrl();

export interface User {
  _id?: string;
  name: string;
  phoneNumber: string;
  roles: UserRole[];
  isActive: boolean;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GetUsersResponse {
  message: string;
  data: User[];
}

export interface UserResponse {
  message: string;
  data: User;
}

export const userService = {
  async getAllUsers(): Promise<User[]> {
    try {
      axios.defaults.withCredentials = true;

      const response = await axios.get<GetUsersResponse>(`${API_URL}/users`);

      return response.data.data;
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to fetch users';
      throw new Error(message);
    }
  },

  async getUser(userId: string): Promise<User> {
    try {
      axios.defaults.withCredentials = true;

      const response = await axios.get<UserResponse>(`${API_URL}/users/${userId}`);

      return response.data.data;
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to fetch user';
      throw new Error(message);
    }
  },

  async createUser(user: {
    name: string;
    phoneNumber: string;
    password: string;
    roles: UserRole[];
  }): Promise<User> {
    try {
      axios.defaults.withCredentials = true;

      const response = await axios.post<UserResponse>(`${API_URL}/users`, user);

      return response.data.data;
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to create user';
      throw new Error(message);
    }
  },

  async editUser(
    userId: string,
    updates: { name?: string; phoneNumber?: string; password?: string },
  ): Promise<User> {
    try {
      axios.defaults.withCredentials = true;

      const response = await axios.patch<UserResponse>(`${API_URL}/users/edit/${userId}`, updates);

      return response.data.data;
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to edit user';
      throw new Error(message);
    }
  },

  async changeUserRoles(userId: string, newRoles: UserRole[]): Promise<User> {
    try {
      axios.defaults.withCredentials = true;

      const response = await axios.patch<UserResponse>(`${API_URL}/users/change-role/${userId}`, {
        newRoles,
      });

      return response.data.data;
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to change user roles';
      throw new Error(message);
    }
  },

  async changeUserActivation(userId: string, isActive: boolean): Promise<User> {
    try {
      axios.defaults.withCredentials = true;

      const response = await axios.patch<UserResponse>(
        `${API_URL}/users/activation-status/${userId}`,
        { isActive },
      );

      return response.data.data;
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to change user activation status';
      throw new Error(message);
    }
  },

  async deleteUser(userId: string): Promise<User> {
    try {
      axios.defaults.withCredentials = true;

      const response = await axios.delete<UserResponse>(`${API_URL}/users/delete/${userId}`);

      return response.data.data;
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to delete user';
      throw new Error(message);
    }
  },
};
