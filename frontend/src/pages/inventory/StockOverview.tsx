import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Product, FactoryLocation } from '../../services/products';
import { productService } from '../../services/products';
import { FACTORY_LOCATIONS_VALUES } from '../../services/enums/product.enums';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Search,
  AlertTriangle,
  PackagePlus,
  ArrowLeftRight,
  Settings2,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { AdjustStockDialog } from '../../components/stock/AdjustStockDialog';
import { TransferStockDialog } from '../../components/stock/TransferStockDialog';
import { SetStockDialog } from '../../components/stock/SetStockDialog';
import { ProductStockDetailsDialog } from '../../components/stock/ProductStockDetailsDialog';
import { toast } from 'sonner';
import { getProductImageSrc } from '../../utils/imageUpload';

interface StockItem {
  product: Product;
  location: string;
  quantityInStock: number;
}

export function StockOverview() {
  const { t } = useTranslation('stock');
  const [searchQuery, setSearchQuery] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [locationFilter, setLocationFilter] = useState<FactoryLocation | 'all'>('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog states
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [setStockDialogOpen, setSetStockDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
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

  // Transform products into stock items (one row per product-location pair)
  // If a product has no locations, show it once with empty location data
  const stockItems: StockItem[] = products.flatMap((product) => {
    if (product.locations.length === 0) {
      // Product has no locations defined yet, show it once
      return [
        {
          product,
          location: '',
          quantityInStock: 0,
        },
      ];
    }
    return product.locations.map((loc) => ({
      product,
      location: loc.location,
      quantityInStock: loc.quantityInStock,
    }));
  });

  const filteredStockItems = stockItems.filter((item) => {
    const matchesSearch =
      item.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.product.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.product.sku.toString().includes(searchQuery);

    const matchesLowStock = !lowStockOnly || item.quantityInStock < LOW_STOCK_THRESHOLD;

    // If locationFilter is 'all', show everything including items with no location
    // If locationFilter is specific, only show items with that location
    const matchesLocation = locationFilter === 'all' || item.location === locationFilter;

    return matchesSearch && matchesLowStock && matchesLocation;
  });

  const handleAdjustStock = (product: Product) => {
    setSelectedProduct(product);
    setAdjustDialogOpen(true);
  };

  const handleTransferStock = (product: Product) => {
    setSelectedProduct(product);
    setTransferDialogOpen(true);
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
      <div>
        <h1 className="text-3xl font-semibold">{t('title')}</h1>
        <p className="text-gray-500">{t('description')}</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <Input
                placeholder={t('searchPlaceholder')}
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-4">
              <Select
                value={locationFilter}
                onValueChange={(value) => setLocationFilter(value as FactoryLocation | 'all')}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('filters.allLocations')}</SelectItem>
                  {FACTORY_LOCATIONS_VALUES.map((loc) => (
                    <SelectItem
                      key={loc}
                      value={loc}
                    >
                      {t(`locations.${loc}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Switch
                  id="low-stock"
                  checked={lowStockOnly}
                  onCheckedChange={setLowStockOnly}
                />
                <Label htmlFor="low-stock">{t('filters.lowStockOnly')}</Label>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadProducts}
              >
                <RefreshCw className="size-4" />
              </Button>
            </div>
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
                  <TableHead>{t('table.location')}</TableHead>
                  <TableHead>{t('table.stockLevel')}</TableHead>
                  <TableHead>{t('table.totalPhysical')}</TableHead>
                  <TableHead>{t('table.totalTheoretical')}</TableHead>
                  <TableHead>{t('table.totalReserved')}</TableHead>
                  <TableHead>{t('table.totalSold')}</TableHead>
                  <TableHead>{t('table.status')}</TableHead>
                  <TableHead className="text-right">{t('table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStockItems.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={11}
                      className="text-center py-12 text-muted-foreground"
                    >
                      {t('noResults')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStockItems.map((item, index) => (
                    <TableRow key={`${item.product._id}-${item.location}-${index}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
                            src={getProductImageSrc(item.product.defaultImage)}
                            alt={item.product.name}
                            className="size-10 rounded object-cover"
                          />
                          <div>
                            <p className="font-medium">{item.product.name}</p>
                            <p className="text-sm text-gray-500">
                              {t(`colors.${item.product.color}`)}
                              {item.product.season && `, ${t(`seasons.${item.product.season}`)}`}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{item.product.code}</TableCell>
                      <TableCell>{item.product.sku}</TableCell>
                      <TableCell>
                        {item.location ? (
                          <Badge variant="outline">{t(`locations.${item.location}`)}</Badge>
                        ) : (
                          <Badge variant="secondary">{t('noLocation')}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.quantityInStock < LOW_STOCK_THRESHOLD ? (
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="size-4 text-orange-500" />
                            <Badge variant="destructive">{item.quantityInStock}</Badge>
                          </div>
                        ) : (
                          <span className="font-medium">{item.quantityInStock}</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.product.totalPhysicalStock}
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.product.totalTheoreticalStock}
                      </TableCell>
                      <TableCell>{item.product.totalReserved}</TableCell>
                      <TableCell>{item.product.totalSold}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.product.status === 'active'
                              ? 'default'
                              : item.product.status === 'pending'
                                ? 'secondary'
                                : 'outline'
                          }
                        >
                          {t(`statuses.${item.product.status}`)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(item.product)}
                            title={t('actions.view')}
                          >
                            <Eye className="size-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAdjustStock(item.product)}
                            title={t('actions.adjust')}
                          >
                            <PackagePlus className="size-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTransferStock(item.product)}
                            title={t('actions.transfer')}
                          >
                            <ArrowLeftRight className="size-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetStock(item.product)}
                            title={t('actions.setStock')}
                          >
                            <Settings2 className="size-4" />
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
      <TransferStockDialog
        product={selectedProduct}
        open={transferDialogOpen}
        onClose={() => setTransferDialogOpen(false)}
        onSuccess={handleDialogSuccess}
      />
      <SetStockDialog
        product={selectedProduct}
        open={setStockDialogOpen}
        onClose={() => setSetStockDialogOpen(false)}
        onSuccess={handleDialogSuccess}
      />
    </div>
  );
}
