import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Order } from '../../../services/orders';
import { CURRENCY, orderService } from '../../../services/orders';
import { returnService } from '../../../services/returns';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';

interface CreateReturnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateReturnDialog({ open, onOpenChange, onSuccess }: CreateReturnDialogProps) {
  const { t } = useTranslation('pos');

  const [createLoading, setCreateLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderDetailsLoading, setOrderDetailsLoading] = useState(false);
  const [finalizedOrders, setFinalizedOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [createReturnDate, setCreateReturnDate] = useState('');
  const [createNote, setCreateNote] = useState('');
  const [quantities, setQuantities] = useState<Record<string, string>>({});

  const formatReturnNumber = (returnNumber: number | string) =>
    `${t('returns.numberPrefix')} - ${returnNumber}`;

  const resetState = () => {
    setSelectedOrderId('');
    setSelectedOrder(null);
    setCreateReturnDate('');
    setCreateNote('');
    setQuantities({});
  };

  useEffect(() => {
    if (!open) return;

    const fetchOrders = async () => {
      setOrdersLoading(true);
      try {
        const data = await orderService.getOrders({ status: 'finalized' });
        setFinalizedOrders(Array.isArray(data) ? data : []);
      } catch (error: any) {
        toast.error(error.message || t('returns.toasts.generalError'));
      } finally {
        setOrdersLoading(false);
      }
    };

    fetchOrders();
  }, [open, t]);

  useEffect(() => {
    if (!selectedOrderId) {
      setSelectedOrder(null);
      setQuantities({});
      return;
    }

    const fetchOrderDetails = async () => {
      setOrderDetailsLoading(true);
      try {
        const data = await orderService.getOrder(selectedOrderId);
        setSelectedOrder(data);
        setQuantities({});
      } catch (error: any) {
        toast.error(error.message || t('returns.toasts.generalError'));
      } finally {
        setOrderDetailsLoading(false);
      }
    };

    fetchOrderDetails();
  }, [selectedOrderId, t]);

  const handleCreateReturn = async () => {
    if (!selectedOrderId || !selectedOrder) {
      toast.error(t('returns.toasts.selectOrder'));
      return;
    }

    const itemsPayload = selectedOrder.items
      .map((orderItem) => {
        const productId =
          typeof orderItem.productId === 'string' ? orderItem.productId : orderItem.productId._id;
        const qty = Number(quantities[productId] || 0);

        if (!Number.isInteger(qty) || qty <= 0) return null;

        return {
          productId,
          quantity: qty, // lineQuantity - number of lines being returned
          unitPrice: Number(orderItem.unitPrice ?? 0),
        };
      })
      .filter((item): item is { productId: string; quantity: number; unitPrice: number } =>
        Boolean(item),
      );

    if (itemsPayload.length === 0) {
      toast.error(t('returns.toasts.selectAtLeastOneItem'));
      return;
    }

    setCreateLoading(true);
    try {
      await returnService.createReturn({
        orderId: selectedOrderId,
        note: createNote || undefined,
        returnDate: createReturnDate ? new Date(createReturnDate).toISOString() : undefined,
        items: itemsPayload,
      });

      toast.success(t('returns.toasts.createdSuccess'));
      onOpenChange(false);
      resetState();
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || t('returns.toasts.generalError'));
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) resetState();
      }}
    >
      <DialogContent className="flex max-h-[88vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-[900px]">
        <DialogHeader className="border-b border-[--border-default] bg-[--bg-secondary] px-6 py-4">
          <DialogTitle>{t('returns.createDialog.title')}</DialogTitle>
          <DialogDescription>{t('returns.createDialog.description')}</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium">{t('returns.createDialog.orderLabel')}</p>
              <Select
                value={selectedOrderId}
                onValueChange={setSelectedOrderId}
              >
                <SelectTrigger className="h-9 rounded-md border-[--border-default] bg-[--bg-secondary] text-sm shadow-sm focus:ring-2 focus:ring-[--primary-500]/30">
                  <SelectValue placeholder={t('returns.createDialog.orderPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {ordersLoading ? (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      {t('returns.createDialog.loadingOrders')}
                    </div>
                  ) : finalizedOrders.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      {t('returns.createDialog.noFinalizedOrders')}
                    </div>
                  ) : (
                    finalizedOrders.map((order) => (
                      <SelectItem
                        key={order._id}
                        value={order._id}
                      >
                        {formatReturnNumber(order.orderNumber)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">{t('returns.createDialog.returnDate')}</p>
              <Input
                type="date"
                className="h-9 rounded-md border-[--border-default] bg-[--bg-secondary] text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-[--primary-500]/30"
                value={createReturnDate}
                onChange={(e) => setCreateReturnDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">{t('returns.createDialog.note')}</p>
            <Textarea
              value={createNote}
              onChange={(e) => setCreateNote(e.target.value)}
              placeholder={t('returns.createDialog.notePlaceholder')}
              className="border-[--border-default] bg-[--bg-secondary] text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-[--primary-500]/30"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">{t('returns.createDialog.itemsTitle')}</p>
            {!selectedOrderId ? (
              <div className="rounded-md border border-[--border-default] bg-[--bg-secondary] p-4 text-sm text-muted-foreground">
                {t('returns.createDialog.chooseOrderFirst')}
              </div>
            ) : orderDetailsLoading ? (
              <div className="flex justify-center rounded-md border border-[--border-default] bg-[--bg-secondary] p-6">
                <Loader2 className="size-5 animate-spin text-primary" />
              </div>
            ) : selectedOrder?.items?.length ? (
              <div className="space-y-3">
                {selectedOrder.items.map((orderItem) => {
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
                      className="grid grid-cols-1 items-end gap-3 rounded-md border border-[--border-default] bg-[--bg-secondary] p-3 md:grid-cols-4"
                    >
                      <div className="md:col-span-2">
                        <p className="text-sm font-medium">{productName}</p>
                        <p className="text-xs text-muted-foreground">
                          {t('returns.createDialog.soldQty')}: {orderItem.lineQuantity}
                          {orderItem.actualQuantity != null &&
                            ` (${t('returns.createDialog.actualQty')}: ${orderItem.actualQuantity})`}
                        </p>
                      </div>

                      <div>
                        <p className="mb-1 text-xs text-muted-foreground">
                          {t('returns.createDialog.unitPrice')}
                        </p>
                        <p className="text-sm font-medium">
                          {CURRENCY}
                          {Number(orderItem.unitPrice ?? 0).toFixed(2)}
                        </p>
                        {orderItem.totalPrice != null && (
                          <p className="text-xs text-muted-foreground">
                            {t('returns.createDialog.itemTotal')}: {CURRENCY}
                            {Number(orderItem.totalPrice ?? 0).toFixed(2)}
                          </p>
                        )}
                      </div>

                      <div>
                        <p className="mb-1 text-xs text-muted-foreground">
                          {t('returns.createDialog.returnQty')}
                        </p>
                        <Input
                          type="number"
                          min={0}
                          max={orderItem.lineQuantity}
                          className="h-9 rounded-md border-[--border-default] bg-white text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-[--primary-500]/30"
                          value={quantities[productId] ?? ''}
                          onChange={(e) => {
                            const raw = e.target.value;
                            if (raw === '') {
                              setQuantities((prev) => ({ ...prev, [productId]: '' }));
                              return;
                            }

                            const num = Number(raw);
                            const clamped = Math.max(0, Math.min(orderItem.lineQuantity, num));
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
              <div className="rounded-md border border-[--border-default] bg-[--bg-secondary] p-4 text-sm text-muted-foreground">
                {t('returns.createDialog.noOrderItems')}
              </div>
            )}
          </div>

          {selectedOrder?.items?.length ? (
            <div className="space-y-2 border-t border-[--border-default] pt-4">
              <p className="text-sm font-medium">{t('returns.createDialog.returnSummary')}</p>
              <div className="space-y-2">
                {selectedOrder.items
                  .filter((item) => {
                    const productId =
                      typeof item.productId === 'string' ? item.productId : item.productId._id;
                    return Number(quantities[productId] || 0) > 0;
                  })
                  .map((item) => {
                    const productId =
                      typeof item.productId === 'string' ? item.productId : item.productId._id;
                    const productName =
                      typeof item.productId === 'string'
                        ? item.productId
                        : item.productId.name || item.productId.productCode || productId;
                    const returnLineQty = Number(quantities[productId] || 0);
                    const unitPriceVal = Number(item.unitPrice ?? 0);
                    const returnTotalPrice = returnLineQty * unitPriceVal;

                    return (
                      <div
                        key={productId}
                        className="flex justify-between rounded-md border border-[--primary-200] bg-[--primary-50] p-3 text-sm"
                      >
                        <div>
                          <p className="font-medium">{productName}</p>
                          <p className="text-xs text-muted-foreground">
                            {t('returns.createDialog.returnQty')}: {returnLineQty}{' '}
                            {t('returns.createDialog.lines')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {CURRENCY}
                            {returnTotalPrice.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            @ {CURRENCY}
                            {unitPriceVal.toFixed(2)}/{t('returns.createDialog.line')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                {selectedOrder.items.every((item) => {
                  const productId =
                    typeof item.productId === 'string' ? item.productId : item.productId._id;
                  return Number(quantities[productId] || 0) === 0;
                }) && (
                  <p className="text-sm italic text-muted-foreground">
                    {t('returns.createDialog.selectItemsToReturn')}
                  </p>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {selectedOrder?.items?.length ? (
          <div className="border-t border-[--border-default] pt-4">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-muted-foreground">
                {t('returns.createDialog.totalRefund')}:
              </span>
              <span className="font-bold text-lg">
                {CURRENCY}
                {selectedOrder.items
                  .reduce((sum, item) => {
                    const productId =
                      typeof item.productId === 'string' ? item.productId : item.productId._id;
                    const returnQty = Number(quantities[productId] || 0);
                    const unitPrice = Number(item.unitPrice ?? 0);
                    return sum + returnQty * unitPrice;
                  }, 0)
                  .toFixed(2)}
              </span>
            </div>
          </div>
        ) : null}

        <DialogFooter className="border-t border-[--border-default] bg-[--bg-secondary] px-6 py-3">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              resetState();
            }}
            disabled={createLoading}
          >
            {t('returns.common.close')}
          </Button>
          <Button
            onClick={handleCreateReturn}
            disabled={createLoading || orderDetailsLoading}
          >
            {createLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {createLoading ? t('returns.createDialog.creating') : t('returns.createDialog.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
