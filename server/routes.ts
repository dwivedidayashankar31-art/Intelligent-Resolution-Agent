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

  // Seed DB script on start
  seedDb();

  return httpServer;
}

async function seedDb() {
  try {
    const existing = await storage.getCustomers();
    if (existing.length === 0) {
      const [c1] = await db.insert(customers).values({ name: "Ravi Kumar", email: "ravi@example.com", phone: "+91 9876543210" }).returning();
      const [c2] = await db.insert(customers).values({ name: "Aisha Sharma", email: "aisha@example.com", phone: "+91 8765432109" }).returning();

      await storage.createTicket({ customerId: c1.id, title: "Order delayed #9923", status: "open" });
      await storage.createTicket({ customerId: c2.id, title: "Refund not received", status: "escalated" });
    }
  } catch (e) {
    console.error("Failed to seed database", e);
  }
}
