import { useEffect } from "react";
import VoiceAssistant from "@/components/VoiceAssistant";
import { Shield } from "lucide-react";

export default function Home() {
  useEffect(() => {
    document.title = "ValuEnable AI Assistant - Insurance Voice Helper";
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Shield className="text-white text-lg" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">ValuEnable AI Assistant</h1>
                <p className="text-sm text-muted-foreground">Insurance Voice Helper</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                <span>System Active</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <VoiceAssistant />
    </div>
  );
}
