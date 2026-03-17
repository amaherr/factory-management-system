import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Plus } from 'lucide-react';
import { customerService, type Customer } from '../../services/customers';
import { toast } from 'sonner';

interface AddCustomerDialogProps {
  onCustomerAdded: (customer: Customer) => void;
}

export function AddCustomerDialog({ onCustomerAdded }: AddCustomerDialogProps) {
  const { t } = useTranslation('customers');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    phoneNumber: '',
    address: {
      country: '',
      governate: '',
      city: '',
      street: '',
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        address: { ...prev.address, [addressField]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (!formData.name.trim()) {
        throw new Error(t('customer_name_required'));
      }
      if (!formData.phoneNumber.trim()) {
        throw new Error(t('phone_number_required'));
      }
      if (
        !formData.address.country.trim() ||
        !formData.address.governate.trim() ||
        !formData.address.city.trim() ||
        !formData.address.street.trim()
      ) {
        throw new Error(t('address_fields_required'));
      }

      const newCustomer = await customerService.createCustomer({
        name: formData.name.trim(),
        company: formData.company.trim() || undefined,
        phoneNumber: formData.phoneNumber.trim(),
        address: {
          country: formData.address.country.trim(),
          governate: formData.address.governate.trim(),
          city: formData.address.city.trim(),
          street: formData.address.street.trim(),
        },
      });

      toast.success(t('customer_created_successfully'));
      onCustomerAdded(newCustomer);
      setOpen(false);
      setFormData({
        name: '',
        company: '',
        phoneNumber: '',
        address: {
          country: '',
          governate: '',
          city: '',
          street: '',
        },
      });
    } catch (error: any) {
      toast.error(error.message || t('failed_to_create_customer'));
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
          {t('add_customer')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('add_customer')}</DialogTitle>
          <DialogDescription>{t('enter_customer_details')}</DialogDescription>
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
              value={formData.name}
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
              value={formData.company}
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
              value={formData.phoneNumber}
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
                value={formData.address.country}
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
                value={formData.address.governate}
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
                value={formData.address.city}
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
                value={formData.address.street}
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
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? t('creating') : t('create_customer')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
