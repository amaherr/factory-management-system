import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Product } from '../../services/products';
import { productService } from '../../services/products';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import { Switch } from '../../components/ui/switch';
import { Label } from '../../components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Search, PackagePlus, Settings2, RefreshCw, Eye, X, MapPinned } from 'lucide-react';
import { AdjustStockDialog } from '../../components/stock/AdjustStockDialog';
import { SetStockDialog } from '../../components/stock/SetStockDialog';
import { ProductStockDetailsDialog } from '../../components/stock/ProductStockDetailsDialog';
import { LocationStockOverviewDialog } from '../../components/stock/LocationStockOverviewDialog';
import { toast } from 'sonner';
import { getProductImageSrc } from '../../utils/imageUpload';

export function StockOverview() {
  const { t } = useTranslation('stock');
  const [searchQuery, setSearchQuery] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog states
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [setStockDialogOpen, setSetStockDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [locationOverviewOpen, setLocationOverviewOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const LOW_STOCK_THRESHOLD = 50;

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const data = await productService.getAllProducts();
      setProducts(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('errors.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toString().includes(searchQuery);

    const matchesLowStock = !lowStockOnly || product.totalPhysicalStock < LOW_STOCK_THRESHOLD;

    return matchesSearch && matchesLowStock;
  });

  const handleAdjustStock = (product: Product) => {
    setSelectedProduct(product);
    setAdjustDialogOpen(true);
  };

  const handleSetStock = (product: Product) => {
    setSelectedProduct(product);
    setSetStockDialogOpen(true);
  };

  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product);
    setDetailsDialogOpen(true);
  };

  const handleDialogSuccess = () => {
    loadProducts();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">{t('title')}</h1>
          <p className="text-gray-500">{t('description')}</p>
        </div>
        <Button
          variant="default"
          size="sm"
          className="h-11 rounded-md bg-[#1f4f86] px-5 text-white shadow-sm hover:bg-[#1b4678]"
          onClick={() => setLocationOverviewOpen(true)}
        >
          <MapPinned className="mr-2 size-4" />
          {t('actions.locationStock')}
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1.6fr)_auto_auto_auto] md:items-center">
            <div className="relative max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
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
                  aria-label={t('clearSearch')}
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>
            <div className="flex h-9 items-center gap-2 rounded-md border px-3">
              <Switch
                id="low-stock"
                checked={lowStockOnly}
                onCheckedChange={setLowStockOnly}
              />
              <Label
                htmlFor="low-stock"
                className="text-sm"
              >
                {t('filters.lowStockOnly')}
              </Label>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 p-0"
              onClick={loadProducts}
              title={t('actions.refresh')}
              aria-label={t('actions.refresh')}
            >
              <RefreshCw className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            {t('loading')}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('table.product')}</TableHead>
                  <TableHead>{t('table.code')}</TableHead>
                  <TableHead>{t('table.sku')}</TableHead>
                  <TableHead>{t('table.totalPhysical')}</TableHead>
                  <TableHead>{t('table.totalTheoretical')}</TableHead>
                  <TableHead>{t('table.totalReserved')}</TableHead>
                  <TableHead>{t('table.totalSold')}</TableHead>
                  <TableHead>{t('table.status')}</TableHead>
                  <TableHead className="text-right">{t('table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center py-12 text-muted-foreground"
                    >
                      {t('noResults')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
                            src={getProductImageSrc(product.defaultImage)}
                            alt={product.name}
                            className="size-10 rounded object-cover"
                          />
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-gray-500">
                              {t(`colors.${product.color}`)}
                              {product.season && `, ${t(`seasons.${product.season}`)}`}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{product.code}</TableCell>
                      <TableCell>{product.sku}</TableCell>
                      <TableCell className="font-medium">{product.totalPhysicalStock}</TableCell>
                      <TableCell className="font-medium">{product.totalTheoreticalStock}</TableCell>
                      <TableCell>{product.totalReserved}</TableCell>
                      <TableCell>{product.totalSold}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            product.status === 'active'
                              ? 'default'
                              : product.status === 'pending'
                                ? 'secondary'
                                : 'outline'
                          }
                        >
                          {t(`statuses.${product.status}`)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-black hover:bg-black/10"
                            onClick={() => handleViewDetails(product)}
                            title={t('actions.view')}
                          >
                            <Eye className="size-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-blue-700 hover:bg-blue-50"
                            onClick={() => handleAdjustStock(product)}
                            title={t('actions.adjust')}
                          >
                            <PackagePlus className="size-4 mr-1.5" />
                            {t('actions.adjust')}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-emerald-700 hover:bg-emerald-50"
                            onClick={() => handleSetStock(product)}
                            title={t('actions.setStock')}
                          >
                            <Settings2 className="size-4 mr-1.5" />
                            {t('actions.setStock')}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <ProductStockDetailsDialog
        product={selectedProduct}
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
      />
      <AdjustStockDialog
        product={selectedProduct}
        open={adjustDialogOpen}
        onClose={() => setAdjustDialogOpen(false)}
        onSuccess={handleDialogSuccess}
      />
      <SetStockDialog
        product={selectedProduct}
        open={setStockDialogOpen}
        onClose={() => setSetStockDialogOpen(false)}
        onSuccess={handleDialogSuccess}
      />
      <LocationStockOverviewDialog
        open={locationOverviewOpen}
        onOpenChange={setLocationOverviewOpen}
        products={products}
      />
    </div>
  );
}
