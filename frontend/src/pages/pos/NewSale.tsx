import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Separator } from '../../components/ui/separator';
import { Search, Plus, Minus, Trash2, ShoppingCart, Save } from 'lucide-react';
import { toast } from 'sonner';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import { customerService, type Customer } from '../../services/customers';
import { productService, type Product } from '../../services/products';
import { ORDER_STATUS, ORDER_TYPES, orderService } from '../../services/orders';
import { getProductImageSrc } from '../../utils/imageUpload';

interface CartItem {
  productId: string;
  productName: string;
  productCode: string;
  productDetails: string;
  quantity: number;
  unitPrice: number;
  stock: number;
}

type UiOrderType = 'on-shelf' | 'on-demand';

export function NewSale() {
  const { t } = useTranslation('pos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [orderType, setOrderType] = useState<UiOrderType>('on-shelf');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [processingAction, setProcessingAction] = useState<'finalize' | 'draft' | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [productsData, customersData] = await Promise.all([
          productService.getAllActiveProducts(),
          customerService.getCustomers(),
        ]);
        setProducts(productsData);
        setCustomers(customersData);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t('errors.loadFailed'));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [t]);

  const filteredProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.code.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [products, searchQuery],
  );

  const mapUiTypeToApiType = (type: UiOrderType) =>
    type === 'on-shelf' ? ORDER_TYPES.ON_SHELF : ORDER_TYPES.ON_DEMAND;

  const isUiOrderType = (value: string): value is UiOrderType => {
    return value === 'on-shelf' || value === 'on-demand';
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.productId === product._id);

    if (existingItem) {
      updateQuantity(product._id, existingItem.quantity + 1);
    } else {
      setCart([
        ...cart,
        {
          productId: product._id,
          productName: product.name,
          productCode: product.code,
          productDetails: `${product.color}${product.season ? `, ${product.season}` : ''}`,
          quantity: 1,
          unitPrice: product.salePrice,
          stock: product.totalTheoreticalStock,
        },
      ]);
    }
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(
      cart.map((item) => {
        if (item.productId === productId) {
          if (orderType === 'on-shelf' && newQuantity > item.stock) {
            toast.error(t('errors.onlyStockAvailable', { stock: item.stock }));
            return item;
          }
          return { ...item, quantity: newQuantity };
        }
        return item;
      }),
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.productId !== productId));
  };

  const resetOrderForm = () => {
    setCart([]);
    setSelectedCustomer('');
    setDiscount(0);
    setTax(0);
    setNotes('');
  };

  const validateBeforeSubmit = (): boolean => {
    if (cart.length === 0) {
      toast.error(t('errors.emptyCart'));
      return false;
    }

    if (!selectedCustomer) {
      toast.error(t('errors.selectCustomer'));
      return false;
    }

    if (discount < 0 || tax < 0) {
      toast.error(t('errors.discountTaxInvalid'));
      return false;
    }

    if (orderType === 'on-shelf') {
      const outOfStock = cart.find((item) => item.quantity > item.stock);
      if (outOfStock) {
        toast.error(t('errors.outOfStock', { product: outOfStock.productName }));
        return false;
      }
    }

    return true;
  };

  const createOrder = async () => {
    return orderService.createOrder({
      customerId: selectedCustomer,
      orderType: mapUiTypeToApiType(orderType),
      items: cart.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
      discountAmount: discount,
      taxAmount: tax,
      notes: notes.trim() ? notes.trim() : undefined,
    });
  };

  const handleFinalize = async () => {
    if (!validateBeforeSubmit()) {
      return;
    }

    try {
      setProcessingAction('finalize');
      const createdOrder = await createOrder();
      await orderService.changeOrderStatus(createdOrder._id, { status: ORDER_STATUS.FINALIZED });
      toast.success(t('toasts.finalizedSuccess', { orderNumber: createdOrder.orderNumber }));
      resetOrderForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('errors.finalizeFailed'));
    } finally {
      setProcessingAction(null);
    }
  };

  const handleSaveDraft = async () => {
    if (!validateBeforeSubmit()) {
      return;
    }

    try {
      setProcessingAction('draft');
      const createdOrder = await createOrder();
      toast.success(t('toasts.draftSaved', { orderNumber: createdOrder.orderNumber }));
      resetOrderForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('errors.createFailed'));
    } finally {
      setProcessingAction(null);
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const total = subtotal - discount + tax;

  const isBusy = processingAction !== null;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">{t('title')}</h1>
        <p className="text-gray-500">{t('description')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <Input
                  placeholder={t('searchPlaceholder')}
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="max-h-[calc(100vh-300px)] overflow-y-auto">
              {loading ? (
                <p className="text-sm text-gray-500 text-center py-8">{t('loadingProducts')}</p>
              ) : filteredProducts.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">{t('noProducts')}</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredProducts.map((product) => (
                    <Card
                      key={product._id}
                      className="overflow-hidden"
                    >
                      <div className="p-4">
                        <ImageWithFallback
                          src={getProductImageSrc(product.defaultImage)}
                          alt={product.name}
                          className="w-full h-32 object-cover rounded-md mb-3"
                        />
                        <h3 className="font-medium">{product.name}</h3>
                        <p className="text-sm text-gray-500">{product.code}</p>
                        <p className="font-semibold mt-2">
                          {t('currency')} {product.salePrice}
                        </p>

                        <div className="mt-3">
                          <div className="flex items-center justify-between text-sm">
                            <div>
                              <span>{product.color}</span>
                              <Badge
                                variant="secondary"
                                className="ml-2 text-xs"
                              >
                                {product.totalTheoreticalStock > 0
                                  ? t('stockAvailable', { count: product.totalTheoreticalStock })
                                  : t('outOfStock')}
                              </Badge>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => addToCart(product)}
                              disabled={
                                isBusy ||
                                (orderType === 'on-shelf' && product.totalTheoreticalStock === 0)
                              }
                            >
                              <Plus className="size-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="size-5" />
                {t('cartTitle', { count: cart.length })}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t('customer')}</Label>
                <Select
                  value={selectedCustomer}
                  onValueChange={setSelectedCustomer}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectCustomer')} />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem
                        key={customer._id}
                        value={customer._id!}
                      >
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('orderType.label')}</Label>
                <Tabs
                  value={orderType}
                  onValueChange={(value) => {
                    if (isUiOrderType(value)) {
                      setOrderType(value);
                    }
                  }}
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="on-shelf">{t('orderType.onShelf')}</TabsTrigger>
                    <TabsTrigger value="on-demand">{t('orderType.onDemand')}</TabsTrigger>
                  </TabsList>
                </Tabs>
                <p className="text-xs text-gray-500">
                  {orderType === 'on-shelf'
                    ? t('orderType.onShelfHint')
                    : t('orderType.onDemandHint')}
                </p>
              </div>

              <Separator />

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {cart.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">{t('emptyCart')}</p>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.productId}
                      className="space-y-2 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.productName}</p>
                          <p className="text-xs text-gray-500">
                            {item.productCode} • {item.productDetails}
                          </p>
                          {orderType === 'on-shelf' && item.quantity > item.stock && (
                            <p className="text-xs text-red-600 mt-1">
                              {t('onlyStockAvailable', { count: item.stock })}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.productId)}
                          disabled={isBusy}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            disabled={isBusy}
                          >
                            <Minus className="size-3" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            disabled={isBusy}
                          >
                            <Plus className="size-3" />
                          </Button>
                        </div>
                        <span className="font-medium">
                          {t('currency')} {(item.quantity * item.unitPrice).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>{t('pricing.subtotal')}</span>
                  <span>
                    {t('currency')} {subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">{t('pricing.discount')}</Label>
                  <Input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    min="0"
                    disabled={isBusy}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">{t('pricing.tax')}</Label>
                  <Input
                    type="number"
                    value={tax}
                    onChange={(e) => setTax(Number(e.target.value))}
                    min="0"
                    disabled={isBusy}
                  />
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>{t('pricing.total')}</span>
                  <span>
                    {t('currency')} {total.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-sm">{t('notes')}</Label>
                <Input
                  placeholder={t('notesPlaceholder')}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isBusy}
                />
              </div>

              <div className="space-y-2 pt-4">
                <Button
                  className="w-full"
                  onClick={handleFinalize}
                  disabled={isBusy}
                >
                  <ShoppingCart className="size-4 mr-2" />
                  {processingAction === 'finalize'
                    ? t('actions.finalizing')
                    : t('actions.finalize')}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleSaveDraft}
                  disabled={isBusy}
                >
                  <Save className="size-4 mr-2" />
                  {processingAction === 'draft' ? t('actions.savingDraft') : t('actions.saveDraft')}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={resetOrderForm}
                  disabled={isBusy}
                >
                  {t('actions.clearCart')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
