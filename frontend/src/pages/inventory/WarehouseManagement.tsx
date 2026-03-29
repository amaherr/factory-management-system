import { useEffect, useState } from 'react';
import { Navigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { RefreshCw, Search, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { ROLES } from '../../services/enums/user.enums';
import {
  stockMovementService,
  type StockMovement,
  type WarehouseAction,
} from '../../services/stockMovements';
import { productService, type Product } from '../../services/products';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { PendingWarehouseExecutionsTable } from '../../components/warehouse/PendingWarehouseExecutionsTable';
import { WarehouseTransferPanel } from '../../components/warehouse/WarehouseTransferPanel';
import { ExecuteStockMovementDialog } from '../../components/warehouse/ExecuteStockMovementDialog';
import { StockMovementDetailsDialog } from '../../components/stock/StockMovementDetailsDialog';

const PAGE_SIZE = 10;

export function WarehouseManagementPage() {
  const { user } = useAuth();
  const { t } = useTranslation('warehouse');
  const { t: tStock } = useTranslation('stock');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<WarehouseAction | 'all'>('all');
  const [page, setPage] = useState(1);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [selectedMovement, setSelectedMovement] = useState<StockMovement | null>(null);
  const [executeDialogOpen, setExecuteDialogOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const canAccess =
    user?.roles?.includes(ROLES.ADMIN) || user?.roles?.includes(ROLES.INVENTORY) || false;

  useEffect(() => {
    let ignore = false;

    const loadPendingMovements = async () => {
      setPendingLoading(true);

      try {
        const response = await stockMovementService.getStockMovements({
          productCode: searchQuery || undefined,
          warehouseAction: actionFilter === 'all' ? undefined : actionFilter,
          isExecuted: false,
          page,
          limit: PAGE_SIZE,
        });

        if (ignore) {
          return;
        }

        setMovements(response.movements.filter((movement) => Boolean(movement.warehouseAction)));
        setTotal(response.total);
        setPages(response.pages || 1);
      } catch (error) {
        if (!ignore) {
          toast.error(error instanceof Error ? error.message : t('errors.pendingLoadFailed'));
        }
      } finally {
        if (!ignore) {
          setPendingLoading(false);
        }
      }
    };

    void loadPendingMovements();

    return () => {
      ignore = true;
    };
  }, [actionFilter, page, searchQuery, t]);

  useEffect(() => {
    let ignore = false;

    const loadProducts = async () => {
      setProductsLoading(true);

      try {
        const data = await productService.getProductsWithStock();
        if (!ignore) {
          setProducts(data);
        }
      } catch (error) {
        if (!ignore) {
          toast.error(error instanceof Error ? error.message : t('errors.productsLoadFailed'));
        }
      } finally {
        if (!ignore) {
          setProductsLoading(false);
        }
      }
    };

    void loadProducts();

    return () => {
      ignore = true;
    };
  }, [t]);

  if (!canAccess) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  const refreshPendingMovements = async () => {
    setPendingLoading(true);

    try {
      const response = await stockMovementService.getStockMovements({
        productCode: searchQuery || undefined,
        warehouseAction: actionFilter === 'all' ? undefined : actionFilter,
        isExecuted: false,
        page,
        limit: PAGE_SIZE,
      });

      setMovements(response.movements.filter((movement) => Boolean(movement.warehouseAction)));
      setTotal(response.total);
      setPages(response.pages || 1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('errors.pendingLoadFailed'));
    } finally {
      setPendingLoading(false);
    }
  };

  const refreshProducts = async () => {
    setProductsLoading(true);

    try {
      const data = await productService.getProductsWithStock();
      setProducts(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('errors.productsLoadFailed'));
    } finally {
      setProductsLoading(false);
    }
  };

  const refreshAll = async () => {
    await Promise.all([refreshPendingMovements(), refreshProducts()]);
  };

  const handleExecute = (movement: StockMovement) => {
    setSelectedMovement(movement);
    setExecuteDialogOpen(true);
  };

  const handleView = (movement: StockMovement) => {
    setSelectedMovement(movement);
    setDetailsOpen(true);
  };

  const handleExecuteSuccess = async () => {
    await refreshAll();
  };

  return (
    <div className="min-h-full overflow-x-hidden p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-sm text-muted-foreground">
            <ShieldCheck className="size-4" />
            <span>{t('badge')}</span>
          </div>
          <h1 className="mt-3 text-3xl font-semibold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => void refreshAll()}
        >
          <RefreshCw className="size-4" />
          {t('filters.refresh')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('filters.title')}</CardTitle>
          <CardDescription>{t('filters.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setPage(1);
                }}
                className="pl-10"
                placeholder={t('filters.searchPlaceholder')}
              />
            </div>

            <Select
              value={actionFilter}
              onValueChange={(value) => {
                setActionFilter(value as WarehouseAction | 'all');
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('filters.allActions')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.allActions')}</SelectItem>
                <SelectItem value="pick">{tStock('movements.warehouseActions.pick')}</SelectItem>
                <SelectItem value="receive">
                  {tStock('movements.warehouseActions.receive')}
                </SelectItem>
                <SelectItem value="transfer">
                  {tStock('movements.warehouseActions.transfer')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <div className="min-w-0">
          <PendingWarehouseExecutionsTable
            movements={movements}
            loading={pendingLoading}
            total={total}
            page={page}
            totalPages={pages}
            onRefresh={() => void refreshPendingMovements()}
            onPageChange={setPage}
            onView={handleView}
            onExecute={handleExecute}
          />
        </div>

        <div className="min-w-0">
          <WarehouseTransferPanel
            products={products}
            loading={productsLoading}
            onSuccess={refreshProducts}
          />
        </div>
      </div>

      <ExecuteStockMovementDialog
        movement={selectedMovement}
        open={executeDialogOpen}
        onOpenChange={setExecuteDialogOpen}
        onSuccess={handleExecuteSuccess}
      />

      <StockMovementDetailsDialog
        movement={selectedMovement}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </div>
  );
}
