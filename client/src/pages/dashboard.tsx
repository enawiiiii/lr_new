import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { CONTEXTS } from "@/lib/types";
import TopNav from "@/components/layout/top-nav";
import { BarChart3, ShoppingCart, Package, RotateCcw, Plus, CreditCard, Truck, FileText } from "lucide-react";

export default function Dashboard() {
  const { employee, context } = useStore();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!employee || !context) {
      setLocation('/');
    }
  }, [employee, context, setLocation]);

  const { data: activities } = useQuery({
    queryKey: ['/api/activities', { context, limit: 10 }],
    enabled: !!context,
  });

  const { data: todayReport } = useQuery({
    queryKey: ['/api/reports', context, 'daily', new Date().toISOString().split('T')[0]],
    enabled: !!context,
  });

  if (!employee || !context) {
    return null;
  }

  const contextConfig = CONTEXTS.find(c => c.id === context);

  const quickActions = [
    {
      id: 'add-product',
      title: 'إضافة منتج',
      icon: Plus,
      action: () => setLocation('/inventory'),
      color: 'bg-primary hover:bg-primary/90 text-primary-foreground'
    },
    {
      id: 'new-sale',
      title: context === 'boutique' ? 'تسجيل بيع' : 'طلب في المتجر',
      icon: CreditCard,
      action: () => setLocation('/sales'),
      color: 'bg-secondary hover:bg-secondary/90 text-secondary-foreground'
    },
    {
      id: 'new-order',
      title: 'طلب جديد',
      icon: Truck,
      action: () => setLocation('/orders'),
      color: 'bg-chart-3 hover:bg-chart-3/90 text-white',
      show: context === 'online'
    },
    {
      id: 'reports',
      title: 'التقارير',
      icon: FileText,
      action: () => setLocation('/reports'),
      color: 'bg-chart-4 hover:bg-chart-4/90 text-white'
    }
  ].filter(action => action.show !== false);

  return (
    <div className="min-h-screen bg-background">
      <TopNav />

      <div className="container mx-auto px-4 py-8">
        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">المبيعات اليوم</h3>
                <BarChart3 className="text-primary text-xl" />
              </div>
              <div className="text-3xl font-bold text-primary mb-2" data-testid="text-today-sales">
                {todayReport?.totalAmount || 0} AED
              </div>
              <p className="text-sm text-muted-foreground">
                {todayReport?.totalSales || 0} عملية بيع
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">
                  {context === 'boutique' ? 'المبيعات' : 'الطلبات الجديدة'}
                </h3>
                <ShoppingCart className="text-secondary text-xl" />
              </div>
              <div className="text-3xl font-bold text-secondary mb-2" data-testid="text-new-orders">
                {todayReport?.totalSales || 0}
              </div>
              <p className="text-sm text-muted-foreground">
                {context === 'boutique' ? 'مبيعات اليوم' : 'قيد التوصيل'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">المنتجات</h3>
                <Package className="text-chart-3 text-xl" />
              </div>
              <div className="text-3xl font-bold text-chart-3 mb-2" data-testid="text-total-products">
                -
              </div>
              <p className="text-sm text-muted-foreground">في المخزون</p>
            </CardContent>
          </Card>

          {context === 'online' && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">المرتجعات</h3>
                  <RotateCcw className="text-destructive text-xl" />
                </div>
                <div className="text-3xl font-bold text-destructive mb-2" data-testid="text-pending-returns">
                  0
                </div>
                <p className="text-sm text-muted-foreground">في الانتظار</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>الإجراءات السريعة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={action.id}
                    onClick={action.action}
                    className={`${action.color} p-4 rounded-lg transition-colors text-center h-auto flex-col`}
                    data-testid={`button-quick-action-${action.id}`}
                  >
                    <Icon className="text-2xl mb-2" />
                    <span className="text-sm font-medium">{action.title}</span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>النشاط الأخير</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities && activities.length > 0 ? (
                activities.slice(0, 5).map((activity: any) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <i className="fas fa-clock text-primary"></i>
                      </div>
                      <div>
                        <p className="font-medium text-foreground" data-testid={`text-activity-${activity.id}`}>
                          {activity.description}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(activity.createdAt).toLocaleString('ar-AE')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">{activity.employeeName}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد أنشطة حديثة
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
