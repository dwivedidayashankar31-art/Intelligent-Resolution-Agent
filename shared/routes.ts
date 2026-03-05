import { z } from "zod";
import { insertCustomerSchema, insertTicketSchema, insertAgentActionSchema, customers, tickets, agentActions } from "./schema";

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
};

export const api = {
  customers: {
    list: {
      method: "GET" as const,
      path: "/api/customers" as const,
      responses: {
        200: z.array(z.custom<typeof customers.$inferSelect>()),
      },
    },
    get: {
      method: "GET" as const,
      path: "/api/customers/:id" as const,
      responses: {
        200: z.custom<typeof customers.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  tickets: {
    list: {
      method: "GET" as const,
      path: "/api/tickets" as const,
      responses: {
        200: z.array(z.custom<typeof tickets.$inferSelect>()),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/tickets" as const,
      input: insertTicketSchema,
      responses: {
        201: z.custom<typeof tickets.$inferSelect>(),
      },
    },
  },
  actions: {
    list: {
      method: "GET" as const,
      path: "/api/actions" as const,
      responses: {
        200: z.array(z.custom<typeof agentActions.$inferSelect>()),
      },
    },
    trigger: {
      method: "POST" as const,
      path: "/api/actions" as const,
      input: insertAgentActionSchema,
      responses: {
        201: z.custom<typeof agentActions.$inferSelect>(),
      },
    }
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
