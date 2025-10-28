// components/onboarding/GenerationWizard.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle, AlertCircle, Clock, FileText, Target, Search, Sparkles } from 'lucide-react';

interface GenerationProgress {
  currentStage: string;
  currentProgress: number;
  totalPages?: number;
  completedPages: number;
  currentPageName?: string;
  errorMessage?: string;
  estimatedTimeLeft?: number;
  startedAt?: string;
}

interface GenerationWizardProps {
  onComplete: () => void;
  userId: string;
}

export default function GenerationWizard({ onComplete, userId }: GenerationWizardProps) {
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);

  // Stage configurations with enhanced visuals
  const stages = {
    analyzing: { 
      label: 'Analyzing Your Practice', 
      icon: '🔍',
      description: 'Understanding your practice areas and locations',
      color: 'bg-blue-100 text-blue-700'
    },
    researching: { 
      label: 'Researching Content Strategy', 
      icon: '📊',
      description: 'Analyzing competitors and keyword opportunities',
      color: 'bg-purple-100 text-purple-700'
    },
    generating_faqs: { 
      label: 'Creating FAQ Content', 
      icon: '❓',
      description: 'Generating common legal questions and answers',
      color: 'bg-green-100 text-green-700'
    },
    creating_pages: { 
      label: 'Building Foundation Pages', 
      icon: '📄',
      description: 'Creating optimized landing pages for each practice area',
      color: 'bg-orange-100 text-orange-700'
    },
    completed: { 
      label: 'Finalizing Your Content Library', 
      icon: '✅',
      description: 'Your AI-powered legal website is ready!',
      color: 'bg-green-100 text-green-700'
    },
    error: { 
      label: 'Generation Failed', 
      icon: '❌',
      description: 'Something went wrong during generation',
      color: 'bg-red-100 text-red-700'
    }
  };

  useEffect(() => {
    const startGeneration = async () => {
      try {
        setIsStarting(true);
        
        // Check if generation is needed first
        const checkResponse = await fetch('/api/foundation-pages');
        const checkData = await checkResponse.json();
        
        if (!checkData.needsGeneration) {
          // Generation not needed, complete immediately
          setTimeout(() => onComplete(), 1000);
          return;
        }
        
        // Start generation
        const startResponse = await fetch('/api/foundation-pages', { 
          method: 'POST' 
        });
        
        if (!startResponse.ok) {
          const errorData = await startResponse.json();
          throw new Error(errorData.error || 'Failed to start generation');
        }

        const startData = await startResponse.json();    
        setIsStarting(false);
      } catch (err) {
        console.error('Failed to start generation:', err);
        setError(err instanceof Error ? err.message : 'Failed to start generation');
        setIsStarting(false);
      }
    };

    if (userId) {
      startGeneration();
    }
  }, [userId, onComplete]);

  useEffect(() => {
    if (isStarting || error) return;

    // Poll for progress
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/generation-progress');
        const data = await response.json();
        
        if (data.progress) {
          setProgress(data.progress);
          
          // Call onComplete when generation is finished
          if (data.progress.currentStage === 'completed') {
            clearInterval(interval);
            // Show success message briefly before completing
            setTimeout(() => {
              onComplete();
            }, 2000);
          }
          
          // Handle errors
          if (data.progress.currentStage === 'error') {
            clearInterval(interval);
            setError(data.progress.errorMessage || 'Generation failed');
          }
        }
      } catch (err) {
        console.error('Failed to fetch progress:', err);
        setError('Failed to fetch progress');
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isStarting, error, onComplete]);

  // Format time remaining
  const formatTimeRemaining = (seconds?: number) => {
    if (!seconds) return 'Calculating...';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-8 max-w-md w-full text-center shadow-lg">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Generation Failed</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => {
                setError(null);
                setIsStarting(true);
                window.location.reload();
              }}
              className="w-full bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-hover transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={onComplete}
              className="w-full border border-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-50 transition-colors"
            >
              Skip and Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Starting state
  if (isStarting || !progress) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-8 max-w-md w-full text-center shadow-lg">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 animate-spin text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Initializing AI Generation
          </h2>
          <p className="text-gray-600">
            {isStarting ? 'Preparing your content generation...' : 'Starting generation process...'}
          </p>
        </div>
      </div>
    );
  }

  const currentStageConfig = stages[progress.currentStage as keyof typeof stages];
  const isCompleted = progress.currentStage === 'completed';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-8 max-w-3xl w-full shadow-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Creating Your AI-Powered Legal Website
          </h1>
          <p className="text-gray-600">
            We're generating optimized foundation pages based on your practice areas and locations
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center text-sm text-gray-600 mb-3">
            <span className="font-medium">Overall Progress</span>
            <div className="flex items-center space-x-4">
              <span className="font-bold text-primary">{progress.currentProgress}%</span>
              {progress.estimatedTimeLeft && (
                <div className="flex items-center space-x-1 text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>{formatTimeRemaining(progress.estimatedTimeLeft)}</span>
                </div>
              )}
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-primary to-secondary h-4 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${progress.currentProgress}%` }}
            />
          </div>
        </div>

        {/* Current Stage */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">{currentStageConfig?.icon}</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            {currentStageConfig?.label}
          </h2>
          <p className="text-gray-600 mb-4">
            {currentStageConfig?.description}
          </p>
          
          {progress.currentPageName && progress.totalPages && (
            <div className="bg-gray-50 rounded-lg p-4 mt-4">
              <p className="text-sm text-gray-600 mb-2">Currently generating:</p>
              <p className="font-medium text-gray-900">{progress.currentPageName}</p>
              <p className="text-sm text-gray-500 mt-1">
                Page {progress.completedPages + 1} of {progress.totalPages}
              </p>
            </div>
          )}
          
          {isCompleted && (
            <div className="mt-6">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 font-medium mb-1">
                  🎉 Generation Complete!
                </p>
                <p className="text-green-700 text-sm">
                  Taking you to your dashboard...
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Stage Progress List */}
        <div className="space-y-3">
          {Object.entries(stages).filter(([key]) => key !== 'error').map(([key, stage]) => {
            const stageIndex = Object.keys(stages).indexOf(key);
            const currentIndex = Object.keys(stages).indexOf(progress.currentStage);
            
            const isCompleted = currentIndex > stageIndex || progress.currentStage === 'completed';
            const isCurrent = progress.currentStage === key;
            const isPending = currentIndex < stageIndex;
            
            return (
              <div
                key={key}
                className={`flex items-center space-x-4 p-4 rounded-lg transition-all duration-300 ${
                  isCurrent ? 'bg-primary/10 border-2 border-primary/20' : 
                  isCompleted ? 'bg-green-50 border border-green-200' : 
                  'bg-gray-50 border border-gray-200'
                }`}
              >
                <div className={`text-2xl ${isCurrent ? 'animate-pulse' : ''}`}>
                  {stage.icon}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${
                    isCurrent ? 'text-primary' : 
                    isCompleted ? 'text-green-700' : 
                    'text-gray-500'
                  }`}>
                    {stage.label}
                  </p>
                  <p className={`text-sm ${
                    isCurrent ? 'text-primary/70' : 
                    isCompleted ? 'text-green-600' : 
                    'text-gray-400'
                  }`}>
                    {stage.description}
                  </p>
                </div>
                <div className="flex items-center">
                  {isCompleted && !isCurrent && (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  )}
                  {isCurrent && (
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  )}
                  {isPending && (
                    <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Generation Stats */}
        {progress.totalPages && (
          <div className="mt-8 grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-2">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{progress.totalPages}</p>
              <p className="text-sm text-gray-600">Pages to Generate</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{progress.completedPages}</p>
              <p className="text-sm text-gray-600">Completed</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mx-auto mb-2">
                <Target className="w-6 h-6 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {progress.totalPages - progress.completedPages}
              </p>
              <p className="text-sm text-gray-600">Remaining</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}