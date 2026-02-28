import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { batchService, type CreateBatchData } from '../../services/batches';
import { toast } from 'sonner';

interface CreateBatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  products: { _id: string; code: string; name: string }[];
  orders?: { _id: string; orderNumber: number }[];
}

export function CreateBatchDialog({
  open,
  onOpenChange,
  onSuccess,
  products,
  orders = [],
}: CreateBatchDialogProps) {
  const { t } = useTranslation('batches');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<CreateBatchData>({
    productId: '',
    orderId: undefined,
    plannedQuantity: 0,
    startDate: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.productId || formData.plannedQuantity < 1) {
      toast.error(t('create.errors.fillAllFields'));
      return;
    }

    try {
      setLoading(true);

      const dataToSubmit: CreateBatchData = {
        productId: formData.productId,
        plannedQuantity: formData.plannedQuantity,
        startDate: formData.startDate,
      };

      if (formData.orderId) {
        dataToSubmit.orderId = formData.orderId;
      }

      await batchService.createBatch(dataToSubmit);

      toast.success(t('create.success'));

      // Reset form
      setFormData({
        productId: '',
        orderId: undefined,
        plannedQuantity: 0,
        startDate: new Date().toISOString().split('T')[0],
      });

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('errors.createFailed'));
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
          <DialogTitle>{t('create.title')}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="product">{t('create.product')}</Label>
            <Select
              value={formData.productId}
              onValueChange={(value) => setFormData({ ...formData, productId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('create.selectProduct')} />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem
                    key={product._id}
                    value={product._id}
                  >
                    {product.code} - {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="order">{t('create.order')}</Label>
            <Select
              value={formData.orderId || 'none'}
              onValueChange={(value) =>
                setFormData({ ...formData, orderId: value === 'none' ? undefined : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t('create.selectOrder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('create.noOrder')}</SelectItem>
                {orders.map((order) => (
                  <SelectItem
                    key={order._id}
                    value={order._id}
                  >
                    Order #{order.orderNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="plannedQuantity">{t('create.plannedQuantity')}</Label>
            <Input
              id="plannedQuantity"
              type="number"
              min="1"
              value={formData.plannedQuantity || ''}
              onChange={(e) =>
                setFormData({ ...formData, plannedQuantity: parseInt(e.target.value) || 0 })
              }
              placeholder={t('create.plannedQuantityPlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate">{t('create.startDate')}</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t('create.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? t('create.submitting') : t('create.submit')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
