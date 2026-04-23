import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../ui/dialog';
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';

interface RenameEntityDialogProps {
  open: boolean;
  title: string;
  description?: string;
  initialValue: string;
  submitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (nextValue: string) => Promise<void>;
}

export function RenameEntityDialog({
  open,
  title,
  description,
  initialValue,
  submitting,
  onOpenChange,
  onSubmit,
}: RenameEntityDialogProps) {
  const { t } = useTranslation('stock');
  const [value, setValue] = useState('');

  useEffect(() => {
    if (open) {
      setValue(initialValue);
    }
  }, [initialValue, open]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || trimmed === initialValue.trim()) {
      onOpenChange(false);
      return;
    }

    await onSubmit(trimmed);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <Input
            autoFocus
            value={value}
            onChange={(event) => setValue(event.target.value)}
            className="border-[--border-default] bg-[--bg-card] shadow-sm focus-visible:border-[--primary-500] focus-visible:ring-[--primary-500]/30"
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              {t('adjustStock.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={submitting}
            >
              {submitting ? t('locationManagement.saving') : t('locationManagement.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
