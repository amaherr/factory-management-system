import axios from 'axios';
import type { Color, ProductStatus, Season } from './enums/product.enums';

export type { Color, ProductStatus, Season };

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
    section?: string;
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

interface ProductListParams {
  q?: string;
  color?: Color;
  season?: Season;
  status?: ProductStatus;
  inStock?: boolean;
  location?: string;
  page?: number;
  limit?: number;
}

interface ProductListResponse {
  total: number;
  page: number;
  limit: number;
  pages: number;
  products: Product[];
}

export interface LocationSectionProduct extends Product {
  selectedLocationStock?: number;
  selectedLocation?: {
    location: string;
    section: string | null;
    quantityInStock: number;
  };
}

interface LocationSectionProductListResponse {
  total: number;
  page: number;
  limit: number;
  pages: number;
  products: LocationSectionProduct[];
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

function sanitizeListParams(params: ProductListParams = {}): ProductListParams {
  const sanitized = { ...params };

  if (typeof sanitized.limit === 'number') {
    sanitized.limit = Math.max(1, Math.min(100, sanitized.limit));
  }

  if (typeof sanitized.page === 'number') {
    sanitized.page = Math.max(1, sanitized.page);
  }

  return sanitized;
}

export const productService = {
  getAllActiveProducts: async (params: ProductListParams = {}): Promise<ProductListResponse> => {
    try {
      const { data } = await axios.get(`${API_BASE}/products`, {
        withCredentials: true,
        params: sanitizeListParams(params),
      });
      return data.data;
    } catch (error) {
      throw extractError(error);
    }
  },

  getAllProducts: async (params: ProductListParams = {}): Promise<ProductListResponse> => {
    try {
      const { data } = await axios.get(`${API_BASE}/products/all`, {
        withCredentials: true,
        params: sanitizeListParams(params),
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
  getProductsWithStock: async (params: ProductListParams = {}): Promise<ProductListResponse> => {
    try {
      const { data } = await axios.get(`${API_BASE}/products/in-stock`, {
        withCredentials: true,
        params: sanitizeListParams(params),
      });
      return data.data;
    } catch (error) {
      throw extractError(error);
    }
  },

  getProductsByLocation: async (
    location: string,
    params: ProductListParams = {},
  ): Promise<ProductListResponse> => {
    try {
      const { data } = await axios.get(`${API_BASE}/products/location/${location}`, {
        withCredentials: true,
        params: sanitizeListParams(params),
      });
      return data.data;
    } catch (error) {
      throw extractError(error);
    }
  },

  getProductsByLocationSection: async (
    location: string,
    section: string,
    params: ProductListParams = {},
  ): Promise<LocationSectionProductListResponse> => {
    try {
      const { data } = await axios.get(
        `${API_BASE}/products/location/${encodeURIComponent(location)}/section/${encodeURIComponent(section)}`,
        {
          withCredentials: true,
          params: sanitizeListParams(params),
        },
      );
      return data.data;
    } catch (error) {
      throw extractError(error);
    }
  },

  adjustStock: async (
    productId: string,
    payload: {
      location: string;
      section: string;
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
      location: string;
      section: string;
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
