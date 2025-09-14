import { apiRequest } from "./queryClient";

export async function uploadProductImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload image');
  }

  const data = await response.json();
  return data.url;
}

export async function createProduct(productData: any, imageFile?: File) {
  const formData = new FormData();
  
  Object.keys(productData).forEach(key => {
    if (productData[key] !== undefined && productData[key] !== null) {
      formData.append(key, productData[key]);
    }
  });
  
  if (imageFile) {
    formData.append('image', imageFile);
  }

  const response = await fetch('/api/products', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to create product');
  }

  return await response.json();
}

export async function updateProduct(id: number, productData: any, imageFile?: File) {
  const formData = new FormData();
  
  Object.keys(productData).forEach(key => {
    if (productData[key] !== undefined && productData[key] !== null) {
      formData.append(key, productData[key]);
    }
  });
  
  if (imageFile) {
    formData.append('image', imageFile);
  }

  const response = await fetch(`/api/products/${id}`, {
    method: 'PUT',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to update product');
  }

  return await response.json();
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `${num.toLocaleString('ar-AE', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })} د.إ`;
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('ar-AE', {
    year: 'numeric',
    month: 'long', 
    day: 'numeric',
    timeZone: 'Asia/Dubai'
  });
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleString('ar-AE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Dubai'
  });
}

export function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'pending':
      return 'status-pending';
    case 'delivered':
      return 'status-delivered';
    case 'cancelled':
      return 'status-cancelled';
    case 'out_for_delivery':
      return 'status-out_for_delivery';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

export function getStatusText(status: string): string {
  switch (status) {
    case 'pending':
      return 'قيد المعالجة';
    case 'out_for_delivery':
      return 'قيد التوصيل';
    case 'delivered':
      return 'تم التسليم';
    case 'cancelled':
      return 'ملغى';
    default:
      return status;
  }
}

export function getPaymentMethodText(method: string): string {
  switch (method) {
    case 'cash':
      return 'كاش';
    case 'visa':
      return 'فيزا';
    case 'cod':
      return 'الدفع عند التسليم';
    case 'bank':
      return 'تحويل بنكي';
    default:
      return method;
  }
}

export function getPaymentMethodClass(method: string): string {
  switch (method) {
    case 'cash':
      return 'payment-cash';
    case 'visa':
      return 'payment-visa';
    case 'cod':
      return 'payment-cod';
    case 'bank':
      return 'payment-bank';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

export const UAE_EMIRATES = [
  'أبوظبي',
  'دبي',
  'الشارقة',
  'عجمان',
  'أم القيوين',
  'رأس الخيمة',
  'الفجيرة'
];
