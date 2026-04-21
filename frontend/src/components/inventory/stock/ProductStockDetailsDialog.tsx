import { useTranslation } from 'react-i18next';
import type { Product } from '../../../services/products';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';
import { Badge } from '../../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { getProductImageSrc } from '../../../utils/imageUpload';

interface ProductStockDetailsDialogProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
}

export function ProductStockDetailsDialog({
  product,
  open,
  onClose,
}: ProductStockDetailsDialogProps) {
  const { t } = useTranslation(['stock', 'products']);

  if (!product) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={onClose}
    >
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('productDetails.title')}</DialogTitle>
          <DialogDescription>{product.code}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('productDetails.productInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <img
                    src={getProductImageSrc(product.defaultImage)}
                    alt={product.name}
                    className="size-24 rounded object-cover"
                  />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('productDetails.name')}</p>
                    <p className="font-semibold">{product.name}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">{t('productDetails.code')}</p>
                      <p className="font-mono">{product.code}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">SKU</p>
                      <p className="font-mono">{product.sku}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('productDetails.color')}</p>
                      <p>{t(`stock:colors.${product.color}`)}</p>
                    </div>
                    {product.season && (
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {t('productDetails.season')}
                        </p>
                        <p>{t(`stock:seasons.${product.season}`)}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">{t('productDetails.status')}</p>
                      <Badge
                        variant={
                          product.status === 'active'
                            ? 'default'
                            : product.status === 'pending'
                              ? 'secondary'
                              : 'outline'
                        }
                      >
                        {t(`stock:statuses.${product.status}`)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {product.description && (
                <div>
                  <p className="text-sm text-muted-foreground">{t('productDetails.description')}</p>
                  <p className="text-sm">{product.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pricing Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('productDetails.pricing')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {product.unitCostPrice && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t('productDetails.unitCostPrice')}
                    </p>
                    <p className="text-lg font-semibold">{product.unitCostPrice.toFixed(2)}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t('productDetails.unitSalePrice')}
                  </p>
                  <p className="text-lg font-semibold">{product.unitSalePrice.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stock Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('productDetails.stockSummary')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t('productDetails.totalPhysical')}
                  </p>
                  <p className="text-2xl font-bold">{product.totalPhysicalStock}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t('productDetails.totalTheoretical')}
                  </p>
                  <p className="text-2xl font-bold">{product.totalTheoreticalStock}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t('productDetails.totalReserved')}
                  </p>
                  <p className="text-2xl font-bold text-orange-600">{product.totalReserved}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('productDetails.totalSold')}</p>
                  <p className="text-2xl font-bold text-blue-600">{product.totalSold}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stock by Location */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('productDetails.stockByLocation')}</CardTitle>
            </CardHeader>
            <CardContent>
              {product.locations.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('productDetails.noLocations')}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('productDetails.locationSection')}</TableHead>
                      <TableHead className="text-right">{t('productDetails.quantity')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {product.locations.map((loc) => (
                      <TableRow key={`${loc.location}-${loc.section || 'UNSPECIFIED'}`}>
                        <TableCell>
                          <Badge variant="outline">
                            {t(`stock:locations.${loc.location}`, { defaultValue: loc.location })}
                            {' / '}
                            {loc.section || t('productDetails.noSection')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {loc.quantityInStock}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
