import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useStore } from "@/hooks/use-store";
import { useToast } from "@/hooks/use-toast";
import { User, Store, UserPlus, Laptop } from "lucide-react";
import type { Employee, StoreType } from "@/types";

export default function Login() {
  const [, setLocation] = useLocation();
  const [showEmployeeDialog, setShowEmployeeDialog] = useState(false);
  const [newEmployeeName, setNewEmployeeName] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const { setCurrentEmployee, setCurrentStore } = useStore();
  const { toast } = useToast();

  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const handleEmployeeSelect = (employee: Employee) => {
    setSelectedEmployee(employee);
    setCurrentEmployee(employee);
  };

  const handleStoreSelect = (storeType: StoreType) => {
    if (!selectedEmployee) return;
    
    setCurrentStore(storeType);
    setLocation("/dashboard");
  };

  const handleAddEmployee = async () => {
    if (!newEmployeeName.trim()) return;

    try {
      // In a real app, this would make an API call
      const newEmployee: Employee = {
        id: Date.now(),
        name: newEmployeeName,
        role: "staff"
      };
      
      toast({
        title: "تم إضافة الموظف بنجاح",
        description: `تم إضافة ${newEmployeeName} كموظف جديد`,
      });
      
      setNewEmployeeName("");
      setShowEmployeeDialog(false);
      handleEmployeeSelect(newEmployee);
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في إضافة الموظف الجديد",
        variant: "destructive",
      });
    }
  };

  if (selectedEmployee) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-4 fade-in">
        <Card className="w-full max-w-lg shadow-2xl">
          <CardContent className="pt-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">اختر المتجر</h2>
              <p className="text-muted-foreground">
                الموظف: <span className="font-semibold text-primary">{selectedEmployee.name}</span>
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => handleStoreSelect('boutique')}
                className="p-6 h-auto flex-col space-y-4 group hover:shadow-lg transition-all"
                variant="outline"
                data-testid="button-select-boutique"
              >
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Store className="w-8 h-8 text-primary" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-lg mb-2">البوتيك</h3>
                  <p className="text-sm text-muted-foreground">نقاط البيع المباشر</p>
                </div>
              </Button>
              
              <Button
                onClick={() => handleStoreSelect('online')}
                className="p-6 h-auto flex-col space-y-4 group hover:shadow-lg transition-all"
                variant="outline"
                data-testid="button-select-online"
              >
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Laptop className="w-8 h-8 text-primary" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-lg mb-2">الأونلاين</h3>
                  <p className="text-sm text-muted-foreground">إدارة الطلبات الإلكترونية</p>
                </div>
              </Button>
            </div>
            
            <Button
              onClick={() => setSelectedEmployee(null)}
              variant="outline"
              className="w-full mt-6"
              data-testid="button-back-to-login"
            >
              العودة لاختيار الموظف
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-4 fade-in">
      <Card className="w-full max-w-md shadow-2xl">
        <CardContent className="pt-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">لاروزا</h1>
            <h2 className="text-xl font-semibold mb-2">نظام إدارة المتجر</h2>
            <p className="text-muted-foreground">مرحباً، من أنت؟</p>
          </div>
          
          <div className="space-y-3 mb-6">
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">جاري تحميل قائمة الموظفين...</p>
              </div>
            ) : employees.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">لا يوجد موظفين مسجلين</p>
              </div>
            ) : (
              employees.map((employee) => (
                <Button
                  key={employee.id}
                  onClick={() => handleEmployeeSelect(employee)}
                  variant="outline"
                  className="w-full p-4 text-right justify-between group hover:border-primary hover:bg-primary/5 transition-all duration-200"
                  data-testid={`button-select-employee-${employee.id}`}
                >
                  <User className="text-primary group-hover:scale-110 transition-transform" />
                  <span className="font-medium">{employee.name}</span>
                </Button>
              ))
            )}
          </div>
          
          <Dialog open={showEmployeeDialog} onOpenChange={setShowEmployeeDialog}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full p-3 border-2 border-dashed hover:border-primary hover:bg-primary/5 transition-colors"
                data-testid="button-add-employee"
              >
                <UserPlus className="ml-2 h-4 w-4" />
                إضافة موظف جديد
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة موظف جديد</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="employee-name">اسم الموظف</Label>
                  <Input
                    id="employee-name"
                    value={newEmployeeName}
                    onChange={(e) => setNewEmployeeName(e.target.value)}
                    placeholder="أدخل اسم الموظف"
                    data-testid="input-employee-name"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleAddEmployee} className="flex-1" data-testid="button-submit-employee">
                    إضافة
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowEmployeeDialog(false);
                      setNewEmployeeName("");
                    }}
                    className="flex-1"
                    data-testid="button-cancel-employee"
                  >
                    إلغاء
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
