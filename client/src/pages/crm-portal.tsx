import { useState } from "react";
import { SidebarLayout } from "@/components/layout";
import { useCustomers, useTickets, useActions, useTriggerAction, useStats } from "@/hooks/use-crm";
import { Button } from "@/components/ui/button";
import { Users, Ticket, Activity, Plus, ShieldAlert, KeyRound, RefreshCcw, RefreshCw, Loader2, X, CheckCircle, AlertCircle } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const ACTION_CONFIG: Record<string, { label: string; icon: any; color: string; hex: string }> = {
  refund: { label: "Issue Refund", icon: RefreshCcw, color: "rgba(34,197,94,0.85)", hex: "#22C55E" },
  password_reset: { label: "Password Reset", icon: KeyRound, color: "rgba(0,240,255,0.85)", hex: "#00F0FF" },
  escalate: { label: "Escalate", icon: ShieldAlert, color: "rgba(239,68,68,0.85)", hex: "#EF4444" },
  update_crm: { label: "Update CRM", icon: RefreshCw, color: "rgba(138,43,226,0.85)", hex: "#8A2BE2" },
};

const CHART_COLORS = ["#22C55E", "#00F0FF", "#EF4444", "#8A2BE2"];

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md rounded-2xl p-6 relative overflow-hidden"
        style={{
          background: "rgba(18,18,18,0.98)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)"
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(0,240,255,0.2), rgba(138,43,226,0.2), transparent)" }} />

        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-bold text-lg text-white">Simulate AI Action</h2>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.9)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)"; }}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center py-8 gap-3">
            <div className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)" }}>
              <CheckCircle className="w-7 h-7" style={{ color: "#22C55E" }} />
            </div>
            <p className="font-semibold text-sm" style={{ color: "#22C55E" }}>Action executed successfully</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              {
                label: "Ticket ID",
                content: (
                  <input
                    type="number"
                    required
                    data-testid="input-ticket-id"
                    className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-all duration-200"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(0,240,255,0.25)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
                    value={ticketId}
                    onChange={(e) => setTicketId(e.target.value)}
                    placeholder="e.g. 1"
                  />
                )
              },
              {
                label: "Action Type",
                content: (
                  <select
                    data-testid="select-action-type"
                    className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-all duration-200 appearance-none"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(0,240,255,0.25)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value)}
                  >
                    {Object.entries(ACTION_CONFIG).map(([value, c]) => (
                      <option key={value} value={value} style={{ background: "#111" }}>{c.label}</option>
                    ))}
                  </select>
                )
              }
            ].map((field) => (
              <div key={field.label}>
                <label className="block text-[10px] font-mono uppercase tracking-[0.15em] mb-1.5"
                  style={{ color: "rgba(255,255,255,0.35)" }}>{field.label}</label>
                {field.content}
              </div>
            ))}

            <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{
                background: `rgba(${cfg.hex === "#22C55E" ? "34,197,94" : cfg.hex === "#00F0FF" ? "0,240,255" : cfg.hex === "#EF4444" ? "239,68,68" : "138,43,226"},0.06)`,
                border: `1px solid ${cfg.hex}25`
              }}>
              <Icon className="w-4 h-4 shrink-0" style={{ color: cfg.color }} />
              <span className="text-sm" style={{ color: cfg.color }}>Selected: {cfg.label}</span>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-[0.15em] mb-1.5"
                style={{ color: "rgba(255,255,255,0.35)" }}>Details / Notes</label>
              <textarea
                required
                data-testid="input-action-details"
                className="w-full rounded-xl px-4 py-3 text-sm text-white h-24 resize-none focus:outline-none transition-all duration-200"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(0,240,255,0.25)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Reason or context for this action..."
              />
            </div>

            <div className="flex gap-3 justify-end pt-1">
              <Button type="button" variant="ghost" size="sm" onClick={onClose}
                className="text-white/50 hover:text-white/80">Cancel</Button>
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

const STAT_CONFIG = [
  { key: "customers", label: "Total Customers", icon: Users, accentRgb: "0,240,255", hex: "#00F0FF" },
  { key: "openTickets", label: "Open Tickets", icon: Ticket, accentRgb: "234,179,8", hex: "#EAB308" },
  { key: "escalated", label: "Escalated", icon: ShieldAlert, accentRgb: "239,68,68", hex: "#EF4444" },
  { key: "resolved", label: "Resolved", icon: CheckCircle, accentRgb: "34,197,94", hex: "#22C55E" },
  { key: "actions", label: "AI Actions", icon: Activity, accentRgb: "138,43,226", hex: "#8A2BE2" },
];

