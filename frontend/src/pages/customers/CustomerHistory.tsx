import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router';
import { ArrowLeft, Eye, Loader2, ReceiptText, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { orderService, type Order, CURRENCY } from '../../services/orders';
import { returnService, type ReturnRecord } from '../../services/returns';
import { OrderDetailsDialog } from '../../components/pos/orders/OrderDetailsDialog';
import { ReturnDetailsDialog } from '../../components/pos/returns/ReturnDetailsDialog';

type CustomerHistoryLocationState = {
  customerName?: string;
};

function getReturnStatusColor(status: string): string {
  if (status === 'finalized') return 'bg-green-100 text-green-800';
  if (status === 'draft') return 'bg-yellow-100 text-yellow-800';
  if (status === 'cancelled') return 'bg-red-100 text-red-800';
  return 'bg-gray-100 text-gray-800';
}

function getOrderNumber(orderId: ReturnRecord['orderId']): string {
  if (typeof orderId === 'string') return '-';
  return orderId.orderNumber != null ? `#${orderId.orderNumber}` : '-';
}

export function CustomerHistory() {
  const { t } = useTranslation('customers');
  const { t: tPos } = useTranslation('pos');
  const { customerId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const locationState = (location.state || {}) as CustomerHistoryLocationState;
  const customerName = locationState.customerName || customerId;

  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [returns, setReturns] = useState<ReturnRecord[]>([]);

  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const [returnDetailsOpen, setReturnDetailsOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<ReturnRecord | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!customerId) return;
      setLoading(true);
      try {
        const [customerOrders, customerReturns] = await Promise.all([
          orderService.getOrders({ customerId }),
          returnService.getReturns({ customerId }),
        ]);

        setOrders(Array.isArray(customerOrders) ? customerOrders : []);
        setReturns(Array.isArray(customerReturns) ? customerReturns : []);
      } catch (error: any) {
        toast.error(error?.message || t('history_load_failed'));
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [customerId, t]);

  const sortedOrders = useMemo(
    () =>
      [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [orders],
  );

  const sortedReturns = useMemo(
    () =>
      [...returns].sort(
        (a, b) => new Date(b.returnDate).getTime() - new Date(a.returnDate).getTime(),
      ),
    [returns],
  );

  if (!customerId) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">{t('history_invalid_customer')}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">{t('customer_history')}</h1>
          <p className="text-gray-500">{t('history_description', { customerName })}</p>
        </div>

        <Button
          variant="outline"
          onClick={() => navigate('/customers')}
        >
          <ArrowLeft className="size-4 mr-2" />
          {t('back_to_customers')}
        </Button>
      </div>

      <Tabs
        defaultValue="orders"
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="orders">
            <ReceiptText className="size-4 mr-2" />
            {t('orders_tab')} ({orders.length})
          </TabsTrigger>
          <TabsTrigger value="returns">
            <RotateCcw className="size-4 mr-2" />
            {t('returns_tab')} ({returns.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>{t('orders_tab')}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : sortedOrders.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  {t('history_no_orders')}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{tPos('orderNumber')}</TableHead>
                      <TableHead>{tPos('status')}</TableHead>
                      <TableHead>{tPos('items')}</TableHead>
                      <TableHead>{tPos('pricing.total')}</TableHead>
                      <TableHead>{tPos('createdDate')}</TableHead>
                      <TableHead className="text-right">{tPos('ac-title')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedOrders.map((order) => (
                      <TableRow key={order._id}>
                        <TableCell className="font-medium">#{order.orderNumber}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              order.status === 'finalized'
                                ? 'bg-green-100 text-green-800'
                                : order.status === 'draft'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                            }
                          >
                            {tPos(`orderStatus.${order.status}`)}
                          </Badge>
                        </TableCell>
                        <TableCell>{order.items.length}</TableCell>
                        <TableCell>
                          {CURRENCY}
                          {order.total.toFixed(2)}
                        </TableCell>
                        <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-black hover:bg-black/10"
                              title={tPos('viewDetails')}
                              onClick={() => {
                                setSelectedOrderId(order._id);
                                setOrderDetailsOpen(true);
                              }}
                            >
                              <Eye className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="returns">
          <Card>
            <CardHeader>
              <CardTitle>{t('returns_tab')}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : sortedReturns.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  {t('history_no_returns')}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{tPos('returns.table.returnNumber')}</TableHead>
                      <TableHead>{tPos('returns.table.orderNumber')}</TableHead>
                      <TableHead>{tPos('returns.table.status')}</TableHead>
                      <TableHead>{tPos('returns.table.itemsCount')}</TableHead>
                      <TableHead>{tPos('returns.table.returnDate')}</TableHead>
                      <TableHead className="text-right">{tPos('returns.table.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedReturns.map((item) => (
                      <TableRow key={item._id}>
                        <TableCell className="font-medium">
                          #{tPos('returns.numberPrefix')} - {item.returnNumber}
                        </TableCell>
                        <TableCell>{getOrderNumber(item.orderId)}</TableCell>
                        <TableCell>
                          <Badge className={getReturnStatusColor(item.status)}>
                            {tPos(`returns.status.${item.status}`)}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.items.length}</TableCell>
                        <TableCell>{new Date(item.returnDate).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-black hover:bg-black/10"
                              title={tPos('returns.actions.viewDetails')}
                              onClick={() => {
                                setSelectedReturn(item);
                                setReturnDetailsOpen(true);
                              }}
                            >
                              <Eye className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <OrderDetailsDialog
        orderId={selectedOrderId}
        open={orderDetailsOpen}
        onOpenChange={setOrderDetailsOpen}
      />

      <ReturnDetailsDialog
        open={returnDetailsOpen}
        onOpenChange={(open) => {
          setReturnDetailsOpen(open);
          if (!open) setSelectedReturn(null);
        }}
        returnRecord={selectedReturn}
      />
    </div>
  );
}
