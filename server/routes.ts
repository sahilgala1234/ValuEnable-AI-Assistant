import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { openAIService } from "./services/openai";
import { speechService } from "./services/speechService";
import { insertConversationSchema, insertMessageSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Start a new conversation
  app.post("/api/conversations", async (req, res) => {
    try {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const conversationData = { sessionId, userId: null };
      
      const conversation = await storage.createConversation(conversationData);
      
      // Add welcome message
      await storage.createMessage({
        conversationId: conversation.id,
        type: "ai",
        content: "Hello! I'm your ValuEnable AI assistant. I can help you with insurance queries, policy information, claims, and more. Feel free to ask me anything or use voice input to start a conversation.",
        responseTime: 0
      });
      
      res.json(conversation);
    } catch (error) {
      console.error('Error creating conversation:', error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  // Get conversation with messages
  app.get("/api/conversations/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const conversation = await storage.getConversationWithMessages(sessionId);
      
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      res.json(conversation);
    } catch (error) {
      console.error('Error getting conversation:', error);
      res.status(500).json({ error: "Failed to get conversation" });
    }
  });

  // Send a text message
  app.post("/api/conversations/:sessionId/messages", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { content } = req.body;
      
      if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: "Message content is required" });
      }
      
      const conversation = await storage.getConversationBySessionId(sessionId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      // Save user message
      const userMessage = await storage.createMessage({
        conversationId: conversation.id,
        type: "user",
        content: content.trim()
      });
      
      // Get conversation history for context
      const messages = await storage.getMessagesByConversation(conversation.id);
      const conversationHistory = messages.map(msg => `${msg.type}: ${msg.content}`);
      
      // Generate AI response
      const aiResponse = await openAIService.generateResponse(content, conversationHistory);
      
      // Save AI response
      const aiMessage = await storage.createMessage({
        conversationId: conversation.id,
        type: "ai",
        content: aiResponse.message,
        responseTime: aiResponse.responseTime,
        metadata: {
          confidence: aiResponse.confidence,
          sources: aiResponse.sources
        }
      });
      
      res.json({
        userMessage,
        aiMessage,
        aiResponse
      });
    } catch (error) {
      console.error('Error processing message:', error);
      res.status(500).json({ error: "Failed to process message" });
    }
  });

  // Process voice input
  app.post("/api/conversations/:sessionId/voice", async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      // Handle audio buffer from request
      let audioBuffer: Buffer;
      if (Buffer.isBuffer(req.body)) {
        audioBuffer = req.body;
      } else if (req.body && typeof req.body === 'object' && req.body.data) {
        audioBuffer = Buffer.from(req.body.data);
      } else {
        return res.status(400).json({ error: "Invalid audio data format" });
      }
      
      if (!audioBuffer || audioBuffer.length === 0) {
        return res.status(400).json({ error: "Audio data is required" });
      }
      
      const conversation = await storage.getConversationBySessionId(sessionId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      // Process voice input
      const voiceResult = await speechService.processVoiceInput(audioBuffer);
      
      if (!voiceResult.isValid) {
        return res.status(400).json({ 
          error: voiceResult.error || "Invalid voice input",
          transcription: voiceResult.transcription 
        });
      }
      
      const { transcription } = voiceResult;
      
      // Save user message with voice data
      const userMessage = await storage.createMessage({
        conversationId: conversation.id,
        type: "user",
        content: transcription.text,
        voiceData: {
          confidence: transcription.confidence,
          duration: transcription.duration
        }
      });
      
      // Get conversation history for context
      const messages = await storage.getMessagesByConversation(conversation.id);
      const conversationHistory = messages.map(msg => `${msg.type}: ${msg.content}`);
      
      // Generate AI response
      const aiResponse = await openAIService.generateResponse(transcription.text, conversationHistory);
      
      // Save AI response
      const aiMessage = await storage.createMessage({
        conversationId: conversation.id,
        type: "ai",
        content: aiResponse.message,
        responseTime: aiResponse.responseTime,
        metadata: {
          confidence: aiResponse.confidence,
          sources: aiResponse.sources
        }
      });
      
      res.json({
        transcription,
        userMessage,
        aiMessage,
        aiResponse
      });
    } catch (error) {
      console.error('Error processing voice input:', error);
      res.status(500).json({ error: "Failed to process voice input" });
    }
  });

  // Get conversation analytics
  app.get("/api/conversations/:sessionId/analytics", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const conversation = await storage.getConversationBySessionId(sessionId);
      
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      const messages = await storage.getMessagesByConversation(conversation.id);
      const userMessages = messages.filter(msg => msg.type === "user");
      const aiMessages = messages.filter(msg => msg.type === "ai");
      
      const avgResponseTime = aiMessages.length > 0 
        ? aiMessages.reduce((sum, msg) => sum + (msg.responseTime || 0), 0) / aiMessages.length
        : 0;
      
      const sessionDuration = conversation.endTime 
        ? Math.floor((conversation.endTime.getTime() - conversation.startTime.getTime()) / 1000)
        : Math.floor((Date.now() - conversation.startTime.getTime()) / 1000);
      
      const voiceMessages = messages.filter(msg => msg.voiceData).length;
      const voiceQuality = voiceMessages > 0 
        ? messages.filter(msg => msg.voiceData)
            .reduce((sum, msg) => sum + ((msg.voiceData as any)?.confidence || 0), 0) / voiceMessages
        : 0;
      
      res.json({
        messageCount: messages.length,
        userMessages: userMessages.length,
        aiMessages: aiMessages.length,
        avgResponseTime: Math.round(avgResponseTime),
        sessionDuration,
        voiceMessages,
        voiceQuality: Math.round(voiceQuality * 100) / 100
      });
    } catch (error) {
      console.error('Error getting analytics:', error);
      res.status(500).json({ error: "Failed to get analytics" });
    }
  });

  // Get knowledge base entries
  app.get("/api/knowledge-base", async (req, res) => {
    try {
      const { category, search } = req.query;
      
      let entries;
      if (search) {
        entries = await storage.searchKnowledgeBase(search as string);
      } else if (category) {
        entries = await storage.getKnowledgeBaseByCategory(category as string);
      } else {
        entries = await storage.getKnowledgeBaseEntries();
      }
      
      res.json(entries);
    } catch (error) {
      console.error('Error getting knowledge base:', error);
      res.status(500).json({ error: "Failed to get knowledge base" });
    }
  });

  // End conversation
  app.put("/api/conversations/:sessionId/end", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const conversation = await storage.getConversationBySessionId(sessionId);
      
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - conversation.startTime.getTime()) / 1000);
      
      const updatedConversation = await storage.updateConversation(conversation.id, {
        endTime,
        duration,
        status: "completed"
      });
      
      res.json(updatedConversation);
    } catch (error) {
      console.error('Error ending conversation:', error);
      res.status(500).json({ error: "Failed to end conversation" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
