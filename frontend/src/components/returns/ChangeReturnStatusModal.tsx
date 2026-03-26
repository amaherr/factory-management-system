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
import { Label } from '../ui/label';

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
  const formatReturnNumber = (returnNumber: number | string) =>
    `${t('returns.numberPrefix')} - ${returnNumber}`;

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
      <DialogContent className="overflow-hidden p-0 sm:max-w-[520px]">
        <DialogHeader className="border-b border-[--border-default] bg-[--bg-secondary] px-6 py-4">
          <DialogTitle>{t('returns.statusDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('returns.statusDialog.description', {
              returnNumber: returnRecord ? formatReturnNumber(returnRecord.returnNumber) : '-',
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 py-5">
          <div className="space-y-2">
            <Label className="text-sm">{t('returns.statusDialog.selectStatus')}</Label>
            <Select
              value={statusValue}
              onValueChange={(value) => setStatusValue(value as 'finalized' | 'cancelled')}
            >
              <SelectTrigger className="h-9 rounded-md border-[--border-default] bg-[--bg-secondary] text-sm shadow-sm focus:ring-2 focus:ring-[--primary-500]/30">
                <SelectValue placeholder={t('returns.statusDialog.selectStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="finalized">{t('returns.status.finalized')}</SelectItem>
                <SelectItem value="cancelled">{t('returns.status.cancelled')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {statusValue === 'finalized' && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              {t('returns.statusDialog.finalizeWarning')}
            </div>
          )}

          {statusValue === 'cancelled' && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {t('returns.statusDialog.cancelWarning')}
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-[--border-default] bg-[--bg-secondary] px-6 py-3">
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
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-red-600 hover:bg-red-700'
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
