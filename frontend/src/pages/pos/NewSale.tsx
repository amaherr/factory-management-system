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
  itemType: UiOrderType; // CHANGED: now per-item instead of order-level
}

type UiOrderType = 'on-shelf' | 'on-demand';
type ValueMode = 'amount' | 'percentage';

export function NewSale() {
  const { t } = useTranslation('pos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  // CHANGED: removed orderType state; now each item has its own itemType
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
    const existingItem = cart.find(
      (item) => item.productId === product._id && item.itemType === 'on-shelf',
    );

    if (existingItem) {
      updateQuantity(product._id, existingItem.itemType, existingItem.lineQuantity + 1);
    } else {
      // CHANGED: add itemType with default 'on-shelf' for new items
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
          itemType: 'on-shelf', // default to on-shelf, user can change per item
        },
      ]);
    }
  };

  const updateQuantity = (productId: string, itemType: UiOrderType, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId, itemType);
      return;
    }

    setCart(
      cart.map((item) => {
        if (item.productId === productId && item.itemType === itemType) {
          const actualQuantity = newQuantity * item.sku;
          // CHANGED: only validate stock for on-shelf items
          if (item.itemType === 'on-shelf' && actualQuantity > item.stock) {
            toast.error(t('errors.onlyStockAvailable', { stock: item.stock }));
            return item;
          }
          return { ...item, lineQuantity: newQuantity };
        }
        return item;
      }),
    );
  };

  // ADDED: function to change item type for a cart item
  const updateItemType = (productId: string, currentType: UiOrderType, newType: UiOrderType) => {
    if (currentType === newType) return;

    const currentItem = cart.find(
      (item) => item.productId === productId && item.itemType === currentType,
    );
    if (!currentItem) return;

    const targetItem = cart.find(
      (item) => item.productId === productId && item.itemType === newType,
    );

    if (targetItem) {
      const mergedQuantity = currentItem.lineQuantity + targetItem.lineQuantity;
      if (newType === 'on-shelf' && mergedQuantity * currentItem.sku > currentItem.stock) {
        toast.error(t('errors.onlyStockAvailable', { stock: currentItem.stock }));
        return;
      }

      setCart(
        cart
          .filter((item) => !(item.productId === productId && item.itemType === currentType))
          .map((item) =>
            item.productId === productId && item.itemType === newType
              ? { ...item, lineQuantity: mergedQuantity }
              : item,
          ),
      );
      return;
    }

    setCart(
      cart.map((item) =>
        item.productId === productId && item.itemType === currentType
          ? { ...item, itemType: newType }
          : item,
      ),
    );
  };

  const removeFromCart = (productId: string, itemType: UiOrderType) => {
    setCart(cart.filter((item) => !(item.productId === productId && item.itemType === itemType)));
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

    // CHANGED: validate stock per item based on itemType
    const outOfStock = cart.find(
      (item) => item.itemType === 'on-shelf' && item.lineQuantity * item.sku > item.stock,
    );
    if (outOfStock) {
      toast.error(t('errors.outOfStock', { product: outOfStock.productName }));
      return false;
    }

    return true;
  };

  const createOrder = async () => {
    // CHANGED: pass itemType per item to the API
    return orderService.createOrder({
      customerId: selectedCustomer,
      items: cart.map((item) => ({
        productId: item.productId,
        quantity: item.lineQuantity,
        itemType: mapUiTypeToApiType(item.itemType), // per-item itemType
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
                              disabled={processingAction}
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
                      key={`${item.productId}-${item.itemType}`}
                      className="space-y-2 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.productName}</p>
                          <p className="text-xs text-gray-500">
                            {item.productCode} • {item.productDetails}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant={item.itemType === 'on-shelf' ? 'default' : 'secondary'}
                              className="text-[10px]"
                            >
                              {item.itemType === 'on-shelf'
                                ? t('itemType.onShelf')
                                : t('itemType.onDemand')}
                            </Badge>
                            {item.itemType === 'on-shelf' && (
                              <span className="text-xs text-gray-600">
                                {t('stockAvailable', { count: item.stock })}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-gray-600">
                              {t('lineQuantity')}: {item.lineQuantity} • {t('actualQuantity')}:{' '}
                              {getActualQuantity(item)}
                            </p>
                          </div>
                          {item.itemType === 'on-shelf' && getActualQuantity(item) > item.stock && (
                            <p className="text-xs text-red-600 mt-1">
                              {t('onlyStockAvailable', { count: item.stock })}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.productId, item.itemType)}
                          disabled={processingAction}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>

                      {/* ADDED: Per-item type selector */}
                      <div className="flex items-center gap-2">
                        <Label className="text-xs flex-shrink-0">{t('itemType.label')}:</Label>
                        <Select
                          value={item.itemType}
                          onValueChange={(value) => {
                            if (isUiOrderType(value)) {
                              updateItemType(item.productId, item.itemType, value);
                            }
                          }}
                          disabled={processingAction}
                        >
                          <SelectTrigger className="h-7 w-32 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="on-shelf">{t('itemType.onShelf')}</SelectItem>
                            <SelectItem value="on-demand">{t('itemType.onDemand')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateQuantity(item.productId, item.itemType, item.lineQuantity - 1)
                            }
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
                              updateQuantity(item.productId, item.itemType, parsed);
                            }}
                            disabled={processingAction}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateQuantity(item.productId, item.itemType, item.lineQuantity + 1)
                            }
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
