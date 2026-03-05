import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface WaveformProps {
  isRecording?: boolean;
  isPlaying?: boolean;
  className?: string;
}

export function Waveform({ isRecording, isPlaying, className }: WaveformProps) {
  const bars = Array.from({ length: 15 });
  const active = isRecording || isPlaying;

  return (
    <div className={cn("flex items-center gap-1 h-12", className)}>
      {bars.map((_, i) => (
        <motion.div
          key={i}
          className={cn(
            "w-1.5 rounded-full transition-colors duration-500",
            isRecording ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]" : 
            isPlaying ? "bg-primary shadow-[0_0_10px_rgba(0,240,255,0.6)]" : 
            "bg-muted-foreground/30"
          )}
          animate={{
            height: active ? ["20%", "100%", "20%"] : "20%",
          }}
          transition={{
            duration: active ? 0.5 + Math.random() * 0.5 : 1,
            repeat: active ? Infinity : 0,
            ease: "easeInOut",
            delay: active ? Math.random() * 0.2 : 0,
          }}
        />
      ))}
    </div>
  );
}
