import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, PackagePlus, RefreshCw, Search, Settings2, X } from 'lucide-react';
import { toast } from 'sonner';

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '../../../ui/drawer';
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';
import { Badge } from '../../../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../ui/table';
import { productService, type LocationSectionProduct } from '../../../../services/products';
import { getProductImageSrc } from '../../../../utils/imageUpload';

const PAGE_SIZE = 12;

interface LocationProductsDrawerProps {
  open: boolean;
  locationName: string | null;
  sectionName?: string | null;
  onOpenChange: (open: boolean) => void;
  onViewProduct: (product: LocationSectionProduct) => void;
  onAdjustProduct: (product: LocationSectionProduct) => void;
  onSetStock: (product: LocationSectionProduct) => void;
}

function normalizeScopeValue(value?: string | null): string {
  return String(value || '')
    .trim()
    .toLowerCase();
}

export function LocationProductsDrawer({
  open,
  locationName,
  sectionName,
  onOpenChange,
  onViewProduct,
  onAdjustProduct,
  onSetStock,
}: LocationProductsDrawerProps) {
  const { t } = useTranslation('stock');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<LocationSectionProduct[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!open) {
      setPage(1);
      setQuery('');
      setDebouncedQuery('');
      setProducts([]);
      return;
    }

    void loadProducts();
  }, [open, page, debouncedQuery, locationName, sectionName]);

  const loadProducts = async () => {
    if (!locationName) return;

    setLoading(true);
    try {
      const params = {
        q: debouncedQuery || undefined,
        page,
        limit: PAGE_SIZE,
      };

      const data = sectionName
        ? await productService.getProductsByLocationSection(locationName, sectionName, params)
        : await productService.getProductsByLocation(locationName, params);

      setProducts(data.products as LocationSectionProduct[]);
      setTotal(data.total);
      setPages(Math.max(1, data.pages));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('locationManagement.errors.general'));
    } finally {
      setLoading(false);
    }
  };

  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  const drawerTitle = useMemo(() => {
    if (!locationName) return t('locationManagement.productsDrawer.title');

    if (sectionName) {
      return t('locationManagement.productsDrawer.sectionTitle', {
        location: locationName,
        section: sectionName,
      });
    }

    return t('locationManagement.productsDrawer.locationTitle', {
      location: locationName,
    });
  }, [locationName, sectionName, t]);

  const getScopedQuantity = (product: LocationSectionProduct): number => {
    const selectedQuantity = Number(product.selectedLocation?.quantityInStock ?? NaN);
    const selectedSection = normalizeScopeValue(product.selectedLocation?.section);
    const currentSection = normalizeScopeValue(sectionName);

    if (sectionName) {
      if (!Number.isNaN(selectedQuantity) && selectedSection === currentSection) {
        return selectedQuantity;
      }

      const scopedEntry = (product.locations || []).find(
        (entry) =>
          normalizeScopeValue(entry.location) === normalizeScopeValue(locationName) &&
          normalizeScopeValue(entry.section) === currentSection,
      );

      return Number(scopedEntry?.quantityInStock || 0);
    }

    if (!Number.isNaN(selectedQuantity)) {
      return selectedQuantity;
    }

    return Number(product.selectedLocationStock || 0);
  };

  const scopedTotalQuantity = useMemo(
    () => products.reduce((sum, product) => sum + getScopedQuantity(product), 0),
    [products, sectionName, locationName],
  );

  const totalPhysicalQuantity = useMemo(
    () => products.reduce((sum, product) => sum + Number(product.totalPhysicalStock || 0), 0),
    [products],
  );

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      direction="right"
    >
      <DrawerContent className="data-[vaul-drawer-direction=right]:w-[min(92vw,900px)] data-[vaul-drawer-direction=right]:sm:max-w-none">
        <DrawerHeader>
          <DrawerTitle>{drawerTitle}</DrawerTitle>
          <DrawerDescription>
            {t('locationManagement.productsDrawer.description')}
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex h-full min-h-0 flex-col gap-4 bg-[--bg-primary] p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-blue-200 bg-blue-100 text-blue-700">
              {t('locationManagement.productsDrawer.productsCount', { count: total })}
            </Badge>
            <Badge className="border-blue-200 bg-blue-100 text-blue-700">
              {t('locationManagement.productsDrawer.totalQuantity', {
                count: totalPhysicalQuantity,
              })}
            </Badge>
            <Badge className="border-blue-200 bg-blue-100 text-blue-700">
              {t('locationManagement.productsDrawer.scopedQuantity', {
                count: scopedTotalQuantity,
              })}
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                className="border-[--border-default] bg-[--bg-card] pl-9 pr-9 shadow-sm focus-visible:border-[--primary-500] focus-visible:ring-[--primary-500]/30"
                placeholder={t('locationManagement.productsDrawer.searchPlaceholder')}
              />
              {query ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 size-7 -translate-y-1/2 p-0"
                  onClick={() => {
                    setQuery('');
                    setPage(1);
                  }}
                >
                  <X className="size-4" />
                </Button>
              ) : null}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={loadProducts}
              disabled={loading}
            >
              <RefreshCw className="mr-2 size-4" />
              {t('actions.refresh')}
            </Button>
          </div>

          <div className="min-h-0 flex-1 overflow-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-[--primary-100]/55">
                  <TableHead>{t('table.product')}</TableHead>
                  <TableHead>{t('table.code')}</TableHead>
                  <TableHead>
                    {t('locationManagement.productsDrawer.totalQuantityColumn')}
                  </TableHead>
                  <TableHead>
                    {t('locationManagement.productsDrawer.scopedQuantityColumn')}
                  </TableHead>
                  <TableHead className="text-right">{t('table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-8 text-center text-muted-foreground"
                    >
                      {t('loading')}
                    </TableCell>
                  </TableRow>
                ) : products.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-8 text-center text-muted-foreground"
                    >
                      {t('locationManagement.productsDrawer.noProducts')}
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => (
                    <TableRow
                      key={product._id}
                      className="hover:bg-[--primary-100]/30"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
                            src={getProductImageSrc(product.defaultImage)}
                            alt={product.name}
                            className="size-10 rounded object-cover"
                          />
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {t(`colors.${product.color}`)}
                              {product.season ? `, ${t(`seasons.${product.season}`)}` : ''}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{product.code}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.totalPhysicalStock ?? 0}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{getScopedQuantity(product)}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewProduct(product)}
                            title={t('actions.view')}
                          >
                            <Eye className="size-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-blue-700 hover:bg-blue-50"
                            onClick={() => onAdjustProduct(product)}
                            title={t('actions.adjust')}
                          >
                            <PackagePlus className="mr-1.5 size-4" />
                            {t('actions.adjust')}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-emerald-700 hover:bg-emerald-50"
                            onClick={() => onSetStock(product)}
                            title={t('actions.setStock')}
                          >
                            <Settings2 className="mr-1.5 size-4" />
                            {t('actions.setStock')}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between border-t pt-3">
            <div className="text-sm text-muted-foreground">
              {t('pagination.showing', { from, to, total })}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={loading || page <= 1}
              >
                {t('pagination.previous')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.min(pages, prev + 1))}
                disabled={loading || page >= pages}
              >
                {t('pagination.next')}
              </Button>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
