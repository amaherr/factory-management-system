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

  const isActive = product.status === PRODUCT_STATUS.ACTIVE;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('product_details')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Image */}
          <div>
            <h3 className="text-sm font-semibold mb-2">{t('product_image')}</h3>
            <ImageWithFallback
              src={getProductImageSrc(product.defaultImage)}
              alt={product.name}
              className="w-full h-64 object-cover rounded-lg"
            />
          </div>

          {/* Basic Information */}
          <div>
            <h3 className="text-sm font-semibold mb-3">{t('basic_info')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">{t('product_code')}</p>
                <p className="font-medium">{product.code}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">{t('name')}</p>
                <p className="font-medium">{product.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">{t('sku')}</p>
                <p className="font-medium">{product.sku}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">{t('status')}</p>
                <Badge variant={isActive ? 'default' : 'secondary'}>
                  {t(isActive ? 'active' : 'inactive')}
                </Badge>
              </div>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div>
              <h3 className="text-sm font-semibold mb-2">{t('description')}</h3>
              <p className="text-sm text-gray-700">{product.description}</p>
            </div>
          )}

          {/* Product Details */}
          <div>
            <h3 className="text-sm font-semibold mb-3">{t('product_details')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">{t('color')}</p>
                <p className="font-medium capitalize">{t(`color_${product.color}`)}</p>
              </div>
              {product.season && (
                <div>
                  <p className="text-xs text-gray-500">{t('season')}</p>
                  <p className="font-medium capitalize">{t(`season_${product.season}`)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div>
            <h3 className="text-sm font-semibold mb-3">{t('pricing')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {product.costPrice && (
                <div>
                  <p className="text-xs text-gray-500">{t('cost_price')}</p>
                  <p className="font-medium">
                    {new Intl.NumberFormat('en-EG', {
                      style: 'currency',
                      currency: 'EGP',
                    }).format(product.costPrice)}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500">{t('sale_price')}</p>
                <p className="font-medium">
                  {new Intl.NumberFormat('en-EG', {
                    style: 'currency',
                    currency: 'EGP',
                  }).format(product.salePrice)}
                </p>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="pt-4 border-t">
            <div className="text-xs text-gray-500 space-y-1">
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
