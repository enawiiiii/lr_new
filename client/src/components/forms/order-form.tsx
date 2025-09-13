import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EMIRATES } from "@/lib/types";
import { useState, useEffect } from "react";

const orderSchema = z.object({
  customerName: z.string().min(1, "اسم العميل مطلوب"),
  customerPhone: z.string().min(1, "رقم الهاتف مطلوب"),
  emirate: z.string().min(1, "يجب اختيار الإمارة"),
  address: z.string().min(1, "العنوان مطلوب"),
  trackingNumber: z.string().optional(),
  notes: z.string().optional(),
  productId: z.string().min(1, "يجب اختيار المنتج"),
  color: z.string().min(1, "يجب اختيار اللون"),
  size: z.number().min(1, "يجب اختيار المقاس"),
  quantity: z.number().min(1, "الكمية يجب أن تكون 1 على الأقل"),
  totalAmount: z.number().min(0.01, "المبلغ يجب أن يكون أكبر من صفر"),
});

type OrderFormData = z.infer<typeof orderSchema>;

interface OrderFormProps {
  products: any[];
  onSubmit: (data: OrderFormData) => void;
  isLoading?: boolean;
  onCancel: () => void;
}

export default function OrderForm({ products, onSubmit, isLoading, onCancel }: OrderFormProps) {
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [availableColors, setAvailableColors] = useState<string[]>([]);
  const [availableSizes, setAvailableSizes] = useState<number[]>([]);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [maxQuantity, setMaxQuantity] = useState<number>(0);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      quantity: 1,
    },
  });

  const watchedProductId = watch("productId");
  const watchedQuantity = watch("quantity");

  useEffect(() => {
    if (watchedProductId) {
      const product = products.find(p => p.id === watchedProductId);
      setSelectedProduct(product);
      setAvailableColors(product?.colors || []);
      setAvailableSizes([]);
      setSelectedColor("");
      setSelectedSize(null);
      setValue("color", "");
      setValue("size", 0);
      setValue("totalAmount", 0);
    }
  }, [watchedProductId, products, setValue]);

  useEffect(() => {
    if (selectedProduct && selectedColor) {
      const sizesForColor = Object.keys(selectedProduct.inventory?.[selectedColor] || {})
        .map(Number)
        .filter(size => selectedProduct.inventory[selectedColor][size] > 0);
      setAvailableSizes(sizesForColor);
      
      if (!sizesForColor.includes(selectedSize || 0)) {
        setSelectedSize(null);
        setValue("size", 0);
      }
    }
  }, [selectedProduct, selectedColor, setValue, selectedSize]);

  useEffect(() => {
    if (selectedProduct && selectedColor && selectedSize) {
      const available = selectedProduct.inventory?.[selectedColor]?.[selectedSize] || 0;
      setMaxQuantity(available);
      
      if (watchedQuantity > available) {
        setValue("quantity", Math.min(available, watchedQuantity));
      }
      
      // Calculate total amount
      const totalAmount = selectedProduct.price * watchedQuantity;
      setValue("totalAmount", totalAmount);
    }
  }, [selectedProduct, selectedColor, selectedSize, watchedQuantity, setValue]);

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    setValue("color", color);
  };

  const handleSizeChange = (size: string) => {
    const sizeNum = parseInt(size);
    setSelectedSize(sizeNum);
    setValue("size", sizeNum);
  };

  const onFormSubmit = (data: OrderFormData) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Customer Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">معلومات العميل</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="customerName">اسم العميل</Label>
            <Input
              id="customerName"
              {...register("customerName")}
              placeholder="أدخل اسم العميل"
              data-testid="input-customer-name"
            />
            {errors.customerName && (
              <p className="text-sm text-destructive mt-1">{errors.customerName.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="customerPhone">رقم الهاتف</Label>
            <Input
              id="customerPhone"
              {...register("customerPhone")}
              placeholder="أدخل رقم الهاتف"
              data-testid="input-customer-phone"
            />
            {errors.customerPhone && (
              <p className="text-sm text-destructive mt-1">{errors.customerPhone.message}</p>
            )}
          </div>
        </div>

        <div>
          <Label>الإمارة</Label>
          <Select
            onValueChange={(value) => setValue("emirate", value)}
            data-testid="select-emirate"
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر الإمارة" />
            </SelectTrigger>
            <SelectContent>
              {EMIRATES.map((emirate) => (
                <SelectItem key={emirate} value={emirate}>
                  {emirate}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.emirate && (
            <p className="text-sm text-destructive mt-1">{errors.emirate.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="address">العنوان التفصيلي</Label>
          <Textarea
            id="address"
            {...register("address")}
            placeholder="أدخل العنوان التفصيلي"
            rows={3}
            data-testid="textarea-address"
          />
          {errors.address && (
            <p className="text-sm text-destructive mt-1">{errors.address.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="trackingNumber">رقم التتبع (اختياري)</Label>
          <Input
            id="trackingNumber"
            {...register("trackingNumber")}
            placeholder="أدخل رقم التتبع"
            data-testid="input-tracking-number"
          />
        </div>

        <div>
          <Label htmlFor="notes">ملاحظات إضافية (اختياري)</Label>
          <Textarea
            id="notes"
            {...register("notes")}
            placeholder="أدخل أي ملاحظات إضافية"
            rows={2}
            data-testid="textarea-notes"
          />
        </div>
      </div>

      {/* Product Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">معلومات المنتج</h3>

        <div>
          <Label>المنتج</Label>
          <Select
            onValueChange={(value) => setValue("productId", value)}
            data-testid="select-product"
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر المنتج" />
            </SelectTrigger>
            <SelectContent>
              {products.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.name} - {product.price} AED
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.productId && (
            <p className="text-sm text-destructive mt-1">{errors.productId.message}</p>
          )}
        </div>

        {/* Color Selection */}
        {availableColors.length > 0 && (
          <div>
            <Label>اللون</Label>
            <Select
              onValueChange={handleColorChange}
              value={selectedColor}
              data-testid="select-color"
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر اللون" />
              </SelectTrigger>
              <SelectContent>
                {availableColors.map((color) => (
                  <SelectItem key={color} value={color}>
                    {color}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.color && (
              <p className="text-sm text-destructive mt-1">{errors.color.message}</p>
            )}
          </div>
        )}

        {/* Size Selection */}
        {availableSizes.length > 0 && (
          <div>
            <Label>المقاس</Label>
            <Select
              onValueChange={handleSizeChange}
              value={selectedSize?.toString() || ""}
              data-testid="select-size"
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر المقاس" />
              </SelectTrigger>
              <SelectContent>
                {availableSizes.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size} (متوفر: {selectedProduct?.inventory?.[selectedColor]?.[size] || 0})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.size && (
              <p className="text-sm text-destructive mt-1">{errors.size.message}</p>
            )}
          </div>
        )}

        {/* Quantity */}
        {maxQuantity > 0 && (
          <div>
            <Label htmlFor="quantity">الكمية</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={maxQuantity}
              {...register("quantity", { valueAsNumber: true })}
              data-testid="input-quantity"
            />
            <p className="text-sm text-muted-foreground mt-1">
              الحد الأقصى: {maxQuantity}
            </p>
            {errors.quantity && (
              <p className="text-sm text-destructive mt-1">{errors.quantity.message}</p>
            )}
          </div>
        )}

        {/* Total Amount */}
        {selectedProduct && watchedQuantity > 0 && (
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">المبلغ الإجمالي:</span>
              <span className="text-2xl font-bold text-primary" data-testid="text-total-amount">
                {(selectedProduct.price * watchedQuantity).toFixed(2)} AED
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Submit Buttons */}
      <div className="flex justify-end space-x-4 space-x-reverse">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          data-testid="button-cancel-order"
        >
          إلغاء
        </Button>
        <Button
          type="submit"
          disabled={isLoading || !selectedProduct || !selectedColor || !selectedSize}
          data-testid="button-submit-order"
        >
          {isLoading ? "جاري الإنشاء..." : "إنشاء الطلب"}
        </Button>
      </div>
    </form>
  );
}
