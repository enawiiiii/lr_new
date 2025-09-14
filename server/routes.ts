import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertEmployeeSchema, insertProductSchema, insertSaleSchema, insertOrderSchema, insertReturnExchangeSchema } from "@shared/schema";
import multer from "multer";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Employee routes
  app.get("/api/employees", async (req, res) => {
    try {
      const employees = await storage.getEmployees();
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.post("/api/employees", async (req, res) => {
    try {
      const employeeData = insertEmployeeSchema.parse(req.body);
      const employee = await storage.createEmployee(employeeData);
      res.json(employee);
    } catch (error) {
      res.status(400).json({ message: "Invalid employee data" });
    }
  });

  app.get("/api/employees/by-name/:name", async (req, res) => {
    try {
      const employee = await storage.getEmployeeByName(req.params.name);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      res.json(employee);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employee" });
    }
  });

  // Product routes
  app.get("/api/products", async (req, res) => {
    try {
      const { search, limit } = req.query;
      const products = await storage.getProducts(
        search as string,
        limit ? parseInt(limit as string) : undefined
      );
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProductWithDetails(parseInt(req.params.id));
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post("/api/products", upload.single("image"), async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      
      // Handle image upload - in a real app, save to S3 or similar
      if (req.file) {
        productData.mainImageUrl = `/uploads/${Date.now()}-${req.file.originalname}`;
      }
      
      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error) {
      res.status(400).json({ message: "Invalid product data" });
    }
  });

  app.put("/api/products/:id", upload.single("image"), async (req, res) => {
    try {
      const productData = req.body;
      
      if (req.file) {
        productData.mainImageUrl = `/uploads/${Date.now()}-${req.file.originalname}`;
      }
      
      const product = await storage.updateProduct(parseInt(req.params.id), productData);
      res.json(product);
    } catch (error) {
      res.status(400).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      await storage.deleteProduct(parseInt(req.params.id));
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: "Failed to delete product" });
    }
  });

  // Product colors and sizes
  app.post("/api/products/:id/colors", async (req, res) => {
    try {
      const colorData = {
        productId: parseInt(req.params.id),
        ...req.body
      };
      const color = await storage.createProductColor(colorData);
      res.json(color);
    } catch (error) {
      res.status(400).json({ message: "Failed to create color" });
    }
  });

  app.post("/api/colors/:id/sizes", async (req, res) => {
    try {
      const sizeData = {
        colorId: parseInt(req.params.id),
        ...req.body
      };
      const size = await storage.createProductSize(sizeData);
      res.json(size);
    } catch (error) {
      res.status(400).json({ message: "Failed to create size" });
    }
  });

  app.put("/api/sizes/:id", async (req, res) => {
    try {
      const { quantity } = req.body;
      const size = await storage.updateProductSize(parseInt(req.params.id), quantity);
      res.json(size);
    } catch (error) {
      res.status(400).json({ message: "Failed to update size" });
    }
  });

  // Sales routes
  app.get("/api/sales", async (req, res) => {
    try {
      const { storeType, limit } = req.query;
      const sales = await storage.getSales(
        storeType as string,
        limit ? parseInt(limit as string) : undefined
      );
      res.json(sales);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sales" });
    }
  });

  app.post("/api/sales", async (req, res) => {
    try {
      const { items, ...saleData } = req.body;
      const sale = await storage.createSale(saleData, items);
      res.json(sale);
    } catch (error) {
      res.status(400).json({ message: "Failed to create sale" });
    }
  });

  // Orders routes
  app.get("/api/orders", async (req, res) => {
    try {
      const { limit } = req.query;
      const orders = await storage.getOrders(limit ? parseInt(limit as string) : undefined);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const order = await storage.getOrder(parseInt(req.params.id));
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const { items, ...orderData } = req.body;
      // Generate order number
      orderData.orderNumber = `ORD-${Date.now()}`;
      const order = await storage.createOrder(orderData, items);
      res.json(order);
    } catch (error) {
      res.status(400).json({ message: "Failed to create order" });
    }
  });

  app.put("/api/orders/:id/status", async (req, res) => {
    try {
      const { status, trackingNumber } = req.body;
      const order = await storage.updateOrderStatus(
        parseInt(req.params.id),
        status,
        trackingNumber
      );
      res.json(order);
    } catch (error) {
      res.status(400).json({ message: "Failed to update order status" });
    }
  });

  // Returns and exchanges
  app.get("/api/returns", async (req, res) => {
    try {
      const { limit } = req.query;
      const returns = await storage.getReturnsExchanges(
        limit ? parseInt(limit as string) : undefined
      );
      res.json(returns);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch returns" });
    }
  });

  app.post("/api/returns", async (req, res) => {
    try {
      const returnData = insertReturnExchangeSchema.parse(req.body);
      const returnExchange = await storage.createReturnExchange(returnData);
      res.json(returnExchange);
    } catch (error) {
      res.status(400).json({ message: "Failed to create return/exchange" });
    }
  });

  // Analytics and reports
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/reports/top-products", async (req, res) => {
    try {
      const { limit } = req.query;
      const topProducts = await storage.getTopSellingProducts(
        limit ? parseInt(limit as string) : undefined
      );
      res.json(topProducts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch top products" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
