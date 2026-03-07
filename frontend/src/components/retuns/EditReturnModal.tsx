import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Order } from '../../services/orders';
import { CURRENCY, orderService } from '../../services/orders';
import type { ReturnRecord } from '../../services/returns';
import { returnService } from '../../services/returns';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

interface EditReturnModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnRecord: ReturnRecord | null;
  onSuccess: () => void;
}

function formatDateForInput(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function EditReturnModal({
  open,
  onOpenChange,
  returnRecord,
  onSuccess,
}: EditReturnModalProps) {
  const { t } = useTranslation('pos');

  const [loadingOrder, setLoadingOrder] = useState(false);
  const [saving, setSaving] = useState(false);
  const [orderDetails, setOrderDetails] = useState<Order | null>(null);
  const [returnDate, setReturnDate] = useState('');
  const [note, setNote] = useState('');
  const [quantities, setQuantities] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open || !returnRecord) return;

    const initialQty: Record<string, string> = {};
    for (const item of returnRecord.items) {
      const productId = typeof item.productId === 'string' ? item.productId : item.productId._id;
      initialQty[productId] = String(item.quantity);
    }

    setReturnDate(formatDateForInput(returnRecord.returnDate));
    setNote(returnRecord.note || '');
    setQuantities(initialQty);

    const orderId =
      typeof returnRecord.orderId === 'string' ? returnRecord.orderId : returnRecord.orderId._id;

    const fetchOrder = async () => {
      setLoadingOrder(true);
      try {
        const data = await orderService.getOrder(orderId);
        setOrderDetails(data);
      } catch (error: any) {
        toast.error(error.message || t('returns.toasts.generalError'));
      } finally {
        setLoadingOrder(false);
      }
    };

    fetchOrder();
  }, [open, returnRecord, t]);

  const handleSave = async () => {
    if (!returnRecord || !orderDetails) return;

    const items = orderDetails.items
      .map((orderItem) => {
        const productId =
          typeof orderItem.productId === 'string' ? orderItem.productId : orderItem.productId._id;
        const qty = Number(quantities[productId] || 0);

        if (!Number.isInteger(qty) || qty <= 0) return null;

        return {
          productId,
          quantity: qty,
          unitPrice: Number(orderItem.unitPrice),
        };
      })
      .filter((item): item is { productId: string; quantity: number; unitPrice: number } =>
        Boolean(item),
      );

    if (items.length === 0) {
      toast.error(t('returns.toasts.selectAtLeastOneItem'));
      return;
    }

    setSaving(true);
    try {
      await returnService.updateReturn(returnRecord._id, {
        note,
        returnDate: returnDate ? new Date(returnDate).toISOString() : undefined,
        items,
      });

      toast.success(t('returns.toasts.updatedSuccess'));
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || t('returns.toasts.generalError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-[850px]">
        <DialogHeader>
          <DialogTitle>{t('returns.editDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('returns.editDialog.description', { returnNumber: returnRecord?.returnNumber })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">{t('returns.createDialog.returnDate')}</p>
              <Input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">{t('returns.createDialog.note')}</p>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t('returns.createDialog.notePlaceholder')}
                rows={3}
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">{t('returns.createDialog.itemsTitle')}</p>
            {loadingOrder ? (
              <div className="rounded-md border p-6 flex justify-center">
                <Loader2 className="size-5 animate-spin text-primary" />
              </div>
            ) : orderDetails?.items?.length ? (
              <div className="space-y-3">
                {orderDetails.items.map((orderItem) => {
                  const productId =
                    typeof orderItem.productId === 'string'
                      ? orderItem.productId
                      : orderItem.productId._id;
                  const productName =
                    typeof orderItem.productId === 'string'
                      ? orderItem.productId
                      : orderItem.productId.name || orderItem.productId.productCode || productId;

                  return (
                    <div
                      key={productId}
                      className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end rounded-md border p-3"
                    >
                      <div className="md:col-span-2">
                        <p className="text-sm font-medium">{productName}</p>
                        <p className="text-xs text-gray-500">
                          {t('returns.createDialog.soldQty')}: {orderItem.quantity}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          {t('returns.createDialog.unitPrice')}
                        </p>
                        <p className="text-sm font-medium">
                          {CURRENCY}
                          {Number(orderItem.unitPrice).toFixed(2)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          {t('returns.createDialog.returnQty')}
                        </p>
                        <Input
                          type="number"
                          min={0}
                          max={orderItem.quantity}
                          value={quantities[productId] ?? ''}
                          onChange={(e) => {
                            const raw = e.target.value;
                            if (raw === '') {
                              setQuantities((prev) => ({ ...prev, [productId]: '' }));
                              return;
                            }

                            const num = Number(raw);
                            const clamped = Math.max(0, Math.min(orderItem.quantity, num));
                            setQuantities((prev) => ({
                              ...prev,
                              [productId]: String(Number.isNaN(clamped) ? 0 : clamped),
                            }));
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-md border p-4 text-sm text-gray-500">
                {t('returns.createDialog.noOrderItems')}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            {t('returns.common.close')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || loadingOrder}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {saving ? t('returns.editDialog.saving') : t('returns.editDialog.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
