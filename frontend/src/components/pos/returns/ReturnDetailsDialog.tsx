import { useTranslation } from 'react-i18next';
import type { ReturnRecord } from '../../../services/returns';
import { CURRENCY } from '../../../services/orders';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';

interface ReturnDetailsDialogProps {
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

export function ReturnDetailsDialog({
  open,
  onOpenChange,
  returnRecord,
}: ReturnDetailsDialogProps) {
  const { t } = useTranslation('pos');
  const formatReturnNumber = (returnNumber: number | string) =>
    `${t('returns.numberPrefix')} - ${returnNumber}`;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-[760px]">
        <DialogHeader className="border-b border-[--border-default] bg-[--bg-secondary] px-6 py-4">
          <DialogTitle>{t('returns.detailsDialog.title')}</DialogTitle>
          <DialogDescription>
            {returnRecord
              ? formatReturnNumber(returnRecord.returnNumber)
              : t('returns.common.loading')}
          </DialogDescription>
        </DialogHeader>

        {returnRecord && (
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-md border border-[--border-default] bg-[--bg-secondary] p-3">
                <p className="text-xs text-muted-foreground">{t('returns.table.returnNumber')}</p>
                <p className="mt-1 font-medium">#{formatReturnNumber(returnRecord.returnNumber)}</p>
              </div>
              <div className="rounded-md border border-[--border-default] bg-[--bg-secondary] p-3">
                <p className="text-xs text-muted-foreground">{t('returns.table.orderNumber')}</p>
                <p className="mt-1 font-medium">{getOrderNumber(returnRecord.orderId)}</p>
              </div>
              <div className="rounded-md border border-[--border-default] bg-[--bg-secondary] p-3">
                <p className="text-xs text-muted-foreground">{t('returns.table.status')}</p>
                <Badge className={getStatusColor(returnRecord.status)}>
                  {t(`returns.status.${returnRecord.status}`)}
                </Badge>
              </div>
              <div className="rounded-md border border-[--border-default] bg-[--bg-secondary] p-3">
                <p className="text-xs text-muted-foreground">{t('returns.table.returnDate')}</p>
                <p className="mt-1 font-medium">
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
                    className="flex justify-between rounded-md border border-[--border-default] bg-[--bg-secondary] p-3"
                  >
                    <div>
                      <p className="font-medium text-sm">{name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('returns.detailsDialog.qty')}: {item.lineQuantity}
                      </p>
                      {item.actualQuantity != null && (
                        <p className="text-xs text-muted-foreground">
                          {t('returns.detailsDialog.actualQty')}: {item.actualQuantity}
                        </p>
                      )}
                    </div>
                    <p className="text-sm font-medium">
                      {CURRENCY}
                      {(item.lineQuantity * item.unitPrice).toFixed(2)}
                    </p>
                  </div>
                );
              })}
            </div>

            {returnRecord.note && (
              <div>
                <p className="text-sm font-medium mb-1">{t('returns.detailsDialog.note')}</p>
                <p className="rounded-md border border-[--border-default] bg-[--bg-secondary] p-3 text-sm text-muted-foreground">
                  {returnRecord.note}
                </p>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="border-t border-[--border-default] bg-[--bg-secondary] px-6 py-3">
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
