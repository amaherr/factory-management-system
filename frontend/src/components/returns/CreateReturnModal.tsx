import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Order } from '../../services/orders';
import { CURRENCY, orderService } from '../../services/orders';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface CreateReturnModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateReturnModal({ open, onOpenChange, onSuccess }: CreateReturnModalProps) {
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
          quantity: qty,
          unitPrice: Number(orderItem.unitPrice),
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
      <DialogContent className="sm:max-w-[850px]">
        <DialogHeader>
          <DialogTitle>{t('returns.createDialog.title')}</DialogTitle>
          <DialogDescription>{t('returns.createDialog.description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">{t('returns.createDialog.orderLabel')}</p>
              <Select
                value={selectedOrderId}
                onValueChange={setSelectedOrderId}
              >
                <SelectTrigger>
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
                        #{order.orderNumber}
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
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">{t('returns.createDialog.itemsTitle')}</p>
            {!selectedOrderId ? (
              <div className="rounded-md border p-4 text-sm text-gray-500">
                {t('returns.createDialog.chooseOrderFirst')}
              </div>
            ) : orderDetailsLoading ? (
              <div className="rounded-md border p-6 flex justify-center">
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
                      className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end rounded-md border p-3"
                    >
                      <div className="md:col-span-2">
                        <p className="text-sm font-medium">{productName}</p>
                        <p className="text-xs text-gray-500">
                          {t('returns.createDialog.soldQty')}: {orderItem.quantity}
                          {orderItem.actualQuantity != null &&
                            ` (${t('returns.createDialog.actualQty')}: ${orderItem.actualQuantity})`}
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
                        {orderItem.totalPrice != null && (
                          <p className="text-xs text-gray-500">
                            {t('returns.createDialog.itemTotal')}: {CURRENCY}{Number(orderItem.totalPrice).toFixed(2)}
                          </p>
                        )}
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
