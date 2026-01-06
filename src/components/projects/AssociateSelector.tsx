'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AIAssociate, PRACTICE_AREA_LABELS } from '@/types/associates';
import { Users, Loader2 } from 'lucide-react';
import { useAssociates } from '@/hooks/useAssociates';
import { useProjectAssociates } from '@/hooks/useProjectAssociates';
import { useNotifications } from '@/hooks/useNotifications';

interface AssociateSelectorProps {
  projectId: string;
}

export function AssociateSelector({ projectId }: AssociateSelectorProps) {
  const [selectedAssociates, setSelectedAssociates] = useState<Set<string>>(new Set());
  const [updating, setUpdating] = useState<string | null>(null);

  const { notify } = useNotifications();

  // Fetch all available associates
  const { associates: allAssociates, isLoading: loadingAll, fetchAssociates } = useAssociates({
    onError: (error) => notify.error(error)
  });

  // Manage project associates
  const {
    projectAssociates,
    isLoading: loadingProject,
    fetchProjectAssociates,
    assignAssociate,
    removeAssociate
  } = useProjectAssociates({
    onSuccess: (message) => notify.success(message),
    onError: (error) => notify.error(error)
  });

  const loading = loadingAll || loadingProject;

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    // Fetch all associates and project associates in parallel
    const [_, projectAssocs] = await Promise.all([
      fetchAssociates(),
      fetchProjectAssociates(projectId)
    ]);

    // Update selected associates set
    setSelectedAssociates(new Set(projectAssocs.map((a: AIAssociate) => a.id)));
  };

  const toggleAssociate = async (associateId: string) => {
    const isSelected = selectedAssociates.has(associateId);
    setUpdating(associateId);

    try {
      let success = false;

      if (isSelected) {
        // Remove associate from project
        success = await removeAssociate(projectId, associateId);

        if (success) {
          setSelectedAssociates(prev => {
            const next = new Set(prev);
            next.delete(associateId);
            return next;
          });
        }
      } else {
        // Assign associate to project
        success = await assignAssociate(projectId, associateId);

        if (success) {
          setSelectedAssociates(prev => new Set(prev).add(associateId));
        }
      }
    } finally {
      setUpdating(null);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Users className="h-4 w-4 mr-2" />
          AI Associates ({selectedAssociates.size})
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-1">AI Associates</h4>
            <p className="text-sm text-muted-foreground">
              Assign specialized associates to this project
            </p>
          </div>

          {loading ? (
            <div className="text-sm text-center py-4">
              <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : allAssociates.length === 0 ? (
            <div className="text-sm text-center py-4 text-muted-foreground">
              No associates created yet
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {allAssociates.map(associate => {
                const isSelected = selectedAssociates.has(associate.id);
                const isUpdating = updating === associate.id;

                return (
                  <div
                    key={associate.id}
                    className="flex items-start space-x-2 p-2 rounded hover:bg-muted cursor-pointer"
                    onClick={() => !isUpdating && toggleAssociate(associate.id)}
                  >
                    {isUpdating ? (
                      <Loader2 className="h-4 w-4 mt-0.5 animate-spin" />
                    ) : (
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleAssociate(associate.id)}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <Label className="cursor-pointer font-normal">
                        {associate.name}
                      </Label>
                      <p className="text-xs text-muted-foreground truncate">
                        {associate.practiceAreas.map(pa =>
                          PRACTICE_AREA_LABELS[pa] || pa
                        ).join(', ')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
