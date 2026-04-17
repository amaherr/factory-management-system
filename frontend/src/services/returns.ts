import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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
    unitPrice: number;
  }>;
}

export interface UpdateReturnPayload {
  note?: string;
  returnDate?: string;
  items?: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const returnService = {
  async getReturns(): Promise<ReturnRecord[]> {
    try {
      axios.defaults.withCredentials = true;
      const response = await axios.get<ApiResponse<ReturnRecord[]>>(`${API_URL}/returns`);
      return Array.isArray(response.data.data) ? response.data.data : [];
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
};
