import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { MapPin, Plus, Trash2 } from 'lucide-react';
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
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Badge } from '../../ui/badge';

interface ExecuteStockMovementDialogProps {
  movement: StockMovement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => Promise<void> | void;
}

interface DraftAllocation {
  location: string;
  section: string;
  quantity: string;
}

function createEmptyAllocation(): DraftAllocation {
  return {
    location: '',
    section: '',
    quantity: '',
  };
}

function hasAllocationValue(allocation: DraftAllocation) {
  return Boolean(
    allocation.location.trim() || allocation.section.trim() || allocation.quantity.trim(),
  );
}

function getActiveAllocations(items: DraftAllocation[]) {
  return items.filter((item) => hasAllocationValue(item));
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
  const [sourceAllocations, setSourceAllocations] = useState<DraftAllocation[]>([
    createEmptyAllocation(),
  ]);
  const [destinationAllocations, setDestinationAllocations] = useState<DraftAllocation[]>([
    createEmptyAllocation(),
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const warehouseAction = movement?.warehouseAction;
  const requiresSource = warehouseAction === 'pick';
  const requiresDestination = warehouseAction === 'receive';

  useEffect(() => {
    if (!open || !movement) {
      return;
    }

    setSourceAllocations([createEmptyAllocation()]);
    setDestinationAllocations([createEmptyAllocation()]);
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

  const getSectionsForLocation = (locationName: string) => {
    const location = locations.find((loc) => loc.name === locationName || loc._id === locationName);
    return location?.sections || [];
  };

  const getAllocatedTotal = (allocations: DraftAllocation[]) => {
    return allocations.reduce((sum, item) => {
      const value = Number(item.quantity);
      return sum + (Number.isFinite(value) && value > 0 ? value : 0);
    }, 0);
  };

  const activeSourceAllocations = getActiveAllocations(sourceAllocations);
  const activeDestinationAllocations = getActiveAllocations(destinationAllocations);
  const sourceAllocatedTotal = getAllocatedTotal(activeSourceAllocations);
  const destinationAllocatedTotal = getAllocatedTotal(activeDestinationAllocations);
  const movementTotalQuantity = Math.abs(Number(movement?.quantityChange || 0));
  const movementExecutedQuantity = Math.max(0, Number(movement?.physicalQuantityExecuted || 0));
  const movementRemainingQuantity = Math.max(movementTotalQuantity - movementExecutedQuantity, 0);

  const updateAllocation = (
    kind: 'source' | 'destination',
    index: number,
    key: keyof DraftAllocation,
    value: string,
  ) => {
    const setter = kind === 'source' ? setSourceAllocations : setDestinationAllocations;

    setter((current) => {
      return current.map((item, itemIndex) => {
        if (itemIndex !== index) return item;

        if (key === 'location') {
          return {
            ...item,
            location: value,
            section: '',
          };
        }

        return {
          ...item,
          [key]: value,
        };
      });
    });
  };

  const addAllocation = (kind: 'source' | 'destination') => {
    if (kind === 'source') {
      setSourceAllocations((prev) => [...prev, createEmptyAllocation()]);
      return;
    }

    setDestinationAllocations((prev) => [...prev, createEmptyAllocation()]);
  };

  const removeAllocation = (kind: 'source' | 'destination', index: number) => {
    const setter = kind === 'source' ? setSourceAllocations : setDestinationAllocations;

    setter((current) => {
      if (current.length === 1) {
        return [createEmptyAllocation()];
      }

      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSourceAllocations([createEmptyAllocation()]);
      setDestinationAllocations([createEmptyAllocation()]);
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

    if (movementRemainingQuantity <= 0) {
      toast.error(t('execute.errors.noRemainingQuantity'));
      return;
    }

    setIsSubmitting(true);

    try {
      const mapDraftToPayload = (items: DraftAllocation[]) => {
        return getActiveAllocations(items).map((item) => ({
          location: item.location.trim(),
          section: item.section.trim(),
          quantity: Number(item.quantity),
        }));
      };

      const validateAllocations = (items: DraftAllocation[]) => {
        const activeItems = getActiveAllocations(items);
        if (activeItems.length === 0) return false;

        return activeItems.every((item) => {
          const quantity = Number(item.quantity);
          return (
            item.location.trim().length > 0 &&
            item.section.trim().length > 0 &&
            Number.isFinite(quantity) &&
            quantity > 0
          );
        });
      };

      if (warehouseAction === 'pick') {
        if (!validateAllocations(sourceAllocations)) {
          toast.error(t('execute.errors.fillSourceAllocations'));
          return;
        }

        if (sourceAllocatedTotal > movementRemainingQuantity) {
          toast.error(t('execute.errors.overAllocated'));
          return;
        }

        await stockMovementService.executePickStockMovement(movement._id, {
          sourceAllocations: mapDraftToPayload(sourceAllocations),
        });
      } else if (warehouseAction === 'receive') {
        if (!validateAllocations(destinationAllocations)) {
          toast.error(t('execute.errors.fillDestinationAllocations'));
          return;
        }

        if (destinationAllocatedTotal > movementRemainingQuantity) {
          toast.error(t('execute.errors.overAllocated'));
          return;
        }

        await stockMovementService.executeReceiveStockMovement(movement._id, {
          destinationAllocations: mapDraftToPayload(destinationAllocations),
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
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="shrink-0 border-b border-[--border-default] bg-[--bg-secondary] px-6 py-4">
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
            className="min-h-0 flex flex-1 flex-col"
          >
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
              <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{movement.productId?.name || '-'}</p>
                    <p className="text-xs text-muted-foreground">
                      {movement.productId?.code || '-'}
                    </p>
                  </div>
                  <Badge variant={getWarehouseActionVariant(movement.warehouseAction)}>
                    {movement.warehouseAction || t('execute.notSet')}
                  </Badge>
                </div>
                <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                  <p>{t('execute.executedSummary', { quantity: movementExecutedQuantity })}</p>
                  <p>{t('execute.remainingSummary', { quantity: movementRemainingQuantity })}</p>
                  <p>{t('execute.totalSummary', { quantity: movementTotalQuantity })}</p>
                </div>
                {requiresSource && (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      {t('execute.multiAllocationHint')}
                    </p>

                    {sourceAllocations.map((allocation, index) => (
                      <div
                        key={`source-${index}`}
                        className="rounded-md border bg-background/60 p-3 space-y-3"
                      >
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            {t('execute.sourceAllocationsTitle')} #{index + 1}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeAllocation('source', index)}
                            title={t('execute.removeAllocation')}
                          >
                            <Trash2 className="size-4 text-red-600" />
                          </Button>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_120px]">
                          <Select
                            value={allocation.location}
                            onValueChange={(value) =>
                              updateAllocation('source', index, 'location', value)
                            }
                          >
                            <SelectTrigger className="h-9 rounded-md border-[--border-default] bg-[--bg-secondary] text-sm shadow-sm focus:ring-2 focus:ring-[--primary-500]/30">
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

                          <Select
                            value={allocation.section}
                            onValueChange={(value) =>
                              updateAllocation('source', index, 'section', value)
                            }
                          >
                            <SelectTrigger className="h-9 rounded-md border-[--border-default] bg-[--bg-secondary] text-sm shadow-sm focus:ring-2 focus:ring-[--primary-500]/30">
                              <SelectValue placeholder={t('execute.selectSection')} />
                            </SelectTrigger>
                            <SelectContent>
                              {getSectionsForLocation(allocation.location).map((section) => (
                                <SelectItem
                                  key={section._id}
                                  value={section.name}
                                >
                                  {section.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Input
                            type="number"
                            min={1}
                            step={1}
                            value={allocation.quantity}
                            onChange={(event) =>
                              updateAllocation('source', index, 'quantity', event.target.value)
                            }
                            placeholder={t('execute.quantity')}
                            className="h-9"
                          />
                        </div>
                      </div>
                    ))}

                    <p className="text-xs text-muted-foreground">
                      {t('execute.allocatedSummary', {
                        allocated: sourceAllocatedTotal,
                        quantity: movementRemainingQuantity,
                      })}
                    </p>
                  </div>
                )}

                {requiresDestination && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>{t('execute.destinationAllocationsTitle')}</Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('execute.multiAllocationHint')}
                    </p>

                    {destinationAllocations.map((allocation, index) => (
                      <div
                        key={`destination-${index}`}
                        className="rounded-md border bg-background/60 p-3 space-y-3"
                      >
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            {t('execute.destinationAllocationsTitle')} #{index + 1}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeAllocation('destination', index)}
                            title={t('execute.removeAllocation')}
                          >
                            <Trash2 className="size-4 text-red-600" />
                          </Button>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_120px]">
                          <Select
                            value={allocation.location}
                            onValueChange={(value) =>
                              updateAllocation('destination', index, 'location', value)
                            }
                          >
                            <SelectTrigger className="h-9 rounded-md border-[--border-default] bg-[--bg-secondary] text-sm shadow-sm focus:ring-2 focus:ring-[--primary-500]/30">
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

                          <Select
                            value={allocation.section}
                            onValueChange={(value) =>
                              updateAllocation('destination', index, 'section', value)
                            }
                          >
                            <SelectTrigger className="h-9 rounded-md border-[--border-default] bg-[--bg-secondary] text-sm shadow-sm focus:ring-2 focus:ring-[--primary-500]/30">
                              <SelectValue placeholder={t('execute.selectSection')} />
                            </SelectTrigger>
                            <SelectContent>
                              {getSectionsForLocation(allocation.location).map((section) => (
                                <SelectItem
                                  key={section._id}
                                  value={section.name}
                                >
                                  {section.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Input
                            type="number"
                            min={1}
                            step={1}
                            value={allocation.quantity}
                            onChange={(event) =>
                              updateAllocation('destination', index, 'quantity', event.target.value)
                            }
                            placeholder={t('execute.quantity')}
                            className="h-9"
                          />
                        </div>
                      </div>
                    ))}

                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addAllocation('destination')}
                      >
                        <Plus className="size-4 mr-1" />
                        {t('execute.addAllocation')}
                      </Button>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {t('execute.allocatedSummary', {
                        allocated: destinationAllocatedTotal,
                        quantity: movementRemainingQuantity,
                      })}
                    </p>
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
                    {Array.isArray(movement.sourceAllocations) &&
                    movement.sourceAllocations.length > 0 ? (
                      <div className="mt-1 space-y-1">
                        {movement.sourceAllocations.map((allocation, idx) => (
                          <p
                            key={`src-${idx}`}
                            className="text-xs"
                          >
                            {allocation.location} / {allocation.section} - {allocation.quantity}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm font-medium">{t('execute.notSet')}</p>
                    )}
                  </div>
                  <div className="rounded-md bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">
                      {t('execute.destinationLocation')}
                    </p>
                    {Array.isArray(movement.destinationAllocations) &&
                    movement.destinationAllocations.length > 0 ? (
                      <div className="mt-1 space-y-1">
                        {movement.destinationAllocations.map((allocation, idx) => (
                          <p
                            key={`dst-${idx}`}
                            className="text-xs"
                          >
                            {allocation.location} / {allocation.section} - {allocation.quantity}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm font-medium">{t('execute.notSet')}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="shrink-0 border-t border-[--border-default] bg-[--bg-secondary] px-6 py-4">
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
                disabled={isSubmitting || movementRemainingQuantity <= 0}
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
