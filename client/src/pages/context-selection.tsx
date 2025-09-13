import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { CONTEXTS } from "@/lib/types";
import { useLocation } from "wouter";
import { ArrowRight } from "lucide-react";

export default function ContextSelection() {
  const { employee, setContext, reset } = useStore();
  const [, setLocation] = useLocation();

  const handleContextSelect = (contextId: 'boutique' | 'online') => {
    setContext(contextId);
    setLocation('/dashboard');
  };

  const handleGoBack = () => {
    reset();
    setLocation('/');
  };

  if (!employee) {
    setLocation('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Back button and selected employee info */}
        <div className="mb-8 fade-in">
          <Button
            variant="ghost"
            onClick={handleGoBack}
            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-4"
            data-testid="button-go-back"
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            العودة
          </Button>
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-2">
              مرحبًا <span className="text-primary" data-testid="text-selected-employee">{employee}</span>
            </h2>
            <p className="text-muted-foreground">
              يرجى اختيار السياق الذي تريد العمل فيه
            </p>
          </div>
        </div>

        {/* Context Selection */}
        <div className="max-w-3xl mx-auto fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {CONTEXTS.map((context) => (
              <Card
                key={context.id}
                className="shadow-lg border overflow-hidden hover-scale cursor-pointer"
                onClick={() => handleContextSelect(context.id)}
                data-testid={`card-context-${context.id}`}
              >
                <div className={`bg-gradient-to-br from-${context.color} to-${context.color}/80 p-6 text-center`}>
                  <i className={`${context.icon} text-5xl text-${context.color}-foreground mb-4`}></i>
                  <h3 className={`text-2xl font-bold text-${context.color}-foreground`}>
                    {context.name}
                  </h3>
                  <p className={`text-${context.color}-foreground/80 mt-2`}>
                    {context.description}
                  </p>
                </div>
                <CardContent className="p-6">
                  <ul className="space-y-3 text-muted-foreground">
                    {context.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <i className={`fas fa-check text-${context.color} ml-2`}></i>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
