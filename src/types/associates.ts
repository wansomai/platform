export enum PracticeArea {
  GENERAL_PRACTICE = 'GENERAL_PRACTICE',
  MERGERS_AND_ACQUISITIONS = 'MERGERS_AND_ACQUISITIONS',
  TAX_LAW = 'TAX_LAW',
  INTELLECTUAL_PROPERTY = 'INTELLECTUAL_PROPERTY',
  COMPLIANCE_REGULATORY = 'COMPLIANCE_REGULATORY',
  CORPORATE_GOVERNANCE = 'CORPORATE_GOVERNANCE',
  EMPLOYMENT_LABOR = 'EMPLOYMENT_LABOR',
  LITIGATION_DISPUTE_RESOLUTION = 'LITIGATION_DISPUTE_RESOLUTION',
  REAL_ESTATE = 'REAL_ESTATE',
  BANKING_FINANCE = 'BANKING_FINANCE',
  CONTRACTS_COMMERCIAL = 'CONTRACTS_COMMERCIAL',
  SECURITIES = 'SECURITIES',
  ANTITRUST_COMPETITION = 'ANTITRUST_COMPETITION',
  BANKRUPTCY_RESTRUCTURING = 'BANKRUPTCY_RESTRUCTURING',
  ENVIRONMENTAL_LAW = 'ENVIRONMENTAL_LAW',
  HEALTHCARE_LIFE_SCIENCES = 'HEALTHCARE_LIFE_SCIENCES',
  IMMIGRATION = 'IMMIGRATION',
  PRIVACY_DATA_PROTECTION = 'PRIVACY_DATA_PROTECTION',
  TECHNOLOGY_LICENSING = 'TECHNOLOGY_LICENSING',
  INTERNATIONAL_TRADE = 'INTERNATIONAL_TRADE',
  
}

export const PRACTICE_AREA_LABELS: Record<PracticeArea, string> = {
  [PracticeArea.GENERAL_PRACTICE]: 'General Practice',
  [PracticeArea.MERGERS_AND_ACQUISITIONS]: 'Mergers & Acquisitions',
  [PracticeArea.TAX_LAW]: 'Tax Law',
  [PracticeArea.INTELLECTUAL_PROPERTY]: 'Intellectual Property',
  [PracticeArea.COMPLIANCE_REGULATORY]: 'Compliance & Regulatory',
  [PracticeArea.CORPORATE_GOVERNANCE]: 'Corporate Governance',
  [PracticeArea.EMPLOYMENT_LABOR]: 'Employment & Labor',
  [PracticeArea.LITIGATION_DISPUTE_RESOLUTION]: 'Litigation & Dispute Resolution',
  [PracticeArea.REAL_ESTATE]: 'Real Estate',
  [PracticeArea.BANKING_FINANCE]: 'Banking & Finance',
  [PracticeArea.CONTRACTS_COMMERCIAL]: 'Contracts & Commercial',
  [PracticeArea.SECURITIES]: 'Securities',
  [PracticeArea.ANTITRUST_COMPETITION]: 'Antitrust & Competition',
  [PracticeArea.BANKRUPTCY_RESTRUCTURING]: 'Bankruptcy & Restructuring',
  [PracticeArea.ENVIRONMENTAL_LAW]: 'Environmental Law',
  [PracticeArea.HEALTHCARE_LIFE_SCIENCES]: 'Healthcare & Life Sciences',
  [PracticeArea.IMMIGRATION]: 'Immigration',
  [PracticeArea.PRIVACY_DATA_PROTECTION]: 'Privacy & Data Protection',
  [PracticeArea.TECHNOLOGY_LICENSING]: 'Technology & Licensing',
  [PracticeArea.INTERNATIONAL_TRADE]: 'International Trade',
  
};

export interface AIAssociate {
  id: string;
  name: string;
  instructions: string;
  description?: string;
  practiceAreas: PracticeArea[];
  knowledgeBase: string[]; // Document IDs
  isActive: boolean;
  organizationId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  steps?: AssociateStep[];
  tools?: AssociateTool[];
}

export interface AssociateStep {
  id: string;
  associateId: string;
  description: string;
  stepOrder: number;
}

export interface AssociateTool {
  id: string;
  associateId: string;
  toolId: string;
}

export interface CreateAssociateInput {
  name: string;
  instructions: string;
  description?: string;
  practiceAreas: PracticeArea[];
  knowledgeBase?: string[];
  steps?: { description: string; stepOrder: number }[];
  tools?: string[];
}

export interface UpdateAssociateInput extends Partial<CreateAssociateInput> {
  isActive?: boolean;
}
