import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { batchService } from '../../services/batches';
import { toast } from 'sonner';

interface FinalizeProductionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchId: string;
  batchNumber: number;
  plannedQuantity: number;
  onSuccess: () => void;
}

export function FinalizeProductionDialog({
  open,
  onOpenChange,
  batchId,
  batchNumber,
  plannedQuantity,
  onSuccess,
}: FinalizeProductionDialogProps) {
  const { t } = useTranslation('batches');
  const [loading, setLoading] = useState(false);
  const [producedQuantity, setProducedQuantity] = useState(plannedQuantity);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const loss = plannedQuantity - producedQuantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (producedQuantity < 0) {
      toast.error(t('finalizeProduction.errors.invalidQuantity'));
      return;
    }

    try {
      setLoading(true);

      await batchService.finalizeProduction(batchId, {
        producedQuantity,
        endDate,
      });

      toast.success(t('finalizeProduction.success'));
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
          <DialogTitle>{t('finalizeProduction.title')}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-600">
          {t('finalizeProduction.description', { batchNumber })}
        </p>
        <form
          onSubmit={handleSubmit}
          className="space-y-4 pt-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('finalizeProduction.plannedQuantity')}</Label>
              <Input
                type="number"
                value={plannedQuantity}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label>{t('finalizeProduction.expectedLoss')}</Label>
              <Input
                type="number"
                value={loss}
                disabled
                className={loss > 0 ? 'text-red-600 font-semibold' : ''}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="producedQuantity">{t('finalizeProduction.producedQuantity')}</Label>
            <Input
              id="producedQuantity"
              type="number"
              min="0"
              value={producedQuantity}
              onChange={(e) => setProducedQuantity(parseInt(e.target.value) || 0)}
              placeholder={t('finalizeProduction.producedQuantityPlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">{t('finalizeProduction.endDate')}</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t('finalizeProduction.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? t('finalizeProduction.submitting') : t('finalizeProduction.confirm')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
