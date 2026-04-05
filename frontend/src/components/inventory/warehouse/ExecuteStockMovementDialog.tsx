import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { MapPin } from 'lucide-react';
import {
  FACTORY_LOCATIONS_VALUES,
  type FactoryLocation,
} from '../../../services/enums/product.enums';
import {
  stockMovementService,
  type StockMovement,
  type WarehouseAction,
} from '../../../services/stockMovements';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Badge } from '../../ui/badge';

interface ExecuteStockMovementDialogProps {
  movement: StockMovement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => Promise<void> | void;
}

function getWarehouseActionVariant(action?: WarehouseAction | null) {
  const colorMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pick: 'destructive',
    receive: 'default',
    transfer: 'secondary',
  };

  if (!action) return 'outline';
  return colorMap[action] || 'outline';
}

export function ExecuteStockMovementDialog({
  movement,
  open,
  onOpenChange,
  onSuccess,
}: ExecuteStockMovementDialogProps) {
  const { t } = useTranslation('warehouse');
  const { t: tStock } = useTranslation('stock');
  const [sourceLocation, setSourceLocation] = useState<FactoryLocation | ''>('');
  const [destinationLocation, setDestinationLocation] = useState<FactoryLocation | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const warehouseAction = movement?.warehouseAction;
  const requiresSource = warehouseAction === 'pick';
  const requiresDestination = warehouseAction === 'receive';

  useEffect(() => {
    if (!open || !movement) {
      return;
    }

    setSourceLocation((movement.sourceLocation as FactoryLocation | null) ?? '');
    setDestinationLocation((movement.destinationLocation as FactoryLocation | null) ?? '');
  }, [open, movement]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSourceLocation('');
      setDestinationLocation('');
      setIsSubmitting(false);
    }

    onOpenChange(nextOpen);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!movement?._id || !warehouseAction) {
      toast.error(t('execute.errors.unsupportedAction'));
      return;
    }

    setIsSubmitting(true);

    try {
      if (warehouseAction === 'pick') {
        if (!sourceLocation) {
          toast.error(t('execute.errors.fillSourceLocation'));
          return;
        }

        await stockMovementService.executePickStockMovement(movement._id, {
          sourceLocation,
        });
      } else if (warehouseAction === 'receive') {
        if (!destinationLocation) {
          toast.error(t('execute.errors.fillDestinationLocation'));
          return;
        }

        await stockMovementService.executeReceiveStockMovement(movement._id, {
          destinationLocation,
        });
      } else {
        toast.error(t('execute.errors.unsupportedAction'));
        return;
      }

      toast.success(t('execute.success'));
      await onSuccess();
      handleOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('execute.errors.failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogContent className="overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="border-b border-[--border-default] bg-[--bg-secondary] px-6 py-4">
          <DialogTitle>{t('execute.title')}</DialogTitle>
          <DialogDescription>
            {t('execute.description', {
              productName: movement?.productId?.name || '-',
              productCode: movement?.productId?.code || '-',
            })}
          </DialogDescription>
        </DialogHeader>

        {movement && (
          <form
            onSubmit={handleSubmit}
            className="space-y-5 px-6 py-5"
          >
            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{movement.productId?.name || '-'}</p>
                  <p className="text-xs text-muted-foreground">{movement.productId?.code || '-'}</p>
                </div>
                <Badge variant={getWarehouseActionVariant(movement.warehouseAction)}>
                  {movement.warehouseAction
                    ? tStock(`movements.warehouseActions.${movement.warehouseAction}`)
                    : t('execute.notSet')}
                </Badge>
              </div>
              {requiresSource && (
                <div className="space-y-2">
                  <Label htmlFor="execute-source-location">{t('execute.sourceLocation')}</Label>
                  <Select
                    value={sourceLocation}
                    onValueChange={(value) => setSourceLocation(value as FactoryLocation)}
                  >
                    <SelectTrigger
                      id="execute-source-location"
                      className="h-9 rounded-md border-[--border-default] bg-[--bg-secondary] text-sm shadow-sm focus:ring-2 focus:ring-[--primary-500]/30"
                    >
                      <SelectValue placeholder={t('execute.selectLocation')} />
                    </SelectTrigger>
                    <SelectContent>
                      {FACTORY_LOCATIONS_VALUES.map((location) => (
                        <SelectItem
                          key={location}
                          value={location}
                        >
                          {tStock(`locations.${location}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {requiresDestination && (
                <div className="space-y-2">
                  <Label htmlFor="execute-destination-location">
                    {t('execute.destinationLocation')}
                  </Label>
                  <Select
                    value={destinationLocation}
                    onValueChange={(value) => setDestinationLocation(value as FactoryLocation)}
                  >
                    <SelectTrigger
                      id="execute-destination-location"
                      className="h-9 rounded-md border-[--border-default] bg-[--bg-secondary] text-sm shadow-sm focus:ring-2 focus:ring-[--primary-500]/30"
                    >
                      <SelectValue placeholder={t('execute.selectLocation')} />
                    </SelectTrigger>
                    <SelectContent>
                      {FACTORY_LOCATIONS_VALUES.map((location) => (
                        <SelectItem
                          key={location}
                          value={location}
                        >
                          {tStock(`locations.${location}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="rounded-lg border border-dashed p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <MapPin className="size-4 text-muted-foreground" />
                {t('execute.currentLocations')}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">{t('execute.sourceLocation')}</p>
                  <p className="text-sm font-medium">
                    {movement.sourceLocation
                      ? tStock(`locations.${movement.sourceLocation}`)
                      : t('execute.notSet')}
                  </p>
                </div>
                <div className="rounded-md bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">
                    {t('execute.destinationLocation')}
                  </p>
                  <p className="text-sm font-medium">
                    {movement.destinationLocation
                      ? tStock(`locations.${movement.destinationLocation}`)
                      : t('execute.notSet')}
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="border-t border-[--border-default] bg-[--bg-secondary] px-0 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                {t('execute.cancel')}
              </Button>
              <Button
                type="submit"
                className="bg-[#1f4f86] hover:bg-[#1b4678]"
                disabled={isSubmitting}
              >
                {isSubmitting ? t('execute.submitting') : t('execute.submit')}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
