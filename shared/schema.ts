import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean, timestamp, serial } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").default("staff").notNull(), // 'staff' | 'manager'
  createdAt: timestamp("created_at").defaultNow()
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  productCode: varchar("product_code", { length: 50 }).unique().notNull(),
  modelNo: text("model_no"),
  brand: text("brand"),
  productType: text("product_type"),
  storePrice: decimal("store_price", { precision: 10, scale: 2 }),
  onlinePrice: decimal("online_price", { precision: 10, scale: 2 }),
  specs: text("specs"),
  mainImageUrl: text("main_image_url"),
  createdAt: timestamp("created_at").defaultNow()
});

export const productColors = pgTable("product_colors", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  colorName: text("color_name").notNull(),
  colorSwatchUrl: text("color_swatch_url")
});

export const productSizes = pgTable("product_sizes", {
  id: serial("id").primaryKey(),
  colorId: integer("color_id").references(() => productColors.id, { onDelete: "cascade" }).notNull(),
  sizeLabel: text("size_label").notNull(),
  quantity: integer("quantity").default(0).notNull()
});

export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  storeType: text("store_type").notNull(), // 'boutique' | 'online'
  paymentMethod: text("payment_method"), // 'cash' | 'visa' | 'cod' | 'bank'
  taxApplied: boolean("tax_applied").default(false),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

export const saleItems = pgTable("sale_items", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").references(() => sales.id, { onDelete: "cascade" }).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  colorName: text("color_name").notNull(),
  sizeLabel: text("size_label").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull()
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("order_number", { length: 50 }).unique().notNull(),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  emirate: text("emirate").notNull(),
  address: text("address").notNull(),
  trackingNumber: text("tracking_number"),
  paymentMethod: text("payment_method").notNull(), // 'cod' | 'bank'
  status: text("status").default("pending").notNull(), // 'pending' | 'out_for_delivery' | 'delivered' | 'cancelled'
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id, { onDelete: "cascade" }).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  colorName: text("color_name").notNull(),
  sizeLabel: text("size_label").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull()
});

export const returnsExchanges = pgTable("returns_exchanges", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'refund' | 'exchange'
  exchangeMode: text("exchange_mode"), // 'color_to_color' | 'size_to_size' | 'model_to_model'
  originalSaleId: integer("original_sale_id"),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow()
});

// Relations
export const productsRelations = relations(products, ({ many }) => ({
  colors: many(productColors),
  saleItems: many(saleItems),
  orderItems: many(orderItems)
}));

export const productColorsRelations = relations(productColors, ({ one, many }) => ({
  product: one(products, {
    fields: [productColors.productId],
    references: [products.id]
  }),
  sizes: many(productSizes)
}));

export const productSizesRelations = relations(productSizes, ({ one }) => ({
  color: one(productColors, {
    fields: [productSizes.colorId],
    references: [productColors.id]
  })
}));

export const employeesRelations = relations(employees, ({ many }) => ({
  sales: many(sales),
  orders: many(orders),
  returns: many(returnsExchanges)
}));

export const salesRelations = relations(sales, ({ one, many }) => ({
  employee: one(employees, {
    fields: [sales.employeeId],
    references: [employees.id]
  }),
  items: many(saleItems)
}));

export const saleItemsRelations = relations(saleItems, ({ one }) => ({
  sale: one(sales, {
    fields: [saleItems.saleId],
    references: [sales.id]
  }),
  product: one(products, {
    fields: [saleItems.productId],
    references: [products.id]
  })
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  employee: one(employees, {
    fields: [orders.employeeId],
    references: [employees.id]
  }),
  items: many(orderItems)
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id]
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id]
  })
}));

export const returnsExchangesRelations = relations(returnsExchanges, ({ one }) => ({
  employee: one(employees, {
    fields: [returnsExchanges.employeeId],
    references: [employees.id]
  })
}));

// Insert schemas
export const insertEmployeeSchema = createInsertSchema(employees).omit({ id: true, createdAt: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true });
export const insertProductColorSchema = createInsertSchema(productColors).omit({ id: true });
export const insertProductSizeSchema = createInsertSchema(productSizes).omit({ id: true });
export const insertSaleSchema = createInsertSchema(sales).omit({ id: true, createdAt: true });
export const insertSaleItemSchema = createInsertSchema(saleItems).omit({ id: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true });
export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ id: true });
export const insertReturnExchangeSchema = createInsertSchema(returnsExchanges).omit({ id: true, createdAt: true });

// Types
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type ProductColor = typeof productColors.$inferSelect;
export type InsertProductColor = z.infer<typeof insertProductColorSchema>;
export type ProductSize = typeof productSizes.$inferSelect;
export type InsertProductSize = z.infer<typeof insertProductSizeSchema>;
export type Sale = typeof sales.$inferSelect;
export type InsertSale = z.infer<typeof insertSaleSchema>;
export type SaleItem = typeof saleItems.$inferSelect;
export type InsertSaleItem = z.infer<typeof insertSaleItemSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type ReturnExchange = typeof returnsExchanges.$inferSelect;
export type InsertReturnExchange = z.infer<typeof insertReturnExchangeSchema>;

// Additional types for complex queries
export type ProductWithDetails = Product & {
  colors: (ProductColor & {
    sizes: ProductSize[];
  })[];
};

export type SaleWithItems = Sale & {
  employee: Employee;
  items: (SaleItem & {
    product: Product;
  })[];
};

export type OrderWithItems = Order & {
  employee: Employee;
  items: (OrderItem & {
    product: Product;
  })[];
};
