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
import { Search, MoreHorizontal, UserPlus, Crown, Mail, Building2, Loader2, RefreshCw, CheckCircle2, ShieldAlert } from "lucide-react";
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
import BillingCard from '@/components/billing/BillingCard';
import { useNotifications } from '@/hooks/useNotifications';
import { useProfile, useTeamManagement, useOrganization, useSubscription, useProfileStore } from '@/store/profile.store';
import { apiService } from '@/lib/api';

const Page = () => {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();

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
    resendInvitation,
    updateMemberRole,
    setSearchQuery
  } = useTeamManagement();
  const {
    organizations,
    currentOrgId,
    orgsLoading,
    isSwitching,
    isDowngrading,
    fetchOrganizations,
    switchOrganization: switchOrg,
    downgradeAccount: performDowngrade,
  } = useOrganization();
  const { subscriptionStatus, fetchSubscriptionStatus, cancelSubscription, retryPayment, isCancellingSubscription, isRetryingPayment } = useSubscription();

  // Local UI state only
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [activeTab, setActiveTab] = useState<'members' | 'invitations'>('members');
  const [showDowngradeDialog, setShowDowngradeDialog] = useState(false);
  const [showProAccess, setShowProAccess] = useState(false);
  const [changingRoleForMember, setChangingRoleForMember] = useState<string | null>(null);
  const [resendingInvitation, setResendingInvitation] = useState<string | null>(null);

  const { notify } = useNotifications();

  // Email verification inline state
  const [verifySending, setVerifySending] = useState(false);
  const [verifySent, setVerifySent] = useState(false);
  const [verifyCooldown, setVerifyCooldown] = useState(0);

  useEffect(() => {
    if (verifyCooldown <= 0) return;
    const t = setTimeout(() => setVerifyCooldown((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [verifyCooldown]);

  const handleSendVerification = async () => {
    setVerifySending(true);
    try {
      const res = await apiService.post<any>('/api/auth/send-verification', {});
      const message: string = (res as any)?.message ?? '';
      if (message === 'Email is already verified') {
        notify.success('Your email is already verified.');
        fetchProfile(true);
      } else {
        setVerifySent(true);
        setVerifyCooldown(120);
        notify.success('Verification email sent — check your inbox!');
      }
    } catch (err: any) {
      const status = err?.status ?? err?.response?.status;
      if (status === 429) {
        notify.error('Please wait a moment before requesting another verification email.');
      } else {
        notify.error('Failed to send verification email. Please try again.');
      }
    } finally {
      setVerifySending(false);
    }
  };

  // Fetch data on mount
  useEffect(() => {
    fetchProfile();
    fetchTeamData();
    fetchOrganizations();
    fetchSubscriptionStatus();
  }, []);

  // Sync fullName and organizationName with profile
  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || '');
      setOrganizationName(profile.organization?.name || '');
    }
  }, [profile]);

  const handleSave = async () => {
    const updateData: { name: string; organizationName?: string } = {
      name: fullName
    };

    // Only include organizationName if user is the owner and it has changed
    if (profile?.role === 'owner' && organizationName !== profile?.organization?.name) {
      updateData.organizationName = organizationName;
    }

    const result = await updateProfile(updateData);
    if (result) {
      setIsEditing(false);
      notify.success("Profile updated successfully");
    } else {
      notify.error("Failed to update profile");
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) {
      notify.error('Please enter an email address');
      return;
    }

    const success = await inviteMember({ email: inviteEmail, role: inviteRole });
    if (success) {
      setInviteEmail('');
      notify.success(`Invitation sent to ${inviteEmail}`);

    } else {
      notify.error("Failed to send invitation");
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    const success = await removeMember(memberId);
    if (success) {
      notify.success('Member removed successfully');
    } else {
      notify.error('Failed to remove member');
    }
  };

  const handleChangeRole = async (memberId: string, newRole: string) => {
    setChangingRoleForMember(memberId);
    const success = await updateMemberRole(memberId, newRole);
    if (success) {
      notify.success('Role updated successfully');
      // Refresh profile to ensure current user sees updated permissions if their role was changed
      await fetchProfile(true);
    } else {
      notify.error('Failed to update role');
    }
    setChangingRoleForMember(null);
  };

  const handleCancelInvitation = async (invitationId: string) => {
    const success = await cancelInvitation(invitationId);
    if (success) {
      notify.success('Invitation cancelled');
    } else {
      notify.error('Failed to cancel invitation');
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    setResendingInvitation(invitationId);
    const success = await resendInvitation(invitationId);
    if (success) {
      notify.success('Invitation resent successfully');
    } else {
      notify.error('Failed to resend invitation');
    }
    setResendingInvitation(null);
  };

  const handleDowngradeAccount = async () => {
    setShowDowngradeDialog(false);

    const isEnterprise = profile?.organization?.accountType === 'enterprise' ||
      profile?.activeOrganization?.accountType === 'enterprise';

    if (isEnterprise) {
      // Enterprise accountType: downgrade org and remove members
      const result = await performDowngrade();
      if (result.success) {
        notify.success(`Account downgraded. ${result.removedMembers || 0} members removed.`);
      } else {
        notify.error('Failed to downgrade account');
      }
    } else {
      // Personal accountType with Paystack subscription: cancel subscription
      const result = await cancelSubscription();
      if (result.success) {
        notify.success(result.effectiveUntil
          ? `Subscription cancelled. Access continues until ${new Date(result.effectiveUntil).toLocaleDateString()}.`
          : 'Subscription cancelled successfully.');
        // Refresh subscription status to update UI
        await fetchSubscriptionStatus();
        useProfileStore.getState().invalidateCache();
        await fetchProfile(true);
      } else {
        notify.error(result.message || 'Failed to cancel subscription');
      }
    }
  };

  const handleSwitchOrganization = async (organizationId: string) => {
    const success = await switchOrg(organizationId);

    if (success) {
      // Profile is already refreshed inside switchOrg() function

      // Trigger NextAuth session refresh to update session data
      await updateSession();

      notify.success('Organization switched successfully');
      router.refresh();

      setTimeout(() => {
        router.push('/dashboard');
      }, 500);
    } else {
      notify.error('Failed to switch organization');
    }
  };

  // Determine pro access from subscription status (covers both Paystack subscription and enterprise accountType)
  const hasProAccess = subscriptionStatus?.hasProAccess || false;
  const isNonRenewing = subscriptionStatus?.effectiveStatus === 'non_renewing';

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

        {(() => {
          const isEnterprise = subscriptionStatus?.isEnterprise || profile?.activeOrganization?.accountType === 'enterprise' || profile?.organization?.accountType === 'enterprise';
          const showMembers = (profile?.role === 'admin' || profile?.role === 'owner') && isEnterprise;
          const showBilling = subscriptionStatus?.canViewBilling ?? false;
          const colClass = showMembers && showBilling ? 'grid-cols-3' : (showMembers || showBilling) ? 'grid-cols-2' : 'grid-cols-1';
          return (
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className={`grid w-full max-w-lg ${colClass}`}>
              <TabsTrigger value="general" className="flex items-center gap-2">
                <Crown className="h-4 w-4" />
                General
              </TabsTrigger>
              {showMembers && (
                <TabsTrigger value="members" className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Members
                </TabsTrigger>
              )}
              {showBilling && (
                <TabsTrigger value="billing" className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Billing
                </TabsTrigger>
              )}
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
                      <div className="flex items-center gap-3">
                        <p className="text-lg">{profile.email}</p>
                        {profile.authProvider !== 'google' && (
                          profile.emailVerified ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Verified
                            </span>
                          ) : (
                            <button
                              onClick={handleSendVerification}
                              disabled={verifySending || verifyCooldown > 0}
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 hover:text-amber-800 border border-amber-300 hover:border-amber-400 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {verifySending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : verifySent ? (
                                <Mail className="h-3 w-3" />
                              ) : (
                                <ShieldAlert className="h-3 w-3" />
                              )}
                              {verifySending
                                ? 'Sending…'
                                : verifyCooldown > 0
                                  ? `Resend in ${verifyCooldown}s`
                                  : verifySent
                                    ? 'Resend email'
                                    : 'Verify email'}
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    {profile?.role === 'owner' && (
                      <div className="space-y-2">
                        <Label htmlFor="organization-name">Organization Name</Label>
                        {isEditing ? (
                          <Input
                            id="organization-name"
                            value={organizationName}
                            onChange={(e) => setOrganizationName(e.target.value)}
                            placeholder="Enter organization name"
                          />
                        ) : (
                          <p className="text-lg">{profile.organization?.name || 'Not set'}</p>
                        )}
                      </div>
                    )}

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
                          {!hasProAccess ? (
                            <Button
                              onClick={() => setShowProAccess(true)}
                            >
                              <Crown className="h-4 w-4 mr-2" />
                              Upgrade Plan
                            </Button>
                          ) : isNonRenewing ? (
                            <Button
                              disabled
                              variant="outline"
                            >
                              <Crown className="h-4 w-4 mr-2" />
                              Plan ends {subscriptionStatus?.subscription?.currentPeriodEnd
                                ? new Date(subscriptionStatus.subscription.currentPeriodEnd).toLocaleDateString()
                                : 'soon'}
                            </Button>
                          ) : (
                            <Button
                              onClick={() => setShowDowngradeDialog(true)}
                              disabled={isDowngrading}
                              variant="destructive"
                            >
                              {isDowngrading ? "Switching..." : "Switch to Free Plan"}
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
                            {member.role}
                          </div>
                          <div className="col-span-2">
                            {member.email !== session?.user?.email && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" disabled={changingRoleForMember === member.id}>
                                    {changingRoleForMember === member.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <MoreHorizontal className="h-4 w-4" />
                                    )}
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => handleChangeRole(member.id, member.role === 'admin' ? 'member' : 'admin')}
                                    disabled={changingRoleForMember === member.id}
                                  >
                                    {changingRoleForMember === member.id ? (
                                      <span className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Updating...
                                      </span>
                                    ) : (
                                      member.role === 'admin' ? 'Change to Member' : 'Change to Admin'
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => handleRemoveMember(member.id)}
                                    disabled={changingRoleForMember === member.id}
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
                      invitations.map((invitation) => {
                        const isExpired = invitation?.expiresAt && new Date(invitation.expiresAt) < new Date();
                        return (
                        <div key={invitation?.id} className="grid grid-cols-12 gap-4 items-center py-3 border-b last:border-b-0">
                          <div className="col-span-4 flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                              <Mail className="h-4 w-4 text-gray-400" />
                            </div>
                            <div>
                              <div className="font-medium">{invitation?.email}</div>
                              <div className={`text-sm ${isExpired ? 'text-red-500' : 'text-gray-500'}`}>
                                {isExpired ? 'Invitation expired' : 'Invitation pending'}
                              </div>
                            </div>
                          </div>
                          <div className="col-span-3 text-sm text-gray-600">
                            {new Date(invitation?.createdAt).toLocaleDateString()}
                          </div>
                          <div className="col-span-3">
                            <Badge variant={isExpired ? "destructive" : "outline"} className="capitalize">
                              {invitation?.role}
                            </Badge>
                          </div>
                          <div className="col-span-2 flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResendInvitation(invitation.id)}
                              disabled={resendingInvitation === invitation.id}
                              className="text-primary hover:text-amber-100"
                            >
                              {resendingInvitation === invitation.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                  Resending...
                                </>
                              ) : (
                                'Resend'
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelInvitation(invitation.id)}
                              disabled={resendingInvitation === invitation.id}
                              className="text-red-600 hover:text-red-700"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )})
                    )}
                  </div>
                )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Billing Tab Content */}
            {showBilling && <TabsContent value="billing" className="space-y-6">
              {subscriptionStatus?.subscription ? (
                <BillingCard
                  subscriptionStatus={subscriptionStatus}
                  onCancelClick={() => setShowDowngradeDialog(true)}
                  onRetry={retryPayment}
                  isCancelling={isCancellingSubscription}
                  isRetrying={isRetryingPayment}
                />
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 py-16 text-center text-gray-400">
                  <Crown className="mx-auto mb-3 h-8 w-8 text-gray-300" />
                  <p className="text-sm font-medium">No billing data available</p>
                </div>
              )}
            </TabsContent>}
          </Tabs>
          );
        })()}
      </div>

      {/* Upgrade Confirmation Dialog */}
            <ProAccessModal
              isOpen={showProAccess}
              onClose={() => setShowProAccess(false)}
              errorMessage="You have reached your message limit. Upgrade to send unlimited messages."
              userData={{
                name: session?.user?.name || '',
                email: session?.user?.email || '',
                accountType: 'personal' // Default to personal, user can change
              }}
            />

      {/* Downgrade/Cancel Confirmation Dialog */}
      <AlertDialog open={showDowngradeDialog} onOpenChange={setShowDowngradeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            {profile?.organization?.accountType === 'enterprise' ? (
              <>
                <AlertDialogTitle>Downgrade to Personal Account?</AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-2">
                    <span className="block font-semibold text-destructive">Warning: This action cannot be undone.</span>
                    <span className="block">Downgrading to a Personal account will:</span>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Remove all team members from your organization</li>
                      <li>Cancel all pending invitations</li>
                      <li>Disable team collaboration features</li>
                    </ul>
                  </div>
                </AlertDialogDescription>
              </>
            ) : (
              <>
                <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-2">
                    <span className="block">Cancelling your subscription will:</span>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Revert to the free plan at the end of your billing period</li>
                      <li>Limit you to {2} projects and {8} messages per month</li>
                      <li>Disable premium features like AI Associates</li>
                    </ul>
                    {subscriptionStatus?.subscription?.currentPeriodEnd && (
                      <span className="block text-sm mt-2">
                        You will retain access to the current plan until{' '}
                        <span className="font-semibold">
                          {new Date(subscriptionStatus.subscription.currentPeriodEnd).toLocaleDateString()}
                        </span>.
                      </span>
                    )}
                  </div>
                </AlertDialogDescription>
              </>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Plan</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDowngradeAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {profile?.organization?.accountType === 'enterprise' ? 'Downgrade Account' : 'Cancel Subscription'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Page;