import axios from 'axios';
import type { Color, ProductStatus, Season, FactoryLocation } from './enums/product.enums';

export type { Color, ProductStatus, Season, FactoryLocation };

interface Product {
  _id: string;
  code: string;
  name: string;
  description?: string;
  color: Color;
  season?: Season;
  defaultImage?: string;
  sku: number;
  unitCostPrice: number;
  unitSalePrice: number;
  lineCostPrice: number;
  lineSalePrice: number;
  status: ProductStatus;
  totalTheoreticalStock: number;
  totalPhysicalStock: number;
  totalReserved: number;
  totalSold: number;
  locations: Array<{
    location: string;
    quantityInStock: number;
  }>;
  activatedByUserId?: string;
  activatedAt?: string;
  deactivatedByUserId?: string;
  deactivatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type { Product };

interface CreateProductPayload {
  code: string;
  name: string;
  description?: string;
  color: Color;
  season?: Season;
  defaultImage?: string;
  sku: number;
  unitCostPrice: number;
  unitSalePrice: number;
}

interface UpdateProductPayload {
  code?: string;
  name?: string;
  description?: string;
  color?: Color;
  season?: Season;
  defaultImage?: string;
  removeImage?: boolean;
  sku?: number;
  unitCostPrice?: number;
  unitSalePrice?: number;
}

interface ChangeProductActivationPayload {
  status: ProductStatus;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export const productService = {
  getAllActiveProducts: async (): Promise<Product[]> => {
    try {
      const { data } = await axios.get(`${API_BASE}/products`, {
        withCredentials: true,
      });
      return data.data;
    } catch (error) {
      throw extractError(error);
    }
  },

  getAllProducts: async (): Promise<Product[]> => {
    try {
      const { data } = await axios.get(`${API_BASE}/products/all`, {
        withCredentials: true,
      });
      return data.data;
    } catch (error) {
      throw extractError(error);
    }
  },

  getProduct: async (id: string): Promise<Product> => {
    try {
      const { data } = await axios.get(`${API_BASE}/products/${id}`, {
        withCredentials: true,
      });
      return data.data;
    } catch (error) {
      throw extractError(error);
    }
  },

  createProduct: async (payload: CreateProductPayload | FormData): Promise<Product> => {
    try {
      const { data } = await axios.post(`${API_BASE}/products`, payload, {
        withCredentials: true,
      });
      return data.data;
    } catch (error) {
      throw extractError(error);
    }
  },

  updateProduct: async (id: string, payload: UpdateProductPayload | FormData): Promise<Product> => {
    try {
      const { data } = await axios.put(`${API_BASE}/products/${id}`, payload, {
        withCredentials: true,
      });
      return data.data;
    } catch (error) {
      throw extractError(error);
    }
  },

  deleteProduct: async (id: string): Promise<Product> => {
    try {
      const { data } = await axios.delete(`${API_BASE}/products/${id}`, {
        withCredentials: true,
      });
      return data.data;
    } catch (error) {
      throw extractError(error);
    }
  },

  changeProductActivation: async (
    id: string,
    payload: ChangeProductActivationPayload,
  ): Promise<Product> => {
    try {
      const { data } = await axios.patch(`${API_BASE}/products/${id}/change-activation`, payload, {
        withCredentials: true,
      });
      return data.data;
    } catch (error) {
      throw extractError(error);
    }
  },

  // Stock Management
  getProductsWithStock: async (): Promise<Product[]> => {
    try {
      const { data } = await axios.get(`${API_BASE}/products/in-stock`, {
        withCredentials: true,
      });
      return data.data;
    } catch (error) {
      throw extractError(error);
    }
  },

  getProductsByLocation: async (location: FactoryLocation): Promise<Product[]> => {
    try {
      const { data } = await axios.get(`${API_BASE}/products/location/${location}`, {
        withCredentials: true,
      });
      return data.data;
    } catch (error) {
      throw extractError(error);
    }
  },

  transferStock: async (
    productId: string,
    payload: {
      fromLocation: FactoryLocation;
      toLocation: FactoryLocation;
      quantity: number;
    },
  ): Promise<Product> => {
    try {
      const { data } = await axios.patch(`${API_BASE}/products/${productId}/transfer`, payload, {
        withCredentials: true,
      });
      return data.data;
    } catch (error) {
      throw extractError(error);
    }
  },

  adjustStock: async (
    productId: string,
    payload: {
      location: FactoryLocation;
      adjustmentType: 'add' | 'subtract';
      quantity: number;
    },
  ): Promise<Product> => {
    try {
      const { data } = await axios.patch(
        `${API_BASE}/products/${productId}/manual-physical-adjustment`,
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

  setStock: async (
    productId: string,
    payload: {
      location: FactoryLocation;
      newQuantity: number;
    },
  ): Promise<{
    productId: string;
    location: string;
    previousQuantity: number;
    newQuantity: number;
    delta: number;
    totalPhysicalStock: number;
    locations: Array<{ location: string; quantityInStock: number }>;
  }> => {
    try {
      const { data } = await axios.patch(
        `${API_BASE}/products/${productId}/set-physical-stock`,
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
