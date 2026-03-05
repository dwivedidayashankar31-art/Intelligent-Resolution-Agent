import { useState, useRef, useEffect } from "react";
import { useVoiceRecorder, useVoiceStream } from "@/replit_integrations/audio";
import { useCreateConversation, useConversation } from "@/hooks/use-voice";
import { useQueryClient } from "@tanstack/react-query";
import { SidebarLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Waveform } from "@/components/waveform";
import { Mic, Square, Loader2, User, Bot, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function CustomerSupport() {
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [localTranscript, setLocalTranscript] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [streamingText, setStreamingText] = useState("");
  
  const queryClient = useQueryClient();
  const createConv = useCreateConversation();
  const { data: conversation, isLoading: isLoadingHistory } = useConversation(activeConversationId);
  
  const recorder = useVoiceRecorder();
  
  const stream = useVoiceStream({
    onUserTranscript: (text) => {
      setLocalTranscript(prev => [...prev, { role: 'user', content: text }]);
    },
    onTranscript: (text, full) => {
      setStreamingText(full);
    },
    onComplete: () => {
      setLocalTranscript(prev => [...prev, { role: 'assistant', content: streamingText }]);
      setStreamingText("");
      if (activeConversationId) {
        queryClient.invalidateQueries({ queryKey: ["/api/conversations", activeConversationId] });
      }
    },
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [localTranscript, streamingText, conversation]);

  const handleStartSession = async () => {
    try {
      const conv = await createConv.mutateAsync("Voice Support Session");
      setActiveConversationId(conv.id);
      setLocalTranscript([]);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleRecording = async () => {
    if (!activeConversationId) return;
    
    if (recorder.state === "recording") {
      try {
        const blob = await recorder.stopRecording();
        await stream.streamVoiceResponse(`/api/conversations/${activeConversationId}/messages`, blob);
      } catch (e) {
        console.error("Streaming failed:", e);
      }
    } else {
      await recorder.startRecording();
    }
  };

  // Combine DB messages and local optimistic ones
  const displayMessages = [...(conversation?.messages || [])].map(m => ({
    role: m.role, content: m.content
  }));
  
  // If we have local ones that aren't in DB yet, append them (simplified sync)
  const unseenLocal = localTranscript.slice(Math.max(0, displayMessages.length - (conversation?.messages?.length || 0)));

  return (
    <SidebarLayout>
      <div className="h-full flex flex-col max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold neon-text">AI Voice Support</h1>
          <p className="text-muted-foreground mt-2">Speak naturally. The multimodal agent can process requests and execute CRM actions.</p>
        </div>

        {!activeConversationId ? (
          <div className="flex-1 flex items-center justify-center">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-panel p-12 rounded-3xl text-center max-w-md w-full relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
              <Bot className="w-16 h-16 text-primary mx-auto mb-6 drop-shadow-[0_0_15px_rgba(0,240,255,0.5)]" />
              <h2 className="text-2xl font-bold mb-4">Initialize Agent Link</h2>
              <p className="text-muted-foreground mb-8 text-sm">
                Establish a secure voice channel with the Nexus AI support agent.
              </p>
              <Button 
                size="lg" 
                className="w-full text-lg shadow-[0_0_30px_rgba(0,240,255,0.2)]" 
                onClick={handleStartSession}
                isLoading={createConv.isPending}
              >
                Start Secure Session
              </Button>
            </motion.div>
          </div>
        ) : (
          <div className="flex-1 flex gap-6 h-[calc(100%-8rem)]">
            {/* Left: Controls & Visuals */}
            <div className="w-1/3 flex flex-col gap-6">
              <div className="glass-panel p-6 rounded-3xl flex-1 flex flex-col items-center justify-center relative overflow-hidden">
                <div className={cn(
                  "absolute inset-0 transition-opacity duration-1000",
                  recorder.state === "recording" ? "bg-red-500/5" : 
                  stream.playbackState === "playing" ? "bg-primary/5" : "bg-transparent"
                )} />
                
                <h3 className="text-sm font-mono tracking-widest text-muted-foreground mb-12 uppercase">
                  {recorder.state === "recording" ? "Receiving Audio..." : 
                   stream.playbackState === "playing" ? "Agent Speaking" : "Channel Open"}
                </h3>

                <Waveform 
                  isRecording={recorder.state === "recording"}
                  isPlaying={stream.playbackState === "playing"}
                  className="mb-16 transform scale-150"
                />

                <Button
                  onClick={toggleRecording}
                  variant={recorder.state === "recording" ? "destructive" : "primary"}
                  className={cn(
                    "w-24 h-24 rounded-full transition-all duration-300",
                    recorder.state === "recording" ? "animate-pulse" : ""
                  )}
                >
                  {recorder.state === "recording" ? (
                    <Square className="w-8 h-8 fill-current" />
                  ) : (
                    <Mic className="w-10 h-10" />
                  )}
                </Button>
              </div>

              <div className="glass-panel p-6 rounded-3xl">
                <div className="flex items-center gap-3 mb-4">
                  <Activity className="w-5 h-5 text-secondary" />
                  <h3 className="font-semibold">System Status</h3>
                </div>
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Link</span>
                    <span className="text-green-400">Stable</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Latency</span>
                    <span className="text-primary">24ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Auth</span>
                    <span className="text-green-400">Verified</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Transcript */}
            <div className="flex-1 glass-panel rounded-3xl flex flex-col overflow-hidden border border-white/10">
              <div className="p-4 border-b border-white/10 bg-black/20 flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Bot className="w-4 h-4 text-primary" />
                  Live Transcript
                </h3>
                <span className="text-xs font-mono text-muted-foreground">ID: {activeConversationId}</span>
              </div>
              
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
                {isLoadingHistory ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    {[...displayMessages, ...unseenLocal].map((msg, i) => (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={i} 
                        className={cn(
                          "flex gap-4 max-w-[85%]",
                          msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                          msg.role === 'user' ? "bg-secondary/20 border border-secondary/50" : "bg-primary/20 border border-primary/50"
                        )}>
                          {msg.role === 'user' ? <User className="w-4 h-4 text-secondary" /> : <Bot className="w-4 h-4 text-primary" />}
                        </div>
                        <div className={cn(
                          "p-4 rounded-2xl text-sm leading-relaxed",
                          msg.role === 'user' 
                            ? "bg-secondary/10 border border-secondary/20 text-foreground rounded-tr-sm" 
                            : "bg-white/5 border border-white/10 text-foreground rounded-tl-sm"
                        )}>
                          {msg.content}
                        </div>
                      </motion.div>
                    ))}
                    
                    {streamingText && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex gap-4 max-w-[85%]"
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/50 flex items-center justify-center shrink-0">
                          <Bot className="w-4 h-4 text-primary animate-pulse" />
                        </div>
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-foreground rounded-tl-sm text-sm leading-relaxed border-l-primary/50">
                          {streamingText}
                          <span className="inline-block w-1.5 h-4 ml-1 bg-primary animate-pulse align-middle" />
                        </div>
                      </motion.div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
