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
import { AlertTriangle, ClipboardCheck, RefreshCcw, Users } from 'lucide-react';
import { analyticsService, type OperationsDashboardData } from '../../services/analytics';
import {
  AnalyticsErrorState,
  AnalyticsLoadingState,
  AnalyticsSectionCard,
  DashboardFilters,
  DashboardHero,
  KpiCard,
  buildRangeFromPreset,
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

const PIE_COLORS = ['#ef4444', '#f59e0b', '#14b8a6', '#2563eb'];

export function OperationsDashboard() {
  const { t } = useTranslation('analytics');
  const initialRange = buildRangeFromPreset('30d');
  const [from, setFrom] = useState(initialRange.from);
  const [to, setTo] = useState(initialRange.to);
  const [activePreset, setActivePreset] = useState<QuickRangePreset>('30d');
  const [data, setData] = useState<OperationsDashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError('');

      try {
        const result = await analyticsService.getOperationsDashboard({
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

  const statusData = Object.entries(data?.summary.issuesByStatus ?? {}).map(([name, value]) => ({
    name: humanizeLabel(name),
    value,
  }));

  return (
    <div className="space-y-6 p-6">
      <DashboardHero
        title={t('operations.title')}
        description={t('operations.description')}
        accent="#ef4444"
        badge={t('common.operationalDiscipline')}
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
              title={t('operations.kpis.totalIssues')}
              value={formatNumber(data.summary.totalIssues)}
              subtitle={t('operations.kpis.totalIssuesHint')}
              icon={AlertTriangle}
              accent="#ef4444"
            />
            <KpiCard
              title={t('operations.kpis.openIssues')}
              value={formatNumber(data.summary.openAndInProgress)}
              subtitle={t('operations.kpis.openIssuesHint')}
              icon={RefreshCcw}
              accent="#f59e0b"
            />
            <KpiCard
              title={t('operations.kpis.resolutionRate')}
              value={formatPercent(data.summary.resolutionRate)}
              subtitle={t('operations.kpis.resolutionRateHint')}
              icon={ClipboardCheck}
              accent="#14b8a6"
            />
            <KpiCard
              title={t('operations.kpis.activeContributors')}
              value={formatNumber(data.topIssueReporters.length + data.topIssueResolvers.length)}
              subtitle={t('operations.kpis.activeContributorsHint')}
              icon={Users}
              accent="#2563eb"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <AnalyticsSectionCard
              title={t('operations.issueTypeTitle')}
              description={t('operations.issueTypeDescription')}
            >
              <ResponsiveContainer
                width="100%"
                height={320}
              >
                <BarChart
                  data={data.issuesByType.map((item) => ({
                    issueType: humanizeLabel(item._id),
                    count: item.count,
                  }))}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border-light)"
                  />
                  <XAxis
                    dataKey="issueType"
                    stroke="var(--text-muted)"
                  />
                  <YAxis stroke="var(--text-muted)" />
                  <Tooltip />
                  <Bar
                    dataKey="count"
                    fill="#ef4444"
                    radius={[10, 10, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </AnalyticsSectionCard>

            <AnalyticsSectionCard
              title={t('operations.statusMixTitle')}
              description={t('operations.statusMixDescription')}
            >
              <ResponsiveContainer
                width="100%"
                height={320}
              >
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={3}
                  >
                    {statusData.map((item, index) => (
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
              title={t('operations.manualAdjustmentsTitle')}
              description={t('operations.manualAdjustmentsDescription')}
            >
              <ResponsiveContainer
                width="100%"
                height={320}
              >
                <LineChart data={data.manualAdjustmentTrend}>
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
                    dataKey="count"
                    stroke="#2563eb"
                    strokeWidth={3}
                  />
                  <Line
                    type="monotone"
                    dataKey="totalQuantityAdjusted"
                    stroke="#f59e0b"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </AnalyticsSectionCard>

            <AnalyticsSectionCard
              title={t('operations.resolutionTimeTitle')}
              description={t('operations.resolutionTimeDescription')}
            >
              <ResponsiveContainer
                width="100%"
                height={320}
              >
                <BarChart
                  data={data.avgResolutionTime.map((item) => ({
                    issueType: humanizeLabel(item._id),
                    avgResolutionHours: item.avgResolutionHours,
                  }))}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border-light)"
                  />
                  <XAxis
                    dataKey="issueType"
                    stroke="var(--text-muted)"
                  />
                  <YAxis stroke="var(--text-muted)" />
                  <Tooltip />
                  <Bar
                    dataKey="avgResolutionHours"
                    fill="#14b8a6"
                    radius={[10, 10, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </AnalyticsSectionCard>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <AnalyticsSectionCard
              title={t('operations.topReportersTitle')}
              description={t('operations.topReportersDescription')}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('tables.user')}</TableHead>
                    <TableHead>{t('tables.roles')}</TableHead>
                    <TableHead className="text-right">{t('tables.reported')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.topIssueReporters.map((user) => (
                    <TableRow key={`${user.userName}-${user.reported}`}>
                      <TableCell className="font-medium">
                        {user.userName || t('tables.unknown')}
                      </TableCell>
                      <TableCell>{(user.userRoles || []).map(humanizeLabel).join(', ')}</TableCell>
                      <TableCell className="text-right">{formatNumber(user.reported)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AnalyticsSectionCard>

            <AnalyticsSectionCard
              title={t('operations.topResolversTitle')}
              description={t('operations.topResolversDescription')}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('tables.user')}</TableHead>
                    <TableHead>{t('tables.roles')}</TableHead>
                    <TableHead className="text-right">{t('tables.resolved')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.topIssueResolvers.map((user) => (
                    <TableRow key={`${user.userName}-${user.resolved}`}>
                      <TableCell className="font-medium">
                        {user.userName || t('tables.unknown')}
                      </TableCell>
                      <TableCell>{(user.userRoles || []).map(humanizeLabel).join(', ')}</TableCell>
                      <TableCell className="text-right">{formatNumber(user.resolved)}</TableCell>
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
