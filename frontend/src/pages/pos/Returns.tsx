import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, FilePenLine, Loader2, Plus, Search, Settings, Trash2 } from 'lucide-react';
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
import { CreateReturnModal } from '../../components/returns/CreateReturnModal';
import { ReturnDetailsModal } from '../../components/returns/ReturnDetailsModal';
import { EditReturnModal } from '../../components/returns/EditReturnModal';
import { ChangeReturnStatusModal } from '../../components/returns/ChangeReturnStatusModal';
import { DeleteReturnModal } from '../../components/returns/DeleteReturnModal';

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
        const data = await returnService.getReturns();
        setReturns(data);
      } catch (error: any) {
        toast.error(error.message || t('returns.toasts.generalError'));
      } finally {
        setLoading(false);
      }
    };

    fetchReturns();
  }, [refreshTrigger, t]);

  const filteredReturns = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return returns.filter((item) => {
      const statusMatch = statusFilter === 'all' || item.status === statusFilter;
      if (!statusMatch) return false;

      if (!query) return true;

      const returnNumber = String(item.returnNumber).toLowerCase();
      const orderNumber = getOrderNumber(item.orderId).toLowerCase();
      const note = (item.note || '').toLowerCase();
      const createdBy = getCreatedBy(item.userId).toLowerCase();

      return (
        returnNumber.includes(query) ||
        orderNumber.includes(query) ||
        note.includes(query) ||
        createdBy.includes(query)
      );
    });
  }, [returns, searchQuery, statusFilter]);

  const refresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('returns.searchPlaceholder')}
                className="pl-10"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger>
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
          ) : filteredReturns.length === 0 ? (
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
                {filteredReturns.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell className="font-medium">#{item.returnNumber}</TableCell>
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
                          variant="ghost"
                          size="sm"
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
                            title={t('returns.actions.edit')}
                            onClick={() => {
                              setSelectedReturn(item);
                              setEditOpen(true);
                            }}
                          >
                            <FilePenLine className="size-4" />
                          </Button>
                        )}

                        {canChangeStatus && item.status === 'draft' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title={t('returns.actions.changeStatus')}
                            onClick={() => {
                              setSelectedReturn(item);
                              setStatusOpen(true);
                            }}
                          >
                            <Settings className="size-4" />
                          </Button>
                        )}

                        {canDelete && item.status === 'draft' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title={t('returns.actions.delete')}
                            className="text-destructive hover:text-destructive"
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
        </CardContent>
      </Card>

      <CreateReturnModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={refresh}
      />

      <ReturnDetailsModal
        open={detailsOpen}
        onOpenChange={(open) => {
          setDetailsOpen(open);
          if (!open) setSelectedReturn(null);
        }}
        returnRecord={selectedReturn}
      />

      <EditReturnModal
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setSelectedReturn(null);
        }}
        returnRecord={selectedReturn}
        onSuccess={refresh}
      />

      <ChangeReturnStatusModal
        open={statusOpen}
        onOpenChange={(open) => {
          setStatusOpen(open);
          if (!open) setSelectedReturn(null);
        }}
        returnRecord={selectedReturn}
        onSuccess={refresh}
      />

      <DeleteReturnModal
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
