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
import { Search, Eye, Pencil, Trash2, Loader2, X } from 'lucide-react';
import type { Order } from '../../services/orders';
import { orderService, CURRENCY } from '../../services/orders';
import { OrderDetailsDialog } from '../../components/orders/OrderDetailsDialog';
import { ChangeOrderStatusDialog } from '../../components/orders/ChangeOrderStatusDialog';
import { DeleteOrderDialog } from '../../components/orders/DeleteOrderDialog';
import { toast } from 'sonner';

export function OrdersList() {
  const { t } = useTranslation('pos');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [detailsSelectedOrderId, setDetailsSelectedOrderId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [statusChangeOrder, setStatusChangeOrder] = useState<Order | null>(null);
  const [statusChangeOpen, setStatusChangeOpen] = useState(false);
  const [deleteSelectedOrder, setDeleteSelectedOrder] = useState<Order | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const data = await orderService.getOrders({
          status: statusFilter !== 'all' ? statusFilter : undefined,
          orderType: typeFilter !== 'all' ? typeFilter : undefined,
          query: searchQuery || undefined,
        });
        setOrders(data);
      } catch (error: any) {
        toast.error(error.message || t('toasts.generalError'));
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [statusFilter, typeFilter, searchQuery, refreshTrigger, t]);

  // Defensive check to ensure orders is always an array
  const filteredOrders = Array.isArray(orders) ? orders : [];

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
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
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 size-7 -translate-y-1/2 p-0 text-muted-foreground hover:bg-black/5"
                  onClick={() => setSearchQuery('')}
                  title={t('clearSearch')}
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
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
            <Select
              value={typeFilter}
              onValueChange={setTypeFilter}
            >
              <SelectTrigger className="h-9 rounded-md">
                <SelectValue placeholder={t('orderType.label')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allTypes')}</SelectItem>
                <SelectItem value="on shelf">{t('orderType.onShelf')}</SelectItem>
                <SelectItem value="on demand">{t('orderType.onDemand')}</SelectItem>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('orderNumber')}</TableHead>
                  <TableHead>{t('customer')}</TableHead>
                  <TableHead>{t('orderType.label')}</TableHead>
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
                      <Badge
                        variant="outline"
                        className="capitalize"
                      >
                        {order.orderType}
                      </Badge>
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
