// src/components/contract/ContractViewer.tsx
"use client"

import React, { useState } from 'react'
import { 
  ArrowLeft, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Clock,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'

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
  const [showAnnotations, setShowAnnotations] = useState(true)

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'border-l-red-500 bg-red-50'
      case 'medium': return 'border-l-yellow-500 bg-yellow-50'
      case 'low': return 'border-l-green-500 bg-green-50'
      default: return 'border-l-gray-500 bg-gray-50'
    }
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
          
        </div>
      </div>


      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div 
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ 
              __html: MOCK_CONTRACT_CONTENT.replace(
                /data-clause="([^"]+)" data-risk="([^"]+)"/g,
                (match, clauseId, risk) => {
                  const baseClasses = showAnnotations 
                    ? `border-l-4 pl-3 py-2 my-2 ${getRiskColor(risk)}`
                    : ''
                  
                  return `class="${baseClasses}" data-clause="${clauseId}" data-risk="${risk}"`
                }
              )
            }}
          />
          
        </div>
      </div>
    </div>
  )
}

export default ContractViewer