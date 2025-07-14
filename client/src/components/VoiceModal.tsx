import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mic, Square, Volume2 } from "lucide-react";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";

interface VoiceModalProps {
  isOpen: boolean;
  onComplete: (audioBlob: Blob) => void;
  onCancel: () => void;
  isProcessing: boolean;
}

export default function VoiceModal({ isOpen, onComplete, onCancel, isProcessing }: VoiceModalProps) {
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'stopped'>('idle');
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const processedAudioRef = useRef<Blob | null>(null);
  
  const {
    isSupported: isVoiceSupported,
    isRecording,
    startRecording,
    stopRecording,
    audioBlob,
    error: voiceError,
    resetRecording
  } = useVoiceRecognition();

  const {
    speak,
    speaking,
    supported: speechSupported
  } = useSpeechSynthesis();

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setTranscript('');
      setConfidence(0);
      processedAudioRef.current = null;
      setRecordingState('idle');
      resetRecording(); // Reset audio recording state
    }
  }, [isOpen, resetRecording]);

  // Prevent multiple modals by ensuring only one can be open at a time
  useEffect(() => {
    if (isOpen && isProcessing) {
      // Modal is open and processing, prevent any other actions
      return;
    }
  }, [isOpen, isProcessing]);

  // Handle audio blob completion
  useEffect(() => {
    if (audioBlob && recordingState === 'stopped' && audioBlob !== processedAudioRef.current) {
      processedAudioRef.current = audioBlob;
      onComplete(audioBlob);
    }
  }, [audioBlob, recordingState, onComplete]);

  const handleStartRecording = async () => {
    try {
      // Clear any previous audio blob before starting new recording
      resetRecording();
      setRecordingState('recording');
      await startRecording();
    } catch (error) {
      console.error('Failed to start recording:', error);
      setRecordingState('idle');
    }
  };

  const handleStopRecording = () => {
    setRecordingState('stopped');
    stopRecording();
  };

  const handleCancel = () => {
    if (isRecording) {
      stopRecording();
    }
    setRecordingState('idle');
    resetRecording(); // Reset audio recording state
    onCancel();
  };

  const handleTestSpeech = () => {
    speak("Hello! I'm your ValuEnable AI assistant. I can help you with insurance questions.");
  };

  if (!isVoiceSupported) {
    return (
      <Dialog open={isOpen} onOpenChange={onCancel}>
        <DialogContent className="max-w-md">
          <DialogTitle className="sr-only">Voice Not Supported</DialogTitle>
          <DialogDescription className="sr-only">Browser does not support voice recording functionality</DialogDescription>
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mic className="text-red-500 text-2xl" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Voice Not Supported</h3>
            <p className="text-muted-foreground mb-6">
              Your browser doesn't support voice input. Please use a modern browser like Chrome, Firefox, or Safari.
            </p>
            <Button onClick={onCancel}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogTitle className="sr-only">Voice Input</DialogTitle>
        <DialogDescription className="sr-only">Record voice input for insurance questions</DialogDescription>
        <div className="text-center py-8">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Mic className={`text-white text-2xl ${isRecording ? 'animate-pulse' : ''}`} />
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {isProcessing ? 'Processing...' : 
             recordingState === 'recording' ? 'Listening...' : 
             recordingState === 'stopped' ? 'Processing...' : 'Voice Input'}
          </h3>
          
          <p className="text-muted-foreground mb-6">
            {isProcessing ? 'Please wait while we process your voice message' :
             recordingState === 'recording' ? 'Speak your insurance question clearly' :
             recordingState === 'stopped' ? 'Converting speech to text...' :
             'Click the microphone to start recording'}
          </p>

          {transcript && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-700 mb-2">"{transcript}"</p>
              {confidence > 0 && (
                <p className="text-xs text-muted-foreground">
                  Confidence: {Math.round(confidence * 100)}%
                </p>
              )}
            </div>
          )}

          {voiceError && (
            <div className="bg-red-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-700">{voiceError}</p>
            </div>
          )}

          <div className="flex justify-center space-x-4">
            {recordingState === 'idle' && (
              <>
                <Button
                  onClick={handleStartRecording}
                  disabled={isProcessing}
                  className="px-6 py-3"
                >
                  <Mic className="w-4 h-4 mr-2" />
                  Start Recording
                </Button>
                {speechSupported && (
                  <Button
                    onClick={handleTestSpeech}
                    variant="outline"
                    disabled={speaking}
                  >
                    <Volume2 className="w-4 h-4 mr-2" />
                    Test Speech
                  </Button>
                )}
              </>
            )}
            
            {recordingState === 'recording' && (
              <Button
                onClick={handleStopRecording}
                variant="destructive"
                className="px-6 py-3"
              >
                <Square className="w-4 h-4 mr-2" />
                Stop Recording
              </Button>
            )}
            
            {recordingState !== 'recording' && (
              <Button
                onClick={handleCancel}
                variant="outline"
                disabled={isProcessing}
                className="px-6 py-3"
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
