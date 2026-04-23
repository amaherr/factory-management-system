import axios from 'axios';
import { getApiBaseUrl } from './apiBase';

const API_URL = getApiBaseUrl();

export const RETURN_STATUS = {
  DRAFT: 'draft',
  FINALIZED: 'finalized',
  CANCELLED: 'cancelled',
} as const;

export type ReturnStatus = (typeof RETURN_STATUS)[keyof typeof RETURN_STATUS];

export interface ReturnItem {
  _id?: string;
  productId:
    | string
    | {
        _id: string;
        name?: string;
        productCode?: string;
        code?: string;
      };
  lineQuantity: number;
  actualQuantity: number;
  unitPrice: number;
  totalPrice: number;
  itemType?: 'on shelf' | 'on demand';
}

export interface ReturnRecord {
  _id: string;
  returnNumber: number;
  orderId:
    | string
    | {
        _id: string;
        orderNumber?: number;
      };
  userId:
    | string
    | {
        _id: string;
        name?: string;
        email?: string;
      };
  status: ReturnStatus;
  note?: string;
  returnDate: string;
  items: ReturnItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateReturnPayload {
  orderId: string;
  note?: string;
  returnDate?: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
}

export interface UpdateReturnPayload {
  note?: string;
  returnDate?: string;
  items?: Array<{
    productId: string;
    quantity: number;
  }>;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

function extractFileNameFromDisposition(disposition?: string): string | null {
  if (!disposition) return null;
  const match = disposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
  const encodedName = match?.[1] || match?.[2];
  if (!encodedName) return null;
  try {
    return decodeURIComponent(encodedName);
  } catch {
    return encodedName;
  }
}

export interface GetReturnsFilters {
  customerId?: string;
  status?: string;
  query?: string;
  page?: number;
  limit?: number;
}

export interface GetReturnsData {
  total: number;
  page: number;
  limit: number;
  pages: number;
  returns: ReturnRecord[];
}

export const returnService = {
  async getReturns(filters?: GetReturnsFilters): Promise<GetReturnsData> {
    try {
      axios.defaults.withCredentials = true;
      const params: Record<string, string | number> = {};
      if (filters?.customerId) {
        params.customerId = filters.customerId;
      }
      if (filters?.status && filters.status !== 'all') {
        params.status = filters.status;
      }
      if (filters?.query) {
        params.q = filters.query;
      }
      if (filters?.page) {
        params.page = filters.page;
      }
      if (filters?.limit) {
        params.limit = filters.limit;
      }

      const response = await axios.get<ApiResponse<GetReturnsData>>(`${API_URL}/returns`, {
        params,
      });

      const payload = response.data.data;
      return {
        total: Number(payload?.total || 0),
        page: Number(payload?.page || filters?.page || 1),
        limit: Number(payload?.limit || filters?.limit || 20),
        pages: Number(payload?.pages || 0),
        returns: Array.isArray(payload?.returns) ? payload.returns : [],
      };
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || 'Failed to fetch returns');
    }
  },

  async createReturn(payload: CreateReturnPayload): Promise<ReturnRecord> {
    try {
      axios.defaults.withCredentials = true;
      const response = await axios.post<ApiResponse<ReturnRecord | { newReturn: ReturnRecord }>>(
        `${API_URL}/returns`,
        payload,
      );

      const data = response.data.data;
      return (data as { newReturn?: ReturnRecord }).newReturn ?? (data as ReturnRecord);
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || 'Failed to create return');
    }
  },

  async changeReturnStatus(
    returnId: string,
    payload: { status: 'finalized' | 'cancelled' },
  ): Promise<ReturnRecord> {
    try {
      axios.defaults.withCredentials = true;
      const response = await axios.patch<
        ApiResponse<ReturnRecord | { updatedReturn: ReturnRecord }>
      >(`${API_URL}/returns/${returnId}/status`, payload);

      const data = response.data.data;
      return (data as { updatedReturn?: ReturnRecord }).updatedReturn ?? (data as ReturnRecord);
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || 'Failed to update return status');
    }
  },

  async updateReturn(returnId: string, payload: UpdateReturnPayload): Promise<ReturnRecord> {
    try {
      axios.defaults.withCredentials = true;
      const response = await axios.put<ApiResponse<ReturnRecord | { updatedReturn: ReturnRecord }>>(
        `${API_URL}/returns/${returnId}`,
        payload,
      );

      const data = response.data.data;
      return (data as { updatedReturn?: ReturnRecord }).updatedReturn ?? (data as ReturnRecord);
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || 'Failed to update return');
    }
  },

  async deleteReturn(returnId: string): Promise<void> {
    try {
      axios.defaults.withCredentials = true;
      await axios.delete(`${API_URL}/returns/${returnId}`);
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || 'Failed to delete return');
    }
  },

  async downloadInvoice(returnId: string): Promise<{ blob: Blob; fileName: string }> {
    try {
      axios.defaults.withCredentials = true;
      const response = await axios.get(`${API_URL}/returns/${returnId}/invoice`, {
        responseType: 'blob',
      });

      const fileName =
        extractFileNameFromDisposition(response.headers['content-disposition']) ||
        `return-invoice-${returnId}.pdf`;

      return {
        blob: response.data,
        fileName,
      };
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || 'Failed to download return invoice');
    }
  },
};
