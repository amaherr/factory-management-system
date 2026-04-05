import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Product, FactoryLocation } from '../../../services/products';
import { productService } from '../../../services/products';
import { FACTORY_LOCATIONS_VALUES } from '../../../services/enums/product.enums';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { toast } from 'sonner';

interface AdjustStockDialogProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AdjustStockDialog({ product, open, onClose, onSuccess }: AdjustStockDialogProps) {
  const { t } = useTranslation('stock');
  const [location, setLocation] = useState<FactoryLocation | ''>('');
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract'>('add');
  const [quantity, setQuantity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!product || !location || !quantity) {
      toast.error(t('adjustStock.errors.fillAllFields'));
      return;
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      toast.error(t('adjustStock.errors.invalidQuantity'));
      return;
    }

    setIsSubmitting(true);

    try {
      await productService.adjustStock(product._id, {
        location,
        adjustmentType,
        quantity: qty,
      });

      toast.success(t('adjustStock.success'));
      onSuccess();
      handleClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('adjustStock.errors.failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setLocation('');
    setAdjustmentType('add');
    setQuantity('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleClose}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('adjustStock.title')}</DialogTitle>
          <DialogDescription>
            {t('adjustStock.description', {
              productName: product?.name || '',
              productCode: product?.code || '',
            })}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="location">{t('adjustStock.location')}</Label>
            <Select
              value={location}
              onValueChange={(value) => setLocation(value as FactoryLocation)}
            >
              <SelectTrigger id="location">
                <SelectValue placeholder={t('adjustStock.selectLocation')} />
              </SelectTrigger>
              <SelectContent>
                {FACTORY_LOCATIONS_VALUES.map((loc) => (
                  <SelectItem
                    key={loc}
                    value={loc}
                  >
                    {t(`locations.${loc}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adjustmentType">{t('adjustStock.adjustmentType')}</Label>
            <Select
              value={adjustmentType}
              onValueChange={(value) => setAdjustmentType(value as 'add' | 'subtract')}
            >
              <SelectTrigger id="adjustmentType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="add">{t('adjustStock.add')}</SelectItem>
                <SelectItem value="subtract">{t('adjustStock.subtract')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">{t('adjustStock.quantity')}</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={t('adjustStock.quantityPlaceholder')}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
            >
              {t('adjustStock.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? t('adjustStock.submitting') : t('adjustStock.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
