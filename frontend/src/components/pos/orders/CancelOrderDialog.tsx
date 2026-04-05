import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../ui/alert-dialog';
import { Loader2 } from 'lucide-react';
import type { Order } from '../../../services/orders';
import { orderService } from '../../../services/orders';
import { toast } from 'sonner';

interface CancelOrderDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CancelOrderDialog({
  order,
  open,
  onOpenChange,
  onSuccess,
}: CancelOrderDialogProps) {
  const { t } = useTranslation('pos');
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    if (!order) return;

    setLoading(true);
    try {
      await orderService.changeOrderStatus(order._id, {
        status: 'cancelled',
      });

      toast.success(t('toasts.orderCancelled', { orderNumber: order.orderNumber }));
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || t('toasts.generalError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('cancelOrderTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('cancelOrderDescription', { orderNumber: order?.orderNumber })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex gap-2 justify-end">
          <AlertDialogCancel disabled={loading}>{t('cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancel}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('processing')}
              </>
            ) : (
              t('confirmCancel')
            )}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
