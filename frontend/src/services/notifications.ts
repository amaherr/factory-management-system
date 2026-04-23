import axios from 'axios';
import { getApiBaseUrl } from './apiBase';

const API_URL = getApiBaseUrl();

export interface Notification {
  _id: string;
  receiverUserId: string;
  senderUserId: string;
  status: 'unread' | 'read';
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetNotificationsResponse {
  success: boolean;
  message: string;
  data: Notification[];
}

export interface MarkAsReadResponse {
  success: boolean;
  message: string;
  data: Notification;
}

export const notificationService = {
  async getNotifications(): Promise<Notification[]> {
    try {
      axios.defaults.withCredentials = true;
      const response = await axios.get<GetNotificationsResponse>(
        `${API_URL}/notifications/my-notifications`,
      );
      return response.data.data;
    } catch (error: any) {
      console.error(
        'Failed to fetch notifications:',
        error?.response?.data?.message || error.message,
      );
      throw new Error(error?.response?.data?.message || 'Failed to fetch notifications');
    }
  },

  async markAsRead(notificationId: string): Promise<Notification> {
    try {
      axios.defaults.withCredentials = true;
      const response = await axios.patch<MarkAsReadResponse>(
        `${API_URL}/notifications/change-status/${notificationId}`,
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || 'Failed to mark notification as read');
    }
  },

  async markAllAsRead(notificationIds: string[]): Promise<void> {
    try {
      axios.defaults.withCredentials = true;
      // Mark each notification as read individually
      await Promise.all(
        notificationIds.map((id) => axios.patch(`${API_URL}/notifications/change-status/${id}`)),
      );
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || 'Failed to mark all as read');
    }
  },
};
