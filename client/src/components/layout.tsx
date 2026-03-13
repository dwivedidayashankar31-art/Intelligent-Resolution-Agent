import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Phone, LayoutDashboard, Settings, Bot, MessageSquare } from "lucide-react";

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "AI Voice Support", icon: Phone, description: "Voice & text agent" },
    { href: "/crm", label: "CRM Portal", icon: LayoutDashboard, description: "Actions & customers" },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <aside className="w-64 shrink-0 glass-panel border-r border-white/10 flex flex-col z-20 relative">
        {/* Logo */}
        <div className="p-5 flex items-center gap-3 border-b border-white/5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/40 shadow-[0_0_20px_rgba(0,240,255,0.15)]">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-base font-display font-bold leading-tight">Nexus AI</h1>
            <p className="text-[10px] text-primary font-mono tracking-widest">RESOLUTION AGENT</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1.5">
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest px-3 mb-3">Navigation</p>
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className="block">
                <div
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 cursor-pointer group",
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground border border-transparent"
                  )}
                >
                  <item.icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary" : "")} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium leading-tight">{item.label}</div>
                    <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">{item.description}</div>
                  </div>
                  {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* System status pill */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-green-500/5 border border-green-500/20">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
            <div className="min-w-0">
              <div className="text-xs font-medium text-green-400">All Systems Operational</div>
              <div className="text-[10px] text-muted-foreground">AI Integrations Active</div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-primary/5 blur-[80px] pointer-events-none rounded-full" />
        <div className="flex-1 overflow-auto p-6 md:p-8 relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}
