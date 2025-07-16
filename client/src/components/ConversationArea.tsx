import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, User, Mic, MicOff, Trash2, Download, Send, Volume2, VolumeX } from "lucide-react";
import type { ConversationWithMessages } from "@shared/schema";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";

interface ConversationAreaProps {
  conversation?: ConversationWithMessages;
  onSendMessage: (content: string) => void;
  onVoiceInput: () => void;
  onClearConversation: () => void;
  isSendingMessage: boolean;
  isSendingVoice: boolean;
}

export default function ConversationArea({
  conversation,
  onSendMessage,
  onVoiceInput,
  onClearConversation,
  isSendingMessage,
  isSendingVoice
}: ConversationAreaProps) {
  const [inputValue, setInputValue] = useState("");
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [lastSpokenMessageId, setLastSpokenMessageId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { speak, cancel, speaking, supported: speechSupported } = useSpeechSynthesis();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages]);

  // Auto-speak new AI messages
  useEffect(() => {
    if (!conversation?.messages || !speechSupported || !autoSpeak) return;
    
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    
    if (lastMessage && 
        lastMessage.type === 'ai' && 
        lastMessage.id !== lastSpokenMessageId) {
      
      // Small delay to ensure message is fully rendered
      setTimeout(() => {
        speak(lastMessage.content, {
          rate: 0.95,
          pitch: 1.1,
          volume: 0.9,
          lang: 'en-US'
        });
        setLastSpokenMessageId(lastMessage.id);
      }, 500);
    }
  }, [conversation?.messages, speechSupported, autoSpeak, lastSpokenMessageId, speak]);

  const handleSendMessage = () => {
    if (inputValue.trim() && !isSendingMessage) {
      onSendMessage(inputValue.trim());
      setInputValue("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleExportTranscript = () => {
    if (!conversation?.messages) return;
    
    const transcript = conversation.messages
      .map(msg => `${msg.type.toUpperCase()}: ${msg.content}`)
      .join('\n\n');
    
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation_${conversation.sessionId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSpeakMessage = (content: string) => {
    if (speaking) {
      cancel();
    } else {
      speak(content, {
        rate: 0.95,
        pitch: 1.1,
        volume: 0.9,
        lang: 'en-US'
      });
    }
  };

  const toggleAutoSpeak = () => {
    setAutoSpeak(!autoSpeak);
    if (!autoSpeak) {
      // If turning on auto-speak, stop any current speech
      cancel();
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(date));
  };

  return (
    <Card className="h-[600px] flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <Bot className="text-white text-sm" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">AI Assistant</h3>
              <p className="text-sm text-muted-foreground">
                {isSendingMessage || isSendingVoice 
                  ? "Thinking..." 
                  : "Ready to help with insurance queries"
                }
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {speechSupported && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleAutoSpeak}
                className={`px-3 py-1 text-sm ${
                  autoSpeak ? "bg-accent/10 text-accent" : "text-muted-foreground"
                }`}
              >
                {autoSpeak ? (
                  <Volume2 className="w-4 h-4 mr-1" />
                ) : (
                  <VolumeX className="w-4 h-4 mr-1" />
                )}
                Auto-speak {autoSpeak ? "ON" : "OFF"}
              </Button>
            )}
            <div className="px-3 py-1 bg-accent/10 text-accent rounded-full text-sm font-medium">
              <Mic className="w-4 h-4 mr-1 inline" />
              Voice Enabled
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
        {conversation?.messages?.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-3 ${
              message.type === "user" ? "justify-end" : ""
            }`}
          >
            {message.type === "ai" && (
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="text-white text-sm" />
              </div>
            )}
            
            <div className={`flex-1 ${message.type === "user" ? "flex justify-end" : ""}`}>
              <div
                className={`rounded-2xl px-4 py-3 max-w-md ${
                  message.type === "user"
                    ? "bg-primary text-white rounded-tr-md"
                    : "bg-gray-100 text-gray-900 rounded-tl-md"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                {message.type === "ai" && speechSupported && (
                  <div className="flex items-center mt-2 pt-2 border-t border-gray-200">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSpeakMessage(message.content)}
                      className="h-6 px-2 text-xs"
                    >
                      {speaking ? (
                        <VolumeX className="w-3 h-3 mr-1" />
                      ) : (
                        <Volume2 className="w-3 h-3 mr-1" />
                      )}
                      {speaking ? "Stop" : "Speak"}
                    </Button>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {message.type === "ai" ? "AI Assistant" : "You"} • {formatTime(message.timestamp)}
                {message.voiceData && (
                  <span className="ml-2 text-accent">
                    🎤 Voice ({Math.round(message.voiceData.confidence * 100)}%)
                  </span>
                )}
              </p>
            </div>

            {message.type === "user" && (
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="text-gray-600 text-sm" />
              </div>
            )}
          </div>
        ))}

        {/* Processing Indicator */}
        {(isSendingMessage || isSendingVoice) && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-primary rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <span className="text-muted-foreground ml-3">
                {isSendingVoice ? "Processing your voice..." : "Generating response..."}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </CardContent>

      {/* Input Area */}
      <div className="px-6 py-4 border-t border-gray-200">
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex-1 flex items-center space-x-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your insurance question..."
              disabled={isSendingMessage || isSendingVoice}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isSendingMessage || isSendingVoice}
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              onClick={onVoiceInput}
              disabled={isSendingMessage || isSendingVoice}
              className="w-12 h-12 rounded-full shadow-lg"
              size="icon"
            >
              {isSendingVoice ? (
                <MicOff className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </Button>
            <div className="flex flex-col">
              <p className="text-sm font-medium text-gray-900">Voice Input</p>
              <p className="text-xs text-muted-foreground">
                {isSendingVoice ? "Processing..." : "Click to start speaking"}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={onClearConversation}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-gray-900"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Chat
            </Button>
            <Button
              onClick={handleExportTranscript}
              variant="outline"
              size="sm"
              disabled={!conversation?.messages?.length}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
