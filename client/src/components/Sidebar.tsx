import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, DollarSign, Calculator, Shield } from "lucide-react";

interface SidebarProps {
  analytics?: {
    messageCount: number;
    avgResponseTime: number;
    sessionDuration: number;
    voiceMessages: number;
    voiceQuality: number;
  };
  onQuickAction: (question: string) => void;
}

export default function Sidebar({ analytics, onQuickAction }: SidebarProps) {
  const quickActions = [
    {
      icon: FileText,
      title: "Policy Information",
      subtitle: "Ask about policies",
      question: "Can you explain different types of life insurance policies?",
      bgColor: "bg-blue-100",
      iconColor: "text-primary"
    },
    {
      icon: DollarSign,
      title: "Claims Process",
      subtitle: "How to file claims",
      question: "How do I file an insurance claim?",
      bgColor: "bg-green-100",
      iconColor: "text-accent"
    },
    {
      icon: Calculator,
      title: "Premium Calculator",
      subtitle: "Calculate premiums",
      question: "How are insurance premiums calculated?",
      bgColor: "bg-purple-100",
      iconColor: "text-purple-600"
    },
    {
      icon: Shield,
      title: "Coverage Options",
      subtitle: "Types of coverage",
      question: "What coverage options are available?",
      bgColor: "bg-orange-100",
      iconColor: "text-orange-600"
    }
  ];

  const knowledgeBaseItems = [
    "Life Insurance FAQ",
    "Health Insurance Guide",
    "Claims Processing",
    "Premium Calculations",
    "Call Recordings (Training)"
  ];

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getVoiceQualityLabel = (quality: number) => {
    if (quality >= 0.8) return { label: "Excellent", color: "text-accent" };
    if (quality >= 0.6) return { label: "Good", color: "text-blue-600" };
    if (quality >= 0.4) return { label: "Fair", color: "text-yellow-600" };
    return { label: "Poor", color: "text-red-600" };
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant="ghost"
              className="w-full justify-start p-3 h-auto"
              onClick={() => onQuickAction(action.question)}
            >
              <div className="flex items-center space-x-3 w-full">
                <div className={`w-8 h-8 ${action.bgColor} rounded-lg flex items-center justify-center`}>
                  <action.icon className={`${action.iconColor} w-4 h-4`} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">{action.title}</p>
                  <p className="text-xs text-muted-foreground">{action.subtitle}</p>
                </div>
              </div>
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Session Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Session Stats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Messages</span>
            <span className="text-sm font-medium text-gray-900">
              {analytics?.messageCount || 0}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Duration</span>
            <span className="text-sm font-medium text-gray-900">
              {analytics?.sessionDuration ? formatDuration(analytics.sessionDuration) : "0:00"}
            </span>
          </div>
          {analytics?.voiceMessages && analytics.voiceMessages > 0 && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Voice Quality</span>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-accent rounded-full"></div>
                  <span className={`text-sm font-medium ${getVoiceQualityLabel(analytics.voiceQuality).color}`}>
                    {getVoiceQualityLabel(analytics.voiceQuality).label}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Voice Messages</span>
                <span className="text-sm font-medium text-gray-900">
                  {analytics.voiceMessages}
                </span>
              </div>
            </>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Response Time</span>
            <span className="text-sm font-medium text-gray-900">
              {analytics?.avgResponseTime ? `${(analytics.avgResponseTime / 1000).toFixed(1)}s` : "N/A"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Knowledge Base */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Knowledge Base</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {knowledgeBaseItems.map((item, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className={`w-2 h-2 rounded-full ${
                item.includes("Training") ? "bg-yellow-400" : "bg-accent"
              }`}></div>
              <span className="text-sm text-gray-900">{item}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
