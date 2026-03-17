import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { customerService, type Customer } from '../../services/customers';
import { toast } from 'sonner';
import React from 'react';

interface EditCustomerDialogProps {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCustomerUpdated: (customer: Customer) => void;
}

export function EditCustomerDialog({
  customer,
  open,
  onOpenChange,
  onCustomerUpdated,
}: EditCustomerDialogProps) {
  const { t } = useTranslation('customers');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Customer> | null>(null);

  // Initialize form data when customer changes
  React.useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name,
        company: customer.company || '',
        phoneNumber: customer.phoneNumber,
        address: { ...customer.address },
      });
    }
  }, [customer, open]);

  if (!customer || !formData) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData((prev) =>
        prev
          ? {
              ...prev,
              address: { ...prev.address!, [addressField]: value },
            }
          : null,
      );
    } else {
      setFormData((prev) => (prev ? { ...prev, [name]: value } : null));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.name?.trim()) {
        throw new Error(t('customer_name_required'));
      }
      if (!formData.phoneNumber?.trim()) {
        throw new Error(t('phone_number_required'));
      }
      if (
        !formData.address?.country?.trim() ||
        !formData.address?.governate?.trim() ||
        !formData.address?.city?.trim() ||
        !formData.address?.street?.trim()
      ) {
        throw new Error(t('address_fields_required'));
      }

      const updatedCustomer = await customerService.editCustomer(customer._id!, {
        name: formData.name.trim(),
        company: formData.company?.trim() || undefined,
        phoneNumber: formData.phoneNumber.trim(),
        address: {
          country: formData.address.country.trim(),
          governate: formData.address.governate.trim(),
          city: formData.address.city.trim(),
          street: formData.address.street.trim(),
        },
      });

      toast.success(t('customer_updated_successfully'));
      onCustomerUpdated(updatedCustomer);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || t('failed_to_update_customer'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('edit_customer')}</DialogTitle>
          <DialogDescription>{t('update_customer_details')}</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div className="grid gap-2 sm:grid-cols-[170px_1fr] sm:items-center">
            <Label
              htmlFor="name"
              className="sm:pb-0.5"
            >
              {t('customer_name_label')}
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name || ''}
              onChange={handleInputChange}
              placeholder={t('customer_name_placeholder')}
              required
              disabled={loading}
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-[170px_1fr] sm:items-center">
            <Label
              htmlFor="company"
              className="sm:pb-0.5"
            >
              {t('company_label')}
            </Label>
            <Input
              id="company"
              name="company"
              value={formData.company || ''}
              onChange={handleInputChange}
              placeholder={t('company_placeholder')}
              disabled={loading}
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-[170px_1fr] sm:items-center">
            <Label
              htmlFor="phoneNumber"
              className="sm:pb-0.5"
            >
              {t('phone_number_label')}
            </Label>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber || ''}
              onChange={handleInputChange}
              placeholder={t('phone_number_placeholder')}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-3 border-t pt-4">
            <p className="text-sm font-semibold">{t('address_information')}</p>

            <div className="grid gap-2 sm:grid-cols-[170px_1fr] sm:items-center">
              <Label
                htmlFor="country"
                className="sm:pb-0.5"
              >
                {t('country_label')}
              </Label>
              <Input
                id="country"
                name="address.country"
                value={formData.address?.country || ''}
                onChange={handleInputChange}
                placeholder={t('country_placeholder')}
                required
                disabled={loading}
              />
            </div>

            <div className="grid gap-2 sm:grid-cols-[170px_1fr] sm:items-center">
              <Label
                htmlFor="governate"
                className="sm:pb-0.5"
              >
                {t('governate_label')}
              </Label>
              <Input
                id="governate"
                name="address.governate"
                value={formData.address?.governate || ''}
                onChange={handleInputChange}
                placeholder={t('governate_placeholder')}
                required
                disabled={loading}
              />
            </div>

            <div className="grid gap-2 sm:grid-cols-[170px_1fr] sm:items-center">
              <Label
                htmlFor="city"
                className="sm:pb-0.5"
              >
                {t('city_label')}
              </Label>
              <Input
                id="city"
                name="address.city"
                value={formData.address?.city || ''}
                onChange={handleInputChange}
                placeholder={t('city_placeholder')}
                required
                disabled={loading}
              />
            </div>

            <div className="grid gap-2 sm:grid-cols-[170px_1fr] sm:items-center">
              <Label
                htmlFor="street"
                className="sm:pb-0.5"
              >
                {t('street_label')}
              </Label>
              <Input
                id="street"
                name="address.street"
                value={formData.address?.street || ''}
                onChange={handleInputChange}
                placeholder={t('street_placeholder')}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
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
              {loading ? t('updating') : t('update_customer_button')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
