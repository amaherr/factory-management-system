import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Ban, Banknote, Receipt, TrendingUp } from 'lucide-react';
import {
  analyticsService,
  type AnalyticsGranularity,
  type SalesDashboardData,
} from '../../services/analytics';
import {
  AnalyticsErrorState,
  AnalyticsLoadingState,
  AnalyticsSectionCard,
  DashboardFilters,
  DashboardHero,
  KpiCard,
  buildRangeFromPreset,
  formatCurrency,
  formatNumber,
  formatPercent,
  humanizeLabel,
  type QuickRangePreset,
} from '../../components/analytics/AnalyticsPrimitives';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';

const PIE_COLORS = ['#2563eb', '#14b8a6', '#f59e0b', '#8b5cf6'];

export function SalesDashboard() {
  const { t } = useTranslation('analytics');
  const initialRange = buildRangeFromPreset('30d');
  const [from, setFrom] = useState(initialRange.from);
  const [to, setTo] = useState(initialRange.to);
  const [granularity, setGranularity] = useState<AnalyticsGranularity>('day');
  const [activePreset, setActivePreset] = useState<QuickRangePreset>('30d');
  const [data, setData] = useState<SalesDashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError('');

      try {
        const result = await analyticsService.getSalesDashboard({
          from: from || undefined,
          to: to || undefined,
          granularity,
        });
        setData(result);
        setLastUpdated(new Date().toLocaleString());
      } catch (err: any) {
        setError(err.message || t('common.loadFailed'));
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [from, to, granularity, refreshKey, t]);

  const applyPreset = (preset: QuickRangePreset) => {
    setActivePreset(preset);
    const range = buildRangeFromPreset(preset);
    setFrom(range.from);
    setTo(range.to);
  };

  const handleDateChange = (setter: (value: string) => void, value: string) => {
    setActivePreset('all');
    setter(value);
  };

  const orderTypeData = (data?.orderTypeSplit ?? []).map((item) => ({
    name: humanizeLabel(item._id),
    count: item.count,
    revenue: item.revenue,
  }));

  return (
    <div className="space-y-6 p-6">
      <DashboardHero
        title={t('sales.title')}
        description={t('sales.description')}
        accent="#2563eb"
        badge={t('common.revenueIntelligence')}
      />

      <DashboardFilters
        from={from}
        to={to}
        onFromChange={(value) => handleDateChange(setFrom, value)}
        onToChange={(value) => handleDateChange(setTo, value)}
        quickRanges={[
          { value: '7d', label: t('filters.last7Days') },
          { value: '30d', label: t('filters.last30Days') },
          { value: '90d', label: t('filters.last90Days') },
          { value: 'all', label: t('filters.allTime') },
        ]}
        activePreset={activePreset}
        onPresetChange={applyPreset}
        granularity={granularity}
        onGranularityChange={(value) => setGranularity(value as AnalyticsGranularity)}
        granularityOptions={[
          { value: 'day', label: t('filters.day') },
          { value: 'week', label: t('filters.week') },
          { value: 'month', label: t('filters.month') },
        ]}
        onRefresh={() => setRefreshKey((value) => value + 1)}
        lastUpdated={lastUpdated}
        loading={loading}
        labels={{
          range: t('filters.range'),
          from: t('filters.from'),
          to: t('filters.to'),
          granularity: t('filters.granularity'),
          refresh: t('filters.refresh'),
          lastUpdated: t('filters.lastUpdated'),
        }}
      />

      {loading && !data ? <AnalyticsLoadingState /> : null}
      {!loading && error && !data ? (
        <AnalyticsErrorState
          title={t('common.loadFailed')}
          description={error}
          onRetry={() => setRefreshKey((value) => value + 1)}
        />
      ) : null}

      {data ? (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              title={t('sales.kpis.totalRevenue')}
              value={formatCurrency(data.summary.totalRevenue)}
              subtitle={t('sales.kpis.totalRevenueHint')}
              icon={Banknote}
              accent="#2563eb"
            />
            <KpiCard
              title={t('sales.kpis.orders')}
              value={formatNumber(data.summary.totalOrders)}
              subtitle={t('sales.kpis.ordersHint')}
              icon={Receipt}
              accent="#14b8a6"
            />
            <KpiCard
              title={t('sales.kpis.aov')}
              value={formatCurrency(data.summary.aov)}
              subtitle={t('sales.kpis.aovHint')}
              icon={TrendingUp}
              accent="#8b5cf6"
            />
            <KpiCard
              title={t('sales.kpis.cancellationRate')}
              value={formatPercent(data.summary.cancellationRate)}
              subtitle={t('sales.kpis.cancellationRateHint')}
              icon={Ban}
              accent="#f59e0b"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <AnalyticsSectionCard
              title={t('sales.revenueTrendTitle')}
              description={t('sales.revenueTrendDescription')}
            >
              <ResponsiveContainer
                width="100%"
                height={320}
              >
                <LineChart data={data.revenueTrend}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border-light)"
                  />
                  <XAxis
                    dataKey="_id"
                    stroke="var(--text-muted)"
                  />
                  <YAxis stroke="var(--text-muted)" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#2563eb"
                    strokeWidth={3}
                  />
                  <Line
                    type="monotone"
                    dataKey="orders"
                    stroke="#14b8a6"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </AnalyticsSectionCard>

            <AnalyticsSectionCard
              title={t('sales.orderTypeTitle')}
              description={t('sales.orderTypeDescription')}
            >
              <ResponsiveContainer
                width="100%"
                height={320}
              >
                <PieChart>
                  <Pie
                    data={orderTypeData}
                    dataKey="revenue"
                    nameKey="name"
                    innerRadius={65}
                    outerRadius={110}
                    paddingAngle={3}
                  >
                    {orderTypeData.map((item, index) => (
                      <Cell
                        key={item.name}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </AnalyticsSectionCard>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <AnalyticsSectionCard
              title={t('sales.topProductsTitle')}
              description={t('sales.topProductsDescription')}
            >
              <ResponsiveContainer
                width="100%"
                height={320}
              >
                <BarChart data={data.topProducts}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border-light)"
                  />
                  <XAxis
                    dataKey="productCode"
                    stroke="var(--text-muted)"
                  />
                  <YAxis stroke="var(--text-muted)" />
                  <Tooltip />
                  <Bar
                    dataKey="revenue"
                    fill="#f59e0b"
                    radius={[10, 10, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </AnalyticsSectionCard>

            <AnalyticsSectionCard
              title={t('sales.discountTrendTitle')}
              description={t('sales.discountTrendDescription')}
            >
              <ResponsiveContainer
                width="100%"
                height={320}
              >
                <LineChart data={data.discountTrend}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border-light)"
                  />
                  <XAxis
                    dataKey="_id"
                    stroke="var(--text-muted)"
                  />
                  <YAxis stroke="var(--text-muted)" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="discountRate"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </AnalyticsSectionCard>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <AnalyticsSectionCard
              title={t('sales.topCustomersTitle')}
              description={t('sales.topCustomersDescription')}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('tables.customer')}</TableHead>
                    <TableHead>{t('tables.orders')}</TableHead>
                    <TableHead className="text-right">{t('tables.revenue')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.topCustomers.map((customer) => (
                    <TableRow key={`${customer.customerName}-${customer.revenue}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {customer.customerName || t('tables.unknown')}
                          </p>
                          <p className="text-xs text-slate-500">
                            {customer.customerCompany || ' '}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{formatNumber(customer.orderCount)}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(customer.revenue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AnalyticsSectionCard>

            <AnalyticsSectionCard
              title={t('sales.returnsTitle')}
              description={t('sales.returnsDescription')}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('tables.product')}</TableHead>
                    <TableHead>{t('tables.unitsReturned')}</TableHead>
                    <TableHead className="text-right">{t('tables.value')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.returnsByProduct.map((product) => (
                    <TableRow key={`${product.productCode}-${product.unitsReturned}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {product.productCode || t('tables.unknown')}
                          </p>
                          <p className="text-xs text-slate-500">{product.productName || ' '}</p>
                        </div>
                      </TableCell>
                      <TableCell>{formatNumber(product.unitsReturned)}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(product.returnValue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AnalyticsSectionCard>
          </div>
        </>
      ) : null}
    </div>
  );
}
