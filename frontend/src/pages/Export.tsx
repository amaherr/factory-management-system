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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
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
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">{t('title')}</h1>
        <p className="text-gray-500">{t('description')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                <SelectTrigger>
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
            </div>

            <div className="space-y-2">
              <Label>{t('generateCard.format')}</Label>
              <Select
                value={format}
                onValueChange={(value) => setFormat(value as ExportFormat)}
              >
                <SelectTrigger>
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
            <CardTitle>{t('detailsCard.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedCollectionInfo ? (
              <p className="text-sm text-muted-foreground">{t('detailsCard.emptyState')}</p>
            ) : (
              <div className="rounded-lg border p-4 space-y-3 bg-blue-50/50">
                <div>
                  <p className="text-sm text-gray-500">{t('detailsCard.collection')}</p>
                  <p className="font-medium">{selectedCollectionInfo.label}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">{t('detailsCard.descriptionLabel')}</p>
                  <p className="text-sm">{selectedCollectionInfo.description}</p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Badge variant="secondary">{t('detailsCard.liveDataBadge')}</Badge>
                  <Badge variant="outline">{t('detailsCard.adminOnlyBadge')}</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('history.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('history.table.fileName')}</TableHead>
                <TableHead>{t('history.table.generatedAt')}</TableHead>
                <TableHead>{t('history.table.collection')}</TableHead>
                <TableHead>{t('history.table.format')}</TableHead>
                <TableHead>{t('history.table.size')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground py-8"
                  >
                    {t('history.emptyState')}
                  </TableCell>
                </TableRow>
              ) : (
                history.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                      <FileSpreadsheet className="size-4 text-green-600" />
                      {entry.fileName}
                    </TableCell>
                    <TableCell>{new Date(entry.generatedAt).toLocaleString()}</TableCell>
                    <TableCell>
                      {t(`collections.${entry.collection.replace(/-/g, '_')}`, {
                        defaultValue: entry.collection,
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{entry.format.toUpperCase()}</Badge>
                    </TableCell>
                    <TableCell>{formatBytes(entry.sizeBytes)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
