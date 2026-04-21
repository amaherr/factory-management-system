import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ArrowRightLeft, Boxes } from 'lucide-react';
import type { Product } from '../../../services/products';
import { locationService, type Location } from '../../../services/locations';
import { StockDistributionSummary } from '../stock/StockDistributionSummary';
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';

interface WarehouseTransferPanelProps {
  products: Product[];
  loading: boolean;
  onSuccess: () => Promise<void> | void;
}

export function WarehouseTransferPanel({
  products,
  loading,
  onSuccess,
}: WarehouseTransferPanelProps) {
  const { t } = useTranslation('warehouse');
  const { t: tStock } = useTranslation('stock');
  const [productId, setProductId] = useState('');
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
            error instanceof Error
              ? error.message
              : tStock('transferStock.errors.loadLocationsFailed'),
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
  }, [tStock]);

  const selectedProduct = useMemo(
    () => products.find((product) => product._id === productId) || null,
    [products, productId],
  );

  const activeLocations = useMemo(
    () => locations.filter((location) => location.isActive),
    [locations],
  );

  const sourceLocations = useMemo(() => {
    const available = new Map<string, string>();

    for (const entry of selectedProduct?.locations || []) {
      if (entry.quantityInStock > 0) {
        const key = entry.location;
        if (!available.has(key)) {
          available.set(key, key);
        }
      }
    }

    return Array.from(available.values());
  }, [selectedProduct]);

  const sourceSections = useMemo(() => {
    return (selectedProduct?.locations || [])
      .filter((entry) => entry.location === fromLocation && entry.quantityInStock > 0)
      .map((entry) => ({
        section: entry.section?.trim() || 'UNSPECIFIED',
        quantity: entry.quantityInStock,
      }));
  }, [fromLocation, selectedProduct]);

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
    selectedProduct?.locations.find(
      (location) =>
        location.location === fromLocation &&
        (location.section?.trim() || 'UNSPECIFIED') === fromSection,
    )?.quantityInStock || 0;

  const getLocationLabel = (locationName: string) => {
    const normalized = locationName.trim().toLowerCase();
    return tStock(`locations.${normalized}`, { defaultValue: locationName });
  };

  const resetForm = () => {
    setFromLocation('');
    setFromSection('');
    setToLocation('');
    setToSection('');
    setQuantity('');
  };

  const handleProductChange = (nextProductId: string) => {
    setProductId(nextProductId);
    resetForm();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !selectedProduct ||
      !fromLocation ||
      !fromSection ||
      !toLocation ||
      !toSection ||
      !quantity
    ) {
      toast.error(tStock('transferStock.errors.fillAllFields'));
      return;
    }

    if (fromLocation === toLocation && fromSection === toSection) {
      toast.error(tStock('transferStock.errors.samePair'));
      return;
    }

    const parsedQuantity = Number(quantity);
    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      toast.error(tStock('transferStock.errors.invalidQuantity'));
      return;
    }

    if (parsedQuantity > availableStock) {
      toast.error(tStock('transferStock.errors.insufficientStock'));
      return;
    }

    setIsSubmitting(true);

    try {
      await locationService.transferStock({
        productId: selectedProduct._id,
        fromLocation,
        fromSection,
        toLocation,
        toSection,
        quantity: parsedQuantity,
      });

      toast.success(tStock('transferStock.success'));
      await onSuccess();
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tStock('transferStock.errors.failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('transfer.title')}</CardTitle>
        <CardDescription>{t('transfer.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="warehouse-product">{t('transfer.product')}</Label>
            <Select
              value={productId}
              onValueChange={handleProductChange}
              disabled={loading}
            >
              <SelectTrigger
                id="warehouse-product"
                className="h-9 rounded-md border-[--border-default] bg-[--bg-secondary] text-sm shadow-sm focus:ring-2 focus:ring-[--primary-500]/30"
              >
                <SelectValue placeholder={t('transfer.selectProduct')} />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem
                    key={product._id}
                    value={product._id}
                  >
                    {product.code} - {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-start">
            <div className="space-y-2">
              <Label htmlFor="warehouse-from">{tStock('transferStock.fromLocation')}</Label>
              <Select
                value={fromLocation}
                onValueChange={(value) => {
                  setFromLocation(value);
                  setFromSection('');
                }}
                disabled={!selectedProduct || loadingLocations}
              >
                <SelectTrigger
                  id="warehouse-from"
                  className="h-9 rounded-md border-[--border-default] bg-[--bg-secondary] text-sm shadow-sm focus:ring-2 focus:ring-[--primary-500]/30"
                >
                  <SelectValue placeholder={tStock('transferStock.selectLocation')} />
                </SelectTrigger>
                <SelectContent>
                  {sourceLocations.map((location) => (
                    <SelectItem
                      key={location}
                      value={location}
                    >
                      {getLocationLabel(location)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="warehouse-from-section">{tStock('transferStock.fromSection')}</Label>
              <Select
                value={fromSection}
                onValueChange={setFromSection}
                disabled={!selectedProduct || !fromLocation || loadingLocations}
              >
                <SelectTrigger
                  id="warehouse-from-section"
                  className="h-9 rounded-md border-[--border-default] bg-[--bg-secondary] text-sm shadow-sm focus:ring-2 focus:ring-[--primary-500]/30"
                >
                  <SelectValue placeholder={tStock('transferStock.selectSection')} />
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
              <p className="text-xs text-muted-foreground">
                {tStock('transferStock.available')}: {availableStock}
              </p>
            </div>

            <div className="hidden sm:flex items-center justify-center pt-7 text-muted-foreground">
              <ArrowRightLeft className="size-4" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="warehouse-to">{tStock('transferStock.toLocation')}</Label>
              <Select
                value={toLocation}
                onValueChange={(value) => {
                  setToLocation(value);
                  setToSection('');
                }}
                disabled={!selectedProduct || loadingLocations}
              >
                <SelectTrigger
                  id="warehouse-to"
                  className="h-9 rounded-md border-[--border-default] bg-[--bg-secondary] text-sm shadow-sm focus:ring-2 focus:ring-[--primary-500]/30"
                >
                  <SelectValue placeholder={tStock('transferStock.selectLocation')} />
                </SelectTrigger>
                <SelectContent>
                  {activeLocations.map((location) => (
                    <SelectItem
                      key={location._id}
                      value={location.name}
                    >
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="warehouse-to-section">{tStock('transferStock.toSection')}</Label>
              <Select
                value={toSection}
                onValueChange={setToSection}
                disabled={!selectedProduct || !toLocation || loadingLocations}
              >
                <SelectTrigger
                  id="warehouse-to-section"
                  className="h-9 rounded-md border-[--border-default] bg-[--bg-secondary] text-sm shadow-sm focus:ring-2 focus:ring-[--primary-500]/30"
                >
                  <SelectValue placeholder={tStock('transferStock.selectSection')} />
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
            <Label htmlFor="warehouse-quantity">{tStock('transferStock.quantity')}</Label>
            <Input
              id="warehouse-quantity"
              type="number"
              min="1"
              max={availableStock || undefined}
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              placeholder={tStock('transferStock.quantityPlaceholder')}
              className="h-9 rounded-md border-[--border-default] bg-[--bg-secondary] text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-[--primary-500]/30"
              disabled={!selectedProduct}
            />
          </div>

          <div className="rounded-lg border border-dashed p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Boxes className="size-4 text-muted-foreground" />
              {t('transfer.distribution')}
            </div>
            {!selectedProduct ? (
              <p className="text-sm text-muted-foreground">{t('transfer.noProduct')}</p>
            ) : (
              <StockDistributionSummary
                locations={selectedProduct.locations}
                getLocationLabel={getLocationLabel}
                emptyMessage="No stock available for this product."
                labels={{
                  totalUnits: 'Total Units',
                  locations: 'Locations',
                  sections: 'Sections',
                  location: 'Location',
                  locationTotal: 'Location Total',
                  units: 'units',
                }}
              />
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-[#1f4f86] hover:bg-[#1b4678]"
            disabled={isSubmitting || !selectedProduct}
          >
            {isSubmitting ? tStock('transferStock.submitting') : tStock('transferStock.submit')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
