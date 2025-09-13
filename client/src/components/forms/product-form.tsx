import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { Upload, X, Plus } from "lucide-react";

const productSchema = z.object({
  name: z.string().min(1, "اسم المنتج مطلوب"),
  price: z.string().min(1, "السعر مطلوب"),
  colors: z.array(z.string()).min(1, "يجب إضافة لون واحد على الأقل"),
  sizes: z.array(z.number()).min(1, "يجب إضافة مقاس واحد على الأقل"),
  inventory: z.record(z.record(z.number())),
  image: z.any().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  onSubmit: (data: ProductFormData) => void;
  isLoading?: boolean;
  onCancel: () => void;
}

export default function ProductForm({ onSubmit, isLoading, onCancel }: ProductFormProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [colors, setColors] = useState<string[]>([]);
  const [sizes, setSizes] = useState<number[]>([]);
  const [newColor, setNewColor] = useState("");
  const [newSize, setNewSize] = useState("");
  const [inventory, setInventory] = useState<Record<string, Record<number, number>>>({});

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      colors: [],
      sizes: [],
      inventory: {},
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setValue("image", file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const addColor = () => {
    if (newColor.trim() && !colors.includes(newColor.trim())) {
      const updatedColors = [...colors, newColor.trim()];
      setColors(updatedColors);
      setValue("colors", updatedColors);
      
      // Initialize inventory for new color
      const newInventory = { ...inventory };
      newInventory[newColor.trim()] = {};
      sizes.forEach(size => {
        newInventory[newColor.trim()][size] = 0;
      });
      setInventory(newInventory);
      setValue("inventory", newInventory);
      
      setNewColor("");
    }
  };

  const removeColor = (colorToRemove: string) => {
    const updatedColors = colors.filter(color => color !== colorToRemove);
    setColors(updatedColors);
    setValue("colors", updatedColors);
    
    // Remove from inventory
    const newInventory = { ...inventory };
    delete newInventory[colorToRemove];
    setInventory(newInventory);
    setValue("inventory", newInventory);
  };

  const addSize = () => {
    const sizeNum = parseInt(newSize);
    if (!isNaN(sizeNum) && !sizes.includes(sizeNum)) {
      const updatedSizes = [...sizes, sizeNum].sort((a, b) => a - b);
      setSizes(updatedSizes);
      setValue("sizes", updatedSizes);
      
      // Initialize inventory for new size
      const newInventory = { ...inventory };
      colors.forEach(color => {
        if (!newInventory[color]) newInventory[color] = {};
        newInventory[color][sizeNum] = 0;
      });
      setInventory(newInventory);
      setValue("inventory", newInventory);
      
      setNewSize("");
    }
  };

  const removeSize = (sizeToRemove: number) => {
    const updatedSizes = sizes.filter(size => size !== sizeToRemove);
    setSizes(updatedSizes);
    setValue("sizes", updatedSizes);
    
    // Remove from inventory
    const newInventory = { ...inventory };
    colors.forEach(color => {
      if (newInventory[color]) {
        delete newInventory[color][sizeToRemove];
      }
    });
    setInventory(newInventory);
    setValue("inventory", newInventory);
  };

  const updateInventory = (color: string, size: number, quantity: number) => {
    const newInventory = { ...inventory };
    if (!newInventory[color]) newInventory[color] = {};
    newInventory[color][size] = Math.max(0, quantity);
    setInventory(newInventory);
    setValue("inventory", newInventory);
  };

  const onFormSubmit = (data: ProductFormData) => {
    onSubmit({
      ...data,
      colors,
      sizes,
      inventory,
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">اسم المنتج</Label>
          <Input
            id="name"
            {...register("name")}
            placeholder="أدخل اسم المنتج"
            data-testid="input-product-name"
          />
          {errors.name && (
            <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="price">السعر (درهم إماراتي)</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            {...register("price")}
            placeholder="0.00"
            data-testid="input-product-price"
          />
          {errors.price && (
            <p className="text-sm text-destructive mt-1">{errors.price.message}</p>
          )}
        </div>
      </div>

      {/* Image Upload */}
      <div>
        <Label>صورة المنتج</Label>
        <div className="mt-2">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
            id="image-upload"
            data-testid="input-product-image"
          />
          <label
            htmlFor="image-upload"
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50"
          >
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">اختر صورة للمنتج</p>
              </div>
            )}
          </label>
        </div>
      </div>

      {/* Colors */}
      <div>
        <Label>الألوان</Label>
        <div className="flex gap-2 mt-2">
          <Input
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            placeholder="أضف لون"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addColor())}
            data-testid="input-new-color"
          />
          <Button type="button" onClick={addColor} size="sm" data-testid="button-add-color">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {colors.map((color, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded"
              data-testid={`tag-color-${index}`}
            >
              {color}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => removeColor(color)}
                className="h-4 w-4 p-0"
                data-testid={`button-remove-color-${index}`}
              >
                <X className="w-3 h-3" />
              </Button>
            </span>
          ))}
        </div>
        {errors.colors && (
          <p className="text-sm text-destructive mt-1">{errors.colors.message}</p>
        )}
      </div>

      {/* Sizes */}
      <div>
        <Label>المقاسات</Label>
        <div className="flex gap-2 mt-2">
          <Input
            type="number"
            value={newSize}
            onChange={(e) => setNewSize(e.target.value)}
            placeholder="أضف مقاس"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSize())}
            data-testid="input-new-size"
          />
          <Button type="button" onClick={addSize} size="sm" data-testid="button-add-size">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {sizes.map((size, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-2 py-1 bg-secondary/10 text-secondary rounded"
              data-testid={`tag-size-${index}`}
            >
              {size}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => removeSize(size)}
                className="h-4 w-4 p-0"
                data-testid={`button-remove-size-${index}`}
              >
                <X className="w-3 h-3" />
              </Button>
            </span>
          ))}
        </div>
        {errors.sizes && (
          <p className="text-sm text-destructive mt-1">{errors.sizes.message}</p>
        )}
      </div>

      {/* Inventory Grid */}
      {colors.length > 0 && sizes.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <Label className="text-base font-semibold">الكميات في المخزون</Label>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse border border-border">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border p-2 text-right">اللون</th>
                    {sizes.map((size) => (
                      <th key={size} className="border border-border p-2 text-center">
                        {size}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {colors.map((color) => (
                    <tr key={color}>
                      <td className="border border-border p-2 font-medium">{color}</td>
                      {sizes.map((size) => (
                        <td key={size} className="border border-border p-1">
                          <Input
                            type="number"
                            min="0"
                            value={inventory[color]?.[size] || 0}
                            onChange={(e) =>
                              updateInventory(color, size, parseInt(e.target.value) || 0)
                            }
                            className="text-center"
                            data-testid={`input-inventory-${color}-${size}`}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit Buttons */}
      <div className="flex justify-end space-x-4 space-x-reverse">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          data-testid="button-cancel-product"
        >
          إلغاء
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          data-testid="button-submit-product"
        >
          {isLoading ? "جاري الحفظ..." : "حفظ المنتج"}
        </Button>
      </div>
    </form>
  );
}
