import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { batchService } from '../../services/batches';
import { toast } from 'sonner';

interface FinalizePlanningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchId: string;
  batchNumber: number;
  onSuccess: () => void;
}

export function FinalizePlanningDialog({
  open,
  onOpenChange,
  batchId,
  batchNumber,
  onSuccess,
}: FinalizePlanningDialogProps) {
  const { t } = useTranslation('batches');
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await batchService.finalizePlanning(batchId, { startDate });
      toast.success(t('finalizePlanning.success'));
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('errors.finalizeFailed'));
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
          <DialogTitle>{t('finalizePlanning.title')}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-600">
          {t('finalizePlanning.description', { batchNumber })}
        </p>
        <form
          onSubmit={handleSubmit}
          className="space-y-4 pt-4"
        >
          <div className="space-y-2">
            <Label htmlFor="startDate">{t('finalizePlanning.startDate')}</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t('finalizePlanning.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? t('finalizePlanning.submitting') : t('finalizePlanning.confirm')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
