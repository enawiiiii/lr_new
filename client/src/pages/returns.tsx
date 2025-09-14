import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useStore } from "@/hooks/use-store";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/header";
import Navigation from "@/components/navigation";
import { formatCurrency, formatDateTime } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { RotateCcw, Search, DollarSign, ArrowRightLeft } from "lucide-react";
import type { ReturnExchange } from "@/types";

export default function Returns() {
  const { currentEmployee, currentStore } = useStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [searchInvoice, setSearchInvoice] = useState("");
  const [foundSale, setFoundSale] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [returnType, setReturnType] = useState<'refund' | 'exchange'>('refund');
  const [exchangeMode, setExchangeMode] = useState<'color_to_color' | 'size_to_size' | 'model_to_model'>('color_to_color');
  const [notes, setNotes] = useState("");

  // Redirect if not logged in
  if (!currentEmployee || !currentStore) {
    setLocation("/");
    return null;
  }

  const { data: recentReturns = [], isLoading: returnsLoading } = useQuery({
    queryKey: ["/api/returns"],
  });

  const { data: sales = [] } = useQuery({
    queryKey: ["/api/sales"],
  });

  const createReturnMutation = useMutation({
    mutationFn: async (returnData: any) => {
      const response = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...returnData,
          employeeId: currentEmployee.id
        }),
      });
      if (!response.ok) throw new Error('Failed to create return/exchange');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/returns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      
      // Reset form
      setSearchInvoice("");
      setFoundSale(null);
      setSelectedItem(null);
      setReturnType('refund');
      setExchangeMode('color_to_color');
      setNotes("");
      
      toast({
        title: "تم تنفيذ العملية",
        description: `تم ${returnType === 'refund' ? 'الاسترداد' : 'التبديل'} بنجاح`,
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في تنفيذ العملية",
        variant: "destructive",
      });
    },
  });

  const handleSearchInvoice = () => {
    if (!searchInvoice.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رقم الفاتورة",
        variant: "destructive",
      });
      return;
    }

    // Search in sales (for boutique) or orders (for online)
    let foundTransaction = null;
    
    if (currentStore === 'boutique') {
      foundTransaction = sales.find((sale: any) => 
        sale.id.toString() === searchInvoice || 
        `INV-${sale.id}` === searchInvoice
      );
    } else {
      // For online store, search in orders would go here
      // For now, using sales as fallback
      foundTransaction = sales.find((sale: any) => 
        sale.id.toString() === searchInvoice
      );
    }

    if (foundTransaction) {
      setFoundSale(foundTransaction);
      toast({
        title: "تم العثور على الفاتورة",
        description: "تم العثور على الفاتورة بنجاح",
      });
    } else {
      setFoundSale(null);
      toast({
        title: "لم يتم العثور على الفاتورة",
        description: "الرجاء التأكد من رقم الفاتورة",
        variant: "destructive",
      });
    }
  };

  const handleSelectItem = (item: any) => {
    setSelectedItem(item);
  };

  const handleProcessReturn = () => {
    if (!foundSale || !selectedItem) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار منتج للإرجاع",
        variant: "destructive",
      });
      return;
    }

    const returnData = {
      type: returnType,
      exchangeMode: returnType === 'exchange' ? exchangeMode : null,
      originalSaleId: foundSale.id,
      notes
    };

    createReturnMutation.mutate(returnData);
  };

  const calculateTotal = (sale: any) => {
    if (!sale.items) return parseFloat(sale.totalAmount || '0');
    return sale.items.reduce((total: number, item: any) => 
      total + (parseFloat(item.unitPrice) * item.quantity), 0
    );
  };

  return (
    <div className="min-h-screen bg-muted">
      <Header />
      <Navigation />
      
      <main className="p-6 fade-in">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">المرتجعات والتبديل</h2>
            <p className="text-muted-foreground">إدارة عمليات الاسترداد والتبديل</p>
          </div>
          <Button 
            onClick={() => {
              setSearchInvoice("");
              setFoundSale(null);
              setSelectedItem(null);
              setReturnType('refund');
              setNotes("");
            }}
            variant="outline"
            className="flex items-center space-x-reverse space-x-2"
            data-testid="button-new-return"
          >
            <RotateCcw className="h-4 w-4" />
            <span>عملية إرجاع جديدة</span>
          </Button>
        </div>

        {/* Return Process */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Search Invoice */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">بحث عن الفاتورة الأصلية</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="invoice-search">رقم الفاتورة أو الطلب</Label>
                  <div className="flex space-x-reverse space-x-2 mt-2">
                    <Input
                      id="invoice-search"
                      value={searchInvoice}
                      onChange={(e) => setSearchInvoice(e.target.value)}
                      placeholder="ادخل رقم الفاتورة..."
                      className="flex-1"
                      data-testid="input-invoice-search"
                    />
                    <Button 
                      onClick={handleSearchInvoice}
                      data-testid="button-search-invoice"
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Original Sale Details */}
                {foundSale && (
                  <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                    <h4 className="font-semibold mb-3">تفاصيل الفاتورة الأصلية</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>رقم الفاتورة:</span>
                        <span className="font-medium" data-testid="text-found-invoice-id">
                          INV-{foundSale.id}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>التاريخ:</span>
                        <span>{formatDateTime(foundSale.createdAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>المجموع:</span>
                        <span data-testid="text-found-invoice-total">
                          {formatCurrency(calculateTotal(foundSale))}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>طريقة الدفع:</span>
                        <span>{foundSale.paymentMethod === 'cash' ? 'كاش' : 'فيزا'}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <h5 className="font-medium mb-2">المنتجات:</h5>
                      <div className="space-y-2">
                        {foundSale.items?.map((item: any, index: number) => (
                          <div 
                            key={index}
                            className={`flex justify-between items-center p-2 rounded cursor-pointer transition-colors ${
                              selectedItem === item ? 'bg-primary/20 border-primary' : 'bg-background hover:bg-muted'
                            }`}
                            onClick={() => handleSelectItem(item)}
                            data-testid={`sale-item-${index}`}
                          >
                            <div>
                              <p className="font-medium">
                                {item.product?.productCode || 'منتج'} - {item.product?.brand || 'علامة تجارية'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {item.colorName} - {item.sizeLabel} × {item.quantity}
                              </p>
                            </div>
                            <div className="flex items-center space-x-reverse space-x-2">
                              <span className="text-sm font-semibold">
                                {formatCurrency(parseFloat(item.unitPrice) * item.quantity)}
                              </span>
                              <Button
                                variant={selectedItem === item ? "default" : "outline"}
                                size="sm"
                                className="text-xs"
                                data-testid={`button-select-item-${index}`}
                              >
                                {selectedItem === item ? 'مختار' : 'اختيار'}
                              </Button>
                            </div>
                          </div>
                        )) || (
                          <p className="text-muted-foreground">لا توجد منتجات</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Return Type Selection */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">نوع العملية</h3>
              <div className="space-y-4">
                <RadioGroup value={returnType} onValueChange={(value: 'refund' | 'exchange') => setReturnType(value)}>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center space-x-reverse space-x-2 p-4 border border-border rounded-lg cursor-pointer hover:bg-muted/30">
                      <RadioGroupItem value="refund" id="refund" data-testid="radio-refund" />
                      <Label htmlFor="refund" className="flex-1 cursor-pointer">
                        <div className="flex items-center space-x-reverse space-x-2">
                          <DollarSign className="text-green-600 h-5 w-5" />
                          <div>
                            <p className="font-medium">استرداد</p>
                            <p className="text-xs text-muted-foreground">إرجاع المبلغ</p>
                          </div>
                        </div>
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-reverse space-x-2 p-4 border border-border rounded-lg cursor-pointer hover:bg-muted/30">
                      <RadioGroupItem value="exchange" id="exchange" data-testid="radio-exchange" />
                      <Label htmlFor="exchange" className="flex-1 cursor-pointer">
                        <div className="flex items-center space-x-reverse space-x-2">
                          <ArrowRightLeft className="text-blue-600 h-5 w-5" />
                          <div>
                            <p className="font-medium">تبديل</p>
                            <p className="text-xs text-muted-foreground">تبديل المنتج</p>
                          </div>
                        </div>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>

                {/* Exchange Options */}
                {returnType === 'exchange' && (
                  <div className="space-y-3" data-testid="exchange-options">
                    <h5 className="font-medium">نوع التبديل:</h5>
                    <RadioGroup 
                      value={exchangeMode} 
                      onValueChange={(value: 'color_to_color' | 'size_to_size' | 'model_to_model') => setExchangeMode(value)}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center space-x-reverse space-x-2">
                          <RadioGroupItem value="color_to_color" id="color" data-testid="radio-color-exchange" />
                          <Label htmlFor="color" className="text-sm cursor-pointer">تبديل اللون</Label>
                        </div>
                        <div className="flex items-center space-x-reverse space-x-2">
                          <RadioGroupItem value="size_to_size" id="size" data-testid="radio-size-exchange" />
                          <Label htmlFor="size" className="text-sm cursor-pointer">تبديل المقاس</Label>
                        </div>
                        <div className="flex items-center space-x-reverse space-x-2">
                          <RadioGroupItem value="model_to_model" id="model" data-testid="radio-model-exchange" />
                          <Label htmlFor="model" className="text-sm cursor-pointer">تبديل الموديل</Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                )}

                <div>
                  <Label htmlFor="notes">ملاحظات</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="اكتب الملاحظات هنا..."
                    className="mt-2 h-20"
                    data-testid="textarea-notes"
                  />
                </div>

                <Button
                  onClick={handleProcessReturn}
                  disabled={!foundSale || !selectedItem || createReturnMutation.isPending}
                  className="w-full font-medium"
                  data-testid="button-process-return"
                >
                  {createReturnMutation.isPending 
                    ? "جاري المعالجة..." 
                    : `تنفيذ ${returnType === 'refund' ? 'الاسترداد' : 'التبديل'}`
                  }
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Returns */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">العمليات الأخيرة</h3>
            <div className="divide-y divide-border">
              {returnsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-4">
                    <div className="animate-pulse">
                      <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/2 mb-1"></div>
                      <div className="h-3 bg-muted rounded w-1/4"></div>
                    </div>
                  </div>
                ))
              ) : recentReturns.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">لا توجد عمليات إرجاع حديثة</p>
                </div>
              ) : (
                recentReturns.map((returnItem: ReturnExchange, index: number) => (
                  <div 
                    key={returnItem.id} 
                    className="p-4 hover:bg-muted/20 transition-colors"
                    data-testid={`return-item-${index}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">
                          {returnItem.type === 'refund' ? 'استرداد' : 'تبديل'} - فاتورة #{returnItem.originalSaleId}
                        </p>
                        {returnItem.exchangeMode && (
                          <p className="text-sm text-muted-foreground">
                            نوع التبديل: {
                              returnItem.exchangeMode === 'color_to_color' ? 'تبديل لون' :
                              returnItem.exchangeMode === 'size_to_size' ? 'تبديل مقاس' :
                              'تبديل موديل'
                            }
                          </p>
                        )}
                        {returnItem.notes && (
                          <p className="text-sm text-muted-foreground">
                            ملاحظات: {returnItem.notes}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          الموظف: {currentEmployee.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {returnItem.type === 'refund' ? 'استرداد' : 'تبديل'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDateTime(returnItem.createdAt || new Date())}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
