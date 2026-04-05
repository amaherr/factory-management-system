import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Boxes, PackageOpen, Scale, Warehouse } from 'lucide-react';
import { analyticsService, type InventoryDashboardData } from '../../services/dashboard';
import {
  AnalyticsErrorState,
  AnalyticsLoadingState,
  AnalyticsSectionCard,
  DashboardFilters,
  DashboardHero,
  KpiCard,
  buildRangeFromPreset,
  formatNumber,
  humanizeLabel,
  type QuickRangePreset,
} from '../../components/dashboards/AnalyticsPrimitives';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';

export function InventoryDashboard() {
  const { t } = useTranslation('analytics');
  const initialRange = buildRangeFromPreset('30d');
  const [from, setFrom] = useState(initialRange.from);
  const [to, setTo] = useState(initialRange.to);
  const [activePreset, setActivePreset] = useState<QuickRangePreset>('30d');
  const [data, setData] = useState<InventoryDashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError('');

      try {
        const result = await analyticsService.getInventoryDashboard({
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

  const getBucketLabel = (bucket?: string) => {
    if (!bucket) return t('common.na');
    const translated = t(`inventory.stockBuckets.${bucket}`);
    return translated === `inventory.stockBuckets.${bucket}` ? humanizeLabel(bucket) : translated;
  };

  return (
    <div className="space-y-6 p-6">
      <DashboardHero
        title={t('inventory.title')}
        description={t('inventory.description')}
        accent="#14b8a6"
        badge={t('common.stockControl')}
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
              title={t('inventory.kpis.totalPhysical')}
              value={formatNumber(data.summary.totalPhysical)}
              subtitle={`${formatNumber(data.summary.totalTheoretical)} ${t('inventory.kpis.theoreticalHint')}`}
              icon={Warehouse}
              accent="#14b8a6"
            />
            <KpiCard
              title={t('inventory.kpis.variance')}
              value={formatNumber(data.summary.variance)}
              subtitle={t('inventory.kpis.varianceHint')}
              icon={Scale}
              accent="#2563eb"
            />
            <KpiCard
              title={t('inventory.kpis.lowStock')}
              value={formatNumber(data.summary.lowStockCount)}
              subtitle={`${formatNumber(data.summary.lowStockThreshold)} ${t('inventory.kpis.thresholdHint')}`}
              icon={PackageOpen}
              accent="#f59e0b"
            />
            <KpiCard
              title={t('inventory.kpis.outOfStock')}
              value={formatNumber(data.summary.outOfStockCount)}
              subtitle={`${formatNumber(data.summary.totalReserved)} ${t('inventory.kpis.reservedHint')}`}
              icon={Boxes}
              accent="#8b5cf6"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <AnalyticsSectionCard
              title={t('inventory.stockByLocationTitle')}
              description={t('inventory.stockByLocationDescription')}
            >
              <ResponsiveContainer
                width="100%"
                height={320}
              >
                <BarChart
                  data={data.stockByLocation.map((item) => ({
                    location: humanizeLabel(item._id),
                    totalStock: item.totalStock,
                  }))}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border-light)"
                  />
                  <XAxis
                    dataKey="location"
                    stroke="var(--text-muted)"
                  />
                  <YAxis stroke="var(--text-muted)" />
                  <Tooltip />
                  <Bar
                    dataKey="totalStock"
                    fill="#14b8a6"
                    radius={[10, 10, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </AnalyticsSectionCard>

            <AnalyticsSectionCard
              title={t('inventory.movementBreakdownTitle')}
              description={t('inventory.movementBreakdownDescription')}
            >
              <ResponsiveContainer
                width="100%"
                height={320}
              >
                <LineChart
                  data={data.movementBreakdown.map((item) => ({
                    movementFlow: `${getBucketLabel(item.from)} ${t('inventory.flowTo')} ${getBucketLabel(item.to)}`,
                    count: item.count,
                    absoluteQuantity: item.absoluteQuantity,
                  }))}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border-light)"
                  />
                  <XAxis
                    dataKey="movementFlow"
                    stroke="var(--text-muted)"
                  />
                  <YAxis stroke="var(--text-muted)" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#2563eb"
                    strokeWidth={3}
                  />
                  <Line
                    type="monotone"
                    dataKey="absoluteQuantity"
                    stroke="#f59e0b"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </AnalyticsSectionCard>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <AnalyticsSectionCard
              title={t('inventory.colorPerformanceTitle')}
              description={t('inventory.colorPerformanceDescription')}
            >
              <ResponsiveContainer
                width="100%"
                height={320}
              >
                <BarChart
                  data={data.productsByColor.map((item) => ({
                    color: humanizeLabel(item._id),
                    totalSold: item.totalSold,
                    totalStock: item.totalStock,
                  }))}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border-light)"
                  />
                  <XAxis
                    dataKey="color"
                    stroke="var(--text-muted)"
                  />
                  <YAxis stroke="var(--text-muted)" />
                  <Tooltip />
                  <Bar
                    dataKey="totalSold"
                    fill="#2563eb"
                    radius={[10, 10, 0, 0]}
                  />
                  <Bar
                    dataKey="totalStock"
                    fill="#14b8a6"
                    radius={[10, 10, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </AnalyticsSectionCard>

            <AnalyticsSectionCard
              title={t('inventory.seasonPerformanceTitle')}
              description={t('inventory.seasonPerformanceDescription')}
            >
              <ResponsiveContainer
                width="100%"
                height={320}
              >
                <BarChart
                  data={data.productsBySeason.map((item) => ({
                    season: humanizeLabel(item._id),
                    totalSold: item.totalSold,
                    totalStock: item.totalStock,
                  }))}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border-light)"
                  />
                  <XAxis
                    dataKey="season"
                    stroke="var(--text-muted)"
                  />
                  <YAxis stroke="var(--text-muted)" />
                  <Tooltip />
                  <Bar
                    dataKey="totalSold"
                    fill="#8b5cf6"
                    radius={[10, 10, 0, 0]}
                  />
                  <Bar
                    dataKey="totalStock"
                    fill="#f59e0b"
                    radius={[10, 10, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </AnalyticsSectionCard>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <AnalyticsSectionCard
              title={t('inventory.mostMovedTitle')}
              description={t('inventory.mostMovedDescription')}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('tables.product')}</TableHead>
                    <TableHead>{t('tables.movements')}</TableHead>
                    <TableHead>{t('tables.stock')}</TableHead>
                    <TableHead className="text-right">{t('tables.volume')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.mostMovedProducts.map((product) => (
                    <TableRow key={`${product.productCode}-${product.movementCount}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {product.productCode || t('tables.unknown')}
                          </p>
                          <p className="text-xs text-slate-500">{product.productName || ' '}</p>
                        </div>
                      </TableCell>
                      <TableCell>{formatNumber(product.movementCount)}</TableCell>
                      <TableCell>{formatNumber(product.currentStock || 0)}</TableCell>
                      <TableCell className="text-right">
                        {formatNumber(product.absoluteQuantity)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AnalyticsSectionCard>

            <AnalyticsSectionCard
              title={t('inventory.varianceTableTitle')}
              description={t('inventory.varianceTableDescription')}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('tables.product')}</TableHead>
                    <TableHead>{t('tables.physical')}</TableHead>
                    <TableHead>{t('tables.theoretical')}</TableHead>
                    <TableHead className="text-right">{t('tables.variance')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.stockVarianceProducts.map((product) => (
                    <TableRow key={`${product.code}-${product.variance}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{product.code || t('tables.unknown')}</p>
                          <p className="text-xs text-slate-500">{product.name || ' '}</p>
                        </div>
                      </TableCell>
                      <TableCell>{formatNumber(product.totalPhysicalStock)}</TableCell>
                      <TableCell>{formatNumber(product.totalTheoreticalStock)}</TableCell>
                      <TableCell className="text-right">{formatNumber(product.variance)}</TableCell>
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
