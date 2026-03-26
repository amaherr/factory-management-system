import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ReturnRecord } from '../../services/returns';
import { returnService } from '../../services/returns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';

interface DeleteReturnModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnRecord: ReturnRecord | null;
  onSuccess: () => void;
}

export function DeleteReturnModal({
  open,
  onOpenChange,
  returnRecord,
  onSuccess,
}: DeleteReturnModalProps) {
  const { t } = useTranslation('pos');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const formatReturnNumber = (returnNumber: number | string) =>
    `${t('returns.numberPrefix')} - ${returnNumber}`;

  const handleDelete = async () => {
    if (!returnRecord) return;

    setDeleteLoading(true);
    try {
      await returnService.deleteReturn(returnRecord._id);
      toast.success(
        t('returns.toasts.deletedSuccess', {
          returnNumber: formatReturnNumber(returnRecord.returnNumber),
        }),
      );
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || t('returns.toasts.generalError'));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <AlertDialogContent className="overflow-hidden p-0">
        <AlertDialogHeader className="border-b border-[--border-default] bg-[--bg-secondary] px-6 py-4">
          <AlertDialogTitle>{t('returns.deleteDialog.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('returns.deleteDialog.description', {
              returnNumber: returnRecord ? formatReturnNumber(returnRecord.returnNumber) : '-',
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex justify-end gap-2 border-t border-[--border-default] bg-[--bg-secondary] px-6 py-3">
          <AlertDialogCancel disabled={deleteLoading}>
            {t('returns.common.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={deleteLoading}
            onClick={handleDelete}
            className="bg-destructive hover:bg-destructive/90"
          >
            {deleteLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('returns.common.processing')}
              </>
            ) : (
              t('returns.common.delete')
            )}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
