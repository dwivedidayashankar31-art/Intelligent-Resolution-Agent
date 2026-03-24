import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Phone, LayoutDashboard, Bot, CreditCard, Settings } from "lucide-react";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  { href: "/",         label: "AI Support", icon: Phone,          desc: "Voice & text agent",    badge: "Live" },
  { href: "/crm",      label: "CRM Portal", icon: LayoutDashboard, desc: "Analytics & management" },
  { href: "/pricing",  label: "Pricing",    icon: CreditCard,      desc: "Plans & billing" },
  { href: "/settings", label: "Settings",   icon: Settings,        desc: "Preferences & config" },
];

export function SidebarLayout({ children, pageTitle, pageDesc, headerRight }: {
  children: React.ReactNode;
  pageTitle?: string;
  pageDesc?: string;
  headerRight?: React.ReactNode;
}) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#09090f" }}>

      {/* ── Sidebar ─────────────────────────────────── */}
      <aside className="w-[212px] shrink-0 flex flex-col relative z-20"
        style={{
          background: "rgba(255,255,255,0.018)",
          borderRight: "1px solid rgba(255,255,255,0.07)",
          backdropFilter: "blur(24px)",
        }}>

        {/* Logo */}
        <div className="px-4 py-[13px] flex items-center gap-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.065)" }}>
          <div className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center shrink-0 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #3B82F6 0%, #7C3AED 100%)",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.15) inset, 0 4px 12px rgba(59,130,246,0.4)",
            }}>
            <Bot className="w-[15px] h-[15px] text-white relative z-10" />
            <div className="absolute inset-0 opacity-40"
              style={{ background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.5), transparent 65%)" }} />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-white leading-none tracking-tight" style={{ fontSize: 13.5 }}>Nexus AI</div>
            <div className="mt-[3px] font-medium" style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", letterSpacing: ".02em" }}>
              Resolution Platform
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 overflow-y-auto scrollbar-hide">
          <p className="label px-2 mb-2 pt-0.5">Workspace</p>

          <div className="space-y-0.5">
            {NAV_ITEMS.map((item, i) => {
              const active = location === item.href;
              return (
                <Link key={item.href} href={item.href} className="block">
                  <motion.div
                    data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "relative flex items-center gap-2.5 px-2.5 py-[7px] rounded-[8px] cursor-pointer transition-all duration-150 group select-none",
                      active ? "text-white" : "text-white/40 hover:text-white/75"
                    )}
                    style={active ? {
                      background: "rgba(59,130,246,0.12)",
                      border: "1px solid rgba(59,130,246,0.22)",
                      boxShadow: "0 0 0 0 rgba(59,130,246,0)",
                    } : {
                      border: "1px solid transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.045)";
                    }}
                    onMouseLeave={(e) => {
                      if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
                    }}
                  >
                    {/* Active left bar */}
                    {active && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2.5px] h-4 rounded-r-full"
                        style={{ background: "linear-gradient(180deg, #60A5FA, #3B82F6)" }} />
                    )}

                    <item.icon className="w-[15px] h-[15px] shrink-0 transition-colors"
                      style={{ color: active ? "#60A5FA" : undefined }} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span style={{ fontSize: 13, fontWeight: active ? 600 : 500, lineHeight: 1 }}>
                          {item.label}
                        </span>
                        {item.badge && (
                          <span className="badge badge-blue" style={{ fontSize: 9, padding: "2px 5px", lineHeight: 1.4 }}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>

        </nav>

        {/* Status footer */}
        <div className="px-2 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.065)" }}>
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-[8px]"
            style={{
              background: "rgba(34,197,94,0.05)",
              border: "1px solid rgba(34,197,94,0.14)",
            }}>
            <div className="w-2 h-2 rounded-full shrink-0" style={{
              background: "#22C55E",
              boxShadow: "0 0 0 2px rgba(34,197,94,0.18)",
            }} />
            <div className="min-w-0 flex-1">
              <div className="font-semibold leading-none" style={{ fontSize: 11, color: "#4ADE80" }}>
                All systems operational
              </div>
              <div className="mt-[3px] font-mono" style={{ fontSize: 9, color: "rgba(255,255,255,0.22)" }}>
                AI · Voice · CRM · Database
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {(pageTitle || headerRight) && (
          <header className="shrink-0 flex items-center justify-between px-7 h-[52px]"
            style={{
              borderBottom: "1px solid rgba(255,255,255,0.065)",
              background: "rgba(255,255,255,0.014)",
              backdropFilter: "blur(16px)",
            }}>
            <div className="flex items-center gap-2">
              {pageTitle && (
                <span className="font-semibold text-white/85" style={{ fontSize: 13 }}>{pageTitle}</span>
              )}
              {pageDesc && (
                <>
                  <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 13 }}>/</span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{pageDesc}</span>
                </>
              )}
            </div>
            {headerRight && <div className="flex items-center gap-2">{headerRight}</div>}
          </header>
        )}

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
