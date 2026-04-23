import axios from 'axios';
import { getApiBaseUrl } from './apiBase';

const API_URL = getApiBaseUrl();

export interface BatchEvent {
  _id: string;
  code: string;
  batchId: string;
  stage: 'planning' | 'production';
  loss: number;
  notes?: string;
  finalizedByUserId?: {
    _id: string;
    name: string;
    email: string;
  };
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Batch {
  _id: string;
  batchNumber: number;
  productId: {
    _id: string;
    code: string;
    name: string;
  };
  orderId?: {
    _id: string;
    orderNumber: number;
  };
  status: 'planning' | 'production' | 'done';
  plannedQuantity: number;
  producedQuantity?: number;
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BatchWithEvents {
  batch: Batch;
  events: BatchEvent[];
}

export interface CreateBatchData {
  productId: string;
  orderId?: string;
  plannedQuantity: number;
  startDate?: string;
}

export interface UpdateBatchData {
  productId?: string;
  orderId?: string | null;
  plannedQuantity?: number;
  startDate?: string;
}

export interface FinalizePlanningData {
  startDate?: string;
}

export interface FinalizeProductionData {
  producedQuantity: number;
  endDate?: string;
}

export interface GetBatchesResponse {
  message: string;
  data: Batch[];
}

export interface BatchResponse {
  message: string;
  data: Batch | BatchWithEvents;
}

export const batchService = {
  async getBatches(): Promise<Batch[]> {
    try {
      axios.defaults.withCredentials = true;

      const response = await axios.get<GetBatchesResponse>(`${API_URL}/batches`);

      return response.data.data;
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to fetch batches';
      throw new Error(message);
    }
  },

  async getBatch(batchId: string): Promise<BatchWithEvents> {
    try {
      axios.defaults.withCredentials = true;

      const response = await axios.get<BatchResponse>(`${API_URL}/batches/${batchId}`);

      return response.data.data as BatchWithEvents;
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to fetch batch';
      throw new Error(message);
    }
  },

  async createBatch(data: CreateBatchData): Promise<Batch> {
    try {
      axios.defaults.withCredentials = true;

      const response = await axios.post<BatchResponse>(`${API_URL}/batches`, data);

      return response.data.data as Batch;
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to create batch';
      throw new Error(message);
    }
  },

  async updateBatch(batchId: string, data: UpdateBatchData): Promise<Batch> {
    try {
      axios.defaults.withCredentials = true;

      const response = await axios.put<BatchResponse>(`${API_URL}/batches/${batchId}`, data);

      return response.data.data as Batch;
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to update batch';
      throw new Error(message);
    }
  },

  async deleteBatch(batchId: string): Promise<void> {
    try {
      axios.defaults.withCredentials = true;

      await axios.delete(`${API_URL}/batches/${batchId}`);
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to delete batch';
      throw new Error(message);
    }
  },

  async finalizePlanning(batchId: string, data: FinalizePlanningData): Promise<Batch> {
    try {
      axios.defaults.withCredentials = true;

      const response = await axios.patch<BatchResponse>(
        `${API_URL}/batches/${batchId}/finalize-planning`,
        data,
      );

      return response.data.data as Batch;
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to finalize planning';
      throw new Error(message);
    }
  },

  async finalizeProduction(batchId: string, data: FinalizeProductionData): Promise<Batch> {
    try {
      axios.defaults.withCredentials = true;

      const response = await axios.patch<BatchResponse>(
        `${API_URL}/batches/${batchId}/finalize-production`,
        data,
      );

      return response.data.data as Batch;
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to finalize production';
      throw new Error(message);
    }
  },
};
