import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Product } from '../../../services/products';
import { productService } from '../../../services/products';
import { locationService, type Location } from '../../../services/locations';
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
  const [availableLocations, setAvailableLocations] = useState<Location[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [location, setLocation] = useState('');
  const [section, setSection] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract'>('add');
  const [quantity, setQuantity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedLocation = useMemo(
    () => availableLocations.find((item) => item.name === location) || null,
    [availableLocations, location],
  );

  const activeLocations = useMemo(
    () => availableLocations.filter((item) => item.isActive !== false),
    [availableLocations],
  );

  const activeSections = useMemo(
    () => (selectedLocation?.sections || []).filter((item) => item.isActive !== false),
    [selectedLocation],
  );

  const currentStock = useMemo(
    () =>
      product?.locations.find(
        (entry) => entry.location === location && (entry.section || 'UNSPECIFIED') === section,
      )?.quantityInStock || 0,
    [product, location, section],
  );

  useEffect(() => {
    if (!open) return;

    const loadLocations = async () => {
      setLoadingLocations(true);
      try {
        const locations = await locationService.getLocations();
        setAvailableLocations(locations);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : t('adjustStock.errors.loadLocationsFailed'),
        );
      } finally {
        setLoadingLocations(false);
      }
    };

    void loadLocations();
  }, [open, t]);

  useEffect(() => {
    if (!section) return;

    if (!activeSections.some((item) => item.name === section)) {
      setSection('');
    }
  }, [activeSections, section]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!product || !location || !section || !quantity) {
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
        section,
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
    setSection('');
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
              onValueChange={(value) => {
                setLocation(value);
                setSection('');
              }}
              disabled={loadingLocations || activeLocations.length === 0}
            >
              <SelectTrigger id="location">
                <SelectValue
                  placeholder={
                    loadingLocations
                      ? t('adjustStock.loadingLocations')
                      : t('adjustStock.selectLocation')
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {activeLocations.map((loc) => (
                  <SelectItem
                    key={loc._id}
                    value={loc.name}
                  >
                    {loc.name}
                    {loc.code ? ` (${loc.code})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!loadingLocations && activeLocations.length === 0 && (
              <p className="text-sm text-muted-foreground">{t('adjustStock.noLocations')}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="section">{t('adjustStock.section')}</Label>
            <Select
              value={section}
              onValueChange={setSection}
              disabled={!selectedLocation || activeSections.length === 0}
            >
              <SelectTrigger id="section">
                <SelectValue
                  placeholder={
                    !selectedLocation
                      ? t('adjustStock.selectLocationFirst')
                      : activeSections.length === 0
                        ? t('adjustStock.noSections')
                        : t('adjustStock.selectSection')
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {activeSections.map((item) => (
                  <SelectItem
                    key={item._id}
                    value={item.name}
                  >
                    {item.name}
                    {item.code ? ` (${item.code})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedLocation && activeSections.length === 0 && (
              <p className="text-sm text-muted-foreground">{t('adjustStock.noSections')}</p>
            )}
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
