import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { createProduct, updateProduct } from "@/lib/api";
import { Plus, Trash2, Upload, X } from "lucide-react";
import { z } from "zod";
import type { Product, ProductColor, ProductSize } from "@/types";

const productFormSchema = z.object({
  productCode: z.string().min(1, "كود المنتج مطلوب"),
  modelNo: z.string().optional(),
  brand: z.string().optional(),
  productType: z.string().optional(),
  storePrice: z.string().optional(),
  onlinePrice: z.string().optional(),
  specs: z.string().optional(),
});

interface ProductFormProps {
  product?: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ColorSize {
  id?: number;
  colorName: string;
  colorHex: string;
  sizes: {
    id?: number;
    sizeLabel: string;
    quantity: number;
  }[];
}

export default function ProductForm({ product, isOpen, onClose, onSuccess }: ProductFormProps) {
  const { toast } = useToast();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [colorsSizes, setColorsSizes] = useState<ColorSize[]>([]);
  const [newColor, setNewColor] = useState({ name: "", hex: "#000000" });
  const [newSize, setNewSize] = useState({ label: "", quantity: 0 });

  const isEdit = !!product;

  const form = useForm<z.infer<typeof productFormSchema>>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      productCode: "",
      modelNo: "",
      brand: "",
      productType: "",
      storePrice: "",
      onlinePrice: "",
      specs: "",
    },
  });

  // Reset form when product changes
  useEffect(() => {
    if (product) {
      form.reset({
        productCode: product.productCode || "",
        modelNo: product.modelNo || "",
        brand: product.brand || "",
        productType: product.productType || "",
        storePrice: product.storePrice || "",
        onlinePrice: product.onlinePrice || "",
        specs: product.specs || "",
      });
      
      setImagePreview(product.mainImageUrl || "");
      
      // In a real app, you would fetch the product details with colors and sizes
      // For now, initialize with empty colors/sizes
      setColorsSizes([]);
    } else {
      form.reset();
      setImagePreview("");
      setColorsSizes([]);
    }
    setImageFile(null);
  }, [product, form]);

  const createProductMutation = useMutation({
    mutationFn: async (data: any) => {
      return isEdit 
        ? updateProduct(product!.id, data, imageFile || undefined)
        : createProduct(data, imageFile || undefined);
    },
    onSuccess: () => {
      toast({
        title: isEdit ? "تم تحديث المنتج" : "تم إنشاء المنتج",
        description: isEdit ? "تم تحديث المنتج بنجاح" : "تم إنشاء المنتج بنجاح",
      });
      onSuccess();
      form.reset();
      setImageFile(null);
      setImagePreview("");
      setColorsSizes([]);
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: `فشل في ${isEdit ? 'تحديث' : 'إنشاء'} المنتج`,
        variant: "destructive",
      });
    },
  });

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addColor = () => {
    if (!newColor.name.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم اللون",
        variant: "destructive",
      });
      return;
    }

    const colorExists = colorsSizes.some(c => c.colorName === newColor.name);
    if (colorExists) {
      toast({
        title: "خطأ",
        description: "هذا اللون موجود بالفعل",
        variant: "destructive",
      });
      return;
    }

    setColorsSizes([...colorsSizes, {
      colorName: newColor.name,
      colorHex: newColor.hex,
      sizes: []
    }]);
    
    setNewColor({ name: "", hex: "#000000" });
  };

  const removeColor = (colorIndex: number) => {
    setColorsSizes(colorsSizes.filter((_, i) => i !== colorIndex));
  };

  const addSizeToColor = (colorIndex: number) => {
    if (!newSize.label.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال المقاس",
        variant: "destructive",
      });
      return;
    }

    const color = colorsSizes[colorIndex];
    const sizeExists = color.sizes.some(s => s.sizeLabel === newSize.label);
    if (sizeExists) {
      toast({
        title: "خطأ",
        description: "هذا المقاس موجود بالفعل لهذا اللون",
        variant: "destructive",
      });
      return;
    }

    const updatedColors = [...colorsSizes];
    updatedColors[colorIndex].sizes.push({
      sizeLabel: newSize.label,
      quantity: newSize.quantity
    });
    
    setColorsSizes(updatedColors);
    setNewSize({ label: "", quantity: 0 });
  };

  const removeSizeFromColor = (colorIndex: number, sizeIndex: number) => {
    const updatedColors = [...colorsSizes];
    updatedColors[colorIndex].sizes = updatedColors[colorIndex].sizes.filter((_, i) => i !== sizeIndex);
    setColorsSizes(updatedColors);
  };

  const updateSizeQuantity = (colorIndex: number, sizeIndex: number, quantity: number) => {
    const updatedColors = [...colorsSizes];
    updatedColors[colorIndex].sizes[sizeIndex].quantity = Math.max(0, quantity);
    setColorsSizes(updatedColors);
  };

  const onSubmit = (data: z.infer<typeof productFormSchema>) => {
    const productData = {
      ...data,
      // Convert empty strings to null for optional fields
      modelNo: data.modelNo || null,
      brand: data.brand || null,
      productType: data.productType || null,
      storePrice: data.storePrice || null,
      onlinePrice: data.onlinePrice || null,
      specs: data.specs || null,
    };

    createProductMutation.mutate(productData);
  };

  const commonBrands = [
    "زارا", "H&M", "محلي", "أديداس", "نايكي", "بولو", "تومي هيلفيغر", "كالفن كلاين", "لاكوست", "هوغو بوس"
  ];

  const commonCategories = [
    "ملابس نسائية", "ملابس رجالية", "ملابس أطفال", "أحذية", "حقائب", "إكسسوارات", "ساعات", "عطور"
  ];

  const commonSizes = [
    "XS", "S", "M", "L", "XL", "XXL", "XXXL",
    "36", "37", "38", "39", "40", "41", "42", "43", "44", "45"
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? `تعديل المنتج ${product?.productCode}` : "إضافة منتج جديد"}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">المعلومات الأساسية</h3>
                
                <FormField
                  control={form.control}
                  name="productCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>كود المنتج *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="مثال: DR001"
                          data-testid="input-product-code"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="modelNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رقم الموديل</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="مثال: DRS2024-001"
                          data-testid="input-model-no"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>العلامة التجارية</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <Input 
                            {...field} 
                            placeholder="أدخل أو اختر العلامة التجارية"
                            data-testid="input-brand"
                          />
                          <div className="flex flex-wrap gap-2">
                            {commonBrands.map(brand => (
                              <Button
                                key={brand}
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => form.setValue('brand', brand)}
                                className="text-xs"
                                data-testid={`button-brand-${brand}`}
                              >
                                {brand}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="productType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نوع المنتج</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <Input 
                            {...field} 
                            placeholder="أدخل أو اختر نوع المنتج"
                            data-testid="input-product-type"
                          />
                          <div className="flex flex-wrap gap-2">
                            {commonCategories.map(category => (
                              <Button
                                key={category}
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => form.setValue('productType', category)}
                                className="text-xs"
                                data-testid={`button-category-${category}`}
                              >
                                {category}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="storePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>سعر المتجر (د.إ)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number"
                            step="0.01"
                            placeholder="450.00"
                            data-testid="input-store-price"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="onlinePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>سعر الأونلاين (د.إ)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number"
                            step="0.01"
                            placeholder="420.00"
                            data-testid="input-online-price"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="specs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المواصفات</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="أدخل مواصفات المنتج..."
                          className="h-20"
                          data-testid="textarea-specs"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Image Upload and Colors/Sizes */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">الصورة والألوان والمقاسات</h3>
                
                {/* Image Upload */}
                <div>
                  <Label>صورة المنتج</Label>
                  <div className="mt-2">
                    <div className="w-full h-48 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted/30">
                      {imagePreview ? (
                        <div className="relative">
                          <img 
                            src={imagePreview} 
                            alt="معاينة المنتج"
                            className="max-w-full max-h-full object-contain"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => {
                              setImageFile(null);
                              setImagePreview("");
                            }}
                            data-testid="button-remove-image"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Upload className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-muted-foreground">اسحب الصورة هنا أو انقر للاختيار</p>
                        </div>
                      )}
                    </div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="mt-2"
                      data-testid="input-image-upload"
                    />
                  </div>
                </div>

                {/* Colors and Sizes Management */}
                <div>
                  <Label>الألوان والمقاسات</Label>
                  
                  {/* Add Color */}
                  <div className="mt-2 space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={newColor.name}
                        onChange={(e) => setNewColor({ ...newColor, name: e.target.value })}
                        placeholder="اسم اللون"
                        className="flex-1"
                        data-testid="input-color-name"
                      />
                      <input
                        type="color"
                        value={newColor.hex}
                        onChange={(e) => setNewColor({ ...newColor, hex: e.target.value })}
                        className="w-12 h-10 border border-border rounded"
                        data-testid="input-color-picker"
                      />
                      <Button
                        type="button"
                        onClick={addColor}
                        size="sm"
                        data-testid="button-add-color"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Colors List */}
                  <div className="mt-4 space-y-3">
                    {colorsSizes.map((color, colorIndex) => (
                      <div key={colorIndex} className="border border-border rounded-lg p-3" data-testid={`color-section-${colorIndex}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-reverse space-x-2">
                            <div 
                              className="w-6 h-6 rounded-full border-2 border-border"
                              style={{ backgroundColor: color.colorHex }}
                            ></div>
                            <span className="font-medium">{color.colorName}</span>
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeColor(colorIndex)}
                            data-testid={`button-remove-color-${colorIndex}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Add Size to Color */}
                        <div className="flex gap-2 mb-2">
                          <Select value={newSize.label} onValueChange={(value) => setNewSize({ ...newSize, label: value })}>
                            <SelectTrigger className="w-24" data-testid={`select-size-${colorIndex}`}>
                              <SelectValue placeholder="مقاس" />
                            </SelectTrigger>
                            <SelectContent>
                              {commonSizes.map(size => (
                                <SelectItem key={size} value={size}>{size}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            value={newSize.quantity}
                            onChange={(e) => setNewSize({ ...newSize, quantity: parseInt(e.target.value) || 0 })}
                            placeholder="الكمية"
                            className="w-20"
                            data-testid={`input-size-quantity-${colorIndex}`}
                          />
                          <Button
                            type="button"
                            onClick={() => addSizeToColor(colorIndex)}
                            size="sm"
                            data-testid={`button-add-size-${colorIndex}`}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Sizes List */}
                        <div className="grid grid-cols-4 gap-2">
                          {color.sizes.map((size, sizeIndex) => (
                            <div 
                              key={sizeIndex}
                              className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                              data-testid={`size-item-${colorIndex}-${sizeIndex}`}
                            >
                              <span className="font-medium">{size.sizeLabel}</span>
                              <div className="flex items-center space-x-reverse space-x-1">
                                <Input
                                  type="number"
                                  value={size.quantity}
                                  onChange={(e) => updateSizeQuantity(colorIndex, sizeIndex, parseInt(e.target.value) || 0)}
                                  className="w-12 h-6 text-xs p-1"
                                  data-testid={`input-quantity-${colorIndex}-${sizeIndex}`}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeSizeFromColor(colorIndex, sizeIndex)}
                                  className="h-6 w-6 p-0 text-red-600"
                                  data-testid={`button-remove-size-${colorIndex}-${sizeIndex}`}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 pt-6 border-t border-border">
              <Button 
                type="submit" 
                disabled={createProductMutation.isPending}
                className="flex-1"
                data-testid="button-submit-product"
              >
                {createProductMutation.isPending 
                  ? "جاري المعالجة..." 
                  : isEdit ? "تحديث المنتج" : "إنشاء المنتج"
                }
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="flex-1"
                data-testid="button-cancel-product"
              >
                إلغاء
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
