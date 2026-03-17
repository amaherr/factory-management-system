import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('customer_details')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              {t('customer_profile')}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">{t('customer_name')}</p>
                <p className="font-semibold">{customer.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('phone')}</p>
                <p className="font-semibold">{customer.phoneNumber}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">{t('company')}</p>
                <p className="font-semibold">{customer.company || '-'}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">{t('city')}</p>
                <Badge variant="outline">{customer.address.city}</Badge>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              {t('address_information')}
            </p>
            <div className="grid gap-4 sm:grid-cols-2 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">{t('country')}</p>
                <p>{customer.address.country}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('governate')}</p>
                <p>{customer.address.governate}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('city')}</p>
                <p>{customer.address.city}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('street')}</p>
                <p>{customer.address.street}</p>
              </div>
            </div>
          </div>

          {customer.createdAt && (
            <div className="rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
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
