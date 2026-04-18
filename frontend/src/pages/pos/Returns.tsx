import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Eye,
  Loader2,
  Pencil,
  Plus,
  Search,
  Settings2,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  FileDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import type { ReturnRecord } from '../../services/returns';
import { returnService } from '../../services/returns';
import { ROLES } from '../../services/enums/user.enums';
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
import { CreateReturnDialog } from '../../components/pos/returns/CreateReturnDialog';
import { ReturnDetailsDialog } from '../../components/pos/returns/ReturnDetailsDialog';
import { EditReturnDialog } from '../../components/pos/returns/EditReturnDialog';
import { ChangeReturnStatusDialog } from '../../components/pos/returns/ChangeReturnStatusDialog';
import { DeleteReturnDialog } from '../../components/pos/returns/DeleteReturnDialog';

function getStatusColor(status: string): string {
  if (status === 'finalized') return 'bg-green-100 text-green-800';
  if (status === 'draft') return 'bg-yellow-100 text-yellow-800';
  if (status === 'cancelled') return 'bg-red-100 text-red-800';
  return 'bg-gray-100 text-gray-800';
}

function getOrderNumber(orderId: ReturnRecord['orderId']): string {
  if (typeof orderId === 'string') return '-';
  return orderId.orderNumber != null ? `#${orderId.orderNumber}` : '-';
}

function getCreatedBy(userId: ReturnRecord['userId']): string {
  if (typeof userId === 'string') return userId;
  return userId.name || userId.email || userId._id;
}

