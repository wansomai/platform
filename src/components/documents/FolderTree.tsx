// components/folder/FolderTree.tsx
import React, { useState } from 'react';
import { Folder, FolderOpen, ChevronRight, ChevronDown, File } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface FolderItem {
  id: string;
  name: string;
  parentId: string | null;
  documentCount: number;
  children?: FolderItem[];
  createdAt: string;
}

interface FolderTreeProps {
  folders: FolderItem[];
  activeFolder: string | null;
  onFolderSelect: (folderId: string | null) => void;
  totalDocumentCount?: number;
}

export function FolderTree({ folders, activeFolder, onFolderSelect, totalDocumentCount }: FolderTreeProps) {
  // Track expanded state of folders
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});
  
  const toggleExpand = (folderId: string) => {
    setExpanded(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };
  
  // Recursively render folder tree
  const renderFolder = (folder: FolderItem, level: number = 0) => {
    const isExpanded = expanded[folder.id] || false;
    const isActive = activeFolder === folder.id;
    const hasChildren = folder.children && folder.children.length > 0;
    
    return (
      <div key={folder.id} className="folder-tree-item">
        <div 
          className={cn(
            "flex items-center py-1 px-2 rounded-md hover:bg-gray-100 cursor-pointer",
            isActive 
              ? "bg-gray-100 text-gray-600 hover:bg-gray-100" 
              : "hover:bg-gray-100"
          )}
          style={{ paddingLeft: `${(level * 12) + 8}px` }}
        >
          {hasChildren ? (
            <Button 
              variant="ghost" 
              size="sm"
              className="h-6 w-6 p-0 mr-1"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(folder.id);
              }}
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          ) : (
            <div className="w-6 mr-1" />
          )}
          
          <div 
            className="flex-1 flex items-center overflow-x-auto"
            onClick={() => onFolderSelect(folder.id)}
          >
            {isExpanded ? (
              <FolderOpen className="h-4 w-4 min-h-4 min-w-4 mr-2 text-amber-500" />
            ) : (
              <Folder className="h-4 w-4 mr-2 text-amber-500 min-h-4 min-w-4" />
            )}
            <span className="truncate">{folder.name}</span>
            <Badge variant="outline" className="ml-2 flex-shrink-0">
              {folder.documentCount ?? 0}
            </Badge>
          </div>
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
          "flex items-center py-1 px-2 rounded-md hover:bg-gray-100 cursor-pointer",
          activeFolder === null ? "bg-primary-50 text-primary-600" : ""
        )}
        onClick={() => onFolderSelect(null)}
      >
        <File className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0" />
        <span className="flex-1">All Documents</span>
        {totalDocumentCount !== undefined && (
          <Badge variant="outline" className="ml-2 flex-shrink-0">{totalDocumentCount}</Badge>
        )}
      </div>
     
      {/* Only map over root-level folders (those with null parentId) */}
      {folders
        .filter(folder => folder.parentId === null)
        .map(folder => renderFolder(folder))}
    </div>
  );
}