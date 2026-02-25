import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Product, FactoryLocation } from '../../services/products';
import { productService } from '../../services/products';
import { FACTORY_LOCATIONS_VALUES } from '../../services/enums/product.enums';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';

interface TransferStockDialogProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function TransferStockDialog({
  product,
  open,
  onClose,
  onSuccess,
}: TransferStockDialogProps) {
  const { t } = useTranslation('stock');
  const [fromLocation, setFromLocation] = useState<FactoryLocation | ''>('');
  const [toLocation, setToLocation] = useState<FactoryLocation | ''>('');
  const [quantity, setQuantity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableStock =
    product?.locations.find((loc) => loc.location === fromLocation)?.quantityInStock || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!product || !fromLocation || !toLocation || !quantity) {
      toast.error(t('transferStock.errors.fillAllFields'));
      return;
    }

    if (fromLocation === toLocation) {
      toast.error(t('transferStock.errors.sameLocation'));
      return;
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      toast.error(t('transferStock.errors.invalidQuantity'));
      return;
    }

    if (qty > availableStock) {
      toast.error(t('transferStock.errors.insufficientStock'));
      return;
    }

    setIsSubmitting(true);

    try {
      await productService.transferStock(product._id, {
        fromLocation,
        toLocation,
        quantity: qty,
      });

      toast.success(t('transferStock.success'));
      onSuccess();
      handleClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('transferStock.errors.failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFromLocation('');
    setToLocation('');
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
          <DialogTitle>{t('transferStock.title')}</DialogTitle>
          <DialogDescription>
            {t('transferStock.description', {
              productName: product?.name || '',
              productCode: product?.code || '',
            })}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="fromLocation">{t('transferStock.fromLocation')}</Label>
              <Select
                value={fromLocation}
                onValueChange={(value) => setFromLocation(value as FactoryLocation)}
              >
                <SelectTrigger id="fromLocation">
                  <SelectValue placeholder={t('transferStock.selectLocation')} />
                </SelectTrigger>
                <SelectContent>
                  {FACTORY_LOCATIONS_VALUES.map((loc) => {
                    const stock =
                      product?.locations.find((l) => l.location === loc)?.quantityInStock || 0;
                    return (
                      <SelectItem
                        key={loc}
                        value={loc}
                      >
                        {t(`locations.${loc}`)} ({stock})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {fromLocation && (
                <p className="text-sm text-muted-foreground">
                  {t('transferStock.available')}: {availableStock}
                </p>
              )}
            </div>

            <ArrowRight className="size-5 text-muted-foreground mb-2" />

            <div className="space-y-2">
              <Label htmlFor="toLocation">{t('transferStock.toLocation')}</Label>
              <Select
                value={toLocation}
                onValueChange={(value) => setToLocation(value as FactoryLocation)}
              >
                <SelectTrigger id="toLocation">
                  <SelectValue placeholder={t('transferStock.selectLocation')} />
                </SelectTrigger>
                <SelectContent>
                  {FACTORY_LOCATIONS_VALUES.map((loc) => (
                    <SelectItem
                      key={loc}
                      value={loc}
                      disabled={loc === fromLocation}
                    >
                      {t(`locations.${loc}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">{t('transferStock.quantity')}</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={availableStock}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={t('transferStock.quantityPlaceholder')}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
            >
              {t('transferStock.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? t('transferStock.submitting') : t('transferStock.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