export function Returns() {
  const { t } = useTranslation('pos');
  const { user } = useAuth();

  const roles = user?.roles ?? [];
  const canCreate = roles.includes(ROLES.ADMIN) || roles.includes(ROLES.SALES);
  const canEdit = roles.includes(ROLES.ADMIN) || roles.includes(ROLES.SALES);
  const canDelete = roles.includes(ROLES.ADMIN);
  const canChangeStatus = roles.includes(ROLES.ADMIN) || roles.includes(ROLES.ACCOUNTING);

  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [createOpen, setCreateOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [selectedReturn, setSelectedReturn] = useState<ReturnRecord | null>(null);

  useEffect(() => {
    const fetchReturns = async () => {
      setLoading(true);
      try {
        const data = await returnService.getReturns({
          status: statusFilter,
          query: searchQuery.trim() || undefined,
          page: currentPage,
          limit,
        });

        setReturns(data.returns);
        setTotal(data.total);
        setTotalPages(data.pages);

        if (data.pages > 0 && currentPage > data.pages) {
          setCurrentPage(data.pages);
        }
      } catch (error: any) {
        toast.error(error.message || t('returns.toasts.generalError'));
      } finally {
        setLoading(false);
      }
    };

    fetchReturns();
  }, [refreshTrigger, t, statusFilter, searchQuery, currentPage, limit]);

  const formatReturnNumber = (returnNumber: number | string) =>
    `#${t('returns.numberPrefix')} - ${returnNumber}`;

  const refresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const downloadBlobFile = (blob: Blob, fileName: string) => {
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadInvoice = async (returnId: string) => {
    try {
      const { blob, fileName } = await returnService.downloadInvoice(returnId);
      downloadBlobFile(blob, fileName);
      toast.success(t('returns.toasts.invoiceDownloaded'));
    } catch (error: any) {
      toast.error(error.message || t('returns.toasts.invoiceDownloadFailed'));
    }
  };

  const from = total === 0 ? 0 : (currentPage - 1) * limit + 1;
  const to = Math.min(currentPage * limit, total);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">{t('returns.title')}</h1>
          <p className="text-gray-500">{t('returns.description')}</p>
        </div>

        {canCreate && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4 mr-2" />
            {t('returns.createButton')}
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1.6fr)_220px] md:items-center">
            <div className="relative max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={t('returns.searchPlaceholder')}
                className="h-9 rounded-md border-[--border-default] bg-[--bg-secondary] pl-9 pr-9 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-[--primary-500]/30"
              />
              {searchQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 size-7 -translate-y-1/2 p-0 text-muted-foreground hover:bg-black/5"
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  title={t('clearSearch')}
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-9 rounded-md">
                <SelectValue placeholder={t('returns.statusFilterLabel')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('returns.allStatus')}</SelectItem>
                <SelectItem value="draft">{t('returns.status.draft')}</SelectItem>
                <SelectItem value="finalized">{t('returns.status.finalized')}</SelectItem>
                <SelectItem value="cancelled">{t('returns.status.cancelled')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : returns.length === 0 ? (
            <div className="text-center py-12 text-gray-500">{t('returns.noReturns')}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('returns.table.returnNumber')}</TableHead>
                  <TableHead>{t('returns.table.orderNumber')}</TableHead>
                  <TableHead>{t('returns.table.status')}</TableHead>
                  <TableHead>{t('returns.table.itemsCount')}</TableHead>
                  <TableHead>{t('returns.table.createdBy')}</TableHead>
                  <TableHead>{t('returns.table.returnDate')}</TableHead>
                  <TableHead className="text-right">{t('returns.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {returns.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell className="font-medium">
                      {formatReturnNumber(item.returnNumber)}
                    </TableCell>
                    <TableCell>{getOrderNumber(item.orderId)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(item.status)}>
                        {t(`returns.status.${item.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.items.length}</TableCell>
                    <TableCell>{getCreatedBy(item.userId)}</TableCell>
                    <TableCell>{new Date(item.returnDate).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                          title={t('returns.actions.downloadInvoice')}
                          onClick={() => handleDownloadInvoice(item._id)}
                        >
                          <FileDown className="size-4" />
                          <span className="ml-1.5 hidden lg:inline">
                            {t('returns.actions.downloadInvoice')}
                          </span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-black hover:bg-black/10"
                          title={t('returns.actions.viewDetails')}
                          onClick={() => {
                            setSelectedReturn(item);
                            setDetailsOpen(true);
                          }}
                        >
                          <Eye className="size-4" />
                        </Button>

                        {canEdit && item.status === 'draft' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-700 hover:bg-blue-50"
                            title={t('returns.actions.edit')}
                            onClick={() => {
                              setSelectedReturn(item);
                              setEditOpen(true);
                            }}
                          >
                            <Pencil className="size-4" />
                          </Button>
                        )}

                        {canChangeStatus && item.status === 'draft' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-700 hover:bg-blue-50"
                            title={t('returns.actions.changeStatus')}
                            onClick={() => {
                              setSelectedReturn(item);
                              setStatusOpen(true);
                            }}
                          >
                            <Settings2 className="size-4" />
                          </Button>
                        )}

                        {canDelete && item.status === 'draft' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title={t('returns.actions.delete')}
                            className="text-red-700 hover:bg-red-50"
                            onClick={() => {
                              setSelectedReturn(item);
                              setDeleteOpen(true);
                            }}
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
          )}

          {!loading && total > 0 && (
            <div className="border-t p-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {t('returns.pagination.showing', {
                  from,
                  to,
                  total,
                })}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={loading || currentPage <= 1}
                >
                  <ChevronLeft className="size-4 mr-1" />
                  {t('returns.pagination.previous')}
                </Button>
                <div className="flex items-center gap-2 px-3 py-1">
                  <span className="text-sm">
                    {t('returns.pagination.page', {
                      current: totalPages === 0 ? 0 : currentPage,
                      total: totalPages,
                    })}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={loading || totalPages === 0 || currentPage >= totalPages}
                >
                  {t('returns.pagination.next')}
                  <ChevronRight className="size-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateReturnDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={refresh}
      />

      <ReturnDetailsDialog
        open={detailsOpen}
        onOpenChange={(open) => {
          setDetailsOpen(open);
          if (!open) setSelectedReturn(null);
        }}
        returnRecord={selectedReturn}
      />

      <EditReturnDialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setSelectedReturn(null);
        }}
        returnRecord={selectedReturn}
        onSuccess={refresh}
      />

      <ChangeReturnStatusDialog
        open={statusOpen}
        onOpenChange={(open) => {
          setStatusOpen(open);
          if (!open) setSelectedReturn(null);
        }}
        returnRecord={selectedReturn}
        onSuccess={refresh}
      />

      <DeleteReturnDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setSelectedReturn(null);
        }}
        returnRecord={selectedReturn}
        onSuccess={refresh}
      />
    </div>
  );
}
