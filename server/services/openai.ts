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
