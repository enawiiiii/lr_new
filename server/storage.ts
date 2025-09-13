import { 
  products, sales, orders, returns, activities,
  type Product, type Sale, type Order, type Return, type Activity,
  type InsertProduct, type InsertSale, type InsertOrder, type InsertReturn, type InsertActivity
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, gte, lt } from "drizzle-orm";

export interface IStorage {
  // Products
  getProducts(context: 'boutique' | 'online'): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product>;
  updateProductInventory(id: string, color: string, size: number, quantityChange: number): Promise<void>;
  
  // Sales (boutique)
  getSales(dateFrom?: Date, dateTo?: Date): Promise<Sale[]>;
  createSale(sale: InsertSale): Promise<Sale>;
  getNextInvoiceNumber(): Promise<string>;
  
  // Orders (online)
  getOrders(status?: string): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: string, status: string, updatedBy: string): Promise<Order>;
  getNextOrderNumber(): Promise<string>;
  
  // Returns
  getReturns(): Promise<Return[]>;
  createReturn(returnData: InsertReturn): Promise<Return>;
  approveReturn(id: string, processedBy: string): Promise<Return>;
  
  // Activities
  getActivities(context?: 'boutique' | 'online', limit?: number): Promise<Activity[]>;
  logActivity(activity: InsertActivity): Promise<Activity>;
  
  // Reports
  getDailySales(context: 'boutique' | 'online', date: Date): Promise<{ totalSales: number; totalAmount: number }>;
  getWeeklySales(context: 'boutique' | 'online', weekStart: Date): Promise<{ totalSales: number; totalAmount: number }>;
  getMonthlySales(context: 'boutique' | 'online', monthStart: Date): Promise<{ totalSales: number; totalAmount: number }>;
}

