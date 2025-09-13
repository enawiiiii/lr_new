import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { EMPLOYEES } from "@/lib/types";
import { useLocation } from "wouter";

export default function Welcome() {
  const { setEmployee } = useStore();
  const [, setLocation] = useLocation();

  const handleEmployeeSelect = (employeeName: string) => {
    setEmployee(employeeName);
    setLocation('/context');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted via-background to-accent/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12 fade-in">
          <div className="mb-6">
            <i className="fas fa-store text-6xl text-primary mb-4"></i>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            نظام إدارة المتجر
          </h1>
          <p className="text-xl text-muted-foreground">
            نظام شامل لإدارة البوتيك والمتجر الإلكتروني
          </p>
        </div>

        {/* Employee Selection Card */}
        <div className="max-w-2xl mx-auto mb-8 fade-in">
          <Card className="shadow-lg">
            <CardContent className="p-8">
              <h2 className="text-3xl font-semibold text-center mb-8 text-foreground">
                مرحبًا بك — من أنت؟
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {EMPLOYEES.map((employee) => (
                  <Button
                    key={employee.id}
                    onClick={() => handleEmployeeSelect(employee.name)}
                    className="hover-scale bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-6 px-8 rounded-lg transition-all duration-200 text-lg shadow-md hover:shadow-lg h-auto flex-col"
                    data-testid={`button-employee-${employee.id}`}
                  >
                    <i className="fas fa-user mb-2 text-2xl block"></i>
                    {employee.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
