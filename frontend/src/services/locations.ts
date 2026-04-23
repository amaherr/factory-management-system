import axios from 'axios';
import type { Product } from './products';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export interface LocationSection {
  _id: string;
  name: string;
  code?: string;
  notes?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Location {
  _id: string;
  name: string;
  code?: string;
  notes?: string;
  isActive: boolean;
  sections: LocationSection[];
  createdAt?: string;
  updatedAt?: string;
}

export interface LocationOverviewItem extends Location {
  productsCount: number;
  totalStock: number;
  canDelete?: boolean;
  deleteBlockedReason?: string | null;
  sectionsOverview?: LocationSectionOverviewItem[];
}

export interface LocationSectionOverviewItem {
  _id: string;
  name: string;
  code?: string | null;
  notes?: string | null;
  isActive: boolean;
  productsCount: number;
  totalStock: number;
  canDelete: boolean;
  deleteBlockedReason?: string | null;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const locationService = {
  async getLocations(): Promise<Location[]> {
    try {
      const { data } = await axios.get<ApiResponse<Location[]>>(`${API_BASE}/locations`, {
        withCredentials: true,
      });
      return Array.isArray(data.data) ? data.data : [];
    } catch (error) {
      throw extractError(error);
    }
  },

  async getOverview(): Promise<LocationOverviewItem[]> {
    try {
      const { data } = await axios.get<ApiResponse<LocationOverviewItem[]>>(
        `${API_BASE}/locations/overview`,
        {
          withCredentials: true,
        },
      );
      return Array.isArray(data.data) ? data.data : [];
    } catch (error) {
      throw extractError(error);
    }
  },

  async createLocation(payload: {
    name: string;
    code?: string;
    notes?: string;
    isActive?: boolean;
  }): Promise<Location> {
    try {
      const { data } = await axios.post<ApiResponse<Location>>(`${API_BASE}/locations`, payload, {
        withCredentials: true,
      });
      return data.data;
    } catch (error) {
      throw extractError(error);
    }
  },

  async updateLocation(
    locationId: string,
    payload: Partial<{ name: string; code: string; notes: string; isActive: boolean }>,
  ): Promise<Location> {
    try {
      const { data } = await axios.patch<ApiResponse<Location>>(
        `${API_BASE}/locations/${locationId}`,
        payload,
        {
          withCredentials: true,
        },
      );
      return data.data;
    } catch (error) {
      throw extractError(error);
    }
  },

  async deleteLocation(locationId: string): Promise<Location> {
    try {
      const { data } = await axios.delete<ApiResponse<Location>>(
        `${API_BASE}/locations/${locationId}`,
        {
          withCredentials: true,
        },
      );
      return data.data;
    } catch (error) {
      throw extractError(error);
    }
  },

  async addSection(
    locationId: string,
    payload: { name: string; code?: string; notes?: string; isActive?: boolean },
  ): Promise<Location> {
    try {
      const { data } = await axios.post<ApiResponse<Location>>(
        `${API_BASE}/locations/${locationId}/sections`,
        payload,
        {
          withCredentials: true,
        },
      );
      return data.data;
    } catch (error) {
      throw extractError(error);
    }
  },

  async updateSection(
    locationId: string,
    sectionId: string,
    payload: Partial<{ name: string; code: string; notes: string; isActive: boolean }>,
  ): Promise<Location> {
    try {
      const { data } = await axios.patch<ApiResponse<Location>>(
        `${API_BASE}/locations/${locationId}/sections/${sectionId}`,
        payload,
        {
          withCredentials: true,
        },
      );
      return data.data;
    } catch (error) {
      throw extractError(error);
    }
  },

  async deleteSection(locationId: string, sectionId: string): Promise<Location> {
    try {
      const { data } = await axios.delete<ApiResponse<Location>>(
        `${API_BASE}/locations/${locationId}/sections/${sectionId}`,
        {
          withCredentials: true,
        },
      );
      return data.data;
    } catch (error) {
      throw extractError(error);
    }
  },

  async transferStock(payload: {
    productId: string;
    fromLocation: string;
    fromSection: string;
    toLocation: string;
    toSection: string;
    quantity: number;
  }): Promise<Product> {
    try {
      const { data } = await axios.post<ApiResponse<Product>>(
        `${API_BASE}/locations/transfer-stock`,
        payload,
        {
          withCredentials: true,
        },
      );
      return data.data;
    } catch (error) {
      throw extractError(error);
    }
  },
};

function extractError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || 'An error occurred';
  }
  return error instanceof Error ? error.message : 'An error occurred';
}
