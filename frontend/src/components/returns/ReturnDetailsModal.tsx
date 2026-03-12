import { useTranslation } from 'react-i18next';
import type { ReturnRecord } from '../../services/returns';
import { CURRENCY } from '../../services/orders';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

interface ReturnDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnRecord: ReturnRecord | null;
}

function getStatusColor(status: string): string {
  if (status === 'finalized') return 'bg-green-100 text-green-800';
  if (status === 'draft') return 'bg-yellow-100 text-yellow-800';
  if (status === 'cancelled') return 'bg-red-100 text-red-800';
  return 'bg-gray-100 text-gray-800';
}

function getOrderNumber(orderId: ReturnRecord['orderId']): string {
  if (typeof orderId === 'string') return '-';
  return orderId.orderNumber != null ? `#${orderId.orderNumber}` : '-';
}

export function ReturnDetailsModal({ open, onOpenChange, returnRecord }: ReturnDetailsModalProps) {
  const { t } = useTranslation('pos');

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>{t('returns.detailsDialog.title')}</DialogTitle>
          <DialogDescription>
            {returnRecord ? `#${returnRecord.returnNumber}` : t('returns.common.loading')}
          </DialogDescription>
        </DialogHeader>

        {returnRecord && (
          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-4 border-b pb-4">
              <div>
                <p className="text-xs text-gray-500">{t('returns.table.returnNumber')}</p>
                <p className="font-medium">#{returnRecord.returnNumber}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">{t('returns.table.orderNumber')}</p>
                <p className="font-medium">{getOrderNumber(returnRecord.orderId)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">{t('returns.table.status')}</p>
                <Badge className={getStatusColor(returnRecord.status)}>
                  {t(`returns.status.${returnRecord.status}`)}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-gray-500">{t('returns.table.returnDate')}</p>
                <p className="font-medium">
                  {new Date(returnRecord.returnDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">{t('returns.detailsDialog.itemsTitle')}</p>
              {returnRecord.items.map((item, index) => {
                const name =
                  typeof item.productId === 'string'
                    ? item.productId
                    : item.productId.name || item.productId.productCode || item.productId._id;
                return (
                  <div
                    key={`${name}-${index}`}
                    className="flex justify-between border rounded-md p-3"
                  >
                    <div>
                      <p className="font-medium text-sm">{name}</p>
                      <p className="text-xs text-gray-500">
                        {t('returns.detailsDialog.qty')}: {item.quantity}
                      </p>
                      {item.actualQuantity != null && (
                        <p className="text-xs text-gray-500">
                          {t('returns.detailsDialog.actualQty')}: {item.actualQuantity}
                        </p>
                      )}
                    </div>
                    <p className="text-sm font-medium">
                      {CURRENCY}
                      {(item.quantity * item.unitPrice).toFixed(2)}
                    </p>
                  </div>
                );
              })}
            </div>

            {returnRecord.note && (
              <div>
                <p className="text-sm font-medium mb-1">{t('returns.detailsDialog.note')}</p>
                <p className="text-sm text-gray-700 border rounded-md p-3">{returnRecord.note}</p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t('returns.common.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
