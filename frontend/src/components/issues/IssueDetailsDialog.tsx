import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import type { Issue } from '../../services/issues';
import { IssueStatus } from '../../services/enums/issue.enums';
import type { IssueStatus as IssueStatusValue } from '../../services/enums/issue.enums';

interface IssueDetailsDialogProps {
  issue: Issue | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IssueDetailsDialog({ issue, open, onOpenChange }: IssueDetailsDialogProps) {
  const { t } = useTranslation('issues');

  if (!issue) return null;

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

  const createdByName =
    typeof issue.createdByUserId === 'object' ? issue.createdByUserId.name : 'Unknown';
  const resolvedByName =
    issue.resolvedByUserId && typeof issue.resolvedByUserId === 'object'
      ? issue.resolvedByUserId.name
      : null;
  const cancelledByName =
    issue.cancelledByUserId && typeof issue.cancelledByUserId === 'object'
      ? issue.cancelledByUserId.name
      : null;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('issue_details')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{t('issue_number')}</p>
              <p className="font-semibold">#{issue.issueNumber}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('status')}</p>
              <Badge variant={getStatusVariant(issue.status)}>{t(issue.status)}</Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{t('issue_type')}</p>
              <p className="font-semibold">{t(issue.issueType)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('created_by')}</p>
              <p className="font-semibold">{createdByName}</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-1">{t('description')}</p>
            <p className="text-sm bg-muted p-3 rounded-md">{issue.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{t('created_at')}</p>
              <p className="font-semibold">
                {issue.createdAt ? new Date(issue.createdAt).toLocaleString() : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('updated_at')}</p>
              <p className="font-semibold">
                {issue.updatedAt ? new Date(issue.updatedAt).toLocaleString() : '-'}
              </p>
            </div>
          </div>

          {issue.status === IssueStatus.RESOLVED && (
            <div className="border-t pt-4">
              <p className="text-sm font-semibold mb-3 text-green-600">{t('resolution_info')}</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {resolvedByName && (
                  <div>
                    <p className="text-muted-foreground">{t('resolved_by')}</p>
                    <p className="font-semibold">{resolvedByName}</p>
                  </div>
                )}
                {issue.resolvedAt && (
                  <div>
                    <p className="text-muted-foreground">{t('resolved_at')}</p>
                    <p className="font-semibold">{new Date(issue.resolvedAt).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {issue.status === IssueStatus.CANCELLED && (
            <div className="border-t pt-4">
              <p className="text-sm font-semibold mb-3 text-red-600">{t('cancellation_info')}</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {cancelledByName && (
                  <div>
                    <p className="text-muted-foreground">{t('cancelled_by')}</p>
                    <p className="font-semibold">{cancelledByName}</p>
                  </div>
                )}
                {issue.cancelledAt && (
                  <div>
                    <p className="text-muted-foreground">{t('cancelled_at')}</p>
                    <p className="font-semibold">{new Date(issue.cancelledAt).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t('close')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
