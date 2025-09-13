import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import TopNav from "@/components/layout/top-nav";
import { Plus, RotateCcw, CheckCircle, Clock, Eye } from "lucide-react";

export default function Returns() {
  const { employee, context } = useStore();
  const [, setLocation] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string>("");
  const [returnReason, setReturnReason] = useState<string>("");
  const [selectedReturn, setSelectedReturn] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!employee || context !== 'online') {
      setLocation('/');
    }
  }, [employee, context, setLocation]);

  const { data: returns, isLoading } = useQuery({
    queryKey: ['/api/returns'],
    enabled: context === 'online',
  });

  const { data: deliveredOrders } = useQuery({
    queryKey: ['/api/orders', 'delivered'],
    enabled: context === 'online',
  });

  const createReturnMutation = useMutation({
    mutationFn: async (returnData: any) => {
      const response = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(returnData),
      });
      if (!response.ok) throw new Error('Failed to create return');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/returns'] });
      setIsDialogOpen(false);
      setSelectedOrder("");
      setReturnReason("");
      toast({
        title: "تم تسجيل المرتجع بنجاح",
        description: "تم تسجيل طلب المرتجع وهو في انتظار المراجعة",
      });
    },
    onError: () => {
      toast({
        title: "حدث خطأ",
        description: "فشل في تسجيل المرتجع",
        variant: "destructive",
      });
    },
  });

  const approveReturnMutation = useMutation({
    mutationFn: async (returnId: string) => {
      const response = await fetch(`/api/returns/${returnId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ processedBy: employee }),
      });
      if (!response.ok) throw new Error('Failed to approve return');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/returns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products', context] });
      toast({
        title: "تم قبول المرتجع",
        description: "تم قبول المرتجع وإعادة المنتج إلى المخزون",
      });
    },
    onError: () => {
      toast({
        title: "حدث خطأ",
        description: "فشل في قبول المرتجع",
        variant: "destructive",
      });
    },
  });

  if (!employee || context !== 'online') {
    return null;
  }

  const handleReturnSubmit = () => {
    if (!selectedOrder || !returnReason.trim()) {
      toast({
        title: "خطأ في البيانات",
        description: "يجب اختيار الطلب وكتابة سبب المرتجع",
        variant: "destructive",
      });
      return;
    }

    createReturnMutation.mutate({
      orderId: selectedOrder,
      reason: returnReason,
      processedBy: employee,
    });
  };

  const handleApproveReturn = (returnId: string) => {
    approveReturnMutation.mutate(returnId);
  };

  const pendingReturns = returns?.filter((ret: any) => !ret.approved) || [];
  const approvedReturns = returns?.filter((ret: any) => ret.approved) || [];

  return (
    <div className="min-h-screen bg-background">
      <TopNav />

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">إدارة المرتجعات</h1>
            <p className="text-muted-foreground">
              تسجيل ومعالجة مرتجعات الطلبات الإلكترونية
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2 space-x-reverse" data-testid="button-new-return">
                <Plus className="w-4 h-4" />
                <span>تسجيل مرتجع جديد</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>تسجيل مرتجع جديد</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>الطلب المراد إرجاعه</Label>
                  <Select
                    value={selectedOrder}
                    onValueChange={setSelectedOrder}
                    data-testid="select-order-for-return"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الطلب" />
                    </SelectTrigger>
                    <SelectContent>
                      {deliveredOrders?.map((order: any) => (
                        <SelectItem key={order.id} value={order.id}>
                          {order.orderNumber} - {order.customerName} - {order.totalAmount} AED
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="returnReason">سبب المرتجع</Label>
                  <Textarea
                    id="returnReason"
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    placeholder="اكتب سبب المرتجع..."
                    rows={3}
                    data-testid="textarea-return-reason"
                  />
                </div>

                <div className="flex justify-end space-x-2 space-x-reverse">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    data-testid="button-cancel-return"
                  >
                    إلغاء
                  </Button>
                  <Button
                    onClick={handleReturnSubmit}
                    disabled={createReturnMutation.isPending}
                    data-testid="button-submit-return"
                  >
                    {createReturnMutation.isPending ? "جاري التسجيل..." : "تسجيل المرتجع"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">مرتجعات في الانتظار</p>
                  <p className="text-2xl font-bold text-destructive" data-testid="text-pending-returns">
                    {pendingReturns.length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-destructive" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">مرتجعات مقبولة</p>
                  <p className="text-2xl font-bold text-chart-4" data-testid="text-approved-returns">
                    {approvedReturns.length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-chart-4" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Returns */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <Clock className="w-5 h-5 text-destructive" />
              <span>مرتجعات في الانتظار</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingReturns.length > 0 ? (
              <div className="space-y-4">
                {pendingReturns.map((returnItem: any) => (
                  <div
                    key={returnItem.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg"
                  >
                    <div className="flex items-center space-x-4 space-x-reverse">
                      <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
                        <RotateCcw className="w-6 h-6 text-destructive" />
                      </div>
                      <div>
                        <p className="font-semibold" data-testid={`text-return-order-${returnItem.id}`}>
                          مرتجع للطلب: {returnItem.order?.orderNumber || 'غير محدد'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          السبب: {returnItem.reason}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(returnItem.createdAt).toLocaleString('ar-AE')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Badge variant="outline" className="text-destructive border-destructive">
                        في الانتظار
                      </Badge>
                      <Button
                        size="sm"
                        onClick={() => handleApproveReturn(returnItem.id)}
                        disabled={approveReturnMutation.isPending}
                        data-testid={`button-approve-return-${returnItem.id}`}
                      >
                        <CheckCircle className="w-4 h-4 ml-1" />
                        قبول المرتجع
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد مرتجعات في الانتظار
              </div>
            )}
          </CardContent>
        </Card>

        {/* Approved Returns */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <CheckCircle className="w-5 h-5 text-chart-4" />
              <span>مرتجعات مقبولة</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-muted rounded"></div>
                  </div>
                ))}
              </div>
            ) : approvedReturns.length > 0 ? (
              <div className="space-y-4">
                {approvedReturns.map((returnItem: any) => (
                  <div
                    key={returnItem.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg bg-chart-4/5"
                  >
                    <div className="flex items-center space-x-4 space-x-reverse">
                      <div className="w-12 h-12 bg-chart-4/10 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-chart-4" />
                      </div>
                      <div>
                        <p className="font-semibold" data-testid={`text-approved-return-${returnItem.id}`}>
                          مرتجع للطلب: {returnItem.order?.orderNumber || 'غير محدد'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          السبب: {returnItem.reason}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          تم قبوله بواسطة: {returnItem.processedBy}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(returnItem.createdAt).toLocaleString('ar-AE')}
                        </p>
                      </div>
                    </div>
                    
                    <Badge className="bg-chart-4 text-white">
                      مقبول
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد مرتجعات مقبولة بعد
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
