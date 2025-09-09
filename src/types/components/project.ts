// Project-related component types

import { Project, ProjectMember } from '../projects';
import { BaseModalProps } from './index';

export interface ProjectCardProps {
  project: Project;
  onEdit?: (project: Project) => void;
  onDelete?: (projectId: string) => void;
  onClick?: (project: Project) => void;
  showActions?: boolean;
}

export interface CreateProjectModalProps extends BaseModalProps {
  onProjectCreated?: (project: Project) => void;
}

export interface EditProjectModalProps extends BaseModalProps {
  project: Project;
  onProjectUpdated?: (project: Project) => void;
}

export interface DeleteProjectModalProps extends BaseModalProps {
  project: Project;
  onProjectDeleted?: (projectId: string) => void;
}

export interface ProjectMemberListProps {
  members: ProjectMember[];
  onInviteMember?: () => void;
  onRemoveMember?: (memberId: string) => void;
  onUpdateRole?: (memberId: string, role: string) => void;
  canManageMembers?: boolean;
}

export interface ProjectSettingsProps {
  project: Project;
  onUpdate: (updates: Partial<Project>) => void;
  isLoading?: boolean;
}

export interface ProjectStatsProps {
  projectId: string;
  stats: {
    totalDocuments: number;
    totalMessages: number;
    totalMembers: number;
    lastActivity: string;
  };
}