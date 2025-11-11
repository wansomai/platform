'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Search, MoreHorizontal, UserPlus, Crown, Mail, Building2, Check } from "lucide-react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ProAccessModal from '@/components/modals/ProAccess';
import { useNotifications } from '@/hooks/useNotifications';
import { useProfile, useTeamManagement, useOrganization } from '@/store/profile.store';

const Page = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const { notify } = useNotifications();

  // Zustand stores
  const { user: profile, isLoading: profileLoading, isSaving, fetchProfile, updateProfile } = useProfile();
  const {
    teamMembers,
    invitations,
    isLoading: membersLoading,
    isInviting,
    searchQuery,
    getFilteredMembers,
    fetchTeamData,
    inviteMember,
    removeMember,
    cancelInvitation,
    updateMemberRole,
    setSearchQuery
  } = useTeamManagement();
  const {
    organizations,
    currentOrgId,
    orgsLoading,
    isSwitching,
    isUpgrading,
    isDowngrading,
    fetchOrganizations,
    switchOrganization: switchOrg,
    requestUpgrade,
    downgradeAccount: performDowngrade,
    setUpgrading
  } = useOrganization();

  // Local UI state only
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [activeTab, setActiveTab] = useState<'members' | 'invitations'>('members');
  const [showDowngradeDialog, setShowDowngradeDialog] = useState(false);
  const [showProAccess, setShowProAccess] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    fetchProfile();
    fetchTeamData();
    fetchOrganizations();
  }, []);

  // Sync fullName with profile
  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || '');
    }
  }, [profile]);

  const handleSave = async () => {
    const result = await updateProfile({ name: fullName });
    if (result) {
      setIsEditing(false);
      toast.success("Profile updated successfully");
    } else {
      toast.error("Failed to update profile");
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    const success = await inviteMember({ email: inviteEmail, role: inviteRole });
    if (success) {
      setInviteEmail('');
      toast.success(`Invitation sent to ${inviteEmail}`);
    } else {
      toast.error('Failed to send invitation');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    const success = await removeMember(memberId);
    if (success) {
      toast.success('Member removed successfully');
    } else {
      toast.error('Failed to remove member');
    }
  };

  const handleChangeRole = async (memberId: string, newRole: string) => {
    const success = await updateMemberRole(memberId, newRole);
    if (success) {
      toast.success('Role updated successfully');
    } else {
      toast.error('Failed to update role');
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    const success = await cancelInvitation(invitationId);
    if (success) {
      toast.success('Invitation cancelled');
    } else {
      toast.error('Failed to cancel invitation');
    }
  };

  const handleRequestProAccess = async () => {
    setUpgrading(true);

    const success = await requestUpgrade();

    if (success) {
      notify.success('Pro access request submitted successfully');
    } else {
      notify.error('Failed to submit Pro access request');
    }

    setShowProAccess(false);
  };

  const handleDowngradeAccount = async () => {
    setShowDowngradeDialog(false);
    const result = await performDowngrade();

    if (result.success) {
      toast.success(`Account downgraded. ${result.removedMembers || 0} members removed.`);
    } else {
      toast.error('Failed to downgrade account');
    }
  };

  const handleSwitchOrganization = async (organizationId: string) => {
    const success = await switchOrg(organizationId);

    if (success) {
      toast.success('Organization switched successfully');
      router.refresh();

      setTimeout(() => {
        router.push('/dashboard');
      }, 500);
    } else {
      toast.error('Failed to switch organization');
    }
  };

  const filteredMembers = getFilteredMembers();

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

        {(profile?.role === 'admin' || profile?.role === 'owner') && profile?.organization?.accountType === 'enterprise' ? (
          // Enterprise accounts - show tabs with Members
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
                {profileLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading profile...</div>
                ) : profile ? (
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
                        <p className="text-lg">{profile.fullName || 'Not set'}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <p className="text-lg">{profile.email}</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="org-select">Organization</Label>
                      {!orgsLoading && organizations.length > 1 ? (
                        <Select
                          value={currentOrgId}
                          onValueChange={handleSwitchOrganization}
                          disabled={isSwitching}
                        >
                          <SelectTrigger id="org-select" className="w-full">
                            <SelectValue placeholder="Select organization" />
                          </SelectTrigger>
                          <SelectContent>
                            {organizations.map((org) => (
                              <SelectItem key={org.id} value={org.id}>
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4 text-gray-400" />
                                  <span className="font-medium">{org.name}</span>
                                  <span className="text-xs text-gray-500 capitalize">
                                    ({org.role} • {org.accountType}{org.isPrimary && ' - Personal'})
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-lg">{profile.organization?.name || 'Not assigned'}</p>
                      )}
                      {!orgsLoading && organizations.length > 1 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Switch between organizations you have access to
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">Failed to load profile</div>
                )}

                <Separator className="my-4" />

                <div className="flex justify-end space-x-4">
                  {isEditing ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                        disabled={isSaving}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSave}
                        disabled={isSaving}
                      >
                        {isSaving ? "Saving..." : "Save Changes"}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button onClick={() => setIsEditing(true)}>
                        Edit Profile
                      </Button>
                      {profile?.role === 'owner' && (
                        <>
                          {profile.organization?.accountType !== 'enterprise' ? (
                            <Button
                              onClick={() => setShowProAccess(true)}
                              disabled={isUpgrading}
                            >
                              <Crown className="h-4 w-4 mr-2" />
                              {isUpgrading ? "Loading..." : "Switch to Enterprise"}
                            </Button>
                          ) : (
                            <Button
                              onClick={() => setShowDowngradeDialog(true)}
                              disabled={isDowngrading}
                              variant="destructive"
                            >
                              {isDowngrading ? "Switching..." : "Switch to Personal"}
                            </Button>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
            </TabsContent>

            {/* Members Tab Content */}
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
                                  <DropdownMenuItem onClick={() => handleChangeRole(member.id, member.role === 'admin' ? 'member' : 'admin')}>
                                    {member.role === 'admin' ? 'Change to Member' : 'Change to Admin'}
                                  </DropdownMenuItem>
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
                              <div className="font-medium">{invitation?.email}</div>
                              <div className="text-sm text-gray-500">Invitation pending</div>
                            </div>
                          </div>
                          <div className="col-span-3 text-sm text-gray-600">
                            {new Date(invitation?.createdAt).toLocaleDateString()}
                          </div>
                          <div className="col-span-3">
                            <Badge variant="outline" className="capitalize">
                              {invitation?.role}
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
        ) : (
          // For personal accounts (owners/admins) or regular members - show content without tabs
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Manage your personal information and account settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {profileLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading profile...</div>
                ) : profile ? (
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
                        <p className="text-lg">{profile.fullName || 'Not set'}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <p className="text-lg">{profile.email}</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="org-select">Organization</Label>
                      {!orgsLoading && organizations.length > 1 ? (
                        <Select
                          value={currentOrgId}
                          onValueChange={handleSwitchOrganization}
                          disabled={isSwitching}
                        >
                          <SelectTrigger id="org-select" className="w-full">
                            <SelectValue placeholder="Select organization" />
                          </SelectTrigger>
                          <SelectContent>
                            {organizations.map((org) => (
                              <SelectItem key={org.id} value={org.id}>
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4 text-gray-400" />
                                  <span className="font-medium">{org.name}</span>
                                  <span className="text-xs text-gray-500 capitalize">
                                    ({org.role} • {org.accountType}{org.isPrimary && ' - Personal'})
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-lg">{profile.organization?.name || 'Not assigned'}</p>
                      )}
                      {!orgsLoading && organizations.length > 1 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Switch between organizations you have access to
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">Failed to load profile</div>
                )}

                <Separator className="my-4" />

                <div className="flex justify-end space-x-4">
                  {isEditing ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                        disabled={isSaving}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSave}
                        disabled={isSaving}
                      >
                        {isSaving ? "Saving..." : "Save Changes"}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button onClick={() => setIsEditing(true)}>
                        Edit Profile
                      </Button>
                      {profile?.role === 'owner' && (
                        <>
                          {profile.organization?.accountType !== 'enterprise' ? (
                            profile.organization?.upgradeRequestedAt ? (
                              <Button
                                disabled
                                variant="outline"
                              >
                                <Crown className="h-4 w-4 mr-1" />
                                Upgrade Pending
                              </Button>
                            ) : (
                              <Button
                                onClick={() => setShowProAccess(true)}
                                disabled={isUpgrading}
                                className='bg-secondary'
                              >
                                <Crown className="h-4 w-4 mr-1" />
                                {isUpgrading ? "Requesting..." : "Switch to Enterprise"}
                              </Button>
                            )
                          ) : (
                            <Button
                              onClick={() => setShowDowngradeDialog(true)}
                              disabled={isDowngrading}
                              variant="destructive"
                            >
                              {isDowngrading ? "Downgrading..." : "Switch to Personal"}
                            </Button>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Upgrade Confirmation Dialog */}
            <ProAccessModal
              isOpen={showProAccess}
              onClose={() => setShowProAccess(false)}
              onRequestAccess={handleRequestProAccess}
              isLoading={isUpgrading}
              errorMessage="You have reached your message limit (20 messages on free plan). Request Pro access to send unlimited messages."
              userData={{
                name: session?.user?.name || '',
                email: session?.user?.email || '',
                accountType: 'personal' // Default to personal, user can change
              }}
            />

      {/* Downgrade Confirmation Dialog */}
      <AlertDialog open={showDowngradeDialog} onOpenChange={setShowDowngradeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Downgrade to Personal Account?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p className="font-semibold text-destructive">Warning: This action cannot be undone.</p>
              <p>
                Downgrading to a Personal account will:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Remove all team members from your organization</li>
                <li>Cancel all pending invitations</li>
                <li>Disable team collaboration features</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDowngradeAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Downgrade Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Page;