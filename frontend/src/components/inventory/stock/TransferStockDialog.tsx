import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Product } from '../../../services/products';
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
  const [fromLocation, setFromLocation] = useState('');
  const [fromSection, setFromSection] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [toSection, setToSection] = useState('');
  const [quantity, setQuantity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);

  useEffect(() => {
    let ignore = false;

    const loadLocations = async () => {
      setLoadingLocations(true);

      try {
        const data = await locationService.getLocations();
        if (!ignore) {
          setLocations(data);
        }
      } catch (error) {
        if (!ignore) {
          toast.error(
            error instanceof Error ? error.message : t('transferStock.errors.loadLocationsFailed'),
          );
        }
      } finally {
        if (!ignore) {
          setLoadingLocations(false);
        }
      }
    };

    void loadLocations();

    return () => {
      ignore = true;
    };
  }, [t]);

  const activeLocations = useMemo(
    () => locations.filter((location) => location.isActive),
    [locations],
  );

  const sourceSections = useMemo(() => {
    return (product?.locations || [])
      .filter(
        (locationEntry) =>
          locationEntry.location === fromLocation && locationEntry.quantityInStock > 0,
      )
      .map((entry) => ({
        section: entry.section?.trim() || 'UNSPECIFIED',
        quantity: entry.quantityInStock,
      }));
  }, [fromLocation, product]);

  const destinationLocation = useMemo(
    () => activeLocations.find((location) => location.name === toLocation) || null,
    [activeLocations, toLocation],
  );

  const destinationSections = useMemo(() => {
    if (!destinationLocation) {
      return [];
    }

    return [
      { name: 'UNSPECIFIED', code: 'UNSPECIFIED', isActive: true },
      ...destinationLocation.sections.filter((section) => section.isActive),
    ];
  }, [destinationLocation]);

  const availableStock =
    product?.locations.find(
      (loc) =>
        loc.location === fromLocation && (loc.section?.trim() || 'UNSPECIFIED') === fromSection,
    )?.quantityInStock || 0;

  const resetForm = () => {
    setFromLocation('');
    setFromSection('');
    setToLocation('');
    setToSection('');
    setQuantity('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!product || !fromLocation || !fromSection || !toLocation || !toSection || !quantity) {
      toast.error(t('transferStock.errors.fillAllFields'));
      return;
    }

    if (fromLocation === toLocation && fromSection === toSection) {
      toast.error(t('transferStock.errors.samePair'));
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
      await locationService.transferStock({
        productId: product._id,
        fromLocation,
        fromSection,
        toLocation,
        toSection,
        quantity: qty,
      });

      toast.success(t('transferStock.success'));
      onSuccess();
      resetForm();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('transferStock.errors.failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
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
          <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-end">
            <div className="space-y-2">
              <Label htmlFor="fromLocation">{t('transferStock.fromLocation')}</Label>
              <Select
                value={fromLocation}
                onValueChange={(value) => {
                  setFromLocation(value);
                  setFromSection('');
                }}
                disabled={loadingLocations}
              >
                <SelectTrigger id="fromLocation">
                  <SelectValue placeholder={t('transferStock.selectLocation')} />
                </SelectTrigger>
                <SelectContent>
                  {product
                    ? Array.from(
                        new Set(
                          product.locations
                            .filter((location) => location.quantityInStock > 0)
                            .map((location) => location.location),
                        ),
                      ).map((location) => (
                        <SelectItem
                          key={location}
                          value={location}
                        >
                          {t(`locations.${location}`) || location}
                        </SelectItem>
                      ))
                    : null}
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
              <Label htmlFor="fromSection">{t('transferStock.section')}</Label>
              <Select
                value={fromSection}
                onValueChange={setFromSection}
                disabled={!fromLocation || loadingLocations}
              >
                <SelectTrigger id="fromSection">
                  <SelectValue placeholder={t('transferStock.selectSection')} />
                </SelectTrigger>
                <SelectContent>
                  {sourceSections.map((entry) => (
                    <SelectItem
                      key={entry.section}
                      value={entry.section}
                    >
                      {entry.section} ({entry.quantity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ArrowRight className="hidden md:block size-5 text-muted-foreground mb-2" />

            <div className="space-y-2">
              <Label htmlFor="toLocation">{t('transferStock.toLocation')}</Label>
              <Select
                value={toLocation}
                onValueChange={(value) => {
                  setToLocation(value);
                  setToSection('');
                }}
                disabled={loadingLocations}
              >
                <SelectTrigger id="toLocation">
                  <SelectValue placeholder={t('transferStock.selectLocation')} />
                </SelectTrigger>
                <SelectContent>
                  {activeLocations.map((loc) => (
                    <SelectItem
                      key={loc._id}
                      value={loc.name}
                    >
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="toSection">{t('transferStock.section')}</Label>
              <Select
                value={toSection}
                onValueChange={setToSection}
                disabled={!toLocation || loadingLocations}
              >
                <SelectTrigger id="toSection">
                  <SelectValue placeholder={t('transferStock.selectSection')} />
                </SelectTrigger>
                <SelectContent>
                  {destinationSections.map((section) => (
                    <SelectItem
                      key={section.code || section.name}
                      value={section.name}
                    >
                      {section.name}
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
