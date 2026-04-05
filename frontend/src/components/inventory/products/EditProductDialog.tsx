import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../ui/alert-dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Badge } from '../../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Switch } from '../../ui/switch';
import { Textarea } from '../../ui/textarea';
import { ImageWithFallback } from '../../figma/ImageWithFallback';
import { productService } from '../../../services/products';
import type { Color, Product, Season } from '../../../services/products';
import {
  COLORS_VALUES,
  PRODUCT_STATUS,
  SEASONS_VALUES,
} from '../../../services/enums/product.enums';
import { fileToDataUrl, getProductImageSrc, validateImageFile } from '../../../utils/imageUpload';
import { Upload, X } from 'lucide-react';

interface EditProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onSuccess?: (product: Product) => void;
}

export function EditProductDialog({
  open,
  onOpenChange,
  product,
  onSuccess,
}: EditProductDialogProps) {
  const { t } = useTranslation('products');
  const [loading, setLoading] = useState(false);
  const [confirmStatusDialogOpen, setConfirmStatusDialogOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    color: '' as Color,
    season: '' as Season,
    sku: '',
    costPrice: '',
    salePrice: '',
    isActive: false,
  });

  useEffect(() => {
    if (open && product) {
      setFormData({
        code: product.code,
        name: product.name,
        description: product.description || '',
        color: product.color,
        season: product.season || ('' as Season),
        sku: product.sku.toString(),
        costPrice: product.costPrice?.toString() || '',
        salePrice: product.salePrice.toString(),
        isActive: product.status === PRODUCT_STATUS.ACTIVE,
      });
      setImagePreview(product.defaultImage || '');
      setImageFile(null);
      setRemoveImage(false);
      setConfirmStatusDialogOpen(false);
    }
  }, [open, product]);

  const activationChanged =
    !!product && formData.isActive !== (product.status === PRODUCT_STATUS.ACTIVE);

  const getNextStatus = () => (formData.isActive ? PRODUCT_STATUS.ACTIVE : PRODUCT_STATUS.DEACTIVE);

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
      setRemoveImage(false);
    } catch {
      toast.error(t('image_upload_error'));
    }
  };

  const handleRemoveImage = () => {
    setImagePreview('');
    setImageFile(null);
    setRemoveImage(true);
  };

  const executeSubmit = async () => {
    if (!product) return;

    setLoading(true);

    try {
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
      if (!formData.costPrice) {
        toast.error(t('cost_price_required'));
        setLoading(false);
        return;
      }
      if (!formData.salePrice) {
        toast.error(t('sale_price_required'));
        setLoading(false);
        return;
      }

      const trimmedCode = formData.code.trim();
      const trimmedName = formData.name.trim();
      const trimmedDescription = formData.description.trim();
      const parsedSku = Number(formData.sku);
      const parsedCostPrice = Number(formData.costPrice);
      const parsedSalePrice = Number(formData.salePrice);

      const nextDescription = trimmedDescription || undefined;
      const currentDescription = product.description?.trim() || undefined;
      const nextSeason = formData.season || undefined;

      const codeChanged = trimmedCode !== product.code;
      const nameChanged = trimmedName !== product.name;
      const descriptionChanged = nextDescription !== currentDescription;
      const colorChanged = formData.color !== product.color;
      const seasonChanged = nextSeason !== product.season;
      const skuChanged = parsedSku !== product.sku;
      const costPriceChanged = parsedCostPrice !== product.costPrice;
      const salePriceChanged = parsedSalePrice !== product.salePrice;

      let updatedProduct: Product = product;

      if (imageFile) {
        const payload = new FormData();
        if (codeChanged) payload.append('code', trimmedCode);
        if (nameChanged) payload.append('name', trimmedName);
        if (descriptionChanged) {
          payload.append('description', nextDescription || '');
        }
        if (colorChanged) payload.append('color', formData.color);
        if (seasonChanged) {
          payload.append('season', nextSeason || '');
        }
        if (skuChanged) payload.append('sku', String(parsedSku));
        if (costPriceChanged) payload.append('costPrice', String(parsedCostPrice));
        if (salePriceChanged) payload.append('salePrice', String(parsedSalePrice));
        payload.append('image', imageFile);

        updatedProduct = await productService.updateProduct(product._id, payload);
      } else {
        const payload: {
          code?: string;
          name?: string;
          description?: string;
          color?: Color;
          season?: Season;
          removeImage?: boolean;
          sku?: number;
          costPrice?: number;
          salePrice?: number;
        } = {};

        if (codeChanged) payload.code = trimmedCode;
        if (nameChanged) payload.name = trimmedName;
        if (descriptionChanged) payload.description = nextDescription;
        if (colorChanged) payload.color = formData.color;
        if (seasonChanged) payload.season = nextSeason as Season | undefined;
        if (skuChanged) payload.sku = parsedSku;
        if (costPriceChanged) payload.costPrice = parsedCostPrice;
        if (salePriceChanged) payload.salePrice = parsedSalePrice;
        if (removeImage) payload.removeImage = true;

        if (Object.keys(payload).length > 0) {
          updatedProduct = await productService.updateProduct(product._id, payload);
        }
      }

      if (activationChanged) {
        updatedProduct = await productService.changeProductActivation(product._id, {
          status: getNextStatus(),
        });
        toast.success(
          formData.isActive ? t('product_activated_success') : t('product_deactivated_success'),
        );
      }

      toast.success(t('product_updated_success'));
      onOpenChange(false);
      onSuccess?.(updatedProduct);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('update_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    if (activationChanged) {
      setConfirmStatusDialogOpen(true);
      return;
    }

    await executeSubmit();
  };

  if (!product) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) {
          setConfirmStatusDialogOpen(false);
        }
      }}
    >
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b bg-background px-6 py-4 pr-12">
          <DialogTitle>{t('edit_product_title')}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>{t('product_image')}</Label>
                {imagePreview ? (
                  <div className="relative">
                    <ImageWithFallback
                      src={getProductImageSrc(imagePreview)}
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

              <div className="space-y-2">
                <Label htmlFor="isActive">{t('activation_label')}</Label>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-1 pr-4">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{t('activation_toggle_title')}</p>
                      <Badge
                        variant={product.status === PRODUCT_STATUS.ACTIVE ? 'default' : 'secondary'}
                      >
                        {t(
                          product.status === PRODUCT_STATUS.ACTIVE
                            ? 'active'
                            : product.status === PRODUCT_STATUS.PENDING
                              ? 'pending'
                              : 'inactive',
                        )}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{t('activation_toggle_hint')}</p>
                  </div>
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    disabled={loading}
                  />
                </div>
              </div>

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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="costPrice">{t('cost_price')} *</Label>
                  <Input
                    id="costPrice"
                    type="number"
                    step="0.01"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    placeholder={t('enter_cost_price')}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salePrice">{t('sale_price')} *</Label>
                  <Input
                    id="salePrice"
                    type="number"
                    step="0.01"
                    value={formData.salePrice}
                    onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
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
              {loading ? t('updating') : t('update_product')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      <AlertDialog
        open={confirmStatusDialogOpen}
        onOpenChange={setConfirmStatusDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {formData.isActive ? t('activate_product_title') : t('deactivate_product_title')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {formData.isActive ? t('activate_on_save_message') : t('deactivate_on_save_message')}
              <br />
              <br />
              <span className="font-semibold text-foreground">
                {t('change_product_status_confirmation', {
                  productName: product.name,
                  status: t(formData.isActive ? 'active' : 'inactive'),
                })}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              disabled={loading}
              onClick={async (event) => {
                event.preventDefault();
                setConfirmStatusDialogOpen(false);
                await executeSubmit();
              }}
            >
              {loading ? t('updating') : t('confirm_save')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
