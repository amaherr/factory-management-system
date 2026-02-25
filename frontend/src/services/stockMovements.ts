import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface StockMovement {
  _id?: string;
  orderId?: {
    _id: string;
    orderNumber: number;
  };
  returnId?: {
    _id: string;
    returnNumber: number;
  };
  batchId?: {
    _id: string;
    batchNumber: number;
  };
  productId?: {
    _id: string;
    code: string;
    name: string;
  } | null;
  quantityChange: number;
  movementType: string;
  notes?: string;
  userId?: {
    _id: string;
    name: string;
    email: string;
  } | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface GetStockMovementsResponse {
  message: string;
  data: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    movements: StockMovement[];
  };
}

export interface StockMovementResponse {
  message: string;
  data: StockMovement;
}

export const stockMovementService = {
  async getStockMovements(
    productCode?: string,
    movementType?: string,
    page: number = 1,
    limit: number = 20,
    from?: string,
    to?: string,
  ): Promise<{
    total: number;
    page: number;
    limit: number;
    pages: number;
    movements: StockMovement[];
  }> {
    try {
      axios.defaults.withCredentials = true;

      const params: any = { page, limit };
      if (productCode) params.q = productCode;
      if (movementType) params.movementType = movementType;
      if (from) params.from = from;
      if (to) params.to = to;

      const response = await axios.get<GetStockMovementsResponse>(`${API_URL}/stock-movements`, {
        params,
      });

      return response.data.data;
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to fetch stock movements';
      throw new Error(message);
    }
  },

  async getStockMovement(movementId: string): Promise<StockMovement> {
    try {
      axios.defaults.withCredentials = true;

      const response = await axios.get<StockMovementResponse>(
        `${API_URL}/stock-movements/${movementId}`,
      );

      return response.data.data;
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to fetch stock movement';
      throw new Error(message);
    }
  },

  async getProductStockMovements(
    productId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    total: number;
    page: number;
    limit: number;
    pages: number;
    movements: StockMovement[];
  }> {
    try {
      axios.defaults.withCredentials = true;

      const response = await axios.get<GetStockMovementsResponse>(
        `${API_URL}/stock-movements/product/${productId}`,
        { params: { page, limit } },
      );

      return response.data.data;
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to fetch product stock movements';
      throw new Error(message);
    }
  },
};
