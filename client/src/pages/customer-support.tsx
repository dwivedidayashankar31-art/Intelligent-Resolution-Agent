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
  Loader2, RefreshCcw, KeyRound, ShieldAlert, RefreshCw, Clock, Plus
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
        <div className="h-full flex gap-6">
          {/* Left: Session history */}
          <div className="w-64 shrink-0 flex flex-col gap-4">
            <div className="glass-panel rounded-2xl overflow-hidden flex flex-col">
              <div className="p-4 border-b border-white/10 bg-black/20 flex items-center gap-2">
                <Clock className="w-4 h-4 text-secondary" />
                <span className="text-sm font-semibold">Past Sessions</span>
              </div>
              <div className="flex-1 overflow-y-auto max-h-72">
                {conversations && conversations.length > 0 ? (
                  <div className="p-2 space-y-1">
                    {[...(conversations as any[])].reverse().slice(0, 12).map((c: any) => (
                      <div
                        key={c.id}
                        data-testid={`session-${c.id}`}
                        className="flex items-start gap-2 p-2.5 rounded-xl hover:bg-white/5 transition-colors cursor-default"
                      >
                        <div className="w-2 h-2 rounded-full bg-primary/60 shrink-0 mt-1.5" />
                        <div className="min-w-0">
                          <div className="text-xs font-medium truncate">{c.title}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">
                            {c.createdAt ? formatDistanceToNow(new Date(c.createdAt), { addSuffix: true }) : "#" + c.id}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-muted-foreground">No sessions yet</div>
                )}
              </div>
            </div>

            {/* Live stats mini-panel */}
            {stats && (
              <div className="glass-panel rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-semibold">System Metrics</span>
                </div>
                {[
                  { label: "Customers", value: stats.customers, color: "text-foreground" },
                  { label: "Open Tickets", value: stats.openTickets, color: "text-primary" },
                  { label: "Escalated", value: stats.escalated, color: "text-red-400" },
                  { label: "Resolved", value: stats.resolved, color: "text-green-400" },
                  { label: "AI Actions", value: stats.actions, color: "text-secondary" },
                ].map((s) => (
                  <div key={s.label} className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">{s.label}</span>
                    <span className={cn("text-xs font-mono font-bold", s.color)}>{s.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Center: Main launch UI */}
          <div className="flex-1 flex flex-col items-center justify-center gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-xl"
            >
              <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/40 flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(0,240,255,0.2)]">
                <Bot className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-4xl font-display font-bold mb-3">Nexus AI Agent</h1>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Autonomous customer resolution. Handles refunds, resets, CRM updates, and escalations in real time.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex gap-4"
            >
              <button
                onClick={() => startSession("voice")}
                disabled={createConv.isPending}
                data-testid="button-start-voice"
                className="group flex flex-col items-center gap-4 p-8 rounded-3xl glass-panel border border-white/10 hover:border-primary/40 transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,240,255,0.1)] w-52"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Phone className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <div className="font-bold text-foreground mb-1">Voice Mode</div>
                  <div className="text-xs text-muted-foreground">Speak naturally with the agent</div>
                </div>
              </button>

              <button
                onClick={() => startSession("text")}
                disabled={createConv.isPending}
                data-testid="button-start-text"
                className="group flex flex-col items-center gap-4 p-8 rounded-3xl glass-panel border border-white/10 hover:border-secondary/40 transition-all duration-300 hover:shadow-[0_0_30px_rgba(138,43,226,0.1)] w-52"
              >
                <div className="w-14 h-14 rounded-2xl bg-secondary/10 border border-secondary/30 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                  <MessageSquare className="w-7 h-7 text-secondary" />
                </div>
                <div>
                  <div className="font-bold text-foreground mb-1">Text Mode</div>
                  <div className="text-xs text-muted-foreground">Chat with the agent via text</div>
                </div>
              </button>
            </motion.div>

            {createConv.isPending && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Initializing secure channel...
              </div>
            )}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-2xl"
            >
              {[
                { label: "Refund Processing", desc: "Instant" },
                { label: "Password Reset", desc: "Account recovery" },
                { label: "CRM Updates", desc: "Real-time sync" },
                { label: "Smart Escalation", desc: "Human handoff" },
              ].map((cap) => (
                <div key={cap.label} className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                  <div className="text-primary font-semibold text-sm mb-1">{cap.label}</div>
                  <div className="text-muted-foreground text-xs">{cap.desc}</div>
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
        {/* Header */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-2.5 h-2.5 rounded-full",
              isRecording ? "bg-red-500 animate-pulse" :
              isAgentResponding ? "bg-primary animate-pulse" :
              "bg-green-400"
            )} />
            <span className="font-mono text-sm text-muted-foreground">
              Session #{conversationId} · {mode === "voice" ? "Voice" : "Text"} Mode
            </span>
          </div>
          <button
            onClick={() => { setMode("idle"); setConversationId(null); setMessages([]); }}
            data-testid="button-end-session"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10"
          >
            ← New Session
          </button>
        </div>

        <div className="flex-1 flex gap-4 min-h-0">
          {/* Main chat/voice panel */}
          <div className="flex-1 glass-panel rounded-2xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-white/10 bg-black/20 flex items-center gap-2">
              <Bot className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">Live Transcript</span>
              {isAgentResponding && (
                <span className="ml-auto text-xs text-primary font-mono flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                  Nexus is responding...
                </span>
              )}
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-5">
              {messages.length === 0 && !streamingText && (
                <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
                  <div className="space-y-2">
                    <Bot className="w-10 h-10 text-primary/40 mx-auto" />
                    <p className="text-muted-foreground text-sm">
                      {mode === "voice" ? "Press the mic button to start talking..." : "Describe your issue below or pick a quick option:"}
                    </p>
                  </div>
                  {mode === "text" && (
                    <div className="grid grid-cols-2 gap-2 w-full max-w-md">
                      {QUICK_SUGGESTIONS.map((s) => (
                        <button
                          key={s.label}
                          onClick={() => sendTextMessage(s.text)}
                          data-testid={`chip-${s.label.toLowerCase().replace(/\s+/g, "-")}`}
                          className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/30 transition-all text-left"
                        >
                          <s.icon className="w-4 h-4 text-primary shrink-0" />
                          <span className="text-xs font-medium">{s.label}</span>
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
                    className={cn(
                      "flex gap-3 max-w-[88%]",
                      msg.role === "user" ? "ml-auto flex-row-reverse" : ""
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                      msg.role === "user"
                        ? "bg-secondary/20 border border-secondary/40"
                        : "bg-primary/20 border border-primary/40"
                    )}>
                      {msg.role === "user"
                        ? <User className="w-4 h-4 text-secondary" />
                        : <Bot className="w-4 h-4 text-primary" />
                      }
                    </div>
                    <div className={cn(
                      "px-4 py-3 rounded-2xl text-sm leading-relaxed",
                      msg.role === "user"
                        ? "bg-secondary/10 border border-secondary/20 rounded-tr-sm"
                        : "bg-white/5 border border-white/10 rounded-tl-sm"
                    )}>
                      {msg.content}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {streamingText && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 max-w-[88%]"
                >
                  <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-primary animate-pulse" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 rounded-tl-sm text-sm leading-relaxed">
                    {streamingText}
                    <span className="inline-block w-1 h-4 ml-1 bg-primary animate-pulse align-middle rounded-sm" />
                  </div>
                </motion.div>
              )}
            </div>

            {/* Text input */}
            {mode === "text" && (
              <div className="p-4 border-t border-white/10 bg-black/20 space-y-3">
                {messages.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {QUICK_SUGGESTIONS.map((s) => (
                      <button
                        key={s.label}
                        onClick={() => sendTextMessage(s.text)}
                        disabled={isSending}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-primary/30 transition-all text-xs whitespace-nowrap"
                      >
                        <s.icon className="w-3 h-3 text-primary" />
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
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 resize-none h-12"
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

          {/* Voice controls panel */}
          {mode === "voice" && (
            <div className="w-56 flex flex-col gap-4">
              <div className="glass-panel rounded-2xl flex-1 flex flex-col items-center justify-center gap-6 p-6 relative overflow-hidden">
                <div className={cn(
                  "absolute inset-0 transition-opacity duration-700",
                  isRecording ? "bg-red-500/5" :
                  isAgentResponding ? "bg-primary/5" : "bg-transparent"
                )} />

                <span className="text-xs font-mono tracking-widest text-muted-foreground uppercase z-10">
                  {isRecording ? "Listening..." :
                   isAgentResponding ? "Responding" : "Ready"}
                </span>

                <Waveform
                  isRecording={isRecording}
                  isPlaying={voiceStream.playbackState === "playing"}
                  className="z-10"
                />

                <button
                  onClick={toggleRecording}
                  disabled={voiceStream.playbackState === "playing"}
                  data-testid="button-mic"
                  className={cn(
                    "w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 z-10",
                    isRecording
                      ? "bg-red-500/20 border-2 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)] animate-pulse"
                      : "bg-primary/10 border-2 border-primary/50 shadow-[0_0_20px_rgba(0,240,255,0.2)] hover:shadow-[0_0_30px_rgba(0,240,255,0.4)]",
                    voiceStream.playbackState === "playing" ? "opacity-40 cursor-not-allowed" : ""
                  )}
                >
                  {isRecording
                    ? <Square className="w-7 h-7 text-red-400 fill-current" />
                    : <Mic className="w-7 h-7 text-primary" />
                  }
                </button>

                <p className="text-xs text-muted-foreground text-center z-10">
                  {isRecording ? "Tap to stop" : "Tap to speak"}
                </p>
              </div>

              <div className="glass-panel rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-3.5 h-3.5 text-secondary" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Link Status</span>
                </div>
                {[
                  { label: "Connection", value: "Stable", color: "text-green-400" },
                  { label: "Latency", value: "~24ms", color: "text-primary" },
                  { label: "Auth", value: "Verified", color: "text-green-400" },
                  { label: "Model", value: "gpt-audio", color: "text-secondary" },
                ].map((s) => (
                  <div key={s.label} className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground font-mono">{s.label}</span>
                    <span className={cn("text-xs font-mono", s.color)}>{s.value}</span>
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
