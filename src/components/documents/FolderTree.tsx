// components/folder/FolderTree.tsx
import React, { useState } from 'react';
import { Folder, FolderOpen, ChevronRight, ChevronDown, File, MoreVertical, UserPlus, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FolderItem {
  id: string;
  name: string;
  parentId: string | null;
  documentCount: number;
  children?: FolderItem[];
  createdAt: string;
  createdBy?: string;
}

interface FolderTreeProps {
  folders: FolderItem[];
  activeFolder: string | null;
  onFolderSelect: (folderId: string | null) => void;
  totalDocumentCount?: number;
  currentUserId?: string;
  onEdit?: (folder: FolderItem) => void;
  onDelete?: (folderId: string) => void;
  onShare?: (folder: FolderItem) => void;
}

export function FolderTree({
  folders,
  activeFolder,
  onFolderSelect,
  totalDocumentCount,
  currentUserId,
  onEdit,
  onDelete,
  onShare,
}: FolderTreeProps) {
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});

  const toggleExpand = (folderId: string) => {
    setExpanded(prev => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  const renderFolder = (folder: FolderItem, level: number = 0) => {
    const isExpanded = expanded[folder.id] || false;
    const isActive = activeFolder === folder.id;
    const hasChildren = folder.children && folder.children.length > 0;
    const isOwner = folder.createdBy === currentUserId;

    return (
      <div key={folder.id} className="folder-tree-item">
        <div
          className={cn(
            'group flex items-center py-1 px-2 rounded-md hover:bg-gray-100 cursor-pointer',
            isActive ? 'bg-gray-100 text-gray-600' : ''
          )}
          style={{ paddingLeft: `${(level * 12) + 8}px` }}
        >
          {/* Expand toggle */}
          {hasChildren ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 mr-1 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(folder.id);
              }}
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          ) : (
            <div className="w-6 mr-1 shrink-0" />
          )}

          {/* Folder name — clicking selects the folder */}
          <div
            className="flex-1 flex items-center overflow-hidden"
            onClick={() => {
              onFolderSelect(folder.id);
              if (hasChildren && !isExpanded) toggleExpand(folder.id);
            }}
          >
            {isExpanded ? (
              <FolderOpen className="h-4 w-4 min-h-4 min-w-4 mr-2 text-amber-500 shrink-0" />
            ) : (
              <Folder className="h-4 w-4 mr-2 text-amber-500 min-h-4 min-w-4 shrink-0" />
            )}
            <span className="truncate">{folder.name}</span>
            <Badge variant="outline" className="ml-2 flex-shrink-0">
              {folder.documentCount ?? 0}
            </Badge>
          </div>

          {/* Three-dots action menu */}
          {(onEdit || onDelete || (onShare && isOwner)) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 shrink-0 ml-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                {onShare && isOwner && (
                  <DropdownMenuItem onClick={() => onShare(folder)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(folder)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Folder
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onClick={() => onDelete(folder.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Folder
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {isExpanded && hasChildren && (
          <div className="folder-children">
            {folder.children!.map(child => renderFolder(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="folder-tree space-y-1">
      <div
        className={cn(
          'flex items-center py-1 px-2 rounded-md hover:bg-gray-100 cursor-pointer',
          activeFolder === null ? 'bg-primary-50 text-primary-600' : ''
        )}
        onClick={() => onFolderSelect(null)}
      >
        <File className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0" />
        <span className="flex-1">All Documents</span>
        {totalDocumentCount !== undefined && (
          <Badge variant="outline" className="ml-2 flex-shrink-0">{totalDocumentCount}</Badge>
        )}
      </div>

      {folders
        .filter(folder => folder.parentId === null)
        .map(folder => renderFolder(folder))}
    </div>
  );
}
