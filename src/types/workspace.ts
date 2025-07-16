import { Conversation, Message } from "./conversations";
import { Project } from "./projects";

// types/workspace.ts
export interface WorkspaceData {
  project: Project;
  currentConversation: Conversation | null;
  messages: Message[];
  documents: Document[];
  settings: ProjectSettings;
  instructions: string;
  meta: {
    loadedAt: string;
    includes: {
      messages: boolean;
      documents: boolean;
      settings: boolean;
    };
    counts: {
      messages: number | null;
      documents: number | null;
      conversations: number;
    };
  };
}

export interface ProjectSettings {
  citeSources: boolean;
  suggestActions: boolean;
  webSearch: boolean;
  legalDrafting: boolean;
  model: string;
  temperature: number;
  jurisdiction?: {
    id: string;
    name: string;
    country: string;
    state?: string;
    legalSystem: string;
    citationStyle: string;
  };
}