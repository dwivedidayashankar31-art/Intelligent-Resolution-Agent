import { db } from "./db";
import { customers, tickets, agentActions, type InsertCustomer, type InsertTicket, type InsertAgentAction } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  getCustomers(): Promise<typeof customers.$inferSelect[]>;
  getCustomer(id: number): Promise<typeof customers.$inferSelect | undefined>;
  getTickets(): Promise<typeof tickets.$inferSelect[]>;
  createTicket(ticket: InsertTicket): Promise<typeof tickets.$inferSelect>;
  getActions(): Promise<typeof agentActions.$inferSelect[]>;
  createAction(action: InsertAgentAction): Promise<typeof agentActions.$inferSelect>;
}

export class DatabaseStorage implements IStorage {
  async getCustomers() {
    return await db.select().from(customers);
  }
  async getCustomer(id: number) {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }
  async getTickets() {
    return await db.select().from(tickets);
  }
  async createTicket(ticket: InsertTicket) {
    const [newTicket] = await db.insert(tickets).values(ticket).returning();
    return newTicket;
  }
  async getActions() {
    return await db.select().from(agentActions);
  }
  async createAction(action: InsertAgentAction) {
    const [newAction] = await db.insert(agentActions).values(action).returning();
    return newAction;
  }
}

export const storage = new DatabaseStorage();
