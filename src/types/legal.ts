// Legal domain types for contracts and legal documents

export interface Contract {
  id: string;
  title: string;
  type: 'service' | 'employment' | 'lease' | 'purchase' | 'nda' | 'partnership' | 'other';
  status: 'draft' | 'review' | 'approved' | 'executed' | 'terminated';
  content: string;
  parties: ContractParty[];
  terms: ContractTerm[];
  effectiveDate?: string;
  expirationDate?: string;
  jurisdiction: string;
  governingLaw?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  version: number;
  attachments?: string[];
}

export interface ContractParty {
  id: string;
  name: string;
  role: 'client' | 'contractor' | 'vendor' | 'landlord' | 'tenant' | 'buyer' | 'seller' | 'other';
  type: 'individual' | 'company' | 'organization';
  contact: {
    email?: string;
    phone?: string;
    address?: Address;
  };
  signatureRequired: boolean;
  signedAt?: string;
  signatureData?: string; // Base64 encoded signature
}

export interface ContractTerm {
  id: string;
  category: 'payment' | 'delivery' | 'liability' | 'termination' | 'intellectual_property' | 'confidentiality' | 'other';
  title: string;
  description: string;
  conditions?: string[];
  priority: 'high' | 'medium' | 'low';
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface ReviewDocument {
  id: string;
  title: string;
  content: string;
  documentType: 'contract' | 'agreement' | 'policy' | 'terms' | 'other';
  reviewStatus: 'pending' | 'in_progress' | 'completed' | 'approved' | 'rejected';
  reviewers: DocumentReviewer[];
  comments: ReviewComment[];
  issues: ReviewIssue[];
  compliance: ComplianceCheck[];
  aiAnalysis?: AIAnalysisResult;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentReviewer {
  id: string;
  name: string;
  role: 'legal_counsel' | 'paralegal' | 'client' | 'external_counsel';
  status: 'assigned' | 'reviewing' | 'completed';
  assignedAt: string;
  completedAt?: string;
}

export interface ReviewComment {
  id: string;
  reviewerId: string;
  content: string;
  section?: string;
  lineNumber?: number;
  type: 'comment' | 'suggestion' | 'issue' | 'question';
  status: 'open' | 'resolved' | 'dismissed';
  createdAt: string;
  resolvedAt?: string;
}

export interface ReviewIssue {
  id: string;
  type: 'legal_risk' | 'compliance_issue' | 'missing_clause' | 'ambiguous_language' | 'inconsistency';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  recommendation: string;
  section?: string;
  status: 'open' | 'resolved' | 'mitigated';
  assignedTo?: string;
}

export interface ComplianceCheck {
  id: string;
  regulation: string;
  jurisdiction: string;
  status: 'compliant' | 'non_compliant' | 'needs_review' | 'not_applicable';
  details: string;
  requiredActions?: string[];
}

export interface AIAnalysisResult {
  summary: string;
  keyTerms: string[];
  risks: {
    level: 'low' | 'medium' | 'high';
    items: string[];
  };
  recommendations: string[];
  confidence: number;
  processingTime: number;
}