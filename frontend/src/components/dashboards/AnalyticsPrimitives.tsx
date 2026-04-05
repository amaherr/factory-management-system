import { format, subDays } from 'date-fns';
import { AlertCircle, CalendarRange, RefreshCw, type LucideIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Skeleton } from '../ui/skeleton';

export type QuickRangePreset = '7d' | '30d' | '90d' | 'all';

export interface QuickRangeOption {
  value: QuickRangePreset;
  label: string;
}

export interface GranularityOption {
  value: string;
  label: string;
}

export const buildRangeFromPreset = (preset: QuickRangePreset) => {
  const today = new Date();

  if (preset === 'all') {
    return { from: '', to: format(today, 'yyyy-MM-dd') };
  }

  const days = preset === '7d' ? 6 : preset === '30d' ? 29 : 89;

  return {
    from: format(subDays(today, days), 'yyyy-MM-dd'),
    to: format(today, 'yyyy-MM-dd'),
  };
};

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(value || 0);
};

export const formatNumber = (value: number) => {
  return new Intl.NumberFormat('en-EG', { maximumFractionDigits: 0 }).format(value || 0);
};

export const formatPercent = (value: number) => `${(value || 0).toFixed(1)}%`;

export const formatHours = (value: number) => `${(value || 0).toFixed(1)}h`;

export const humanizeLabel = (value?: string | number | null) => {
  if (value === undefined || value === null || value === '') return 'Unknown';

  return String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
};

export function DashboardHero({
  title,
  description,
  accent,
  badge,
}: {
  title: string;
  description: string;
  accent: string;
  badge: string;
}) {
  return (
    <Card
      className="overflow-hidden border-0 shadow-sm"
      style={{
        background: `linear-gradient(135deg, ${accent}22 0%, rgba(255,255,255,0.96) 38%, rgba(255,255,255,1) 100%)`,
      }}
    >
      <CardHeader className="gap-3">
        <Badge
          variant="outline"
          className="w-fit border-white/70 bg-white/75 text-slate-700 backdrop-blur"
        >
          {badge}
        </Badge>
        <div className="space-y-2">
          <CardTitle className="text-3xl font-semibold tracking-tight">{title}</CardTitle>
          <CardDescription className="max-w-3xl text-sm leading-6 text-slate-600">
            {description}
          </CardDescription>
        </div>
      </CardHeader>
    </Card>
  );
}

export function DashboardFilters({
  from,
  to,
  onFromChange,
  onToChange,
  quickRanges,
  activePreset,
  onPresetChange,
  granularity,
  granularityOptions,
  onGranularityChange,
  onRefresh,
  lastUpdated,
  loading,
  labels,
}: {
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  quickRanges: QuickRangeOption[];
  activePreset: QuickRangePreset;
  onPresetChange: (value: QuickRangePreset) => void;
  granularity?: string;
  granularityOptions?: GranularityOption[];
  onGranularityChange?: (value: string) => void;
  onRefresh: () => void;
  lastUpdated?: string;
  loading: boolean;
  labels: {
    range: string;
    from: string;
    to: string;
    granularity: string;
    refresh: string;
    lastUpdated: string;
  };
}) {
  return (
    <Card className="border-[--border-light] shadow-sm">
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <CalendarRange className="size-4" />
              <span>{labels.range}</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {quickRanges.map((option) => (
                <Button
                  key={option.value}
                  size="sm"
                  variant={activePreset === option.value ? 'default' : 'outline'}
                  onClick={() => onPresetChange(option.value)}
                  disabled={loading}
                >
                  {option.label}
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                  {labels.from}
                </p>
                <Input
                  type="date"
                  value={from}
                  onChange={(event) => onFromChange(event.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                  {labels.to}
                </p>
                <Input
                  type="date"
                  value={to}
                  onChange={(event) => onToChange(event.target.value)}
                  disabled={loading}
                />
              </div>

              {granularity && granularityOptions && onGranularityChange ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                    {labels.granularity}
                  </p>
                  <Select
                    value={granularity}
                    onValueChange={onGranularityChange}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={labels.granularity} />
                    </SelectTrigger>
                    <SelectContent>
                      {granularityOptions.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 xl:items-end">
            <Button
              variant="outline"
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
              {labels.refresh}
            </Button>
            {lastUpdated ? (
              <p className="text-xs text-slate-500">
                {labels.lastUpdated}: {lastUpdated}
              </p>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  accent: string;
}) {
  return (
    <Card className="overflow-hidden border-[--border-light] shadow-sm">
      <div
        className="h-1 w-full"
        style={{ background: accent }}
      />
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-600">{title}</p>
            <p className="text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
            <p className="text-xs leading-5 text-slate-500">{subtitle}</p>
          </div>
          <div
            className="rounded-2xl p-3"
            style={{ background: `${accent}18`, color: accent }}
          >
            <Icon className="size-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AnalyticsSectionCard({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <Card className="border-[--border-light] shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            {description ? <CardDescription>{description}</CardDescription> : null}
          </div>
          {action}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function AnalyticsErrorState({
  title,
  description,
  onRetry,
}: {
  title: string;
  description: string;
  onRetry: () => void;
}) {
  return (
    <Alert
      variant="destructive"
      className="border-[--error-main] bg-[--error-bg]"
    >
      <AlertCircle className="size-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <p>{description}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
        >
          Retry
        </Button>
      </AlertDescription>
    </Alert>
  );
}

export function AnalyticsLoadingState() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="space-y-4 pt-6">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-4 w-40" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[280px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
