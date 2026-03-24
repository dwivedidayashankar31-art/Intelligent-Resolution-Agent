import { useState } from "react";
import { SidebarLayout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import {
  Globe, Moon, Bell, Shield, User, Info,
  ChevronRight, Check, Bot, Database, Zap,
} from "lucide-react";

type SettingSection = "account" | "appearance" | "language" | "notifications" | "ai" | "about";

const SECTIONS: { id: SettingSection; label: string; icon: any; desc: string }[] = [
  { id: "account",       label: "Account",       icon: User,   desc: "Profile & security" },
  { id: "appearance",    label: "Appearance",    icon: Moon,   desc: "Theme & display" },
  { id: "language",      label: "Language",      icon: Globe,  desc: "Interface language" },
  { id: "notifications", label: "Notifications", icon: Bell,   desc: "Alerts & updates" },
  { id: "ai",            label: "AI Preferences",icon: Bot,    desc: "Agent behaviour" },
  { id: "about",         label: "About",         icon: Info,   desc: "System information" },
];

function Row({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-4"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.055)" }}>
      <div>
        <p className="font-medium text-white" style={{ fontSize: 13 }}>{label}</p>
        {desc && <p className="mt-0.5" style={{ fontSize: 11.5, color: "rgba(255,255,255,0.35)" }}>{desc}</p>}
      </div>
      <div className="shrink-0 ml-6">{children}</div>
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      data-testid="toggle-switch"
      onClick={() => onChange(!value)}
      className="relative w-10 h-5.5 rounded-full transition-colors duration-200 focus:outline-none"
      style={{
        background: value ? "#3B82F6" : "rgba(255,255,255,0.12)",
        width: 40, height: 22,
      }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-[18px] h-[18px] rounded-full bg-white transition-transform duration-200 shadow-sm"
        style={{ transform: value ? "translateX(18px)" : "translateX(0)" }}
      />
    </button>
  );
}

