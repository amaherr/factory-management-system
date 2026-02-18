import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import type { Customer } from '../../services/customers';

interface CustomerDetailsDialogProps {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomerDetailsDialog({
  customer,
  open,
  onOpenChange,
}: CustomerDetailsDialogProps) {
  const { t } = useTranslation('customers');
  if (!customer) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('customer_details')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{t('customer_name')}</p>
              <p className="font-semibold">{customer.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('phone')}</p>
              <p className="font-semibold">{customer.phoneNumber}</p>
            </div>
          </div>

          {customer.company && (
            <div>
              <p className="text-sm text-muted-foreground">{t('company')}</p>
              <p className="font-semibold">{customer.company}</p>
            </div>
          )}

          <div className="border-t pt-4">
            <p className="text-sm font-semibold mb-3">Address</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Country</p>
                <p>{customer.address.country}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Governate</p>
                <p>{customer.address.governate}</p>
              </div>
              <div>
                <p className="text-muted-foreground">City</p>
                <p>{customer.address.city}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Street</p>
                <p>{customer.address.street}</p>
              </div>
            </div>
          </div>

          {customer.createdAt && (
            <div className="text-xs text-muted-foreground pt-4 border-t">
              <p>
                {t('created')}: {new Date(customer.createdAt).toLocaleDateString()}
              </p>
              {customer.updatedAt && (
                <p>
                  {t('updated')}: {new Date(customer.updatedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            {t('close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
