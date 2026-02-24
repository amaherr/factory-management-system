import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { productService } from '../../services/products';
import type { Product } from '../../services/products';
import { PRODUCT_STATUS } from '../../services/enums/product.enums';

interface ChangeProductStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  newStatus: 'active' | 'deactive' | null;
  onSuccess?: (product: Product) => void;
}

export function ChangeProductStatusDialog({
  open,
  onOpenChange,
  product,
  newStatus,
  onSuccess,
}: ChangeProductStatusDialogProps) {
  const { t } = useTranslation('products');
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async () => {
    if (!product || !newStatus) return;

    setLoading(true);

    try {
      const updatedProduct = await productService.changeProductActivation(product._id, {
        status: newStatus,
      });
      toast.success(
        newStatus === PRODUCT_STATUS.ACTIVE
          ? t('product_activated_success')
          : t('product_deactivated_success'),
      );
      onOpenChange(false);
      onSuccess?.(updatedProduct);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('status_change_error'));
    } finally {
      setLoading(false);
    }
  };

  const statusLabel = newStatus === PRODUCT_STATUS.ACTIVE ? t('active') : t('inactive');

  return (
    <AlertDialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('change_product_status_title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('change_product_status_confirmation', {
              productName: product?.name || '',
              status: statusLabel,
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{t('cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleStatusChange}
            disabled={loading}
          >
            {loading ? t('updating') : t('confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
