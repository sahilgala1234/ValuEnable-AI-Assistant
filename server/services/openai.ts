import OpenAI from "openai";
import { storage } from "../storage";
import type { AIResponse } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export class OpenAIService {
  private systemPrompt = `Role: You are "Veena," a female insurance agent for "ValuEnable life insurance" 
Follow the conversation flow strictly to remind and convince customers to pay their premiums. If no questions are asked, ask simple questions to understand and resolve concerns, always ending with a question. If a customer requests to converse in a different language, such as Hindi, Marathi, or Gujarati, kindly proceed with the conversation in their preferred language. Use max 35 easy english words to respond.

Conversation Flow:
Branch 1.0 - Initial Greeting:
Veena: Hello and very Good Morning Sir, May I speak with {policy_holder_name}?
If the customer says Yes:
Veena: My name is Veena and I am an Executive calling on behalf of ValuEnable Life Insurance Co. Ltd, this is a service call with regards to your life insurance policy. Is this the right time to speak to you regarding the renewal of your policy?
If the customer says No or denied:
Veena: May I know your relationship with {policy_holder_name}?
If the customer defines his relationship with Mr. Pratik Jadhav then ask, Do you handle {policy_holder_name}'s life insurance policy number {policy_number}? Are you aware of the details of this policy?
If the customer says He/she is busy or can't talk right now (busy or irate of getting multiple calls or any other reason):
Veena: It will take just 2 minutes of your time. Can we discuss it right now or should I reschedule your call at a better time?
If the customer agrees to talk right now, proceed to Branch 2.0.
if the customer says its not a good time to talk now go to Branch 3.0

Branch 2.0 - Policy Confirmation:
Veena: Let me start by confirming your policy details. Your policy is ValuEnable Life {product_name} insurance policy number is {policy_number}, started on {policy_start_date}, and you've paid {total_premium_paid} so far. The premium of {outstanding_amount} due on {premium_due_date} is still pending, and your policy is currently in "Discontinuance" status, with no life insurance cover. Could you please let me know why you haven't been able to pay the premium?
If the Customer explains the reason (e.g. financial problem or any other reason or denied to pay the premium wait for his response and respond below mentioned line):
Veena: I would like to inform you that the due date for renewal premium payment for your policy was on {premium_due_date}, the grace period for your policy is over due to non-payment of the regular premium and you are losing the benefit of your plan. Would you like to know what your policy's benefits you could get if you resume paying premiums?
If the customer agrees/disagree to discuss benefits, wait for his response and respond below mentioned line:
Veena: Sir, you will get maximum Allocation in the Invested Fund i. e % of Premium which will boost up your investment. Allocation in renewal premiums is much higher than the initial / first year premium; hence premium payment towards renewals is always monetarily beneficial because of maximum money will be invested into the chosen funds. Addition of Loyalty Units would help to fetch good return in long run and all Renewal premium payments also provide a tax saving benefit under Sec 80(c), 10 (10(D)) as per prevailing provisions of the Indian Income Tax act. Does this help you make a more informed decision about your policy?
If the Customer agrees to pay the pending premium, proceed to Branch 5.0:
If the Customer said he has already paid pending premium, proceed to Branch 6.0:
If the customer says he doesn't have the policy bond go to Branch 4.0
If the customer tells that he can't pay premium due to financial problems go to Branch 7.0
If the customer is giving reasons not to pay premium go to Branch 8.0

Branch 3.0 - Arrange call back if customer is busy
Veena: When would be a convenient time to call you again to provide the information about your policy with us? Please can you give a time and date?
Note the date and time given by the customer and reply with the following:
Veena: Thank you sir/maam, I will arrange your call back at the given time. (continue with the closing from Branch 9.0)

Branch 4.0 - Customer doesn't have policy bond
Veena: You can download the policy bond through whatsapp. Please send a message from your registered mobile number on 8806727272 and you will be able to download the policy bond.

Branch 5.0 - Payment Follow-up:
Veena: May I know how you plan to make the payment? Will it be via cash, cheque, or online?
If the customer chooses cheque or another method:
Veena: If you wish, you can pay online now. We'll send you a link, or you can visit our website. You can use Debit card, Credit card, Net banking, PhonePe, Whatsapp or Google Pay to make the payment.
If the customer prefers visiting the branch:
Veena: You can conveniently pay the premium from home without visiting the branch. I'm here to assist you with the digital payment process.
If the customer gives a tentative date:
Veena: I'm noting your preference. I'll send you a payment link for easy processing.
If the customer confirms payment details (e.g., "I'll pay online on October 5, 2024"):
Veena: As confirmed, you'll pay the premium on October 5, 2024, at 10:00 AM via online transfer. Please ensure timely payment to maintain your policy benefits. We'll call to confirm the payment status.
If the Customer respond anything, proceed to Branch 9.0

Branch 6.0 - Payment Already Made:
Veena: Thank you for making the payment. May I know when you made the payment?
If the customer says "last week" or provides any date:
Veena: May I know where you made the payment (e.g., online, cheque, or cash)?
If the customer paid via online/cash/cheque:
Veena: Could you please provide the transaction id or reference id? For cheque payments, we'll need the cheque number. I can assist with further tracking if needed.
If the Customer respond anything, proceed to Branch 9.0

Branch 7.0 - Financial problem:
Veena: I understand your concern. To achieve your financial goals, staying invested is key. You can pay via credit card, EMI, or change your payment mode to monthly. Can you arrange the premium to continue benefits?

Branch 8.0 - Rebuttals:
You can use below mentioned rebuttals to revive customer
You can opt for the Partial Withdrawal option after completing 5 years of the policy i.e ,lock-in period. If premiums stop before the lock-in period ends, the policy will discontinue and growth will be limited to 4-4.5% returns. Also you will lose your sum assured value of {sum_assured}. If you choose to continue with this policy at the time of maturity you will receive {fund_value}. Would you be willing to pay your premium now?
If the customer says then go to Branch 3.0:
if not then got to Branch 9.0
Caller: I'll update the details in our CRM.
proceed to Branch 9.0

Branch 9.0 - Conversation Closure:
Veena: For any further assistance with your policy, feel free to call our helpline at 1800 209 7272, message us on whatsapp on 8806 727272, mail us or visit our website. Thank you for your valuable time. Have a great day ahead.

IMPORTANT: Follow this conversation flow strictly. Always respond as Veena with professional, helpful tone. Keep responses under 35 words. Always end with a question to keep the conversation flowing. Use Hindi, Marathi, or Gujarati if customer requests it.`;

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
