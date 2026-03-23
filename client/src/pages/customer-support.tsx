import { useState, useRef, useEffect } from "react";
import { useVoiceRecorder, useVoiceStream } from "@/replit_integrations/audio";
import { useCreateConversation, useConversations } from "@/hooks/use-voice";
import { useStats } from "@/hooks/use-crm";
import { useQueryClient } from "@tanstack/react-query";
import { SidebarLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Waveform } from "@/components/waveform";
import {
  Mic, Square, User, Bot, Activity, MessageSquare, Phone, Send,
  Loader2, RefreshCcw, KeyRound, ShieldAlert, RefreshCw, Clock, ArrowRight, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

type Mode = "idle" | "voice" | "text";
type Message = { role: "user" | "assistant"; content: string };

const QUICK_SUGGESTIONS = [
  { icon: RefreshCcw, label: "Request a refund", text: "I'd like to request a refund for my recent order." },
  { icon: KeyRound, label: "Reset my password", text: "I can't log in and need to reset my password." },
  { icon: ShieldAlert, label: "Escalate my issue", text: "This issue hasn't been resolved and I need to speak to a specialist." },
  { icon: RefreshCw, label: "Update account info", text: "I need to update my account information." },
];

const CAPABILITIES = [
  { label: "Refund Processing", desc: "Instant", color: "rgba(0,240,255,0.7)" },
  { label: "Password Reset", desc: "Account recovery", color: "rgba(138,43,226,0.7)" },
  { label: "CRM Updates", desc: "Real-time sync", color: "rgba(0,240,255,0.7)" },
  { label: "Smart Escalation", desc: "Human handoff", color: "rgba(138,43,226,0.7)" },
];

export default function CustomerSupport() {
  const [mode, setMode] = useState<Mode>("idle");
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [textInput, setTextInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const queryClient = useQueryClient();
  const createConv = useCreateConversation();
  const { data: conversations } = useConversations();
  const { data: stats } = useStats();
  const recorder = useVoiceRecorder();
  const streamRef = useRef<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const voiceStream = useVoiceStream({
    onUserTranscript: (text) => {
      setMessages((prev) => [...prev, { role: "user", content: text }]);
    },
    onTranscript: (_, full) => {
      streamRef.current = full;
      setStreamingText(full);
    },
    onComplete: () => {
      setMessages((prev) => [...prev, { role: "assistant", content: streamRef.current }]);
      streamRef.current = "";
      setStreamingText("");
      queryClient.invalidateQueries({ queryKey: ["/api/actions"] });
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingText]);

  const startSession = async (selectedMode: "voice" | "text") => {
    try {
      const conv = await createConv.mutateAsync(
        selectedMode === "voice" ? "Voice Support Session" : "Text Support Session"
      );
      setConversationId(conv.id);
      setMessages([]);
      setMode(selectedMode);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleRecording = async () => {
    if (!conversationId) return;
    if (recorder.state === "recording") {
      try {
        const blob = await recorder.stopRecording();
        await voiceStream.streamVoiceResponse(`/api/conversations/${conversationId}/messages`, blob);
      } catch (e) {
        console.error("Voice stream failed:", e);
      }
    } else {
      await recorder.startRecording();
    }
  };

  const sendTextMessage = async (overrideText?: string) => {
    const content = (overrideText ?? textInput).trim();
    if (!content || !conversationId || isSending) return;
    setTextInput("");
    setMessages((prev) => [...prev, { role: "user", content }]);
    setIsSending(true);
    streamRef.current = "";

    try {
      const res = await fetch(`/api/conversations/${conversationId}/text-messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === "delta") {
              streamRef.current += event.data;
              setStreamingText(streamRef.current);
            } else if (event.type === "done") {
              setMessages((prev) => [...prev, { role: "assistant", content: event.full }]);
              setStreamingText("");
              streamRef.current = "";
              queryClient.invalidateQueries({ queryKey: ["/api/actions"] });
              queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
            }
          } catch {}
        }
      }
    } catch (e) {
      console.error("Text send failed:", e);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendTextMessage();
    }
  };

  const isAgentResponding = voiceStream.playbackState === "playing" || (isSending && streamingText.length > 0);
  const isRecording = recorder.state === "recording";

  if (mode === "idle") {
    return (
      <SidebarLayout>
        <div className="h-full flex gap-6 min-h-0">
          <div className="w-56 shrink-0 flex flex-col gap-3">
            <div className="rounded-2xl overflow-hidden flex flex-col"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="px-4 py-3 flex items-center gap-2"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <Clock className="w-3.5 h-3.5" style={{ color: "rgba(0,240,255,0.6)" }} />
                <span className="text-xs font-semibold text-white/70">Past Sessions</span>
              </div>
              <div className="overflow-y-auto max-h-64 scrollbar-hide">
                {conversations && conversations.length > 0 ? (
                  <div className="p-2 space-y-0.5">
                    {[...(conversations as any[])].reverse().slice(0, 12).map((c: any) => (
                      <div
                        key={c.id}
                        data-testid={`session-${c.id}`}
                        className="flex items-start gap-2.5 p-2.5 rounded-xl cursor-default transition-all duration-150 hover:bg-white/[0.04]"
                      >
                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                          style={{ background: "rgba(0,240,255,0.5)" }} />
                        <div className="min-w-0">
                          <div className="text-[11px] font-medium text-white/70 truncate">{c.title}</div>
                          <div className="text-[9px] font-mono mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>
                            {c.createdAt ? formatDistanceToNow(new Date(c.createdAt), { addSuffix: true }) : "#" + c.id}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-[11px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                    No sessions yet
                  </div>
                )}
              </div>
            </div>

            {stats && (
              <div className="rounded-2xl p-4 space-y-2.5"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-3 h-3" style={{ color: "rgba(0,240,255,0.6)" }} />
                  <span className="text-[10px] font-semibold uppercase tracking-widest"
                    style={{ color: "rgba(255,255,255,0.4)" }}>Metrics</span>
                </div>
                {[
                  { label: "Customers", value: stats.customers, color: "rgba(255,255,255,0.8)" },
                  { label: "Open Tickets", value: stats.openTickets, color: "rgba(0,240,255,0.8)" },
                  { label: "Escalated", value: stats.escalated, color: "rgba(239,68,68,0.8)" },
                  { label: "Resolved", value: stats.resolved, color: "rgba(34,197,94,0.8)" },
                  { label: "AI Actions", value: stats.actions, color: "rgba(138,43,226,0.8)" },
                ].map((s) => (
                  <div key={s.label} className="flex justify-between items-center">
                    <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>{s.label}</span>
                    <span className="text-[11px] font-mono font-bold" style={{ color: s.color }}>{s.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col items-center justify-center gap-10 min-w-0">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-center max-w-lg"
            >
              <div className="relative inline-flex mb-8">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, rgba(0,240,255,0.12), rgba(138,43,226,0.12))",
                    border: "1px solid rgba(0,240,255,0.2)",
                    boxShadow: "0 0 40px rgba(0,240,255,0.12), inset 0 1px 0 rgba(255,255,255,0.08)"
                  }}>
                  <Bot className="w-8 h-8" style={{ color: "rgba(0,240,255,0.9)" }} />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #00F0FF, #8A2BE2)" }}>
                  <Sparkles className="w-2.5 h-2.5 text-black" />
                </div>
              </div>
              <h1 className="font-display font-bold text-5xl mb-4 leading-tight">
                <span className="text-gradient-white">Nexus AI</span>
                <br />
                <span className="text-gradient-primary">Agent</span>
              </h1>
              <p className="text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                Autonomous customer resolution. Handles refunds, resets, CRM updates, and escalations in real time — instantly.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="flex gap-4"
            >
              {[
                {
                  onClick: () => startSession("voice"),
                  testId: "button-start-voice",
                  icon: Phone,
                  title: "Voice Mode",
                  desc: "Speak naturally",
                  accent: "#00F0FF",
                  accentRgb: "0,240,255",
                },
                {
                  onClick: () => startSession("text"),
                  testId: "button-start-text",
                  icon: MessageSquare,
                  title: "Text Mode",
                  desc: "Type your query",
                  accent: "#8A2BE2",
                  accentRgb: "138,43,226",
                }
              ].map((item) => (
                <motion.button
                  key={item.title}
                  onClick={item.onClick}
                  disabled={createConv.isPending}
                  data-testid={item.testId}
                  whileHover={{ y: -4, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="group relative flex flex-col gap-5 p-7 rounded-2xl w-52 text-left overflow-hidden"
                  style={{
                    background: "rgba(255,255,255,0.025)",
                    border: `1px solid rgba(255,255,255,0.08)`,
                    boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
                    transition: "box-shadow 0.3s ease, border-color 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = `rgba(${item.accentRgb},0.25)`;
                    (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 32px rgba(0,0,0,0.4), 0 0 40px rgba(${item.accentRgb},0.08)`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = `rgba(255,255,255,0.08)`;
                    (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 24px rgba(0,0,0,0.3)`;
                  }}
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ background: `radial-gradient(ellipse at top left, rgba(${item.accentRgb},0.05), transparent 60%)` }} />

                  <div className="relative w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{
                      background: `rgba(${item.accentRgb},0.1)`,
                      border: `1px solid rgba(${item.accentRgb},0.2)`,
                      boxShadow: `0 0 20px rgba(${item.accentRgb},0.1)`
                    }}>
                    <item.icon className="w-5 h-5" style={{ color: item.accent }} />
                  </div>

                  <div className="relative">
                    <div className="font-display font-bold text-base text-white mb-1">{item.title}</div>
                    <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>{item.desc}</div>
                  </div>

                  <div className="relative flex items-center gap-1.5 group-hover:gap-2.5 transition-all duration-200">
                    <span className="text-[11px] font-medium" style={{ color: item.accent }}>Start session</span>
                    <ArrowRight className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5"
                      style={{ color: item.accent }} />
                  </div>
                </motion.button>
              ))}
            </motion.div>

            {createConv.isPending && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2.5 text-sm"
                style={{ color: "rgba(0,240,255,0.7)" }}
              >
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Initializing secure channel...
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="grid grid-cols-4 gap-3 w-full max-w-lg"
            >
              {CAPABILITIES.map((cap) => (
                <div key={cap.label} className="p-3.5 rounded-xl text-center"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.05)"
                  }}>
                  <div className="text-[11px] font-semibold mb-0.5" style={{ color: cap.color }}>{cap.label}</div>
                  <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.25)" }}>{cap.desc}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="h-full flex flex-col max-w-5xl mx-auto gap-4">
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-2 h-2 rounded-full",
              isRecording ? "bg-red-500 animate-pulse" :
              isAgentResponding ? "bg-primary animate-pulse" :
              "bg-green-400"
            )} />
            <span className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.35)" }}>
              Session #{conversationId} · {mode === "voice" ? "Voice" : "Text"} Mode
            </span>
          </div>
          <button
            onClick={() => { setMode("idle"); setConversationId(null); setMessages([]); }}
            data-testid="button-end-session"
            className="text-[11px] transition-all duration-150 px-3 py-1.5 rounded-lg"
            style={{
              color: "rgba(255,255,255,0.4)",
              border: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.02)"
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.8)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.12)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.4)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)";
            }}
          >
            ← New Session
          </button>
        </div>

        <div className="flex-1 flex gap-4 min-h-0">
          <div className="flex-1 rounded-2xl flex flex-col overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.07)",
              boxShadow: "0 4px 40px rgba(0,0,0,0.3)"
            }}>
            <div className="px-5 py-3.5 flex items-center gap-2.5"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)" }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(0,240,255,0.08)", border: "1px solid rgba(0,240,255,0.15)" }}>
                <Bot className="w-3.5 h-3.5" style={{ color: "rgba(0,240,255,0.8)" }} />
              </div>
              <span className="text-sm font-semibold text-white/80">Live Transcript</span>
              {isAgentResponding && (
                <span className="ml-auto text-[11px] font-mono flex items-center gap-1.5"
                  style={{ color: "rgba(0,240,255,0.7)" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  Nexus responding...
                </span>
              )}
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-hide">
              {messages.length === 0 && !streamingText && (
                <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
                  <div>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                      style={{
                        background: "rgba(0,240,255,0.06)",
                        border: "1px solid rgba(0,240,255,0.12)"
                      }}>
                      <Bot className="w-6 h-6" style={{ color: "rgba(0,240,255,0.4)" }} />
                    </div>
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
                      {mode === "voice" ? "Press the mic button to start talking..." : "Describe your issue below or pick a quick option:"}
                    </p>
                  </div>
                  {mode === "text" && (
                    <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
                      {QUICK_SUGGESTIONS.map((s) => (
                        <button
                          key={s.label}
                          onClick={() => sendTextMessage(s.text)}
                          data-testid={`chip-${s.label.toLowerCase().replace(/\s+/g, "-")}`}
                          className="flex items-center gap-2 p-3 rounded-xl text-left transition-all duration-150"
                          style={{
                            background: "rgba(255,255,255,0.025)",
                            border: "1px solid rgba(255,255,255,0.07)"
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                            (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,240,255,0.15)";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.025)";
                            (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)";
                          }}
                        >
                          <s.icon className="w-3.5 h-3.5 shrink-0" style={{ color: "rgba(0,240,255,0.6)" }} />
                          <span className="text-[11px] font-medium text-white/60">{s.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className={cn("flex gap-3 max-w-[86%]", msg.role === "user" ? "ml-auto flex-row-reverse" : "")}
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={msg.role === "user" ? {
                        background: "rgba(138,43,226,0.12)",
                        border: "1px solid rgba(138,43,226,0.2)"
                      } : {
                        background: "rgba(0,240,255,0.08)",
                        border: "1px solid rgba(0,240,255,0.15)"
                      }}>
                      {msg.role === "user"
                        ? <User className="w-3.5 h-3.5" style={{ color: "rgba(138,43,226,0.8)" }} />
                        : <Bot className="w-3.5 h-3.5" style={{ color: "rgba(0,240,255,0.8)" }} />
                      }
                    </div>
                    <div className="px-4 py-3 rounded-2xl text-sm leading-relaxed"
                      style={msg.role === "user" ? {
                        background: "rgba(138,43,226,0.08)",
                        border: "1px solid rgba(138,43,226,0.15)",
                        borderTopRightRadius: 4,
                        color: "rgba(255,255,255,0.85)"
                      } : {
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        borderTopLeftRadius: 4,
                        color: "rgba(255,255,255,0.85)"
                      }}>
                      {msg.content}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {streamingText && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 max-w-[86%]"
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: "rgba(0,240,255,0.08)", border: "1px solid rgba(0,240,255,0.15)" }}>
                    <Bot className="w-3.5 h-3.5 animate-pulse" style={{ color: "rgba(0,240,255,0.8)" }} />
                  </div>
                  <div className="px-4 py-3 rounded-2xl text-sm leading-relaxed"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.07)",
                      borderTopLeftRadius: 4,
                      color: "rgba(255,255,255,0.85)"
                    }}>
                    {streamingText}
                    <span className="inline-block w-0.5 h-4 ml-1 align-middle rounded-sm cursor-blink"
                      style={{ background: "rgba(0,240,255,0.8)" }} />
                  </div>
                </motion.div>
              )}
            </div>

            {mode === "text" && (
              <div className="p-4 space-y-3"
                style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.1)" }}>
                {messages.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {QUICK_SUGGESTIONS.map((s) => (
                      <button
                        key={s.label}
                        onClick={() => sendTextMessage(s.text)}
                        disabled={isSending}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] whitespace-nowrap transition-all duration-150"
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.07)",
                          color: "rgba(255,255,255,0.45)"
                        }}
                      >
                        <s.icon className="w-3 h-3" style={{ color: "rgba(0,240,255,0.5)" }} />
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex gap-3 items-end">
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isSending}
                    data-testid="input-message"
                    placeholder="Describe your issue... (Enter to send)"
                    className="flex-1 rounded-xl px-4 py-3 text-sm resize-none h-12 focus:outline-none transition-all duration-200"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "rgba(255,255,255,0.85)",
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(0,240,255,0.25)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
                    rows={1}
                  />
                  <Button
                    onClick={() => sendTextMessage()}
                    disabled={!textInput.trim() || isSending}
                    size="icon"
                    data-testid="button-send"
                    className="shrink-0 w-12 h-12 rounded-xl"
                  >
                    {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {mode === "voice" && (
            <div className="w-52 flex flex-col gap-3">
              <div className="rounded-2xl flex-1 flex flex-col items-center justify-center gap-6 p-6 relative overflow-hidden"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: `1px solid ${isRecording ? "rgba(239,68,68,0.2)" : isAgentResponding ? "rgba(0,240,255,0.15)" : "rgba(255,255,255,0.06)"}`,
                  transition: "border-color 0.4s ease",
                  boxShadow: isRecording
                    ? "0 0 40px rgba(239,68,68,0.08)"
                    : isAgentResponding
                    ? "0 0 40px rgba(0,240,255,0.06)"
                    : "none"
                }}>
                {isRecording && (
                  <div className="absolute inset-0 rounded-2xl"
                    style={{ background: "radial-gradient(ellipse at center, rgba(239,68,68,0.04), transparent 70%)" }} />
                )}
                {isAgentResponding && (
                  <div className="absolute inset-0 rounded-2xl"
                    style={{ background: "radial-gradient(ellipse at center, rgba(0,240,255,0.04), transparent 70%)" }} />
                )}

                <span className="text-[9px] font-mono tracking-[0.2em] uppercase z-10"
                  style={{ color: isRecording ? "rgba(239,68,68,0.8)" : isAgentResponding ? "rgba(0,240,255,0.8)" : "rgba(255,255,255,0.3)" }}>
                  {isRecording ? "Listening..." : isAgentResponding ? "Responding" : "Ready"}
                </span>

                <Waveform isRecording={isRecording} isPlaying={voiceStream.playbackState === "playing"} className="z-10" />

                <button
                  onClick={toggleRecording}
                  disabled={voiceStream.playbackState === "playing"}
                  data-testid="button-mic"
                  className="relative w-16 h-16 rounded-full flex items-center justify-center z-10 transition-all duration-300"
                  style={isRecording ? {
                    background: "rgba(239,68,68,0.12)",
                    border: "1.5px solid rgba(239,68,68,0.5)",
                    boxShadow: "0 0 30px rgba(239,68,68,0.25)",
                  } : {
                    background: "rgba(0,240,255,0.08)",
                    border: "1.5px solid rgba(0,240,255,0.3)",
                    boxShadow: "0 0 20px rgba(0,240,255,0.12)",
                  }}
                >
                  {isRecording
                    ? <Square className="w-6 h-6 fill-current" style={{ color: "rgba(239,68,68,0.9)" }} />
                    : <Mic className="w-6 h-6" style={{ color: "rgba(0,240,255,0.9)" }} />
                  }
                </button>

                <p className="text-[11px] z-10" style={{ color: "rgba(255,255,255,0.3)" }}>
                  {isRecording ? "Tap to stop" : "Tap to speak"}
                </p>
              </div>

              <div className="rounded-2xl p-4 space-y-2.5"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-3 h-3" style={{ color: "rgba(138,43,226,0.7)" }} />
                  <span className="text-[9px] font-semibold uppercase tracking-widest"
                    style={{ color: "rgba(255,255,255,0.3)" }}>Link Status</span>
                </div>
                {[
                  { label: "Connection", value: "Stable", color: "rgba(34,197,94,0.8)" },
                  { label: "Latency", value: "~24ms", color: "rgba(0,240,255,0.7)" },
                  { label: "Auth", value: "Verified", color: "rgba(34,197,94,0.8)" },
                  { label: "Model", value: "gpt-audio", color: "rgba(138,43,226,0.8)" },
                ].map((s) => (
                  <div key={s.label} className="flex justify-between items-center">
                    <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>{s.label}</span>
                    <span className="text-[10px] font-mono" style={{ color: s.color }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
