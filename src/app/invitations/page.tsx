"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  AlertTriangle,
  UserPlus,
  Building 
} from "lucide-react"
import { apiService } from "@/lib/api"
import { useNotifications } from "@/hooks/useNotifications"

export default function InvitationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const token = searchParams.get("token")
  
  const [isLoading, setIsLoading] = useState(true)
  const [isAccepting, setIsAccepting] = useState(false)
  const [invitation, setInvitation] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  
  const { notify } = useNotifications()
  
  // Fetch invitation details when component mounts
  useEffect(() => {
    const fetchInvitation = async () => {
      if (!token) {
        setError("Invalid or missing invitation token")
        setIsLoading(false)
        return
      }
      
      try {
        // This would be a separate endpoint to get invitation details by token
        const response:any = await apiService.get(`/api/invitations?token=${token}`)
        setInvitation(response.data)
      } catch (error: any) {
        setError(error.message || "Failed to load invitation details")
      } finally {
        setIsLoading(false)
      }
    }
    
    // Only fetch if we're authenticated
    if (status === "authenticated") {
      fetchInvitation()
    } else if (status === "unauthenticated") {
      // Redirect to login with return URL
      const returnUrl = encodeURIComponent(`/invitation?token=${token}`)
      router.push(`/login?returnUrl=${returnUrl}`)
    }
  }, [token, status, router])
  
  // Handle accept invitation
  const handleAccept = async () => {
    if (!token || !session?.user) return
    
    setIsAccepting(true)
    
    try {
      const response = await apiService.post('/api/invitations/accept', { token })
      
      // Show success notification
      notify.success("You've successfully joined the organization")
      
      // Redirect to dashboard after small delay
      setTimeout(() => {
        router.push("/dashboard")
      }, 2000)
    } catch (error: any) {
      console.error("Error accepting invitation:", error)
      setError(error.message || "Failed to accept invitation")
      notify.error(error.message || "Failed to accept invitation")
    } finally {
      setIsAccepting(false)
    }
  }
  
  // Handle decline invitation (just redirects to dashboard)
  const handleDecline = () => {
    router.push("/dashboard")
  }
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Loading Invitation</CardTitle>
            <CardDescription>
              Please wait while we verify your invitation...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    )
  }
  
  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md border-red-200">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <XCircle className="h-12 w-12 text-red-500" />
            </div>
            <CardTitle>Invitation Error</CardTitle>
            <CardDescription className="text-red-500">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-sm text-muted-foreground">
              The invitation may have expired or been cancelled. Please contact the person who invited you.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => router.push("/dashboard")}>
              Return to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }
  
  // Show invitation details
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Building className="h-12 w-12 text-primary" />
          </div>
          <CardTitle>Organization Invitation</CardTitle>
          <CardDescription>
            You've been invited to join an organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {invitation && (
            <>
              <div className="p-4 border rounded-md">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium">Organization:</h3>
                  <span>{invitation.organizationName}</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium">Invited by:</h3>
                  <span>{invitation.invitedByName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">Role:</h3>
                  <span className="capitalize">{invitation.role}</span>
                </div>
              </div>
              
              {session?.user?.email !== invitation.email && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-700">Email mismatch</p>
                    <p className="text-yellow-600">
                      This invitation was sent to <strong>{invitation.email}</strong>, but you're logged in as <strong>{session?.user?.email}</strong>.
                    </p>
                    <p className="text-yellow-600 mt-1">
                      Log out and sign in with the invited email address to accept this invitation.
                    </p>
                  </div>
                </div>
              )}
              
              {invitation.currentOrganization && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-sm">
                  <p className="font-medium text-blue-700 mb-1">Switching Organizations</p>
                  <p className="text-blue-600">
                    You'll be switching from <strong>{invitation.currentOrganization}</strong> to <strong>{invitation.organizationName}</strong>.
                  </p>
                  <p className="text-blue-600 mt-1">
                    You can later switch between organizations in your profile settings.
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleDecline} disabled={isAccepting}>
            Decline
          </Button>
          <Button onClick={handleAccept} disabled={isAccepting || session?.user?.email !== invitation?.email}>
            {isAccepting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Accepting...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Accept Invitation
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}