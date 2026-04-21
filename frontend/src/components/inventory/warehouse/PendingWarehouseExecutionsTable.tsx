import { ArrowRight, Eye, Play, RefreshCw, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type {
  StockMovement,
  StockMovementExecutionStatus,
  WarehouseAction,
} from '../../../services/stockMovements';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../ui/card';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';

interface PendingWarehouseExecutionsTableProps {
  movements: StockMovement[];
  loading: boolean;
  total: number;
  page: number;
  totalPages: number;
  searchQuery: string;
  actionFilter: WarehouseAction | 'all';
  onSearchChange: (query: string) => void;
  onActionFilterChange: (value: WarehouseAction | 'all') => void;
  onRefresh: () => void;
  onPageChange: (page: number) => void;
  onView: (movement: StockMovement) => void;
  onExecute: (movement: StockMovement) => void;
}

function getWarehouseActionColor(action?: WarehouseAction | null) {
  const colorMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pick: 'destructive',
    receive: 'default',
    transfer: 'secondary',
  };

  if (!action) return 'outline';
  return colorMap[action] || 'outline';
}

function getQuantityColor(quantity: number) {
  return quantity > 0 ? 'default' : 'destructive';
}

function getExecutionStatus(movement: StockMovement): StockMovementExecutionStatus {
  return movement.executionStatus || 'not_executed';
}

function getExecutionStatusBadgeVariant(status: StockMovementExecutionStatus) {
  if (status === 'executed') return 'default';
  if (status === 'partially_executed') return 'secondary';
  return 'outline';
}

function getReference(movement: StockMovement) {
  if (movement.orderId?.orderNumber) {
    return `ORD-${movement.orderId.orderNumber}`;
  }

  if (movement.returnId?.returnNumber) {
    return `RET-${movement.returnId.returnNumber}`;
  }

  if (movement.batchId?.batchNumber) {
    return `BATCH-${movement.batchId.batchNumber}`;
  }

  return null;
}

export function PendingWarehouseExecutionsTable({
  movements,
  loading,
  total,
  page,
  totalPages,
  searchQuery,
  actionFilter,
  onSearchChange,
  onActionFilterChange,
  onRefresh,
  onPageChange,
  onView,
  onExecute,
}: PendingWarehouseExecutionsTableProps) {
  const { t } = useTranslation('warehouse');
  const { t: tStock } = useTranslation('stock');

  const from = total === 0 ? 0 : (page - 1) * 10 + 1;
  const to = Math.min(page * 10, total);

  return (
    <Card className="min-h-[480px]">
      <CardHeader>
        <div>
          <CardTitle>{t('pending.title')}</CardTitle>
          <CardDescription>{t('pending.description')}</CardDescription>
        </div>
        <CardAction>
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={onRefresh}
          >
            <RefreshCw className="size-4" />
            {t('filters.refresh')}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              className="h-9 rounded-md border-[--border-default] bg-[--bg-secondary] pl-9 pr-9 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-[--primary-500]/30"
              placeholder={t('filters.searchPlaceholder')}
            />
            {searchQuery && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 size-7 -translate-y-1/2 p-0 text-muted-foreground hover:bg-black/5"
                onClick={() => onSearchChange('')}
                title={t('filters.clearSearch')}
                aria-label={t('filters.clearSearch')}
              >
                <X className="size-4" />
              </Button>
            )}
          </div>

          <Select
            value={actionFilter}
            onValueChange={(value) => onActionFilterChange(value as WarehouseAction | 'all')}
          >
            <SelectTrigger className="h-9 rounded-md">
              <SelectValue placeholder={t('filters.allActions')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.allActions')}</SelectItem>
              <SelectItem value="pick">{tStock('movements.warehouseActions.pick')}</SelectItem>
              <SelectItem value="receive">
                {tStock('movements.warehouseActions.receive')}
              </SelectItem>
              <SelectItem value="transfer">
                {tStock('movements.warehouseActions.transfer')}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-lg bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          {t('pending.showing', { from, to, total })}
        </div>

        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('table.product')}</TableHead>
                <TableHead>{t('table.action')}</TableHead>
                <TableHead>{t('table.flow')}</TableHead>
                <TableHead>{t('table.quantity')}</TableHead>
                <TableHead>{t('table.executionStatus')}</TableHead>
                <TableHead>{t('table.executionProgress')}</TableHead>
                <TableHead>{t('table.reference')}</TableHead>
                <TableHead>{t('table.requestedBy')}</TableHead>
                <TableHead>{t('table.createdAt')}</TableHead>
                <TableHead className="text-right">{t('table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="py-12 text-center text-muted-foreground"
                  >
                    {t('pending.loading')}
                  </TableCell>
                </TableRow>
              ) : movements.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="py-12 text-center text-muted-foreground"
                  >
                    {t('pending.empty')}
                  </TableCell>
                </TableRow>
              ) : (
                movements.map((movement) => {
                  const canExecute =
                    movement.warehouseAction === 'pick' || movement.warehouseAction === 'receive';
                  const status = getExecutionStatus(movement);
                  const totalQuantity = Math.abs(Number(movement.quantityChange || 0));
                  const executedQuantity = Math.max(
                    0,
                    Number(movement.physicalQuantityExecuted || 0),
                  );

                  return (
                    <TableRow key={movement._id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{movement.productId?.name || '-'}</p>
                          <p className="font-mono text-xs text-muted-foreground">
                            {movement.productId?.code || '-'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getWarehouseActionColor(movement.warehouseAction)}>
                          {movement.warehouseAction
                            ? tStock(`movements.warehouseActions.${movement.warehouseAction}`)
                            : tStock('movements.warehouseActions.none')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-mono font-bold text-xs uppercase tracking-wide text-foreground">
                            {tStock(`movements.buckets.${movement.from}`)}
                          </span>
                          <ArrowRight
                            className="size-3.5 text-muted-foreground"
                            aria-hidden="true"
                          />
                          <span className="font-mono font-bold text-xs uppercase tracking-wide text-foreground">
                            {tStock(`movements.buckets.${movement.to}`)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getQuantityColor(movement.quantityChange)}>
                          {movement.quantityChange > 0 ? '+' : ''}
                          {movement.quantityChange}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getExecutionStatusBadgeVariant(status)}>
                          {tStock(`movements.execution.${status}`)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {t('pending.executionProgress', {
                          executed: executedQuantity,
                          quantity: totalQuantity,
                        })}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {getReference(movement) || t('pending.referenceNone')}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">
                            {movement.createdByUserId?.name || tStock('movements.unknownUser')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {movement.createdByUserId?.email || '-'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {movement.createdAt ? new Date(movement.createdAt).toLocaleString() : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-black hover:bg-black/10"
                            onClick={() => onView(movement)}
                            title={t('table.actions')}
                          >
                            <Eye className="size-4" />
                          </Button>
                          <Button
                            size="sm"
                            className="bg-[#1f4f86] hover:bg-[#1b4678]"
                            disabled={!canExecute}
                            onClick={() => onExecute(movement)}
                          >
                            <Play className="size-4" />
                            {t('pending.execute')}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {t('pending.page', { current: page, total: totalPages || 1 })}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            >
              {tStock('movements.pagination.previous')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            >
              {tStock('movements.pagination.next')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
