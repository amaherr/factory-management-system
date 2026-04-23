import axios from 'axios';
import { getApiBaseUrl } from './apiBase';

const API_URL = getApiBaseUrl();

export const CURRENCY = 'EGP ';

export const ORDER_TYPES = {
  ON_SHELF: 'on shelf',
  ON_DEMAND: 'on demand',
} as const;

export const ORDER_STATUS = {
  DRAFT: 'draft',
  FINALIZED: 'finalized',
  CANCELLED: 'cancelled',
} as const;

export type OrderType = (typeof ORDER_TYPES)[keyof typeof ORDER_TYPES];
export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export interface CreateOrderItemPayload {
  productId: string;
  quantity: number;
  itemType: OrderType;
}

export interface CreateOrderPayload {
  customerId: string;
  items: CreateOrderItemPayload[];
  discountAmount: number;
  taxAmount: number;
  notes?: string;
}

export interface ChangeOrderStatusPayload {
  status: 'finalized' | 'cancelled';
}

export interface OrderItem {
  productId: string | { _id: string; name: string; productCode: string };
  lineQuantity: number;
  actualQuantity: number;
  unitPrice: number;
  totalPrice: number;
  itemType?: OrderType;
  _id: string;
}

export interface Order {
  _id: string;
  orderNumber: number;
  customerId:
    | string
    | {
        _id: string;
        name: string;
        company: string;
        phoneNumber: string;
        address: string;
        createdAt: string;
        updatedAt: string;
      };
  createdByUserId: string | { _id: string; name: string; email: string };
  items: OrderItem[];
  subTotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  status: OrderStatus;
  notes?: string;
  finalizedAt?: string | null;
  cancelledAt?: string | null;
  cancelledByUserId?: string | null;
  finalizedByUserId?: string;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

interface CreateOrderResponse {
  success: boolean;
  message: string;
  data: {
    createdOrder: Order;
  };
}

interface ChangeOrderStatusResponse {
  success: boolean;
  message: string;
  data: {
    updatedOrder: Order;
  };
}

export interface GetOrdersResponse {
  success: boolean;
  message: string;
  data: {
    total?: number;
    page?: number;
    limit?: number;
    pages?: number;
    count: number;
    orders: Order[];
  };
}

export interface PaginatedOrdersData {
  total: number;
  page: number;
  limit: number;
  pages: number;
  orders: Order[];
}

export interface GetOrderResponse {
  success: boolean;
  message: string;
  data: Order;
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

export const orderService = {
  async getOrders(filters?: {
    status?: string;
    query?: string;
    customerId?: string;
    limit?: number;
  }): Promise<Order[]> {
    const safeLimit = Math.min(filters?.limit ?? 100, 100);

    const data = await orderService.getOrdersPaginated({
      status: filters?.status,
      query: filters?.query,
      customerId: filters?.customerId,
      page: 1,
      limit: safeLimit,
    });

    return data.orders;
  },

  async getOrdersPaginated(filters?: {
    status?: string;
    query?: string;
    customerId?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedOrdersData> {
    try {
      axios.defaults.withCredentials = true;
      const params: Record<string, string | number> = {};

      if (filters?.status && filters.status !== 'all') {
        params.status = filters.status;
      }
      if (filters?.customerId) {
        params.customerId = filters.customerId;
      }
      if (filters?.query) {
        const num = Number(filters.query);
        if (!Number.isNaN(num)) {
          params.q = String(num);
        }
      }

      if (filters?.page) {
        params.page = filters.page;
      }

      if (filters?.limit) {
        params.limit = filters.limit;
      }

      const response = await axios.get<GetOrdersResponse>(`${API_URL}/orders`, { params });
      const payload = response.data.data;
      return {
        total: Number(payload?.total || 0),
        page: Number(payload?.page || filters?.page || 1),
        limit: Number(payload?.limit || filters?.limit || 20),
        pages: Number(payload?.pages || 0),
        orders: Array.isArray(payload?.orders) ? payload.orders : [],
      };
    } catch (error: any) {
      console.error('Failed to fetch orders:', error?.response?.data?.message || error.message);
      throw new Error(error?.response?.data?.message || 'Failed to fetch orders');
    }
  },

  async getOrder(orderId: string): Promise<Order> {
    try {
      axios.defaults.withCredentials = true;
      const response = await axios.get<GetOrderResponse>(`${API_URL}/orders/${orderId}`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || 'Failed to fetch order');
    }
  },

  async createOrder(payload: CreateOrderPayload): Promise<Order> {
    try {
      axios.defaults.withCredentials = true;
      const response = await axios.post<CreateOrderResponse>(`${API_URL}/orders`, payload);
      return response.data.data.createdOrder;
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || 'Failed to create order');
    }
  },

  async deleteOrder(orderId: string): Promise<void> {
    try {
      axios.defaults.withCredentials = true;
      await axios.delete(`${API_URL}/orders/${orderId}`);
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || 'Failed to delete order');
    }
  },

  async changeOrderStatus(orderId: string, payload: ChangeOrderStatusPayload): Promise<Order> {
    try {
      axios.defaults.withCredentials = true;
      const response = await axios.patch<ChangeOrderStatusResponse>(
        `${API_URL}/orders/change-status/${orderId}`,
        payload,
      );
      return response.data.data.updatedOrder;
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || 'Failed to update order status');
    }
  },

  async downloadInvoice(orderId: string): Promise<{ blob: Blob; fileName: string }> {
    try {
      axios.defaults.withCredentials = true;
      const response = await axios.get(`${API_URL}/orders/${orderId}/invoice`, {
        responseType: 'blob',
      });

      const fileName =
        extractFileNameFromDisposition(response.headers['content-disposition']) ||
        `order-invoice-${orderId}.pdf`;

      return {
        blob: response.data,
        fileName,
      };
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || 'Failed to download order invoice');
    }
  },
};
