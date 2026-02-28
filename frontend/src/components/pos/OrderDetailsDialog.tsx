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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t('orderDetailsTitle')}</DialogTitle>
          <DialogDescription>{loading ? t('loading') : `#${order?.orderNumber}`}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : order ? (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4">
            {/* Order Header */}
            <div className="grid grid-cols-2 gap-4 pb-4 border-b">
              <div>
                <p className="text-sm text-gray-600">{t('orderNumber')}</p>
                <p className="font-medium">#{order.orderNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('status')}</p>
                <Badge className={`${getStatusColor(order.status)} mt-1`}>
                  {t(`orderStatus.${order.status}`)}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('orderType.label')}</p>
                <p className="font-medium capitalize">{order.orderType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('createdDate')}</p>
                <p className="font-medium text-sm">
                  {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Customer Info */}
            {order.customerId && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{t('customer')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {typeof order.customerId === 'string' ? (
                    <p className="text-sm text-gray-600">ID: {order.customerId}</p>
                  ) : (
                    <>
                      <p className="font-medium">{(order.customerId as any).name}</p>
                      <p className="text-sm text-gray-600">{(order.customerId as any).company}</p>
                      <p className="text-sm text-gray-600">
                        {(order.customerId as any).phoneNumber}
                      </p>
                      <p className="text-sm text-gray-600">
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

            {/* Items List */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{t('items')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {order.items.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex justify-between py-2 border-b last:border-0"
                    >
                      <div>
                        {typeof item.productId === 'string' ? (
                          <p className="font-medium text-sm">Product ID: {item.productId}</p>
                        ) : (
                          <>
                            <p className="font-medium text-sm">{item.productId.name}</p>
                            <p className="text-xs text-gray-600">{item.productId.productCode}</p>
                          </>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm">
                          {item.quantity} × {CURRENCY}
                          {item.unitPrice.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-600">
                          {CURRENCY}
                          {(item.quantity * item.unitPrice).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Pricing Summary */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">{t('pricing.subtotal')}</span>
                    <span className="font-medium">
                      {CURRENCY}
                      {order.subTotal.toFixed(2)}
                    </span>
                  </div>
                  {order.discountAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">{t('pricing.discount')}</span>
                      <span className="font-medium text-red-600">
                        -{CURRENCY}
                        {order.discountAmount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {order.taxAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">{t('pricing.tax')}</span>
                      <span className="font-medium">
                        {CURRENCY}
                        {order.taxAmount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="border-t pt-2 mt-2 flex justify-between">
                    <span className="font-semibold">{t('pricing.total')}</span>
                    <span className="font-semibold text-lg text-primary">
                      {CURRENCY}
                      {order.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {order.notes && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{t('notes')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700">{order.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : null}

        <div className="flex justify-end gap-2">
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
