import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { CONTEXTS } from "@/lib/types";
import { useLocation } from "wouter";
import { Settings, Home, Package, ShoppingCart, Truck, RotateCcw, ChartBar } from "lucide-react";

export default function TopNav() {
  const { employee, context, reset } = useStore();
  const [location, setLocation] = useLocation();

  const handleChangeContext = () => {
    reset();
    setLocation('/');
  };

  const contextConfig = CONTEXTS.find(c => c.id === context);

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'الرئيسية' },
    { path: '/inventory', icon: Package, label: 'المخزون' },
    { path: '/sales', icon: ShoppingCart, label: context === 'boutique' ? 'المبيعات' : 'المبيعات المحلية' },
    ...(context === 'online' ? [
      { path: '/orders', icon: Truck, label: 'الطلبات الإلكترونية' },
      { path: '/returns', icon: RotateCcw, label: 'المرتجعات' }
    ] : []),
    { path: '/reports', icon: ChartBar, label: 'التقارير' },
  ];

  return (
    <nav className="bg-card border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4 space-x-reverse">
            <i className="fas fa-store text-primary text-xl"></i>
            <h1 className="text-lg font-semibold">نظام إدارة المتجر</h1>
          </div>
          
          {/* Navigation Items */}
          <div className="hidden md:flex items-center space-x-1 space-x-reverse">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              return (
                <Button
                  key={item.path}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setLocation(item.path)}
                  className="flex items-center space-x-2 space-x-reverse"
                  data-testid={`nav-${item.path.slice(1)}`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Button>
              );
            })}
          </div>
          
          <div className="flex items-center space-x-4 space-x-reverse">
            {/* Current Context Display */}
            <div className="bg-muted px-3 py-1 rounded-full text-sm">
              <span className="text-muted-foreground">الموظف:</span>
              <span className="font-medium text-foreground mx-1" data-testid="text-current-employee">
                {employee}
              </span>
              <span className="text-muted-foreground mx-2">•</span>
              <span className="text-muted-foreground">السياق:</span>
              <span className="font-medium text-foreground mx-1" data-testid="text-current-context">
                {contextConfig?.name}
              </span>
            </div>
            
            {/* Change Context Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleChangeContext}
              className="flex items-center space-x-2 space-x-reverse"
              data-testid="button-change-context"
            >
              <Settings className="w-4 h-4" />
              <span>تغيير السياق</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
