import { Eye, Play, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { StockMovement, StockBucket, WarehouseAction } from '../../services/stockMovements';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

interface PendingWarehouseExecutionsTableProps {
  movements: StockMovement[];
  loading: boolean;
  total: number;
  page: number;
  totalPages: number;
  onRefresh: () => void;
  onPageChange: (page: number) => void;
  onView: (movement: StockMovement) => void;
  onExecute: (movement: StockMovement) => void;
}

function getBucketColor(type: StockBucket) {
  const colorMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    reserve: 'secondary',
    sales: 'destructive',
    batch: 'default',
    return: 'secondary',
    manual_adjustment: 'outline',
    inventory: 'default',
  };

  return colorMap[type] || 'outline';
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
            onClick={onRefresh}
          >
            <RefreshCw className="size-4" />
            {t('filters.refresh')}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
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
                    colSpan={8}
                    className="py-12 text-center text-muted-foreground"
                  >
                    {t('pending.loading')}
                  </TableCell>
                </TableRow>
              ) : movements.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-12 text-center text-muted-foreground"
                  >
                    {t('pending.empty')}
                  </TableCell>
                </TableRow>
              ) : (
                movements.map((movement) => (
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
                        <Badge variant={getBucketColor(movement.from)}>
                          {tStock(`movements.buckets.${movement.from}`)}
                        </Badge>
                        <span className="text-muted-foreground">
                          {tStock('movements.table.to')}
                        </span>
                        <Badge variant={getBucketColor(movement.to)}>
                          {tStock(`movements.buckets.${movement.to}`)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{movement.quantityChange}</Badge>
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
                          variant="outline"
                          size="sm"
                          onClick={() => onView(movement)}
                        >
                          <Eye className="size-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => onExecute(movement)}
                        >
                          <Play className="size-4" />
                          {t('pending.execute')}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
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
