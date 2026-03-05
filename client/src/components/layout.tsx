import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Mic, Settings, Users, Activity, Bot } from "lucide-react";

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "AI Voice Support", icon: Mic },
    { href: "/crm", label: "CRM Portal", icon: LayoutDashboard },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden selection:bg-primary/30 selection:text-primary">
      {/* Sidebar */}
      <aside className="w-64 glass-panel border-r border-white/10 flex flex-col z-20 relative">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/50 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
            <Bot className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-display font-bold text-foreground leading-tight">Nexus AI</h1>
            <p className="text-xs text-primary font-mono tracking-wider">AGENT_SYS_V2</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className="block">
                <div
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer",
                    isActive 
                      ? "bg-primary/10 text-primary border border-primary/30 neon-border" 
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-white/5 transition-colors cursor-pointer">
            <Settings className="w-5 h-5" />
            <span className="font-medium text-sm">Settings</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Top ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-primary/10 blur-[100px] pointer-events-none rounded-full" />
        
        <div className="flex-1 overflow-auto p-6 md:p-8 relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}
