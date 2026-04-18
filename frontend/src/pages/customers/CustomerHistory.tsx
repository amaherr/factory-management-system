import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileDown,
  Loader2,
  ReceiptText,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
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
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersPages, setOrdersPages] = useState(0);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [returnsPage, setReturnsPage] = useState(1);
  const [returnsPages, setReturnsPages] = useState(0);
  const [returnsTotal, setReturnsTotal] = useState(0);
  const [ordersSearchQuery, setOrdersSearchQuery] = useState('');
  const [returnsSearchQuery, setReturnsSearchQuery] = useState('');
  const [limit] = useState(10);

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
          orderService.getOrdersPaginated({
            customerId,
            page: ordersPage,
            limit,
            query: ordersSearchQuery.trim() || undefined,
          }),
          returnService.getReturns({
            customerId,
            page: returnsPage,
            limit,
            query: returnsSearchQuery.trim() || undefined,
          }),
        ]);

        setOrders(Array.isArray(customerOrders?.orders) ? customerOrders.orders : []);
        setOrdersPages(Number(customerOrders?.pages || 0));
        setOrdersTotal(Number(customerOrders?.total || 0));

        setReturns(Array.isArray(customerReturns?.returns) ? customerReturns.returns : []);
        setReturnsPages(Number(customerReturns?.pages || 0));
        setReturnsTotal(Number(customerReturns?.total || 0));

        if (customerOrders?.pages > 0 && ordersPage > customerOrders.pages) {
          setOrdersPage(customerOrders.pages);
        }

        if (customerReturns?.pages > 0 && returnsPage > customerReturns.pages) {
          setReturnsPage(customerReturns.pages);
        }
      } catch (error: any) {
        toast.error(error?.message || t('history_load_failed'));
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [customerId, t, ordersPage, returnsPage, limit, ordersSearchQuery, returnsSearchQuery]);

  const ordersFrom = ordersTotal === 0 ? 0 : (ordersPage - 1) * limit + 1;
  const ordersTo = Math.min(ordersPage * limit, ordersTotal);
  const returnsFrom = returnsTotal === 0 ? 0 : (returnsPage - 1) * limit + 1;
  const returnsTo = Math.min(returnsPage * limit, returnsTotal);

  const downloadBlobFile = (blob: Blob, fileName: string) => {
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadOrderInvoice = async (orderId: string) => {
    try {
      const { blob, fileName } = await orderService.downloadInvoice(orderId);
      downloadBlobFile(blob, fileName);
      toast.success(tPos('toasts.invoiceDownloaded'));
    } catch (error: any) {
      toast.error(error.message || tPos('toasts.invoiceDownloadFailed'));
    }
  };

  const handleDownloadReturnInvoice = async (returnId: string) => {
    try {
      const { blob, fileName } = await returnService.downloadInvoice(returnId);
      downloadBlobFile(blob, fileName);
      toast.success(tPos('returns.toasts.invoiceDownloaded'));
    } catch (error: any) {
      toast.error(error.message || tPos('returns.toasts.invoiceDownloadFailed'));
    }
  };

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
            {t('orders_tab')} ({ordersTotal})
          </TabsTrigger>
          <TabsTrigger value="returns">
            <RotateCcw className="size-4 mr-2" />
            {t('returns_tab')} ({returnsTotal})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>{t('orders_tab')}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="border-b p-4">
                <div className="relative max-w-xl">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={t('history_orders_search_placeholder')}
                    className="h-9 rounded-md border-[--border-default] bg-[--bg-secondary] pl-9 pr-9 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-[--primary-500]/30"
                    value={ordersSearchQuery}
                    onChange={(e) => {
                      setOrdersSearchQuery(e.target.value);
                      setOrdersPage(1);
                    }}
                  />
                  {ordersSearchQuery && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 size-7 -translate-y-1/2 p-0 text-muted-foreground hover:bg-black/5"
                      onClick={() => {
                        setOrdersSearchQuery('');
                        setOrdersPage(1);
                      }}
                      title={t('clear_search')}
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  {t('history_no_orders')}
                </div>
              ) : (
                <>
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
                      {orders.map((order) => (
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
                                variant="outline"
                                size="sm"
                                className="border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                                title={tPos('actions.downloadInvoice')}
                                onClick={() => handleDownloadOrderInvoice(order._id)}
                              >
                                <FileDown className="size-4" />
                                <span className="ml-1.5 hidden lg:inline">
                                  {tPos('actions.downloadInvoice')}
                                </span>
                              </Button>
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

                  {!loading && ordersTotal > 0 && (
                    <div className="border-t p-4 flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        {tPos('ordersPagination.showing', {
                          from: ordersFrom,
                          to: ordersTo,
                          total: ordersTotal,
                        })}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setOrdersPage((prev) => Math.max(1, prev - 1))}
                          disabled={loading || ordersPage <= 1}
                        >
                          <ChevronLeft className="size-4 mr-1" />
                          {tPos('ordersPagination.previous')}
                        </Button>
                        <div className="flex items-center gap-2 px-3 py-1">
                          <span className="text-sm">
                            {tPos('ordersPagination.page', {
                              current: ordersPages === 0 ? 0 : ordersPage,
                              total: ordersPages,
                            })}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setOrdersPage((prev) => Math.min(ordersPages, prev + 1))}
                          disabled={loading || ordersPages === 0 || ordersPage >= ordersPages}
                        >
                          {tPos('ordersPagination.next')}
                          <ChevronRight className="size-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
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
              <div className="border-b p-4">
                <div className="relative max-w-xl">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={t('history_returns_search_placeholder')}
                    className="h-9 rounded-md border-[--border-default] bg-[--bg-secondary] pl-9 pr-9 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-[--primary-500]/30"
                    value={returnsSearchQuery}
                    onChange={(e) => {
                      setReturnsSearchQuery(e.target.value);
                      setReturnsPage(1);
                    }}
                  />
                  {returnsSearchQuery && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 size-7 -translate-y-1/2 p-0 text-muted-foreground hover:bg-black/5"
                      onClick={() => {
                        setReturnsSearchQuery('');
                        setReturnsPage(1);
                      }}
                      title={t('clear_search')}
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : returns.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  {t('history_no_returns')}
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{tPos('returns.table.returnNumber')}</TableHead>
                        <TableHead>{tPos('returns.table.orderNumber')}</TableHead>
                        <TableHead>{tPos('returns.table.status')}</TableHead>
                        <TableHead>{tPos('returns.table.itemsCount')}</TableHead>
                        <TableHead>{tPos('returns.table.returnDate')}</TableHead>
                        <TableHead className="text-right">
                          {tPos('returns.table.actions')}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {returns.map((item) => (
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
                                variant="outline"
                                size="sm"
                                className="border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                                title={tPos('returns.actions.downloadInvoice')}
                                onClick={() => handleDownloadReturnInvoice(item._id)}
                              >
                                <FileDown className="size-4" />
                                <span className="ml-1.5 hidden lg:inline">
                                  {tPos('returns.actions.downloadInvoice')}
                                </span>
                              </Button>
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

                  {!loading && returnsTotal > 0 && (
                    <div className="border-t p-4 flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        {tPos('returns.pagination.showing', {
                          from: returnsFrom,
                          to: returnsTo,
                          total: returnsTotal,
                        })}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setReturnsPage((prev) => Math.max(1, prev - 1))}
                          disabled={loading || returnsPage <= 1}
                        >
                          <ChevronLeft className="size-4 mr-1" />
                          {tPos('returns.pagination.previous')}
                        </Button>
                        <div className="flex items-center gap-2 px-3 py-1">
                          <span className="text-sm">
                            {tPos('returns.pagination.page', {
                              current: returnsPages === 0 ? 0 : returnsPage,
                              total: returnsPages,
                            })}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setReturnsPage((prev) => Math.min(returnsPages, prev + 1))}
                          disabled={loading || returnsPages === 0 || returnsPage >= returnsPages}
                        >
                          {tPos('returns.pagination.next')}
                          <ChevronRight className="size-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
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
