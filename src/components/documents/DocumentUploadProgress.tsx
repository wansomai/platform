// components/ui/DocumentUploadProgress.tsx
import { CheckCircle, Upload, FileText, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface DocumentUploadProgressProps {
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'attaching' | 'completed' | 'error';
  error?: string;
}

export function DocumentUploadProgress({ 
  fileName, 
  progress, 
  status, 
  error 
}: DocumentUploadProgressProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'uploading':
        return <Upload className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'processing':
        return <FileText className="h-4 w-4 text-orange-500 animate-pulse" />;
      case 'attaching':
        return <FileText className="h-4 w-4 text-purple-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Upload className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'uploading':
        return `Uploading ${fileName}...`;
      case 'processing':
        return `Processing ${fileName}...`;
      case 'attaching':
        return `Adding to conversation...`;
      case 'completed':
        return `${fileName} uploaded and added successfully`;
      case 'error':
        return error || `Failed to upload ${fileName}`;
      default:
        return fileName;
    }
  };

  const getProgressColor = () => {
    switch (status) {
      case 'error':
        return 'bg-red-500';
      case 'completed':
        return 'bg-green-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <div className="space-y-2 p-3 border rounded-lg bg-white">
      <div className="flex items-center space-x-2">
        {getStatusIcon()}
        <span className="text-sm font-medium truncate flex-1">
          {getStatusText()}
        </span>
        {status !== 'error' && status !== 'completed' && (
          <span className="text-xs text-muted-foreground">
            {progress}%
          </span>
        )}
      </div>
      
      {status !== 'error' && status !== 'completed' && (
        <Progress 
          value={progress} 
          className="h-2"
        />
      )}
      
      {status === 'error' && error && (
        <p className="text-xs text-red-600 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}