// src/components/contract/ContractViewer.tsx
"use client"

import React, { useState } from 'react'
import { 
  ArrowLeft, 
  Download, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Clock,
  DollarSign,
  Scale,
  Shield,
  Eye,
  EyeOff,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Contract {
  id: string
  title: string
  fileName: string
  status: 'processing' | 'ready' | 'error'
  riskScore?: number
  uploadedAt: string
  fileSize: string
  type: string
}

interface ContractViewerProps {
  contract: Contract
  onBack: () => void
}

// Mock contract content with clauses
const MOCK_CONTRACT_CONTENT = `
<div class="contract-content">
  <h1>SERVICE AGREEMENT</h1>
  <p><strong>Effective Date:</strong> January 1, 2024</p>
  <p><strong>Parties:</strong> ABC Corp and XYZ Services Ltd.</p>
  
  <h2>1. SERVICES</h2>
  <p data-clause="services" data-risk="low">The Provider shall deliver consulting services as outlined in Schedule A, including strategic planning, market analysis, and implementation support.</p>
  
  <h2>2. PAYMENT TERMS</h2>
  <p data-clause="payment" data-risk="medium">Payment of $10,000 per month is due within 90 days of invoice receipt. Late payments shall incur a penalty of 2% per month.</p>
  
  <h2>3. LIABILITY</h2>
  <p data-clause="liability" data-risk="high">Company shall be liable for all damages, losses, and expenses arising from or related to the services, including but not limited to indirect, incidental, consequential, and punitive damages, without limitation.</p>
  
  <h2>4. TERMINATION</h2>
  <p data-clause="termination" data-risk="high">This agreement shall automatically renew for successive 24-month periods unless either party provides written notice at least 180 days prior to the end of the current term.</p>
  
  <h2>5. INTELLECTUAL PROPERTY</h2>
  <p data-clause="ip" data-risk="medium">All work product, deliverables, and intellectual property created in connection with the services shall be owned by Provider, with Company receiving a non-exclusive, non-transferable license.</p>
  
  <h2>6. CONFIDENTIALITY</h2>
  <p data-clause="confidentiality" data-risk="low">Both parties agree to maintain confidentiality of proprietary information disclosed during the term of this agreement.</p>
  
  <h2>7. GOVERNING LAW</h2>
  <p data-clause="governing-law" data-risk="low">This agreement shall be governed by the laws of New York State.</p>
</div>
`

const CLAUSE_ANALYSIS = {
  services: {
    type: 'Services',
    risk: 'low',
    issues: [],
    summary: 'Standard service description clause with clear scope definition.'
  },
  payment: {
    type: 'Payment',
    risk: 'medium',
    issues: ['90-day payment terms are unusually long', 'High monthly penalty rate'],
    summary: 'Extended payment terms may impact cash flow. Consider negotiating shorter payment periods.'
  },
  liability: {
    type: 'Liability',
    risk: 'high',
    issues: ['Unlimited liability exposure', 'Includes consequential damages', 'No mutual limitation'],
    summary: 'This clause exposes your company to unlimited liability including consequential damages. Recommend adding liability caps and mutual limitations.'
  },
  termination: {
    type: 'Termination',
    risk: 'high',
    issues: ['Long 24-month auto-renewal', 'Requires 180-day notice', 'No termination for convenience'],
    summary: 'Very restrictive termination terms. Consider shorter renewal periods and termination for convenience clauses.'
  },
  ip: {
    type: 'Intellectual Property',
    risk: 'medium',
    issues: ['Provider retains all IP ownership', 'Limited license grant'],
    summary: 'Consider negotiating shared ownership or broader license rights for work product created using your resources.'
  },
  confidentiality: {
    type: 'Confidentiality',
    risk: 'low',
    issues: [],
    summary: 'Standard mutual confidentiality provisions.'
  },
  'governing-law': {
    type: 'Governing Law',
    risk: 'low',
    issues: [],
    summary: 'Standard governing law clause.'
  }
}

export const ContractViewer: React.FC<ContractViewerProps> = ({ contract, onBack }) => {
  const [selectedClause, setSelectedClause] = useState<string | null>(null)
  const [showAnnotations, setShowAnnotations] = useState(true)

  const handleClauseClick = (clauseId: string) => {
    setSelectedClause(selectedClause === clauseId ? null : clauseId)
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'border-l-red-500 bg-red-50'
      case 'medium': return 'border-l-yellow-500 bg-yellow-50'
      case 'low': return 'border-l-green-500 bg-green-50'
      default: return 'border-l-gray-500 bg-gray-50'
    }
  }

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'high': return <AlertTriangle className="w-4 h-4 text-red-500" />
      case 'medium': return <Info className="w-4 h-4 text-yellow-500" />
      case 'low': return <CheckCircle className="w-4 h-4 text-green-500" />
      default: return <Info className="w-4 h-4 text-gray-500" />
    }
  }

  const riskCounts = {
    high: Object.values(CLAUSE_ANALYSIS).filter(c => c.risk === 'high').length,
    medium: Object.values(CLAUSE_ANALYSIS).filter(c => c.risk === 'medium').length,
    low: Object.values(CLAUSE_ANALYSIS).filter(c => c.risk === 'low').length,
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <div>
              <h1 className="text-lg font-semibold">{contract.title}</h1>
              <p className="text-sm text-gray-600">{contract.fileName}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAnnotations(!showAnnotations)}
            >
              {showAnnotations ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
              {showAnnotations ? 'Hide' : 'Show'} Annotations
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Risk Overview */}
      {showAnnotations && (
        <div className="border-b p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Risk Summary:</span>
                <Badge variant="outline" className="bg-red-100 text-red-700">
                  {riskCounts.high} High
                </Badge>
                <Badge variant="outline" className="bg-yellow-100 text-yellow-700">
                  {riskCounts.medium} Medium
                </Badge>
                <Badge variant="outline" className="bg-green-100 text-green-700">
                  {riskCounts.low} Low
                </Badge>
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              Overall Risk Score: <span className="font-semibold text-red-600">{contract.riskScore}/10</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div 
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ 
              __html: MOCK_CONTRACT_CONTENT.replace(
                /data-clause="([^"]+)" data-risk="([^"]+)"/g,
                (match, clauseId, risk) => {
                  const baseClasses = showAnnotations 
                    ? `cursor-pointer border-l-4 pl-3 py-2 my-2 transition-all hover:bg-gray-50 ${getRiskColor(risk)}`
                    : ''
                  
                  return `onclick="handleClauseClick('${clauseId}')" class="${baseClasses}" data-clause="${clauseId}" data-risk="${risk}"`
                }
              )
            }}
            onClick={(e) => {
              const target = e.target as HTMLElement
              const clauseId = target.getAttribute('data-clause')
              if (clauseId && showAnnotations) {
                // Send prompt to chat for clause analysis
                const clauseData = CLAUSE_ANALYSIS[clauseId as keyof typeof CLAUSE_ANALYSIS];
                if (clauseData) {
                  const prompt = `Please analyze the ${clauseData.type.toLowerCase()} clause I clicked on in my contract. This clause has been flagged as ${clauseData.risk} risk. Please explain the risks and provide suggestions for improvement.`;
                  
                  // Dispatch custom event to send prompt to chat
                  document.dispatchEvent(new CustomEvent('action-prompt-send', {
                    detail: { promptTemplate: prompt }
                  }));
                }
              }
            }}
          />
          
          {/* Quick Analysis Buttons */}
          {showAnnotations && (
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Quick Analysis</h3>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    document.dispatchEvent(new CustomEvent('action-prompt-send', {
                      detail: { promptTemplate: "Show me the high risk areas of this contract and explain why they are concerning." }
                    }));
                  }}
                  className="justify-start"
                >
                  <AlertTriangle className="w-4 h-4 mr-2 text-red-500" />
                  High Risk Areas
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    document.dispatchEvent(new CustomEvent('action-prompt-send', {
                      detail: { promptTemplate: "Analyze the payment terms in this contract. Are they fair and favorable?" }
                    }));
                  }}
                  className="justify-start"
                >
                  <DollarSign className="w-4 h-4 mr-2 text-green-500" />
                  Payment Terms
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    document.dispatchEvent(new CustomEvent('action-prompt-send', {
                      detail: { promptTemplate: "Review the termination and cancellation clauses. What are my options for ending this contract?" }
                    }));
                  }}
                  className="justify-start"
                >
                  <X className="w-4 h-4 mr-2 text-orange-500" />
                  Termination Terms
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    document.dispatchEvent(new CustomEvent('action-prompt-send', {
                      detail: { promptTemplate: "Check this contract for compliance with relevant laws and regulations. Are there any compliance gaps?" }
                    }));
                  }}
                  className="justify-start"
                >
                  <Shield className="w-4 h-4 mr-2 text-blue-500" />
                  Compliance Check
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ContractViewer