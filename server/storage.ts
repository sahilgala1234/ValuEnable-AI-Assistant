import { 
  users, 
  conversations, 
  messages, 
  knowledgeBaseEntries,
  trainingData,
  type User, 
  type InsertUser,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type KnowledgeBase,
  type InsertKnowledgeBase,
  type TrainingData,
  type InsertTrainingData,
  type ConversationWithMessages
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, ilike, or, and } from "drizzle-orm";
import { defaultKnowledgeBase } from "./data/knowledgeBase";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Conversation methods
  getConversation(id: number): Promise<Conversation | undefined>;
  getConversationBySessionId(sessionId: string): Promise<Conversation | undefined>;
  getConversationWithMessages(sessionId: string): Promise<ConversationWithMessages | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: number, updates: Partial<Conversation>): Promise<Conversation | undefined>;
  
  // Message methods
  getMessage(id: number): Promise<Message | undefined>;
  getMessagesByConversation(conversationId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  // Knowledge base methods
  getKnowledgeBaseEntries(): Promise<KnowledgeBase[]>;
  getKnowledgeBaseByCategory(category: string): Promise<KnowledgeBase[]>;
  searchKnowledgeBase(query: string): Promise<KnowledgeBase[]>;
  createKnowledgeBaseEntry(entry: InsertKnowledgeBase): Promise<KnowledgeBase>;
  
  // Training data methods
  getTrainingDataEntries(): Promise<TrainingData[]>;
  getTrainingDataById(id: number): Promise<TrainingData | undefined>;
  createTrainingDataEntry(entry: InsertTrainingData): Promise<TrainingData>;
  updateTrainingDataEntry(id: number, updates: Partial<TrainingData>): Promise<TrainingData | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getConversation(id: number): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation || undefined;
  }

  async getConversationBySessionId(sessionId: string): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.sessionId, sessionId));
    return conversation || undefined;
  }

  async getConversationWithMessages(sessionId: string): Promise<ConversationWithMessages | undefined> {
    const conversation = await this.getConversationBySessionId(sessionId);
    if (!conversation) return undefined;

    const conversationMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversation.id))
      .orderBy(messages.timestamp);

    return {
      ...conversation,
      messages: conversationMessages,
    };
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const [conversation] = await db
      .insert(conversations)
      .values(insertConversation)
      .returning();
    return conversation;
  }

  async updateConversation(id: number, updates: Partial<Conversation>): Promise<Conversation | undefined> {
    const [updatedConversation] = await db
      .update(conversations)
      .set(updates)
      .where(eq(conversations.id, id))
      .returning();
    return updatedConversation || undefined;
  }

  async getMessage(id: number): Promise<Message | undefined> {
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    return message || undefined;
  }

  async getMessagesByConversation(conversationId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.timestamp);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async getKnowledgeBaseEntries(): Promise<KnowledgeBase[]> {
    return await db
      .select()
      .from(knowledgeBaseEntries)
      .where(eq(knowledgeBaseEntries.isActive, true))
      .orderBy(desc(knowledgeBaseEntries.priority));
  }

  async getKnowledgeBaseByCategory(category: string): Promise<KnowledgeBase[]> {
    return await db
      .select()
      .from(knowledgeBaseEntries)
      .where(and(
        eq(knowledgeBaseEntries.category, category),
        eq(knowledgeBaseEntries.isActive, true)
      ))
      .orderBy(desc(knowledgeBaseEntries.priority));
  }

  async searchKnowledgeBase(query: string): Promise<KnowledgeBase[]> {
    const searchTerms = query.toLowerCase().split(' ');
    
    return await db
      .select()
      .from(knowledgeBaseEntries)
      .where(and(
        eq(knowledgeBaseEntries.isActive, true),
        or(
          ...searchTerms.map(term => 
            or(
              ilike(knowledgeBaseEntries.question, `%${term}%`),
              ilike(knowledgeBaseEntries.answer, `%${term}%`),
              ilike(knowledgeBaseEntries.category, `%${term}%`)
            )
          )
        )
      ))
      .orderBy(desc(knowledgeBaseEntries.priority));
  }

  async createKnowledgeBaseEntry(entry: InsertKnowledgeBase): Promise<KnowledgeBase> {
    const [knowledgeEntry] = await db
      .insert(knowledgeBaseEntries)
      .values(entry)
      .returning();
    return knowledgeEntry;
  }

  async initializeKnowledgeBase(): Promise<void> {
    // Check if knowledge base is already populated
    const existingEntries = await db.select().from(knowledgeBaseEntries).limit(1);
    if (existingEntries.length > 0) {
      return; // Already initialized
    }

    // Insert default knowledge base entries
    await db.insert(knowledgeBaseEntries).values(defaultKnowledgeBase);
  }

  async getTrainingDataEntries(): Promise<TrainingData[]> {
    return await db
      .select()
      .from(trainingData)
      .orderBy(desc(trainingData.createdAt));
  }

  async getTrainingDataById(id: number): Promise<TrainingData | undefined> {
    const [entry] = await db.select().from(trainingData).where(eq(trainingData.id, id));
    return entry || undefined;
  }

  async createTrainingDataEntry(entry: InsertTrainingData): Promise<TrainingData> {
    const [trainingEntry] = await db
      .insert(trainingData)
      .values(entry)
      .returning();
    return trainingEntry;
  }

  async updateTrainingDataEntry(id: number, updates: Partial<TrainingData>): Promise<TrainingData | undefined> {
    const [updated] = await db
      .update(trainingData)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(trainingData.id, id))
      .returning();
    return updated || undefined;
  }
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private conversations: Map<number, Conversation>;
  private messages: Map<number, Message>;
  private knowledgeBase: Map<number, KnowledgeBase>;
  private trainingData: Map<number, TrainingData>;
  private currentUserId: number;
  private currentConversationId: number;
  private currentMessageId: number;
  private currentKnowledgeBaseId: number;
  private currentTrainingDataId: number;

  constructor() {
    this.users = new Map();
    this.conversations = new Map();
    this.messages = new Map();
    this.knowledgeBase = new Map();
    this.trainingData = new Map();
    this.currentUserId = 1;
    this.currentConversationId = 1;
    this.currentMessageId = 1;
    this.currentKnowledgeBaseId = 1;
    this.currentTrainingDataId = 1;
    
    // Initialize with sample knowledge base entries
    this.initializeKnowledgeBase();
  }

  private initializeKnowledgeBase() {
    const entries = [
      {
        category: "Life Insurance",
        question: "What is life insurance?",
        answer: "Life insurance is a contract between you and an insurance company where you pay premiums in exchange for a death benefit paid to your beneficiaries when you pass away.",
        keywords: ["life insurance", "death benefit", "premiums", "beneficiaries"],
        priority: 1,
        isActive: true
      },
      {
        category: "Life Insurance",
        question: "How are life insurance premiums calculated?",
        answer: "Life insurance premiums are calculated based on several factors: age, health condition, lifestyle habits, coverage amount, policy type, and gender. Younger and healthier individuals typically pay lower premiums.",
        keywords: ["premiums", "calculation", "age", "health", "lifestyle", "coverage"],
        priority: 1,
        isActive: true
      },
      {
        category: "Claims",
        question: "How do I file a life insurance claim?",
        answer: "To file a life insurance claim: 1) Contact the insurance company, 2) Provide the death certificate, 3) Complete claim forms, 4) Submit required documentation, 5) Wait for processing (usually 30-60 days).",
        keywords: ["claims", "file claim", "death certificate", "documentation"],
        priority: 1,
        isActive: true
      },
      {
        category: "Policy Types",
        question: "What are the different types of life insurance?",
        answer: "Main types include: Term Life (temporary coverage), Whole Life (permanent with cash value), Universal Life (flexible premiums), and Variable Life (investment component).",
        keywords: ["policy types", "term life", "whole life", "universal life", "variable life"],
        priority: 1,
        isActive: true
      },
      {
        category: "Coverage",
        question: "How much life insurance coverage do I need?",
        answer: "A general rule is 10-12 times your annual income. Consider your debts, family expenses, children's education costs, and your spouse's income when determining coverage amount.",
        keywords: ["coverage amount", "income", "debts", "family expenses", "education"],
        priority: 1,
        isActive: true
      }
    ];

    entries.forEach(entry => {
      const id = this.currentKnowledgeBaseId++;
      this.knowledgeBase.set(id, { ...entry, id });
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getConversation(id: number): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }

  async getConversationBySessionId(sessionId: string): Promise<Conversation | undefined> {
    return Array.from(this.conversations.values()).find(
      (conversation) => conversation.sessionId === sessionId,
    );
  }

  async getConversationWithMessages(sessionId: string): Promise<ConversationWithMessages | undefined> {
    const conversation = await this.getConversationBySessionId(sessionId);
    if (!conversation) return undefined;
    
    const messages = await this.getMessagesByConversation(conversation.id);
    return { ...conversation, messages };
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const id = this.currentConversationId++;
    const conversation: Conversation = { 
      ...insertConversation, 
      id,
      startTime: new Date(),
      endTime: null,
      messageCount: 0,
      duration: 0,
      status: "active",
      userId: insertConversation.userId || null
    };
    this.conversations.set(id, conversation);
    return conversation;
  }

  async updateConversation(id: number, updates: Partial<Conversation>): Promise<Conversation | undefined> {
    const conversation = this.conversations.get(id);
    if (!conversation) return undefined;
    
    const updatedConversation = { ...conversation, ...updates };
    this.conversations.set(id, updatedConversation);
    return updatedConversation;
  }

  async getMessage(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async getMessagesByConversation(conversationId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.conversationId === conversationId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const message: Message = { 
      ...insertMessage, 
      id,
      timestamp: new Date(),
      voiceData: insertMessage.voiceData || null,
      responseTime: insertMessage.responseTime || null,
      metadata: insertMessage.metadata || null
    };
    this.messages.set(id, message);
    
    // Update conversation message count
    const conversation = this.conversations.get(insertMessage.conversationId);
    if (conversation) {
      conversation.messageCount = (conversation.messageCount || 0) + 1;
      this.conversations.set(insertMessage.conversationId, conversation);
    }
    
    return message;
  }

  async getKnowledgeBaseEntries(): Promise<KnowledgeBase[]> {
    return Array.from(this.knowledgeBase.values()).filter(entry => entry.isActive);
  }

  async getKnowledgeBaseByCategory(category: string): Promise<KnowledgeBase[]> {
    return Array.from(this.knowledgeBase.values()).filter(
      entry => entry.category === category && entry.isActive
    );
  }

  async searchKnowledgeBase(query: string): Promise<KnowledgeBase[]> {
    const searchTerm = query.toLowerCase();
    return Array.from(this.knowledgeBase.values()).filter(entry => {
      if (!entry.isActive) return false;
      
      const matchesQuestion = entry.question.toLowerCase().includes(searchTerm);
      const matchesAnswer = entry.answer.toLowerCase().includes(searchTerm);
      const matchesKeywords = entry.keywords?.some(keyword => 
        keyword.toLowerCase().includes(searchTerm)
      );
      
      return matchesQuestion || matchesAnswer || matchesKeywords;
    }).sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  async createKnowledgeBaseEntry(entry: InsertKnowledgeBase): Promise<KnowledgeBase> {
    const id = this.currentKnowledgeBaseId++;
    const knowledgeEntry: KnowledgeBase = { 
      ...entry, 
      id,
      priority: entry.priority || 1,
      isActive: entry.isActive !== false,
      keywords: entry.keywords || null
    };
    this.knowledgeBase.set(id, knowledgeEntry);
    return knowledgeEntry;
  }

  async getTrainingDataEntries(): Promise<TrainingData[]> {
    return Array.from(this.trainingData.values()).sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  async getTrainingDataById(id: number): Promise<TrainingData | undefined> {
    return this.trainingData.get(id);
  }

  async createTrainingDataEntry(entry: InsertTrainingData): Promise<TrainingData> {
    const id = this.currentTrainingDataId++;
    const now = new Date();
    const trainingEntry: TrainingData = { 
      ...entry, 
      id,
      processingStatus: entry.processingStatus || "pending",
      transcription: entry.transcription || null,
      metadata: entry.metadata || null,
      createdAt: now,
      updatedAt: now
    };
    this.trainingData.set(id, trainingEntry);
    return trainingEntry;
  }

  async updateTrainingDataEntry(id: number, updates: Partial<TrainingData>): Promise<TrainingData | undefined> {
    const existing = this.trainingData.get(id);
    if (!existing) return undefined;
    
    const updated: TrainingData = { 
      ...existing, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.trainingData.set(id, updated);
    return updated;
  }
}

export const storage = new DatabaseStorage();

// Initialize the knowledge base on startup
storage.initializeKnowledgeBase().catch(console.error);
