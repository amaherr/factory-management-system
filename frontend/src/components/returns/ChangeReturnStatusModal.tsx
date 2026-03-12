import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ReturnRecord } from '../../services/returns';
import { returnService } from '../../services/returns';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface ChangeReturnStatusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnRecord: ReturnRecord | null;
  onSuccess: () => void;
}

export function ChangeReturnStatusModal({
  open,
  onOpenChange,
  returnRecord,
  onSuccess,
}: ChangeReturnStatusModalProps) {
  const { t } = useTranslation('pos');
  const [statusValue, setStatusValue] = useState<'finalized' | 'cancelled' | ''>('');
  const [statusLoading, setStatusLoading] = useState(false);

  const handleStatusChange = async () => {
    if (!returnRecord || !statusValue) return;

    setStatusLoading(true);
    try {
      await returnService.changeReturnStatus(returnRecord._id, { status: statusValue });

      const toastKey = statusValue === 'finalized' ? 'finalizedSuccess' : 'cancelledSuccess';
      toast.success(t(`returns.toasts.${toastKey}`));
      onOpenChange(false);
      setStatusValue('');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || t('returns.toasts.generalError'));
    } finally {
      setStatusLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) setStatusValue('');
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('returns.statusDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('returns.statusDialog.description', {
              returnNumber: returnRecord?.returnNumber,
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Select
            value={statusValue}
            onValueChange={(value) => setStatusValue(value as 'finalized' | 'cancelled')}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('returns.statusDialog.selectStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="finalized">{t('returns.status.finalized')}</SelectItem>
              <SelectItem value="cancelled">{t('returns.status.cancelled')}</SelectItem>
            </SelectContent>
          </Select>

          {statusValue === 'finalized' && (
            <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-700">
              {t('returns.statusDialog.finalizeWarning')}
            </div>
          )}

          {statusValue === 'cancelled' && (
            <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-700">
              {t('returns.statusDialog.cancelWarning')}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            disabled={statusLoading}
            onClick={() => {
              onOpenChange(false);
              setStatusValue('');
            }}
          >
            {t('returns.common.close')}
          </Button>
          <Button
            disabled={statusLoading || !statusValue}
            onClick={handleStatusChange}
            className={
              statusValue === 'finalized'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-amber-600 hover:bg-amber-700'
            }
          >
            {statusLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('returns.statusDialog.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
