import { openAIService } from "./openai";
import type { VoiceTranscriptionResponse } from "@shared/schema";

export class SpeechService {
  async transcribeVoiceData(audioBuffer: Buffer): Promise<VoiceTranscriptionResponse> {
    const startTime = Date.now();
    
    try {
      const result = await openAIService.transcribeAudio(audioBuffer);
      const duration = Date.now() - startTime;
      
      return {
        text: result.text,
        confidence: result.confidence,
        duration: duration / 1000 // Convert to seconds
      };
    } catch (error) {
      console.error('Speech transcription error:', error);
      throw new Error('Failed to transcribe speech');
    }
  }

  validateAudioData(audioBuffer: Buffer): boolean {
    // Basic validation - check if buffer exists and has minimum size
    return audioBuffer && audioBuffer.length > 1000; // At least 1KB
  }

  async processVoiceInput(audioBuffer: Buffer): Promise<{
    transcription: VoiceTranscriptionResponse;
    isValid: boolean;
    error?: string;
  }> {
    try {
      if (!this.validateAudioData(audioBuffer)) {
        return {
          transcription: { text: '', confidence: 0, duration: 0 },
          isValid: false,
          error: 'Invalid audio data'
        };
      }

      const transcription = await this.transcribeVoiceData(audioBuffer);
      
      return {
        transcription,
        isValid: transcription.text.trim().length > 0,
        error: transcription.text.trim().length === 0 ? 'No speech detected' : undefined
      };
    } catch (error) {
      return {
        transcription: { text: '', confidence: 0, duration: 0 },
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const speechService = new SpeechService();
