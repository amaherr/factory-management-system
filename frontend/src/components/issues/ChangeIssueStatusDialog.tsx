import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { issueService, type Issue } from '../../services/issues';
import { IssueStatus } from '../../services/enums/issue.enums';
import type { IssueStatus as IssueStatusValue } from '../../services/enums/issue.enums';
import { toast } from 'sonner';

interface ChangeIssueStatusDialogProps {
  issue: Issue | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChanged: (issue: Issue) => void;
}

export function ChangeIssueStatusDialog({
  issue,
  open,
  onOpenChange,
  onStatusChanged,
}: ChangeIssueStatusDialogProps) {
  const { t } = useTranslation('issues');
  const [loading, setLoading] = useState(false);
  const [newStatus, setNewStatus] = useState<IssueStatusValue | ''>('');

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
        return 'outline';
    }
  };

  const handleSubmit = async () => {
    if (!issue?._id || !newStatus) return;

    setLoading(true);

    try {
      const updatedIssue = await issueService.changeIssueStatus(issue._id, newStatus);

      toast.success(t('status_changed_successfully'));
      onStatusChanged(updatedIssue);
      onOpenChange(false);
      setNewStatus('');
    } catch (error: any) {
      toast.error(error.message || t('failed_to_change_status'));
    } finally {
      setLoading(false);
    }
  };

  if (!issue) return null;

  return (
    <AlertDialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('change_status_title')}</AlertDialogTitle>
          <AlertDialogDescription>{t('change_status_description')}</AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t('issue_summary')}
            </p>
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-muted-foreground">{t('issue_number')}:</span>{' '}
                <span className="font-medium">#{issue.issueNumber}</span>
              </p>
              <p>
                <span className="text-muted-foreground">{t('issue_type')}:</span>{' '}
                <span className="font-medium">{t(issue.issueType)}</span>
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 rounded-lg border p-3">
              <Label>{t('current_status')}</Label>
              <div>
                <Badge variant={getStatusVariant(issue.status)}>{t(issue.status)}</Badge>
              </div>
            </div>
            <div className="space-y-2 rounded-lg border p-3">
              <Label>{t('new_status')}</Label>
              <Select
                value={newStatus}
                onValueChange={(value) => setNewStatus(value as IssueStatusValue)}
              >
                <SelectTrigger id="newStatus">
                  <SelectValue placeholder={t('select_new_status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={IssueStatus.RESOLVED}>{t('resolved')}</SelectItem>
                  <SelectItem value={IssueStatus.CANCELLED}>{t('cancelled')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
            {t('status_update_note')}
          </div>
        </div>

        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setNewStatus('');
            }}
            disabled={loading}
          >
            {t('cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !newStatus}
            className="min-w-28"
          >
            {loading ? t('updating') : t('change_status')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
