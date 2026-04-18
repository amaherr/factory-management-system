import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import {
  Search,
  Eye,
  Pencil,
  Trash2,
  Loader2,
  X,
  FileDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { Order } from '../../services/orders';
import { orderService, CURRENCY } from '../../services/orders';
import { OrderDetailsDialog } from '../../components/pos/orders/OrderDetailsDialog';
import { ChangeOrderStatusDialog } from '../../components/pos/orders/ChangeOrderStatusDialog';
import { DeleteOrderDialog } from '../../components/pos/orders/DeleteOrderDialog';
import { toast } from 'sonner';

export function OrdersList() {
  const { t } = useTranslation('pos');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [orders, setOrders] = useState<Order[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [detailsSelectedOrderId, setDetailsSelectedOrderId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [statusChangeOrder, setStatusChangeOrder] = useState<Order | null>(null);
  const [statusChangeOpen, setStatusChangeOpen] = useState(false);
  const [deleteSelectedOrder, setDeleteSelectedOrder] = useState<Order | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  // ADDED: function to count items by type
  const getItemTypeBreakdown = (order: Order) => {
    const onShelf = order.items.filter((item: any) => item.itemType === 'on shelf').length;
    const onDemand = order.items.filter((item: any) => item.itemType === 'on demand').length;
    return { onShelf, onDemand };
  };

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const data = await orderService.getOrdersPaginated({
          page: currentPage,
          limit,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          query: searchQuery || undefined,
        });
        setOrders(data.orders);
        setTotal(data.total);
        setTotalPages(data.pages);

        if (data.pages > 0 && currentPage > data.pages) {
          setCurrentPage(data.pages);
        }
      } catch (error: any) {
        toast.error(error.message || t('toasts.generalError'));
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [statusFilter, searchQuery, refreshTrigger, t, currentPage, limit]);

  // Defensive check to ensure orders is always an array
  const filteredOrders = Array.isArray(orders) ? orders : [];

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const from = total === 0 ? 0 : (currentPage - 1) * limit + 1;
  const to = Math.min(currentPage * limit, total);

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

  const handleDownloadInvoice = async (orderId: string) => {
    try {
      const { blob, fileName } = await orderService.downloadInvoice(orderId);
      downloadBlobFile(blob, fileName);
      toast.success(t('toasts.invoiceDownloaded'));
    } catch (error: any) {
      toast.error(error.message || t('toasts.invoiceDownloadFailed'));
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">{t('listTitle')}</h1>
        <p className="text-gray-500">{t('listDescription')}</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1.6fr)_180px_180px] md:items-center">
            <div className="relative max-w-xl">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('searchPlaceholder')}
                className="h-9 rounded-md border-[--border-default] bg-[--bg-secondary] pl-9 pr-9 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-[--primary-500]/30"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
              {searchQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 size-7 -translate-y-1/2 p-0 text-muted-foreground hover:bg-black/5"
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  title={t('clearSearch')}
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-9 rounded-md">
                <SelectValue placeholder={t('status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allStatus')}</SelectItem>
                <SelectItem value="draft">{t('orderStatus.draft')}</SelectItem>
                <SelectItem value="finalized">{t('orderStatus.finalized')}</SelectItem>
                <SelectItem value="cancelled">{t('orderStatus.cancelled')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">{t('noOrders')}</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('orderNumber')}</TableHead>
                    <TableHead>{t('customer')}</TableHead>
                    <TableHead>{t('items')}</TableHead>
                    <TableHead>{t('status')}</TableHead>
                    <TableHead>{t('pricing.total')}</TableHead>
                    <TableHead>{t('createdDate')}</TableHead>
                    <TableHead className="text-right">{t('ac-title')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order._id}>
                      <TableCell className="font-medium">#{order.orderNumber}</TableCell>
                      <TableCell>
                        {typeof order.customerId === 'string'
                          ? order.customerId
                          : (order.customerId as any).name || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {getItemTypeBreakdown(order).onShelf > 0 && (
                            <Badge
                              variant="default"
                              className="text-xs"
                            >
                              {getItemTypeBreakdown(order).onShelf} {t('itemType.onShelf')}
                            </Badge>
                          )}
                          {getItemTypeBreakdown(order).onDemand > 0 && (
                            <Badge
                              variant="secondary"
                              className="text-xs"
                            >
                              {getItemTypeBreakdown(order).onDemand} {t('itemType.onDemand')}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
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
                          {t(`orderStatus.${order.status}`)}
                        </Badge>
                      </TableCell>
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
                            onClick={() => handleDownloadInvoice(order._id)}
                            title={t('actions.downloadInvoice')}
                            className="border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                          >
                            <FileDown className="size-4" />
                            <span className="ml-1.5 hidden lg:inline">
                              {t('actions.downloadInvoice')}
                            </span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDetailsSelectedOrderId(order._id);
                              setDetailsOpen(true);
                            }}
                            className="text-black hover:bg-black/10"
                            title={t('viewDetails')}
                          >
                            <Eye className="size-4" />
                          </Button>
                          {order.status === 'draft' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setStatusChangeOrder(order);
                                setStatusChangeOpen(true);
                              }}
                              className="text-blue-700 hover:bg-blue-50"
                              title={t('changeStatus')}
                            >
                              <Pencil className="size-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDeleteSelectedOrder(order);
                              setDeleteOpen(true);
                            }}
                            title={t('delete')}
                            className="text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {!loading && total > 0 && (
                <div className="border-t p-4 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {t('ordersPagination.showing', {
                      from,
                      to,
                      total,
                    })}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={loading || currentPage <= 1}
                    >
                      <ChevronLeft className="size-4 mr-1" />
                      {t('ordersPagination.previous')}
                    </Button>
                    <div className="flex items-center gap-2 px-3 py-1">
                      <span className="text-sm">
                        {t('ordersPagination.page', {
                          current: totalPages === 0 ? 0 : currentPage,
                          total: totalPages,
                        })}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={loading || totalPages === 0 || currentPage >= totalPages}
                    >
                      {t('ordersPagination.next')}
                      <ChevronRight className="size-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <OrderDetailsDialog
        orderId={detailsSelectedOrderId}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
      <ChangeOrderStatusDialog
        order={statusChangeOrder}
        open={statusChangeOpen}
        onOpenChange={setStatusChangeOpen}
        onSuccess={handleRefresh}
      />
      <DeleteOrderDialog
        order={deleteSelectedOrder}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
