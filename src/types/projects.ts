import { Conversation, Message } from "./conversations";

//types/project.ts
export interface Project {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'archived' | 'on_hold';
  createdAt: string;
  updatedAt: string;
  organizationId: string;
  
  // Computed fields
  teamCount: number;
  messagesCount: number;
  documentsCount: number;
  lastActivity: string;
  
  // Optional expanded data
  organization?: {
    id: string;
    name: string;
  };
  knowledgeBase: {
    documents: Document[]
  }
  members?: ProjectMember[];
  documents?: Document[];
  conversations?: Conversation[];
  messages: Message[];
  settings: ProjectSettings;
  instructions: string;
  currentConversation: Conversation | null;
  loadedAt: string;
}

export interface ProjectMember {
  userId: string;
  projectId: string;
  role: 'admin' | 'member' | 'viewer';
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}
export interface Jurisdiction {
  id: string;
  name: string;
  country: string;
  state?: string;
  region: string;
  legalSystem: 'common-law' | 'civil-law' | 'mixed' | 'religious' | 'customary';
  citationStyle: 'bluebook' | 'oscola' | 'aglc' | 'mcgill' | 'local';
  courtSystem: string[];
  languages: string[];
  isPopular?: boolean;
}

export interface ProjectSettings {
  citeSources: boolean;
  suggestActions: boolean;
  webSearch: boolean;
  legalDrafting: boolean;
  googleCalendar?: boolean;
  gmail?: boolean;
  model?: string;
  temperature?: number;
  jurisdiction?: {
    id: string;
    name: string;
    country: string;
    state?: string;
    legalSystem: string;
    citationStyle: string;
  };
}