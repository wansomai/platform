// Store state interfaces and common store types

export interface ApiResponse<T = any> {
  status: number;
  message: string;
  data?: T;
}

export interface BaseState {
  isLoading: boolean;
  error: string | null;
}

export interface ProjectState extends BaseState {
  projects: any[];
  currentProject: any | null;
  members: any[];
  invitations: any[];
}

export interface DocumentsState extends BaseState {
  documents: any[];
  folders: any[];
  currentDocument: any | null;
  uploadProgress: { [key: string]: number };
}

export interface OnboardingState extends BaseState {
  currentStep: number;
  completedSteps: number[];
  formData: {
    practiceAreas: string[];
    firmSize: string;
    yearsInPractice: number;
    serviceAreas: string[];
    currentWebsite: string;
    linkedinUrl: string;
    firmStory: string;
  };
}

// Generic store action types
export interface SetLoadingAction {
  type: 'SET_LOADING';
  payload: boolean;
}

export interface SetErrorAction {
  type: 'SET_ERROR';
  payload: string | null;
}

// Store configuration types
export interface StoreConfig {
  devtools: boolean;
  name: string;
  version: number;
}