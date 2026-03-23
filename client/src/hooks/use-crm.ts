import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { parseWithLogging } from "../lib/utils";

export function useCustomers() {
  return useQuery({
    queryKey: [api.customers.list.path],
    queryFn: async () => {
      const res = await fetch(api.customers.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch customers");
      const data = await res.json();
      return parseWithLogging(api.customers.list.responses[200], data, "customers.list");
    },
  });
}

export function useTickets() {
  return useQuery({
    queryKey: [api.tickets.list.path],
    queryFn: async () => {
      const res = await fetch(api.tickets.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tickets");
      const data = await res.json();
      return parseWithLogging(api.tickets.list.responses[200], data, "tickets.list");
    },
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: any) => {
      const validated = api.tickets.create.input.parse(input);
      const res = await fetch(api.tickets.create.path, {
        method: api.tickets.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create ticket");
      const data = await res.json();
      return parseWithLogging(api.tickets.create.responses[201], data, "tickets.create");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.tickets.list.path] }),
  });
}

export function useActions() {
  return useQuery({
    queryKey: [api.actions.list.path],
    queryFn: async () => {
      const res = await fetch(api.actions.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch actions");
      const data = await res.json();
      return parseWithLogging(api.actions.list.responses[200], data, "actions.list");
    },
    refetchInterval: 5000,
  });
}

export function useTriggerAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: any) => {
      const validated = api.actions.trigger.input.parse(input);
      const res = await fetch(api.actions.trigger.path, {
        method: api.actions.trigger.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to trigger action");
      const data = await res.json();
      return parseWithLogging(api.actions.trigger.responses[201], data, "actions.trigger");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.actions.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.tickets.list.path] });
    },
  });
}

export function useStats() {
  return useQuery({
    queryKey: ["/api/stats"],
    queryFn: async () => {
      const res = await fetch("/api/stats", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json() as Promise<{
        customers: number;
        tickets: number;
        openTickets: number;
        escalated: number;
        resolved: number;
        actions: number;
      }>;
    },
    refetchInterval: 8000,
  });
}
