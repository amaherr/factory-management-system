import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Textarea } from '../../ui/textarea';
import { ImageWithFallback } from '../../figma/ImageWithFallback';
import { productService } from '../../../services/products';
import type { Product, Color, Season } from '../../../services/products';
import { COLORS_VALUES, SEASONS_VALUES } from '../../../services/enums/product.enums';
import { validateImageFile, fileToDataUrl } from '../../../utils/imageUpload';
import { Upload, X } from 'lucide-react';

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (product: Product) => void;
}

export function AddProductDialog({ open, onOpenChange, onSuccess }: AddProductDialogProps) {
  const { t } = useTranslation('products');
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    color: '' as Color,
    season: '' as Season,
    sku: '',
    unitCostPrice: '',
    unitSalePrice: '',
  });

  useEffect(() => {
    if (!open) {
      setFormData({
        code: '',
        name: '',
        description: '',
        color: '' as Color,
        season: '' as Season,
        sku: '',
        unitCostPrice: '',
        unitSalePrice: '',
      });
      setImagePreview('');
      setImageFile(null);
    }
  }, [open]);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateImageFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setImagePreview(dataUrl);
      setImageFile(file);
    } catch (err) {
      toast.error(t('image_upload_error'));
    }
  };

  const handleRemoveImage = () => {
    setImagePreview('');
    setImageFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.code.trim()) {
        toast.error(t('code_required'));
        setLoading(false);
        return;
      }
      if (!formData.name.trim()) {
        toast.error(t('name_required'));
        setLoading(false);
        return;
      }
      if (!formData.color) {
        toast.error(t('color_required'));
        setLoading(false);
        return;
      }
      if (!formData.sku) {
        toast.error(t('sku_required'));
        setLoading(false);
        return;
      }
      if (!formData.unitCostPrice) {
        toast.error(t('cost_price_required'));
        setLoading(false);
        return;
      }
      if (!formData.unitSalePrice) {
        toast.error(t('sale_price_required'));
        setLoading(false);
        return;
      }

      const payload = new FormData();
      payload.append('code', formData.code.trim());
      payload.append('name', formData.name.trim());
      payload.append('color', formData.color);
      payload.append('sku', formData.sku);
      payload.append('unitCostPrice', formData.unitCostPrice);
      payload.append('unitSalePrice', formData.unitSalePrice);

      if (formData.description.trim()) {
        payload.append('description', formData.description.trim());
      }
      if (formData.season) {
        payload.append('season', formData.season);
      }
      if (imageFile) {
        payload.append('image', imageFile);
      }

      const product = await productService.createProduct(payload);

      toast.success(t('product_created_success'));
      onOpenChange(false);
      onSuccess?.(product);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('create_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b bg-background px-6 py-4 pr-12">
          <DialogTitle>{t('add_product_title')}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="space-y-6">
              {/* Image Upload */}
              <div className="space-y-2">
                <Label>{t('product_image')}</Label>
                {imagePreview ? (
                  <div className="relative">
                    <ImageWithFallback
                      src={imagePreview}
                      alt={formData.name || 'Product'}
                      className="h-40 w-full rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ) : (
                  <div className="cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition hover:border-primary">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                      id="image-input"
                    />
                    <label
                      htmlFor="image-input"
                      className="flex cursor-pointer flex-col items-center gap-2"
                    >
                      <Upload className="size-8 text-gray-400" />
                      <span className="text-sm text-gray-600">{t('click_to_upload')}</span>
                    </label>
                  </div>
                )}
                <p className="text-xs text-gray-500">{t('image_format_help')}</p>
              </div>

              {/* Code and Name */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">{t('product_code')} *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder={t('enter_code')}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">{t('sku')} *</Label>
                  <Input
                    id="sku"
                    type="number"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder={t('enter_sku')}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">{t('name')} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('enter_name')}
                  disabled={loading}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">{t('description')}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t('enter_description')}
                  disabled={loading}
                  rows={3}
                />
              </div>

              {/* Color and Season */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="color">{t('color')} *</Label>
                  <Select
                    value={formData.color}
                    onValueChange={(value) => setFormData({ ...formData, color: value as Color })}
                  >
                    <SelectTrigger
                      id="color"
                      disabled={loading}
                    >
                      <SelectValue placeholder={t('select_color')} />
                    </SelectTrigger>
                    <SelectContent>
                      {COLORS_VALUES.map((color) => (
                        <SelectItem
                          key={color}
                          value={color}
                        >
                          {t(`color_${color}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="season">{t('season')}</Label>
                  <Select
                    value={formData.season}
                    onValueChange={(value) => setFormData({ ...formData, season: value as Season })}
                  >
                    <SelectTrigger
                      id="season"
                      disabled={loading}
                    >
                      <SelectValue placeholder={t('select_season')} />
                    </SelectTrigger>
                    <SelectContent>
                      {SEASONS_VALUES.map((season) => (
                        <SelectItem
                          key={season}
                          value={season}
                        >
                          {t(`season_${season}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Prices */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unitCostPrice">{t('cost_price')} *</Label>
                  <Input
                    id="unitCostPrice"
                    type="number"
                    step="0.01"
                    value={formData.unitCostPrice}
                    onChange={(e) => setFormData({ ...formData, unitCostPrice: e.target.value })}
                    placeholder={t('enter_cost_price')}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitSalePrice">{t('sale_price')} *</Label>
                  <Input
                    id="unitSalePrice"
                    type="number"
                    step="0.01"
                    value={formData.unitSalePrice}
                    onChange={(e) => setFormData({ ...formData, unitSalePrice: e.target.value })}
                    placeholder={t('enter_sale_price')}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="shrink-0 border-t bg-background px-6 py-4">
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
              {loading ? t('creating') : t('create_product')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
