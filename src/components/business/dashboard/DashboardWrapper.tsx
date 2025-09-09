// components/dashboard/DashboardWrapper.tsx 
"use client";

import OnboardingFlow from '@/components/business/onboarding/onboard-flow';
import { useOnboardingStore } from '@/store/onboarding.store';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import {useSession} from 'next-auth/react';

interface DashboardWrapperProps {
  children: React.ReactNode;
}

interface UserProfile {
  id: string;
  firmName?: string;
  onboardingCompleted?: boolean;
  profileStatus?: string;
  contactEmail?: string;
  foundationPagesGenerated?: boolean;
  generationStatus?: string; 
}

export default function DashboardWrapper({ children }: DashboardWrapperProps) {
  const {data: session} = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileChecked, setProfileChecked] = useState(false);
  
  const checkAndResetIfCompleted = useOnboardingStore(state => state.checkAndResetIfCompleted);

  // Fetch user profile when user is authenticated
  useEffect(() => {
    if (session?.user && !profileChecked && !profileLoading) {
      fetchUserProfile();
    } else if (!session?.user) {
      // Reset state when user logs out
      setProfile(null);
      setProfileError(null);
      setProfileChecked(false);
    }
  }, [session?.user, profileChecked, profileLoading]);

  // Check if onboarding store should be reset
  useEffect(() => {
    if (profile?.onboardingCompleted) {
      checkAndResetIfCompleted(true);
    }
  }, [profile?.onboardingCompleted, checkAndResetIfCompleted]);

  const fetchUserProfile = async () => {
    if (!session?.user?.id) return;
    
    setProfileLoading(true);
    setProfileError(null);
    
    try {
      const response = await fetch(`/api/user-profile?userId=${session.user.id}`);
      
      if (response.ok) {
        const data = await response.json();
        setProfile(data.userProfile);
      } else if (response.status === 404) {
        // Profile doesn't exist yet - this is normal for new users
        setProfile(null);
      } else {
        // Other errors
        const errorData = await response.json();
        setProfileError(errorData.error || 'Failed to load profile');
      }
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Network error');
    } finally {
      setProfileLoading(false);
      setProfileChecked(true);
    }
  };

  const refreshUser = async () => {
    // Allow refetch by resetting the checked state
    setProfileChecked(false);
    setProfile(null);
    
    if (session?.user?.id) {
      await fetchUserProfile();
    }
  };

  // Helper function to check if user needs onboarding
  const needsOnboarding = () => {
    if (!session?.user || profileLoading) return false;
    return !profile?.onboardingCompleted;
  };

  // Helper function to check if user can access dashboard
  const canAccessDashboard = () => {
    if (!session?.user || profileLoading) return false;
    return profile?.onboardingCompleted === true;
  };

  // Show loading while checking authentication and profile
  if (profileLoading || !profileChecked) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, the middleware should redirect to login
  // but this is a safety check
  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">You need to be signed in to access this page.</p>
        </div>
      </div>
    );
  }

  // Show profile error if there's an issue fetching the profile
  if (profileError) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading profile: {profileError}</p>
          <button 
            onClick={refreshUser}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // If user needs onboarding, show onboarding flow (which includes generation wizard)
  if (needsOnboarding()) {
    const handleOnboardingComplete = async () => {
      // Refresh user data to get updated profile
      await refreshUser();
    };

    return (
      <OnboardingFlow onComplete={handleOnboardingComplete} />
    );
  }

  // User is authenticated and has completed onboarding
  // Show dashboard
  return <>{children}</>;
}