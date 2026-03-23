import { useState } from "react";
import { SidebarLayout } from "@/components/layout";
import { useCustomers, useTickets, useActions, useTriggerAction, useStats } from "@/hooks/use-crm";
import { Users, Activity, Plus, ShieldAlert, KeyRound, RefreshCcw, RefreshCw, Loader2, X, CheckCircle, AlertCircle, Ticket, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

const ACTION_CONFIG: Record<string, { label: string; icon: any; badgeClass: string; dotColor: string }> = {
  refund: { label: "Refund", icon: RefreshCcw, badgeClass: "badge-green", dotColor: "#4ADE80" },
  password_reset: { label: "Password Reset", icon: KeyRound, badgeClass: "badge-blue", dotColor: "#60A5FA" },
  escalate: { label: "Escalate", icon: ShieldAlert, badgeClass: "badge-red", dotColor: "#F87171" },
  update_crm: { label: "CRM Update", icon: RefreshCw, badgeClass: "badge-purple", dotColor: "#A78BFA" },
};

const CHART_COLORS = ["#4ADE80", "#60A5FA", "#F87171", "#A78BFA"];

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
    } catch (err) { console.error(err); }
  };

  if (!isOpen) return null;
  const cfg = ACTION_CONFIG[actionType] || ACTION_CONFIG.refund;
  const Icon = cfg.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background: "hsl(240, 8%, 6.5%)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)"
        }}
      >
        {/* Header top-line gradient */}
        <div className="h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.4), rgba(139,92,246,0.4), transparent)" }} />

        <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <h2 className="font-bold text-[15px] text-white tracking-tight">Simulate AI Action</h2>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}
            onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.85)"}
            onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.4)"}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-6">
          {success ? (
            <div className="flex flex-col items-center py-8 gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
                <CheckCircle className="w-6 h-6" style={{ color: "#4ADE80" }} />
              </div>
              <p className="font-semibold text-[13px]" style={{ color: "#4ADE80" }}>Action executed successfully</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="section-label block mb-1.5">Ticket ID</label>
                <input type="number" required data-testid="input-ticket-id"
                  className="input-field"
                  value={ticketId} onChange={(e) => setTicketId(e.target.value)} placeholder="e.g. 1" />
              </div>
              <div>
                <label className="section-label block mb-1.5">Action Type</label>
                <select data-testid="select-action-type"
                  className="input-field appearance-none"
                  value={actionType} onChange={(e) => setActionType(e.target.value)}
                  style={{ backgroundImage: "none" }}>
                  {Object.entries(ACTION_CONFIG).map(([v, c]) => (
                    <option key={v} value={v} style={{ background: "#111" }}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl"
                style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: cfg.dotColor }} />
                <span className={`badge ${cfg.badgeClass}`}>{cfg.label}</span>
                <span className="text-[11px] ml-auto" style={{ color: "rgba(255,255,255,0.3)" }}>Selected action</span>
              </div>
              <div>
                <label className="section-label block mb-1.5">Details / Notes</label>
                <textarea required data-testid="input-action-details"
                  className="input-field resize-none"
                  style={{ height: 88 }}
                  value={details} onChange={(e) => setDetails(e.target.value)}
                  placeholder="Reason or context for this action..." />
              </div>
              <div className="flex gap-2.5 justify-end pt-1">
                <button type="button" onClick={onClose} className="btn-ghost text-[12px]" style={{ padding: "7px 14px" }}>Cancel</button>
                <Button type="submit" size="sm" isLoading={trigger.isPending} data-testid="button-execute-action">
                  Execute Action
                </Button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}

const STATS = [
  { key: "customers", label: "Total Customers", icon: Users, color: "#60A5FA", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.15)" },
  { key: "openTickets", label: "Open Tickets", icon: Ticket, color: "#FBBF24", bg: "rgba(234,179,8,0.06)", border: "rgba(234,179,8,0.14)" },
  { key: "escalated", label: "Escalated", icon: ShieldAlert, color: "#F87171", bg: "rgba(239,68,68,0.06)", border: "rgba(239,68,68,0.14)" },
  { key: "resolved", label: "Resolved", icon: CheckCircle, color: "#4ADE80", bg: "rgba(34,197,94,0.06)", border: "rgba(34,197,94,0.14)" },
  { key: "actions", label: "AI Actions", icon: Activity, color: "#A78BFA", bg: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.15)" },
];

export default function CrmPortal() {
  const { data: customers } = useCustomers();
  const { data: tickets } = useTickets();
  const { data: actions } = useActions();
  const { data: stats } = useStats();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const actionCounts = actions?.reduce((acc: Record<string, number>, a) => {
    acc[a.actionType] = (acc[a.actionType] || 0) + 1; return acc;
  }, {});

  const chartData = actionCounts
    ? Object.entries(actionCounts).map(([name, value]) => ({ name: ACTION_CONFIG[name]?.label || name, value }))
    : [];

  const recentActions = [...(actions || [])].reverse().slice(0, 12);

  const getVal = (key: string) => {
    if (!stats) return 0;
    const map: Record<string, number> = {
      customers: stats.customers ?? customers?.length ?? 0,
      openTickets: stats.openTickets ?? 0,
      escalated: stats.escalated ?? 0,
      resolved: stats.resolved ?? 0,
      actions: stats.actions ?? actions?.length ?? 0,
    };
    return map[key] ?? 0;
  };

  return (
    <SidebarLayout>
      <div className="px-7 pt-6 pb-10 max-w-[1300px] mx-auto space-y-6">

        {/* Page header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-bold text-white mb-1" style={{ fontSize: 22, letterSpacing: "-0.03em" }}>CRM Portal</h1>
            <p className="text-[13px]" style={{ color: "rgba(255,255,255,0.4)" }}>Agent activity, customer management & analytics</p>
          </div>
          <motion.button
            onClick={() => setIsDialogOpen(true)}
            data-testid="button-trigger-action"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            className="btn-primary"
          >
            <Plus className="w-3.5 h-3.5" />
            Trigger Mock Action
          </motion.button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-5 gap-3">
          {STATS.map((s, i) => (
            <motion.div
              key={s.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-xl p-5 relative overflow-hidden"
              style={{ background: s.bg, border: `1px solid ${s.border}` }}
            >
              <div className="flex items-start justify-between mb-3">
                <p className="section-label">{s.label}</p>
                <s.icon className="w-4 h-4 opacity-60" style={{ color: s.color }} />
              </div>
              <div className="stat-value" style={{ color: s.color }}>{getVal(s.key)}</div>
            </motion.div>
          ))}
        </div>

        {/* Middle row: Table + Chart */}
        <div className="grid grid-cols-3 gap-5">

          {/* Actions Table */}
          <div className="col-span-2 rounded-xl overflow-hidden"
            style={{ background: "hsl(240, 6%, 7%)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center justify-between px-5 py-3.5"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.065)" }}>
              <div className="flex items-center gap-2.5">
                <h3 className="font-semibold text-[13px] text-white">Agent Actions</h3>
                <span className="badge badge-blue">
                  <span className="status-dot status-online w-1.5 h-1.5 animate-pulse-dot" />
                  Live
                </span>
              </div>
              <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                {recentActions.length} recent
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.055)" }}>
                    {["Time", "Ticket", "Action", "Details"].map((h) => (
                      <th key={h} className="px-5 py-3 text-left section-label font-medium"
                        style={{ background: "rgba(255,255,255,0.015)" }}>{h}</th>
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
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          data-testid={`row-action-${action.id}`}
                          className="transition-colors duration-100 cursor-default"
                          style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                          onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.018)"}
                          onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "transparent"}
                        >
                          <td className="px-5 py-3.5 text-[11px] font-mono whitespace-nowrap"
                            style={{ color: "rgba(255,255,255,0.3)" }}>
                            {action.createdAt ? formatDistanceToNow(new Date(action.createdAt), { addSuffix: true }) : "—"}
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span className="badge badge-neutral font-mono text-[10px]">#{action.ticketId ?? "N/A"}</span>
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            {cfg ? (
                              <span className={`badge ${cfg.badgeClass}`}>
                                <Icon className="w-3 h-3" />
                                {cfg.label}
                              </span>
                            ) : <span className="text-[11px] text-white/40">{action.actionType}</span>}
                          </td>
                          <td className="px-5 py-3.5 text-[11px] truncate max-w-[200px]"
                            style={{ color: "rgba(255,255,255,0.35)" }} title={action.details}>
                            {action.details}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                  {(!actions || actions.length === 0) && (
                    <tr>
                      <td colSpan={4} className="px-5 py-12 text-center">
                        <Activity className="w-7 h-7 mx-auto mb-2.5" style={{ color: "rgba(255,255,255,0.1)" }} />
                        <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                          No actions yet. Talk to the AI agent or trigger a mock action.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Chart */}
          <div className="rounded-xl p-5 flex flex-col"
            style={{ background: "hsl(240, 6%, 7%)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="mb-4">
              <h3 className="font-semibold text-[13px] text-white">Action Breakdown</h3>
              <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>Distribution by type</p>
            </div>
            <div className="flex-1 min-h-[200px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="42%" innerRadius={48} outerRadius={68}
                      paddingAngle={3} dataKey="value" stroke="none">
                      {chartData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} fillOpacity={0.85} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{
                      backgroundColor: "hsl(240,8%,8%)", borderColor: "rgba(255,255,255,0.1)",
                      borderRadius: "10px", fontSize: "11px", boxShadow: "0 8px 24px rgba(0,0,0,0.5)"
                    }} itemStyle={{ color: "rgba(255,255,255,0.8)" }} />
                    <Legend verticalAlign="bottom" height={32} iconType="circle" iconSize={7}
                      wrapperStyle={{ fontSize: "10px", color: "rgba(255,255,255,0.4)" }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <AlertCircle className="w-7 h-7" style={{ color: "rgba(255,255,255,0.1)" }} />
                  <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.25)" }}>No data yet</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Customers */}
        <div className="rounded-xl overflow-hidden"
          style={{ background: "hsl(240, 6%, 7%)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center justify-between px-5 py-3.5"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.065)" }}>
            <div className="flex items-center gap-2.5">
              <h3 className="font-semibold text-[13px] text-white">Customers</h3>
              <span className="badge badge-neutral font-mono">{customers?.length ?? 0} total</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-px" style={{ background: "rgba(255,255,255,0.04)" }}>
            {customers?.map((customer) => {
              const customerTickets = tickets?.filter((t) => t.customerId === customer.id) || [];
              const open = customerTickets.filter(t => t.status === "open").length;
              const escalated = customerTickets.filter(t => t.status === "escalated").length;

              return (
                <motion.div
                  key={customer.id}
                  data-testid={`card-customer-${customer.id}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-5 cursor-default transition-colors duration-150"
                  style={{ background: "hsl(240, 6%, 7%)" }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "hsl(240, 6%, 8.5%)"}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "hsl(240, 6%, 7%)"}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-[13px] shrink-0"
                      style={{
                        background: "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))",
                        border: "1px solid rgba(59,130,246,0.2)",
                        color: "#60A5FA"
                      }}>
                      {customer.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-[13px] text-white truncate">{customer.name}</div>
                      <div className="text-[11px] truncate mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{customer.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {open > 0 && (
                      <span className="badge badge-yellow">{open} open</span>
                    )}
                    {escalated > 0 && (
                      <span className="badge badge-red">{escalated} escalated</span>
                    )}
                    {customerTickets.filter(t => t.status === "resolved").length > 0 && (
                      <span className="badge badge-green">
                        {customerTickets.filter(t => t.status === "resolved").length} resolved
                      </span>
                    )}
                    {customerTickets.length === 0 && (
                      <span className="badge badge-neutral">No tickets</span>
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
