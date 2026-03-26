import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { getProductImageSrc } from '../../utils/imageUpload';
import type { Product } from '../../services/products';
import { PRODUCT_STATUS } from '../../services/enums/product.enums';

interface ProductDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
}

export function ProductDetailsDialog({ open, onOpenChange, product }: ProductDetailsDialogProps) {
  const { t } = useTranslation('products');

  if (!product) return null;

  const statusKey =
    product.status === PRODUCT_STATUS.ACTIVE
      ? 'active'
      : product.status === PRODUCT_STATUS.PENDING
        ? 'pending'
        : 'inactive';

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('product_details_title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid gap-4 rounded-lg border bg-muted/30 p-4 sm:grid-cols-[240px_minmax(0,1fr)]">
            <div className="overflow-hidden rounded-lg border bg-background">
              <ImageWithFallback
                src={getProductImageSrc(product.defaultImage)}
                alt={product.name}
                className="h-64 w-full object-cover"
              />
            </div>
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('product_profile')}
                </p>
                <h3 className="text-2xl font-semibold tracking-tight">{product.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{product.code}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">{t('sku')}</p>
                  <p className="font-medium">{product.sku}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('status')}</p>
                  <Badge
                    variant={product.status === PRODUCT_STATUS.ACTIVE ? 'default' : 'secondary'}
                  >
                    {t(statusKey)}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('color')}</p>
                  <p className="font-medium">{t(`color_${product.color}`)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('season')}</p>
                  <p className="font-medium">
                    {product.season ? t(`season_${product.season}`) : '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t('product_information')}
            </p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">{t('product_code')}</p>
                <p className="font-medium">{product.code}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('name')}</p>
                <p className="font-medium">{product.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('product_image')}</p>
                <p className="font-medium">
                  {product.defaultImage ? t('uploaded') : t('no_image')}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('status')}</p>
                <p className="font-medium">{t(statusKey)}</p>
              </div>
            </div>
          </div>

          {product.description && (
            <div className="rounded-lg border p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('description')}
              </p>
              <p className="text-sm leading-6 text-foreground/80">{product.description}</p>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('model_attributes')}
              </p>
              <div className="grid gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">{t('color')}</p>
                  <p className="font-medium">{t(`color_${product.color}`)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('season')}</p>
                  <p className="font-medium">
                    {product.season ? t(`season_${product.season}`) : '-'}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('pricing')}
              </p>
              <div className="grid gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">{t('cost_price')}</p>
                  <p className="font-medium">
                    {new Intl.NumberFormat('en-EG', {
                      style: 'currency',
                      currency: 'EGP',
                    }).format(product.costPrice)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('sale_price')}</p>
                  <p className="font-medium">
                    {new Intl.NumberFormat('en-EG', {
                      style: 'currency',
                      currency: 'EGP',
                    }).format(product.salePrice)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('line_cost_price')}</p>
                  <p className="font-medium">
                    {new Intl.NumberFormat('en-EG', {
                      style: 'currency',
                      currency: 'EGP',
                    }).format(product.lineCostPrice)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('line_sale_price')}</p>
                  <p className="font-medium">
                    {new Intl.NumberFormat('en-EG', {
                      style: 'currency',
                      currency: 'EGP',
                    }).format(product.lineSalePrice)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
            <div className="space-y-1">
              <p>
                {t('created_at')}: {new Date(product.createdAt).toLocaleString()}
              </p>
              <p>
                {t('updated_at')}: {new Date(product.updatedAt).toLocaleString()}
              </p>
              {product.activatedAt && (
                <p>
                  {t('activated_at')}: {new Date(product.activatedAt).toLocaleString()}
                </p>
              )}
              {product.deactivatedAt && (
                <p>
                  {t('deactivated_at')}: {new Date(product.deactivatedAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
