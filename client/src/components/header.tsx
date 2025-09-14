import { Button } from "@/components/ui/button";
import { useStore } from "@/hooks/use-store";
import { useLocation } from "wouter";
import { formatDate } from "@/lib/api";

export default function Header() {
  const { currentEmployee, currentStore, logout } = useStore();
  const [, setLocation] = useLocation();

  const handleEmployeeChange = () => {
    logout();
    setLocation("/");
  };

  const handleStoreChange = () => {
    // Just clear store, keep employee
    const { setCurrentStore } = useStore();
    setCurrentStore(null);
    setLocation("/");
  };

  const getStoreDisplayName = (store: string | null) => {
    switch (store) {
      case 'boutique':
        return 'البوتيك';
      case 'online':
        return 'الأونلاين';
      default:
        return '';
    }
  };

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-reverse space-x-4">
          <h1 className="text-2xl font-bold text-primary">لاروزا</h1>
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">الموظف:</span>{" "}
            <span className="text-foreground" data-testid="text-current-employee">
              {currentEmployee?.name}
            </span>{" "}
            |{" "}
            <span className="font-medium">المتجر:</span>{" "}
            <span className="text-foreground" data-testid="text-current-store">
              {getStoreDisplayName(currentStore)}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-reverse space-x-4">
          <div className="text-right text-sm">
            <div className="text-muted-foreground">التاريخ</div>
            <div className="font-semibold" data-testid="text-current-date">
              {formatDate(new Date())}
            </div>
          </div>
          <div className="flex space-x-reverse space-x-2">
            <Button
              onClick={handleEmployeeChange}
              variant="outline"
              size="sm"
              data-testid="button-change-employee"
            >
              تغيير الموظف
            </Button>
            <Button
              onClick={handleStoreChange}
              variant="outline"
              size="sm"
              data-testid="button-change-store"
            >
              تغيير المتجر
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
