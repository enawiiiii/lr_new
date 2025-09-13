import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, pgEnum, json } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const contextEnum = pgEnum('context', ['boutique', 'online']);
export const orderStatusEnum = pgEnum('order_status', ['pending', 'delivered', 'cancelled', 'returned']);
export const paymentMethodEnum = pgEnum('payment_method', ['cash', 'card']);

// Products table (separate for each context)
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  image: text("image"),
  colors: json("colors").$type<string[]>().default([]),
  sizes: json("sizes").$type<number[]>().default([]),
  inventory: json("inventory").$type<Record<string, Record<number, number>>>().default({}), // {color: {size: quantity}}
  context: contextEnum("context").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  createdBy: text("created_by").notNull(),
});

// Sales table (for boutique)
export const sales = pgTable("sales", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceNumber: text("invoice_number").notNull().unique(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  productId: varchar("product_id").references(() => products.id),
  color: text("color").notNull(),
  size: integer("size").notNull(),
  quantity: integer("quantity").default(1),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  soldBy: text("sold_by").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Orders table (for online)
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: text("order_number").notNull().unique(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  emirate: text("emirate").notNull(),
  address: text("address").notNull(),
  trackingNumber: text("tracking_number"),
  notes: text("notes"),
  productId: varchar("product_id").references(() => products.id),
  color: text("color").notNull(),
  size: integer("size").notNull(),
  quantity: integer("quantity").default(1),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: orderStatusEnum("status").default('pending'),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Returns table (for online orders)
export const returns = pgTable("returns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id),
  reason: text("reason"),
  approved: boolean("approved").default(false),
  processedBy: text("processed_by").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Activity log
export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // 'product_added', 'sale_made', 'order_created', 'status_updated', 'return_processed'
  description: text("description").notNull(),
  employeeName: text("employee_name").notNull(),
  context: contextEnum("context").notNull(),
  metadata: json("metadata").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Relations
export const productsRelations = relations(products, ({ many }) => ({
  sales: many(sales),
  orders: many(orders),
}));

export const salesRelations = relations(sales, ({ one }) => ({
  product: one(products, {
    fields: [sales.productId],
    references: [products.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  product: one(products, {
    fields: [orders.productId],
    references: [products.id],
  }),
  returns: many(returns),
}));

export const returnsRelations = relations(returns, ({ one }) => ({
  order: one(orders, {
    fields: [returns.orderId],
    references: [orders.id],
  }),
}));

// Insert schemas
export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});

export const insertSaleSchema = createInsertSchema(sales).omit({
  id: true,
  invoiceNumber: true,
  createdAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  orderNumber: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReturnSchema = createInsertSchema(returns).omit({
  id: true,
  createdAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

// Types
export type Product = typeof products.$inferSelect;
export type Sale = typeof sales.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Return = typeof returns.$inferSelect;
export type Activity = typeof activities.$inferSelect;

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertSale = z.infer<typeof insertSaleSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type InsertReturn = z.infer<typeof insertReturnSchema>;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
