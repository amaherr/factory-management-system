import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';

import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { exportService, type ExportFormat } from '../services/exports';

interface ExportHistoryEntry {
  id: string;
  fileName: string;
  generatedAt: string;
  collection: string;
  format: ExportFormat;
  sizeBytes: number;
}

const formatBytes = (bytes: number): string => {
  if (!bytes) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;

  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
};

const downloadBlobFile = (blob: Blob, fileName: string) => {
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(blobUrl);
};

export function Export() {
  const { t } = useTranslation('export');

  const exportSelectTriggerClass =
    'border border-[--border-strong] bg-[--bg-card] shadow-sm focus-visible:border-[--primary-500] focus-visible:ring-[--primary-500]/30';

  const [collections, setCollections] = useState<string[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [history, setHistory] = useState<ExportHistoryEntry[]>([]);

  const selectedCollectionInfo = useMemo(() => {
    if (!selectedCollection) return null;

    return {
      key: selectedCollection,
      label: t(`collections.${selectedCollection.replace(/-/g, '_')}`, {
        defaultValue: selectedCollection,
      }),
      description: t(`collectionDescriptions.${selectedCollection.replace(/-/g, '_')}`, {
        defaultValue: t('defaultCollectionDescription'),
      }),
    };
  }, [selectedCollection, t]);

  const recentHistory = useMemo(() => history.slice(0, 5), [history]);

  useEffect(() => {
    const fetchCollections = async () => {
      setLoadingCollections(true);

      try {
        const data = await exportService.getExportableCollections();
        setCollections(data);

        if (data.length > 0) {
          setSelectedCollection((prev) => prev || data[0]);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : t('errors.loadCollections');
        toast.error(message);
      } finally {
        setLoadingCollections(false);
      }
    };

    fetchCollections();
  }, [t]);

  const handleGenerateExport = async () => {
    if (!selectedCollection) {
      toast.error(t('errors.selectCollection'));
      return;
    }

    setDownloading(true);

    try {
      const { blob, fileName } = await exportService.downloadCollectionExport(
        selectedCollection,
        format,
      );

      downloadBlobFile(blob, fileName);

      const newEntry: ExportHistoryEntry = {
        id: `${Date.now()}-${selectedCollection}-${format}`,
        fileName,
        generatedAt: new Date().toISOString(),
        collection: selectedCollection,
        format,
        sizeBytes: blob.size,
      };

      setHistory((prev) => [newEntry, ...prev].slice(0, 10));
      toast.success(t('success.exportReady'));
    } catch (error) {
      const message = error instanceof Error ? error.message : t('errors.downloadFailed');
      toast.error(message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{t('description')}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <Card>
          <CardHeader>
            <CardTitle>{t('generateCard.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('generateCard.collection')}</Label>
              <Select
                value={selectedCollection}
                onValueChange={setSelectedCollection}
                disabled={loadingCollections || collections.length === 0}
              >
                <SelectTrigger className={exportSelectTriggerClass}>
                  <SelectValue
                    placeholder={
                      loadingCollections
                        ? t('generateCard.loadingCollections')
                        : t('generateCard.selectCollection')
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {collections.map((collection) => (
                    <SelectItem
                      key={collection}
                      value={collection}
                    >
                      {t(`collections.${collection.replace(/-/g, '_')}`, {
                        defaultValue: collection,
                      })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCollectionInfo ? (
                <p className="text-xs text-muted-foreground">
                  {selectedCollectionInfo.description}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>{t('generateCard.format')}</Label>
              <Select
                value={format}
                onValueChange={(value) => setFormat(value as ExportFormat)}
              >
                <SelectTrigger className={exportSelectTriggerClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">{t('formats.csv')}</SelectItem>
                  <SelectItem value="xlsx">{t('formats.xlsx')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              className="w-full"
              onClick={handleGenerateExport}
              disabled={downloading || loadingCollections || !selectedCollection}
            >
              {downloading ? (
                <Loader2 className="size-4 mr-2 animate-spin" />
              ) : (
                <Download className="size-4 mr-2" />
              )}
              {downloading ? t('generateCard.generating') : t('generateCard.generate')}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('history.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('history.emptyState')}</p>
            ) : (
              <div className="space-y-3">
                {recentHistory.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-[--border-default] bg-[--bg-card] p-3"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="size-4 text-blue-600" />
                        <p className="truncate font-medium">{entry.fileName}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t(`collections.${entry.collection.replace(/-/g, '_')}`, {
                          defaultValue: entry.collection,
                        })}
                        {' · '}
                        {new Date(entry.generatedAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant="outline">{entry.format.toUpperCase()}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatBytes(entry.sizeBytes)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedCollectionInfo ? (
        <div className="rounded-lg border border-[--border-default] bg-[--bg-card] p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-medium">{selectedCollectionInfo.label}</p>
              <p className="text-sm text-muted-foreground">{selectedCollectionInfo.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{t('detailsCard.liveDataBadge')}</Badge>
              <Badge variant="outline">{t('detailsCard.adminOnlyBadge')}</Badge>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
