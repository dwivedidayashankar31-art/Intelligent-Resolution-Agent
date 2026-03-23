import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { registerAudioRoutes } from "./replit_integrations/audio";
import { db } from "./db";
import { customers, tickets } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // Register the audio chat routes from the integration
  registerAudioRoutes(app);

  app.get(api.customers.list.path, async (req, res) => {
    try {
      const data = await storage.getCustomers();
      res.json(data);
    } catch (e) {
      res.status(500).json({ message: "Failed to list customers" });
    }
  });

  app.get(api.customers.get.path, async (req, res) => {
    try {
      const data = await storage.getCustomer(Number(req.params.id));
      if (!data) return res.status(404).json({ message: "Not found" });
      res.json(data);
    } catch (e) {
      res.status(500).json({ message: "Failed to get customer" });
    }
  });

  app.get(api.tickets.list.path, async (req, res) => {
    try {
      const data = await storage.getTickets();
      res.json(data);
    } catch (e) {
      res.status(500).json({ message: "Failed to list tickets" });
    }
  });

  app.post(api.tickets.create.path, async (req, res) => {
    try {
      const input = api.tickets.create.input.parse(req.body);
      const data = await storage.createTicket(input);
      res.status(201).json(data);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Failed to create ticket" });
    }
  });

  app.get(api.actions.list.path, async (req, res) => {
    try {
      const data = await storage.getActions();
      res.json(data);
    } catch (e) {
      res.status(500).json({ message: "Failed to list actions" });
    }
  });

  app.post(api.actions.trigger.path, async (req, res) => {
    try {
      const input = api.actions.trigger.input.parse(req.body);
      const data = await storage.createAction(input);
      res.status(201).json(data);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Failed to create action" });
    }
  });

  // Stats endpoint
  app.get("/api/stats", async (req, res) => {
    try {
      const [allCustomers, allTickets, allActions] = await Promise.all([
        storage.getCustomers(),
        storage.getTickets(),
        storage.getActions(),
      ]);
      const openTickets = allTickets.filter((t) => t.status === "open").length;
      const escalated = allTickets.filter((t) => t.status === "escalated").length;
      const resolved = allTickets.filter((t) => t.status === "resolved").length;
      res.json({
        customers: allCustomers.length,
        tickets: allTickets.length,
        openTickets,
        escalated,
        resolved,
        actions: allActions.length,
      });
    } catch (e) {
      res.status(500).json({ message: "Failed to get stats" });
    }
  });

  // Seed DB script on start
  seedDb();

  return httpServer;
}

async function seedDb() {
  try {
    const existing = await storage.getCustomers();
    if (existing.length === 0) {
      const [c1] = await db.insert(customers).values({ name: "Ravi Kumar", email: "ravi@example.com", phone: "+1 (555) 204-3821" }).returning();
      const [c2] = await db.insert(customers).values({ name: "Aisha Sharma", email: "aisha@example.com", phone: "+1 (555) 876-5432" }).returning();
      const [c3] = await db.insert(customers).values({ name: "Marcus Chen", email: "marcus.chen@example.com", phone: "+1 (555) 301-9147" }).returning();
      const [c4] = await db.insert(customers).values({ name: "Priya Nair", email: "priya.nair@example.com", phone: "+1 (555) 448-2260" }).returning();
      const [c5] = await db.insert(customers).values({ name: "Jordan Webb", email: "jordan.webb@example.com", phone: "+1 (555) 513-7705" }).returning();
      const [c6] = await db.insert(customers).values({ name: "Sofia Rosetti", email: "sofia.r@example.com", phone: "+1 (555) 622-0938" }).returning();

      await storage.createTicket({ customerId: c1.id, title: "Order #9923 delayed by 2 weeks", status: "open" });
      await storage.createTicket({ customerId: c1.id, title: "Wrong item shipped in order #9901", status: "resolved" });
      await storage.createTicket({ customerId: c2.id, title: "Refund of $149 not received after 10 days", status: "escalated" });
      await storage.createTicket({ customerId: c3.id, title: "Cannot log in — account locked", status: "open" });
      await storage.createTicket({ customerId: c3.id, title: "Billing charged twice for subscription", status: "open" });
      await storage.createTicket({ customerId: c4.id, title: "Product arrived damaged", status: "escalated" });
      await storage.createTicket({ customerId: c5.id, title: "Discount code not applied at checkout", status: "open" });
      await storage.createTicket({ customerId: c6.id, title: "Delivery address change request", status: "resolved" });
    }
  } catch (e) {
    console.error("Failed to seed database", e);
  }
}
