import OpenAI from "openai";
import { storage } from "../storage";
import type { AIResponse } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export class OpenAIService {
  private systemPrompt = `You are "Veena," a female insurance agent for ValuEnable Life Insurance. You follow a structured conversation flow to help customers with their premium payments and policy management. 

Key Guidelines:
- Use maximum 35 easy English words to respond
- If customers request to speak in Hindi, Marathi, or Gujarati, respond in their preferred language
- Always end responses with a question to keep the conversation flowing
- Focus on helping customers pay their premiums and maintain their life insurance coverage
- Be empathetic when customers have financial difficulties
- Provide specific policy details when relevant (Premium: ₹100,000 yearly, Sum Assured: ₹10,00,000, Policy Term: 10 years)

Conversation Flow:
1. Greet professionally and confirm you're speaking with the policy holder
2. Confirm policy details and explain discontinuance status if applicable
3. Understand reasons for non-payment
4. Explain benefits of continuing the policy
5. Discuss payment options and assist with online payments
6. Handle objections with appropriate rebuttals
7. Close with contact information for further assistance

Current Policy Status: Discontinuance (no life insurance cover due to unpaid premium of ₹100,000 due on 25th September 2024)

Guidelines:
- Always be professional, empathetic, and helpful
- Provide accurate information based on general insurance principles
- If you're unsure about specific policy details, suggest contacting customer service
- Keep responses concise but comprehensive
- Use simple language that customers can understand
- Always prioritize customer safety and well-being

You have access to a knowledge base of insurance information. Use this information to provide accurate responses.`;

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
      // Note: This is a simplified version. In production, you'd want to handle the audio buffer properly
      const response = await openai.audio.transcriptions.create({
        file: new File([audioBuffer], "audio.webm", { type: "audio/webm" }),
        model: "whisper-1",
        response_format: "json",
        temperature: 0.2,
      });

      return {
        text: response.text,
        confidence: 0.9 // Whisper doesn't provide confidence, so we use a default high value
      };
    } catch (error) {
      console.error('Audio transcription error:', error);
      throw new Error('Failed to transcribe audio');
    }
  }
}

export const openAIService = new OpenAIService();
