import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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
}

export interface CreateOrderPayload {
  customerId: string;
  orderType: OrderType;
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
  orderType: OrderType;
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
    count: number;
    orders: Order[];
  };
}

export interface GetOrderResponse {
  success: boolean;
  message: string;
  data: Order;
}

export const orderService = {
  async getOrders(filters?: {
    status?: string;
    orderType?: string;
    query?: string;
  }): Promise<Order[]> {
    try {
      axios.defaults.withCredentials = true;
      const params: Record<string, string> = {};

      if (filters?.status && filters.status !== 'all') {
        params.status = filters.status;
      }
      if (filters?.orderType && filters.orderType !== 'all') {
        params.orderType = filters.orderType;
      }
      if (filters?.query) {
        const num = Number(filters.query);
        if (!Number.isNaN(num)) {
          params.q = String(num);
        }
      }

      const response = await axios.get<GetOrdersResponse>(`${API_URL}/orders`, { params });
      const orders = response.data.data.orders;
      // Ensure we always return an array
      return Array.isArray(orders) ? orders : [];
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
};
