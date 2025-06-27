'use client'
import React, { useState } from 'react';
import { Send, Loader, Check, AlertCircle, Scale, Sparkles } from 'lucide-react';

interface GenerationResult {
  entryId: string;
  slug: string;
  content: {
    title: string;
  };
}

export default function SimpleWansomTemplateGenerator() {
  const [documentName, setDocumentName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateAndPublish = async () => {
    if (!documentName.trim()) {
      setError('Please enter a document name');
      return;
    }

    setIsGenerating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/agents/contentful', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentName: documentName.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate template');
      }
      
      const data = await response.json();
      setResult(data.data);
      setDocumentName(''); // Clear input after success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate and publish template');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isGenerating && documentName.trim()) {
      generateAndPublish();
    }
  };

  const resetForm = () => {
    setDocumentName('');
    setResult(null);
    setError(null);
  };

  // Example document names for inspiration
  const exampleDocuments = [
    'Employment Contract',
    'Non-Disclosure Agreement',
    'Service Agreement',
    'Lease Agreement',
    'Partnership Agreement',
    'Power of Attorney',
    'Will and Testament',
    'Corporate Resolution'
  ];

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Scale className="text-blue-600" size={36} />
            <Sparkles className="text-yellow-500" size={24} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Wansom.ai Template Generator
          </h1>
          <p className="text-gray-600">
            Enter a document name and let AI create SEO-optimized content for your legal template
          </p>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {result && (
          <div className="mb-6 p-6 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Check className="text-green-500" size={24} />
              <span className="font-semibold text-green-700 text-lg">Template Published Successfully!</span>
            </div>
            <div className="text-green-700 space-y-2">
              <p><strong>Title:</strong> "{result.content.title}"</p>
              <p><strong>Entry ID:</strong> {result.entryId}</p>
              <p><strong>Slug:</strong> {result.slug}</p>
              <p className="text-sm text-green-600">✓ SEO-optimized content created and published to Contentful</p>
            </div>
            <button
              onClick={resetForm}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Create Another Template
            </button>
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-3">
              Document Name
            </label>
            <input
              type="text"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Employment Contract"
              disabled={isGenerating}
            />
          </div>

          <button
            onClick={generateAndPublish}
            disabled={isGenerating || !documentName.trim()}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 text-white text-lg font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? (
              <>
                <Loader className="animate-spin" size={24} />
                Generating & Publishing...
              </>
            ) : (
              <>
                <Sparkles size={24} />
                Generate & Publish Template
              </>
            )}
          </button>
        </div>

        {/* Examples Section */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Example document names:</h3>
          <div className="flex flex-wrap gap-2">
            {exampleDocuments.map((example, index) => (
              <button
                key={index}
                onClick={() => setDocumentName(example)}
                disabled={isGenerating}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}