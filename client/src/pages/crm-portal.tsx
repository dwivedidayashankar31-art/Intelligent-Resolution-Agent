import { useState } from "react";
import { SidebarLayout } from "@/components/layout";
import { useCustomers, useTickets, useActions, useTriggerAction } from "@/hooks/use-crm";
import { Button } from "@/components/ui/button";
import { Users, Ticket, Activity, Plus, ShieldAlert, KeyRound, RefreshCcw, RefreshCw, Loader2, X, CheckCircle, AlertCircle } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const ACTION_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  refund: { label: "Issue Refund", icon: RefreshCcw, color: "text-green-400", bg: "bg-green-500/10 border-green-500/30" },
  password_reset: { label: "Password Reset", icon: KeyRound, color: "text-primary", bg: "bg-primary/10 border-primary/30" },
  escalate: { label: "Escalate", icon: ShieldAlert, color: "text-red-400", bg: "bg-red-500/10 border-red-500/30" },
  update_crm: { label: "Update CRM", icon: RefreshCw, color: "text-secondary", bg: "bg-secondary/10 border-secondary/30" },
};

function ActionDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [ticketId, setTicketId] = useState("");
  const [actionType, setActionType] = useState("refund");
  const [details, setDetails] = useState("");
  const [success, setSuccess] = useState(false);
  const trigger = useTriggerAction();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await trigger.mutateAsync({ ticketId: parseInt(ticketId), actionType, details });
      setSuccess(true);
      setTimeout(() => { setSuccess(false); onClose(); setTicketId(""); setDetails(""); }, 1500);
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  const cfg = ACTION_CONFIG[actionType] || ACTION_CONFIG.refund;
  const Icon = cfg.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-display font-bold">Simulate AI Action</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center py-8 gap-3">
            <CheckCircle className="w-12 h-12 text-green-400" />
            <p className="text-green-400 font-semibold">Action executed successfully</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-muted-foreground mb-1.5 uppercase tracking-wider">Ticket ID</label>
              <input
                type="number"
                required
                data-testid="input-ticket-id"
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 text-white text-sm"
                value={ticketId}
                onChange={(e) => setTicketId(e.target.value)}
                placeholder="e.g. 1"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-muted-foreground mb-1.5 uppercase tracking-wider">Action Type</label>
              <select
                data-testid="select-action-type"
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50 text-white text-sm"
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
              >
                {Object.entries(ACTION_CONFIG).map(([value, c]) => (
                  <option key={value} value={value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className={cn("flex items-center gap-3 p-3 rounded-xl border text-sm", cfg.bg)}>
              <Icon className={cn("w-4 h-4 shrink-0", cfg.color)} />
              <span className={cfg.color}>Selected: {cfg.label}</span>
            </div>

            <div>
              <label className="block text-xs font-mono text-muted-foreground mb-1.5 uppercase tracking-wider">Details / Notes</label>
              <textarea
                required
                data-testid="input-action-details"
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50 text-white h-24 resize-none text-sm"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Reason or context for this action..."
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
              <Button type="submit" size="sm" isLoading={trigger.isPending} data-testid="button-execute-action">
                Execute Action
              </Button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}

export default function CrmPortal() {
  const { data: customers } = useCustomers();
  const { data: tickets } = useTickets();
  const { data: actions } = useActions();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const customerMap = customers?.reduce((acc: Record<number, string>, c) => {
    acc[c.id] = c.name;
    return acc;
  }, {});

  const actionCounts = actions?.reduce((acc: Record<string, number>, action) => {
    acc[action.actionType] = (acc[action.actionType] || 0) + 1;
    return acc;
  }, {});

  const chartData = actionCounts
    ? Object.entries(actionCounts).map(([name, value]) => ({
        name: ACTION_CONFIG[name]?.label || name,
        value,
      }))
    : [];

  const COLORS = ["#10B981", "#00F0FF", "#EF4444", "#8A2BE2"];

  const recentActions = [...(actions || [])].reverse().slice(0, 10);

  return (
    <SidebarLayout>
      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">CRM Portal</h1>
            <p className="text-muted-foreground mt-1 text-sm">Autonomous agent activity and customer management system.</p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)} data-testid="button-trigger-action" className="gap-2">
            <Plus className="w-4 h-4" />
            Trigger Mock Action
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Total Customers", value: customers?.length || 0, icon: Users, color: "text-primary", glow: "rgba(0,240,255,0.15)" },
            { label: "Open Tickets", value: tickets?.length || 0, icon: Ticket, color: "text-secondary", glow: "rgba(138,43,226,0.15)" },
            { label: "AI Actions Executed", value: actions?.length || 0, icon: Activity, color: "text-green-400", glow: "rgba(16,185,129,0.15)" },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel p-6 rounded-2xl relative overflow-hidden"
              style={{ boxShadow: `0 0 30px ${stat.glow}` }}
            >
              <stat.icon className={cn("absolute top-4 right-4 w-10 h-10 opacity-10", stat.color)} />
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">{stat.label}</p>
              <h3 className={cn("text-4xl font-display font-bold", stat.color)}>{stat.value}</h3>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Actions Table */}
          <div className="lg:col-span-2 glass-panel rounded-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-white/10 bg-black/20 flex justify-between items-center">
              <h3 className="font-semibold">Recent Agent Actions</h3>
              <span className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary border border-primary/20 font-mono">
                Live Feed
              </span>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-5 py-3 font-mono uppercase tracking-wider">Time</th>
                    <th className="px-5 py-3 font-mono uppercase tracking-wider">Ticket</th>
                    <th className="px-5 py-3 font-mono uppercase tracking-wider">Action</th>
                    <th className="px-5 py-3 font-mono uppercase tracking-wider">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <AnimatePresence>
                    {recentActions.map((action) => {
                      const cfg = ACTION_CONFIG[action.actionType];
                      const Icon = cfg?.icon || Activity;
                      return (
                        <motion.tr
                          key={action.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="hover:bg-white/5 transition-colors"
                          data-testid={`row-action-${action.id}`}
                        >
                          <td className="px-5 py-4 whitespace-nowrap text-muted-foreground text-xs font-mono">
                            {action.createdAt ? formatDistanceToNow(new Date(action.createdAt), { addSuffix: true }) : "—"}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className="font-mono bg-white/10 px-2 py-1 rounded text-xs">
                              #{action.ticketId ?? "N/A"}
                            </span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            {cfg ? (
                              <div className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-lg border text-xs font-medium", cfg.bg)}>
                                <Icon className={cn("w-3 h-3", cfg.color)} />
                                <span className={cfg.color}>{cfg.label}</span>
                              </div>
                            ) : (
                              <span>{action.actionType}</span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-muted-foreground text-xs truncate max-w-[200px]" title={action.details}>
                            {action.details}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                  {(!actions || actions.length === 0) && (
                    <tr>
                      <td colSpan={4} className="px-5 py-12 text-center text-muted-foreground text-sm">
                        <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        No actions yet. Talk to the AI agent or trigger a mock action.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Chart */}
          <div className="glass-panel rounded-2xl p-5 flex flex-col">
            <h3 className="font-semibold mb-4">Action Breakdown</h3>
            <div className="flex-1 min-h-[220px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="45%" innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value" stroke="none">
                      {chartData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "rgba(8,10,18,0.95)", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }} itemStyle={{ color: "#fff" }} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                  <AlertCircle className="w-8 h-8 opacity-30" />
                  <span className="text-sm">No data yet</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Customers */}
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-white/10 bg-black/20 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <h3 className="font-semibold">Registered Customers</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
            {customers?.map((customer) => {
              const customerTickets = tickets?.filter((t) => t.customerId === customer.id) || [];
              return (
                <div key={customer.id} data-testid={`card-customer-${customer.id}`} className="bg-black/30 border border-white/5 p-4 rounded-xl hover:border-white/15 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm">
                      {customer.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{customer.name}</div>
                      <div className="text-xs text-muted-foreground">{customer.email}</div>
                    </div>
                  </div>
                  {customer.phone && (
                    <div className="text-xs text-muted-foreground font-mono mb-2">{customer.phone}</div>
                  )}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {customerTickets.map((t) => (
                      <span
                        key={t.id}
                        className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full border font-medium",
                          t.status === "open" ? "bg-primary/10 text-primary border-primary/30" :
                          t.status === "resolved" ? "bg-green-500/10 text-green-400 border-green-500/30" :
                          "bg-red-500/10 text-red-400 border-red-500/30"
                        )}
                      >
                        #{t.id} {t.status}
                      </span>
                    ))}
                    {customerTickets.length === 0 && (
                      <span className="text-[10px] text-muted-foreground">No open tickets</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <ActionDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} />
    </SidebarLayout>
  );
}
