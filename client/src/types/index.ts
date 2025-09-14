export interface Employee {
  id: number;
  name: string;
  role: string;
}

export interface Product {
  id: number;
  productCode: string;
  modelNo?: string;
  brand?: string;
  productType?: string;
  storePrice?: string;
  onlinePrice?: string;
  specs?: string;
  mainImageUrl?: string;
}

export interface ProductColor {
  id: number;
  productId: number;
  colorName: string;
  colorSwatchUrl?: string;
}

export interface ProductSize {
  id: number;
  colorId: number;
  sizeLabel: string;
  quantity: number;
}

export interface ProductWithDetails extends Product {
  colors: (ProductColor & {
    sizes: ProductSize[];
  })[];
}

export interface Sale {
  id: number;
  employeeId: number;
  storeType: string;
  paymentMethod?: string;
  taxApplied: boolean;
  taxAmount: string;
  totalAmount: string;
  createdAt: Date;
}

export interface SaleItem {
  id: number;
  saleId: number;
  productId: number;
  colorName: string;
  sizeLabel: string;
  quantity: number;
  unitPrice: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  phone: string;
  emirate: string;
  address: string;
  trackingNumber?: string;
  paymentMethod: string;
  status: string;
  employeeId: number;
  createdAt: Date;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  colorName: string;
  sizeLabel: string;
  quantity: number;
  unitPrice: string;
}

export interface CartItem {
  product: Product;
  colorName: string;
  sizeLabel: string;
  quantity: number;
  unitPrice: number;
}

export interface DashboardStats {
  totalProducts: number;
  todaySales: number;
  pendingOrders: number;
  lowStockProducts: number;
}

export interface TopSellingProduct {
  product: Product;
  totalSold: number;
  totalRevenue: number;
}

export interface ReturnExchange {
  id: number;
  type: string;
  exchangeMode?: string;
  originalSaleId?: number;
  employeeId: number;
  notes?: string;
  createdAt: Date;
}

export type StoreType = 'boutique' | 'online';
export type PaymentMethod = 'cash' | 'visa' | 'cod' | 'bank';
export type OrderStatus = 'pending' | 'out_for_delivery' | 'delivered' | 'cancelled';
