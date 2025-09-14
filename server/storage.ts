import { 
  employees, products, productColors, productSizes, sales, saleItems, 
  orders, orderItems, returnsExchanges,
  type Employee, type InsertEmployee, type Product, type InsertProduct,
  type ProductColor, type InsertProductColor, type ProductSize, type InsertProductSize,
  type Sale, type InsertSale, type SaleItem, type InsertSaleItem,
  type Order, type InsertOrder, type OrderItem, type InsertOrderItem,
  type ReturnExchange, type InsertReturnExchange,
  type ProductWithDetails, type SaleWithItems, type OrderWithItems
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, like } from "drizzle-orm";

export interface IStorage {
  // Employees
  getEmployees(): Promise<Employee[]>;
  getEmployee(id: number): Promise<Employee | undefined>;
  getEmployeeByName(name: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  
  // Products
  getProducts(search?: string, limit?: number): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  getProductWithDetails(id: number): Promise<ProductWithDetails | undefined>;
  getProductByCode(code: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<Product>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;
  
  // Product Colors and Sizes
  createProductColor(color: InsertProductColor): Promise<ProductColor>;
  createProductSize(size: InsertProductSize): Promise<ProductSize>;
  updateProductSize(id: number, quantity: number): Promise<ProductSize>;
  getProductSizes(colorId: number): Promise<ProductSize[]>;
  
  // Sales
  getSales(storeType?: string, limit?: number): Promise<SaleWithItems[]>;
  getSale(id: number): Promise<SaleWithItems | undefined>;
  createSale(sale: InsertSale, items: InsertSaleItem[]): Promise<Sale>;
  
  // Orders
  getOrders(limit?: number): Promise<OrderWithItems[]>;
  getOrder(id: number): Promise<OrderWithItems | undefined>;
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order>;
  updateOrderStatus(id: number, status: string, trackingNumber?: string): Promise<Order>;
  
  // Returns and Exchanges
  getReturnsExchanges(limit?: number): Promise<ReturnExchange[]>;
  createReturnExchange(returnExchange: InsertReturnExchange): Promise<ReturnExchange>;
  
  // Analytics
  getDashboardStats(): Promise<{
    totalProducts: number;
    todaySales: number;
    pendingOrders: number;
    lowStockProducts: number;
  }>;
  
  getTopSellingProducts(limit?: number): Promise<Array<{
    product: Product;
    totalSold: number;
    totalRevenue: number;
  }>>;
}

export class DatabaseStorage implements IStorage {
  async getEmployees(): Promise<Employee[]> {
    return await db.select().from(employees).orderBy(employees.name);
  }

  async getEmployee(id: number): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee || undefined;
  }

  async getEmployeeByName(name: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.name, name));
    return employee || undefined;
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const [newEmployee] = await db.insert(employees).values(employee).returning();
    return newEmployee;
  }

  async getProducts(search?: string, limit = 50): Promise<Product[]> {
    let query = db.select().from(products);
    
    if (search) {
      query = query.where(
        sql`${products.productCode} ILIKE ${`%${search}%`} OR ${products.brand} ILIKE ${`%${search}%`}`
      ) as any;
    }
    
    return await query.limit(limit).orderBy(desc(products.createdAt));
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async getProductWithDetails(id: number): Promise<ProductWithDetails | undefined> {
    const product = await this.getProduct(id);
    if (!product) return undefined;

    const colors = await db.select().from(productColors).where(eq(productColors.productId, id));
    
    const productWithColors = {
      ...product,
      colors: await Promise.all(
        colors.map(async (color) => ({
          ...color,
          sizes: await db.select().from(productSizes).where(eq(productSizes.colorId, color.id))
        }))
      )
    };

    return productWithColors;
  }

  async getProductByCode(code: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.productCode, code));
    return product || undefined;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: number, product: Partial<Product>): Promise<Product> {
    const [updatedProduct] = await db.update(products)
      .set(product)
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async createProductColor(color: InsertProductColor): Promise<ProductColor> {
    const [newColor] = await db.insert(productColors).values(color).returning();
    return newColor;
  }

  async createProductSize(size: InsertProductSize): Promise<ProductSize> {
    const [newSize] = await db.insert(productSizes).values(size).returning();
    return newSize;
  }

  async updateProductSize(id: number, quantity: number): Promise<ProductSize> {
    const [updatedSize] = await db.update(productSizes)
      .set({ quantity })
      .where(eq(productSizes.id, id))
      .returning();
    return updatedSize;
  }

  async getProductSizes(colorId: number): Promise<ProductSize[]> {
    return await db.select().from(productSizes).where(eq(productSizes.colorId, colorId));
  }

  async getSales(storeType?: string, limit = 50): Promise<SaleWithItems[]> {
    let query = db.select({
      id: sales.id,
      employeeId: sales.employeeId,
      storeType: sales.storeType,
      paymentMethod: sales.paymentMethod,
      taxApplied: sales.taxApplied,
      taxAmount: sales.taxAmount,
      totalAmount: sales.totalAmount,
      createdAt: sales.createdAt,
      employee: employees,
    }).from(sales)
    .innerJoin(employees, eq(sales.employeeId, employees.id));

    if (storeType) {
      query = query.where(eq(sales.storeType, storeType)) as any;
    }

    const salesData = await query.limit(limit).orderBy(desc(sales.createdAt));

    return await Promise.all(
      salesData.map(async (sale) => ({
        ...sale,
        items: await db.select({
          id: saleItems.id,
          saleId: saleItems.saleId,
          productId: saleItems.productId,
          colorName: saleItems.colorName,
          sizeLabel: saleItems.sizeLabel,
          quantity: saleItems.quantity,
          unitPrice: saleItems.unitPrice,
          product: products
        }).from(saleItems)
        .innerJoin(products, eq(saleItems.productId, products.id))
        .where(eq(saleItems.saleId, sale.id))
      }))
    );
  }

  async getSale(id: number): Promise<SaleWithItems | undefined> {
    const saleData = await db.select({
      id: sales.id,
      employeeId: sales.employeeId,
      storeType: sales.storeType,
      paymentMethod: sales.paymentMethod,
      taxApplied: sales.taxApplied,
      taxAmount: sales.taxAmount,
      totalAmount: sales.totalAmount,
      createdAt: sales.createdAt,
      employee: employees,
    }).from(sales)
    .innerJoin(employees, eq(sales.employeeId, employees.id))
    .where(eq(sales.id, id));

    if (saleData.length === 0) return undefined;

    const sale = saleData[0];
    const items = await db.select({
      id: saleItems.id,
      saleId: saleItems.saleId,
      productId: saleItems.productId,
      colorName: saleItems.colorName,
      sizeLabel: saleItems.sizeLabel,
      quantity: saleItems.quantity,
      unitPrice: saleItems.unitPrice,
      product: products
    }).from(saleItems)
    .innerJoin(products, eq(saleItems.productId, products.id))
    .where(eq(saleItems.saleId, id));

    return { ...sale, items };
  }

  async createSale(sale: InsertSale, items: InsertSaleItem[]): Promise<Sale> {
    const [newSale] = await db.insert(sales).values(sale).returning();
    
    // Insert sale items
    const saleItemsWithSaleId = items.map(item => ({ ...item, saleId: newSale.id }));
    await db.insert(saleItems).values(saleItemsWithSaleId);
    
    // Update inventory
    for (const item of items) {
      await db.execute(sql`
        UPDATE product_sizes 
        SET quantity = quantity - ${item.quantity}
        WHERE color_id IN (
          SELECT id FROM product_colors WHERE product_id = ${item.productId}
        ) AND size_label = ${item.sizeLabel}
      `);
    }
    
    return newSale;
  }

  async getOrders(limit = 50): Promise<OrderWithItems[]> {
    const ordersData = await db.select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      customerName: orders.customerName,
      phone: orders.phone,
      emirate: orders.emirate,
      address: orders.address,
      trackingNumber: orders.trackingNumber,
      paymentMethod: orders.paymentMethod,
      status: orders.status,
      employeeId: orders.employeeId,
      createdAt: orders.createdAt,
      employee: employees,
    }).from(orders)
    .innerJoin(employees, eq(orders.employeeId, employees.id))
    .limit(limit)
    .orderBy(desc(orders.createdAt));

    return await Promise.all(
      ordersData.map(async (order) => ({
        ...order,
        items: await db.select({
          id: orderItems.id,
          orderId: orderItems.orderId,
          productId: orderItems.productId,
          colorName: orderItems.colorName,
          sizeLabel: orderItems.sizeLabel,
          quantity: orderItems.quantity,
          unitPrice: orderItems.unitPrice,
          product: products
        }).from(orderItems)
        .innerJoin(products, eq(orderItems.productId, products.id))
        .where(eq(orderItems.orderId, order.id))
      }))
    );
  }

  async getOrder(id: number): Promise<OrderWithItems | undefined> {
    const orderData = await db.select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      customerName: orders.customerName,
      phone: orders.phone,
      emirate: orders.emirate,
      address: orders.address,
      trackingNumber: orders.trackingNumber,
      paymentMethod: orders.paymentMethod,
      status: orders.status,
      employeeId: orders.employeeId,
      createdAt: orders.createdAt,
      employee: employees,
    }).from(orders)
    .innerJoin(employees, eq(orders.employeeId, employees.id))
    .where(eq(orders.id, id));

    if (orderData.length === 0) return undefined;

    const order = orderData[0];
    const items = await db.select({
      id: orderItems.id,
      orderId: orderItems.orderId,
      productId: orderItems.productId,
      colorName: orderItems.colorName,
      sizeLabel: orderItems.sizeLabel,
      quantity: orderItems.quantity,
      unitPrice: orderItems.unitPrice,
      product: products
    }).from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, id));

    return { ...order, items };
  }

  async createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    
    // Insert order items
    const orderItemsWithOrderId = items.map(item => ({ ...item, orderId: newOrder.id }));
    await db.insert(orderItems).values(orderItemsWithOrderId);
    
    // Update inventory
    for (const item of items) {
      await db.execute(sql`
        UPDATE product_sizes 
        SET quantity = quantity - ${item.quantity}
        WHERE color_id IN (
          SELECT id FROM product_colors WHERE product_id = ${item.productId}
        ) AND size_label = ${item.sizeLabel}
      `);
    }
    
    return newOrder;
  }

  async updateOrderStatus(id: number, status: string, trackingNumber?: string): Promise<Order> {
    const updateData: Partial<Order> = { status };
    if (trackingNumber) {
      updateData.trackingNumber = trackingNumber;
    }
    
    const [updatedOrder] = await db.update(orders)
      .set(updateData)
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  async getReturnsExchanges(limit = 50): Promise<ReturnExchange[]> {
    return await db.select().from(returnsExchanges)
      .limit(limit)
      .orderBy(desc(returnsExchanges.createdAt));
  }

  async createReturnExchange(returnExchange: InsertReturnExchange): Promise<ReturnExchange> {
    const [newReturn] = await db.insert(returnsExchanges).values(returnExchange).returning();
    return newReturn;
  }

  async getDashboardStats(): Promise<{
    totalProducts: number;
    todaySales: number;
    pendingOrders: number;
    lowStockProducts: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [productCount] = await db.select({ count: sql<number>`count(*)` }).from(products);
    
    const [todaySalesResult] = await db.select({ 
      total: sql<number>`COALESCE(SUM(${sales.totalAmount}), 0)` 
    }).from(sales).where(sql`DATE(${sales.createdAt}) = CURRENT_DATE`);
    
    const [pendingOrdersResult] = await db.select({ count: sql<number>`count(*)` })
      .from(orders).where(eq(orders.status, "pending"));
    
    const [lowStockResult] = await db.select({ count: sql<number>`count(*)` })
      .from(productSizes).where(sql`${productSizes.quantity} < 5`);

    return {
      totalProducts: productCount.count,
      todaySales: Number(todaySalesResult.total),
      pendingOrders: pendingOrdersResult.count,
      lowStockProducts: lowStockResult.count
    };
  }

  async getTopSellingProducts(limit = 10): Promise<Array<{
    product: Product;
    totalSold: number;
    totalRevenue: number;
  }>> {
    const result = await db.select({
      product: products,
      totalSold: sql<number>`SUM(${saleItems.quantity})`,
      totalRevenue: sql<number>`SUM(${saleItems.quantity} * ${saleItems.unitPrice})`
    })
    .from(saleItems)
    .innerJoin(products, eq(saleItems.productId, products.id))
    .groupBy(products.id)
    .orderBy(sql`SUM(${saleItems.quantity}) DESC`)
    .limit(limit);

    return result.map(row => ({
      product: row.product,
      totalSold: Number(row.totalSold),
      totalRevenue: Number(row.totalRevenue)
    }));
  }
}

export const storage = new DatabaseStorage();
