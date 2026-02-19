import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { issueService, type Issue } from '../../services/issues';
import { IssueType } from '../../services/enums/issue.enums';
import type { IssueType as IssueTypeValue } from '../../services/enums/issue.enums';
import { toast } from 'sonner';

interface EditIssueDialogProps {
  issue: Issue | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIssueUpdated: (issue: Issue) => void;
}

export function EditIssueDialog({
  issue,
  open,
  onOpenChange,
  onIssueUpdated,
}: EditIssueDialogProps) {
  const { t } = useTranslation('issues');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    issueType: '' as IssueTypeValue | '',
    description: '',
  });

  useEffect(() => {
    if (issue) {
      setFormData({
        issueType: issue.issueType,
        description: issue.description,
      });
    }
  }, [issue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issue?._id) return;

    setLoading(true);

    try {
      // Validation
      if (!formData.issueType) {
        throw new Error(t('issue_type_required'));
      }
      if (!formData.description.trim()) {
        throw new Error(t('description_required'));
      }
      if (formData.description.length > 200) {
        throw new Error(t('description_too_long'));
      }

      const updates: { issueType?: IssueTypeValue; description?: string } = {};

      if (formData.issueType !== issue.issueType) {
        updates.issueType = formData.issueType;
      }
      if (formData.description.trim() !== issue.description) {
        updates.description = formData.description.trim();
      }

      if (Object.keys(updates).length === 0) {
        throw new Error(t('no_changes_made'));
      }

      const updatedIssue = await issueService.editUserIssue(issue._id, updates);

      toast.success(t('issue_updated_successfully'));
      onIssueUpdated(updatedIssue);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || t('failed_to_update_issue'));
    } finally {
      setLoading(false);
    }
  };

  if (!issue) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('edit_issue')}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="issueType">{t('issue_type_label')}</Label>
            <Select
              value={formData.issueType}
              onValueChange={(value) => setFormData({ ...formData, issueType: value as IssueTypeValue })}
            >
              <SelectTrigger id="issueType">
                <SelectValue placeholder={t('select_issue_type')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={IssueType.INVENTORY_DISCREPANCY}>
                  {t('inventory_discrepancy')}
                </SelectItem>
                <SelectItem value={IssueType.DAMAGED_GOODS}>{t('damaged_goods')}</SelectItem>
                <SelectItem value={IssueType.SYSTEM_BUG}>{t('system_bug')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('description_label')}</Label>
            <Textarea
              id="description"
              placeholder={t('description_placeholder')}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              maxLength={200}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {formData.description.length}/200 {t('characters')}
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? t('updating') : t('update_issue')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
