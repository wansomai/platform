export interface TabComponentProps {
    project: ProjectDetails
    projectId?: string
  }

  export interface ProjectDetails {
    id: string
    title: string
    description: {
      String: string
    }
    status: string
    created_at: string
    
    knowledge_base: {
      team: any[]
      client: any
      documents: any[]
      events: any[]
    }
  }
  export interface AddEventModalProps {
    open: boolean
    onClose: () => void
    projectId: string
  }


  export interface Project {
    id: string;
    title: string;
    description: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    documents_count: number;
    team_count: number;
    last_activity: string;
  }