import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Badge } from '../../ui/badge';
import type { Product } from '../../../services/products';
import { FACTORY_LOCATIONS_VALUES } from '../../../services/enums/product.enums';

interface LocationStockOverviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
}

export function LocationStockOverviewDialog({
  open,
  onOpenChange,
  products,
}: LocationStockOverviewDialogProps) {
  const { t } = useTranslation('stock');

  const locationSummary = useMemo(() => {
    return FACTORY_LOCATIONS_VALUES.map((location) => {
      const quantities = products
        .map(
          (product) =>
            product.locations.find((loc) => loc.location === location)?.quantityInStock || 0,
        )
        .filter((qty) => qty > 0);

      const totalQuantity = quantities.reduce((sum, qty) => sum + qty, 0);
      return {
        location,
        totalQuantity,
        productsCount: quantities.length,
      };
    });
  }, [products]);

  const productsByLocation = useMemo(() => {
    return FACTORY_LOCATIONS_VALUES.map((location) => {
      const items = products
        .map((product) => {
          const locationStock =
            product.locations.find((loc) => loc.location === location)?.quantityInStock || 0;

          if (locationStock <= 0) {
            return null;
          }

          return {
            product,
            quantityInStock: locationStock,
          };
        })
        .filter((item): item is { product: Product; quantityInStock: number } => item !== null)
        .sort((a, b) => b.quantityInStock - a.quantityInStock);

      return { location, items };
    });
  }, [products]);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('locationOverview.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="rounded-lg border p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t('locationOverview.summaryTitle')}
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('table.location')}</TableHead>
                  <TableHead>{t('locationOverview.productsCount')}</TableHead>
                  <TableHead>{t('locationOverview.totalStock')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locationSummary.map((item) => (
                  <TableRow key={item.location}>
                    <TableCell>
                      <Badge variant="outline">{t(`locations.${item.location}`)}</Badge>
                    </TableCell>
                    <TableCell>{item.productsCount}</TableCell>
                    <TableCell className="font-medium">{item.totalQuantity}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="rounded-lg border p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t('locationOverview.perProductTitle')}
            </p>
            <div className="space-y-4">
              {productsByLocation.map(({ location, items }) => (
                <div
                  key={location}
                  className="rounded-md border"
                >
                  <div className="flex items-center justify-between border-b bg-muted/30 px-3 py-2">
                    <Badge variant="outline">{t(`locations.${location}`)}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {t('locationOverview.productsCount')}: {items.length}
                    </span>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('table.product')}</TableHead>
                        <TableHead>{t('table.code')}</TableHead>
                        <TableHead>{t('table.sku')}</TableHead>
                        <TableHead>{t('table.stockLevel')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="py-6 text-center text-muted-foreground"
                          >
                            {t('locationOverview.noProductsInLocation')}
                          </TableCell>
                        </TableRow>
                      ) : (
                        items.map(({ product, quantityInStock }) => (
                          <TableRow key={`${location}-${product._id}`}>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell className="font-mono text-sm">{product.code}</TableCell>
                            <TableCell>{product.sku}</TableCell>
                            <TableCell className="font-medium">{quantityInStock}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
