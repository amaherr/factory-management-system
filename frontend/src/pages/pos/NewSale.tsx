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
import { Search, Plus, Minus, Trash2, ShoppingCart, X } from 'lucide-react';
import { toast } from 'sonner';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import { customerService, type Customer } from '../../services/customers';
import { productService, type Product } from '../../services/products';
import { ORDER_TYPES, orderService } from '../../services/orders';
import { getProductImageSrc } from '../../utils/imageUpload';

interface CartItem {
  productId: string;
  productName: string;
  productCode: string;
  productDetails: string;
  sku: number;
  lineQuantity: number; // lines of the product ordered
  unitPrice: number;
  stock: number;
}

type UiOrderType = 'on-shelf' | 'on-demand';
type ValueMode = 'amount' | 'percentage';

export function NewSale() {
  const { t } = useTranslation('pos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [orderType, setOrderType] = useState<UiOrderType>('on-shelf');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [discountMode, setDiscountMode] = useState<ValueMode>('amount');
  const [tax, setTax] = useState(0);
  const [taxMode, setTaxMode] = useState<ValueMode>('amount');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [productsData, customersData] = await Promise.all([
          productService.getAllActiveProducts(),
          customerService.getCustomers({ page: 1, limit: 100 }),
        ]);
        setProducts(productsData);
        setCustomers(customersData.customers);
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
      updateQuantity(product._id, existingItem.lineQuantity + 1);
    } else {
      setCart([
        ...cart,
        {
          productId: product._id,
          productName: product.name,
          productCode: product.code,
          productDetails: `${product.color}${product.season ? `, ${product.season}` : ''}`,
          sku: product.sku,
          lineQuantity: 1,
          unitPrice: product.unitSalePrice,
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
          const actualQuantity = newQuantity * item.sku;
          if (orderType === 'on-shelf' && actualQuantity > item.stock) {
            toast.error(t('errors.onlyStockAvailable', { stock: item.stock }));
            return item;
          }
          return { ...item, lineQuantity: newQuantity };
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
    setDiscountMode('amount');
    setTax(0);
    setTaxMode('amount');
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
      const outOfStock = cart.find((item) => item.lineQuantity * item.sku > item.stock);
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
        quantity: item.lineQuantity,
      })),
      discountAmount,
      taxAmount,
      notes: notes.trim() ? notes.trim() : undefined,
    });
  };

  const handleFinalize = async () => {
    if (!validateBeforeSubmit()) {
      return;
    }

    try {
      setProcessingAction(true);
      const createdOrder = await createOrder();
      toast.success(t('toasts.draftSaved', { orderNumber: createdOrder.orderNumber }));
      resetOrderForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('errors.createFailed'));
    } finally {
      setProcessingAction(false);
    }
  };

  // Helper functions for quantity calculations
  const getActualQuantity = (item: CartItem) => item.lineQuantity * item.sku;
  const getTotalPrice = (item: CartItem) => getActualQuantity(item) * item.unitPrice;

  const subtotal = cart.reduce((sum, item) => sum + getTotalPrice(item), 0);
  const discountAmount = discountMode === 'percentage' ? (subtotal * discount) / 100 : discount;
  const taxAmount = taxMode === 'percentage' ? (subtotal * tax) / 100 : tax;
  const total = subtotal - discountAmount + taxAmount;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">{t('title')}</h1>
        <p className="text-gray-500">{t('description')}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="relative max-w-xl">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder={t('searchPlaceholder')}
                  className="h-9 rounded-md border-[--border-default] bg-[--bg-secondary] pl-9 pr-9 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-[--primary-500]/30"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 size-7 -translate-y-1/2 p-0 text-muted-foreground hover:bg-black/5"
                    onClick={() => setSearchQuery('')}
                    aria-label={t('clearSearch')}
                  >
                    <X className="size-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="max-h-[calc(100vh-220px)] overflow-y-auto">
              {loading ? (
                <p className="text-sm text-gray-500 text-center py-8">{t('loadingProducts')}</p>
              ) : filteredProducts.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">{t('noProducts')}</p>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {filteredProducts.map((product) => (
                    <Card
                      key={product._id}
                      className="overflow-hidden"
                    >
                      <div className="p-3">
                        <ImageWithFallback
                          src={getProductImageSrc(product.defaultImage)}
                          alt={product.name}
                          className="mb-2 h-24 w-full rounded-md object-cover"
                        />
                        <h3 className="line-clamp-1 text-sm font-medium">{product.name}</h3>
                        <p className="text-xs text-gray-500">{product.code}</p>
                        <p className="mt-1 text-sm font-semibold">
                          {t('linePrice')}: {t('currency')}{' '}
                          {(product.unitSalePrice * product.sku).toFixed(2)}
                        </p>

                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs">
                            <div>
                              <span>{product.color}</span>
                              <Badge
                                variant="secondary"
                                className="ml-1 text-[10px]"
                              >
                                {product.totalTheoreticalStock > 0
                                  ? t('stockAvailable', { count: product.totalTheoreticalStock })
                                  : t('outOfStock')}
                              </Badge>
                            </div>
                            <Button
                              size="sm"
                              className="h-7 px-2"
                              onClick={() => addToCart(product)}
                              disabled={
                                processingAction ||
                                (orderType === 'on-shelf' &&
                                  product.totalTheoreticalStock < product.sku)
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

              <div className="space-y-2">
                <Label>{t('customer')}</Label>
                <Select
                  value={selectedCustomer}
                  onValueChange={setSelectedCustomer}
                >
                  <SelectTrigger className="h-9 rounded-md border-[--border-default] bg-[--bg-secondary] text-sm shadow-sm focus:ring-2 focus:ring-[--primary-500]/30">
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
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-gray-600">
                              {t('lineQuantity')}: {item.lineQuantity} • {t('actualQuantity')}:{' '}
                              {getActualQuantity(item)}
                            </p>
                          </div>
                          {orderType === 'on-shelf' && getActualQuantity(item) > item.stock && (
                            <p className="text-xs text-red-600 mt-1">
                              {t('onlyStockAvailable', { count: item.stock })}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.productId)}
                          disabled={processingAction}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.productId, item.lineQuantity - 1)}
                            disabled={processingAction}
                          >
                            <Minus className="size-3" />
                          </Button>
                          <Input
                            type="number"
                            min="1"
                            className="h-8 w-16 px-2 text-center"
                            value={item.lineQuantity}
                            placeholder={t('placeholders.quantity')}
                            onFocus={(e) => e.currentTarget.select()}
                            onClick={(e) => e.currentTarget.select()}
                            onChange={(e) => {
                              if (e.target.value === '') {
                                return;
                              }
                              const parsed = Number.parseInt(e.target.value, 10);
                              if (Number.isNaN(parsed)) {
                                return;
                              }
                              updateQuantity(item.productId, parsed);
                            }}
                            disabled={processingAction}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.productId, item.lineQuantity + 1)}
                            disabled={processingAction}
                          >
                            <Plus className="size-3" />
                          </Button>
                        </div>
                        <span className="font-medium">
                          {t('currency')} {getTotalPrice(item).toFixed(2)}
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
                  <Tabs
                    value={discountMode}
                    onValueChange={(value) => {
                      if (value === 'amount' || value === 'percentage') {
                        setDiscountMode(value);
                      }
                    }}
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="amount">{t('pricing.amount')}</TabsTrigger>
                      <TabsTrigger value="percentage">{t('pricing.percentage')}</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <Input
                    type="number"
                    className="h-9 rounded-md border-[--border-default] bg-[--bg-secondary] text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-[--primary-500]/30"
                    value={discount === 0 ? '' : discount}
                    placeholder={
                      discountMode === 'percentage'
                        ? t('placeholders.discountPercentage')
                        : t('placeholders.discountAmount')
                    }
                    onChange={(e) => {
                      const raw = e.target.value;
                      setDiscount(raw === '' ? 0 : Number(raw));
                    }}
                    min="0"
                    step={discountMode === 'percentage' ? '0.01' : '1'}
                    disabled={processingAction}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">{t('pricing.tax')}</Label>
                  <Tabs
                    value={taxMode}
                    onValueChange={(value) => {
                      if (value === 'amount' || value === 'percentage') {
                        setTaxMode(value);
                      }
                    }}
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="amount">{t('pricing.amount')}</TabsTrigger>
                      <TabsTrigger value="percentage">{t('pricing.percentage')}</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <Input
                    type="number"
                    className="h-9 rounded-md border-[--border-default] bg-[--bg-secondary] text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-[--primary-500]/30"
                    value={tax === 0 ? '' : tax}
                    placeholder={
                      taxMode === 'percentage'
                        ? t('placeholders.taxPercentage')
                        : t('placeholders.taxAmount')
                    }
                    onChange={(e) => {
                      const raw = e.target.value;
                      setTax(raw === '' ? 0 : Number(raw));
                    }}
                    min="0"
                    step={taxMode === 'percentage' ? '0.01' : '1'}
                    disabled={processingAction}
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
                  className="h-9 rounded-md border-[--border-default] bg-[--bg-secondary] text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-[--primary-500]/30"
                  placeholder={t('notesPlaceholder')}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={processingAction}
                />
              </div>

              <div className="space-y-2 pt-4">
                <Button
                  className="w-full"
                  onClick={handleFinalize}
                  disabled={processingAction}
                >
                  <ShoppingCart className="size-4 mr-2" />
                  {processingAction ? t('actions.savingDraft') : t('actions.saveDraft')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
