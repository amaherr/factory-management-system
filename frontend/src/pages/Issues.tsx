import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
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
import { Badge } from '../components/ui/badge';
import { Search, Eye, Loader2, Pencil, Trash2, CheckCircle } from 'lucide-react';
import { AddIssueDialog } from '../components/issues/AddIssueDialog';
import { IssueDetailsDialog } from '../components/issues/IssueDetailsDialog';
import { EditIssueDialog } from '../components/issues/EditIssueDialog';
import { DeleteIssueDialog } from '../components/issues/DeleteIssueDialog';
import { ChangeIssueStatusDialog } from '../components/issues/ChangeIssueStatusDialog';
import { issueService, type Issue } from '../services/issues';
import { IssueStatus, IssueType } from '../services/enums/issue.enums';
import type { IssueStatus as IssueStatusValue } from '../services/enums/issue.enums';
import { useAuth } from '../contexts/AuthContext';
import { ROLES } from '../services/enums/user.enums';
import { toast } from 'sonner';

export function Issues() {
  const { t } = useTranslation('issues');
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'all' | 'my'>('all');
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deletingIssue, setDeletingIssue] = useState<Issue | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [changingStatusIssue, setChangingStatusIssue] = useState<Issue | null>(null);
  const [statusChangeOpen, setStatusChangeOpen] = useState(false);

  const isAdmin = user?.roles?.includes(ROLES.ADMIN);

  // Fetch issues
  const fetchIssues = async () => {
    setLoading(true);
    try {
      let data: Issue[];
      if (isAdmin && viewMode === 'all') {
        data = await issueService.getAllIssues();
      } else {
        data = await issueService.getUserIssues();
      }
      setIssues(data);
    } catch (error: any) {
      toast.error(error.message || t('failed_to_load_issues'));
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchIssues();
  }, [viewMode]);

  // Filter issues
  const filteredIssues = issues.filter((issue) => {
    const matchesSearch =
      issue.issueNumber.toString().includes(searchQuery.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.issueType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || issue.status === statusFilter;
    const matchesType = typeFilter === 'all' || issue.issueType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleIssueAdded = (newIssue: Issue) => {
    setIssues((prev) => [newIssue, ...prev]);
  };

  const handleViewDetails = (issue: Issue) => {
    setSelectedIssue(issue);
    setDetailsOpen(true);
  };

  const handleEditIssue = (issue: Issue) => {
    setEditingIssue(issue);
    setEditOpen(true);
  };

  const handleDeleteIssue = (issue: Issue) => {
    setDeletingIssue(issue);
    setDeleteOpen(true);
  };

  const handleChangeStatus = (issue: Issue) => {
    setChangingStatusIssue(issue);
    setStatusChangeOpen(true);
  };

  const handleIssueUpdated = (updatedIssue: Issue) => {
    setIssues((prev) => prev.map((i) => (i._id === updatedIssue._id ? updatedIssue : i)));
  };

  const handleIssueDeleted = (deletedId: string) => {
    setIssues((prev) => prev.filter((i) => i._id !== deletedId));
  };

  const handleStatusChanged = (updatedIssue: Issue) => {
    setIssues((prev) => prev.map((i) => (i._id === updatedIssue._id ? updatedIssue : i)));
  };

  const getStatusVariant = (status: IssueStatusValue) => {
    switch (status) {
      case IssueStatus.OPEN:
        return 'destructive';
      case IssueStatus.IN_PROGRESS:
        return 'default';
      case IssueStatus.RESOLVED:
        return 'secondary';
      case IssueStatus.CANCELLED:
        return 'outline';
      default:
        return 'default';
    }
  };

  const canEditIssue = (issue: Issue): boolean => {
    if (issue.status !== IssueStatus.OPEN) return false;
    const createdByUserId =
      typeof issue.createdByUserId === 'object' ? issue.createdByUserId._id : issue.createdByUserId;
    return createdByUserId === user?.id;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">{t('issues')}</h1>
          <p className="text-gray-500">{t('manage_issues')}</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <div className="flex gap-1 bg-muted p-1 rounded-lg">
              <Button
                variant={viewMode === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('all')}
              >
                {t('view_all_issues')}
              </Button>
              <Button
                variant={viewMode === 'my' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('my')}
              >
                {t('view_my_issues')}
              </Button>
            </div>
          )}
          <AddIssueDialog onIssueAdded={handleIssueAdded} />
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <Input
                placeholder={t('search_placeholder')}
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={loading}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('filter_by_status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('all_status')}</SelectItem>
                <SelectItem value={IssueStatus.OPEN}>{t('open')}</SelectItem>
                <SelectItem value={IssueStatus.IN_PROGRESS}>{t('in progress')}</SelectItem>
                <SelectItem value={IssueStatus.RESOLVED}>{t('resolved')}</SelectItem>
                <SelectItem value={IssueStatus.CANCELLED}>{t('cancelled')}</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={typeFilter}
              onValueChange={setTypeFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('filter_by_type')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('all_types')}</SelectItem>
                <SelectItem value={IssueType.INVENTORY_DISCREPANCY}>
                  {t('inventory discrepancy')}
                </SelectItem>
                <SelectItem value={IssueType.DAMAGED_GOODS}>{t('damaged goods')}</SelectItem>
                <SelectItem value={IssueType.SYSTEM_BUG}>{t('system bug')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('issue_number')}</TableHead>
                <TableHead>{t('issue_type')}</TableHead>
                <TableHead>{t('description')}</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead>{t('created_by')}</TableHead>
                <TableHead>{t('created_at')}</TableHead>
                <TableHead className="text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      <span>{t('loading_issues')}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredIssues.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {t('no_issues_found')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredIssues.map((issue) => {
                  const createdByName =
                    typeof issue.createdByUserId === 'object'
                      ? issue.createdByUserId.name
                      : 'Unknown';

                  return (
                    <TableRow key={issue._id}>
                      <TableCell className="font-medium">#{issue.issueNumber}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{t(issue.issueType)}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="line-clamp-2 max-w-xs">{issue.description}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(issue.status)}>{t(issue.status)}</Badge>
                      </TableCell>
                      <TableCell>{createdByName}</TableCell>
                      <TableCell>
                        {issue.createdAt ? new Date(issue.createdAt).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(issue)}
                          >
                            <Eye className="size-4" />
                          </Button>
                          {canEditIssue(issue) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditIssue(issue)}
                            >
                              <Pencil className="size-4" />
                            </Button>
                          )}
                          {isAdmin && issue.status === IssueStatus.OPEN && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleChangeStatus(issue)}
                            >
                              <CheckCircle className="size-4" />
                            </Button>
                          )}
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteIssue(issue)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <IssueDetailsDialog
        issue={selectedIssue}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
      <EditIssueDialog
        issue={editingIssue}
        open={editOpen}
        onOpenChange={setEditOpen}
        onIssueUpdated={handleIssueUpdated}
      />
      <DeleteIssueDialog
        issue={deletingIssue}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onIssueDeleted={handleIssueDeleted}
      />
      <ChangeIssueStatusDialog
        issue={changingStatusIssue}
        open={statusChangeOpen}
        onOpenChange={setStatusChangeOpen}
        onStatusChanged={handleStatusChanged}
      />
    </div>
  );
}
