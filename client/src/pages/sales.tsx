import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import TopNav from "@/components/layout/top-nav";
import SaleForm from "@/components/forms/sale-form";
import { Plus, Receipt, CreditCard, Calendar } from "lucide-react";

export default function Sales() {
  const { employee, context } = useStore();
  const [, setLocation] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!employee || !context) {
      setLocation('/');
    }
  }, [employee, context, setLocation]);

  const { data: sales, isLoading } = useQuery({
    queryKey: ['/api/sales'],
    enabled: !!context,
  });

  const { data: products } = useQuery({
    queryKey: ['/api/products', context],
    enabled: !!context,
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
    onSuccess: (sale) => {
      queryClient.invalidateQueries({ queryKey: ['/api/sales'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products', context] });
      setIsDialogOpen(false);
      toast({
        title: "تم تسجيل البيع بنجاح",
        description: `فاتورة رقم: ${sale.invoiceNumber}`,
      });
    },
    onError: () => {
      toast({
        title: "حدث خطأ",
        description: "فشل في تسجيل البيع",
        variant: "destructive",
      });
    },
  });

  if (!employee || !context) {
    return null;
  }

  const handleSaleSubmit = (data: any) => {
    createSaleMutation.mutate({
      ...data,
      soldBy: employee,
    });
  };

  const todaysSales = sales?.filter((sale: any) => {
    const saleDate = new Date(sale.createdAt);
    const today = new Date();
    return saleDate.toDateString() === today.toDateString();
  }) || [];

  const todaysTotal = todaysSales.reduce((sum: number, sale: any) => sum + parseFloat(sale.totalAmount), 0);

  return (
    <div className="min-h-screen bg-background">
      <TopNav />

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {context === 'boutique' ? 'مبيعات البوتيك' : 'المبيعات المحلية'}
            </h1>
            <p className="text-muted-foreground">
              إدارة وتسجيل المبيعات المباشرة
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2 space-x-reverse" data-testid="button-new-sale">
                <Plus className="w-4 h-4" />
                <span>تسجيل بيع جديد</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>تسجيل بيع جديد</DialogTitle>
              </DialogHeader>
              <SaleForm
                products={products || []}
                onSubmit={handleSaleSubmit}
                isLoading={createSaleMutation.isPending}
                onCancel={() => setIsDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Today's Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">مبيعات اليوم</p>
                  <p className="text-2xl font-bold text-primary" data-testid="text-today-sales-count">
                    {todaysSales.length}
                  </p>
                </div>
                <Receipt className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي اليوم</p>
                  <p className="text-2xl font-bold text-secondary" data-testid="text-today-total">
                    {todaysTotal.toFixed(2)} AED
                  </p>
                </div>
                <CreditCard className="w-8 h-8 text-secondary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">متوسط الفاتورة</p>
                  <p className="text-2xl font-bold text-chart-3" data-testid="text-average-sale">
                    {todaysSales.length > 0 ? (todaysTotal / todaysSales.length).toFixed(2) : '0.00'} AED
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-chart-3" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sales List */}
        <Card>
          <CardHeader>
            <CardTitle>قائمة المبيعات</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-muted rounded"></div>
                  </div>
                ))}
              </div>
            ) : sales && sales.length > 0 ? (
              <div className="space-y-4">
                {sales.slice(0, 20).map((sale: any) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-4 space-x-reverse">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Receipt className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold" data-testid={`text-sale-invoice-${sale.id}`}>
                          فاتورة رقم: {sale.invoiceNumber}
                        </p>
                        <p className="text-sm text-muted-foreground" data-testid={`text-sale-customer-${sale.id}`}>
                          {sale.customerName} - {sale.customerPhone}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(sale.createdAt).toLocaleString('ar-AE')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-primary" data-testid={`text-sale-amount-${sale.id}`}>
                        {sale.totalAmount} AED
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {sale.paymentMethod === 'cash' ? 'نقداً' : 'بطاقة'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {sale.soldBy}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Receipt className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">لا توجد مبيعات</h3>
                <p className="text-muted-foreground mb-4">
                  ابدأ بتسجيل مبيعاتك الأولى
                </p>
                <Button onClick={() => setIsDialogOpen(true)} data-testid="button-first-sale">
                  تسجيل بيع جديد
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
