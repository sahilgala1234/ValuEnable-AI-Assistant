import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import ConversationArea from "./ConversationArea";
import Sidebar from "./Sidebar";
import VoiceModal from "./VoiceModal";
import { useToast } from "@/hooks/use-toast";
import type { ConversationWithMessages } from "@shared/schema";

export default function VoiceAssistant() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [voiceButtonDisabled, setVoiceButtonDisabled] = useState(false);
  const voiceClickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize conversation
  const { mutate: createConversation } = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("/api/conversations", { method: "POST" });
      return res.json();
    },
    onSuccess: (data) => {
      setSessionId(data.sessionId);
      queryClient.setQueryData(["/api/conversations", data.sessionId], data);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to initialize conversation",
        variant: "destructive",
      });
    }
  });

  // Get conversation data
  const { data: conversation, isLoading } = useQuery({
    queryKey: ["/api/conversations", sessionId],
    enabled: !!sessionId,
    refetchInterval: 2000, // Refetch every 2 seconds for real-time updates
    staleTime: 0, // Consider data stale immediately
  });

  // Get analytics
  const { data: analytics } = useQuery({
    queryKey: ["/api/conversations", sessionId, "analytics"],
    enabled: !!sessionId,
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Send text message
  const { mutate: sendMessage, isPending: isSendingMessage } = useMutation({
    mutationFn: async (content: string) => {
      if (!sessionId) throw new Error("No active session");
      const res = await apiRequest(`/api/conversations/${sessionId}/messages`, { 
        method: "POST", 
        body: { content } 
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", sessionId, "analytics"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  });

  // Send voice message
  const { mutate: sendVoiceMessage, isPending: isSendingVoice } = useMutation({
    mutationFn: async (audioBlob: Blob) => {
      if (!sessionId) throw new Error("No active session");
      const arrayBuffer = await audioBlob.arrayBuffer();
      const res = await fetch(`/api/conversations/${sessionId}/voice`, {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
        },
        body: arrayBuffer,
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      return res.json();
    },
    onSuccess: (data) => {
      console.log('Voice message processed successfully:', data);
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", sessionId, "analytics"] });
      setIsVoiceModalOpen(false);
      setVoiceButtonDisabled(false);
      toast({
        title: "Voice Message Processed",
        description: "Your voice message has been processed successfully",
      });
    },
    onError: (error) => {
      console.error("Voice message error:", error);
      toast({
        title: "Error",
        description: "Failed to process voice message",
        variant: "destructive",
      });
      setIsVoiceModalOpen(false);
    }
  });

  // Clear conversation
  const { mutate: clearConversation } = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("/api/conversations", { method: "POST" });
      return res.json();
    },
    onSuccess: (data) => {
      setSessionId(data.sessionId);
      queryClient.setQueryData(["/api/conversations", data.sessionId], data);
      queryClient.removeQueries({ queryKey: ["/api/conversations"] });
      toast({
        title: "Success",
        description: "Conversation cleared",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clear conversation",
        variant: "destructive",
      });
    }
  });

  // Initialize on mount
  useEffect(() => {
    createConversation();
    
    // Cleanup on unmount
    return () => {
      if (voiceClickTimeoutRef.current) {
        clearTimeout(voiceClickTimeoutRef.current);
      }
    };
  }, []);

  const handleQuickAction = (question: string) => {
    sendMessage(question);
  };

  const handleVoiceInput = () => {
    // Clear any existing timeout
    if (voiceClickTimeoutRef.current) {
      clearTimeout(voiceClickTimeoutRef.current);
    }
    
    // Prevent opening multiple modals
    if (isVoiceModalOpen || isSendingVoice) {
      return;
    }
    
    // Temporarily disable the button to prevent double-clicks only for a short time
    setVoiceButtonDisabled(true);
    setIsVoiceModalOpen(true);
    
    // Re-enable the button after a short delay
    voiceClickTimeoutRef.current = setTimeout(() => {
      setVoiceButtonDisabled(false);
    }, 300); // Reduced from 1000ms to 300ms
  };

  const handleVoiceComplete = (audioBlob: Blob) => {
    sendVoiceMessage(audioBlob);
  };

  const handleVoiceCancel = () => {
    setIsVoiceModalOpen(false);
    setVoiceButtonDisabled(false);
    
    // Clear any pending timeout
    if (voiceClickTimeoutRef.current) {
      clearTimeout(voiceClickTimeoutRef.current);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Initializing AI Assistant...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <ConversationArea
            conversation={conversation}
            onSendMessage={sendMessage}
            onVoiceInput={handleVoiceInput}
            onClearConversation={clearConversation}
            isSendingMessage={isSendingMessage}
            isSendingVoice={isSendingVoice}
          />
        </div>
        <div className="lg:col-span-1">
          <Sidebar
            analytics={analytics}
            onQuickAction={handleQuickAction}
          />
        </div>
      </div>
      
      <VoiceModal
        isOpen={isVoiceModalOpen}
        onComplete={handleVoiceComplete}
        onCancel={handleVoiceCancel}
        isProcessing={isSendingVoice}
      />
    </div>
  );
}
