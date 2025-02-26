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