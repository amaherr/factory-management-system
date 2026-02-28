import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { batchService } from '../../services/batches';
import { toast } from 'sonner';

interface DeleteBatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchId: string;
  batchNumber: number;
  onSuccess: () => void;
}

export function DeleteBatchDialog({
  open,
  onOpenChange,
  batchId,
  batchNumber,
  onSuccess,
}: DeleteBatchDialogProps) {
  const { t } = useTranslation('batches');
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setLoading(true);
      await batchService.deleteBatch(batchId);
      toast.success(t('delete.success'));
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('errors.deleteFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('delete.title')}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-600">{t('delete.description', { batchNumber })}</p>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t('delete.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? t('delete.deleting') : t('delete.confirm')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
