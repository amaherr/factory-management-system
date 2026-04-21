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
import { AlertTriangle } from 'lucide-react';

interface SetStockDialogProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function SetStockDialog({ product, open, onClose, onSuccess }: SetStockDialogProps) {
  const { t } = useTranslation('stock');
  const [availableLocations, setAvailableLocations] = useState<Location[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [location, setLocation] = useState('');
  const [section, setSection] = useState('');
  const [newQuantity, setNewQuantity] = useState('');
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

  useEffect(() => {
    if (!open) return;

    const loadLocations = async () => {
      setLoadingLocations(true);
      try {
        const locations = await locationService.getLocations();
        setAvailableLocations(locations);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : t('setStock.errors.loadLocationsFailed'),
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

  const currentStock =
    product?.locations.find(
      (loc) => loc.location === location && (loc.section || 'UNSPECIFIED') === section,
    )?.quantityInStock || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!product || !location || !section || newQuantity === '') {
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
        section,
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
    setSection('');
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
              onValueChange={(value) => {
                setLocation(value);
                setSection('');
              }}
              disabled={loadingLocations || activeLocations.length === 0}
            >
              <SelectTrigger id="location">
                <SelectValue
                  placeholder={
                    loadingLocations ? t('setStock.loadingLocations') : t('setStock.selectLocation')
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {activeLocations.map((loc) => {
                  const stock =
                    product?.locations.find((l) => l.location === loc.name)?.quantityInStock || 0;
                  return (
                    <SelectItem
                      key={loc._id}
                      value={loc.name}
                    >
                      {loc.name}
                      {loc.code ? ` (${loc.code})` : ''} ({t('setStock.current')}: {stock})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {!loadingLocations && activeLocations.length === 0 && (
              <p className="text-sm text-muted-foreground">{t('setStock.noLocations')}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="section">{t('setStock.section')}</Label>
            <Select
              value={section}
              onValueChange={setSection}
              disabled={!selectedLocation || activeSections.length === 0}
            >
              <SelectTrigger id="section">
                <SelectValue
                  placeholder={
                    !selectedLocation
                      ? t('setStock.selectLocationFirst')
                      : activeSections.length === 0
                        ? t('setStock.noSections')
                        : t('setStock.selectSection')
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
              <p className="text-sm text-muted-foreground">{t('setStock.noSections')}</p>
            )}
          </div>

          <div className="space-y-2">
            {location && section && (
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
