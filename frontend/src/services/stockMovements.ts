import axios from 'axios';
import type { FactoryLocation } from './enums/product.enums';

const API_URL =
  import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export type StockBucket =
  | 'reserve'
  | 'sales'
  | 'batch'
  | 'return'
  | 'manual_adjustment'
  | 'inventory';

export type WarehouseAction = 'pick' | 'receive' | 'transfer';

export interface MovementUser {
  _id: string;
  name: string;
  email: string;
}

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
  from: StockBucket;
  to: StockBucket;
  notes?: string;
  createdByUserId?: MovementUser | null;
  warehouseAction?: WarehouseAction | null;
  isExecuted: boolean;
  sourceLocation?: string | null;
  destinationLocation?: string | null;
  physicalExecutedAt?: string | null;
  physicalExecutedByUserId?: MovementUser | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface GetStockMovementsFilters {
  productCode?: string;
  fromType?: StockBucket;
  toType?: StockBucket;
  bucketType?: StockBucket;
  warehouseAction?: WarehouseAction;
  isExecuted?: boolean;
  createdFrom?: string;
  createdTo?: string;
  page?: number;
  limit?: number;
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

export interface ExecutePickStockMovementPayload {
  sourceLocation: FactoryLocation;
}

export interface ExecuteReceiveStockMovementPayload {
  destinationLocation: FactoryLocation;
}

export const stockMovementService = {
  async getStockMovements(filters: GetStockMovementsFilters = {}): Promise<{
    total: number;
    page: number;
    limit: number;
    pages: number;
    movements: StockMovement[];
  }> {
    try {
      axios.defaults.withCredentials = true;

      const {
        productCode,
        fromType,
        toType,
        bucketType,
        warehouseAction,
        isExecuted,
        createdFrom,
        createdTo,
        page = 1,
        limit = 20,
      } = filters;

      const params: any = { page, limit };
      if (productCode) params.q = productCode;
      if (bucketType) params.bucketType = bucketType;
      if (fromType) params.fromType = fromType;
      if (toType) params.toType = toType;
      if (warehouseAction) params.warehouseAction = warehouseAction;
      if (typeof isExecuted === 'boolean') params.isExecuted = isExecuted;
      if (createdFrom) params.createdFrom = createdFrom;
      if (createdTo) params.createdTo = createdTo;

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

  async executePickStockMovement(
    movementId: string,
    payload: ExecutePickStockMovementPayload,
  ): Promise<StockMovement> {
    try {
      axios.defaults.withCredentials = true;

      const response = await axios.patch<StockMovementResponse>(
        `${API_URL}/stock-movements/${movementId}/pick`,
        payload,
      );

      return response.data.data;
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to execute pick stock movement';
      throw new Error(message);
    }
  },

  async executeReceiveStockMovement(
    movementId: string,
    payload: ExecuteReceiveStockMovementPayload,
  ): Promise<StockMovement> {
    try {
      axios.defaults.withCredentials = true;

      const response = await axios.patch<StockMovementResponse>(
        `${API_URL}/stock-movements/${movementId}/receive`,
        payload,
      );

      return response.data.data;
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to execute receive stock movement';
      throw new Error(message);
    }
  },
};
