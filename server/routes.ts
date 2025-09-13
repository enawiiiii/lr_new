import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertSaleSchema, insertOrderSchema, insertReturnSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import { z } from "zod";

// Configure multer for image uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve uploaded images
  app.use('/uploads', express.static('uploads'));

  // Products
  app.get('/api/products/:context', async (req, res) => {
    try {
      const context = req.params.context as 'boutique' | 'online';
      const products = await storage.getProducts(context);
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  });

  app.get('/api/products/:context/:id', async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch product' });
    }
  });

  app.post('/api/products', upload.single('image'), async (req, res) => {
    try {
      const productData = {
        ...req.body,
        colors: JSON.parse(req.body.colors || '[]'),
        sizes: JSON.parse(req.body.sizes || '[]').map(Number),
        inventory: JSON.parse(req.body.inventory || '{}'),
        image: req.file ? `/uploads/${req.file.filename}` : null
      };

      const validatedData = insertProductSchema.parse(productData);
      const product = await storage.createProduct(validatedData);

      // Log activity
      await storage.logActivity({
        type: 'product_added',
        description: `تم إضافة منتج جديد: ${product.name}`,
        employeeName: validatedData.createdBy,
        context: validatedData.context,
        metadata: { productId: product.id }
      });

      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid product data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create product' });
    }
  });

  // Sales (Boutique)
  app.get('/api/sales', async (req, res) => {
    try {
      const { dateFrom, dateTo } = req.query;
      const sales = await storage.getSales(
        dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo ? new Date(dateTo as string) : undefined
      );
      res.json(sales);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch sales' });
    }
  });

  app.post('/api/sales', async (req, res) => {
    try {
      const validatedData = insertSaleSchema.parse(req.body);
      
      // Deduct from inventory immediately
      await storage.updateProductInventory(
        validatedData.productId!,
        validatedData.color,
        validatedData.size,
        -validatedData.quantity
      );

      const sale = await storage.createSale(validatedData);

      // Log activity
      await storage.logActivity({
        type: 'sale_made',
        description: `تم تسجيل بيع جديد - فاتورة رقم: ${sale.invoiceNumber}`,
        employeeName: validatedData.soldBy,
        context: 'boutique',
        metadata: { saleId: sale.id, amount: sale.totalAmount }
      });

      res.json(sale);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid sale data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create sale' });
    }
  });

  // Orders (Online)
  app.get('/api/orders', async (req, res) => {
    try {
      const { status } = req.query;
      const orders = await storage.getOrders(status as string);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  });

  app.get('/api/orders/:id', async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch order' });
    }
  });

  app.post('/api/orders', async (req, res) => {
    try {
      const validatedData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(validatedData);

      // Log activity
      await storage.logActivity({
        type: 'order_created',
        description: `تم إنشاء طلب جديد - رقم: ${order.orderNumber}`,
        employeeName: validatedData.createdBy,
        context: 'online',
        metadata: { orderId: order.id, amount: order.totalAmount }
      });

      res.json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid order data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create order' });
    }
  });

  app.patch('/api/orders/:id/status', async (req, res) => {
    try {
      const { status, updatedBy } = req.body;
      const order = await storage.updateOrderStatus(req.params.id, status, updatedBy);

      // Log activity
      await storage.logActivity({
        type: 'status_updated',
        description: `تم تحديث حالة الطلب ${order.orderNumber} إلى: ${status}`,
        employeeName: updatedBy,
        context: 'online',
        metadata: { orderId: order.id, newStatus: status }
      });

      res.json(order);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update order status' });
    }
  });

  // Returns
  app.get('/api/returns', async (req, res) => {
    try {
      const returns = await storage.getReturns();
      res.json(returns);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch returns' });
    }
  });

  app.post('/api/returns', async (req, res) => {
    try {
      const validatedData = insertReturnSchema.parse(req.body);
      const returnRecord = await storage.createReturn(validatedData);

      // Log activity
      await storage.logActivity({
        type: 'return_created',
        description: `تم تسجيل مرتجع جديد للطلب`,
        employeeName: validatedData.processedBy,
        context: 'online',
        metadata: { returnId: returnRecord.id, orderId: validatedData.orderId }
      });

      res.json(returnRecord);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid return data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create return' });
    }
  });

  app.patch('/api/returns/:id/approve', async (req, res) => {
    try {
      const { processedBy } = req.body;
      const returnRecord = await storage.approveReturn(req.params.id, processedBy);

      // Log activity
      await storage.logActivity({
        type: 'return_approved',
        description: `تم قبول مرتجع وإعادة المنتج للمخزون`,
        employeeName: processedBy,
        context: 'online',
        metadata: { returnId: returnRecord.id }
      });

      res.json(returnRecord);
    } catch (error) {
      res.status(500).json({ error: 'Failed to approve return' });
    }
  });

  // Activities
  app.get('/api/activities', async (req, res) => {
    try {
      const { context, limit } = req.query;
      const activities = await storage.getActivities(
        context as 'boutique' | 'online' | undefined,
        limit ? parseInt(limit as string) : undefined
      );
      res.json(activities);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch activities' });
    }
  });

  // Reports
  app.get('/api/reports/:context/daily/:date', async (req, res) => {
    try {
      const context = req.params.context as 'boutique' | 'online';
      const date = new Date(req.params.date);
      const report = await storage.getDailySales(context, date);
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate daily report' });
    }
  });

  app.get('/api/reports/:context/weekly/:date', async (req, res) => {
    try {
      const context = req.params.context as 'boutique' | 'online';
      const weekStart = new Date(req.params.date);
      const report = await storage.getWeeklySales(context, weekStart);
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate weekly report' });
    }
  });

  app.get('/api/reports/:context/monthly/:date', async (req, res) => {
    try {
      const context = req.params.context as 'boutique' | 'online';
      const monthStart = new Date(req.params.date);
      const report = await storage.getMonthlySales(context, monthStart);
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate monthly report' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
