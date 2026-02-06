'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { UserPlus, X, User, Loader2, Shield, Crown } from 'lucide-react';
import { apiService } from '@/lib/api';

interface Member {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
  avatar?: string;
  isAdmin?: boolean;
  canRemove?: boolean;
}

interface AvailableMember {
  id: string;
  name: string;
  email: string;
  orgRole: string;
}

interface ProjectMembersModalProps {
  projectId: string;
  projectTitle: string;
  isOpen: boolean;
  onClose: () => void;
  isMobile?: boolean;
}

export function ProjectMembersModal({
  projectId,
  projectTitle,
  isOpen,
  onClose,
  isMobile = false,
}: ProjectMembersModalProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [availableMembers, setAvailableMembers] = useState<AvailableMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  // Add member form state
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, projectId]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchMembers(), fetchAvailableMembers()]);
    setLoading(false);
  };

  const fetchMembers = async () => {
    try {
      const response = await apiService.get(`/api/projects/${projectId}/members`) as {
        data: {
          members: Member[];
          currentUserRole: string | null;
        };
      };
      const data = response.data;
      setMembers(data.members || []);
      setCurrentUserRole(data.currentUserRole || null);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('Failed to load members');
    }
  };

  const fetchAvailableMembers = async () => {
    try {
      const data = await apiService.get(`/api/organization/members/available?projectId=${projectId}`) as {
        members: AvailableMember[];
      };
      setAvailableMembers(data.members || []);
    } catch (error) {
      console.error('Error fetching available members:', error);
      // Don't show error for available members
    }
  };

  const handleAddMember = async () => {
    if (!selectedMemberId) {
      toast.error('Please select a member to add');
      return;
    }

    try {
      setAdding(true);
      const response = await apiService.post(`/api/projects/${projectId}/members/add`, {
        memberId: selectedMemberId,
        role: 'member', // Always add as member
      }) as {
        success: boolean;
        message: string;
        member?: Member;
      };

      if (response.success) {
        toast.success(response.message);
        setSelectedMemberId('');

        // Refresh both lists
        await fetchData();
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to add member';
      toast.error(errorMessage);
      console.error('Error adding member:', error);
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member from the workspace?')) {
      return;
    }

    try {
      await apiService.delete(`/api/projects/${projectId}/members/${userId}`);
      toast.success('Member removed successfully');
      await fetchData();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to remove member';
      toast.error(errorMessage);
      console.error('Error removing member:', error);
    }
  };

  const getUserInitials = (name: string) => {
    if (!name) return 'U';
    const nameParts = name.split(' ');
    if (nameParts.length === 1) return nameParts[0][0].toUpperCase();
    return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
  };

  const selectedMember = availableMembers.find(m => m.id === selectedMemberId);
  const isAdmin = currentUserRole === 'admin';

  const content = (
    <div className="space-y-6">
      {/* Add Member Section - Only visible to admin */}
      {isAdmin && availableMembers.length > 0 && (
        <>
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-sm">Add Member to Workspace</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="member-select" className="text-xs">Select Team Member</Label>
              <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                <SelectTrigger id="member-select" disabled={adding}>
                  <SelectValue placeholder="Choose a team member..." />
                </SelectTrigger>
                <SelectContent>
                  {availableMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {getUserInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium">{member.name}</span>
                          <span className="text-xs text-gray-500">{member.email}</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleAddMember} disabled={adding || !selectedMemberId} className="w-full">
              {adding ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add to Workspace
                </>
              )}
            </Button>
          </div>

          <Separator />
        </>
      )}

      {/* Current Members List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Current Members</h3>
          <Badge variant="secondary" className='text-white'>{members.length}</Badge>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <User className="h-12 w-12 mx-auto text-gray-300 mb-2" />
            <p className="text-sm">No members in this workspace yet</p>
            <p className="text-xs text-gray-400 mt-1">Add team members to start collaborating</p>
          </div>
        ) : (
          <div className="space-y-2">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.avatar} alt={member.name} />
                    <AvatarFallback>{getUserInitials(member.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{member.name}</p>
                    <p className="text-xs text-gray-500">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={member.role === 'admin' ? 'default' : 'secondary'}
                    className="capitalize flex items-center gap-1"
                  >
                    {member.role === 'admin' && <Crown className="h-3 w-3" />}
                    {member.role}
                  </Badge>
                  {isAdmin && (
                    member.canRemove !== false ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member.userId)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Remove member"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    ) : (
                      <span
                        className="text-xs text-gray-400 px-2"
                        title="Workspace admin cannot be removed"
                      >
                        Admin
                      </span>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* No Available Members Message - Only visible to admin */}
      {isAdmin && !loading && availableMembers.length === 0 && members.length > 0 && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            All organization members have been added to this workspace.
          </p>
        </div>
      )}
    </div>
  );

  // Use Sheet for mobile, Dialog for desktop
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{projectTitle}</SheetTitle>
            {/* <SheetDescription>{projectTitle}</SheetDescription> */}
          </SheetHeader>
          <div className="mt-6">{content}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{projectTitle} Workspace</DialogTitle>
          {/* <DialogDescription>{projectTitle}</DialogDescription> */}
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
