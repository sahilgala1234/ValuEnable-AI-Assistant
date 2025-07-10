import type { VoiceTranscriptionResponse } from "@shared/schema";

export class ElevenLabsService {
  private apiKey: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';

  constructor() {
    this.apiKey = process.env.ELEVEN_LABS_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('ELEVEN_LABS_API_KEY environment variable is required');
    }
  }

  async transcribeAudio(audioBuffer: Buffer): Promise<VoiceTranscriptionResponse> {
    // ElevenLabs doesn't have speech-to-text, use OpenAI Whisper directly
    console.log('Using OpenAI Whisper for transcription...');
    return this.transcribeWithOpenAI(audioBuffer);
  }

  private async transcribeWithOpenAI(audioBuffer: Buffer): Promise<VoiceTranscriptionResponse> {
    const startTime = Date.now();
    
    try {
      // Use the improved OpenAI service for transcription
      const { openAIService } = await import('./openai');
      const result = await openAIService.transcribeAudio(audioBuffer);
      const duration = (Date.now() - startTime) / 1000;

      console.log('OpenAI transcription successful:', { 
        text: result.text.substring(0, 100) + '...', 
        confidence: result.confidence,
        duration 
      });

      return {
        text: result.text,
        confidence: result.confidence,
        duration: duration
      };
    } catch (error) {
      console.error('OpenAI Whisper transcription error:', error);
      throw new Error('Failed to transcribe audio with OpenAI Whisper');
    }
  }

  async synthesizeSpeech(text: string, voiceId: string = 'EXAVITQu4vr4xnSDxMaL'): Promise<Buffer> {
    try {
      const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
            style: 0.0,
            use_speaker_boost: true
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs TTS error: ${response.status} ${response.statusText}`);
      }

      const audioBuffer = await response.arrayBuffer();
      return Buffer.from(audioBuffer);
    } catch (error) {
      console.error('ElevenLabs TTS error:', error);
      throw new Error('Failed to synthesize speech');
    }
  }

  async getVoices() {
    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('ElevenLabs get voices error:', error);
      throw new Error('Failed to get voices');
    }
  }
}

export const elevenLabsService = new ElevenLabsService();