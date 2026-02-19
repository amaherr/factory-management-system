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
import { issueService, type Issue } from '../../services/issues';
import { toast } from 'sonner';

interface DeleteIssueDialogProps {
  issue: Issue | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIssueDeleted: (issueId: string) => void;
}

export function DeleteIssueDialog({
  issue,
  open,
  onOpenChange,
  onIssueDeleted,
}: DeleteIssueDialogProps) {
  const { t } = useTranslation('issues');
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!issue?._id) return;

    setLoading(true);

    try {
      await issueService.deleteIssue(issue._id);

      toast.success(t('issue_deleted_successfully'));
      onIssueDeleted(issue._id);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || t('failed_to_delete_issue'));
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
          <AlertDialogTitle>{t('delete_issue_title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('delete_issue_message')}
            <br />
            <br />
            <span className="font-semibold">
              {t('delete_issue_warning', { issueNumber: issue.issueNumber })}
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {t('cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? t('deleting') : t('delete')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
