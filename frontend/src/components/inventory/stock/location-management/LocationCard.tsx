import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type {
  LocationOverviewItem,
  LocationSectionOverviewItem,
} from '../../../../services/locations';
import { Button } from '../../../ui/button';
import { Badge } from '../../../ui/badge';
import { Input } from '../../../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../ui/table';

interface LocationCardProps {
  location: LocationOverviewItem;
  newSectionName: string;
  onSectionInputChange: (locationId: string, value: string) => void;
  onAddSection: (locationId: string) => void;
  onOpenLocationProducts: (location: LocationOverviewItem) => void;
  onOpenSectionProducts: (
    location: LocationOverviewItem,
    section: LocationSectionOverviewItem,
  ) => void;
  onRenameLocation: (location: LocationOverviewItem) => void;
  onRenameSection: (location: LocationOverviewItem, section: LocationSectionOverviewItem) => void;
  onDeleteLocation: (location: LocationOverviewItem) => void;
  onDeleteSection: (location: LocationOverviewItem, section: LocationSectionOverviewItem) => void;
}

export function LocationCard({
  location,
  newSectionName,
  onSectionInputChange,
  onAddSection,
  onOpenLocationProducts,
  onOpenSectionProducts,
  onRenameLocation,
  onRenameSection,
  onDeleteLocation,
  onDeleteSection,
}: LocationCardProps) {
  const { t } = useTranslation('stock');
  const sections = location.sectionsOverview || [];

  return (
    <div className="rounded-xl border border-[--border-default] bg-gradient-to-br from-white to-[--primary-100]/25 p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-medium">{location.name}</span>
          {location.code ? <Badge variant="outline">{location.code}</Badge> : null}
          <Badge className="border-blue-200 bg-blue-100 text-blue-700">
            {t('locationManagement.productsCountBadge', { count: location.productsCount || 0 })}
          </Badge>
          <Badge className="border-blue-200 bg-blue-100 text-blue-700">
            {t('locationManagement.stockBadge', { count: location.totalStock || 0 })}
          </Badge>
        </div>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenLocationProducts(location)}
            title={t('locationManagement.openProducts')}
          >
            <Eye className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-blue-700 hover:bg-blue-50"
            onClick={() => onRenameLocation(location)}
            title={t('locationManagement.rename')}
          >
            <Pencil className="size-4" />
          </Button>
          {location.canDelete === false ? (
            <Badge
              variant="outline"
              className="border-[--warning-main]/30 bg-[--warning-bg] text-[--warning-main]"
              title={
                location.deleteBlockedReason || t('locationManagement.errors.locationNotEmpty')
              }
            >
              {t('locationManagement.deleteUnavailable')}
            </Badge>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="text-red-700 hover:bg-red-50"
              onClick={() => onDeleteLocation(location)}
              title={t('locationManagement.delete')}
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {sections.length === 0 ? (
        <p className="mb-3 text-sm text-muted-foreground">{t('locationManagement.noSections')}</p>
      ) : (
        <div className="mb-3 overflow-hidden rounded-lg border border-[--border-default] bg-white/85">
          <Table>
            <TableHeader>
              <TableRow className="bg-[--primary-100]/55">
                <TableHead>{t('locationManagement.sectionsTable.section')}</TableHead>
                <TableHead>{t('locationManagement.sectionsTable.productsCount')}</TableHead>
                <TableHead>{t('locationManagement.sectionsTable.totalStock')}</TableHead>
                <TableHead className="text-right">{t('table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sections.map((section) => (
                <TableRow
                  key={section._id}
                  className="hover:bg-[--primary-100]/30"
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{section.name}</span>
                      {section.code ? <Badge variant="outline">{section.code}</Badge> : null}
                    </div>
                  </TableCell>
                  <TableCell>{section.productsCount || 0}</TableCell>
                  <TableCell>{section.totalStock || 0}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onOpenSectionProducts(location, section)}
                        title={t('locationManagement.openProducts')}
                      >
                        <Eye className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-700 hover:bg-blue-50"
                        onClick={() => onRenameSection(location, section)}
                        title={t('locationManagement.rename')}
                        disabled={String(section._id).startsWith('UNSPECIFIED-')}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      {section.canDelete === false ||
                      String(section._id).startsWith('UNSPECIFIED-') ? (
                        <Badge
                          variant="outline"
                          className="border-[--warning-main]/30 bg-[--warning-bg] text-[--warning-main]"
                          title={
                            section.deleteBlockedReason ||
                            t('locationManagement.errors.sectionNotEmpty')
                          }
                        >
                          {t('locationManagement.deleteUnavailable')}
                        </Badge>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-700 hover:bg-red-50"
                          onClick={() => onDeleteSection(location, section)}
                          title={t('locationManagement.delete')}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
        <Input
          value={newSectionName}
          onChange={(event) => onSectionInputChange(location._id, event.target.value)}
          placeholder={t('locationManagement.newSectionPlaceholder')}
          className="border-[--border-default] bg-[--bg-card] shadow-sm focus-visible:border-[--primary-500] focus-visible:ring-[--primary-500]/30"
        />
        <Button onClick={() => onAddSection(location._id)}>
          <Plus className="mr-2 size-4" />
          {t('locationManagement.addSection')}
        </Button>
      </div>
    </div>
  );
}
