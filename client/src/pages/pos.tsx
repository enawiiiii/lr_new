import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useStore } from "@/hooks/use-store";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/header";
import Navigation from "@/components/navigation";
import { formatCurrency } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { Search, ShoppingCart, CreditCard, Banknote, Trash2, Plus, Minus } from "lucide-react";
import type { Product, CartItem } from "@/types";

export default function POS() {
  const { currentEmployee, currentStore } = useStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cash' | 'visa'>('cash');
  const [taxEnabled, setTaxEnabled] = useState(true);

  // Redirect if not logged in or not boutique
  if (!currentEmployee || currentStore !== 'boutique') {
    setLocation("/");
    return null;
  }

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", { search: searchQuery }],
  });

  const createSaleMutation = useMutation({
    mutationFn: async (saleData: any) => {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData),
      });
      if (!response.ok) throw new Error('Failed to create sale');
      return response.json();
    },
    onSuccess: () => {
      setCart([]);
      setSelectedPaymentMethod('cash');
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      toast({
        title: "تم إنهاء عملية البيع",
        description: "تم حفظ الفاتورة بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في إنهاء عملية البيع",
        variant: "destructive",
      });
    },
  });

  const addToCart = (product: Product, colorName: string = 'افتراضي', sizeLabel: string = 'M') => {
    const price = parseFloat(product.storePrice || '0');
    const existingItem = cart.find(
      item => item.product.id === product.id && 
               item.colorName === colorName && 
               item.sizeLabel === sizeLabel
    );

    if (existingItem) {
      setCart(cart.map(item =>
        item === existingItem
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        product,
        colorName,
        sizeLabel,
        quantity: 1,
        unitPrice: price
      }]);
    }
  };

  const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(index);
      return;
    }
    
    setCart(cart.map((item, i) =>
      i === index ? { ...item, quantity: newQuantity } : item
    ));
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + (item.unitPrice * item.quantity), 0);
  };

  const calculateTax = () => {
    if (!taxEnabled || selectedPaymentMethod !== 'visa') return 0;
    return calculateSubtotal() * 0.05;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;

    const saleData = {
      employeeId: currentEmployee.id,
      storeType: 'boutique',
      paymentMethod: selectedPaymentMethod,
      taxApplied: taxEnabled && selectedPaymentMethod === 'visa',
      taxAmount: calculateTax().toFixed(2),
      totalAmount: calculateTotal().toFixed(2),
      items: cart.map(item => ({
        productId: item.product.id,
        colorName: item.colorName,
        sizeLabel: item.sizeLabel,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toFixed(2)
      }))
    };

    createSaleMutation.mutate(saleData);
  };

  // Auto-enable tax for visa payments
  useEffect(() => {
    if (selectedPaymentMethod === 'visa') {
      setTaxEnabled(true);
    }
  }, [selectedPaymentMethod]);

  const filteredProducts = products.filter(product =>
    !searchQuery || 
    product.productCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.brand && product.brand.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-muted">
      <Header />
      <Navigation />
      
      <main className="p-6 fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Products Section */}
          <div className="lg:col-span-2 bg-card rounded-xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="text-lg font-semibold mb-4">المنتجات</h3>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="البحث بكود المنتج..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                  data-testid="input-product-search"
                />
              </div>
            </div>
            
            <div className="p-4 h-full overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="border border-border rounded-lg p-3 animate-pulse">
                      <div className="w-full h-24 bg-muted rounded mb-2"></div>
                      <div className="h-4 bg-muted rounded mb-1"></div>
                      <div className="h-3 bg-muted rounded mb-1 w-2/3"></div>
                      <div className="h-4 bg-muted rounded w-1/3"></div>
                    </div>
                  ))
                ) : filteredProducts.length === 0 ? (
                  <div className="col-span-full text-center py-8">
                    <p className="text-muted-foreground">لا توجد منتجات مطابقة للبحث</p>
                  </div>
                ) : (
                  filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="border border-border rounded-lg p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                      data-testid={`product-item-${product.id}`}
                    >
                      <div className="w-full h-24 bg-muted rounded mb-2 flex items-center justify-center">
                        {product.mainImageUrl ? (
                          <img 
                            src={product.mainImageUrl} 
                            alt={product.productCode}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <div className="text-muted-foreground text-xs">لا توجد صورة</div>
                        )}
                      </div>
                      <h4 className="font-medium text-sm mb-1" data-testid={`product-code-${product.id}`}>
                        {product.productCode}
                      </h4>
                      <p className="text-xs text-muted-foreground mb-1">
                        {product.brand && `${product.brand} - `}{product.productType || 'منتج'}
                      </p>
                      <p className="font-semibold text-primary" data-testid={`product-price-${product.id}`}>
                        {formatCurrency(product.storePrice || '0')}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Cart Section */}
          <div className="bg-card rounded-xl border border-border flex flex-col">
            <div className="p-4 border-b border-border">
              <h3 className="text-lg font-semibold flex items-center">
                <ShoppingCart className="h-5 w-5 ml-2" />
                سلة البضائع
              </h3>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-3" data-testid="cart-items">
                {cart.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>السلة فارغة</p>
                    <p className="text-sm">اختر المنتجات لإضافتها</p>
                  </div>
                ) : (
                  cart.map((item, index) => (
                    <div 
                      key={`${item.product.id}-${item.colorName}-${item.sizeLabel}`}
                      className="border border-border rounded-lg p-3"
                      data-testid={`cart-item-${index}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{item.product.productCode}</h4>
                          <p className="text-xs text-muted-foreground">
                            {item.colorName} - {item.sizeLabel}
                          </p>
                        </div>
                        <Button
                          onClick={() => removeFromCart(index)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 p-1"
                          data-testid={`button-remove-${index}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-reverse space-x-2">
                          <Button
                            onClick={() => updateQuantity(index, item.quantity - 1)}
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            data-testid={`button-decrease-${index}`}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="mx-2 font-medium" data-testid={`quantity-${index}`}>
                            {item.quantity}
                          </span>
                          <Button
                            onClick={() => updateQuantity(index, item.quantity + 1)}
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            data-testid={`button-increase-${index}`}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-sm font-semibold" data-testid={`item-total-${index}`}>
                            {formatCurrency(item.unitPrice * item.quantity)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(item.unitPrice)} × {item.quantity}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            {/* Cart Summary & Checkout */}
            <div className="p-4 border-t border-border bg-muted/30">
              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span>المجموع الفرعي:</span>
                  <span data-testid="text-subtotal">{formatCurrency(calculateSubtotal())}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>الضريبة (5%):</span>
                  <div className="flex items-center space-x-reverse space-x-2">
                    <span data-testid="text-tax-amount">{formatCurrency(calculateTax())}</span>
                    <Switch
                      checked={taxEnabled}
                      onCheckedChange={setTaxEnabled}
                      disabled={selectedPaymentMethod === 'visa'}
                      data-testid="switch-tax"
                    />
                  </div>
                </div>
                
                <div className="flex justify-between font-bold text-lg border-t border-border pt-2">
                  <span>الإجمالي:</span>
                  <span data-testid="text-total">{formatCurrency(calculateTotal())}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-3">
                <Button
                  onClick={() => setSelectedPaymentMethod('cash')}
                  variant={selectedPaymentMethod === 'cash' ? 'default' : 'outline'}
                  className="text-sm flex items-center justify-center space-x-reverse space-x-2"
                  data-testid="button-payment-cash"
                >
                  <Banknote className="h-4 w-4" />
                  <span>كاش</span>
                </Button>
                <Button
                  onClick={() => setSelectedPaymentMethod('visa')}
                  variant={selectedPaymentMethod === 'visa' ? 'default' : 'outline'}
                  className="text-sm flex items-center justify-center space-x-reverse space-x-2"
                  data-testid="button-payment-visa"
                >
                  <CreditCard className="h-4 w-4" />
                  <span>فيزا</span>
                </Button>
              </div>
              
              <Button
                onClick={handleCheckout}
                disabled={cart.length === 0 || createSaleMutation.isPending}
                className="w-full py-3 font-medium"
                data-testid="button-checkout"
              >
                {createSaleMutation.isPending ? "جاري المعالجة..." : "إتمام عملية البيع"}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
