import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { openAIService } from "./services/openai";
import { speechService } from "./services/speechService";
import { insertConversationSchema, insertMessageSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file extension as well as MIME type
    const fileExtension = file.originalname.toLowerCase().split('.').pop() || '';
    const allowedExtensions = ['mp4', 'wav', 'mp3', 'webm', 'ogg', 'm4a'];
    
    if (
      file.mimetype.startsWith('audio/') || 
      file.mimetype.startsWith('video/') || 
      file.mimetype === 'application/octet-stream' || 
      allowedExtensions.includes(fileExtension)
    ) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} with extension ${fileExtension} not allowed. Only audio and video files are supported.`));
    }
  }
});

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
      
      console.log('Voice request received:', {
        sessionId,
        bodyType: typeof req.body,
        isBuffer: Buffer.isBuffer(req.body),
        bodySize: req.body ? req.body.length : 0,
        contentType: req.get('content-type')
      });
      
      // Handle audio buffer from request
      let audioBuffer: Buffer;
      if (Buffer.isBuffer(req.body)) {
        audioBuffer = req.body;
      } else if (req.body && typeof req.body === 'object' && req.body.data) {
        audioBuffer = Buffer.from(req.body.data);
      } else if (req.body && req.body.constructor === ArrayBuffer) {
        audioBuffer = Buffer.from(req.body);
      } else {
        console.log('Invalid audio data format received');
        return res.status(400).json({ error: "Invalid audio data format" });
      }
      
      if (!audioBuffer || audioBuffer.length === 0) {
        console.log('No audio data received');
        return res.status(400).json({ error: "Audio data is required" });
      }
      
      console.log('Audio buffer created:', { size: audioBuffer.length });
      
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
      console.log('Generating AI response for:', transcription.text);
      const aiResponse = await openAIService.generateResponse(transcription.text, conversationHistory);
      console.log('AI response generated:', { message: aiResponse.message, confidence: aiResponse.confidence });
      
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
      
      console.log('Voice processing completed successfully:', {
        userMessageId: userMessage.id,
        aiMessageId: aiMessage.id,
        transcribedText: transcription.text,
        aiResponseLength: aiResponse.message.length
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

  // Generate speech from text using ElevenLabs
  app.post("/api/text-to-speech", async (req, res) => {
    try {
      const { text } = req.body;
      
      if (!text || text.trim().length === 0) {
        return res.status(400).json({ error: "Text is required" });
      }

      const { elevenLabsService } = await import("./services/elevenLabsService");
      const audioBuffer = await elevenLabsService.synthesizeSpeech(text);
      
      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
      });
      
      res.send(audioBuffer);
    } catch (error) {
      console.error('Text-to-speech error:', error);
      res.status(500).json({ error: "Failed to generate speech" });
    }
  });

  // MP4/WAV training data upload endpoint
  app.post("/api/training/upload", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded. Please upload MP4 or WAV files." });
      }

      const audioBuffer = req.file.buffer;
      const filename = req.file.originalname;
      const fileType = req.file.mimetype;
      const description = req.body.description || "";

      if (!audioBuffer || audioBuffer.length === 0) {
        return res.status(400).json({ error: "No audio data received" });
      }

      // Convert audio buffer to base64 for storage
      const audioDataBase64 = audioBuffer.toString("base64");
      
      // Create training data entry
      const trainingEntry = await storage.createTrainingDataEntry({
        filename,
        fileType,
        fileSize: audioBuffer.length,
        audioData: audioDataBase64,
        processingStatus: "pending",
        transcription: null,
        metadata: { description }
      });

      // Start async processing (transcription)
      processTrainingDataAsync(trainingEntry.id, audioBuffer);

      res.json({
        success: true,
        message: "Training data uploaded successfully",
        trainingEntry: {
          id: trainingEntry.id,
          filename: trainingEntry.filename,
          fileType: trainingEntry.fileType,
          fileSize: trainingEntry.fileSize,
          processingStatus: trainingEntry.processingStatus,
          createdAt: trainingEntry.createdAt
        }
      });

    } catch (error) {
      console.error("Error in training upload endpoint:", error);
      res.status(500).json({ error: "Failed to upload training data" });
    }
  });

  async function processTrainingDataAsync(trainingId: number, audioBuffer: Buffer) {
    try {
      console.log(`Processing training data ${trainingId}...`);
      
      // Update status to processing
      await storage.updateTrainingDataEntry(trainingId, {
        processingStatus: "processing"
      });

      // Transcribe using OpenAI Whisper
      const transcription = await openAIService.transcribeAudio(audioBuffer);
      
      // Update with transcription results
      await storage.updateTrainingDataEntry(trainingId, {
        transcription: transcription.text,
        processingStatus: "completed",
        metadata: {
          confidence: transcription.confidence,
          processingTime: Date.now()
        }
      });

      console.log(`Training data ${trainingId} processed successfully`);

    } catch (error) {
      console.error(`Error processing training data ${trainingId}:`, error);
      await storage.updateTrainingDataEntry(trainingId, {
        processingStatus: "failed",
        metadata: {
          error: error instanceof Error ? error.message : String(error),
          processingTime: Date.now()
        }
      });
    }
  }

  // Get training data entries
  app.get("/api/training", async (req, res) => {
    try {
      const entries = await storage.getTrainingDataEntries();
      res.json(entries);
    } catch (error) {
      console.error("Error fetching training data:", error);
      res.status(500).json({ error: "Failed to fetch training data" });
    }
  });

  // Get specific training data entry (numeric IDs only)
  app.get("/api/training/:id(\\d+)", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const entry = await storage.getTrainingDataById(id);
      
      if (!entry) {
        return res.status(404).json({ error: "Training data not found" });
      }
      
      res.json(entry);
    } catch (error) {
      console.error("Error fetching training data:", error);
      res.status(500).json({ error: "Failed to fetch training data" });
    }
  });

  // Re-process training data with improved algorithms
  app.post("/api/training/:id(\\d+)/reprocess", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const trainingData = await storage.getTrainingDataById(id);
      
      if (!trainingData) {
        return res.status(404).json({ error: "Training data not found" });
      }

      if (!trainingData.audioData) {
        return res.status(400).json({ error: "No audio data available for reprocessing" });
      }

      // Update status to pending
      await storage.updateTrainingDataEntry(id, {
        processingStatus: "pending",
        transcription: null,
        metadata: JSON.stringify({ reprocessing: true })
      });

      // Process asynchronously
      processTrainingDataAsync(id, Buffer.from(trainingData.audioData, 'base64'));

      res.json({ success: true, message: "Training data reprocessing started" });
    } catch (error) {
      console.error("Error reprocessing training data:", error);
      res.status(500).json({ error: "Failed to reprocess training data" });
    }
  });

  // Delete training data entry
  app.delete("/api/training/:id(\\d+)", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const trainingData = await storage.getTrainingDataById(id);
      
      if (!trainingData) {
        return res.status(404).json({ error: "Training data not found" });
      }

      const deleted = await storage.deleteTrainingDataEntry(id);
      
      if (deleted) {
        res.json({ success: true, message: "Training data deleted successfully" });
      } else {
        res.status(500).json({ error: "Failed to delete training data" });
      }
    } catch (error) {
      console.error("Error deleting training data:", error);
      res.status(500).json({ error: "Failed to delete training data" });
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
