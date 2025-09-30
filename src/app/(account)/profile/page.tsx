'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Search, Plus, MoreHorizontal, UserPlus, Crown, Mail } from "lucide-react";
import { apiService } from '@/lib/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
  avatar?: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  createdAt: string;
}

const Page = () => {
  const { data: session, update: updateSession } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(session?.user?.name || '');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [isInviting, setIsInviting] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'members' | 'invitations'>('members');

  // Fetch team members and invitations
  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    try {
      setMembersLoading(true);

      // Fetch members and invitations separately to identify which one is failing
      let membersData: { members: TeamMember[] } = { members: [] };
      let invitationsData: { invitations: Invitation[] } = { invitations: [] };

      try {
        membersData = await apiService.get('/api/organization/members');
        console.log('Members response:', membersData);
      } catch (membersError) {
        console.error('Error fetching members:', membersError);
        // Use mock data for members if API fails
        const mockMembers: TeamMember[] = [
          {
            id: '1',
            name: session?.user?.name || 'You',
            email: session?.user?.email || '',
            role: 'admin',
            joinedAt: '2024-01-01',
            avatar: session?.user?.image ?? undefined
          }
        ];
        membersData = { members: mockMembers };
      }

      try {
        invitationsData = await apiService.get('/api/organization/invitations');
        console.log('Invitations response:', invitationsData);
      } catch (invitationsError) {
        console.error('Error fetching invitations:', invitationsError);
        invitationsData = { invitations: [] };
      }

      setTeamMembers(membersData.members || []);
      setInvitations(invitationsData.invitations || []);
    } catch (generalError) {
      console.error('General error fetching team data:', generalError);
    } finally {
      setMembersLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      // API call to update the user profile
      await apiService.put('/api/profile', { name: fullName });

      // Update session with new data
      await updateSession({
        ...session,
        user: {
          ...session?.user,
          name: fullName,
        },
      });
      setIsEditing(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Failed to update profile");
      console.error("Error updating profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    try {
      setIsInviting(true);
      const data = await apiService.post('/api/organization/invite', {
        email: inviteEmail,
        role: inviteRole
      }) as { success: boolean; invitation?: Invitation };

      if (data.success && data.invitation) {
        setInvitations([...invitations, data.invitation]);
        setInviteEmail('');
        toast.success(`Invitation sent to ${inviteEmail}`);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to send invitation';
      toast.error(errorMessage);
      console.error('Error sending invitation:', error);
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await apiService.delete(`/api/organization/members/${memberId}`);
      setTeamMembers(teamMembers.filter(member => member.id !== memberId));
      toast.success('Member removed successfully');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to remove member';
      toast.error(errorMessage);
      console.error('Error removing member:', error);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      await apiService.delete(`/api/organization/invitations/${invitationId}`);
      setInvitations(invitations.filter(inv => inv.id !== invitationId));
      toast.success('Invitation cancelled');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to cancel invitation';
      toast.error(errorMessage);
      console.error('Error cancelling invitation:', error);
    }
  };

  const filteredMembers = teamMembers.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getUserInitials = (name: string) => {
    if (!name) return "U";
    const nameParts = name.split(" ");
    if (nameParts.length === 1) return nameParts[0][0].toUpperCase();
    return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Organization</h1>
          <p className="text-gray-600">Manage your organization.</p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Members
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Manage your personal information and account settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    {isEditing ? (
                      <Input
                        id="name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Enter your full name"
                      />
                    ) : (
                      <p className="text-lg">{session?.user?.name || 'Not set'}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <p className="text-lg">{session?.user?.email}</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Organization</Label>
                    <p className="text-lg">{(session?.user as any)?.organization?.name || 'Not assigned'}</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Role</Label>
                    <p className="text-lg capitalize">{(session?.user as any)?.role || 'User'}</p>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="flex justify-end space-x-4">
                  {isEditing ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSave}
                        disabled={loading}
                      >
                        {loading ? "Saving..." : "Save Changes"}
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => setIsEditing(true)}>
                      Edit Profile
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="members" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Members</CardTitle>
                    <CardDescription>
                      Manage team members and invitations
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Members and Invitations Tabs */}
                <div className="flex items-center space-x-6 border-b">
                  <button
                    onClick={() => setActiveTab('members')}
                    className={`pb-2 text-sm font-medium transition-colors ${
                      activeTab === 'members'
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Members <Badge variant={activeTab === 'members' ? 'default' : 'outline'} className="ml-2">{teamMembers.length}</Badge>
                  </button>
                  <button
                    onClick={() => setActiveTab('invitations')}
                    className={`pb-2 text-sm font-medium transition-colors ${
                      activeTab === 'invitations'
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Invitations <Badge variant={activeTab === 'invitations' ? 'default' : 'outline'} className="ml-2">{invitations.length}</Badge>
                  </button>
                </div>

                {/* Search and Invite */}
                <div className="flex items-center justify-between gap-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Enter email address"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-64"
                    />
                    <Button onClick={handleInviteMember} disabled={isInviting}>
                      {isInviting ? "Inviting..." : "Invite"}
                    </Button>
                  </div>
                </div>

                {/* Content based on active tab */}
                {activeTab === 'members' ? (
                  /* Members Table */
                  <div className="space-y-4">
                    <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-500 border-b pb-2">
                      <div className="col-span-4">User</div>
                      <div className="col-span-3">Joined</div>
                      <div className="col-span-3">Role</div>
                      <div className="col-span-2">Actions</div>
                    </div>

                    {membersLoading ? (
                      <div className="text-center py-8 text-gray-500">Loading members...</div>
                    ) : filteredMembers.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">No members found</div>
                    ) : (
                      filteredMembers.map((member) => (
                        <div key={member.id} className="grid grid-cols-12 gap-4 items-center py-3 border-b last:border-b-0">
                          <div className="col-span-4 flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={member.avatar} alt={member.name} />
                              <AvatarFallback>{getUserInitials(member.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {member.name}
                                {member.email === session?.user?.email && (
                                  <Badge variant="outline" className="text-xs">You</Badge>
                                )}
                              </div>
                              <div className="text-sm text-gray-500">{member.email}</div>
                            </div>
                          </div>
                          <div className="col-span-3 text-sm text-gray-600">
                            {new Date(member.joinedAt).toLocaleDateString()}
                          </div>
                          <div className="col-span-3">
                            <Badge variant={member.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                              {member.role}
                            </Badge>
                          </div>
                          <div className="col-span-2">
                            {member.email !== session?.user?.email && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>Change Role</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => handleRemoveMember(member.id)}
                                  >
                                    Remove Member
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  /* Invitations Table */
                  <div className="space-y-4">
                    <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-500 border-b pb-2">
                      <div className="col-span-4">Email</div>
                      <div className="col-span-3">Sent</div>
                      <div className="col-span-3">Role</div>
                      <div className="col-span-2">Actions</div>
                    </div>

                    {membersLoading ? (
                      <div className="text-center py-8 text-gray-500">Loading invitations...</div>
                    ) : invitations.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Mail className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500 mb-2">No pending invitations</p>
                        <p className="text-sm text-gray-400">Send an invitation to add new team members</p>
                      </div>
                    ) : (
                      invitations.map((invitation) => (
                        <div key={invitation.id} className="grid grid-cols-12 gap-4 items-center py-3 border-b last:border-b-0">
                          <div className="col-span-4 flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                              <Mail className="h-4 w-4 text-gray-400" />
                            </div>
                            <div>
                              <div className="font-medium">{invitation.email}</div>
                              <div className="text-sm text-gray-500">Invitation pending</div>
                            </div>
                          </div>
                          <div className="col-span-3 text-sm text-gray-600">
                            {new Date(invitation.createdAt).toLocaleDateString()}
                          </div>
                          <div className="col-span-3">
                            <Badge variant="outline" className="capitalize">
                              {invitation.role}
                            </Badge>
                          </div>
                          <div className="col-span-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelInvitation(invitation.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Page;