export default function CrmPortal() {
  const { data: customers } = useCustomers();
  const { data: tickets } = useTickets();
  const { data: actions } = useActions();
  const { data: stats } = useStats();
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

  const recentActions = [...(actions || [])].reverse().slice(0, 10);

  const getStatValue = (key: string) => {
    if (!stats) return 0;
    if (key === "customers") return stats.customers ?? customers?.length ?? 0;
    if (key === "openTickets") return stats.openTickets ?? 0;
    if (key === "escalated") return stats.escalated ?? 0;
    if (key === "resolved") return stats.resolved ?? 0;
    if (key === "actions") return stats.actions ?? actions?.length ?? 0;
    return 0;
  };

  return (
    <SidebarLayout>
      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-3xl text-white leading-tight">CRM Portal</h1>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
              Autonomous agent activity and customer management
            </p>
          </div>
          <motion.button
            onClick={() => setIsDialogOpen(true)}
            data-testid="button-trigger-action"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
            style={{
              background: "linear-gradient(135deg, rgba(0,240,255,0.12), rgba(138,43,226,0.12))",
              border: "1px solid rgba(0,240,255,0.2)",
              color: "rgba(0,240,255,0.9)",
              boxShadow: "0 0 20px rgba(0,240,255,0.06)"
            }}
          >
            <Plus className="w-4 h-4" />
            Trigger Mock Action
          </motion.button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {STAT_CONFIG.map((stat, i) => (
            <motion.div
              key={stat.key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className="relative rounded-2xl p-5 overflow-hidden card-hover"
              style={{
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div className="absolute top-0 left-0 right-0 h-px rounded-t-2xl"
                style={{ background: `linear-gradient(90deg, transparent, ${stat.hex}40, transparent)` }} />
              <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none"
                style={{ background: `radial-gradient(ellipse at top right, rgba(${stat.accentRgb},0.08), transparent 70%)` }} />
              <p className="text-[9px] font-mono uppercase tracking-[0.15em] mb-3"
                style={{ color: "rgba(255,255,255,0.3)" }}>{stat.label}</p>
              <h3 className="text-3xl font-display font-bold" style={{ color: stat.hex }}>
                {getStatValue(stat.key)}
              </h3>
              <stat.icon className="absolute bottom-4 right-4 w-7 h-7 opacity-[0.06]"
                style={{ color: stat.hex }} />
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 rounded-2xl overflow-hidden flex flex-col"
            style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="px-5 py-4 flex items-center justify-between"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)" }}>
              <h3 className="font-semibold text-sm text-white">Recent Agent Actions</h3>
              <span className="text-[10px] px-2.5 py-1 rounded-lg font-mono"
                style={{
                  background: "rgba(0,240,255,0.06)",
                  color: "rgba(0,240,255,0.7)",
                  border: "1px solid rgba(0,240,255,0.15)"
                }}>
                Live Feed
              </span>
            </div>
            <div className="overflow-x-auto flex-1 scrollbar-hide">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}>
                    {["Time", "Ticket", "Action", "Details"].map((h) => (
                      <th key={h} className="px-5 py-3 text-[9px] font-mono uppercase tracking-[0.15em]"
                        style={{ color: "rgba(255,255,255,0.25)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {recentActions.map((action) => {
                      const cfg = ACTION_CONFIG[action.actionType];
                      const Icon = cfg?.icon || Activity;
                      return (
                        <motion.tr
                          key={action.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2 }}
                          data-testid={`row-action-${action.id}`}
                          style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                          className="transition-colors duration-100"
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                        >
                          <td className="px-5 py-3.5 whitespace-nowrap text-[11px] font-mono"
                            style={{ color: "rgba(255,255,255,0.3)" }}>
                            {action.createdAt ? formatDistanceToNow(new Date(action.createdAt), { addSuffix: true }) : "—"}
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span className="font-mono text-[11px] px-2 py-1 rounded-lg"
                              style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.55)" }}>
                              #{action.ticketId ?? "N/A"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            {cfg ? (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium"
                                style={{
                                  background: `rgba(${cfg.hex === "#22C55E" ? "34,197,94" : cfg.hex === "#00F0FF" ? "0,240,255" : cfg.hex === "#EF4444" ? "239,68,68" : "138,43,226"},0.06)`,
                                  borderColor: `${cfg.hex}20`,
                                  color: cfg.color
                                }}>
                                <Icon className="w-3 h-3" />
                                {cfg.label}
                              </div>
                            ) : (
                              <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>{action.actionType}</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-[11px] truncate max-w-[180px]"
                            style={{ color: "rgba(255,255,255,0.35)" }} title={action.details}>
                            {action.details}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                  {(!actions || actions.length === 0) && (
                    <tr>
                      <td colSpan={4} className="px-5 py-14 text-center">
                        <Activity className="w-8 h-8 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.1)" }} />
                        <p className="text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>
                          No actions yet. Talk to the AI agent or trigger a mock action.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl p-5 flex flex-col"
            style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <h3 className="font-semibold text-sm text-white mb-4">Action Breakdown</h3>
            <div className="flex-1 min-h-[220px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="45%" innerRadius={52} outerRadius={72}
                      paddingAngle={3} dataKey="value" stroke="none">
                      {chartData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} fillOpacity={0.85} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(14,14,14,0.98)",
                        borderColor: "rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                        fontSize: "12px",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.5)"
                      }}
                      itemStyle={{ color: "rgba(255,255,255,0.8)" }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={7}
                      wrapperStyle={{ fontSize: "11px", color: "rgba(255,255,255,0.45)" }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <AlertCircle className="w-8 h-8" style={{ color: "rgba(255,255,255,0.1)" }} />
                  <span className="text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>No data yet</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="px-5 py-4 flex items-center gap-2.5"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)" }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(0,240,255,0.08)", border: "1px solid rgba(0,240,255,0.15)" }}>
              <Users className="w-3.5 h-3.5" style={{ color: "rgba(0,240,255,0.8)" }} />
            </div>
            <h3 className="font-semibold text-sm text-white">Registered Customers</h3>
            <span className="ml-2 text-[10px] px-2 py-0.5 rounded-lg font-mono"
              style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.35)" }}>
              {customers?.length ?? 0} total
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
            {customers?.map((customer) => {
              const customerTickets = tickets?.filter((t) => t.customerId === customer.id) || [];
              return (
                <motion.div
                  key={customer.id}
                  data-testid={`card-customer-${customer.id}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl card-hover cursor-default"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)"
                  }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm"
                      style={{
                        background: "linear-gradient(135deg, rgba(0,240,255,0.1), rgba(138,43,226,0.1))",
                        border: "1px solid rgba(0,240,255,0.15)",
                        color: "rgba(0,240,255,0.8)"
                      }}>
                      {customer.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-white truncate">{customer.name}</div>
                      <div className="text-[11px] truncate" style={{ color: "rgba(255,255,255,0.35)" }}>{customer.email}</div>
                    </div>
                  </div>
                  {customer.phone && (
                    <div className="text-[10px] font-mono mb-2" style={{ color: "rgba(255,255,255,0.25)" }}>{customer.phone}</div>
                  )}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {customerTickets.map((t) => (
                      <span
                        key={t.id}
                        className="text-[9px] px-2 py-0.5 rounded-full border font-medium"
                        style={
                          t.status === "open"
                            ? { background: "rgba(0,240,255,0.06)", color: "rgba(0,240,255,0.7)", borderColor: "rgba(0,240,255,0.15)" }
                            : t.status === "resolved"
                            ? { background: "rgba(34,197,94,0.06)", color: "rgba(34,197,94,0.7)", borderColor: "rgba(34,197,94,0.15)" }
                            : { background: "rgba(239,68,68,0.06)", color: "rgba(239,68,68,0.7)", borderColor: "rgba(239,68,68,0.15)" }
                        }
                      >
                        #{t.id} {t.status}
                      </span>
                    ))}
                    {customerTickets.length === 0 && (
                      <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.2)" }}>No open tickets</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isDialogOpen && <ActionDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} />}
      </AnimatePresence>
    </SidebarLayout>
  );
}
