import { openAIService } from './openai';
import { storage } from '../storage';
import type { TrainingData } from '@shared/schema';
import { TrainingPrompts, PromptManager } from '../prompts/index';

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
Analyze this insurance call recording transcription and extract structured training data:

TRANSCRIPTION:
${entry.transcription}

${TrainingPrompts.TRAINING_ANALYSIS_PROMPT}
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
    
    // Check transcription quality
    if (transcription.length > 50) score += 20;
    if (transcription.length > 200) score += 10;
    
    // Check analysis completeness
    if (analysis.customerQuestions.length > 0) score += 20;
    if (analysis.agentResponses.length > 0) score += 20;
    if (analysis.conversationFlow.length > 0) score += 15;
    if (analysis.keyInsights.length > 0) score += 10;
    if (analysis.suggestedImprovements.length > 0) score += 5;
    
    return Math.min(score, 100);
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
    const averageQualityScore = usableData.reduce((sum, d) => sum + d.qualityScore, 0) / usableData.length;
    
    return PromptManager.formatTrainingPrompt({
      customerQuestions,
      agentResponses,
      keyInsights,
      usableDataCount: usableData.length,
      averageQualityScore
    });
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