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
import { AlertTriangle } from 'lucide-react';

interface SetStockDialogProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function SetStockDialog({ product, open, onClose, onSuccess }: SetStockDialogProps) {
  const { t } = useTranslation('stock');
  const [location, setLocation] = useState<FactoryLocation | ''>('');
  const [newQuantity, setNewQuantity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentStock =
    product?.locations.find((loc) => loc.location === location)?.quantityInStock || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!product || !location || newQuantity === '') {
      toast.error(t('setStock.errors.fillAllFields'));
      return;
    }

    const qty = parseInt(newQuantity, 10);
    if (isNaN(qty) || qty < 0) {
      toast.error(t('setStock.errors.invalidQuantity'));
      return;
    }

    setIsSubmitting(true);

    try {
      await productService.setStock(product._id, {
        location,
        newQuantity: qty,
      });

      toast.success(t('setStock.success'));
      onSuccess();
      handleClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('setStock.errors.failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setLocation('');
    setNewQuantity('');
    onClose();
  };

  const delta = newQuantity ? parseInt(newQuantity, 10) - currentStock : 0;

  return (
    <Dialog
      open={open}
      onOpenChange={handleClose}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('setStock.title')}</DialogTitle>
          <DialogDescription>
            {t('setStock.description', {
              productName: product?.name || '',
              productCode: product?.code || '',
            })}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
            <AlertTriangle className="size-5 text-yellow-600 shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800">{t('setStock.warning')}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">{t('setStock.location')}</Label>
            <Select
              value={location}
              onValueChange={(value) => setLocation(value as FactoryLocation)}
            >
              <SelectTrigger id="location">
                <SelectValue placeholder={t('setStock.selectLocation')} />
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
                      {t(`locations.${loc}`)} ({t('setStock.current')}: {stock})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {location && (
              <p className="text-sm text-muted-foreground">
                {t('setStock.currentStock')}: {currentStock}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="newQuantity">{t('setStock.newQuantity')}</Label>
            <Input
              id="newQuantity"
              type="number"
              min="0"
              value={newQuantity}
              onChange={(e) => setNewQuantity(e.target.value)}
              placeholder={t('setStock.quantityPlaceholder')}
            />
            {newQuantity && (
              <p
                className={`text-sm font-medium ${delta >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {delta >= 0 ? '+' : ''}
                {delta} {t('setStock.units')}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
            >
              {t('setStock.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? t('setStock.submitting') : t('setStock.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
