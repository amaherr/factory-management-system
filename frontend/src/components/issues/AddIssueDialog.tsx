import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Plus } from 'lucide-react';
import { issueService, type Issue } from '../../services/issues';
import { IssueType } from '../../services/enums/issue.enums';
import type { IssueType as IssueTypeValue } from '../../services/enums/issue.enums';
import { toast } from 'sonner';

interface AddIssueDialogProps {
  onIssueAdded: (issue: Issue) => void;
}

export function AddIssueDialog({ onIssueAdded }: AddIssueDialogProps) {
  const { t } = useTranslation('issues');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    issueType: '' as IssueTypeValue | '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      const newIssue = await issueService.createIssue({
        issueType: formData.issueType as IssueTypeValue,
        description: formData.description.trim(),
      });

      toast.success(t('issue_created_successfully'));
      onIssueAdded(newIssue);
      setOpen(false);
      setFormData({
        issueType: '',
        description: '',
      });
    } catch (error: any) {
      toast.error(error.message || t('failed_to_create_issue'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4 mr-2" />
          {t('report_issue')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('report_issue')}</DialogTitle>
          <DialogDescription>{t('enter_issue_details')}</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="issueType">{t('issue_type_label')}</Label>
            <Select
              value={formData.issueType}
              onValueChange={(value) =>
                setFormData({ ...formData, issueType: value as IssueTypeValue })
              }
            >
              <SelectTrigger id="issueType">
                <SelectValue placeholder={t('select_issue_type')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={IssueType.INVENTORY_DISCREPANCY}>
                  {t(IssueType.INVENTORY_DISCREPANCY)}
                </SelectItem>
                <SelectItem value={IssueType.DAMAGED_GOODS}>
                  {t(IssueType.DAMAGED_GOODS)}
                </SelectItem>
                <SelectItem value={IssueType.SYSTEM_BUG}>{t(IssueType.SYSTEM_BUG)}</SelectItem>
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
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? t('creating') : t('create_issue')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
