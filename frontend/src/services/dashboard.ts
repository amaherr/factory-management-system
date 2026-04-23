import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export type AnalyticsGranularity = 'day' | 'week' | 'month';
export type ProductionGranularity = 'day' | 'week' | 'month';

export interface AnalyticsQuery {
  from?: string;
  to?: string;
}

export interface SalesAnalyticsQuery extends AnalyticsQuery {
  granularity?: AnalyticsGranularity;
}

export interface ProductionAnalyticsQuery extends AnalyticsQuery {
  granularity?: ProductionGranularity;
}

export interface AnalyticsResponse<T> {
  message: string;
  data: T;
}

export interface ExecutiveDashboardData {
  revenue: {
    totalRevenue: number;
    netRevenue: number;
    aov: number;
    totalDiscount: number;
    discountRate: number;
    orderCount: number;
  };
  returns: {
    totalReturnValue: number;
    returnCount: number;
    returnRate: number;
  };
  orders: {
    byStatus: Record<string, number>;
    total: number;
  };
  stock: {
    totalPhysical: number;
    totalTheoretical: number;
    variance: number;
    outOfStockCount: number;
  };
  production: {
    avgPlanAttainment: number;
  };
  issues: {
    openAndInProgress: number;
  };
  products: {
    byStatus: Record<string, number>;
  };
}

export interface SalesDashboardData {
  summary: {
    totalRevenue: number;
    totalOrders: number;
    aov: number;
    cancellationRate: number;
  };
  revenueTrend: Array<{
    _id: string;
    revenue: number;
    orders: number;
    avgOrderValue: number;
  }>;
  topCustomers: Array<{
    _id?: string;
    revenue: number;
    orderCount: number;
    customerName?: string;
    customerCompany?: string;
  }>;
  orderFunnel: Record<string, number>;
  orderTypeSplit: Array<{
    _id: string;
    count: number;
    revenue: number;
  }>;
  topProducts: Array<{
    _id?: string;
    unitsSold: number;
    revenue: number;
    productCode?: string;
    productName?: string;
    productColor?: string;
  }>;
  discountTrend: Array<{
    _id: string;
    totalDiscount: number;
    discountRate: number;
  }>;
  returnsByProduct: Array<{
    _id?: string;
    unitsReturned: number;
    returnValue: number;
    productCode?: string;
    productName?: string;
  }>;
}

export interface ProductionDashboardData {
  summary: {
    batchesByStatus: Record<string, number>;
    planAttainment: {
      avg: number;
      min: number;
      max: number;
    };
    totalPlanned: number;
    totalProduced: number;
    totalLoss: number;
    avgBatchDurationHours: number;
    minBatchDurationHours: number;
    maxBatchDurationHours: number;
  };
  productionTrend: Array<{
    _id: string;
    unitsProduced: number;
    batchCount: number;
  }>;
  lossByStage: Array<{
    _id: string;
    totalLoss: number;
    eventCount: number;
    avgLoss: number;
  }>;
  avgStageDuration: Array<{
    _id: string;
    avgDurationHours: number;
  }>;
  topLossBatches: Array<{
    _id?: string;
    totalLoss: number;
    stageCount: number;
    batchNumber?: string | number;
    plannedQuantity?: number;
    producedQuantity?: number;
    batchStatus?: string;
  }>;
}

export interface InventoryDashboardData {
  summary: {
    totalPhysical: number;
    totalTheoretical: number;
    variance: number;
    totalReserved: number;
    totalSold: number;
    outOfStockCount: number;
    lowStockCount: number;
    lowStockThreshold: number;
  };
  stockByLocation: Array<{
    _id: string;
    totalStock: number;
    productCount: number;
  }>;
  movementBreakdown: Array<{
    from: string;
    to: string;
    count: number;
    netQuantity: number;
    absoluteQuantity: number;
  }>;
  mostMovedProducts: Array<{
    _id?: string;
    movementCount: number;
    absoluteQuantity: number;
    productCode?: string;
    productName?: string;
    currentStock?: number;
  }>;
  productsByColor: Array<{
    _id: string;
    totalSold: number;
    totalStock: number;
    productCount: number;
  }>;
  productsBySeason: Array<{
    _id: string;
    totalSold: number;
    totalStock: number;
    productCount: number;
  }>;
  stockVarianceProducts: Array<{
    _id?: string;
    code?: string;
    name?: string;
    totalPhysicalStock: number;
    totalTheoreticalStock: number;
    variance: number;
  }>;
}

export interface OperationsDashboardData {
  summary: {
    totalIssues: number;
    issuesByStatus: Record<string, number>;
    openAndInProgress: number;
    resolutionRate: number;
  };
  issuesByType: Array<{
    _id: string;
    count: number;
  }>;
  avgResolutionTime: Array<{
    _id: string;
    avgResolutionHours: number;
    resolvedCount: number;
  }>;
  manualAdjustmentTrend: Array<{
    _id: string;
    count: number;
    totalQuantityAdjusted: number;
  }>;
  topIssueReporters: Array<{
    _id?: string;
    reported: number;
    userName?: string;
    userRoles?: string[];
  }>;
  topIssueResolvers: Array<{
    _id?: string;
    resolved: number;
    userName?: string;
    userRoles?: string[];
  }>;
  issueAgeTrend: Array<{
    _id: string;
    created: number;
    resolved: number;
  }>;
}

const buildParams = (query: AnalyticsQuery & { granularity?: string }) => {
  const params: Record<string, string> = {};

  if (query.from) params.from = query.from;
  if (query.to) params.to = query.to;
  if (query.granularity) params.granularity = query.granularity;

  return params;
};

const get = async <T>(path: string, query: AnalyticsQuery & { granularity?: string } = {}) => {
  try {
    axios.defaults.withCredentials = true;

    const response = await axios.get<AnalyticsResponse<T>>(`${API_URL}/analytics${path}`, {
      params: buildParams(query),
    });

    return response.data.data;
  } catch (error: any) {
    const message = error?.response?.data?.message || 'Failed to fetch analytics';
    throw new Error(message);
  }
};

export const analyticsService = {
  getExecutiveDashboard(query: AnalyticsQuery = {}) {
    return get<ExecutiveDashboardData>('/executive', query);
  },

  getSalesDashboard(query: SalesAnalyticsQuery = {}) {
    return get<SalesDashboardData>('/sales', query);
  },

  getProductionDashboard(query: ProductionAnalyticsQuery = {}) {
    return get<ProductionDashboardData>('/production', query);
  },

  getInventoryDashboard(query: AnalyticsQuery = {}) {
    return get<InventoryDashboardData>('/inventory', query);
  },

  getOperationsDashboard(query: AnalyticsQuery = {}) {
    return get<OperationsDashboardData>('/operations', query);
  },
};
