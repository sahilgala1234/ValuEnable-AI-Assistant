import OpenAI from "openai";
import { storage } from "../storage";
import type { AIResponse } from "@shared/schema";
import { PromptManager } from "../prompts/index";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export class OpenAIService {
  private trainingInsights: string = '';
  
  public get systemPrompt(): string {
    return PromptManager.getSystemPrompt(this.trainingInsights);
  }

  public updateSystemPromptWithTraining(trainingData: string): void {
    this.trainingInsights = trainingData;
  }

  public get openai() {
    return openai;
  }

  async generateResponse(userMessage: string, conversationHistory: string[] = []): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      // Search knowledge base for relevant information
      const knowledgeEntries = await storage.searchKnowledgeBase(userMessage);
      
      // Also get policy details specifically for premium/payment related queries
      const policyDetailsEntries = await storage.getKnowledgeBaseByCategory("Policy Details");
      const paymentEntries = await storage.getKnowledgeBaseByCategory("Payment Options");
      
      // Combine all relevant entries
      const allRelevantEntries = [...knowledgeEntries, ...policyDetailsEntries, ...paymentEntries];
      const uniqueEntries = allRelevantEntries.filter((entry, index, self) => 
        index === self.findIndex(e => e.id === entry.id)
      );
      
      const relevantKnowledge = uniqueEntries.slice(0, 5).map(entry => 
        `Q: ${entry.question}\nA: ${entry.answer}`
      ).join('\n\n');

      // Build context from conversation history
      const context = conversationHistory.slice(-6).join('\n'); // Last 6 messages for context

      const prompt = `You are Veena, an insurance agent for ValuEnable Life Insurance. Use the following knowledge base information to answer the user's question:

KNOWLEDGE BASE:
${relevantKnowledge}

CONVERSATION CONTEXT:
${context}

USER QUESTION: "${userMessage}"

IMPORTANT INSTRUCTIONS:
- If the user asks about premium payments, policy details, or insurance information, ALWAYS use the specific information from the knowledge base above
- For policy queries, refer to the actual policy details: Premium Amount: ₹100,000 yearly, Sum Assured: ₹10,00,000, Premium paid till date: ₹4,00,000
- If the user asks about premiums paid, tell them the exact amount from the knowledge base
- Always be helpful and use the available policy information rather than saying you don't have access to it
- Follow the conversation flow and keep responses under 35 words
- End with a question to keep the conversation flowing

Respond as Veena with the specific information available in the knowledge base.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: this.systemPrompt },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const responseTime = Date.now() - startTime;
      const aiMessage = response.choices[0].message.content || "I apologize, but I couldn't generate a response. Please try again.";

      return {
        message: aiMessage,
        confidence: this.calculateConfidence(response.choices[0].finish_reason),
        responseTime,
        sources: knowledgeEntries.slice(0, 3).map(entry => entry.question)
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      const responseTime = Date.now() - startTime;
      
      return {
        message: "I apologize, but I'm experiencing technical difficulties. Please try again in a moment or contact our customer service team for immediate assistance.",
        confidence: 0,
        responseTime,
        sources: []
      };
    }
  }

  private calculateConfidence(finishReason: string | null): number {
    switch (finishReason) {
      case 'stop':
        return 0.9;
      case 'length':
        return 0.7;
      default:
        return 0.5;
    }
  }

  async transcribeAudio(audioBuffer: Buffer): Promise<{ text: string; confidence: number }> {
    try {
      console.log('Starting OpenAI Whisper transcription...');
      
      // Create a proper audio file with appropriate MIME type
      const response = await openai.audio.transcriptions.create({
        file: new File([audioBuffer], "audio.wav", { type: "audio/wav" }),
        model: "whisper-1",
        response_format: "verbose_json",
        temperature: 0.0, // Use 0 for more deterministic results
        language: "hi", // Specify Hindi as primary language
        prompt: "This is a Hindi/English insurance conversation between an agent and a customer discussing policy details, premium payments, and insurance benefits."
      });

      console.log('OpenAI Whisper response received:', {
        text: response.text?.substring(0, 100) + '...',
        duration: response.duration
      });

      // Clean up repetitive text that often occurs in poor quality audio
      let cleanedText = response.text || '';
      
      // Remove excessive repetition patterns
      cleanedText = this.cleanRepetitiveText(cleanedText);
      
      // Calculate confidence based on text quality
      const confidence = this.calculateTranscriptionConfidence(cleanedText, response.text || '');

      return {
        text: cleanedText,
        confidence: confidence
      };
    } catch (error) {
      console.error('Audio transcription error:', error);
      throw new Error('Failed to transcribe audio');
    }
  }

  private cleanRepetitiveText(text: string): string {
    if (!text) return '';
    
    // First, remove obvious repetitive patterns
    text = this.removeRepetitivePatterns(text);
    
    // Split into meaningful phrases using Hindi and English punctuation
    const sentences = text.split(/[।|.|,|;|\n]/).filter(s => s.trim().length > 5);
    
    // Remove duplicate consecutive sentences
    const uniqueSentences = [];
    let lastSentence = '';
    
    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      const normalized = this.normalizeText(trimmed);
      
      if (normalized && normalized !== this.normalizeText(lastSentence)) {
        uniqueSentences.push(trimmed);
        lastSentence = trimmed;
      }
    }
    
    // Advanced deduplication for similar content
    const finalSentences = this.removeSimilarSentences(uniqueSentences);
    
    return finalSentences.join('. ').trim();
  }

  private removeRepetitivePatterns(text: string): string {
    // Remove patterns where the same phrase appears 3+ times consecutively
    return text.replace(/(.{10,50}?)(\s+\1){2,}/g, '$1');
  }

  private normalizeText(text: string): string {
    return text.toLowerCase()
               .replace(/[^\u0900-\u097F\u0020-\u007F]/g, '') // Keep only Hindi, English, and spaces
               .replace(/\s+/g, ' ')
               .trim();
  }

  private removeSimilarSentences(sentences: string[]): string[] {
    if (sentences.length <= 2) return sentences;
    
    const result = [];
    const usedSentences = new Set();
    
    for (const sentence of sentences) {
      const normalized = this.normalizeText(sentence);
      
      // Check if this sentence is too similar to any already used sentence
      const isSimilar = Array.from(usedSentences).some(used => {
        const similarity = this.calculateSimilarity(normalized, used);
        return similarity > 0.7; // 70% similarity threshold
      });
      
      if (!isSimilar && normalized.length > 10) {
        result.push(sentence);
        usedSentences.add(normalized);
        
        // Limit to maximum 5 unique sentences to avoid overly long transcriptions
        if (result.length >= 5) break;
      }
    }
    
    return result.length > 0 ? result : [sentences[0]]; // Always return at least one sentence
  }

  private calculateSimilarity(text1: string, text2: string): number {
    if (!text1 || !text2) return 0;
    
    const words1 = text1.split(' ').filter(w => w.length > 2);
    const words2 = text2.split(' ').filter(w => w.length > 2);
    
    if (words1.length === 0 || words2.length === 0) return 0;
    
    const commonWords = words1.filter(word => words2.includes(word));
    return commonWords.length / Math.max(words1.length, words2.length);
  }

  private calculateTranscriptionConfidence(cleanedText: string, originalText: string): number {
    if (!cleanedText || !originalText) return 0.1;
    
    // Lower confidence if text was heavily cleaned (lots of repetition)
    const reductionRatio = cleanedText.length / originalText.length;
    
    if (reductionRatio < 0.3) return 0.3; // Heavy cleaning indicates poor quality
    if (reductionRatio < 0.7) return 0.6; // Moderate cleaning
    
    // Check for common transcription issues
    const hasRepeatedWords = /(\b\w+\b).*\1.*\1/.test(cleanedText);
    const hasGibberish = /[^\u0900-\u097F\u0020-\u007F]/.test(cleanedText) && cleanedText.length > 20;
    
    if (hasRepeatedWords) return 0.5;
    if (hasGibberish) return 0.4;
    
    return 0.85; // Good quality transcription
  }
}

export const openAIService = new OpenAIService();
