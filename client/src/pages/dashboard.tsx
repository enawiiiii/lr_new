import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { useStore } from "@/hooks/use-store";
import { useLocation } from "wouter";
import Header from "@/components/header";
import Navigation from "@/components/navigation";
import { formatCurrency, formatDateTime } from "@/lib/api";
import { 
  Package, 
  TrendingUp, 
  Clock, 
  AlertTriangle,
  DollarSign,
  ShoppingBag 
} from "lucide-react";
import type { DashboardStats } from "@/types";

export default function Dashboard() {
  const { currentEmployee, currentStore } = useStore();
  const [, setLocation] = useLocation();

  // Redirect if not logged in
  if (!currentEmployee || !currentStore) {
    setLocation("/");
    return null;
  }

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentSales = [], isLoading: salesLoading } = useQuery({
    queryKey: ["/api/sales", { limit: 5, storeType: currentStore }],
  });

  const { data: pendingOrders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/orders", { limit: 5 }],
    enabled: currentStore === 'online',
  });

  return (
    <div className="min-h-screen bg-muted">
      <Header />
      <Navigation />
      
      <main className="p-6 fade-in">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2" data-testid="text-welcome">
            مرحباً، {currentEmployee.name}
          </h2>
          <p className="text-muted-foreground">نظرة عامة على أداء المتجر اليوم</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">إجمالي المنتجات</p>
                  <p className="text-2xl font-bold" data-testid="stat-total-products">
                    {isLoading ? "..." : stats?.totalProducts || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Package className="text-primary h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">مبيعات اليوم</p>
                  <p className="text-2xl font-bold" data-testid="stat-today-sales">
                    {isLoading ? "..." : formatCurrency(stats?.todaySales || 0)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="text-green-600 h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {currentStore === 'online' && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">طلبات قيد المعالجة</p>
                    <p className="text-2xl font-bold" data-testid="stat-pending-orders">
                      {isLoading ? "..." : stats?.pendingOrders || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Clock className="text-orange-600 h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">منتجات قليلة المخزون</p>
                  <p className="text-2xl font-bold text-red-600" data-testid="stat-low-stock">
                    {isLoading ? "..." : stats?.lowStockProducts || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="text-red-600 h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Sales */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">المبيعات الأخيرة</h3>
              <div className="space-y-3">
                {salesLoading ? (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">جاري التحميل...</p>
                  </div>
                ) : recentSales.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">لا توجد مبيعات حديثة</p>
                  </div>
                ) : (
                  recentSales.map((sale: any, index: number) => (
                    <div 
                      key={sale.id || index} 
                      className="flex justify-between items-center p-3 bg-muted/50 rounded-lg"
                      data-testid={`recent-sale-${index}`}
                    >
                      <div>
                        <p className="font-medium">
                          {sale.items?.[0]?.product?.productCode || 'منتج'} - {sale.paymentMethod === 'cash' ? 'كاش' : 'فيزا'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {sale.employee?.name || currentEmployee.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(sale.totalAmount)}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDateTime(sale.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pending Orders (Online Store Only) */}
          {currentStore === 'online' && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">طلبات تحتاج متابعة</h3>
                <div className="space-y-3">
                  {ordersLoading ? (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">جاري التحميل...</p>
                    </div>
                  ) : pendingOrders.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">لا توجد طلبات قيد المعالجة</p>
                    </div>
                  ) : (
                    pendingOrders
                      .filter((order: any) => order.status !== 'delivered')
                      .slice(0, 5)
                      .map((order: any, index: number) => (
                        <div 
                          key={order.id || index}
                          className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-200"
                          data-testid={`pending-order-${index}`}
                        >
                          <div>
                            <p className="font-medium">{order.orderNumber}</p>
                            <p className="text-sm text-muted-foreground">
                              {order.customerName} - {order.emirate}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">
                              {order.status === 'pending' ? 'قيد المعالجة' : 
                               order.status === 'out_for_delivery' ? 'قيد التوصيل' : order.status}
                            </span>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Stats for Boutique */}
          {currentStore === 'boutique' && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">إحصائيات سريعة</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-reverse space-x-3">
                      <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                      <span>المبيعات كاش</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold" data-testid="text-cash-sales">
                        {formatCurrency((stats?.todaySales || 0) * 0.65)}
                      </p>
                      <p className="text-sm text-muted-foreground">65%</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-reverse space-x-3">
                      <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                      <span>المبيعات فيزا</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold" data-testid="text-visa-sales">
                        {formatCurrency((stats?.todaySales || 0) * 0.35)}
                      </p>
                      <p className="text-sm text-muted-foreground">35%</p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="w-full bg-muted rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full" 
                        style={{ width: '100%' }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
