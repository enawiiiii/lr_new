import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useStore } from "@/hooks/use-store";
import { 
  Home, 
  Package, 
  ScanBarcode, 
  ShoppingCart, 
  RotateCcw, 
  BarChart3 
} from "lucide-react";

const navigationItems = [
  { key: "dashboard", label: "الرئيسية", icon: Home, path: "/dashboard", stores: ["boutique", "online"] },
  { key: "inventory", label: "المخزون", icon: Package, path: "/inventory", stores: ["boutique", "online"] },
  { key: "pos", label: "نقاط البيع", icon: ScanBarcode, path: "/pos", stores: ["boutique"] },
  { key: "orders", label: "الطلبات", icon: ShoppingCart, path: "/orders", stores: ["online"] },
  { key: "returns", label: "المرتجعات", icon: RotateCcw, path: "/returns", stores: ["boutique", "online"] },
  { key: "reports", label: "التقارير", icon: BarChart3, path: "/reports", stores: ["boutique", "online"] },
];

export default function Navigation() {
  const [location, setLocation] = useLocation();
  const { currentStore } = useStore();

  const visibleItems = navigationItems.filter(item => 
    item.stores.includes(currentStore || "")
  );

  return (
    <nav className="bg-card border-b border-border">
      <div className="px-6 py-3">
        <div className="flex space-x-reverse space-x-6 overflow-x-auto">
          {visibleItems.map(({ key, label, icon: Icon, path }) => {
            const isActive = location === path;
            
            return (
              <Button
                key={key}
                onClick={() => setLocation(path)}
                variant={isActive ? "default" : "ghost"}
                className="px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-reverse space-x-2 whitespace-nowrap"
                data-testid={`nav-${key}`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
