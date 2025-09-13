import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/lib/store";
import TopNav from "@/components/layout/top-nav";
import { BarChart3, TrendingUp, Calendar, Download, DollarSign, ShoppingCart, Package, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Reports() {
  const { employee, context } = useStore();
  const [, setLocation] = useLocation();
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (!employee || !context) {
      setLocation('/');
    }
  }, [employee, context, setLocation]);

  const { data: dailyReport } = useQuery({
    queryKey: ['/api/reports', context, 'daily', selectedDate],
    enabled: !!context && selectedPeriod === 'daily',
  });

  const { data: weeklyReport } = useQuery({
    queryKey: ['/api/reports', context, 'weekly', getWeekStart(selectedDate)],
    enabled: !!context && selectedPeriod === 'weekly',
  });

  const { data: monthlyReport } = useQuery({
    queryKey: ['/api/reports', context, 'monthly', getMonthStart(selectedDate)],
    enabled: !!context && selectedPeriod === 'monthly',
  });

  const { data: activities } = useQuery({
    queryKey: ['/api/activities', { context, limit: 50 }],
    enabled: !!context,
  });

  const { data: products } = useQuery({
    queryKey: ['/api/products', context],
    enabled: !!context,
  });

  if (!employee || !context) {
    return null;
  }

  function getWeekStart(dateString: string): string {
    const date = new Date(dateString);
    const day = date.getDay();
    const diff = date.getDate() - day;
    const weekStart = new Date(date.setDate(diff));
    return weekStart.toISOString().split('T')[0];
  }

  function getMonthStart(dateString: string): string {
    const date = new Date(dateString);
    return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
  }

  const getCurrentReport = () => {
    switch (selectedPeriod) {
      case 'daily':
        return dailyReport;
      case 'weekly':
        return weeklyReport;
      case 'monthly':
        return monthlyReport;
      default:
        return null;
    }
  };

  const currentReport = getCurrentReport();

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'daily':
        return 'يومية';
      case 'weekly':
        return 'أسبوعية';
      case 'monthly':
        return 'شهرية';
      default:
        return '';
    }
  };

  const handleExportReport = (format: 'pdf' | 'excel') => {
    // This would typically trigger a download from the backend
    console.log(`Exporting ${selectedPeriod} report as ${format}`);
  };

  const contextName = context === 'boutique' ? 'البوتيك' : 'المتجر الإلكتروني';

  return (
    <div className="min-h-screen bg-background">
      <TopNav />

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">التقارير والإحصائيات</h1>
            <p className="text-muted-foreground">
              تقارير مفصلة لمبيعات {contextName}
            </p>
          </div>
          
          <div className="flex items-center space-x-4 space-x-reverse">
            <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="نوع التقرير" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">يومي</SelectItem>
                <SelectItem value="weekly">أسبوعي</SelectItem>
                <SelectItem value="monthly">شهري</SelectItem>
              </SelectContent>
            </Select>
            
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-border rounded-md"
              data-testid="input-report-date"
            />
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="detailed">تقرير مفصل</TabsTrigger>
            <TabsTrigger value="activity">سجل النشاط</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">إجمالي المبيعات</p>
                      <p className="text-2xl font-bold text-primary" data-testid="text-total-sales">
                        {currentReport?.totalSales || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">التقرير ال{getPeriodLabel()}</p>
                    </div>
                    <ShoppingCart className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">إجمالي الإيرادات</p>
                      <p className="text-2xl font-bold text-secondary" data-testid="text-total-revenue">
                        {currentReport?.totalAmount?.toFixed(2) || '0.00'} AED
                      </p>
                      <p className="text-xs text-muted-foreground">التقرير ال{getPeriodLabel()}</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-secondary" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">متوسط قيمة الفاتورة</p>
                      <p className="text-2xl font-bold text-chart-3" data-testid="text-average-order">
                        {currentReport?.totalSales > 0 
                          ? (currentReport.totalAmount / currentReport.totalSales).toFixed(2)
                          : '0.00'} AED
                      </p>
                      <p className="text-xs text-muted-foreground">التقرير ال{getPeriodLabel()}</p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-chart-3" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Products Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 space-x-reverse">
                  <Package className="w-5 h-5" />
                  <span>ملخص المخزون</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">إجمالي المنتجات</p>
                    <p className="text-3xl font-bold text-primary" data-testid="text-total-products">
                      {products?.length || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">نوع السياق</p>
                    <p className="text-lg font-semibold text-secondary">
                      {contextName}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="detailed" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>التقرير المفصل - {getPeriodLabel()}</CardTitle>
                <div className="flex space-x-2 space-x-reverse">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportReport('pdf')}
                    data-testid="button-export-pdf"
                  >
                    <Download className="w-4 h-4 ml-1" />
                    PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportReport('excel')}
                    data-testid="button-export-excel"
                  >
                    <Download className="w-4 h-4 ml-1" />
                    Excel
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">معلومات أساسية</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">نوع التقرير:</span>
                          <span className="font-medium">تقرير {getPeriodLabel()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">التاريخ:</span>
                          <span className="font-medium">{selectedDate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">السياق:</span>
                          <span className="font-medium">{contextName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">الموظف:</span>
                          <span className="font-medium">{employee}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">الأرقام الرئيسية</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">عدد المبيعات:</span>
                          <span className="font-bold text-primary">{currentReport?.totalSales || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">إجمالي الإيرادات:</span>
                          <span className="font-bold text-secondary">
                            {currentReport?.totalAmount?.toFixed(2) || '0.00'} AED
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">متوسط قيمة البيع:</span>
                          <span className="font-bold text-chart-3">
                            {currentReport?.totalSales > 0 
                              ? (currentReport.totalAmount / currentReport.totalSales).toFixed(2)
                              : '0.00'} AED
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">ملاحظات</h3>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        هذا التقرير يشمل جميع العمليات المسجلة في نظام {contextName} للفترة المحددة.
                        {context === 'boutique' 
                          ? ' يتم خصم المخزون فوراً عند تسجيل البيع.'
                          : ' يتم خصم المخزون عند تغيير حالة الطلب إلى "وصل".'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>سجل النشاط</CardTitle>
              </CardHeader>
              <CardContent>
                {activities && activities.length > 0 ? (
                  <div className="space-y-4">
                    {activities.map((activity: any) => (
                      <div
                        key={activity.id}
                        className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            {activity.type === 'product_added' && <Package className="w-5 h-5 text-primary" />}
                            {activity.type === 'sale_made' && <ShoppingCart className="w-5 h-5 text-secondary" />}
                            {activity.type === 'order_created' && <Calendar className="w-5 h-5 text-chart-3" />}
                            {activity.type === 'status_updated' && <TrendingUp className="w-5 h-5 text-chart-4" />}
                            {activity.type === 'return_processed' && <RotateCcw className="w-5 h-5 text-destructive" />}
                          </div>
                          <div>
                            <p className="font-medium text-foreground" data-testid={`text-activity-desc-${activity.id}`}>
                              {activity.description}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {activity.employeeName} • {new Date(activity.createdAt).toLocaleString('ar-AE')}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {activity.context === 'boutique' ? 'بوتيك' : 'أونلاين'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    لا توجد أنشطة مسجلة
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
