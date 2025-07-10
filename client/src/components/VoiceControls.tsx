import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";

interface VoiceControlsProps {
  onVoiceInput: () => void;
  onPlayLastResponse?: () => void;
  isRecording?: boolean;
  isProcessing?: boolean;
  lastAIResponse?: string;
}

export default function VoiceControls({
  onVoiceInput,
  onPlayLastResponse,
  isRecording = false,
  isProcessing = false,
  lastAIResponse
}: VoiceControlsProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { speak, cancel, speaking, supported: speechSupported } = useSpeechSynthesis();

  const handlePlayResponse = () => {
    if (!lastAIResponse || !speechSupported) return;
    
    if (speaking) {
      cancel();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      speak(lastAIResponse, {
        rate: 1.0,
        pitch: 1.0,
        volume: 0.8,
        lang: 'en-US'
      });
      
      // Reset speaking state after speech ends
      setTimeout(() => {
        setIsSpeaking(false);
      }, lastAIResponse.length * 50); // Rough estimate based on speech length
    }
  };

  return (
    <Card className="bg-gray-50 border-gray-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Voice Input Button */}
            <Button
              onClick={onVoiceInput}
              disabled={isProcessing}
              className={`w-12 h-12 rounded-full shadow-lg transition-all duration-200 hover:scale-105 ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-primary hover:bg-blue-700'
              }`}
              size="icon"
            >
              {isRecording ? (
                <MicOff className="w-5 h-5 text-white" />
              ) : (
                <Mic className="w-5 h-5 text-white" />
              )}
            </Button>

            {/* Voice Status */}
            <div className="flex flex-col">
              <p className="text-sm font-medium text-gray-900">
                {isProcessing ? 'Processing...' : 
                 isRecording ? 'Recording...' : 
                 'Voice Input'}
              </p>
              <p className="text-xs text-muted-foreground">
                {isProcessing ? 'Please wait' :
                 isRecording ? 'Speak now' :
                 'Click to start speaking'}
              </p>
            </div>
          </div>

          {/* Text-to-Speech Controls */}
          {speechSupported && lastAIResponse && (
            <div className="flex items-center space-x-3">
              <Button
                onClick={handlePlayResponse}
                variant="outline"
                size="sm"
                disabled={isProcessing || isRecording}
                className="flex items-center space-x-2"
              >
                {speaking || isSpeaking ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
                <span>
                  {speaking || isSpeaking ? 'Stop' : 'Play Response'}
                </span>
              </Button>
            </div>
          )}
        </div>

        {/* Voice Quality Indicator */}
        {isRecording && (
          <div className="mt-4 flex items-center justify-center">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              <span className="text-xs text-muted-foreground ml-3">Recording audio...</span>
            </div>
          </div>
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="mt-4 flex items-center justify-center">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <span className="text-xs text-muted-foreground ml-3">Processing voice input...</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
