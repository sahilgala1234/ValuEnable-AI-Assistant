import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Upload, FileAudio, Clock, CheckCircle, XCircle, ArrowLeft, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

interface TrainingData {
  id: number;
  filename: string;
  fileType: string;
  fileSize: number;
  processingStatus: "pending" | "processing" | "completed" | "failed";
  transcription: string | null;
  createdAt: string;
  metadata: {
    description?: string;
    confidence?: number;
    error?: string;
  } | null;
}

export default function Training() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for training data
  const { data: trainingData, isLoading } = useQuery<TrainingData[]>({
    queryKey: ["/api/training"],
    refetchInterval: 5000, // Refresh every 5 seconds to update processing status
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (data: { file: File; description: string }) => {
      const formData = new FormData();
      formData.append("file", data.file);
      formData.append("description", data.description);

      const response = await fetch("/api/training/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Upload successful",
        description: "Your training file has been uploaded and is being processed.",
      });
      setSelectedFile(null);
      setDescription("");
      queryClient.invalidateQueries({ queryKey: ["/api/training"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    uploadMutation.mutate({ file: selectedFile, description });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "processing":
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Processing</Badge>;
      case "completed":
        return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case "failed":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Assistant
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Shield className="text-white text-sm" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Training Data Management</h1>
                <p className="text-sm text-gray-600">Upload call recordings to train the AI assistant</p>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Training Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">Select Audio/Video File</Label>
              <Input
                id="file"
                type="file"
                accept=".mp4,.wav,.mp3,.webm,.ogg,.m4a"
                onChange={handleFileSelect}
                disabled={uploadMutation.isPending}
              />
              {selectedFile && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileAudio className="w-4 h-4" />
                  {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description for this training data..."
                disabled={uploadMutation.isPending}
              />
            </div>

            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploadMutation.isPending}
              className="w-full"
            >
              {uploadMutation.isPending ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Training Data
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Training Data List */}
        <Card>
          <CardHeader>
            <CardTitle>Training Data Files</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <Clock className="w-8 h-8 mx-auto mb-2 animate-spin text-gray-400" />
                <p className="text-gray-600">Loading training data...</p>
              </div>
            ) : trainingData && trainingData.length > 0 ? (
              <div className="space-y-4">
                {trainingData.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileAudio className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{item.filename}</span>
                      </div>
                      {getStatusBadge(item.processingStatus)}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>Size: {formatFileSize(item.fileSize)}</div>
                      <div>Type: {item.fileType}</div>
                      <div>Uploaded: {new Date(item.createdAt).toLocaleString()}</div>
                      {item.metadata?.confidence && (
                        <div>Confidence: {Math.round(item.metadata.confidence * 100)}%</div>
                      )}
                    </div>

                    {item.metadata?.description && (
                      <div className="text-sm text-gray-700">
                        <strong>Description:</strong> {item.metadata.description}
                      </div>
                    )}

                    {item.transcription && (
                      <div className="text-sm">
                        <strong>Transcription:</strong>
                        <div className="mt-1 p-2 bg-gray-100 rounded text-gray-700">
                          {item.transcription}
                        </div>
                      </div>
                    )}

                    {item.metadata?.error && (
                      <div className="text-sm text-red-600">
                        <strong>Error:</strong> {item.metadata.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileAudio className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-600">No training data uploaded yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}