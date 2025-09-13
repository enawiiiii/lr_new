import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { ORDER_STATUSES } from "@/lib/types";
import TopNav from "@/components/layout/top-nav";
import OrderForm from "@/components/forms/order-form";
import { Plus, Truck, Clock, CheckCircle, XCircle, RotateCcw, Eye, Edit } from "lucide-react";

export default function Orders() {
  const { employee, context } = useStore();
  const [, setLocation] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!employee || context !== 'online') {
      setLocation('/');
    }
  }, [employee, context, setLocation]);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['/api/orders', selectedStatus === 'all' ? undefined : selectedStatus],
    enabled: context === 'online',
  });

  const { data: products } = useQuery({
    queryKey: ['/api/products', context],
    enabled: !!context,
  });

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      if (!response.ok) throw new Error('Failed to create order');
      return response.json();
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      setIsDialogOpen(false);
      toast({
        title: "تم إنشاء الطلب بنجاح",
        description: `رقم الطلب: ${order.orderNumber}`,
      });
    },
    onError: () => {
      toast({
        title: "حدث خطأ",
        description: "فشل في إنشاء الطلب",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, updatedBy: employee }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products', context] });
      toast({
        title: "تم تحديث الحالة بنجاح",
        description: "تم تحديث حالة الطلب",
      });
    },
    onError: () => {
      toast({
        title: "حدث خطأ",
        description: "فشل في تحديث حالة الطلب",
        variant: "destructive",
      });
    },
  });

  if (!employee || context !== 'online') {
    return null;
  }

  const handleOrderSubmit = (data: any) => {
    createOrderMutation.mutate({
      ...data,
      createdBy: employee,
    });
  };

  const handleStatusUpdate = (orderId: string, newStatus: string) => {
    updateStatusMutation.mutate({ orderId, status: newStatus });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      case 'returned':
        return <RotateCcw className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-chart-3 text-white';
      case 'delivered':
        return 'bg-chart-4 text-white';
      case 'cancelled':
        return 'bg-destructive text-destructive-foreground';
      case 'returned':
        return 'bg-secondary text-secondary-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const statusCounts = orders?.reduce((acc: any, order: any) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {}) || {};

  const filteredOrders = selectedStatus === 'all' 
    ? orders 
    : orders?.filter((order: any) => order.status === selectedStatus);

  return (
    <div className="min-h-screen bg-background">
      <TopNav />

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">الطلبات الإلكترونية</h1>
            <p className="text-muted-foreground">
              إدارة وتتبع الطلبات الإلكترونية
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2 space-x-reverse" data-testid="button-new-order">
                <Plus className="w-4 h-4" />
                <span>طلب جديد</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>طلب إلكتروني جديد</DialogTitle>
              </DialogHeader>
              <OrderForm
                products={products || []}
                onSubmit={handleOrderSubmit}
                isLoading={createOrderMutation.isPending}
                onCancel={() => setIsDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Status Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedStatus('pending')}>
            <CardContent className="p-4 text-center">
              <Clock className="w-8 h-8 text-chart-3 mx-auto mb-2" />
              <p className="text-2xl font-bold text-chart-3" data-testid="text-pending-count">
                {statusCounts.pending || 0}
              </p>
              <p className="text-sm text-muted-foreground">قيد التوصيل</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedStatus('delivered')}>
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-8 h-8 text-chart-4 mx-auto mb-2" />
              <p className="text-2xl font-bold text-chart-4" data-testid="text-delivered-count">
                {statusCounts.delivered || 0}
              </p>
              <p className="text-sm text-muted-foreground">وصل</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedStatus('cancelled')}>
            <CardContent className="p-4 text-center">
              <XCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
              <p className="text-2xl font-bold text-destructive" data-testid="text-cancelled-count">
                {statusCounts.cancelled || 0}
              </p>
              <p className="text-sm text-muted-foreground">تم إلغاؤه</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedStatus('returned')}>
            <CardContent className="p-4 text-center">
              <RotateCcw className="w-8 h-8 text-secondary mx-auto mb-2" />
              <p className="text-2xl font-bold text-secondary" data-testid="text-returned-count">
                {statusCounts.returned || 0}
              </p>
              <p className="text-sm text-muted-foreground">مرتجع</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter and Orders List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>قائمة الطلبات</CardTitle>
            <div className="flex items-center space-x-2 space-x-reverse">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="تصفية حسب الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الطلبات</SelectItem>
                  <SelectItem value="pending">قيد التوصيل</SelectItem>
                  <SelectItem value="delivered">وصل</SelectItem>
                  <SelectItem value="cancelled">تم إلغاؤه</SelectItem>
                  <SelectItem value="returned">مرتجع</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-20 bg-muted rounded"></div>
                  </div>
                ))}
              </div>
            ) : filteredOrders && filteredOrders.length > 0 ? (
              <div className="space-y-4">
                {filteredOrders.map((order: any) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-4 space-x-reverse">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Truck className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 space-x-reverse mb-1">
                          <p className="font-semibold" data-testid={`text-order-number-${order.id}`}>
                            طلب رقم: {order.orderNumber}
                          </p>
                          <Badge className={`${getStatusColor(order.status)} flex items-center space-x-1 space-x-reverse`}>
                            {getStatusIcon(order.status)}
                            <span>{ORDER_STATUSES[order.status as keyof typeof ORDER_STATUSES]}</span>
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground" data-testid={`text-order-customer-${order.id}`}>
                          {order.customerName} - {order.customerPhone}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {order.emirate} - {order.trackingNumber || 'لا يوجد رقم تتبع'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleString('ar-AE')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className="text-right">
                        <p className="font-bold text-lg text-primary" data-testid={`text-order-amount-${order.id}`}>
                          {order.totalAmount} AED
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {order.createdBy}
                        </p>
                      </div>
                      
                      <div className="flex flex-col space-y-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedOrder(order)}
                          data-testid={`button-view-order-${order.id}`}
                        >
                          <Eye className="w-4 h-4 ml-1" />
                          عرض
                        </Button>
                        
                        {order.status === 'pending' && (
                          <Select
                            onValueChange={(newStatus) => handleStatusUpdate(order.id, newStatus)}
                            data-testid={`select-status-${order.id}`}
                          >
                            <SelectTrigger className="w-24 h-8">
                              <SelectValue placeholder="حالة" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="delivered">وصل</SelectItem>
                              <SelectItem value="cancelled">إلغاء</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Truck className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">لا توجد طلبات</h3>
                <p className="text-muted-foreground mb-4">
                  ابدأ بإنشاء طلبات جديدة
                </p>
                <Button onClick={() => setIsDialogOpen(true)} data-testid="button-first-order">
                  طلب جديد
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Details Modal */}
        {selectedOrder && (
          <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>تفاصيل الطلب: {selectedOrder.orderNumber}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">معلومات العميل:</h4>
                    <p><strong>الاسم:</strong> {selectedOrder.customerName}</p>
                    <p><strong>الهاتف:</strong> {selectedOrder.customerPhone}</p>
                    <p><strong>الإمارة:</strong> {selectedOrder.emirate}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">تفاصيل الطلب:</h4>
                    <p><strong>رقم التتبع:</strong> {selectedOrder.trackingNumber || 'غير محدد'}</p>
                    <p><strong>المبلغ:</strong> {selectedOrder.totalAmount} AED</p>
                    <p><strong>الكمية:</strong> {selectedOrder.quantity}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">العنوان:</h4>
                  <p className="text-sm bg-muted p-3 rounded">{selectedOrder.address}</p>
                </div>
                
                {selectedOrder.notes && (
                  <div>
                    <h4 className="font-semibold mb-2">ملاحظات:</h4>
                    <p className="text-sm bg-muted p-3 rounded">{selectedOrder.notes}</p>
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Badge className={`${getStatusColor(selectedOrder.status)} flex items-center space-x-1 space-x-reverse`}>
                      {getStatusIcon(selectedOrder.status)}
                      <span>{ORDER_STATUSES[selectedOrder.status as keyof typeof ORDER_STATUSES]}</span>
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    تم الإنشاء: {new Date(selectedOrder.createdAt).toLocaleString('ar-AE')}
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
