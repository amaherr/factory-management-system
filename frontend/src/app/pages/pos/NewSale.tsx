import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Separator } from '../../components/ui/separator';
import { Search, Plus, Minus, Trash2, ShoppingCart, Save } from 'lucide-react';
import { mockProducts, mockCustomers } from '../../lib/mockData';
import { toast } from 'sonner';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';

interface CartItem {
  productId: string;
  productName: string;
  variantId: string;
  variantDetails: string;
  quantity: number;
  unitPrice: number;
  stock: number;
}

export function NewSale() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [orderType, setOrderType] = useState<'on-shelf' | 'on-demand'>('on-shelf');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [notes, setNotes] = useState('');

  const filteredProducts = mockProducts.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToCart = (product: typeof mockProducts[0], variant: typeof mockProducts[0]['variants'][0]) => {
    const existingItem = cart.find(item => item.variantId === variant.id);
    
    if (existingItem) {
      updateQuantity(variant.id, existingItem.quantity + 1);
    } else {
      setCart([...cart, {
        productId: product.id,
        productName: product.name,
        variantId: variant.id,
        variantDetails: `${variant.color}, ${variant.productionYear}, ${variant.season}`,
        quantity: 1,
        unitPrice: product.salePrice,
        stock: variant.stock,
      }]);
    }
  };

  const updateQuantity = (variantId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(variantId);
      return;
    }
    
    setCart(cart.map(item => {
      if (item.variantId === variantId) {
        if (orderType === 'on-shelf' && newQuantity > item.stock) {
          toast.error(`Only ${item.stock} units available`);
          return item;
        }
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const removeFromCart = (variantId: string) => {
    setCart(cart.filter(item => item.variantId !== variantId));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const total = subtotal - discount + tax;

  const handleFinalize = () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    if (!selectedCustomer) {
      toast.error('Please select a customer');
      return;
    }
    
    // Validate stock for on-shelf orders
    if (orderType === 'on-shelf') {
      const outOfStock = cart.find(item => item.quantity > item.stock);
      if (outOfStock) {
        toast.error(`${outOfStock.productName} is out of stock`);
        return;
      }
    }
    
    toast.success('Sale finalized successfully!');
    // Reset form
    setCart([]);
    setSelectedCustomer('');
    setDiscount(0);
    setTax(0);
    setNotes('');
  };

  const handleSaveDraft = () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    toast.success('Order saved as draft');
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">New Sale</h1>
        <p className="text-gray-500">Create a new order or finalize a sale</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Product Picker */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <Input
                  placeholder="Search products by name or code..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="max-h-[calc(100vh-300px)] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredProducts.map((product) => (
                  <Card key={product.id} className="overflow-hidden">
                    <div className="p-4">
                      <ImageWithFallback
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-32 object-cover rounded-md mb-3"
                      />
                      <h3 className="font-medium">{product.name}</h3>
                      <p className="text-sm text-gray-500">{product.code}</p>
                      <p className="font-semibold mt-2">EGP {product.salePrice}</p>
                      
                      <div className="mt-3 space-y-2">
                        {product.variants.map(variant => (
                          <div key={variant.id} className="flex items-center justify-between text-sm">
                            <div>
                              <span>{variant.color}</span>
                              <Badge variant="secondary" className="ml-2 text-xs">
                                {variant.stock > 0 ? `${variant.stock} in stock` : 'Out of stock'}
                              </Badge>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => addToCart(product, variant)}
                              disabled={orderType === 'on-shelf' && variant.stock === 0}
                            >
                              <Plus className="size-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Cart */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="size-5" />
                Cart ({cart.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Customer Selector */}
              <div className="space-y-2">
                <Label>Customer</Label>
                <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockCustomers.map(customer => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Order Type */}
              <div className="space-y-2">
                <Label>Order Type</Label>
                <Tabs value={orderType} onValueChange={(v) => setOrderType(v as any)}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="on-shelf">On-Shelf</TabsTrigger>
                    <TabsTrigger value="on-demand">On-Demand</TabsTrigger>
                  </TabsList>
                </Tabs>
                <p className="text-xs text-gray-500">
                  {orderType === 'on-shelf' 
                    ? 'Immediate stock deduction' 
                    : 'Reserve/plan for later'}
                </p>
              </div>

              <Separator />

              {/* Cart Items */}
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {cart.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">Cart is empty</p>
                ) : (
                  cart.map((item) => (
                    <div key={item.variantId} className="space-y-2 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.productName}</p>
                          <p className="text-xs text-gray-500">{item.variantDetails}</p>
                          {orderType === 'on-shelf' && item.quantity > item.stock && (
                            <p className="text-xs text-red-600 mt-1">
                              Only {item.stock} available!
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.variantId)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          >
                            <Minus className="size-3" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          >
                            <Plus className="size-3" />
                          </Button>
                        </div>
                        <span className="font-medium">
                          EGP {(item.quantity * item.unitPrice).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <Separator />

              {/* Pricing */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>EGP {subtotal.toFixed(2)}</span>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Discount</Label>
                  <Input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    min="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Tax</Label>
                  <Input
                    type="number"
                    value={tax}
                    onChange={(e) => setTax(Number(e.target.value))}
                    min="0"
                  />
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>EGP {total.toFixed(2)}</span>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <Label className="text-sm">Notes</Label>
                <Input
                  placeholder="Add notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-4">
                <Button className="w-full" onClick={handleFinalize}>
                  <ShoppingCart className="size-4 mr-2" />
                  Finalize Sale
                </Button>
                <Button variant="outline" className="w-full" onClick={handleSaveDraft}>
                  <Save className="size-4 mr-2" />
                  Save as Draft
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => setCart([])}>
                  Clear Cart
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
