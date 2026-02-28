import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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
  status: OrderStatus;
}

export interface Order {
  _id: string;
  orderNumber: number;
  customerId: string;
  createdByUserId: string;
  orderType: OrderType;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
  subTotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  status: OrderStatus;
  notes?: string;
  finalizedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
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

export const orderService = {
  async createOrder(payload: CreateOrderPayload): Promise<Order> {
    try {
      axios.defaults.withCredentials = true;
      const response = await axios.post<CreateOrderResponse>(`${API_URL}/orders`, payload);
      return response.data.data.createdOrder;
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || 'Failed to create order');
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
