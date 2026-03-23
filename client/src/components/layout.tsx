import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Phone, LayoutDashboard, Bot, Zap } from "lucide-react";
import { motion } from "framer-motion";

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "AI Support", icon: Phone, description: "Voice & text agent" },
    { href: "/crm", label: "CRM Portal", icon: LayoutDashboard, description: "Analytics & customers" },
  ];

  return (
    <div className="flex h-screen bg-[#0a0a0a] overflow-hidden">
      <aside className="w-60 shrink-0 flex flex-col relative z-20 border-r border-white/[0.06]"
        style={{ background: "rgba(12,12,12,0.98)", backdropFilter: "blur(40px)" }}>

        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -left-20 w-48 h-48 aurora-orb opacity-30"
            style={{ background: "radial-gradient(circle, rgba(0,240,255,0.15), transparent)" }} />
        </div>

        <div className="relative p-5 pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, rgba(0,240,255,0.15), rgba(138,43,226,0.15))",
                  border: "1px solid rgba(0,240,255,0.25)",
                  boxShadow: "0 0 20px rgba(0,240,255,0.1), inset 0 1px 0 rgba(255,255,255,0.1)"
                }}>
                <Bot className="w-4.5 h-4.5 text-primary" style={{ width: 18, height: 18 }} />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-[#0c0c0c]" />
            </div>
            <div>
              <div className="font-display font-bold text-sm leading-tight text-white">Nexus AI</div>
              <div className="text-[10px] font-mono tracking-[0.15em] uppercase"
                style={{ color: "rgba(0,240,255,0.7)" }}>Resolution Agent</div>
            </div>
          </div>
        </div>

        <nav className="relative flex-1 px-3 py-5 space-y-1">
          <p className="text-[9px] font-mono tracking-[0.2em] uppercase px-3 mb-3"
            style={{ color: "rgba(255,255,255,0.25)" }}>Menu</p>
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className="block">
                <div
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer group overflow-hidden"
                  style={isActive ? {
                    background: "linear-gradient(135deg, rgba(0,240,255,0.08), rgba(138,43,226,0.05))",
                    border: "1px solid rgba(0,240,255,0.15)",
                  } : {
                    border: "1px solid transparent",
                  }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute inset-0 rounded-xl"
                      style={{ background: "linear-gradient(135deg, rgba(0,240,255,0.06), rgba(138,43,226,0.04))" }}
                    />
                  )}
                  <div className={cn(
                    "relative w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200",
                    isActive
                      ? "bg-primary/15"
                      : "bg-white/[0.04] group-hover:bg-white/[0.07]"
                  )}>
                    <item.icon className={cn(
                      "w-3.5 h-3.5 transition-colors duration-200",
                      isActive ? "text-primary" : "text-white/40 group-hover:text-white/70"
                    )} />
                  </div>
                  <div className="relative min-w-0">
                    <div className={cn(
                      "text-[13px] font-medium leading-tight transition-colors duration-200",
                      isActive ? "text-white" : "text-white/50 group-hover:text-white/80"
                    )}>{item.label}</div>
                    <div className="text-[10px] leading-tight mt-0.5 transition-colors duration-200"
                      style={{ color: isActive ? "rgba(0,240,255,0.5)" : "rgba(255,255,255,0.2)" }}>
                      {item.description}
                    </div>
                  </div>
                  {isActive && (
                    <div className="relative ml-auto w-1 h-1 rounded-full bg-primary shrink-0" />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="relative p-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
            style={{
              background: "rgba(16,185,129,0.05)",
              border: "1px solid rgba(16,185,129,0.15)"
            }}>
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-medium text-green-400">All Systems Online</div>
              <div className="text-[9px] mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>
                AI · Voice · CRM
              </div>
            </div>
            <Zap className="w-3 h-3 text-green-400/60 shrink-0" />
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(0,240,255,0.15), transparent)" }} />
        <div className="absolute top-0 right-0 w-96 h-96 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at top right, rgba(138,43,226,0.04), transparent 70%)"
          }} />
        <div className="absolute bottom-0 left-0 w-96 h-96 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at bottom left, rgba(0,240,255,0.03), transparent 70%)"
          }} />
        <div className="flex-1 overflow-auto p-6 md:p-8 relative z-10 scrollbar-hide">
          {children}
        </div>
      </main>
    </div>
  );
}
