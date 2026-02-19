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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Label } from '../ui/label';
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
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{t('current_status')}</Label>
            <p className="text-sm font-semibold">{t(issue.status)}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="newStatus">{t('new_status')}</Label>
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
          >
            {loading ? t('updating') : t('change_status')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
