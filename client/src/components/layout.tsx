import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Phone, LayoutDashboard, Bot, Zap, ChevronRight, Circle } from "lucide-react";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  {
    href: "/",
    label: "AI Support",
    icon: Phone,
    description: "Voice & text agent",
    badge: "Live",
  },
  {
    href: "/crm",
    label: "CRM Portal",
    icon: LayoutDashboard,
    description: "Analytics & management",
  },
];

export function SidebarLayout({ children, pageTitle, pageDesc, headerRight }: {
  children: React.ReactNode;
  pageTitle?: string;
  pageDesc?: string;
  headerRight?: React.ReactNode;
}) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "hsl(240, 10%, 3.9%)" }}>

      {/* Sidebar */}
      <aside
        className="w-56 shrink-0 flex flex-col relative z-20"
        style={{
          background: "hsl(240, 8%, 4.8%)",
          borderRight: "1px solid rgba(255,255,255,0.065)",
        }}
      >
        {/* Logo */}
        <div className="px-4 py-4 flex items-center gap-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.055)" }}>
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)",
              boxShadow: "0 2px 8px rgba(59,130,246,0.35)"
            }}
          >
            <Bot className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-[13px] text-white leading-tight tracking-tight">Nexus AI</div>
            <div className="text-[10px] leading-tight mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>Resolution Platform</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto scrollbar-hide">
          <p className="section-label px-2 mb-2 pt-1">Workspace</p>
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className="block">
                <div
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  className={cn(
                    "relative flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-all duration-150 group",
                    isActive
                      ? "text-white"
                      : "text-white/40 hover:text-white/75 hover:bg-white/[0.04]"
                  )}
                  style={isActive ? {
                    background: "rgba(59,130,246,0.1)",
                    border: "1px solid rgba(59,130,246,0.18)",
                  } : { border: "1px solid transparent" }}
                >
                  {isActive && (
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r-full"
                      style={{ background: "#3B82F6" }}
                    />
                  )}
                  <item.icon
                    className="w-4 h-4 shrink-0 transition-colors"
                    style={{ color: isActive ? "#60A5FA" : undefined }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-medium leading-tight">{item.label}</span>
                      {item.badge && (
                        <span className="badge badge-blue text-[9px] px-1.5 py-0">{item.badge}</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}

          <div className="pt-3 mt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.055)" }}>
            <p className="section-label px-2 mb-2">System</p>
            <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-default"
              style={{ border: "1px solid transparent" }}>
              <Zap className="w-4 h-4 shrink-0 text-white/25" />
              <div>
                <div className="text-[12px] font-medium" style={{ color: "rgba(255,255,255,0.35)" }}>Integrations</div>
              </div>
            </div>
          </div>
        </nav>

        {/* Bottom: Status */}
        <div className="px-2.5 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.055)" }}>
          <div
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg"
            style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.12)" }}
          >
            <div className="status-dot status-online animate-pulse-dot shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold" style={{ color: "#4ADE80" }}>All systems operational</div>
              <div className="text-[9px] mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>AI · Voice · CRM · DB</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top header bar */}
        {(pageTitle || headerRight) && (
          <header
            className="shrink-0 flex items-center justify-between px-7 h-14"
            style={{
              borderBottom: "1px solid rgba(255,255,255,0.065)",
              background: "rgba(255,255,255,0.012)",
              backdropFilter: "blur(12px)"
            }}
          >
            <div className="flex items-center gap-2">
              {pageTitle && (
                <>
                  <span className="text-[13px] font-semibold text-white/85">{pageTitle}</span>
                  {pageDesc && (
                    <>
                      <ChevronRight className="w-3.5 h-3.5 text-white/20" />
                      <span className="text-[12px]" style={{ color: "rgba(255,255,255,0.35)" }}>{pageDesc}</span>
                    </>
                  )}
                </>
              )}
            </div>
            {headerRight && <div className="flex items-center gap-2">{headerRight}</div>}
          </header>
        )}

        {/* Content */}
        <main className="flex-1 overflow-auto" style={{ scrollbarWidth: "thin" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
