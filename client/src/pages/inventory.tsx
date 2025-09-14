import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/hooks/use-store";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/header";
import Navigation from "@/components/navigation";
import ProductModal from "@/components/product-modal";
import ProductForm from "@/components/product-form";
import { formatCurrency } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { Plus, Search, Eye, Edit, Trash2 } from "lucide-react";
import type { Product } from "@/types";

export default function Inventory() {
  const { currentEmployee, currentStore } = useStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Redirect if not logged in
  if (!currentEmployee || !currentStore) {
    setLocation("/");
    return null;
  }

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", { search: searchQuery }],
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete product');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "تم حذف المنتج",
        description: "تم حذف المنتج بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في حذف المنتج",
        variant: "destructive",
      });
    },
  });

  const handleViewProduct = async (product: Product) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const handleDeleteProduct = (product: Product) => {
    if (confirm(`هل أنت متأكد من حذف المنتج ${product.productCode}؟`)) {
      deleteProductMutation.mutate(product.id);
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowProductForm(true);
  };

  const getStockStatus = (product: Product) => {
    // This would normally be calculated from product sizes
    // For now, using a simple mock logic
    const randomStock = Math.floor(Math.random() * 20);
    if (randomStock === 0) return { status: "نفذ", class: "bg-red-100 text-red-700" };
    if (randomStock < 5) return { status: "قليل", class: "bg-red-100 text-red-700" };
    return { status: "متوفر", class: "bg-green-100 text-green-700" };
  };

  // Get unique brands and categories for filters
  const uniqueBrands = Array.from(new Set(products.filter(p => p.brand).map(p => p.brand)));
  const uniqueCategories = Array.from(new Set(products.filter(p => p.productType).map(p => p.productType)));

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchQuery || 
      product.productCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.brand && product.brand.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = !selectedCategory || product.productType === selectedCategory;
    const matchesBrand = !selectedBrand || product.brand === selectedBrand;
    
    return matchesSearch && matchesCategory && matchesBrand;
  });

  return (
    <div className="min-h-screen bg-muted">
      <Header />
      <Navigation />
      
      <main className="p-6 fade-in">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">إدارة المخزون</h2>
            <p className="text-muted-foreground">عرض وإدارة جميع المنتجات</p>
          </div>
          <Button 
            onClick={handleAddProduct} 
            className="flex items-center space-x-reverse space-x-2"
            data-testid="button-add-product"
          >
            <Plus className="h-4 w-4" />
            <span>إضافة منتج جديد</span>
          </Button>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="البحث بكود المنتج أو العلامة التجارية..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                  data-testid="input-product-search"
                />
              </div>
              <div className="flex gap-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48" data-testid="select-category">
                    <SelectValue placeholder="جميع الفئات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">جميع الفئات</SelectItem>
                    {uniqueCategories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                  <SelectTrigger className="w-48" data-testid="select-brand">
                    <SelectValue placeholder="جميع العلامات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">جميع العلامات</SelectItem>
                    {uniqueBrands.map(brand => (
                      <SelectItem key={brand} value={brand}>
                        {brand}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-muted"></div>
                <CardContent className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/4"></div>
                </CardContent>
              </Card>
            ))
          ) : filteredProducts.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground text-lg">لا توجد منتجات مطابقة للبحث</p>
            </div>
          ) : (
            filteredProducts.map((product) => {
              const stockStatus = getStockStatus(product);
              
              return (
                <Card 
                  key={product.id} 
                  className="overflow-hidden hover:shadow-lg transition-all duration-200"
                  data-testid={`card-product-${product.id}`}
                >
                  <div className="h-48 bg-muted flex items-center justify-center">
                    {product.mainImageUrl ? (
                      <img 
                        src={product.mainImageUrl} 
                        alt={product.productCode}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-muted-foreground">لا توجد صورة</div>
                    )}
                  </div>
                  
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg" data-testid={`text-product-code-${product.id}`}>
                        {product.productCode}
                      </h3>
                      <Badge className={stockStatus.class}>
                        {stockStatus.status}
                      </Badge>
                    </div>
                    
                    <p className="text-muted-foreground text-sm mb-2">
                      {product.brand && `${product.brand} - `}{product.productType || 'منتج'}
                    </p>
                    
                    <div className="flex justify-between items-center mb-3">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">متجر</p>
                        <p className="font-semibold" data-testid={`text-store-price-${product.id}`}>
                          {product.storePrice ? formatCurrency(product.storePrice) : '--'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">أونلاين</p>
                        <p className="font-semibold" data-testid={`text-online-price-${product.id}`}>
                          {product.onlinePrice ? formatCurrency(product.onlinePrice) : '--'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-reverse space-x-2">
                      <Button
                        onClick={() => handleViewProduct(product)}
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        data-testid={`button-view-${product.id}`}
                      >
                        <Eye className="h-3 w-3 ml-1" />
                        تفاصيل
                      </Button>
                      <Button
                        onClick={() => handleEditProduct(product)}
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        data-testid={`button-edit-${product.id}`}
                      >
                        <Edit className="h-3 w-3 ml-1" />
                        تعديل
                      </Button>
                      <Button
                        onClick={() => handleDeleteProduct(product)}
                        variant="outline"
                        size="sm"
                        className="text-xs text-red-600 hover:text-red-700"
                        data-testid={`button-delete-${product.id}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </main>

      {/* Product Modal */}
      {showProductModal && selectedProduct && (
        <ProductModal
          product={selectedProduct}
          isOpen={showProductModal}
          onClose={() => {
            setShowProductModal(false);
            setSelectedProduct(null);
          }}
          onEdit={() => {
            setEditingProduct(selectedProduct);
            setShowProductModal(false);
            setShowProductForm(true);
          }}
        />
      )}

      {/* Product Form */}
      {showProductForm && (
        <ProductForm
          product={editingProduct}
          isOpen={showProductForm}
          onClose={() => {
            setShowProductForm(false);
            setEditingProduct(null);
          }}
          onSuccess={() => {
            setShowProductForm(false);
            setEditingProduct(null);
            queryClient.invalidateQueries({ queryKey: ["/api/products"] });
          }}
        />
      )}
    </div>
  );
}
