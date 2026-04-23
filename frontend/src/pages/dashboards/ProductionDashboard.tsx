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
import { Clock3, Factory, Gauge, ScissorsLineDashed } from 'lucide-react';
import {
  analyticsService,
  type ProductionDashboardData,
  type ProductionGranularity,
} from '../../services/dashboard';
import {
  AnalyticsErrorState,
  AnalyticsLoadingState,
  AnalyticsSectionCard,
  DashboardFilters,
  DashboardHero,
  KpiCard,
  buildRangeFromPreset,
  formatHours,
  formatNumber,
  formatPercent,
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

const PIE_COLORS = ['#8b5cf6', '#14b8a6', '#2563eb', '#f59e0b'];

export function ProductionDashboard() {
  const { t } = useTranslation('analytics');
  const initialRange = buildRangeFromPreset('90d');
  const [from, setFrom] = useState(initialRange.from);
  const [to, setTo] = useState(initialRange.to);
  const [granularity, setGranularity] = useState<ProductionGranularity>('month');
  const [activePreset, setActivePreset] = useState<QuickRangePreset>('90d');
  const [data, setData] = useState<ProductionDashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError('');

      try {
        const result = await analyticsService.getProductionDashboard({
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

  const batchesByStatus = Object.entries(data?.summary.batchesByStatus ?? {}).map(
    ([name, value]) => ({
      name: humanizeLabel(name),
      value,
    }),
  );

  return (
    <div className="space-y-6 p-6">
      <DashboardHero
        title={t('production.title')}
        description={t('production.description')}
        accent="#8b5cf6"
        badge={t('common.productionVisibility')}
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
        onGranularityChange={(value) => setGranularity(value as ProductionGranularity)}
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
              title={t('production.kpis.totalProduced')}
              value={formatNumber(data.summary.totalProduced)}
              subtitle={`${formatNumber(data.summary.totalPlanned)} ${t('production.kpis.plannedHint')}`}
              icon={Factory}
              accent="#8b5cf6"
            />
            <KpiCard
              title={t('production.kpis.planAttainment')}
              value={formatPercent(data.summary.planAttainment.avg)}
              subtitle={`${formatPercent(data.summary.planAttainment.max)} ${t('production.kpis.bestBatchHint')}`}
              icon={Gauge}
              accent="#14b8a6"
            />
            <KpiCard
              title={t('production.kpis.totalLoss')}
              value={formatNumber(data.summary.totalLoss)}
              subtitle={t('production.kpis.totalLossHint')}
              icon={ScissorsLineDashed}
              accent="#f59e0b"
            />
            <KpiCard
              title={t('production.kpis.avgBatchDuration')}
              value={formatHours(data.summary.avgBatchDurationHours)}
              subtitle={`${formatHours(data.summary.maxBatchDurationHours)} ${t('production.kpis.longestBatchHint')}`}
              icon={Clock3}
              accent="#2563eb"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <AnalyticsSectionCard
              title={t('production.trendTitle')}
              description={t('production.trendDescription')}
            >
              <ResponsiveContainer
                width="100%"
                height={320}
              >
                <LineChart data={data.productionTrend}>
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
                    dataKey="unitsProduced"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                  />
                  <Line
                    type="monotone"
                    dataKey="batchCount"
                    stroke="#14b8a6"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </AnalyticsSectionCard>

            <AnalyticsSectionCard
              title={t('production.lossByStageTitle')}
              description={t('production.lossByStageDescription')}
            >
              <ResponsiveContainer
                width="100%"
                height={320}
              >
                <BarChart
                  data={data.lossByStage.map((item) => ({
                    ...item,
                    stage: humanizeLabel(item._id),
                  }))}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border-light)"
                  />
                  <XAxis
                    dataKey="stage"
                    stroke="var(--text-muted)"
                  />
                  <YAxis stroke="var(--text-muted)" />
                  <Tooltip />
                  <Bar
                    dataKey="totalLoss"
                    fill="#f59e0b"
                    radius={[10, 10, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </AnalyticsSectionCard>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <AnalyticsSectionCard
              title={t('production.statusMixTitle')}
              description={t('production.statusMixDescription')}
            >
              <ResponsiveContainer
                width="100%"
                height={320}
              >
                <PieChart>
                  <Pie
                    data={batchesByStatus}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={3}
                  >
                    {batchesByStatus.map((item, index) => (
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

            <AnalyticsSectionCard
              title={t('production.stageDurationTitle')}
              description={t('production.stageDurationDescription')}
            >
              <ResponsiveContainer
                width="100%"
                height={320}
              >
                <BarChart
                  data={data.avgStageDuration.map((item) => ({
                    stage: humanizeLabel(item._id),
                    avgDurationHours: item.avgDurationHours,
                  }))}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border-light)"
                  />
                  <XAxis
                    dataKey="stage"
                    stroke="var(--text-muted)"
                  />
                  <YAxis stroke="var(--text-muted)" />
                  <Tooltip />
                  <Bar
                    dataKey="avgDurationHours"
                    fill="#2563eb"
                    radius={[10, 10, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </AnalyticsSectionCard>
          </div>

          <AnalyticsSectionCard
            title={t('production.topLossBatchesTitle')}
            description={t('production.topLossBatchesDescription')}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('tables.batch')}</TableHead>
                  <TableHead>{t('tables.status')}</TableHead>
                  <TableHead>{t('tables.loss')}</TableHead>
                  <TableHead>{t('tables.stages')}</TableHead>
                  <TableHead className="text-right">{t('tables.attainment')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topLossBatches.map((batch) => {
                  const attainment =
                    batch.plannedQuantity && batch.plannedQuantity > 0
                      ? (Number(batch.producedQuantity || 0) / Number(batch.plannedQuantity)) * 100
                      : 0;

                  return (
                    <TableRow key={`${batch.batchNumber}-${batch.totalLoss}`}>
                      <TableCell className="font-medium">
                        {batch.batchNumber || t('tables.unknown')}
                      </TableCell>
                      <TableCell>{humanizeLabel(batch.batchStatus)}</TableCell>
                      <TableCell>{formatNumber(batch.totalLoss)}</TableCell>
                      <TableCell>{formatNumber(batch.stageCount)}</TableCell>
                      <TableCell className="text-right">{formatPercent(attainment)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </AnalyticsSectionCard>
        </>
      ) : null}
    </div>
  );
}
