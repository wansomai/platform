// src/lib/endpoints.ts
export const apiEndpoints = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    refreshToken: '/auth/refresh-token',
    logout: '/auth/logout',
    resetPasswordRequest: '/auth/reset-password-request',
    resetPassword: '/auth/reset-password',
  },
  projects: {
    list: '/projects',
    create: '/projects',
    get: (projectId: string) => `/projects/${projectId}`,
    update: (projectId: string) => `/projects/${projectId}`,
    delete: (projectId: string) => `/projects/${projectId}`,
  },
  
  conversations: {
    list: (projectId: string) => `/projects/${projectId}/conversations`,
    create: (projectId: string) => `/projects/${projectId}/conversations`,
    get: (projectId: string, conversationId: string) => 
      `/projects/${projectId}/conversations/${conversationId}`,
    update: (projectId: string, conversationId: string) => 
      `/projects/${projectId}/conversations/${conversationId}`,
    delete: (projectId: string, conversationId: string) => 
      `/projects/${projectId}/conversations/${conversationId}`,
    pin: (projectId: string, conversationId: string) => 
      `/projects/${projectId}/conversations/${conversationId}/pin`,
    messages: (projectId: string, conversationId: string) =>
      `/projects/${projectId}/conversations/${conversationId}/messages`,
  },
  
  documents: {
    list: (projectId: string) => `/projects/${projectId}/documents`,
    upload: (projectId: string) => `/projects/${projectId}/documents`,
    get: (projectId: string, documentId: string) => 
      `/projects/${projectId}/documents/${documentId}`,
    update: (projectId: string, documentId: string) => 
      `/projects/${projectId}/documents/${documentId}`,
    delete: (projectId: string, documentId: string) => 
      `/projects/${projectId}/documents/${documentId}`,
    categorize: (projectId: string, documentId: string) =>
      `/projects/${projectId}/documents/${documentId}/categorize`,
    analyze: (projectId: string, documentId: string) =>
      `/projects/${projectId}/documents/${documentId}/analyze`,
  },
  
  team: {
    list: (projectId: string) => `/projects/${projectId}/team`,
    add: (projectId: string) => `/projects/${projectId}/team`,
    get: (projectId: string, userId: string) => 
      `/projects/${projectId}/team/${userId}`,
    update: (projectId: string, userId: string) => 
      `/projects/${projectId}/team/${userId}`,
    delete: (projectId: string, userId: string) => 
      `/projects/${projectId}/team/${userId}`,
  },
  
  events: {
    list: (projectId: string) => `/projects/${projectId}/events`,
    create: (projectId: string) => `/projects/${projectId}/events`,
    get: (projectId: string, eventId: string) => 
      `/projects/${projectId}/events/${eventId}`,
    update: (projectId: string, eventId: string) => 
      `/projects/${projectId}/events/${eventId}`,
    delete: (projectId: string, eventId: string) => 
      `/projects/${projectId}/events/${eventId}`,
  },
  
  client: {
    get: (projectId: string) => `/projects/${projectId}/client`,
    update: (projectId: string) => `/projects/${projectId}/client`,
  },
  
  knowledge: {
    search: (projectId: string) => `/projects/${projectId}/knowledge/search`,
    update: (projectId: string) => `/projects/${projectId}/knowledge`,
  },
  
  ai: {
    chat: '/ai/chat',
    analyze: '/ai/analyze',
    summarize: '/ai/summarize',
    generate: '/ai/generate',
  },
  
  user: {
    profile: '/user/profile',
    updateProfile: '/user/profile',
    settings: '/user/settings',
    updateSettings: '/user/settings',
  },
  
  organization: {
    get: '/organization',
    update: '/organization',
    members: '/organization/members',
    addMember: '/organization/members',
    removeMember: (userId: string) => `/organization/members/${userId}`,
  }
}