import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { MapPin } from 'lucide-react';
import {
  stockMovementService,
  type StockMovement,
  type WarehouseAction,
} from '../../../services/stockMovements';
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
  const [locations, setLocations] = useState<Location[]>([]);
  const [sourceLocation, setSourceLocation] = useState<string>('');
  const [sourceSection, setSourceSection] = useState<string>('');
  const [destinationLocation, setDestinationLocation] = useState<string>('');
  const [destinationSection, setDestinationSection] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const warehouseAction = movement?.warehouseAction;
  const requiresSource = warehouseAction === 'pick';
  const requiresDestination = warehouseAction === 'receive';

  useEffect(() => {
    if (!open || !movement) {
      return;
    }

    setSourceLocation(movement.sourceLocation ?? '');
    setSourceSection(movement.sourceSection ?? '');
    setDestinationLocation(movement.destinationLocation ?? '');
    setDestinationSection(movement.destinationSection ?? '');
  }, [open, movement]);

  useEffect(() => {
    if (!open) return;

    const loadLocations = async () => {
      try {
        const data = await locationService.getLocations();
        setLocations(data);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t('errors.productsLoadFailed'));
      }
    };

    loadLocations();
  }, [open, t]);

  const sourceSections =
    locations.find((loc) => loc.name === sourceLocation || loc._id === sourceLocation)?.sections ||
    [];
  const destinationSections =
    locations.find((loc) => loc.name === destinationLocation || loc._id === destinationLocation)
      ?.sections || [];

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSourceLocation('');
      setSourceSection('');
      setDestinationLocation('');
      setDestinationSection('');
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
        if (!sourceLocation || !sourceSection) {
          toast.error(t('execute.errors.fillSourceSection'));
          return;
        }

        await stockMovementService.executePickStockMovement(movement._id, {
          sourceLocation,
          sourceSection,
        });
      } else if (warehouseAction === 'receive') {
        if (!destinationLocation || !destinationSection) {
          toast.error(t('execute.errors.fillDestinationSection'));
          return;
        }

        await stockMovementService.executeReceiveStockMovement(movement._id, {
          destinationLocation,
          destinationSection,
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
                  {movement.warehouseAction || t('execute.notSet')}
                </Badge>
              </div>
              {requiresSource && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="execute-source-location">{t('execute.sourceLocation')}</Label>
                    <Select
                      value={sourceLocation}
                      onValueChange={(value) => {
                        setSourceLocation(value);
                        setSourceSection('');
                      }}
                    >
                      <SelectTrigger
                        id="execute-source-location"
                        className="h-9 rounded-md border-[--border-default] bg-[--bg-secondary] text-sm shadow-sm focus:ring-2 focus:ring-[--primary-500]/30"
                      >
                        <SelectValue placeholder={t('execute.selectLocation')} />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((location) => (
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
                    <Label htmlFor="execute-source-section">{t('execute.sourceSection')}</Label>
                    <Select
                      value={sourceSection}
                      onValueChange={setSourceSection}
                    >
                      <SelectTrigger
                        id="execute-source-section"
                        className="h-9 rounded-md border-[--border-default] bg-[--bg-secondary] text-sm shadow-sm focus:ring-2 focus:ring-[--primary-500]/30"
                      >
                        <SelectValue placeholder={t('execute.selectSection')} />
                      </SelectTrigger>
                      <SelectContent>
                        {sourceSections.map((section) => (
                          <SelectItem
                            key={section._id}
                            value={section.name}
                          >
                            {section.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {requiresDestination && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="execute-destination-location">
                      {t('execute.destinationLocation')}
                    </Label>
                    <Select
                      value={destinationLocation}
                      onValueChange={(value) => {
                        setDestinationLocation(value);
                        setDestinationSection('');
                      }}
                    >
                      <SelectTrigger
                        id="execute-destination-location"
                        className="h-9 rounded-md border-[--border-default] bg-[--bg-secondary] text-sm shadow-sm focus:ring-2 focus:ring-[--primary-500]/30"
                      >
                        <SelectValue placeholder={t('execute.selectLocation')} />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((location) => (
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
                    <Label htmlFor="execute-destination-section">
                      {t('execute.destinationSection')}
                    </Label>
                    <Select
                      value={destinationSection}
                      onValueChange={setDestinationSection}
                    >
                      <SelectTrigger
                        id="execute-destination-section"
                        className="h-9 rounded-md border-[--border-default] bg-[--bg-secondary] text-sm shadow-sm focus:ring-2 focus:ring-[--primary-500]/30"
                      >
                        <SelectValue placeholder={t('execute.selectSection')} />
                      </SelectTrigger>
                      <SelectContent>
                        {destinationSections.map((section) => (
                          <SelectItem
                            key={section._id}
                            value={section.name}
                          >
                            {section.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
                    {movement.sourceLocation || t('execute.notSet')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('execute.sourceSection')}: {movement.sourceSection || t('execute.notSet')}
                  </p>
                </div>
                <div className="rounded-md bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">
                    {t('execute.destinationLocation')}
                  </p>
                  <p className="text-sm font-medium">
                    {movement.destinationLocation || t('execute.notSet')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('execute.destinationSection')}:{' '}
                    {movement.destinationSection || t('execute.notSet')}
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
