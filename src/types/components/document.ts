// Document management component types

import { Document, Folder } from '../documents';
import { BaseModalProps } from './index';

export interface FolderModalProps extends BaseModalProps {
  folder?: Folder;
  parentFolderId?: string;
  onFolderCreated?: (folder: Folder) => void;
  onFolderUpdated?: (folder: Folder) => void;
}

export interface FolderItem {
  id: string;
  name: string;
  children: FolderItem[];
  type: 'folder';
  parentId?: string;
}

export interface FolderTreeProps {
  folders: FolderItem[];
  selectedFolderId?: string;
  onFolderSelect: (folderId: string) => void;
  onFolderCreate?: (parentId?: string) => void;
  onFolderDelete?: (folderId: string) => void;
  onFolderRename?: (folderId: string, newName: string) => void;
  expandAll?: boolean;
}

export interface DocumentListProps {
  documents: Document[];
  folderId?: string;
  onDocumentClick?: (document: Document) => void;
  onDocumentDelete?: (documentId: string) => void;
  onDocumentMove?: (documentId: string, folderId: string) => void;
  showActions?: boolean;
  isLoading?: boolean;
}

export interface DocumentViewerProps {
  document: Document;
  onClose?: () => void;
  onEdit?: (document: Document) => void;
  onDownload?: (document: Document) => void;
  readonly?: boolean;
}

export interface UploadModalProps extends BaseModalProps {
  folderId?: string;
  onUploadComplete?: (documents: Document[]) => void;
  acceptedTypes?: string;
  maxFileSize?: number;
  maxFiles?: number;
}