export class DatabaseStorage implements IStorage {
  async getProducts(context: 'boutique' | 'online'): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.context, context)).orderBy(desc(products.createdAt));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product> {
    const [updatedProduct] = await db.update(products).set(updates).where(eq(products.id, id)).returning();
    return updatedProduct;
  }

  async updateProductInventory(id: string, color: string, size: number, quantityChange: number): Promise<void> {
    const product = await this.getProduct(id);
    if (!product) throw new Error('Product not found');
    
    const currentInventory = product.inventory as Record<string, Record<number, number>>;
    if (!currentInventory[color]) currentInventory[color] = {};
    if (!currentInventory[color][size]) currentInventory[color][size] = 0;
    
    currentInventory[color][size] += quantityChange;
    if (currentInventory[color][size] < 0) currentInventory[color][size] = 0;
    
    await db.update(products).set({ inventory: currentInventory }).where(eq(products.id, id));
  }

  async getSales(dateFrom?: Date, dateTo?: Date): Promise<Sale[]> {
    let query = db.select().from(sales);
    
    if (dateFrom && dateTo) {
      query = query.where(and(
        gte(sales.createdAt, dateFrom),
        lt(sales.createdAt, dateTo)
      ));
    }
    
    const result = await query.orderBy(desc(sales.createdAt));
    return result;
  }

  async createSale(sale: InsertSale): Promise<Sale> {
    const invoiceNumber = await this.getNextInvoiceNumber();
    const [newSale] = await db.insert(sales).values({ ...sale, invoiceNumber }).returning();
    return newSale;
  }

  async getNextInvoiceNumber(): Promise<string> {
    const [lastSale] = await db.select({ invoiceNumber: sales.invoiceNumber })
      .from(sales)
      .orderBy(desc(sales.createdAt))
      .limit(1);
    
    if (!lastSale) return '7000001';
    
    const lastNumber = parseInt(lastSale.invoiceNumber);
    return (lastNumber + 1).toString();
  }

  async getOrders(status?: string): Promise<Order[]> {
    let query = db.select().from(orders);
    
    if (status) {
      query = query.where(eq(orders.status, status as any));
    }
    
    const result = await query.orderBy(desc(orders.createdAt));
    return result;
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const orderNumber = await this.getNextOrderNumber();
    const [newOrder] = await db.insert(orders).values({ ...order, orderNumber }).returning();
    return newOrder;
  }

  async updateOrderStatus(id: string, status: string, updatedBy: string): Promise<Order> {
    const [updatedOrder] = await db.update(orders)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    
    // If status is 'delivered', deduct from inventory
    if (status === 'delivered') {
      const order = updatedOrder;
      await this.updateProductInventory(order.productId!, order.color, order.size, -(order.quantity || 1));
    }
    
    return updatedOrder;
  }

  async getNextOrderNumber(): Promise<string> {
    const [lastOrder] = await db.select({ orderNumber: orders.orderNumber })
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(1);
    
    if (!lastOrder) return 'ON-001';
    
    const lastNumber = parseInt(lastOrder.orderNumber.split('-')[1]);
    return `ON-${String(lastNumber + 1).padStart(3, '0')}`;
  }

  async getReturns(): Promise<Return[]> {
    return await db.select().from(returns).orderBy(desc(returns.createdAt));
  }

  async createReturn(returnData: InsertReturn): Promise<Return> {
    const [newReturn] = await db.insert(returns).values(returnData).returning();
    return newReturn;
  }

  async approveReturn(id: string, processedBy: string): Promise<Return> {
    const [approvedReturn] = await db.update(returns)
      .set({ approved: true, processedBy })
      .where(eq(returns.id, id))
      .returning();
    
    // Restore inventory
    const returnWithOrder = await db.select({
      return: returns,
      order: orders
    }).from(returns)
      .leftJoin(orders, eq(returns.orderId, orders.id))
      .where(eq(returns.id, id));
    
    if (returnWithOrder[0]?.order) {
      const order = returnWithOrder[0].order;
      await this.updateProductInventory(order.productId!, order.color, order.size, order.quantity || 1);
    }
    
    return approvedReturn;
  }

  async getActivities(context?: 'boutique' | 'online', limit = 50): Promise<Activity[]> {
    let query = db.select().from(activities);
    
    if (context) {
      query = query.where(eq(activities.context, context));
    }
    
    const result = await query.orderBy(desc(activities.createdAt)).limit(limit);
    return result;
  }

  async logActivity(activity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db.insert(activities).values(activity).returning();
    return newActivity;
  }

  async getDailySales(context: 'boutique' | 'online', date: Date): Promise<{ totalSales: number; totalAmount: number }> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    if (context === 'boutique') {
      const result = await db.select({
        totalSales: sql<number>`count(*)`,
        totalAmount: sql<number>`sum(${sales.totalAmount})`
      }).from(sales).where(and(
        gte(sales.createdAt, startOfDay),
        lt(sales.createdAt, endOfDay)
      ));
      
      return {
        totalSales: Number(result[0]?.totalSales || 0),
        totalAmount: Number(result[0]?.totalAmount || 0)
      };
    } else {
      const result = await db.select({
        totalSales: sql<number>`count(*)`,
        totalAmount: sql<number>`sum(${orders.totalAmount})`
      }).from(orders).where(and(
        eq(orders.status, 'delivered'),
        gte(orders.createdAt, startOfDay),
        lt(orders.createdAt, endOfDay)
      ));
      
      return {
        totalSales: Number(result[0]?.totalSales || 0),
        totalAmount: Number(result[0]?.totalAmount || 0)
      };
    }
  }

  async getWeeklySales(context: 'boutique' | 'online', weekStart: Date): Promise<{ totalSales: number; totalAmount: number }> {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    if (context === 'boutique') {
      const result = await db.select({
        totalSales: sql<number>`count(*)`,
        totalAmount: sql<number>`sum(${sales.totalAmount})`
      }).from(sales).where(and(
        gte(sales.createdAt, weekStart),
        lt(sales.createdAt, weekEnd)
      ));
      
      return {
        totalSales: Number(result[0]?.totalSales || 0),
        totalAmount: Number(result[0]?.totalAmount || 0)
      };
    } else {
      const result = await db.select({
        totalSales: sql<number>`count(*)`,
        totalAmount: sql<number>`sum(${orders.totalAmount})`
      }).from(orders).where(and(
        eq(orders.status, 'delivered'),
        gte(orders.createdAt, weekStart),
        lt(orders.createdAt, weekEnd)
      ));
      
      return {
        totalSales: Number(result[0]?.totalSales || 0),
        totalAmount: Number(result[0]?.totalAmount || 0)
      };
    }
  }

  async getMonthlySales(context: 'boutique' | 'online', monthStart: Date): Promise<{ totalSales: number; totalAmount: number }> {
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);

    if (context === 'boutique') {
      const result = await db.select({
        totalSales: sql<number>`count(*)`,
        totalAmount: sql<number>`sum(${sales.totalAmount})`
      }).from(sales).where(and(
        gte(sales.createdAt, monthStart),
        lt(sales.createdAt, monthEnd)
      ));
      
      return {
        totalSales: Number(result[0]?.totalSales || 0),
        totalAmount: Number(result[0]?.totalAmount || 0)
      };
    } else {
      const result = await db.select({
        totalSales: sql<number>`count(*)`,
        totalAmount: sql<number>`sum(${orders.totalAmount})`
      }).from(orders).where(and(
        eq(orders.status, 'delivered'),
        gte(orders.createdAt, monthStart),
        lt(orders.createdAt, monthEnd)
      ));
      
      return {
        totalSales: Number(result[0]?.totalSales || 0),
        totalAmount: Number(result[0]?.totalAmount || 0)
      };
    }
  }
}

export const storage = new DatabaseStorage();
