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
} from '../ui/alert-dialog';
import { Loader2 } from 'lucide-react';
import type { Order } from '../../services/orders';
import { orderService } from '../../services/orders';
import { toast } from 'sonner';

interface DeleteOrderDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DeleteOrderDialog({
  order,
  open,
  onOpenChange,
  onSuccess,
}: DeleteOrderDialogProps) {
  const { t } = useTranslation('pos');
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!order) return;

    setLoading(true);
    try {
      await orderService.deleteOrder(order._id);

      toast.success(t('toasts.orderDeleted', { orderNumber: order.orderNumber }));
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
          <AlertDialogTitle>{t('deleteOrderTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('deleteOrderDescription', { orderNumber: order?.orderNumber })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex gap-2 justify-end">
          <AlertDialogCancel disabled={loading}>{t('cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive hover:bg-destructive/90"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('processing')}
              </>
            ) : (
              t('delete')
            )}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
