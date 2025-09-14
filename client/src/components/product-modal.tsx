import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/api";
import { Edit, Package } from "lucide-react";
import type { Product, ProductWithDetails } from "@/types";

interface ProductModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
}

export default function ProductModal({ product, isOpen, onClose, onEdit }: ProductModalProps) {
  const { data: productDetails, isLoading } = useQuery<ProductWithDetails>({
    queryKey: ["/api/products", product.id],
    enabled: isOpen && !!product.id,
  });

  const getColorHex = (colorName: string): string => {
    const colorMap: { [key: string]: string } = {
      'أحمر': '#ef4444',
      'أزرق': '#3b82f6',
      'أخضر': '#10b981',
      'أسود': '#1f2937',
      'أبيض': '#f9fafb',
      'أصفر': '#f59e0b',
      'وردي': '#ec4899',
      'بنفسجي': '#8b5cf6',
      'بني': '#a16207',
      'رمادي': '#6b7280',
    };
    return colorMap[colorName] || '#6b7280';
  };

  const getTotalStock = (colors: ProductWithDetails['colors']): number => {
    return colors?.reduce((total, color) => 
      total + color.sizes.reduce((colorTotal, size) => colorTotal + size.quantity, 0), 0
    ) || 0;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-reverse space-x-2">
            <Package className="h-5 w-5" />
            <span>تفاصيل المنتج</span>
          </DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="mr-2">جاري التحميل...</span>
          </div>
        ) : productDetails ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            {/* Product Image */}
            <div>
              <div className="w-full h-96 bg-muted rounded-xl flex items-center justify-center">
                {productDetails.mainImageUrl ? (
                  <img 
                    src={productDetails.mainImageUrl} 
                    alt={productDetails.productCode}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <div className="text-muted-foreground text-center">
                    <Package className="h-16 w-16 mx-auto mb-2" />
                    <p>لا توجد صورة</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Product Details */}
            <div className="space-y-4">
              <div>
                <h4 className="text-2xl font-bold mb-2" data-testid="text-product-code">
                  {productDetails.productCode}
                </h4>
                <div className="flex items-center space-x-reverse space-x-2 mb-4">
                  {productDetails.brand && (
                    <Badge variant="outline">{productDetails.brand}</Badge>
                  )}
                  {productDetails.productType && (
                    <Badge variant="outline">{productDetails.productType}</Badge>
                  )}
                </div>
                {productDetails.specs && (
                  <p className="text-muted-foreground mb-4">{productDetails.specs}</p>
                )}
              </div>
              
              {/* Pricing */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">سعر المتجر</p>
                  <p className="text-xl font-bold text-primary" data-testid="text-store-price">
                    {productDetails.storePrice ? formatCurrency(productDetails.storePrice) : '--'}
                  </p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">سعر الأونلاين</p>
                  <p className="text-xl font-bold text-green-600" data-testid="text-online-price">
                    {productDetails.onlinePrice ? formatCurrency(productDetails.onlinePrice) : '--'}
                  </p>
                </div>
              </div>

              {/* Stock Information */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h5 className="font-semibold">المخزون حسب الألوان والمقاسات</h5>
                  <Badge variant="outline">
                    إجمالي: {getTotalStock(productDetails.colors)} قطعة
                  </Badge>
                </div>
                
                {productDetails.colors && productDetails.colors.length > 0 ? (
                  <div className="space-y-3">
                    {productDetails.colors.map((color) => (
                      <div key={color.id} className="border border-border rounded-lg p-3">
                        <div className="flex items-center mb-2">
                          <div 
                            className="w-6 h-6 rounded-full border-2 border-border ml-3"
                            style={{ backgroundColor: getColorHex(color.colorName) }}
                          ></div>
                          <span className="font-medium">{color.colorName}</span>
                        </div>
                        
                        {color.sizes && color.sizes.length > 0 ? (
                          <div className="grid grid-cols-6 gap-2">
                            {color.sizes.map((size) => (
                              <div 
                                key={size.id}
                                className={`text-center p-2 rounded text-sm ${
                                  size.quantity === 0 
                                    ? 'bg-red-50 text-red-700' 
                                    : size.quantity < 5 
                                    ? 'bg-orange-50 text-orange-700'
                                    : 'bg-green-50 text-green-700'
                                }`}
                                data-testid={`stock-${color.colorName}-${size.sizeLabel}`}
                              >
                                <p className="font-medium">{size.sizeLabel}</p>
                                <p className="text-xs">{size.quantity}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">لا توجد مقاسات محددة</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">لا توجد ألوان أو مقاسات محددة</p>
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex space-x-reverse space-x-3 pt-4">
                <Button 
                  onClick={onEdit} 
                  className="flex-1"
                  data-testid="button-edit-product"
                >
                  <Edit className="h-4 w-4 ml-2" />
                  تعديل المنتج
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  data-testid="button-add-stock"
                >
                  إضافة مخزون
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">فشل في تحميل بيانات المنتج</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
