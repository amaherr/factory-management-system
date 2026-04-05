import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ArrowRightLeft, Boxes } from 'lucide-react';
import { productService, type Product } from '../../../services/products';
import {
  FACTORY_LOCATIONS_VALUES,
  type FactoryLocation,
} from '../../../services/enums/product.enums';
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Badge } from '../../ui/badge';
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
  const [fromLocation, setFromLocation] = useState<FactoryLocation | ''>('');
  const [toLocation, setToLocation] = useState<FactoryLocation | ''>('');
  const [quantity, setQuantity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedProduct = useMemo(
    () => products.find((product) => product._id === productId) || null,
    [products, productId],
  );

  const sourceLocations = (selectedProduct?.locations || []).filter(
    (location) => location.quantityInStock > 0,
  );
  const availableStock =
    selectedProduct?.locations.find((location) => location.location === fromLocation)
      ?.quantityInStock || 0;

  const resetForm = () => {
    setFromLocation('');
    setToLocation('');
    setQuantity('');
  };

  const handleProductChange = (nextProductId: string) => {
    setProductId(nextProductId);
    resetForm();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedProduct || !fromLocation || !toLocation || !quantity) {
      toast.error(tStock('transferStock.errors.fillAllFields'));
      return;
    }

    if (fromLocation === toLocation) {
      toast.error(tStock('transferStock.errors.sameLocation'));
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
      await productService.transferStock(selectedProduct._id, {
        fromLocation,
        toLocation,
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
                onValueChange={(value) => setFromLocation(value as FactoryLocation)}
                disabled={!selectedProduct}
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
                      key={location.location}
                      value={location.location}
                    >
                      {tStock(`locations.${location.location}`)} ({location.quantityInStock})
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
                onValueChange={(value) => setToLocation(value as FactoryLocation)}
                disabled={!selectedProduct}
              >
                <SelectTrigger
                  id="warehouse-to"
                  className="h-9 rounded-md border-[--border-default] bg-[--bg-secondary] text-sm shadow-sm focus:ring-2 focus:ring-[--primary-500]/30"
                >
                  <SelectValue placeholder={tStock('transferStock.selectLocation')} />
                </SelectTrigger>
                <SelectContent>
                  {FACTORY_LOCATIONS_VALUES.map((location) => (
                    <SelectItem
                      key={location}
                      value={location}
                      disabled={location === fromLocation}
                    >
                      {tStock(`locations.${location}`)}
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
              <div className="flex flex-wrap gap-2">
                {selectedProduct.locations.map((location) => (
                  <Badge
                    key={location.location}
                    variant="outline"
                    className="py-1"
                  >
                    {tStock(`locations.${location.location}`)}: {location.quantityInStock}
                  </Badge>
                ))}
              </div>
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
