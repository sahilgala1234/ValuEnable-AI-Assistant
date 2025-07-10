import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  userId: integer("user_id"),
  startTime: timestamp("start_time").notNull().defaultNow(),
  endTime: timestamp("end_time"),
  messageCount: integer("message_count").default(0),
  duration: integer("duration").default(0), // in seconds
  status: text("status").notNull().default("active"), // active, completed, error
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull(),
  type: text("type").notNull(), // user, ai, system
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  voiceData: jsonb("voice_data"), // audio metadata, transcription confidence, etc.
  responseTime: integer("response_time"), // AI response time in ms
  metadata: jsonb("metadata"), // additional data like confidence scores, etc.
});

export const knowledgeBaseEntries = pgTable("knowledge_base_entries", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  keywords: text("keywords").array(),
  priority: integer("priority").default(1),
  isActive: boolean("is_active").default(true),
});

// Define relations
export const conversationsRelations = relations(conversations, ({ many }) => ({
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertConversationSchema = createInsertSchema(conversations).pick({
  sessionId: true,
  userId: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  conversationId: true,
  type: true,
  content: true,
  voiceData: true,
  responseTime: true,
  metadata: true,
});

export const insertKnowledgeBaseSchema = createInsertSchema(knowledgeBaseEntries).pick({
  category: true,
  question: true,
  answer: true,
  keywords: true,
  priority: true,
  isActive: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertKnowledgeBase = z.infer<typeof insertKnowledgeBaseSchema>;
export type KnowledgeBase = typeof knowledgeBaseEntries.$inferSelect;

// API response types
export type ConversationWithMessages = Conversation & {
  messages: Message[];
};

export type VoiceTranscriptionResponse = {
  text: string;
  confidence: number;
  duration: number;
};

export type AIResponse = {
  message: string;
  confidence: number;
  responseTime: number;
  sources?: string[];
};
