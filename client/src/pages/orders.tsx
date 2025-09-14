import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/hooks/use-store";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/header";
import Navigation from "@/components/navigation";
import { formatCurrency, formatDateTime, getStatusText, getStatusBadgeClass, getPaymentMethodText, getPaymentMethodClass, UAE_EMIRATES } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { Plus, Eye, Edit, Phone, MapPin, Package } from "lucide-react";
import type { Order, Product } from "@/types";

export default function Orders() {
  const { currentEmployee, currentStore } = useStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [newOrder, setNewOrder] = useState({
    customerName: '',
    phone: '',
    emirate: '',
    address: '',
    paymentMethod: 'cod',
    items: [] as any[]
  });

  // Redirect if not logged in or not online store
  if (!currentEmployee || currentStore !== 'online') {
    setLocation("/");
    return null;
  }

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["/api/orders"],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...orderData,
          employeeId: currentEmployee.id
        }),
      });
      if (!response.ok) throw new Error('Failed to create order');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setShowOrderForm(false);
      setNewOrder({
        customerName: '',
        phone: '',
        emirate: '',
        address: '',
        paymentMethod: 'cod',
        items: []
      });
      toast({
        title: "تم إنشاء الطلب",
        description: "تم إنشاء الطلب بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في إنشاء الطلب",
        variant: "destructive",
      });
    },
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status, trackingNumber }: { orderId: number; status: string; trackingNumber?: string }) => {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, trackingNumber }),
      });
      if (!response.ok) throw new Error('Failed to update order status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "تم تحديث حالة الطلب",
        description: "تم تحديث حالة الطلب بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في تحديث حالة الطلب",
        variant: "destructive",
      });
    },
  });

  const handleCreateOrder = () => {
    if (!newOrder.customerName || !newOrder.phone || !newOrder.emirate || !newOrder.address) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    if (newOrder.items.length === 0) {
      toast({
        title: "خطأ",
        description: "يرجى إضافة منتجات للطلب",
        variant: "destructive",
      });
      return;
    }

    createOrderMutation.mutate(newOrder);
  };

  const addProductToOrder = (product: Product) => {
    const existingItem = newOrder.items.find(item => item.productId === product.id);
    
    if (existingItem) {
      setNewOrder({
        ...newOrder,
        items: newOrder.items.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      });
    } else {
      setNewOrder({
        ...newOrder,
        items: [...newOrder.items, {
          productId: product.id,
          productCode: product.productCode,
          colorName: 'افتراضي',
          sizeLabel: 'M',
          quantity: 1,
          unitPrice: parseFloat(product.onlinePrice || '0')
        }]
      });
    }
  };

  const removeProductFromOrder = (productId: number) => {
    setNewOrder({
      ...newOrder,
      items: newOrder.items.filter(item => item.productId !== productId)
    });
  };

  const calculateOrderTotal = () => {
    return newOrder.items.reduce((total, item) => total + (item.unitPrice * item.quantity), 0);
  };

  const handleViewOrder = (order: any) => {
    setSelectedOrder(order);
    setShowOrderDetail(true);
  };

  const handleUpdateStatus = (order: any, newStatus: string) => {
    const trackingNumber = newStatus === 'out_for_delivery' 
      ? prompt('أدخل رقم التتبع (اختياري):') || undefined 
      : undefined;
    
    updateOrderStatusMutation.mutate({
      orderId: order.id,
      status: newStatus,
      trackingNumber
    });
  };

  return (
    <div className="min-h-screen bg-muted">
      <Header />
      <Navigation />
      
      <main className="p-6 fade-in">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">إدارة الطلبات</h2>
            <p className="text-muted-foreground">عرض وإدارة طلبات المتجر الإلكتروني</p>
          </div>
          
          <Dialog open={showOrderForm} onOpenChange={setShowOrderForm}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-reverse space-x-2" data-testid="button-create-order">
                <Plus className="h-4 w-4" />
                <span>طلب جديد</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>إنشاء طلب جديد</DialogTitle>
              </DialogHeader>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">معلومات العميل</h3>
                  
                  <div>
                    <Label htmlFor="customer-name">اسم العميل</Label>
                    <Input
                      id="customer-name"
                      value={newOrder.customerName}
                      onChange={(e) => setNewOrder({ ...newOrder, customerName: e.target.value })}
                      placeholder="أدخل اسم العميل"
                      data-testid="input-customer-name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">رقم الهاتف</Label>
                    <Input
                      id="phone"
                      value={newOrder.phone}
                      onChange={(e) => setNewOrder({ ...newOrder, phone: e.target.value })}
                      placeholder="+971501234567"
                      data-testid="input-phone"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="emirate">الإمارة</Label>
                    <Select 
                      value={newOrder.emirate} 
                      onValueChange={(value) => setNewOrder({ ...newOrder, emirate: value })}
                    >
                      <SelectTrigger data-testid="select-emirate">
                        <SelectValue placeholder="اختر الإمارة" />
                      </SelectTrigger>
                      <SelectContent>
                        {UAE_EMIRATES.map(emirate => (
                          <SelectItem key={emirate} value={emirate}>
                            {emirate}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="address">العنوان</Label>
                    <Textarea
                      id="address"
                      value={newOrder.address}
                      onChange={(e) => setNewOrder({ ...newOrder, address: e.target.value })}
                      placeholder="أدخل العنوان التفصيلي"
                      data-testid="textarea-address"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="payment-method">طريقة الدفع</Label>
                    <Select 
                      value={newOrder.paymentMethod} 
                      onValueChange={(value) => setNewOrder({ ...newOrder, paymentMethod: value })}
                    >
                      <SelectTrigger data-testid="select-payment-method">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cod">الدفع عند التسليم</SelectItem>
                        <SelectItem value="bank">تحويل بنكي</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold">المنتجات</h3>
                  
                  <div className="max-h-40 overflow-y-auto border border-border rounded p-2">
                    {products.slice(0, 10).map(product => (
                      <div
                        key={product.id}
                        onClick={() => addProductToOrder(product)}
                        className="flex justify-between items-center p-2 hover:bg-muted rounded cursor-pointer"
                        data-testid={`product-select-${product.id}`}
                      >
                        <div>
                          <p className="font-medium text-sm">{product.productCode}</p>
                          <p className="text-xs text-muted-foreground">{product.brand}</p>
                        </div>
                        <p className="text-sm font-semibold">{formatCurrency(product.onlinePrice || '0')}</p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">المنتجات المختارة:</h4>
                    {newOrder.items.length === 0 ? (
                      <p className="text-muted-foreground text-sm">لم يتم اختيار أي منتجات</p>
                    ) : (
                      newOrder.items.map(item => (
                        <div 
                          key={item.productId}
                          className="flex justify-between items-center p-2 bg-muted rounded"
                          data-testid={`order-item-${item.productId}`}
                        >
                          <div>
                            <p className="font-medium text-sm">{item.productCode}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.colorName} - {item.sizeLabel} × {item.quantity}
                            </p>
                          </div>
                          <div className="flex items-center space-x-reverse space-x-2">
                            <span className="text-sm font-semibold">
                              {formatCurrency(item.unitPrice * item.quantity)}
                            </span>
                            <Button
                              onClick={() => removeProductFromOrder(item.productId)}
                              variant="ghost"
                              size="sm"
                              className="text-red-600 p-1"
                              data-testid={`button-remove-item-${item.productId}`}
                            >
                              ×
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                    
                    {newOrder.items.length > 0 && (
                      <div className="border-t border-border pt-2">
                        <div className="flex justify-between font-semibold">
                          <span>المجموع:</span>
                          <span data-testid="text-order-total">{formatCurrency(calculateOrderTotal())}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={handleCreateOrder} 
                      className="flex-1"
                      disabled={createOrderMutation.isPending}
                      data-testid="button-submit-order"
                    >
                      {createOrderMutation.isPending ? "جاري الإنشاء..." : "إنشاء الطلب"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowOrderForm(false)}
                      className="flex-1"
                      data-testid="button-cancel-order"
                    >
                      إلغاء
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Orders Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/30 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-right font-medium">رقم الطلب</th>
                    <th className="px-4 py-3 text-right font-medium">العميل</th>
                    <th className="px-4 py-3 text-right font-medium">الإمارة</th>
                    <th className="px-4 py-3 text-right font-medium">المبلغ</th>
                    <th className="px-4 py-3 text-right font-medium">طريقة الدفع</th>
                    <th className="px-4 py-3 text-right font-medium">الحالة</th>
                    <th className="px-4 py-3 text-right font-medium">التاريخ</th>
                    <th className="px-4 py-3 text-right font-medium">العمليات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 8 }).map((_, j) => (
                          <td key={j} className="px-4 py-3">
                            <div className="h-4 bg-muted rounded animate-pulse"></div>
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : orders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                        لا توجد طلبات
                      </td>
                    </tr>
                  ) : (
                    orders.map((order: any) => (
                      <tr 
                        key={order.id} 
                        className="hover:bg-muted/20 transition-colors"
                        data-testid={`order-row-${order.id}`}
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium" data-testid={`order-number-${order.id}`}>
                            {order.orderNumber}
                          </div>
                          {order.trackingNumber && (
                            <div className="text-sm text-muted-foreground">
                              {order.trackingNumber}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{order.customerName}</div>
                          <div className="text-sm text-muted-foreground flex items-center">
                            <Phone className="h-3 w-3 ml-1" />
                            {order.phone}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <MapPin className="h-3 w-3 ml-1" />
                            {order.emirate}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-semibold">
                          {order.items && order.items.length > 0 
                            ? formatCurrency(
                                order.items.reduce((total: number, item: any) => 
                                  total + (parseFloat(item.unitPrice) * item.quantity), 0
                                )
                              )
                            : '--'
                          }
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={getPaymentMethodClass(order.paymentMethod)}>
                            {getPaymentMethodText(order.paymentMethod)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={getStatusBadgeClass(order.status)}>
                            {getStatusText(order.status)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {formatDateTime(order.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex space-x-reverse space-x-2">
                            <Button
                              onClick={() => handleViewOrder(order)}
                              variant="ghost"
                              size="sm"
                              className="p-2"
                              data-testid={`button-view-order-${order.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Select
                              value={order.status}
                              onValueChange={(value) => handleUpdateStatus(order, value)}
                            >
                              <SelectTrigger className="w-auto h-8" data-testid={`select-status-${order.id}`}>
                                <Edit className="h-4 w-4" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">قيد المعالجة</SelectItem>
                                <SelectItem value="out_for_delivery">قيد التوصيل</SelectItem>
                                <SelectItem value="delivered">تم التسليم</SelectItem>
                                <SelectItem value="cancelled">ملغى</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Order Detail Modal */}
      {showOrderDetail && selectedOrder && (
        <Dialog open={showOrderDetail} onOpenChange={setShowOrderDetail}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-reverse space-x-2">
                <Package className="h-5 w-5" />
                <span>تفاصيل الطلب {selectedOrder.orderNumber}</span>
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">معلومات العميل</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>الاسم:</strong> {selectedOrder.customerName}</p>
                    <p><strong>الهاتف:</strong> {selectedOrder.phone}</p>
                    <p><strong>الإمارة:</strong> {selectedOrder.emirate}</p>
                    <p><strong>العنوان:</strong> {selectedOrder.address}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">معلومات الطلب</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>رقم الطلب:</strong> {selectedOrder.orderNumber}</p>
                    <p><strong>التاريخ:</strong> {formatDateTime(selectedOrder.createdAt)}</p>
                    <p><strong>الحالة:</strong> {getStatusText(selectedOrder.status)}</p>
                    <p><strong>طريقة الدفع:</strong> {getPaymentMethodText(selectedOrder.paymentMethod)}</p>
                    {selectedOrder.trackingNumber && (
                      <p><strong>رقم التتبع:</strong> {selectedOrder.trackingNumber}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">المنتجات</h4>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                      <div>
                        <p className="font-medium">{item.product?.productCode || 'منتج'}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.colorName} - {item.sizeLabel} × {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold">
                        {formatCurrency(parseFloat(item.unitPrice) * item.quantity)}
                      </p>
                    </div>
                  )) || <p className="text-muted-foreground">لا توجد منتجات</p>}
                </div>
                
                {selectedOrder.items && selectedOrder.items.length > 0 && (
                  <div className="border-t border-border pt-2 mt-2">
                    <div className="flex justify-between font-semibold">
                      <span>المجموع:</span>
                      <span>
                        {formatCurrency(
                          selectedOrder.items.reduce((total: number, item: any) => 
                            total + (parseFloat(item.unitPrice) * item.quantity), 0
                          )
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
