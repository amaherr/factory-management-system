import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { Input } from '../../ui/input';
import {
  locationService,
  type LocationOverviewItem,
  type LocationSectionOverviewItem,
} from '../../../services/locations';
import { type Product } from '../../../services/products';
import { ProductStockDetailsDialog } from './ProductStockDetailsDialog';
import { AdjustStockDialog } from './AdjustStockDialog';
import { SetStockDialog } from './SetStockDialog';
import { LocationCard } from './location-management/LocationCard';
import { RenameEntityDialog } from './location-management/RenameEntityDialog';
import { LocationProductsDrawer } from './location-management/LocationProductsDrawer';

type RenameTarget =
  | {
      kind: 'location';
      location: LocationOverviewItem;
    }
  | {
      kind: 'section';
      location: LocationOverviewItem;
      section: LocationSectionOverviewItem;
    }
  | null;

type ProductsDrawerTarget = {
  locationName: string;
  sectionName?: string | null;
} | null;

export function LocationManagementSection() {
  const { t } = useTranslation('stock');

  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<LocationOverviewItem[]>([]);
  const [newLocationName, setNewLocationName] = useState('');
  const [newSectionByLocation, setNewSectionByLocation] = useState<Record<string, string>>({});
  const [renameTarget, setRenameTarget] = useState<RenameTarget>(null);
  const [renameSubmitting, setRenameSubmitting] = useState(false);
  const [drawerTarget, setDrawerTarget] = useState<ProductsDrawerTarget>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [setStockOpen, setSetStockOpen] = useState(false);

  const activeLocations = useMemo(
    () => locations.filter((location) => location.isActive !== false),
    [locations],
  );

  const loadOverview = async () => {
    setLoading(true);
    try {
      const data = await locationService.getOverview();
      setLocations(data);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('locationManagement.errors.loadFailed'),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const handleCreateLocation = async () => {
    const trimmed = newLocationName.trim();
    if (!trimmed) {
      toast.error(t('locationManagement.errors.locationNameRequired'));
      return;
    }

    try {
      await locationService.createLocation({ name: trimmed });
      setNewLocationName('');
      toast.success(t('locationManagement.toasts.locationCreated'));
      await loadOverview();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('locationManagement.errors.general'));
    }
  };

  const handleDeleteLocation = async (location: LocationOverviewItem) => {
    if (location.canDelete === false) {
      toast.error(location.deleteBlockedReason || t('locationManagement.errors.locationNotEmpty'));
      return;
    }

    try {
      await locationService.deleteLocation(location._id);
      toast.success(t('locationManagement.toasts.locationDeleted'));
      await loadOverview();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('locationManagement.errors.general'));
    }
  };

  const handleAddSection = async (locationId: string) => {
    const sectionName = (newSectionByLocation[locationId] || '').trim();
    if (!sectionName) {
      toast.error(t('locationManagement.errors.sectionNameRequired'));
      return;
    }

    try {
      await locationService.addSection(locationId, { name: sectionName });
      setNewSectionByLocation((prev) => ({ ...prev, [locationId]: '' }));
      toast.success(t('locationManagement.toasts.sectionCreated'));
      await loadOverview();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('locationManagement.errors.general'));
    }
  };

  const handleDeleteSection = async (
    location: LocationOverviewItem,
    section: LocationSectionOverviewItem,
  ) => {
    if (section.canDelete === false) {
      toast.error(section.deleteBlockedReason || t('locationManagement.errors.sectionNotEmpty'));
      return;
    }

    if (String(section._id).startsWith('UNSPECIFIED-')) {
      return;
    }

    try {
      await locationService.deleteSection(location._id, section._id);
      toast.success(t('locationManagement.toasts.sectionDeleted'));
      await loadOverview();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('locationManagement.errors.general'));
    }
  };

  const handleRenameSubmit = async (nextName: string) => {
    if (!renameTarget) return;

    setRenameSubmitting(true);
    try {
      if (renameTarget.kind === 'location') {
        await locationService.updateLocation(renameTarget.location._id, { name: nextName });
        toast.success(t('locationManagement.toasts.locationUpdated'));
      } else {
        await locationService.updateSection(renameTarget.location._id, renameTarget.section._id, {
          name: nextName,
        });
        toast.success(t('locationManagement.toasts.sectionUpdated'));
      }

      setRenameTarget(null);
      await loadOverview();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('locationManagement.errors.general'));
    } finally {
      setRenameSubmitting(false);
    }
  };

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setDetailsOpen(true);
  };

  const handleAdjustProduct = (product: Product) => {
    setSelectedProduct(product);
    setAdjustOpen(true);
  };

  const handleSetStock = (product: Product) => {
    setSelectedProduct(product);
    setSetStockOpen(true);
  };

  return (
    <>
      <Card>
        <CardContent className="space-y-4 pt-10">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_auto]">
            <Input
              value={newLocationName}
              onChange={(e) => setNewLocationName(e.target.value)}
              placeholder={t('locationManagement.newLocationPlaceholder')}
              className="border-[--border-default] bg-[--bg-card] shadow-sm focus-visible:border-[--primary-500] focus-visible:ring-[--primary-500]/30"
            />
            <Button onClick={handleCreateLocation}>
              <Plus className="mr-2 size-4" />
              {t('locationManagement.addLocation')}
            </Button>
            <Button
              variant="outline"
              onClick={loadOverview}
              disabled={loading}
            >
              <RefreshCw className="mr-2 size-4" />
              {t('actions.refresh')}
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-6 text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin" />
              {t('loading')}
            </div>
          ) : activeLocations.length === 0 ? (
            <div className="rounded-md border p-4 text-sm text-muted-foreground">
              {t('locationManagement.noLocations')}
            </div>
          ) : (
            <div className="space-y-4">
              {activeLocations.map((location) => (
                <LocationCard
                  key={`${location._id}-sections`}
                  location={location}
                  newSectionName={newSectionByLocation[location._id] || ''}
                  onSectionInputChange={(locationId, value) =>
                    setNewSectionByLocation((prev) => ({
                      ...prev,
                      [locationId]: value,
                    }))
                  }
                  onAddSection={handleAddSection}
                  onOpenLocationProducts={(targetLocation) =>
                    setDrawerTarget({ locationName: targetLocation.name })
                  }
                  onOpenSectionProducts={(targetLocation, section) =>
                    setDrawerTarget({
                      locationName: targetLocation.name,
                      sectionName: section.name,
                    })
                  }
                  onRenameLocation={(targetLocation) =>
                    setRenameTarget({ kind: 'location', location: targetLocation })
                  }
                  onRenameSection={(targetLocation, section) =>
                    setRenameTarget({ kind: 'section', location: targetLocation, section })
                  }
                  onDeleteLocation={handleDeleteLocation}
                  onDeleteSection={handleDeleteSection}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <RenameEntityDialog
        open={renameTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRenameTarget(null);
        }}
        title={
          renameTarget?.kind === 'section'
            ? t('locationManagement.dialogs.renameSectionTitle')
            : t('locationManagement.dialogs.renameLocationTitle')
        }
        description={t('locationManagement.dialogs.renameDescription')}
        initialValue={
          renameTarget?.kind === 'section'
            ? renameTarget.section.name
            : renameTarget?.location.name || ''
        }
        submitting={renameSubmitting}
        onSubmit={handleRenameSubmit}
      />

      <LocationProductsDrawer
        open={drawerTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDrawerTarget(null);
        }}
        locationName={drawerTarget?.locationName || null}
        sectionName={drawerTarget?.sectionName || null}
        onViewProduct={handleViewProduct}
        onAdjustProduct={handleAdjustProduct}
        onSetStock={handleSetStock}
      />

      <ProductStockDetailsDialog
        product={selectedProduct}
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
      />

      <AdjustStockDialog
        product={selectedProduct}
        open={adjustOpen}
        onClose={() => setAdjustOpen(false)}
        onSuccess={() => {
          void loadOverview();
        }}
      />

      <SetStockDialog
        product={selectedProduct}
        open={setStockOpen}
        onClose={() => setSetStockOpen(false)}
        onSuccess={() => {
          void loadOverview();
        }}
      />
    </>
  );
}
