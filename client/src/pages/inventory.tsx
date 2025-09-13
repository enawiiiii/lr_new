import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import TopNav from "@/components/layout/top-nav";
import ProductForm from "@/components/forms/product-form";
import { Plus, Eye, Edit, Package } from "lucide-react";

export default function Inventory() {
  const { employee, context } = useStore();
  const [, setLocation] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!employee || !context) {
      setLocation('/');
    }
  }, [employee, context, setLocation]);

  const { data: products, isLoading } = useQuery({
    queryKey: ['/api/products', context],
    enabled: !!context,
  });

  const createProductMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/products', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to create product');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products', context] });
      setIsDialogOpen(false);
      toast({
        title: "تم إضافة المنتج بنجاح",
        description: "تم إضافة المنتج الجديد إلى المخزون",
      });
    },
    onError: () => {
      toast({
        title: "حدث خطأ",
        description: "فشل في إضافة المنتج",
        variant: "destructive",
      });
    },
  });

  if (!employee || !context) {
    return null;
  }

  const handleProductSubmit = (data: any) => {
    const formData = new FormData();
    
    Object.keys(data).forEach(key => {
      if (key === 'colors' || key === 'sizes') {
        formData.append(key, JSON.stringify(data[key]));
      } else if (key === 'inventory') {
        formData.append(key, JSON.stringify(data[key]));
      } else if (key === 'image' && data[key]) {
        formData.append(key, data[key]);
      } else {
        formData.append(key, data[key]);
      }
    });

    formData.append('context', context);
    formData.append('createdBy', employee);

    createProductMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNav />

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">إدارة المخزون</h1>
            <p className="text-muted-foreground">
              إدارة منتجات {context === 'boutique' ? 'البوتيك' : 'المتجر الإلكتروني'}
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2 space-x-reverse" data-testid="button-add-product">
                <Plus className="w-4 h-4" />
                <span>إضافة منتج جديد</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>إضافة منتج جديد</DialogTitle>
              </DialogHeader>
              <ProductForm
                onSubmit={handleProductSubmit}
                isLoading={createProductMutation.isPending}
                onCancel={() => setIsDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-square bg-muted rounded-t-lg"></div>
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product: any) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square relative">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Package className="w-16 h-16 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2" data-testid={`text-product-name-${product.id}`}>
                    {product.name}
                  </h3>
                  <p className="text-xl font-bold text-primary mb-3" data-testid={`text-product-price-${product.id}`}>
                    {product.price} AED
                  </p>
                  
                  <div className="flex space-x-2 space-x-reverse">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedProduct(product)}
                      className="flex-1"
                      data-testid={`button-view-specs-${product.id}`}
                    >
                      <Eye className="w-4 h-4 ml-1" />
                      المواصفات
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      data-testid={`button-edit-product-${product.id}`}
                    >
                      <Edit className="w-4 h-4 ml-1" />
                      تعديل
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">لا توجد منتجات</h3>
              <p className="text-muted-foreground mb-4">
                ابدأ بإضافة منتجات جديدة إلى مخزون {context === 'boutique' ? 'البوتيك' : 'المتجر الإلكتروني'}
              </p>
              <Button onClick={() => setIsDialogOpen(true)} data-testid="button-add-first-product">
                إضافة منتج جديد
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Product Specifications Modal */}
        {selectedProduct && (
          <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>مواصفات المنتج: {selectedProduct.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">الألوان المتاحة:</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedProduct.colors?.map((color: string, index: number) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-muted rounded text-sm"
                          data-testid={`text-color-${index}`}
                        >
                          {color}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">المقاسات المتاحة:</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedProduct.sizes?.map((size: number, index: number) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-muted rounded text-sm"
                          data-testid={`text-size-${index}`}
                        >
                          {size}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">المخزون:</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-border">
                      <thead>
                        <tr className="bg-muted">
                          <th className="border border-border p-2 text-right">اللون</th>
                          {selectedProduct.sizes?.map((size: number) => (
                            <th key={size} className="border border-border p-2 text-center">
                              {size}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedProduct.colors?.map((color: string) => (
                          <tr key={color}>
                            <td className="border border-border p-2 font-medium">{color}</td>
                            {selectedProduct.sizes?.map((size: number) => (
                              <td key={size} className="border border-border p-2 text-center">
                                {selectedProduct.inventory?.[color]?.[size] || 0}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
