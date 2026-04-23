import axios from 'axios';
import { getApiBaseUrl } from './apiBase';

const API_URL = getApiBaseUrl();

export type ExportFormat = 'csv' | 'xlsx';

export interface ExportCollectionsResponse {
  message: string;
  data: string[];
}

export interface DownloadExportResult {
  blob: Blob;
  fileName: string;
}

const parseFileNameFromContentDisposition = (contentDisposition?: string): string | null => {
  if (!contentDisposition) return null;

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1].trim());
  }

  const plainMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  if (plainMatch?.[1]) {
    return plainMatch[1].trim();
  }

  return null;
};

const formatToEndpoint = (format: ExportFormat): 'csv' | 'excel' => {
  return format === 'csv' ? 'csv' : 'excel';
};

export const exportService = {
  async getExportableCollections(): Promise<string[]> {
    try {
      axios.defaults.withCredentials = true;

      const response = await axios.get<ExportCollectionsResponse>(`${API_URL}/exports/collections`);
      return response.data.data;
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to load export collections';
      throw new Error(message);
    }
  },

  async downloadCollectionExport(
    collection: string,
    format: ExportFormat,
  ): Promise<DownloadExportResult> {
    try {
      axios.defaults.withCredentials = true;

      const endpoint = formatToEndpoint(format);
      const response = await axios.get<Blob>(`${API_URL}/exports/${collection}/${endpoint}`, {
        responseType: 'blob',
      });

      const contentDisposition = response.headers['content-disposition'] as string | undefined;
      const downloadedFileName = parseFileNameFromContentDisposition(contentDisposition);
      const fallbackFileName = `${collection}.${format}`;

      return {
        blob: response.data,
        fileName: downloadedFileName || fallbackFileName,
      };
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to download export';
      throw new Error(message);
    }
  },
};
