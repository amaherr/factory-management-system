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
import { Search, Eye, ChevronLeft, ChevronRight, X, ArrowRight } from 'lucide-react';
import {
  stockMovementService,
  type StockMovement,
  type StockBucket,
  type WarehouseAction,
} from '../../services/stockMovements';
import { StockMovementDetailsDialog } from '../../components/inventory/stock/StockMovementDetailsDialog';

export function StockMovementPage() {
  const { t } = useTranslation('stock');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [executionFilter, setExecutionFilter] = useState<'all' | 'executed' | 'pending'>('all');
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMovement, setSelectedMovement] = useState<StockMovement | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);

  // Fetch stock movements
  useEffect(() => {
    const fetchMovements = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await stockMovementService.getStockMovements({
          productCode: searchQuery || undefined,
          bucketType: typeFilter !== 'all' ? (typeFilter as StockBucket) : undefined,
          isExecuted:
            executionFilter === 'all' ? undefined : executionFilter === 'executed' ? true : false,
          page: currentPage,
          limit,
        });

        setMovements(response.movements);
        setTotalPages(response.pages);
        setTotal(response.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stock movements');
        setMovements([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMovements();
  }, [searchQuery, typeFilter, executionFilter, currentPage, limit]);

  const handleViewDetails = (movement: StockMovement) => {
    setSelectedMovement(movement);
    setDetailsOpen(true);
  };

  const getWarehouseActionColor = (action?: WarehouseAction | null) => {
    const colorMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pick: 'destructive',
      receive: 'default',
      transfer: 'secondary',
    };

    if (!action) return 'outline';
    return colorMap[action] || 'outline';
  };

  const getQuantityColor = (quantity: number) => {
    return quantity > 0 ? 'default' : 'destructive';
  };

  const from = (currentPage - 1) * limit + 1;
  const to = Math.min(currentPage * limit, total);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">{t('movements.title')}</h1>
        <p className="text-gray-500">{t('movements.description')}</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1.6fr)_220px_220px] md:items-center">
            <div className="relative max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder={t('movements.searchPlaceholder')}
                className="h-9 rounded-md border-[--border-default] bg-[--bg-secondary] pl-9 pr-9 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-[--primary-500]/30"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1); // Reset to first page on search
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
                  aria-label={t('clearSearch')}
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>
            <Select
              value={typeFilter}
              onValueChange={(value) => {
                setTypeFilter(value);
                setCurrentPage(1); // Reset to first page on filter change
              }}
            >
              <SelectTrigger className="h-9 rounded-md">
                <SelectValue placeholder={t('movements.filters.allTypes')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('movements.filters.allTypes')}</SelectItem>
                <SelectItem value="reserve">{t('movements.buckets.reserve')}</SelectItem>
                <SelectItem value="sales">{t('movements.buckets.sales')}</SelectItem>
                <SelectItem value="batch">{t('movements.buckets.batch')}</SelectItem>
                <SelectItem value="return">{t('movements.buckets.return')}</SelectItem>
                <SelectItem value="manual_adjustment">
                  {t('movements.buckets.manual_adjustment')}
                </SelectItem>
                <SelectItem value="inventory">{t('movements.buckets.inventory')}</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={executionFilter}
              onValueChange={(value: 'all' | 'executed' | 'pending') => {
                setExecutionFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-9 rounded-md">
                <SelectValue placeholder={t('movements.filters.execution.all')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('movements.filters.execution.all')}</SelectItem>
                <SelectItem value="executed">
                  {t('movements.filters.execution.executed')}
                </SelectItem>
                <SelectItem value="pending">{t('movements.filters.execution.pending')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-center text-gray-500">{t('movements.loading')}</div>
          ) : movements.length === 0 ? (
            <div className="p-6 text-center text-gray-500">{t('movements.noResults')}</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('movements.table.timestamp')}</TableHead>
                    <TableHead>{t('movements.table.flow')}</TableHead>
                    <TableHead>{t('movements.table.product')}</TableHead>
                    <TableHead>{t('movements.table.code')}</TableHead>
                    <TableHead>{t('movements.table.quantity')}</TableHead>
                    <TableHead>{t('movements.table.warehouseAction')}</TableHead>
                    <TableHead>{t('movements.table.execution')}</TableHead>
                    <TableHead>{t('movements.table.reference')}</TableHead>
                    <TableHead>{t('movements.table.performedBy')}</TableHead>
                    <TableHead className="text-right">{t('movements.table.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((movement) => (
                    <TableRow key={movement._id}>
                      <TableCell>{new Date(movement.createdAt!).toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs uppercase tracking-wide text-foreground">
                            {t(`movements.buckets.${movement.from}`)}
                          </span>
                          <ArrowRight
                            className="size-3.5 text-muted-foreground"
                            aria-hidden="true"
                          />
                          <span className="font-mono font-bold text-xs uppercase tracking-wide text-foreground">
                            {t(`movements.buckets.${movement.to}`)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{movement.productId?.name || 'N/A'}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {movement.productId?.code || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getQuantityColor(movement.quantityChange)}>
                          {movement.quantityChange > 0 ? '+' : ''}
                          {movement.quantityChange}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getWarehouseActionColor(movement.warehouseAction)}>
                          {movement.warehouseAction
                            ? t(`movements.warehouseActions.${movement.warehouseAction}`)
                            : t('movements.warehouseActions.none')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={movement.isExecuted ? 'default' : 'outline'}>
                          {movement.isExecuted
                            ? t('movements.execution.executed')
                            : t('movements.execution.pending')}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {movement.orderId?.orderNumber
                          ? `ORD-${movement.orderId.orderNumber}`
                          : movement.returnId?.returnNumber
                            ? `RET-${movement.returnId.returnNumber}`
                            : movement.batchId?.batchNumber
                              ? `BATCH-${movement.batchId.batchNumber}`
                              : '-'}
                      </TableCell>
                      <TableCell>
                        {movement.createdByUserId?.name || t('movements.unknownUser')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(movement)}
                        >
                          <Eye className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="border-t p-4 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {t('movements.pagination.showing', {
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
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="size-4 mr-1" />
                    {t('movements.pagination.previous')}
                  </Button>
                  <div className="flex items-center gap-2 px-3 py-1">
                    <span className="text-sm">
                      {t('movements.pagination.page', {
                        current: currentPage,
                        total: totalPages,
                      })}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    {t('movements.pagination.next')}
                    <ChevronRight className="size-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <StockMovementDetailsDialog
        movement={selectedMovement}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </div>
  );
}
