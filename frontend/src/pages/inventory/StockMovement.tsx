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
import { Search, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { stockMovementService, type StockMovement } from '../../services/stockMovements';
import { StockMovementDetailsDialog } from '../../components/stock/StockMovementDetailsDialog';

export function StockMovementPage() {
  const { t } = useTranslation('stock');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
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

        const response = await stockMovementService.getStockMovements(
          searchQuery || undefined,
          typeFilter !== 'all' ? typeFilter : undefined,
          currentPage,
          limit,
        );

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
  }, [searchQuery, typeFilter, currentPage, limit]);

  const handleViewDetails = (movement: StockMovement) => {
    setSelectedMovement(movement);
    setDetailsOpen(true);
  };

  const getMovementTypeColor = (type: string) => {
    const colorMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      reserve: 'secondary',
      unreserve: 'outline',
      sales: 'destructive',
      batch: 'default',
      return: 'secondary',
      manual_adjustment: 'outline',
    };
    return colorMap[type] || 'outline';
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <Input
                placeholder={t('movements.searchPlaceholder')}
                className="pl-10"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1); // Reset to first page on search
                }}
              />
            </div>
            <Select
              value={typeFilter}
              onValueChange={(value) => {
                setTypeFilter(value);
                setCurrentPage(1); // Reset to first page on filter change
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('movements.filters.allTypes')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('movements.filters.allTypes')}</SelectItem>
                <SelectItem value="reserve">{t('movements.filters.reserve')}</SelectItem>
                <SelectItem value="unreserve">{t('movements.filters.unreserve')}</SelectItem>
                <SelectItem value="sales">{t('movements.filters.sales')}</SelectItem>
                <SelectItem value="batch">{t('movements.filters.batch')}</SelectItem>
                <SelectItem value="return">{t('movements.filters.return')}</SelectItem>
                <SelectItem value="manual_adjustment">
                  {t('movements.filters.manual_adjustment')}
                </SelectItem>
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
                    <TableHead>{t('movements.table.type')}</TableHead>
                    <TableHead>{t('movements.table.product')}</TableHead>
                    <TableHead>{t('movements.table.code')}</TableHead>
                    <TableHead>{t('movements.table.quantity')}</TableHead>
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
                        <Badge variant={getMovementTypeColor(movement.movementType)}>
                          {t(`movements.filters.${movement.movementType}`)}
                        </Badge>
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
                      <TableCell className="font-mono text-sm">
                        {movement.orderId?.orderNumber
                          ? `ORD-${movement.orderId.orderNumber}`
                          : movement.returnId?.returnNumber
                            ? `RET-${movement.returnId.returnNumber}`
                            : movement.batchId?.batchNumber
                              ? `BATCH-${movement.batchId.batchNumber}`
                              : '-'}
                      </TableCell>
                      <TableCell>{movement.userId?.name || 'Unknown'}</TableCell>
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
