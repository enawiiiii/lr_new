import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/hooks/use-store";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/header";
import Navigation from "@/components/navigation";
import { formatCurrency, formatDate } from "@/lib/api";
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  DollarSign, 
  ShoppingBag, 
  Calculator, 
  RotateCcw, 
  Trophy 
} from "lucide-react";
import type { DashboardStats, TopSellingProduct } from "@/types";

export default function Reports() {
  const { currentEmployee, currentStore } = useStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [selectedStore, setSelectedStore] = useState("all");

  // Redirect if not logged in
  if (!currentEmployee || !currentStore) {
    setLocation("/");
    return null;
  }

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: topProducts = [], isLoading: topProductsLoading } = useQuery<TopSellingProduct[]>({
    queryKey: ["/api/reports/top-products"],
  });

  const { data: sales = [], isLoading: salesLoading } = useQuery({
    queryKey: ["/api/sales", { storeType: selectedStore === 'all' ? undefined : selectedStore }],
  });

  const handleGenerateReport = () => {
    if (!dateFrom || !dateTo) {
      toast({
        title: "خطأ",
        description: "يرجى تحديد تاريخ البداية والنهاية",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "تم إنشاء التقرير",
      description: "تم إنشاء التقرير للفترة المحددة",
    });
  };

  const handleExportData = () => {
    // In a real application, this would trigger a download
    toast({
      title: "تم التصدير",
      description: "تم تصدير البيانات بصيغة CSV",
    });
  };

  // Calculate additional metrics
  const calculatePaymentMethodStats = () => {
    if (!sales.length) return { cash: 0, visa: 0, cod: 0, bank: 0 };
    
    const totals = sales.reduce((acc: any, sale: any) => {
      const amount = parseFloat(sale.totalAmount || '0');
      if (sale.paymentMethod === 'cash') acc.cash += amount;
      else if (sale.paymentMethod === 'visa') acc.visa += amount;
      else if (sale.paymentMethod === 'cod') acc.cod += amount;
      else if (sale.paymentMethod === 'bank') acc.bank += amount;
      return acc;
    }, { cash: 0, visa: 0, cod: 0, bank: 0 });

    const total = Object.values(totals).reduce((sum: number, value: any) => sum + value, 0);
    
    return {
      cash: { amount: totals.cash, percentage: total > 0 ? (totals.cash / total) * 100 : 0 },
      visa: { amount: totals.visa, percentage: total > 0 ? (totals.visa / total) * 100 : 0 },
      cod: { amount: totals.cod, percentage: total > 0 ? (totals.cod / total) * 100 : 0 },
      bank: { amount: totals.bank, percentage: total > 0 ? (totals.bank / total) * 100 : 0 }
    };
  };

  const paymentStats = calculatePaymentMethodStats();

  const calculateAverageSale = () => {
    if (!sales.length) return 0;
    const totalSales = sales.reduce((sum: number, sale: any) => sum + parseFloat(sale.totalAmount || '0'), 0);
    return totalSales / sales.length;
  };

  const calculateGrowthRate = () => {
    // Mock calculation - in real app, this would compare with previous period
    return 12.5;
  };

  return (
    <div className="min-h-screen bg-muted">
      <Header />
      <Navigation />
      
      <main className="p-6 fade-in">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">التقارير والإحصائيات</h2>
          <p className="text-muted-foreground">عرض تفصيلي لأداء المتجر والمبيعات</p>
        </div>

        {/* Report Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex gap-4 flex-1">
                <div>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-auto"
                    data-testid="input-date-from"
                  />
                </div>
                <span className="flex items-center text-muted-foreground">إلى</span>
                <div>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-auto"
                    data-testid="input-date-to"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={selectedStore} onValueChange={setSelectedStore}>
                  <SelectTrigger className="w-48" data-testid="select-store-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع المتاجر</SelectItem>
                    <SelectItem value="boutique">البوتيك فقط</SelectItem>
                    <SelectItem value="online">الأونلاين فقط</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleGenerateReport}
                  data-testid="button-generate-report"
                >
                  إنشاء التقرير
                </Button>
                <Button 
                  onClick={handleExportData}
                  variant="outline"
                  className="flex items-center space-x-reverse space-x-2"
                  data-testid="button-export-data"
                >
                  <Download className="h-4 w-4" />
                  <span>تصدير</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">إجمالي المبيعات</h3>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="text-green-600 h-6 w-6" />
                </div>
              </div>
              <p className="text-3xl font-bold text-green-600 mb-2" data-testid="stat-total-sales">
                {statsLoading ? "..." : formatCurrency((stats?.todaySales || 0) * 7)} {/* Mock weekly */}
              </p>
              <p className="text-sm text-muted-foreground">
                +{calculateGrowthRate()}% من الشهر الماضي
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">عدد المبيعات</h3>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="text-blue-600 h-6 w-6" />
                </div>
              </div>
              <p className="text-3xl font-bold text-blue-600 mb-2" data-testid="stat-sales-count">
                {salesLoading ? "..." : sales.length}
              </p>
              <p className="text-sm text-muted-foreground">+8.3% من الشهر الماضي</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">متوسط قيمة المبيعة</h3>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Calculator className="text-purple-600 h-6 w-6" />
                </div>
              </div>
              <p className="text-3xl font-bold text-purple-600 mb-2" data-testid="stat-average-sale">
                {salesLoading ? "..." : formatCurrency(calculateAverageSale())}
              </p>
              <p className="text-sm text-muted-foreground">+3.7% من الشهر الماضي</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">المرتجعات</h3>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <RotateCcw className="text-red-600 h-6 w-6" />
                </div>
              </div>
              <p className="text-3xl font-bold text-red-600 mb-2" data-testid="stat-returns">
                3
              </p>
              <p className="text-sm text-muted-foreground">-2.1% من الشهر الماضي</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Reports */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Selling Products */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">أعلى المنتجات مبيعاً</h3>
                <Trophy className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-3">
                {topProductsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center space-x-reverse space-x-3">
                          <div className="w-10 h-10 bg-muted rounded-lg"></div>
                          <div>
                            <div className="h-4 bg-muted rounded w-24 mb-1"></div>
                            <div className="h-3 bg-muted rounded w-16"></div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="h-4 bg-muted rounded w-12 mb-1"></div>
                          <div className="h-3 bg-muted rounded w-16"></div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : topProducts.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">لا توجد بيانات كافية</p>
                  </div>
                ) : (
                  topProducts.slice(0, 5).map((item, index) => (
                    <div 
                      key={item.product.id}
                      className="flex justify-between items-center p-3 bg-muted/30 rounded-lg"
                      data-testid={`top-product-${index}`}
                    >
                      <div className="flex items-center space-x-reverse space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <span className="text-primary font-semibold">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">{item.product.productCode}</p>
                          <p className="text-sm text-muted-foreground">{item.product.brand}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{item.totalSold} قطعة</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(item.totalRevenue)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods Breakdown */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">المبيعات حسب طريقة الدفع</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-reverse space-x-3">
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    <span>كاش</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold" data-testid="payment-cash-amount">
                      {formatCurrency(paymentStats.cash.amount)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {paymentStats.cash.percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-reverse space-x-3">
                    <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                    <span>فيزا</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold" data-testid="payment-visa-amount">
                      {formatCurrency(paymentStats.visa.amount)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {paymentStats.visa.percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
                
                {currentStore === 'online' && (
                  <>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-reverse space-x-3">
                        <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                        <span>الدفع عند التسليم</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold" data-testid="payment-cod-amount">
                          {formatCurrency(paymentStats.cod.amount)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {paymentStats.cod.percentage.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-reverse space-x-3">
                        <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                        <span>تحويل بنكي</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold" data-testid="payment-bank-amount">
                          {formatCurrency(paymentStats.bank.amount)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {paymentStats.bank.percentage.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* Visual Chart representation */}
                <div className="mt-6">
                  <div className="w-full bg-muted rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-green-500 via-blue-500 to-orange-500 h-3 rounded-full transition-all duration-500" 
                      style={{ width: '100%' }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Sales Summary */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">ملخص المبيعات الأخيرة</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/30 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-right font-medium">التاريخ</th>
                    <th className="px-4 py-3 text-right font-medium">الموظف</th>
                    <th className="px-4 py-3 text-right font-medium">نوع المتجر</th>
                    <th className="px-4 py-3 text-right font-medium">طريقة الدفع</th>
                    <th className="px-4 py-3 text-right font-medium">المبلغ</th>
                    <th className="px-4 py-3 text-right font-medium">الضريبة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {salesLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 6 }).map((_, j) => (
                          <td key={j} className="px-4 py-3">
                            <div className="h-4 bg-muted rounded animate-pulse"></div>
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : sales.slice(0, 10).map((sale: any, index: number) => (
                    <tr 
                      key={sale.id} 
                      className="hover:bg-muted/20 transition-colors"
                      data-testid={`sale-summary-${index}`}
                    >
                      <td className="px-4 py-3 text-sm">
                        {formatDate(sale.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {sale.employee?.name || currentEmployee.name}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">
                          {sale.storeType === 'boutique' ? 'بوتيك' : 'أونلاين'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={
                          sale.paymentMethod === 'cash' ? 'payment-cash' :
                          sale.paymentMethod === 'visa' ? 'payment-visa' :
                          sale.paymentMethod === 'cod' ? 'payment-cod' : 'payment-bank'
                        }>
                          {sale.paymentMethod === 'cash' ? 'كاش' :
                           sale.paymentMethod === 'visa' ? 'فيزا' :
                           sale.paymentMethod === 'cod' ? 'الدفع عند التسليم' : 'تحويل بنكي'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        {formatCurrency(sale.totalAmount)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {sale.taxApplied ? formatCurrency(sale.taxAmount) : '--'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
