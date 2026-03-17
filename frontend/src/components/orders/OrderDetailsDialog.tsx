import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Loader2 } from 'lucide-react';
import type { Order } from '../../services/orders';
import { orderService, CURRENCY } from '../../services/orders';

interface OrderDetailsDialogProps {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderDetailsDialog({ orderId, open, onOpenChange }: OrderDetailsDialogProps) {
  const { t } = useTranslation('pos');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && orderId) {
      const fetchOrder = async () => {
        setLoading(true);
        try {
          const data = await orderService.getOrder(orderId);
          setOrder(data);
        } catch (error: any) {
          console.error('Failed to fetch order:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchOrder();
    }
  }, [open, orderId]);

  if (!order && !loading) {
    return null;
  }

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      draft: 'bg-yellow-100 text-yellow-800',
      finalized: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-[760px]">
        <DialogHeader className="border-b border-[--border-default] bg-[--bg-secondary] px-6 py-4">
          <DialogTitle>{t('orderDetailsTitle')}</DialogTitle>
          <DialogDescription>{loading ? t('loading') : `#${order?.orderNumber}`}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex min-h-[260px] items-center justify-center px-6 py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : order ? (
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-md border border-[--border-default] bg-[--bg-secondary] p-3">
                  <p className="text-xs text-muted-foreground">{t('orderNumber')}</p>
                  <p className="mt-1 text-sm font-semibold">#{order.orderNumber}</p>
                </div>
                <div className="rounded-md border border-[--border-default] bg-[--bg-secondary] p-3">
                  <p className="text-xs text-muted-foreground">{t('status')}</p>
                  <Badge className={`${getStatusColor(order.status)} mt-1`}>
                    {t(`orderStatus.${order.status}`)}
                  </Badge>
                </div>
                <div className="rounded-md border border-[--border-default] bg-[--bg-secondary] p-3">
                  <p className="text-xs text-muted-foreground">{t('orderType.label')}</p>
                  <p className="mt-1 text-sm font-semibold capitalize">{order.orderType}</p>
                </div>
                <div className="rounded-md border border-[--border-default] bg-[--bg-secondary] p-3">
                  <p className="text-xs text-muted-foreground">{t('createdDate')}</p>
                  <p className="mt-1 text-sm font-semibold">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {order.customerId && (
                <Card className="border-[--border-default] shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{t('customer')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm text-muted-foreground">
                    {typeof order.customerId === 'string' ? (
                      <p>ID: {order.customerId}</p>
                    ) : (
                      <>
                        <p className="font-medium text-foreground">
                          {(order.customerId as any).name}
                        </p>
                        <p>{(order.customerId as any).company}</p>
                        <p>{(order.customerId as any).phoneNumber}</p>
                        <p>
                          {typeof (order.customerId as any).address === 'string'
                            ? (order.customerId as any).address
                            : ((order.customerId as any).address as any)?.street +
                              ', ' +
                              ((order.customerId as any).address as any)?.city +
                              ', ' +
                              ((order.customerId as any).address as any)?.governate +
                              ', ' +
                              ((order.customerId as any).address as any)?.country}
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card className="border-[--border-default] shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{t('items')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {order.items.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="rounded-md border border-[--border-default] bg-[--bg-secondary] px-3 py-2"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            {typeof item.productId === 'string' ? (
                              <p className="truncate text-sm font-medium">
                                Product ID: {item.productId}
                              </p>
                            ) : (
                              <>
                                <p className="truncate text-sm font-medium">
                                  {item.productId.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {item.productId.productCode}
                                </p>
                              </>
                            )}
                          </div>
                          <div className="text-right text-sm">
                            <p>
                              {item.quantity} x {CURRENCY}
                              {item.unitPrice.toFixed(2)}
                            </p>
                            {item.actualQuantity != null && (
                              <p className="text-xs text-muted-foreground">
                                {t('actualQuantity')}: {item.actualQuantity}
                              </p>
                            )}
                            <p className="text-xs font-medium text-foreground">
                              {t('pricing.itemTotal')}: {CURRENCY}
                              {(item.totalPrice ?? item.actualQuantity * item.unitPrice).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[--border-default] shadow-sm">
                <CardContent className="space-y-2 pt-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('pricing.subtotal')}</span>
                    <span className="font-medium">
                      {CURRENCY}
                      {order.subTotal.toFixed(2)}
                    </span>
                  </div>
                  {order.discountAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('pricing.discount')}</span>
                      <span className="font-medium text-red-600">
                        -{CURRENCY}
                        {order.discountAmount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {order.taxAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('pricing.tax')}</span>
                      <span className="font-medium">
                        {CURRENCY}
                        {order.taxAmount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="mt-2 flex justify-between border-t border-[--border-default] pt-2">
                    <span className="font-semibold">{t('pricing.total')}</span>
                    <span className="text-lg font-semibold text-primary">
                      {CURRENCY}
                      {order.total.toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {order.notes && (
                <Card className="border-[--border-default] shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{t('notes')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{order.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ) : null}

        <div className="flex justify-end border-t border-[--border-default] bg-[--bg-secondary] px-6 py-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t('close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
