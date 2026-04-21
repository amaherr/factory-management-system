import axios from 'axios';

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
export type StockMovementExecutionStatus = 'not_executed' | 'partially_executed' | 'executed';

export interface MovementAllocation {
  location: string;
  section: string;
  quantity: number;
}

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
  executionStatus: StockMovementExecutionStatus;
  sourceAllocations?: MovementAllocation[];
  destinationAllocations?: MovementAllocation[];
  physicalQuantityExecuted?: number | null;
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
  executionStatus?: StockMovementExecutionStatus | StockMovementExecutionStatus[];
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
  sourceAllocations: MovementAllocation[];
}

export interface ExecuteReceiveStockMovementPayload {
  destinationAllocations: MovementAllocation[];
}

function clampPageLimit(page: number, limit: number) {
  return {
    page: Math.max(1, Number(page) || 1),
    limit: Math.max(1, Math.min(100, Number(limit) || 20)),
  };
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
        executionStatus,
        createdFrom,
        createdTo,
        page = 1,
        limit = 20,
      } = filters;

      const normalized = clampPageLimit(page, limit);

      const params: any = { page: normalized.page, limit: normalized.limit };
      if (productCode) params.q = productCode;
      if (bucketType) params.bucketType = bucketType;
      if (fromType) params.fromType = fromType;
      if (toType) params.toType = toType;
      if (warehouseAction) params.warehouseAction = warehouseAction;
      if (executionStatus) {
        params.executionStatus = Array.isArray(executionStatus)
          ? executionStatus.join(',')
          : executionStatus;
      }
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

      const normalized = clampPageLimit(page, limit);

      const response = await axios.get<GetStockMovementsResponse>(
        `${API_URL}/stock-movements/product/${productId}`,
        { params: { page: normalized.page, limit: normalized.limit } },
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
