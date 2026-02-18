import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { customerService, type Customer } from '../../services/customers';
import { toast } from 'sonner';

interface DeleteCustomerDialogProps {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCustomerDeleted: (customerId: string) => void;
}

export function DeleteCustomerDialog({
  customer,
  open,
  onOpenChange,
  onCustomerDeleted,
}: DeleteCustomerDialogProps) {
  const { t } = useTranslation('customers');
  const [loading, setLoading] = useState(false);

  if (!customer) return null;

  const handleDelete = async () => {
    setLoading(true);
    try {
      await customerService.deleteCustomer(customer._id!);
      toast.success(t('customer_deleted_successfully'));
      onCustomerDeleted(customer._id!);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || t('failed_to_delete_customer'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('delete_confirmation_title')}</DialogTitle>
          <DialogDescription>{t('delete_confirmation_message')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-destructive/10 border border-destructive/20 rounded p-4">
            <p className="text-sm">{t('delete_confirmation_warning', { name: customer.name })}</p>
          </div>
          <div className="flex gap-2 justify-end">
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
              {loading ? t('deleting') : t('delete_customer')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
