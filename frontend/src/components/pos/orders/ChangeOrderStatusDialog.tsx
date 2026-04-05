import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Label } from '../../ui/label';
import { Loader2 } from 'lucide-react';
import type { Order } from '../../../services/orders';
import { orderService } from '../../../services/orders';
import { toast } from 'sonner';

interface ChangeOrderStatusDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ChangeOrderStatusDialog({
  order,
  open,
  onOpenChange,
  onSuccess,
}: ChangeOrderStatusDialogProps) {
  const { t } = useTranslation('pos');
  const [selectedStatus, setSelectedStatus] = useState<'finalized' | 'cancelled' | ''>('');
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async () => {
    if (!order || !selectedStatus) return;

    setLoading(true);
    try {
      await orderService.changeOrderStatus(order._id, { status: selectedStatus });
      const statusKey = selectedStatus === 'finalized' ? 'orderFinalized' : 'orderCancelled';
      toast.success(t(`toasts.${statusKey}`) || `Order ${selectedStatus} successfully`);
      onSuccess();
      setSelectedStatus('');
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || t('toasts.generalError'));
    } finally {
      setLoading(false);
    }
  };

  if (!order) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="overflow-hidden p-0 sm:max-w-[520px]">
        <DialogHeader className="border-b border-[--border-default] bg-[--bg-secondary] px-6 py-4">
          <DialogTitle>{t('changeOrderStatus')}</DialogTitle>
          <DialogDescription>
            {t('changeOrderStatusDescription')} #{order.orderNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 py-5">
          <div>
            <Label className="text-sm">{t('newStatus')}</Label>
            <Select
              value={selectedStatus}
              onValueChange={(value) => setSelectedStatus(value as 'finalized' | 'cancelled')}
            >
              <SelectTrigger className="mt-2 h-9 rounded-md border-[--border-default] bg-[--bg-secondary] text-sm shadow-sm focus:ring-2 focus:ring-[--primary-500]/30">
                <SelectValue placeholder={t('selectStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="finalized">{t('orderStatus.finalized')}</SelectItem>
                <SelectItem value="cancelled">{t('orderStatus.cancelled')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedStatus === 'finalized' && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-sm text-emerald-800">{t('finalizeOrderWarning')}</p>
            </div>
          )}

          {selectedStatus === 'cancelled' && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-800">{t('cancelOrderWarning')}</p>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-[--border-default] bg-[--bg-secondary] px-6 py-3">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setSelectedStatus('');
            }}
            disabled={loading}
          >
            {t('close')}
          </Button>
          <Button
            onClick={handleStatusChange}
            disabled={loading || !selectedStatus}
            className={
              selectedStatus === 'finalized'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-red-600 hover:bg-red-700'
            }
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {selectedStatus === 'finalized' ? t('finalize') : t('cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
