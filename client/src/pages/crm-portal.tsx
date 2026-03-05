import { useState } from "react";
import { SidebarLayout } from "@/components/layout";
import { useCustomers, useTickets, useActions, useTriggerAction } from "@/hooks/use-crm";
import { Button } from "@/components/ui/button";
import { Users, Ticket, Activity, Plus, ShieldAlert, KeyRound, RefreshCcw, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { cn } from "@/lib/utils";

// Mock Action Dialog Component
function ActionDialog({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [ticketId, setTicketId] = useState("");
  const [actionType, setActionType] = useState("refund");
  const [details, setDetails] = useState("");
  const trigger = useTriggerAction();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await trigger.mutateAsync({
        ticketId: parseInt(ticketId),
        actionType,
        details
      });
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl shadow-black">
        <h2 className="text-xl font-display font-bold mb-4 text-primary neon-text">Simulate AI Action</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-muted-foreground mb-1 uppercase">Ticket ID</label>
            <input 
              type="number" 
              required
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 text-white"
              value={ticketId}
              onChange={e => setTicketId(e.target.value)}
              placeholder="e.g. 1"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-muted-foreground mb-1 uppercase">Action Type</label>
            <select 
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 text-white"
              value={actionType}
              onChange={e => setActionType(e.target.value)}
            >
              <option value="refund">Issue Refund</option>
              <option value="password_reset">Password Reset</option>
              <option value="escalate">Escalate to Human</option>
              <option value="update_crm">Update CRM Data</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-mono text-muted-foreground mb-1 uppercase">Details</label>
            <textarea 
              required
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 text-white h-24 resize-none"
              value={details}
              onChange={e => setDetails(e.target.value)}
              placeholder="Reason or logs for action..."
            />
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" isLoading={trigger.isPending}>Execute Action</Button>
          </div>
        </form>
      </div>
    </div>
  );
}


export default function CrmPortal() {
  const { data: customers } = useCustomers();
  const { data: tickets } = useTickets();
  const { data: actions } = useActions();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const actionCounts = actions?.reduce((acc: any, action) => {
    acc[action.actionType] = (acc[action.actionType] || 0) + 1;
    return acc;
  }, {});

  const chartData = actionCounts ? Object.entries(actionCounts).map(([name, value]) => ({ name, value })) : [];
  const COLORS = ['#00F0FF', '#8A2BE2', '#EF4444', '#10B981'];

  const ActionIcon = ({ type }: { type: string }) => {
    switch(type) {
      case 'refund': return <RefreshCcw className="w-4 h-4 text-green-400" />;
      case 'password_reset': return <KeyRound className="w-4 h-4 text-primary" />;
      case 'escalate': return <ShieldAlert className="w-4 h-4 text-red-400" />;
      default: return <RefreshCw className="w-4 h-4 text-secondary" />;
    }
  };

  return (
    <SidebarLayout>
      <div className="max-w-7xl mx-auto space-y-8 pb-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">CRM Portal</h1>
            <p className="text-muted-foreground mt-1">System overview and autonomous agent activity.</p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Trigger Mock Action
          </Button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Users className="w-16 h-16 text-primary" />
            </div>
            <p className="text-sm font-mono text-muted-foreground uppercase tracking-wider mb-2">Total Customers</p>
            <h3 className="text-4xl font-display font-bold text-white">{customers?.length || 0}</h3>
          </div>
          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Ticket className="w-16 h-16 text-secondary" />
            </div>
            <p className="text-sm font-mono text-muted-foreground uppercase tracking-wider mb-2">Active Tickets</p>
            <h3 className="text-4xl font-display font-bold text-white">{tickets?.length || 0}</h3>
          </div>
          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group border-primary/30">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Activity className="w-16 h-16 text-primary" />
            </div>
            <p className="text-sm font-mono text-primary uppercase tracking-wider mb-2">AI Actions Executed</p>
            <h3 className="text-4xl font-display font-bold text-primary neon-text">{actions?.length || 0}</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Recent Actions Table */}
          <div className="lg:col-span-2 glass-panel rounded-2xl flex flex-col overflow-hidden">
            <div className="p-5 border-b border-white/10 bg-black/20 flex justify-between items-center">
              <h3 className="font-semibold text-lg">Recent Agent Actions</h3>
              <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary border border-primary/20">Live Feed</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 font-mono">Time</th>
                    <th className="px-6 py-4 font-mono">Ticket</th>
                    <th className="px-6 py-4 font-mono">Action</th>
                    <th className="px-6 py-4 font-mono">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {actions?.slice(0, 8).map((action) => (
                    <tr key={action.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                        {action.createdAt ? format(new Date(action.createdAt), 'HH:mm:ss') : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono bg-white/10 px-2 py-1 rounded text-xs">#{action.ticketId}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <ActionIcon type={action.actionType} />
                          <span className="capitalize">{action.actionType.replace('_', ' ')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground truncate max-w-[200px]" title={action.details}>
                        {action.details}
                      </td>
                    </tr>
                  ))}
                  {(!actions || actions.length === 0) && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                        No actions executed yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Analytics Chart */}
          <div className="glass-panel rounded-2xl p-5 flex flex-col">
            <h3 className="font-semibold text-lg mb-6">Action Distribution</h3>
            <div className="flex-1 min-h-[250px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(10, 10, 15, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No data available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tickets Preview */}
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-white/10 bg-black/20">
            <h3 className="font-semibold text-lg">Active Tickets</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
            {tickets?.slice(0, 6).map(ticket => (
              <div key={ticket.id} className="bg-black/40 border border-white/5 p-4 rounded-xl hover:border-white/20 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono text-xs text-muted-foreground">#{ticket.id}</span>
                  <span className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold",
                    ticket.status === 'open' ? 'bg-primary/20 text-primary border border-primary/30' :
                    ticket.status === 'resolved' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                    'bg-red-500/20 text-red-400 border border-red-500/30'
                  )}>
                    {ticket.status}
                  </span>
                </div>
                <h4 className="font-medium text-white mb-1 truncate">{ticket.title}</h4>
                <p className="text-xs text-muted-foreground">Customer ID: {ticket.customerId}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      <ActionDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} />
    </SidebarLayout>
  );
}
