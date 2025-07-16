import OpenAI from "openai";
import { storage } from "../storage";
import type { AIResponse } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export class OpenAIService {
  private baseSystemPrompt = `Role: You are "Veena," a female insurance agent for "ValuEnable life insurance" 
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

  private trainingInsights: string = '';
  
  public get systemPrompt(): string {
    return this.baseSystemPrompt + (this.trainingInsights ? `\n\nTRAINING INSIGHTS:\n${this.trainingInsights}` : '');
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
      console.log('Starting OpenAI Whisper transcription for complete audio file...');
      console.log(`Processing audio buffer of ${audioBuffer.length} bytes`);
      
      // Create a proper audio file with appropriate MIME type
      const response = await openai.audio.transcriptions.create({
        file: new File([audioBuffer], "audio.wav", { type: "audio/wav" }),
        model: "whisper-1",
        response_format: "verbose_json", // Get detailed response with timestamps
        temperature: 0.0, // Maximum accuracy for training data
        language: "hi", // Hindi as primary language with multilingual support
        prompt: "This is a complete insurance call recording between a customer and agent. Please transcribe the entire conversation including all customer questions, agent responses, policy details, premium discussions, and conversation flow from beginning to end. Include all Hindi, English, Marathi, and Gujarati content."
      });

      console.log('OpenAI Whisper response received:', {
        text: response.text?.substring(0, 100) + '...',
        duration: response.duration,
        segments: response.segments ? response.segments.length : 0
      });

      // For training data, preserve the complete transcription with minimal cleaning
      const fullTranscription = response.text || '';
      console.log(`Complete transcription length: ${fullTranscription.length} characters`);
      console.log(`Audio duration: ${response.duration} seconds`);
      
      // Only remove obviously corrupted repetitions, preserve conversation flow
      const processedText = this.preserveConversationFlow(fullTranscription);
      
      // Calculate confidence based on text quality and duration
      const confidence = this.calculateTranscriptionConfidence(processedText, fullTranscription);

      return {
        text: processedText,
        confidence: confidence
      };
    } catch (error) {
      console.error('Audio transcription error:', error);
      throw new Error('Failed to transcribe audio');
    }
  }

  private preserveConversationFlow(text: string): string {
    if (!text) return '';
    
    // For training data, preserve the complete conversation flow
    // Only remove obviously corrupted repetitions while maintaining dialogue structure
    
    // Split into lines and process each one
    const lines = text.split('\n');
    const processedLines: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines but preserve conversation breaks
      if (line.length === 0) {
        if (processedLines.length > 0 && processedLines[processedLines.length - 1] !== '') {
          processedLines.push('');
        }
        continue;
      }
      
      // Remove lines that are extremely repetitive (more than 80% repeated characters)
      if (this.isExtremelyRepetitive(line)) {
        continue;
      }
      
      // Remove lines that are exact duplicates of the previous line
      if (processedLines.length > 0 && processedLines[processedLines.length - 1] === line) {
        continue;
      }
      
      processedLines.push(line);
    }
    
    return processedLines.join('\n').trim();
  }

  private isExtremelyRepetitive(text: string): boolean {
    if (text.length < 10) return false;
    
    // Count character frequency
    const charCount = new Map<string, number>();
    for (const char of text) {
      charCount.set(char, (charCount.get(char) || 0) + 1);
    }
    
    // Check if any character appears more than 80% of the time
    for (const count of charCount.values()) {
      if (count / text.length > 0.8) {
        return true;
      }
    }
    
    return false;
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
