import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import type { StockMovement } from '../../services/stockMovements';

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

  const getMovementTypeColor = (type: string) => {
    const colorMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      reserve: 'secondary',
      unreserve: 'outline',
      sales: 'destructive',
      batch: 'default',
      return: 'secondary',
      manual_adjustment: 'outline',
    };
    return colorMap[type] || 'outline';
  };

  const getQuantityColor = (quantity: number) => {
    return quantity > 0 ? 'default' : 'destructive';
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('movements.details.title')}</DialogTitle>
        </DialogHeader>
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
            <h3 className="font-semibold mb-3 text-sm text-gray-700">Movement Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">{t('movements.details.type')}</p>
                <div className="mt-1">
                  <Badge variant={getMovementTypeColor(movement.movementType)}>
                    {t(`movements.filters.${movement.movementType}`)}
                  </Badge>
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
          </div>

          {/* References Section */}
          <div className="border-b pb-4">
            <h3 className="font-semibold mb-3 text-sm text-gray-700">References</h3>
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
                <p className="text-xs text-gray-400">No related documents</p>
              )}
            </div>
          </div>

          {/* Audit Information */}
          <div className="border-b pb-4">
            <h3 className="font-semibold mb-3 text-sm text-gray-700">Audit Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">
                  {t('movements.details.performedBy')}
                </p>
                <div>
                  <p className="font-medium">{movement.userId?.name || 'Unknown'}</p>
                  <p className="text-xs text-gray-500">{movement.userId?.email || '-'}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('movements.details.createdAt')}</p>
                <p className="text-sm">{new Date(movement.createdAt!).toLocaleString()}</p>
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

          {/* Close Button */}
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
