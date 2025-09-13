import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState, useEffect } from "react";

const saleSchema = z.object({
  customerName: z.string().min(1, "اسم الزبون مطلوب"),
  customerPhone: z.string().min(1, "رقم الهاتف مطلوب"),
  productId: z.string().min(1, "يجب اختيار المنتج"),
  color: z.string().min(1, "يجب اختيار اللون"),
  size: z.number().min(1, "يجب اختيار المقاس"),
  quantity: z.number().min(1, "الكمية يجب أن تكون 1 على الأقل"),
  totalAmount: z.number().min(0.01, "المبلغ يجب أن يكون أكبر من صفر"),
  paymentMethod: z.enum(["cash", "card"], { required_error: "يجب اختيار طريقة الدفع" }),
});

type SaleFormData = z.infer<typeof saleSchema>;

interface SaleFormProps {
  products: any[];
  onSubmit: (data: SaleFormData) => void;
  isLoading?: boolean;
  onCancel: () => void;
}

export default function SaleForm({ products, onSubmit, isLoading, onCancel }: SaleFormProps) {
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
  } = useForm<SaleFormData>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      quantity: 1,
      paymentMethod: "cash",
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
        setValue("quantity", available);
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

  const onFormSubmit = (data: SaleFormData) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Customer Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="customerName">اسم الزبون</Label>
          <Input
            id="customerName"
            {...register("customerName")}
            placeholder="أدخل اسم الزبون"
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

      {/* Product Selection */}
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

      {/* Payment Method */}
      <div>
        <Label>طريقة الدفع</Label>
        <RadioGroup
          defaultValue="cash"
          onValueChange={(value) => setValue("paymentMethod", value as "cash" | "card")}
          className="flex space-x-6 space-x-reverse mt-2"
          data-testid="radio-payment-method"
        >
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="cash" id="cash" />
            <Label htmlFor="cash">نقداً</Label>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="card" id="card" />
            <Label htmlFor="card">بطاقة</Label>
          </div>
        </RadioGroup>
        {errors.paymentMethod && (
          <p className="text-sm text-destructive mt-1">{errors.paymentMethod.message}</p>
        )}
      </div>

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

      {/* Submit Buttons */}
      <div className="flex justify-end space-x-4 space-x-reverse">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          data-testid="button-cancel-sale"
        >
          إلغاء
        </Button>
        <Button
          type="submit"
          disabled={isLoading || !selectedProduct || !selectedColor || !selectedSize}
          data-testid="button-submit-sale"
        >
          {isLoading ? "جاري التسجيل..." : "تسجيل البيع"}
        </Button>
      </div>
    </form>
  );
}
