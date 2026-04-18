import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Badge } from '../../ui/badge';
import { locationService, type LocationOverviewItem } from '../../../services/locations';

export function LocationManagementSection() {
  const { t } = useTranslation('stock');

  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<LocationOverviewItem[]>([]);
  const [newLocationName, setNewLocationName] = useState('');
  const [newSectionByLocation, setNewSectionByLocation] = useState<Record<string, string>>({});

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

  const handleDeleteLocation = async (locationId: string) => {
    try {
      await locationService.deleteLocation(locationId);
      toast.success(t('locationManagement.toasts.locationDeleted'));
      await loadOverview();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('locationManagement.errors.general'));
    }
  };

  const handleRenameLocation = async (location: LocationOverviewItem) => {
    const nextName = window.prompt(t('locationManagement.prompts.renameLocation'), location.name);
    if (!nextName || nextName.trim() === location.name) return;

    try {
      await locationService.updateLocation(location._id, { name: nextName.trim() });
      toast.success(t('locationManagement.toasts.locationUpdated'));
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

  const handleRenameSection = async (
    locationId: string,
    sectionId: string,
    sectionName: string,
  ) => {
    const nextName = window.prompt(t('locationManagement.prompts.renameSection'), sectionName);
    if (!nextName || nextName.trim() === sectionName) return;

    try {
      await locationService.updateSection(locationId, sectionId, { name: nextName.trim() });
      toast.success(t('locationManagement.toasts.sectionUpdated'));
      await loadOverview();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('locationManagement.errors.general'));
    }
  };

  const handleDeleteSection = async (locationId: string, sectionId: string) => {
    try {
      await locationService.deleteSection(locationId, sectionId);
      toast.success(t('locationManagement.toasts.sectionDeleted'));
      await loadOverview();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('locationManagement.errors.general'));
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>{t('locationManagement.title')}</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={loadOverview}
            disabled={loading}
          >
            <RefreshCw className="mr-2 size-4" />
            {t('actions.refresh')}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
          <Input
            value={newLocationName}
            onChange={(e) => setNewLocationName(e.target.value)}
            placeholder={t('locationManagement.newLocationPlaceholder')}
          />
          <Button onClick={handleCreateLocation}>
            <Plus className="mr-2 size-4" />
            {t('locationManagement.addLocation')}
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('locationManagement.table.location')}</TableHead>
                  <TableHead>{t('locationManagement.table.productsCount')}</TableHead>
                  <TableHead>{t('locationManagement.table.totalStock')}</TableHead>
                  <TableHead className="text-right">{t('table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeLocations.map((location) => (
                  <TableRow key={location._id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{location.name}</span>
                        {location.code && <Badge variant="outline">{location.code}</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>{location.productsCount || 0}</TableCell>
                    <TableCell>{location.totalStock || 0}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRenameLocation(location)}
                          title={t('locationManagement.rename')}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteLocation(location._id)}
                          title={t('locationManagement.delete')}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {activeLocations.map((location) => (
              <div
                key={`${location._id}-sections`}
                className="rounded-md border p-3"
              >
                <div className="mb-2 text-sm font-medium">{location.name}</div>

                {location.sections.length === 0 ? (
                  <p className="mb-3 text-xs text-muted-foreground">
                    {t('locationManagement.noSections')}
                  </p>
                ) : (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {location.sections.map((section) => (
                      <Badge
                        key={section._id}
                        variant="secondary"
                        className="gap-2"
                      >
                        {section.name}
                        <button
                          type="button"
                          onClick={() =>
                            handleRenameSection(location._id, section._id, section.name)
                          }
                          className="text-xs"
                          title={t('locationManagement.rename')}
                        >
                          <Pencil className="size-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSection(location._id, section._id)}
                          className="text-xs"
                          title={t('locationManagement.delete')}
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
                  <Input
                    value={newSectionByLocation[location._id] || ''}
                    onChange={(e) =>
                      setNewSectionByLocation((prev) => ({
                        ...prev,
                        [location._id]: e.target.value,
                      }))
                    }
                    placeholder={t('locationManagement.newSectionPlaceholder')}
                  />
                  <Button
                    variant="outline"
                    onClick={() => handleAddSection(location._id)}
                  >
                    <Plus className="mr-2 size-4" />
                    {t('locationManagement.addSection')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
