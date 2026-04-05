import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AlertTriangle, Boxes, DollarSign, Factory, PackageCheck } from 'lucide-react';
import { analyticsService, type ExecutiveDashboardData } from '../../services/dashboard';
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
} from '../../components/dashboards/AnalyticsPrimitives';
import { Badge } from '../../components/ui/badge';

const PIE_COLORS = ['#0f766e', '#f59e0b', '#2563eb', '#ef4444', '#8b5cf6', '#14b8a6'];

export function ExecutiveDashboard() {
  const { t } = useTranslation('analytics');
  const initialRange = buildRangeFromPreset('30d');
  const [from, setFrom] = useState(initialRange.from);
  const [to, setTo] = useState(initialRange.to);
  const [activePreset, setActivePreset] = useState<QuickRangePreset>('30d');
  const [data, setData] = useState<ExecutiveDashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError('');

      try {
        const result = await analyticsService.getExecutiveDashboard({
          from: from || undefined,
          to: to || undefined,
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
  }, [from, to, refreshKey, t]);

  const orderStatusData = Object.entries(data?.orders.byStatus ?? {}).map(([name, value]) => ({
    name: humanizeLabel(name),
    value,
  }));
  const productStatusData = Object.entries(data?.products.byStatus ?? {}).map(([name, value]) => ({
    name: humanizeLabel(name),
    value,
  }));

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

  return (
    <div className="space-y-6 p-6">
      <DashboardHero
        title={t('executive.title')}
        description={t('executive.description')}
        accent="#0f766e"
        badge={t('common.liveAnalytics')}
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
              title={t('executive.kpis.netRevenue')}
              value={formatCurrency(data.revenue.netRevenue)}
              subtitle={`${formatCurrency(data.revenue.totalRevenue)} ${t('executive.kpis.grossRevenueHint')}`}
              icon={DollarSign}
              accent="#0f766e"
            />
            <KpiCard
              title={t('executive.kpis.averageOrderValue')}
              value={formatCurrency(data.revenue.aov)}
              subtitle={`${formatNumber(data.revenue.orderCount)} ${t('executive.kpis.finalizedOrdersHint')}`}
              icon={PackageCheck}
              accent="#2563eb"
            />
            <KpiCard
              title={t('executive.kpis.returnRate')}
              value={formatPercent(data.returns.returnRate)}
              subtitle={`${formatCurrency(data.returns.totalReturnValue)} ${t('executive.kpis.returnValueHint')}`}
              icon={AlertTriangle}
              accent="#f59e0b"
            />
            <KpiCard
              title={t('executive.kpis.planAttainment')}
              value={formatPercent(data.production.avgPlanAttainment)}
              subtitle={`${formatNumber(data.issues.openAndInProgress)} ${t('executive.kpis.openIssuesHint')}`}
              icon={Factory}
              accent="#8b5cf6"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_0.7fr]">
            <AnalyticsSectionCard
              title={t('executive.orderStatusTitle')}
              description={t('executive.orderStatusDescription')}
            >
              <ResponsiveContainer
                width="100%"
                height={320}
              >
                <BarChart data={orderStatusData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border-light)"
                  />
                  <XAxis
                    dataKey="name"
                    stroke="var(--text-muted)"
                  />
                  <YAxis stroke="var(--text-muted)" />
                  <Tooltip />
                  <Bar
                    dataKey="value"
                    fill="#0f766e"
                    radius={[10, 10, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </AnalyticsSectionCard>

            <AnalyticsSectionCard
              title={t('executive.productMixTitle')}
              description={t('executive.productMixDescription')}
            >
              <ResponsiveContainer
                width="100%"
                height={320}
              >
                <PieChart>
                  <Pie
                    data={productStatusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={3}
                  >
                    {productStatusData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 pt-4">
                {productStatusData.map((item, index) => (
                  <Badge
                    key={item.name}
                    variant="outline"
                    className="border-transparent"
                    style={{ backgroundColor: `${PIE_COLORS[index % PIE_COLORS.length]}15` }}
                  >
                    {item.name}: {formatNumber(item.value)}
                  </Badge>
                ))}
              </div>
            </AnalyticsSectionCard>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <AnalyticsSectionCard
              title={t('executive.revenueHealthTitle')}
              description={t('executive.revenueHealthDescription')}
            >
              <div className="space-y-4">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">{t('executive.metrics.discountRate')}</p>
                  <p className="mt-2 text-2xl font-semibold">
                    {formatPercent(data.revenue.discountRate)}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">{t('executive.metrics.totalDiscount')}</p>
                  <p className="mt-2 text-2xl font-semibold">
                    {formatCurrency(data.revenue.totalDiscount)}
                  </p>
                </div>
              </div>
            </AnalyticsSectionCard>

            <AnalyticsSectionCard
              title={t('executive.stockIntegrityTitle')}
              description={t('executive.stockIntegrityDescription')}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                  <div>
                    <p className="text-sm text-slate-500">{t('executive.metrics.physicalStock')}</p>
                    <p className="mt-2 text-2xl font-semibold">
                      {formatNumber(data.stock.totalPhysical)}
                    </p>
                  </div>
                  <Boxes className="size-5 text-slate-400" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">{t('executive.metrics.stockVariance')}</p>
                    <p className="mt-2 text-xl font-semibold">
                      {formatNumber(data.stock.variance)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">{t('executive.metrics.outOfStock')}</p>
                    <p className="mt-2 text-xl font-semibold">
                      {formatNumber(data.stock.outOfStockCount)}
                    </p>
                  </div>
                </div>
              </div>
            </AnalyticsSectionCard>

            <AnalyticsSectionCard
              title={t('executive.operationsPulseTitle')}
              description={t('executive.operationsPulseDescription')}
            >
              <div className="space-y-4">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">{t('executive.metrics.totalOrders')}</p>
                  <p className="mt-2 text-2xl font-semibold">{formatNumber(data.orders.total)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">{t('executive.metrics.openIssues')}</p>
                  <p className="mt-2 text-2xl font-semibold">
                    {formatNumber(data.issues.openAndInProgress)}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">{t('executive.metrics.returnCount')}</p>
                  <p className="mt-2 text-2xl font-semibold">
                    {formatNumber(data.returns.returnCount)}
                  </p>
                </div>
              </div>
            </AnalyticsSectionCard>
          </div>
        </>
      ) : null}
    </div>
  );
}
