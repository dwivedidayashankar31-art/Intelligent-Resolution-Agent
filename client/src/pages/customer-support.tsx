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
  Loader2, RefreshCcw, KeyRound, ShieldAlert, RefreshCw, Clock,
  ArrowRight, Sparkles, TrendingUp, Headphones
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

type Mode = "idle" | "voice" | "text";
type Message = { role: "user" | "assistant"; content: string };

const QUICK_SUGGESTIONS = [
  { icon: RefreshCcw, label: "Request a refund", text: "I'd like to request a refund for my recent order." },
  { icon: KeyRound, label: "Reset my password", text: "I can't log in and need to reset my password." },
  { icon: ShieldAlert, label: "Escalate issue", text: "This issue hasn't been resolved and I need to speak to a specialist." },
  { icon: RefreshCw, label: "Update account", text: "I need to update my account information." },
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
    onUserTranscript: (text) => setMessages((p) => [...p, { role: "user", content: text }]),
    onTranscript: (_, full) => { streamRef.current = full; setStreamingText(full); },
    onComplete: () => {
      setMessages((p) => [...p, { role: "assistant", content: streamRef.current }]);
      streamRef.current = ""; setStreamingText("");
      queryClient.invalidateQueries({ queryKey: ["/api/actions"] });
    },
  });

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, streamingText]);

  const startSession = async (selectedMode: "voice" | "text") => {
    try {
      const conv = await createConv.mutateAsync(selectedMode === "voice" ? "Voice Support Session" : "Text Support Session");
      setConversationId(conv.id); setMessages([]); setMode(selectedMode);
    } catch (e) { console.error(e); }
  };

  const toggleRecording = async () => {
    if (!conversationId) return;
    if (recorder.state === "recording") {
      const blob = await recorder.stopRecording();
      await voiceStream.streamVoiceResponse(`/api/conversations/${conversationId}/messages`, blob);
    } else { await recorder.startRecording(); }
  };

  const sendTextMessage = async (override?: string) => {
    const content = (override ?? textInput).trim();
    if (!content || !conversationId || isSending) return;
    setTextInput("");
    setMessages((p) => [...p, { role: "user", content }]);
    setIsSending(true); streamRef.current = "";
    try {
      const res = await fetch(`/api/conversations/${conversationId}/text-messages`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const reader = res.body?.getReader(); const decoder = new TextDecoder(); let buffer = "";
      while (reader) {
        const { done, value } = await reader.read(); if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n"); buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === "delta") { streamRef.current += event.data; setStreamingText(streamRef.current); }
            else if (event.type === "done") {
              setMessages((p) => [...p, { role: "assistant", content: event.full }]);
              setStreamingText(""); streamRef.current = "";
              queryClient.invalidateQueries({ queryKey: ["/api/actions"] });
              queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
            }
          } catch {}
        }
      }
    } catch (e) { console.error(e); }
    finally { setIsSending(false); }
  };

  const isAgentResponding = voiceStream.playbackState === "playing" || (isSending && streamingText.length > 0);
  const isRecording = recorder.state === "recording";

  if (mode === "idle") {
    return (
      <SidebarLayout>
        <div className="h-full flex" style={{ minHeight: 0 }}>

          {/* Left panel — hero */}
          <div className="flex-1 flex flex-col justify-center px-12 py-10 relative overflow-hidden">
            {/* Subtle gradient orbs */}
            <div className="absolute top-0 right-0 w-96 h-96 pointer-events-none"
              style={{ background: "radial-gradient(ellipse at top right, rgba(59,130,246,0.06) 0%, transparent 65%)" }} />
            <div className="absolute bottom-0 left-0 w-64 h-64 pointer-events-none"
              style={{ background: "radial-gradient(ellipse at bottom left, rgba(139,92,246,0.05) 0%, transparent 65%)" }} />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-xl relative z-10"
            >
              <div className="flex items-center gap-2 mb-8">
                <span className="badge badge-blue">
                  <span className="status-dot status-online w-1.5 h-1.5 animate-pulse-dot" />
                  AI Agent Online
                </span>
                <span className="badge badge-neutral">GPT-4o Audio</span>
              </div>

              <h1 className="font-bold text-white mb-4"
                style={{ fontSize: 42, letterSpacing: "-0.04em", lineHeight: 1.1 }}>
                Autonomous customer
                <br />
                <span className="text-gradient-blue">resolution agent</span>
              </h1>

              <p className="text-[15px] leading-relaxed mb-10" style={{ color: "rgba(255,255,255,0.45)" }}>
                Nexus handles refunds, password resets, CRM updates, and escalations in real time — via voice or text, instantly.
              </p>

              <div className="flex gap-3">
                <motion.button
                  onClick={() => startSession("voice")}
                  disabled={createConv.isPending}
                  data-testid="button-start-voice"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2.5 px-5 py-3 rounded-xl text-white font-semibold text-[13px]"
                  style={{
                    background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    boxShadow: "0 4px 20px rgba(59,130,246,0.3), inset 0 1px 0 rgba(255,255,255,0.15)",
                  }}
                >
                  <Headphones className="w-4 h-4" />
                  Start Voice Session
                </motion.button>

                <motion.button
                  onClick={() => startSession("text")}
                  disabled={createConv.isPending}
                  data-testid="button-start-text"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-ghost"
                  style={{ padding: "12px 20px", fontSize: 13 }}
                >
                  <MessageSquare className="w-4 h-4" />
                  Chat via Text
                  <ArrowRight className="w-3.5 h-3.5" />
                </motion.button>
              </div>

              {createConv.isPending && (
                <div className="flex items-center gap-2 mt-4 text-[12px]" style={{ color: "rgba(96,165,250,0.8)" }}>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Initializing secure channel...
                </div>
              )}

              <div className="grid grid-cols-4 gap-3 mt-10">
                {[
                  { label: "Refund Processing", desc: "Instant" },
                  { label: "Password Reset", desc: "Auto" },
                  { label: "CRM Sync", desc: "Real-time" },
                  { label: "Escalations", desc: "Smart" },
                ].map((f) => (
                  <div key={f.label} className="card-surface p-3.5">
                    <div className="text-[11px] font-semibold text-white/70 mb-0.5">{f.label}</div>
                    <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{f.desc}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right panel — sidebar info */}
          <div className="w-64 shrink-0 flex flex-col gap-3 px-5 py-6 overflow-y-auto scrollbar-hide"
            style={{ borderLeft: "1px solid rgba(255,255,255,0.065)" }}>

            {stats && (
              <motion.div
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <p className="section-label mb-3">Live metrics</p>
                <div className="space-y-2">
                  {[
                    { label: "Customers", value: stats.customers, color: "#60A5FA" },
                    { label: "Open Tickets", value: stats.openTickets, color: "#FBBF24" },
                    { label: "Escalated", value: stats.escalated, color: "#F87171" },
                    { label: "Resolved", value: stats.resolved, color: "#4ADE80" },
                    { label: "AI Actions", value: stats.actions, color: "#A78BFA" },
                  ].map((s) => (
                    <div key={s.label} className="flex items-center justify-between py-2 px-3 rounded-lg"
                      style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.055)" }}>
                      <span className="text-[12px]" style={{ color: "rgba(255,255,255,0.45)" }}>{s.label}</span>
                      <span className="text-[13px] font-bold tabular-nums" style={{ color: s.color }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            <div className="divider my-1" />

            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
            >
              <p className="section-label mb-3">Recent sessions</p>
              {conversations && conversations.length > 0 ? (
                <div className="space-y-1">
                  {[...(conversations as any[])].reverse().slice(0, 8).map((c: any) => (
                    <div key={c.id} data-testid={`session-${c.id}`}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors duration-150 cursor-default"
                      style={{ border: "1px solid transparent" }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "transparent";
                        (e.currentTarget as HTMLElement).style.borderColor = "transparent";
                      }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "rgba(96,165,250,0.5)" }} />
                      <div className="min-w-0">
                        <div className="text-[11px] font-medium text-white/60 truncate">{c.title}</div>
                        <div className="text-[9px] font-mono mt-0.5" style={{ color: "rgba(255,255,255,0.22)" }}>
                          {c.createdAt ? formatDistanceToNow(new Date(c.createdAt), { addSuffix: true }) : `#${c.id}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-3 py-4 text-center">
                  <Clock className="w-5 h-5 mx-auto mb-1.5" style={{ color: "rgba(255,255,255,0.15)" }} />
                  <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.25)" }}>No sessions yet</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="flex flex-col h-full">
        {/* Session header */}
        <div className="shrink-0 flex items-center justify-between px-6 h-[52px]"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.065)", background: "rgba(255,255,255,0.01)" }}>
          <div className="flex items-center gap-3">
            <div className={cn("status-dot", isRecording ? "status-busy" : isAgentResponding ? "status-away animate-pulse-dot" : "status-online")} />
            <span className="text-[12px] font-mono" style={{ color: "rgba(255,255,255,0.4)" }}>
              Session #{conversationId} · {mode === "voice" ? "Voice" : "Text"} Mode
            </span>
            {isAgentResponding && (
              <span className="badge badge-blue text-[10px]">
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
                Nexus responding
              </span>
            )}
          </div>
          <button
            onClick={() => { setMode("idle"); setConversationId(null); setMessages([]); }}
            data-testid="button-end-session"
            className="btn-ghost text-[12px]"
            style={{ padding: "6px 12px" }}
          >
            ← New Session
          </button>
        </div>

        {/* Main chat area */}
        <div className="flex-1 flex min-h-0">
          {/* Messages */}
          <div className="flex-1 flex flex-col min-w-0">
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {messages.length === 0 && !streamingText && (
                <div className="flex flex-col items-center justify-center h-full gap-5 text-center py-10">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{
                      background: "rgba(59,130,246,0.08)",
                      border: "1px solid rgba(59,130,246,0.15)"
                    }}>
                    <Bot className="w-7 h-7" style={{ color: "rgba(96,165,250,0.7)" }} />
                  </div>
                  <div>
                    <p className="font-semibold text-white/75 mb-1 text-[14px]">Nexus AI is ready</p>
                    <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                      {mode === "voice" ? "Press the mic button to start talking" : "Describe your issue or pick a quick action"}
                    </p>
                  </div>
                  {mode === "text" && (
                    <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
                      {QUICK_SUGGESTIONS.map((s) => (
                        <button
                          key={s.label}
                          onClick={() => sendTextMessage(s.text)}
                          data-testid={`chip-${s.label.toLowerCase().replace(/\s+/g, "-")}`}
                          className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-left card-surface-hover"
                        >
                          <s.icon className="w-3.5 h-3.5 shrink-0" style={{ color: "rgba(96,165,250,0.6)" }} />
                          <span className="text-[11px] font-medium text-white/55">{s.label}</span>
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
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className={cn("flex gap-3 max-w-[80%]", msg.role === "user" ? "ml-auto flex-row-reverse" : "")}
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={msg.role === "user"
                        ? { background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.2)" }
                        : { background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.18)" }}>
                      {msg.role === "user"
                        ? <User className="w-3.5 h-3.5" style={{ color: "rgba(196,181,253,0.85)" }} />
                        : <Bot className="w-3.5 h-3.5" style={{ color: "rgba(96,165,250,0.85)" }} />}
                    </div>
                    <div className="px-4 py-3 rounded-xl text-[13px] leading-relaxed"
                      style={msg.role === "user" ? {
                        background: "rgba(139,92,246,0.08)",
                        border: "1px solid rgba(139,92,246,0.14)",
                        borderTopRightRadius: 4,
                        color: "rgba(255,255,255,0.83)"
                      } : {
                        background: "rgba(255,255,255,0.035)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderTopLeftRadius: 4,
                        color: "rgba(255,255,255,0.83)"
                      }}>
                      {msg.content}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {streamingText && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 max-w-[80%]">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.18)" }}>
                    <Bot className="w-3.5 h-3.5 animate-pulse" style={{ color: "rgba(96,165,250,0.85)" }} />
                  </div>
                  <div className="px-4 py-3 rounded-xl text-[13px] leading-relaxed"
                    style={{
                      background: "rgba(255,255,255,0.035)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderTopLeftRadius: 4,
                      color: "rgba(255,255,255,0.83)"
                    }}>
                    {streamingText}
                    <span className="inline-block w-0.5 h-[14px] ml-1 rounded-sm align-middle animate-cursor"
                      style={{ background: "rgba(96,165,250,0.8)" }} />
                  </div>
                </motion.div>
              )}
            </div>

            {mode === "text" && (
              <div className="shrink-0 px-6 py-4 space-y-3"
                style={{ borderTop: "1px solid rgba(255,255,255,0.065)", background: "rgba(255,255,255,0.01)" }}>
                {messages.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
                    {QUICK_SUGGESTIONS.map((s) => (
                      <button key={s.label} onClick={() => sendTextMessage(s.text)} disabled={isSending}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] whitespace-nowrap transition-all duration-150"
                        style={{
                          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                          color: "rgba(255,255,255,0.4)"
                        }}>
                        <s.icon className="w-3 h-3" style={{ color: "rgba(96,165,250,0.5)" }} />
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex gap-2.5 items-end">
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendTextMessage(); } }}
                    disabled={isSending}
                    data-testid="input-message"
                    placeholder="Describe your issue… (Enter to send)"
                    className="input-field flex-1 resize-none"
                    style={{ height: 44 }}
                    rows={1}
                  />
                  <Button
                    onClick={() => sendTextMessage()}
                    disabled={!textInput.trim() || isSending}
                    size="icon"
                    data-testid="button-send"
                    className="shrink-0 h-11 w-11 rounded-xl"
                  >
                    {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Voice panel */}
          {mode === "voice" && (
            <div className="w-56 shrink-0 flex flex-col gap-4 p-5"
              style={{ borderLeft: "1px solid rgba(255,255,255,0.065)" }}>
              <div className="flex-1 flex flex-col items-center justify-center gap-5 rounded-xl py-8"
                style={{
                  background: isRecording
                    ? "rgba(239,68,68,0.04)"
                    : isAgentResponding
                    ? "rgba(59,130,246,0.04)"
                    : "rgba(255,255,255,0.02)",
                  border: isRecording
                    ? "1px solid rgba(239,68,68,0.18)"
                    : isAgentResponding
                    ? "1px solid rgba(59,130,246,0.18)"
                    : "1px solid rgba(255,255,255,0.07)",
                  transition: "all 0.35s ease"
                }}>
                <p className="section-label">
                  {isRecording ? "Listening..." : isAgentResponding ? "Responding" : "Ready"}
                </p>
                <Waveform isRecording={isRecording} isPlaying={voiceStream.playbackState === "playing"} />
                <button
                  onClick={toggleRecording}
                  disabled={voiceStream.playbackState === "playing"}
                  data-testid="button-mic"
                  className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300"
                  style={isRecording ? {
                    background: "rgba(239,68,68,0.12)", border: "1.5px solid rgba(239,68,68,0.45)",
                    boxShadow: "0 0 24px rgba(239,68,68,0.2)"
                  } : {
                    background: "rgba(59,130,246,0.1)", border: "1.5px solid rgba(59,130,246,0.35)",
                    boxShadow: "0 0 16px rgba(59,130,246,0.15)"
                  }}
                >
                  {isRecording
                    ? <Square className="w-5 h-5 fill-current" style={{ color: "#F87171" }} />
                    : <Mic className="w-5 h-5" style={{ color: "#60A5FA" }} />}
                </button>
                <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                  {isRecording ? "Tap to stop" : "Tap to speak"}
                </p>
              </div>

              <div className="rounded-xl p-4 space-y-2.5"
                style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <p className="section-label mb-2">Connection</p>
                {[
                  { label: "Status", value: "Stable", color: "#4ADE80" },
                  { label: "Latency", value: "~24ms", color: "#60A5FA" },
                  { label: "Auth", value: "Verified", color: "#4ADE80" },
                  { label: "Model", value: "gpt-audio", color: "#A78BFA" },
                ].map((s) => (
                  <div key={s.label} className="flex justify-between items-center">
                    <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>{s.label}</span>
                    <span className="text-[10px] font-mono font-medium" style={{ color: s.color }}>{s.value}</span>
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
