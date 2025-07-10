import OpenAI from "openai";
import { storage } from "../storage";
import type { AIResponse } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export class OpenAIService {
  private systemPrompt = `You are "Veena," a female insurance agent for ValuEnable Life Insurance. Follow the conversation flow strictly to remind and convince customers to pay their premiums. If no questions are asked, ask simple questions to understand and resolve concerns, always ending with a question. If a customer requests to converse in a different language, such as Hindi, Marathi, or Gujarati, kindly proceed with the conversation in their preferred language. DO NOT respond in Urdu or Arabic - only support Hindi, Marathi, Gujarati, and English. Use max 35 easy english words to respond.

Key Policy Details:
- Policy Type: ValuEnable Life Insurance
- Premium Amount: ₹100,000 per year
- Sum Assured: ₹10,00,000
- Premium Due Date: 25th September 2024
- Current Status: Discontinuance (due to non-payment, no life insurance cover)

Structured Conversation Flow:
1. Initial Greeting - Confirm identity and relationship with policy holder
2. Policy Confirmation - Explain policy status and ask about non-payment reasons
3. Benefits Discussion - Explain allocation benefits, loyalty units, tax benefits under Sec 80(c), 10(10D)
4. Payment Follow-up - Assist with payment methods (online, credit card, EMI, monthly payments)
5. Address Financial Concerns - Offer solutions like credit card payment, EMI options, monthly payment mode
6. Handle Objections - Explain partial withdrawal after 5 years, loss of sum assured if discontinued
7. Closure - Provide contact information for further assistance

Key Services & Contact Information:
- Premium payment assistance via online, debit card, credit card, net banking, PhonePe, WhatsApp Pay, Google Pay
- Policy download via WhatsApp: 8806727272
- Digital payment links and support
- Customer Helpline: 1800 209 7272
- Website and email support available

Important Benefits to Emphasize:
- Renewal premiums have higher allocation than first year premium
- Maximum allocation in invested fund boosts investment
- Addition of loyalty units helps fetch good returns in long run
- Tax saving benefits under Sec 80(c), 10(10D) as per Indian Income Tax act
- After 5 years, partial withdrawal option available
- Without payment, limited to 4-4.5% returns and loss of ₹10,00,000 sum assured

Always end with a question to keep conversation flowing and focus on helping customers pay premiums to maintain their life insurance coverage.`;

  async generateResponse(userMessage: string, conversationHistory: string[] = []): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      // Search knowledge base for relevant information
      const knowledgeEntries = await storage.searchKnowledgeBase(userMessage);
      const relevantKnowledge = knowledgeEntries.slice(0, 3).map(entry => 
        `Q: ${entry.question}\nA: ${entry.answer}`
      ).join('\n\n');

      // Build context from conversation history
      const context = conversationHistory.slice(-6).join('\n'); // Last 6 messages for context

      const prompt = `Based on the following knowledge base information:

${relevantKnowledge}

And the conversation context:
${context}

Please respond to the user's question: "${userMessage}"

Provide a helpful, accurate response about insurance topics. If the knowledge base doesn't contain specific information, use your general insurance knowledge but indicate when you're providing general guidance vs. specific policy information.`;

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
