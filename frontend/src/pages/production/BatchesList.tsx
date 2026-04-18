import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { Search, Plus, Eye, MoreVertical, Trash2, Play, CheckCircle } from 'lucide-react';
import { batchService, type Batch, type BatchWithEvents } from '../../services/batches';
import { productService } from '../../services/products';
import { CreateBatchDialog } from '../../components/production/CreateBatchDialog';
import { BatchDetailsDialog } from '../../components/production/BatchDetailsDialog';
import { FinalizePlanningDialog } from '../../components/production/FinalizePlanningDialog';
import { FinalizeProductionDialog } from '../../components/production/FinalizeProductionDialog';
import { DeleteBatchDialog } from '../../components/production/DeleteBatchDialog';

export function BatchesList() {
  const { t } = useTranslation('batches');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [finalizePlanningDialogOpen, setFinalizePlanningDialogOpen] = useState(false);
  const [finalizeProductionDialogOpen, setFinalizeProductionDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Selected batch states
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [selectedBatchDetails, setSelectedBatchDetails] = useState<BatchWithEvents | null>(null);

  // Products for dropdown
  const [products, setProducts] = useState<{ _id: string; code: string; name: string }[]>([]);

  useEffect(() => {
    fetchBatches();
    fetchProducts();
  }, []);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await batchService.getBatches();
      setBatches(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load batches');
      setBatches([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await productService.getAllProducts({ page: 1, limit: 100 });
      setProducts(data.products.map((p) => ({ _id: p._id!, code: p.code, name: p.name })));
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  const handleViewDetails = async (batch: Batch) => {
    try {
      const details = await batchService.getBatch(batch._id);
      setSelectedBatchDetails(details);
      setDetailsDialogOpen(true);
    } catch (err) {
      console.error('Failed to fetch batch details:', err);
    }
  };

  const handleStartProduction = (batch: Batch) => {
    setSelectedBatch(batch);
    setFinalizePlanningDialogOpen(true);
  };

  const handleCompleteProduction = (batch: Batch) => {
    setSelectedBatch(batch);
    setFinalizeProductionDialogOpen(true);
  };

  const handleDelete = (batch: Batch) => {
    setSelectedBatch(batch);
    setDeleteDialogOpen(true);
  };

  const filteredBatches = batches.filter((batch) => {
    const matchesSearch =
      batch.batchNumber.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.productId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.productId?.code?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || batch.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, 'default' | 'secondary' | 'outline'> = {
      planning: 'secondary',
      production: 'default',
      done: 'outline',
    };
    return colorMap[status] || 'outline';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">{t('title')}</h1>
          <p className="text-gray-500">{t('description')}</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="size-4 mr-2" />
          {t('createBatch')}
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <Input
                placeholder={t('searchPlaceholder')}
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('filters.allStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.allStatus')}</SelectItem>
                <SelectItem value="planning">{t('filters.planning')}</SelectItem>
                <SelectItem value="production">{t('filters.production')}</SelectItem>
                <SelectItem value="done">{t('filters.done')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-center text-gray-500">{t('loading')}</div>
          ) : filteredBatches.length === 0 ? (
            <div className="p-6 text-center text-gray-500">{t('noResults')}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('table.batchNumber')}</TableHead>
                  <TableHead>{t('table.product')}</TableHead>
                  <TableHead>{t('table.plannedQty')}</TableHead>
                  <TableHead>{t('table.producedQty')}</TableHead>
                  <TableHead>{t('table.loss')}</TableHead>
                  <TableHead>{t('table.status')}</TableHead>
                  <TableHead>{t('table.startDate')}</TableHead>
                  <TableHead>{t('table.endDate')}</TableHead>
                  <TableHead className="text-right">{t('table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBatches.map((batch) => {
                  const loss =
                    batch.producedQuantity !== undefined
                      ? batch.plannedQuantity - batch.producedQuantity
                      : 0;

                  return (
                    <TableRow key={batch._id}>
                      <TableCell className="font-mono font-medium">#{batch.batchNumber}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{batch.productId?.name || 'N/A'}</p>
                          <p className="text-sm text-gray-500">{batch.productId?.code || '-'}</p>
                        </div>
                      </TableCell>
                      <TableCell>{batch.plannedQuantity}</TableCell>
                      <TableCell>
                        {batch.producedQuantity !== undefined ? batch.producedQuantity : '-'}
                      </TableCell>
                      <TableCell>
                        {loss > 0 ? (
                          <Badge variant="destructive">{loss}</Badge>
                        ) : (
                          <span>{loss}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(batch.status)}>
                          {t(`filters.${batch.status}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(batch.startDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {batch.endDate ? new Date(batch.endDate).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(batch)}
                          >
                            <Eye className="size-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                              >
                                <MoreVertical className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {batch.status === 'planning' && (
                                <DropdownMenuItem onClick={() => handleStartProduction(batch)}>
                                  <Play className="size-4 mr-2" />
                                  {t('actions.finalizePlanning')}
                                </DropdownMenuItem>
                              )}
                              {batch.status === 'production' && (
                                <DropdownMenuItem onClick={() => handleCompleteProduction(batch)}>
                                  <CheckCircle className="size-4 mr-2" />
                                  {t('actions.finalizeProduction')}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => handleDelete(batch)}
                                className="text-red-600"
                              >
                                <Trash2 className="size-4 mr-2" />
                                {t('actions.delete')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateBatchDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={fetchBatches}
        products={products}
      />

      <BatchDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        batchData={selectedBatchDetails}
      />

      {selectedBatch && (
        <>
          <FinalizePlanningDialog
            open={finalizePlanningDialogOpen}
            onOpenChange={setFinalizePlanningDialogOpen}
            batchId={selectedBatch._id}
            batchNumber={selectedBatch.batchNumber}
            onSuccess={fetchBatches}
          />

          <FinalizeProductionDialog
            open={finalizeProductionDialogOpen}
            onOpenChange={setFinalizeProductionDialogOpen}
            batchId={selectedBatch._id}
            batchNumber={selectedBatch.batchNumber}
            plannedQuantity={selectedBatch.plannedQuantity}
            onSuccess={fetchBatches}
          />

          <DeleteBatchDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            batchId={selectedBatch._id}
            batchNumber={selectedBatch.batchNumber}
            onSuccess={fetchBatches}
          />
        </>
      )}
    </div>
  );
}
