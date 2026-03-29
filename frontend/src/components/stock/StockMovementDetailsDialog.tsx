import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import type { StockMovement, WarehouseAction } from '../../services/stockMovements';

interface StockMovementDetailsDialogProps {
  movement: StockMovement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StockMovementDetailsDialog({
  movement,
  open,
  onOpenChange,
}: StockMovementDetailsDialogProps) {
  const { t } = useTranslation('stock');

  if (!movement) return null;

  const getWarehouseActionColor = (action?: WarehouseAction | null) => {
    const colorMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pick: 'destructive',
      receive: 'default',
      transfer: 'secondary',
    };

    if (!action) return 'outline';
    return colorMap[action] || 'outline';
  };

  const getQuantityColor = (quantity: number) => {
    return quantity > 0 ? 'default' : 'destructive';
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="flex max-w-2xl max-h-[85vh] flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b bg-background px-6 py-4 pr-12">
          <DialogTitle>{t('movements.details.title')}</DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-6">
            {/* Product Section */}
            <div className="border-b pb-4">
              <h3 className="font-semibold mb-3 text-sm text-gray-700">
                {t('movements.details.product')}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">{t('movements.details.product')}</p>
                  <p className="font-medium">{movement.productId?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('movements.details.code')}</p>
                  <p className="font-mono">{movement.productId?.code || '-'}</p>
                </div>
              </div>
            </div>

            {/* Movement Details */}
            <div className="border-b pb-4">
              <h3 className="font-semibold mb-3 text-sm text-gray-700">
                {t('movements.details.movement')}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">{t('movements.details.flow')}</p>
                  <div className="mt-1 flex items-center gap-2 text-sm">
                    <span className="font-mono font-bold text-xs uppercase tracking-wide text-foreground">
                      {t(`movements.buckets.${movement.from}`)}
                    </span>
                    <ArrowRight className="size-3.5 text-muted-foreground" />
                    <span className="font-mono font-bold text-xs uppercase tracking-wide text-foreground">
                      {t(`movements.buckets.${movement.to}`)}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('movements.details.quantity')}</p>
                  <div className="mt-1">
                    <Badge variant={getQuantityColor(movement.quantityChange)}>
                      {movement.quantityChange > 0 ? '+' : ''}
                      {movement.quantityChange}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t('movements.details.warehouseAction')}
                  </p>
                  <div className="mt-1">
                    <Badge variant={getWarehouseActionColor(movement.warehouseAction)}>
                      {movement.warehouseAction
                        ? t(`movements.warehouseActions.${movement.warehouseAction}`)
                        : t('movements.warehouseActions.none')}
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t('movements.details.executionStatus')}
                  </p>
                  <div className="mt-1">
                    <Badge variant={movement.isExecuted ? 'default' : 'outline'}>
                      {movement.isExecuted
                        ? t('movements.execution.executed')
                        : t('movements.execution.pending')}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t('movements.details.sourceLocation')}
                  </p>
                  <p className="font-medium">
                    {movement.sourceLocation
                      ? t(`locations.${movement.sourceLocation.toLowerCase()}`)
                      : t('movements.details.noLocation')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t('movements.details.destinationLocation')}
                  </p>
                  <p className="font-medium">
                    {movement.destinationLocation
                      ? t(`locations.${movement.destinationLocation.toLowerCase()}`)
                      : t('movements.details.noLocation')}
                  </p>
                </div>
              </div>
            </div>

            {/* References Section */}
            <div className="border-b pb-4">
              <h3 className="font-semibold mb-3 text-sm text-gray-700">
                {t('movements.details.references')}
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {movement.orderId && (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {t('movements.details.relatedOrder')}
                    </p>
                    <p className="font-mono text-sm">ORD-{movement.orderId.orderNumber}</p>
                  </div>
                )}
                {movement.returnId && (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {t('movements.details.relatedReturn')}
                    </p>
                    <p className="font-mono text-sm">RET-{movement.returnId.returnNumber}</p>
                  </div>
                )}
                {movement.batchId && (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {t('movements.details.relatedBatch')}
                    </p>
                    <p className="font-mono text-sm">BATCH-{movement.batchId.batchNumber}</p>
                  </div>
                )}
                {!movement.orderId && !movement.returnId && !movement.batchId && (
                  <p className="text-xs text-gray-400">{t('movements.details.noReferences')}</p>
                )}
              </div>
            </div>

            {/* Audit Information */}
            <div className="border-b pb-4">
              <h3 className="font-semibold mb-3 text-sm text-gray-700">
                {t('movements.details.audit')}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t('movements.details.performedBy')}
                  </p>
                  <div>
                    <p className="font-medium">
                      {movement.createdByUserId?.name || t('movements.unknownUser')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {movement.createdByUserId?.email || '-'}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t('movements.details.createdAt')}
                  </p>
                  <p className="text-sm">{new Date(movement.createdAt!).toLocaleString()}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t('movements.details.physicalExecutedBy')}
                  </p>
                  <div>
                    <p className="font-medium">
                      {movement.physicalExecutedByUserId?.name ||
                        t('movements.details.notExecutedYet')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {movement.physicalExecutedByUserId?.email || '-'}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t('movements.details.physicalExecutedAt')}
                  </p>
                  <p className="text-sm">
                    {movement.physicalExecutedAt
                      ? new Date(movement.physicalExecutedAt).toLocaleString()
                      : t('movements.details.notExecutedYet')}
                  </p>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            {movement.notes && (
              <div className="border-b pb-4">
                <h3 className="font-semibold mb-3 text-sm text-gray-700">
                  {t('movements.table.notes')}
                </h3>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{movement.notes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 border-t bg-background px-6 py-4">
          <div className="flex justify-end">
            <Button
              onClick={() => onOpenChange(false)}
              variant="default"
            >
              {t('movements.details.close')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