function SelectPill({ options, value, onChange }: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-1.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          data-testid={`option-${opt.value}`}
          onClick={() => onChange(opt.value)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition-all"
          style={{
            fontSize: 12,
            background: value === opt.value ? "rgba(59,130,246,0.18)" : "rgba(255,255,255,0.05)",
            border: value === opt.value ? "1px solid rgba(59,130,246,0.4)" : "1px solid rgba(255,255,255,0.1)",
            color: value === opt.value ? "#60A5FA" : "rgba(255,255,255,0.45)",
          }}
        >
          {value === opt.value && <Check className="w-3 h-3" />}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [active, setActive] = useState<SettingSection>("account");

  const [theme, setTheme] = useState("dark");
  const [language, setLanguage] = useState("en");
  const [density, setDensity] = useState("comfortable");
  const [emailNotif, setEmailNotif] = useState(true);
  const [actionAlerts, setActionAlerts] = useState(true);
  const [escalationAlerts, setEscalationAlerts] = useState(true);
  const [aiVoice, setAiVoice] = useState(true);
  const [aiAutoLog, setAiAutoLog] = useState(true);
  const [aiStreaming, setAiStreaming] = useState(true);
  const [aiConfidence, setAiConfidence] = useState("balanced");

  return (
    <SidebarLayout>
      <div className="px-7 pt-6 pb-10 max-w-[1100px] mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="font-bold text-white mb-1" style={{ fontSize: 22, letterSpacing: "-0.03em" }}>Settings</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Manage your account, preferences, and system configuration</p>
        </div>

        <div className="flex gap-5">

          {/* Sidebar nav */}
          <div className="w-[200px] shrink-0 space-y-0.5">
            {SECTIONS.map((s) => {
              const isActive = active === s.id;
              return (
                <motion.button
                  key={s.id}
                  data-testid={`settings-nav-${s.id}`}
                  onClick={() => setActive(s.id)}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[9px] text-left transition-all"
                  style={{
                    background: isActive ? "rgba(59,130,246,0.1)" : "transparent",
                    border: isActive ? "1px solid rgba(59,130,246,0.2)" : "1px solid transparent",
                  }}
                  onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
                  onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <s.icon className="w-4 h-4 shrink-0" style={{ color: isActive ? "#60A5FA" : "rgba(255,255,255,0.35)" }} />
                  <div>
                    <p style={{ fontSize: 12.5, fontWeight: isActive ? 600 : 500, color: isActive ? "white" : "rgba(255,255,255,0.5)", lineHeight: 1 }}>
                      {s.label}
                    </p>
                  </div>
                  {isActive && <ChevronRight className="w-3 h-3 ml-auto" style={{ color: "#60A5FA" }} />}
                </motion.button>
              );
            })}
          </div>

          {/* Content panel */}
          <motion.div
            key={active}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 rounded-xl px-6 py-2"
            style={{ background: "hsl(240,6%,7%)", border: "1px solid rgba(255,255,255,0.07)" }}
          >

            {/* Account */}
            {active === "account" && (
              <div>
                <p className="font-semibold text-white pt-4 pb-1" style={{ fontSize: 14 }}>Account</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>Your profile and login details</p>
                <Row label="Username" desc="Your unique login identifier">
                  <span className="font-mono px-2.5 py-1 rounded-md text-white" style={{ fontSize: 12, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    {user?.username || "—"}
                  </span>
                </Row>
                <Row label="Role" desc="Your access level in the system">
                  <span className="badge badge-blue" style={{ fontSize: 11 }}>Admin</span>
                </Row>
                <Row label="Session" desc="Your current login session">
                  <span className="badge badge-green" style={{ fontSize: 11 }}>Active</span>
                </Row>
                <Row label="Password" desc="Change your login password">
                  <button
                    data-testid="button-change-password"
                    className="px-3 py-1.5 rounded-lg font-medium transition-colors"
                    style={{ fontSize: 12, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}
                    onClick={() => alert("Password change coming soon")}
                  >
                    Change password
                  </button>
                </Row>
                <Row label="Two-factor authentication" desc="Add an extra layer of security">
                  <span className="badge badge-neutral" style={{ fontSize: 11 }}>Coming soon</span>
                </Row>
              </div>
            )}

            {/* Appearance */}
            {active === "appearance" && (
              <div>
                <p className="font-semibold text-white pt-4 pb-1" style={{ fontSize: 14 }}>Appearance</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>Customize how Nexus AI looks on your device</p>
                <Row label="Theme" desc="Choose your preferred color theme">
                  <SelectPill
                    value={theme}
                    onChange={setTheme}
                    options={[
                      { value: "dark", label: "Dark" },
                      { value: "light", label: "Light" },
                      { value: "system", label: "System" },
                    ]}
                  />
                </Row>
                <Row label="Interface density" desc="Control spacing and layout density">
                  <SelectPill
                    value={density}
                    onChange={setDensity}
                    options={[
                      { value: "compact", label: "Compact" },
                      { value: "comfortable", label: "Comfortable" },
                    ]}
                  />
                </Row>
                <Row label="Sidebar" desc="Sidebar is always visible on desktop">
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>Always visible</span>
                </Row>
              </div>
            )}

            {/* Language */}
            {active === "language" && (
              <div>
                <p className="font-semibold text-white pt-4 pb-1" style={{ fontSize: 14 }}>Language</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>Set the language for the Nexus AI interface</p>
                <Row label="Interface language" desc="All menus, buttons, and messages will use this language">
                  <SelectPill
                    value={language}
                    onChange={setLanguage}
                    options={[
                      { value: "en", label: "English" },
                      { value: "hi", label: "Hindi" },
                      { value: "es", label: "Spanish" },
                      { value: "fr", label: "French" },
                    ]}
                  />
                </Row>
                <Row label="Date format" desc="How dates are displayed across the platform">
                  <SelectPill
                    value="dmy"
                    onChange={() => {}}
                    options={[
                      { value: "dmy", label: "DD/MM/YYYY" },
                      { value: "mdy", label: "MM/DD/YYYY" },
                    ]}
                  />
                </Row>
                <Row label="Timezone" desc="Used for timestamps and scheduling">
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontFamily: "monospace" }}>
                    {Intl.DateTimeFormat().resolvedOptions().timeZone}
                  </span>
                </Row>
              </div>
            )}

            {/* Notifications */}
            {active === "notifications" && (
              <div>
                <p className="font-semibold text-white pt-4 pb-1" style={{ fontSize: 14 }}>Notifications</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>Control which alerts and updates you receive</p>
                <Row label="Email notifications" desc="Receive updates via email">
                  <Toggle value={emailNotif} onChange={setEmailNotif} />
                </Row>
                <Row label="AI action alerts" desc="Notify when the AI completes an action (refund, reset, etc.)">
                  <Toggle value={actionAlerts} onChange={setActionAlerts} />
                </Row>
                <Row label="Escalation alerts" desc="Notify when a ticket is escalated to a human agent">
                  <Toggle value={escalationAlerts} onChange={setEscalationAlerts} />
                </Row>
                <Row label="Browser notifications" desc="Show desktop push notifications">
                  <span className="badge badge-neutral" style={{ fontSize: 11 }}>Coming soon</span>
                </Row>
              </div>
            )}

            {/* AI Preferences */}
            {active === "ai" && (
              <div>
                <p className="font-semibold text-white pt-4 pb-1" style={{ fontSize: 14 }}>AI Preferences</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>Configure how the Nexus AI agent behaves</p>
                <Row label="Voice mode" desc="Enable AI voice responses (GPT-4o Audio)">
                  <Toggle value={aiVoice} onChange={setAiVoice} />
                </Row>
                <Row label="Auto-log actions" desc="Automatically log AI actions (refunds, resets) to CRM">
                  <Toggle value={aiAutoLog} onChange={setAiAutoLog} />
                </Row>
                <Row label="Streaming responses" desc="Show AI reply word-by-word as it generates">
                  <Toggle value={aiStreaming} onChange={setAiStreaming} />
                </Row>
                <Row label="Response style" desc="How the AI balances speed vs. thoroughness">
                  <SelectPill
                    value={aiConfidence}
                    onChange={setAiConfidence}
                    options={[
                      { value: "fast", label: "Fast" },
                      { value: "balanced", label: "Balanced" },
                      { value: "thorough", label: "Thorough" },
                    ]}
                  />
                </Row>
                <Row label="AI model" desc="The language model powering Nexus">
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontFamily: "monospace" }}>GPT-4o Audio</span>
                </Row>
              </div>
            )}

            {/* About */}
            {active === "about" && (
              <div>
                <p className="font-semibold text-white pt-4 pb-1" style={{ fontSize: 14 }}>About Nexus AI</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>System and platform information</p>
                <Row label="Platform" desc="Product name">
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Nexus AI</span>
                </Row>
                <Row label="Version" desc="Current release">
                  <span className="font-mono badge badge-neutral" style={{ fontSize: 11 }}>v1.0.0</span>
                </Row>
                <Row label="AI Engine" desc="Underlying language model">
                  <div className="flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5 text-blue-400" />
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>OpenAI GPT-4o Audio</span>
                  </div>
                </Row>
                <Row label="Database" desc="Data storage">
                  <div className="flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-green-400" />
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>PostgreSQL (Drizzle ORM)</span>
                  </div>
                </Row>
                <Row label="Authentication" desc="Login & session management">
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-violet-400" />
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Passport.js + bcrypt</span>
                  </div>
                </Row>
                <Row label="Streaming" desc="Real-time AI responses">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-yellow-400" />
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Server-Sent Events (SSE)</span>
                  </div>
                </Row>
              </div>
            )}

          </motion.div>
        </div>
      </div>
    </SidebarLayout>
  );
}
