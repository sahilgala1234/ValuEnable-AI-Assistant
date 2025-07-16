import { openAIService } from './openai';
import { storage } from '../storage';
import type { TrainingData } from '@shared/schema';

export interface TrainingAnalysis {
  customerQuestions: string[];
  agentResponses: string[];
  conversationFlow: string[];
  keyInsights: string[];
  suggestedImprovements: string[];
}

export interface ModelTrainingData {
  id: number;
  filename: string;
  analysis: TrainingAnalysis;
  qualityScore: number;
  usableForTraining: boolean;
  processedAt: Date;
}

export class TrainingService {
  async processAllTrainingData(): Promise<ModelTrainingData[]> {
    console.log('Starting comprehensive training data processing...');
    const trainingEntries = await storage.getTrainingDataEntries();
    const processedData: ModelTrainingData[] = [];

    for (const entry of trainingEntries) {
      if (entry.processingStatus === 'completed' && entry.transcription) {
        try {
          const analysis = await this.analyzeTrainingData(entry);
          const modelData: ModelTrainingData = {
            id: entry.id,
            filename: entry.filename,
            analysis,
            qualityScore: this.calculateQualityScore(analysis, entry.transcription),
            usableForTraining: this.isUsableForTraining(analysis, entry.transcription),
            processedAt: new Date()
          };
          processedData.push(modelData);
          console.log(`Processed training data: ${entry.filename} (Quality: ${modelData.qualityScore}/100)`);
        } catch (error) {
          console.error(`Error processing training data ${entry.filename}:`, error);
        }
      }
    }

    return processedData;
  }

  private async analyzeTrainingData(entry: TrainingData): Promise<TrainingAnalysis> {
    if (!entry.transcription) {
      throw new Error('No transcription available for analysis');
    }

    const analysisPrompt = `
Analyze this COMPLETE insurance call recording transcription and extract comprehensive training data for AI model improvement:

FULL TRANSCRIPTION:
${entry.transcription}

Please provide a detailed JSON response with the following structure:
{
  "customerQuestions": ["extract ALL customer questions, concerns, and objections from the entire call"],
  "agentResponses": ["extract ALL agent responses, explanations, and techniques used throughout the call"],
  "conversationFlow": ["step-by-step flow of the entire conversation from greeting to closure"],
  "keyInsights": ["important insights about customer behavior, needs, and successful agent techniques"],
  "suggestedImprovements": ["specific suggestions for better handling similar calls based on the complete conversation"]
}

ANALYSIS REQUIREMENTS:
1. Process the ENTIRE transcription - don't skip any part
2. Extract ALL customer questions and concerns mentioned throughout the call
3. Document ALL agent responses and techniques used
4. Map the complete conversation flow from beginning to end
5. Identify patterns in customer objections and agent rebuttals
6. Note language preferences (Hindi/English/Marathi/Gujarati)
7. Highlight successful persuasion techniques
8. Identify areas where the conversation could be improved
9. Focus on policy details, premium discussions, and payment conversations

This analysis will be used to train the AI model to handle similar customer interactions more effectively.
5. Specific insurance terminology and processes discussed
`;

    try {
      const response = await openAIService.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are an expert insurance training analyst. Analyze call recordings to extract meaningful training data for AI assistants. Always respond with valid JSON."
          },
          {
            role: "user",
            content: analysisPrompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const analysisResult = JSON.parse(response.choices[0].message.content || '{}');
      return {
        customerQuestions: analysisResult.customerQuestions || [],
        agentResponses: analysisResult.agentResponses || [],
        conversationFlow: analysisResult.conversationFlow || [],
        keyInsights: analysisResult.keyInsights || [],
        suggestedImprovements: analysisResult.suggestedImprovements || []
      };
    } catch (error) {
      console.error('Error analyzing training data:', error);
      return {
        customerQuestions: [],
        agentResponses: [],
        conversationFlow: [],
        keyInsights: [],
        suggestedImprovements: []
      };
    }
  }

