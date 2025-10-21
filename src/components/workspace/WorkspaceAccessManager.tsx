'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Users, UserPlus, MoreHorizontal, Eye, EyeOff, Shield } from "lucide-react";
import { apiService } from '@/lib/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface WorkspaceMember {
  id: string;
  email: string;
  name: string;
  role: string;
  joinedAt: string;
}

interface OrganizationMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface WorkspaceAccessManagerProps {
  workspaceId: string;
  workspaceTitle: string;
  currentVisibility?: 'organization' | 'restricted';
  canManage?: boolean;
}

export function WorkspaceAccessManager({
  workspaceId,
  workspaceTitle,
  currentVisibility = 'organization',
  canManage = false
}: WorkspaceAccessManagerProps) {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [orgMembers, setOrgMembers] = useState<OrganizationMember[]>([]);
  const [visibility, setVisibility] = useState(currentVisibility);
  const [loading, setLoading] = useState(true);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [selectedMemberRole, setSelectedMemberRole] = useState<string>('member');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchWorkspaceData();
  }, [workspaceId]);

  const fetchWorkspaceData = async () => {
    try {
      setLoading(true);

      // Fetch workspace members
      const membersData = await apiService.get(`/api/workspace/${workspaceId}/members`) as {
        members: WorkspaceMember[];
      };

      setMembers(membersData.members || []);

      // Fetch workspace visibility
      try {
        const visibilityData = await apiService.get(`/api/workspace/${workspaceId}/visibility`) as {
          workspace: { visibility: 'organization' | 'restricted' };
        };
        setVisibility(visibilityData.workspace.visibility);
      } catch (error) {
        console.error('Error fetching visibility:', error);
      }

      // Fetch organization members if needed
      if (canManage) {
        try {
          const orgMembersData = await apiService.get('/api/organization/members') as {
            members: OrganizationMember[];
          };
          setOrgMembers(orgMembersData.members || []);
        } catch (error) {
          console.error('Error fetching org members:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching workspace data:', error);
      toast.error('Failed to load workspace data');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeVisibility = async (newVisibility: 'organization' | 'restricted') => {
    try {
      setIsUpdating(true);

      await apiService.patch(`/api/workspace/${workspaceId}/visibility`, {
        visibility: newVisibility
      });

      setVisibility(newVisibility);
      toast.success(`Workspace visibility updated to ${newVisibility}`);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update visibility';
      toast.error(errorMessage);
      console.error('Error updating visibility:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedMemberId) {
      toast.error('Please select a member');
      return;
    }

    try {
      setIsUpdating(true);

      await apiService.post(`/api/workspace/${workspaceId}/members`, {
        memberId: selectedMemberId,
        role: selectedMemberRole
      });

      toast.success('Member added to workspace');
      setAddMemberDialogOpen(false);
      setSelectedMemberId('');
      setSelectedMemberRole('member');

      // Refresh members list
      await fetchWorkspaceData();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to add member';
      toast.error(errorMessage);
      console.error('Error adding member:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await apiService.delete(`/api/workspace/${workspaceId}/members`, {
        memberId
      });

      setMembers(members.filter(m => m.id !== memberId));
      toast.success('Member removed from workspace');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to remove member';
      toast.error(errorMessage);
      console.error('Error removing member:', error);
    }
  };

  const handleChangeRole = async (memberId: string, newRole: string) => {
    try {
      await apiService.patch(`/api/workspace/${workspaceId}/members/${memberId}/role`, {
        role: newRole
      });

      setMembers(members.map(m =>
        m.id === memberId ? { ...m, role: newRole } : m
      ));

      toast.success('Member role updated');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update role';
      toast.error(errorMessage);
      console.error('Error updating role:', error);
    }
  };

  const getUserInitials = (name: string) => {
    if (!name) return "U";
    const nameParts = name.split(" ");
    if (nameParts.length === 1) return nameParts[0][0].toUpperCase();
    return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
  };

  const availableOrgMembers = orgMembers.filter(
    orgMember => !members.some(m => m.id === orgMember.id)
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Workspace Access
            </CardTitle>
            <CardDescription>
              Manage who can access "{workspaceTitle}"
            </CardDescription>
          </div>

          {canManage && (
            <div className="flex items-center gap-2">
              <Select
                value={visibility}
                onValueChange={(value) => handleChangeVisibility(value as 'organization' | 'restricted')}
                disabled={isUpdating}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="organization">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Organization
                    </div>
                  </SelectItem>
                  <SelectItem value="restricted">
                    <div className="flex items-center gap-2">
                      <EyeOff className="h-4 w-4" />
                      Restricted
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Visibility Info */}
          <div className="p-3 bg-muted rounded-lg text-sm">
            {visibility === 'organization' ? (
              <div className="flex items-start gap-2">
                <Eye className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <strong>Organization-wide access</strong> - All organization members can access this workspace
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <EyeOff className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <strong>Restricted access</strong> - Only specific members listed below can access this workspace
                </div>
              </div>
            )}
          </div>

          {/* Members List (only shown for restricted workspaces or if canManage) */}
          {(visibility === 'restricted' || canManage) && (
            <>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">
                  {visibility === 'restricted' ? 'Members with Access' : 'Workspace Members'}
                  <Badge variant="outline" className="ml-2">{members.length}</Badge>
                </div>

                {canManage && visibility === 'restricted' && (
                  <Button
                    size="sm"
                    onClick={() => setAddMemberDialogOpen(true)}
                    className="gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Add Member
                  </Button>
                )}
              </div>

              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading members...</div>
              ) : members.length === 0 && visibility === 'restricted' ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 mb-2">No members have access</p>
                  <p className="text-sm text-gray-400">Add members to give them access to this workspace</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={undefined} alt={member.name} />
                          <AvatarFallback>{getUserInitials(member.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">{member.name}</div>
                          <div className="text-xs text-muted-foreground">{member.email}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant={member.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                          {member.role}
                        </Badge>

                        {canManage && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleChangeRole(member.id, member.role === 'admin' ? 'member' : 'admin')}>
                                {member.role === 'admin' ? 'Change to Member' : 'Change to Admin'}
                              </DropdownMenuItem>
                              {visibility === 'restricted' && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => handleRemoveMember(member.id)}
                                  >
                                    Remove from Workspace
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>

      {/* Add Member Dialog */}
      <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Member to Workspace</DialogTitle>
            <DialogDescription>
              Select an organization member to give them access to this workspace
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Member</label>
              <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a member" />
                </SelectTrigger>
                <SelectContent>
                  {availableOrgMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name} ({member.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select value={selectedMemberRole} onValueChange={setSelectedMemberRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddMemberDialogOpen(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddMember}
              disabled={isUpdating || !selectedMemberId}
            >
              {isUpdating ? 'Adding...' : 'Add Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
