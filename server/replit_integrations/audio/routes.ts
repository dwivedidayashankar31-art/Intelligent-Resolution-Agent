import express, { type Express, type Request, type Response } from "express";
import { chatStorage } from "../chat/storage";
import { openai, speechToText, ensureCompatibleFormat } from "./client";
import { db } from "../../db";
import { customers, tickets, agentActions } from "@shared/schema";

const audioBodyParser = express.json({ limit: "50mb" });

async function buildSystemPrompt(): Promise<string> {
  let context = "";
  try {
    const [allCustomers, allTickets] = await Promise.all([
      db.select().from(customers).limit(20),
      db.select().from(tickets).limit(30),
    ]);
    const ticketLines = allTickets.map((t) => {
      const customer = allCustomers.find((c) => c.id === t.customerId);
      return `  - Ticket #${t.id} [${t.status.toUpperCase()}]: "${t.title}" — Customer: ${customer?.name ?? "Unknown"} (${customer?.email ?? ""})`;
    }).join("\n");
    context = `\n\nCURRENT CRM DATA (use this to help customers by name and ticket):\nCustomers: ${allCustomers.length} registered\nOpen/Escalated Tickets:\n${ticketLines}`;
  } catch {
    context = "";
  }
  return `You are Nexus, an elite AI customer resolution agent for a large e-commerce platform.
You speak naturally, confidently, and empathetically. You can:
- Issue refunds for verified orders (say "I've processed that refund" when you do)
- Reset customer passwords (say "Your password has been reset" when you do)
- Update CRM records (say "I've updated your account" when you do)
- Escalate complex issues to human specialists (say "I'm escalating this to our specialist team" when you do)
- Explain order statuses and tracking
- Handle billing disputes

Always introduce yourself as Nexus on the first message. Be concise but warm.
When you take an action, explicitly confirm it with a specific phrase so the system can detect it.
If a customer seems angry, de-escalate with empathy first before offering solutions.
Keep responses under 3 sentences — the user may be on a voice call.${context}`;
}

export function registerAudioRoutes(app: Express): void {
  app.get("/api/conversations", async (req: Request, res: Response) => {
    try {
      const conversations = await chatStorage.getAllConversations();
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  app.get("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const conversation = await chatStorage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      const messages = await chatStorage.getMessagesByConversation(id);
      res.json({ ...conversation, messages });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  app.post("/api/conversations", async (req: Request, res: Response) => {
    try {
      const { title } = req.body;
      const conversation = await chatStorage.createConversation(title || "Support Session");
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  app.delete("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await chatStorage.deleteConversation(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  // Text-based chat with streaming SSE
  app.post("/api/conversations/:id/text-messages", express.json(), async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { content } = req.body;
      if (!content) return res.status(400).json({ error: "Content is required" });

      await chatStorage.createMessage(conversationId, "user", content);
      const existingMessages = await chatStorage.getMessagesByConversation(conversationId);
      const chatHistory = existingMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const systemPrompt = await buildSystemPrompt();
      const stream = await openai.chat.completions.create({
        model: "gpt-5-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...chatHistory,
        ],
        stream: true,
        max_completion_tokens: 8192,
      });

      let fullResponse = "";
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || "";
        if (text) {
          fullResponse += text;
          res.write(`data: ${JSON.stringify({ type: "delta", data: text })}\n\n`);
        }
      }

      await chatStorage.createMessage(conversationId, "assistant", fullResponse);

      // Detect and auto-log actions
      await detectAndLogAction(fullResponse, conversationId);

      res.write(`data: ${JSON.stringify({ type: "done", full: fullResponse })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Text message error:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ type: "error", error: "Failed" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to process message" });
      }
    }
  });

  // Voice message with streaming SSE audio
  app.post("/api/conversations/:id/messages", audioBodyParser, async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { audio, voice = "alloy" } = req.body;

      if (!audio) return res.status(400).json({ error: "Audio data (base64) is required" });

      const rawBuffer = Buffer.from(audio, "base64");
      const { buffer: audioBuffer, format: inputFormat } = await ensureCompatibleFormat(rawBuffer);
      const userTranscript = await speechToText(audioBuffer, inputFormat);

      await chatStorage.createMessage(conversationId, "user", userTranscript);
      const existingMessages = await chatStorage.getMessagesByConversation(conversationId);
      const chatHistory = existingMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      res.write(`data: ${JSON.stringify({ type: "user_transcript", data: userTranscript })}\n\n`);

      const systemPrompt = await buildSystemPrompt();
      const stream = await openai.chat.completions.create({
        model: "gpt-audio",
        modalities: ["text", "audio"],
        audio: { voice, format: "pcm16" },
        messages: [
          { role: "system", content: systemPrompt },
          ...chatHistory,
        ],
        stream: true,
      });

      let assistantTranscript = "";
      for await (const chunk of stream) {
        const delta = chunk.choices?.[0]?.delta as any;
        if (!delta) continue;
        if (delta?.audio?.transcript) {
          assistantTranscript += delta.audio.transcript;
          res.write(`data: ${JSON.stringify({ type: "transcript", data: delta.audio.transcript })}\n\n`);
        }
        if (delta?.audio?.data) {
          res.write(`data: ${JSON.stringify({ type: "audio", data: delta.audio.data })}\n\n`);
        }
      }

      await chatStorage.createMessage(conversationId, "assistant", assistantTranscript);
      await detectAndLogAction(assistantTranscript, conversationId);

      res.write(`data: ${JSON.stringify({ type: "done", transcript: assistantTranscript })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Voice message error:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ type: "error", error: "Failed to process voice" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to process voice message" });
      }
    }
  });
}

async function detectAndLogAction(text: string, conversationId: number) {
  const lower = text.toLowerCase();
  let actionType: string | null = null;

  if (lower.includes("refund") && (lower.includes("processed") || lower.includes("issued") || lower.includes("initiated"))) {
    actionType = "refund";
  } else if (lower.includes("password") && (lower.includes("reset") || lower.includes("sent"))) {
    actionType = "password_reset";
  } else if (lower.includes("escalat") && (lower.includes("human") || lower.includes("specialist") || lower.includes("team"))) {
    actionType = "escalate";
  } else if (lower.includes("updated") && (lower.includes("record") || lower.includes("account") || lower.includes("crm") || lower.includes("information"))) {
    actionType = "update_crm";
  }

  if (actionType) {
    try {
      const allTickets = await db.select().from(tickets).limit(1);
      const ticketId = allTickets[0]?.id ?? null;
      await db.insert(agentActions).values({
        ticketId,
        actionType,
        details: `Auto-detected from AI response (conversation #${conversationId}): "${text.substring(0, 150)}..."`,
      });
    } catch (e) {
      console.error("Failed to log action:", e);
    }
  }
}