  private calculateQualityScore(analysis: TrainingAnalysis, transcription: string): number {
    let score = 0;
    
    // Enhanced scoring for complete audio file transcriptions
    // Base score for transcription length (complete calls should have substantial content)
    if (transcription.length > 1000) score += 30;
    else if (transcription.length > 500) score += 25;
    else if (transcription.length > 200) score += 15;
    else if (transcription.length > 50) score += 10;
    
    // Score for conversation elements (complete calls should have all elements)
    if (analysis.customerQuestions.length >= 3) score += 25;
    else if (analysis.customerQuestions.length >= 1) score += 15;
    
    if (analysis.agentResponses.length >= 3) score += 25;
    else if (analysis.agentResponses.length >= 1) score += 15;
    
    if (analysis.conversationFlow.length >= 5) score += 15;
    else if (analysis.conversationFlow.length >= 3) score += 10;
    
    if (analysis.keyInsights.length >= 2) score += 10;
    else if (analysis.keyInsights.length >= 1) score += 5;
    
    if (analysis.suggestedImprovements.length >= 2) score += 10;
    else if (analysis.suggestedImprovements.length >= 1) score += 5;
    
    // Bonus for complete conversation indicators
    const hasGreeting = transcription.toLowerCase().includes('hello') || 
                       transcription.includes('नमस्ते') || 
                       transcription.includes('हैलो');
    if (hasGreeting) score += 5;
    
    const hasClosing = transcription.toLowerCase().includes('thank you') || 
                      transcription.includes('धन्यवाद') || 
                      transcription.toLowerCase().includes('goodbye');
    if (hasClosing) score += 5;
    
    // Penalize for repetitive or corrupted content
    if (this.isRepetitiveOrCorrupted(transcription)) score -= 40;
    
    // Ensure score is between 0-100
    return Math.max(0, Math.min(100, score));
  }

  private isUsableForTraining(analysis: TrainingAnalysis, transcription: string): boolean {
    // Minimum criteria for usable training data
    return (
      transcription.length > 50 &&
      analysis.customerQuestions.length > 0 &&
      analysis.agentResponses.length > 0 &&
      !this.isRepetitiveOrCorrupted(transcription)
    );
  }

  private isRepetitiveOrCorrupted(text: string): boolean {
    // Check for repetitive patterns
    const words = text.split(' ');
    const wordCounts = new Map<string, number>();
    
    for (const word of words) {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    }
    
    // If any word appears more than 30% of the time, it's likely repetitive
    const totalWords = words.length;
    for (const [word, count] of wordCounts) {
      if (count / totalWords > 0.3 && word.length > 2) {
        return true;
      }
    }
    
    return false;
  }

  async generateTrainingPrompt(processedData: ModelTrainingData[]): Promise<string> {
    const usableData = processedData.filter(d => d.usableForTraining);
    
    if (usableData.length === 0) {
      return '';
    }

    const customerQuestions = usableData.flatMap(d => d.analysis.customerQuestions);
    const agentResponses = usableData.flatMap(d => d.analysis.agentResponses);
    const keyInsights = usableData.flatMap(d => d.analysis.keyInsights);
    
    return `
TRAINING DATA INSIGHTS FOR VEENA AI ASSISTANT:

COMMON CUSTOMER QUESTIONS:
${customerQuestions.slice(0, 10).map((q, i) => `${i + 1}. ${q}`).join('\n')}

EFFECTIVE AGENT RESPONSES:
${agentResponses.slice(0, 10).map((r, i) => `${i + 1}. ${r}`).join('\n')}

KEY INSIGHTS:
${keyInsights.slice(0, 10).map((insight, i) => `${i + 1}. ${insight}`).join('\n')}

TRAINING SUMMARY:
- Analyzed ${usableData.length} training calls
- Average quality score: ${Math.round(usableData.reduce((sum, d) => sum + d.qualityScore, 0) / usableData.length)}%
- Generated training insights for improved customer interactions

Use these insights to provide more natural, empathetic, and effective responses to customers.
`;
  }

  async updateAIModelWithTrainingData(): Promise<void> {
    console.log('Processing training data for AI model improvement...');
    
    const processedData = await this.processAllTrainingData();
    const trainingPrompt = await this.generateTrainingPrompt(processedData);
    
    if (trainingPrompt) {
      console.log('Training prompt generated successfully');
      console.log('Usable training files:', processedData.filter(d => d.usableForTraining).length);
      console.log('Total training files:', processedData.length);
      
      // Store the training insights in the AI service
      await this.storeTrainingInsights(trainingPrompt);
    } else {
      console.log('No usable training data available');
    }
  }

  private async storeTrainingInsights(trainingPrompt: string): Promise<void> {
    // Update the OpenAI service with training insights
    openAIService.updateSystemPromptWithTraining(trainingPrompt);
    console.log('AI model updated with training insights');
  }
}

export const trainingService = new TrainingService();