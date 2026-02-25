"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
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
  XCircle,
  Loader2,
  AlertTriangle,
  UserPlus,
  CheckCircle
} from "lucide-react"
import { apiService } from "@/lib/api"
import { toast } from "sonner"

function AcceptInvitationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const token = searchParams.get("token")

  const [isLoading, setIsLoading] = useState(true)
  const [isAccepting, setIsAccepting] = useState(false)
  const [invitation, setInvitation] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Fetch invitation details when component mounts
  useEffect(() => {
    const fetchInvitation = async () => {
      if (!token) {
        setError("Invalid or missing invitation token")
        setIsLoading(false)
        return
      }

      try {
        const response: any = await apiService.get(`/api/organization/invitations/verify?token=${token}`)
        const inv = response.invitation

        // If logged-in user's email doesn't match, sign them out and redirect to login
        if (session?.user?.email && session.user.email !== inv.email) {
          const returnUrl = encodeURIComponent(`/accept-invitation?token=${token}`)
          await signOut({ redirect: false })
          router.push(`/login?callbackUrl=${returnUrl}&email=${encodeURIComponent(inv.email)}&invitation=true`)
          return
        }

        setInvitation(inv)
      } catch (error: any) {
        setError(error.response?.data?.error || error.message || "Failed to load invitation details")
      } finally {
        setIsLoading(false)
      }
    }

    // Only fetch if we're authenticated
    if (status === "authenticated") {
      fetchInvitation()
    } else if (status === "unauthenticated") {
      // Verify the token and route to login or register based on whether user exists
      const verifyAndRedirect = async () => {
        try {
          const response: any = await apiService.get(`/api/organization/invitations/verify?token=${token}`)
          const invitationEmail = response.invitation.email
          const userExists = response.userExists
          const returnUrl = encodeURIComponent(`/accept-invitation?token=${token}`)

          if (userExists) {
            // Existing user → send to login with pre-filled email
            router.push(`/login?callbackUrl=${returnUrl}&email=${encodeURIComponent(invitationEmail)}&invitation=true`)
          } else {
            // New user → send to register
            router.push(`/register?invitationToken=${token}&email=${encodeURIComponent(invitationEmail)}&callbackUrl=${returnUrl}`)
          }
        } catch (error) {
          // If verification fails, redirect to login as a safe default
          const returnUrl = encodeURIComponent(`/accept-invitation?token=${token}`)
          router.push(`/login?callbackUrl=${returnUrl}`)
        }
      }

      verifyAndRedirect()
    }
  }, [token, status, router])

  // Handle accept invitation
  const handleAccept = async () => {
    if (!token || !session?.user) return

    setIsAccepting(true)

    try {
      await apiService.post('/api/organization/invitations/accept', { token })

      setSuccess(true)
      toast.success("You've successfully joined the organization!")

      // Redirect to dashboard after delay
      setTimeout(() => {
        router.push("/dashboard")
      }, 2000)
    } catch (error: any) {
      console.error("Error accepting invitation:", error)
      const errorMsg = error.response?.data?.error || error.message || "Failed to accept invitation"
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setIsAccepting(false)
    }
  }

  // Handle decline invitation
  const handleDecline = () => {
    toast.info("Invitation declined")
    router.push("/dashboard")
  }

  // Show loading state
  if (isLoading || status === "loading") {
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

  // Show success state
  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md border-green-200">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <CardTitle>Success!</CardTitle>
            <CardDescription className="text-green-600">
              You've successfully joined the organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-sm text-muted-foreground">
              Redirecting you to your dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show error state (but handle "already a member" and "expired" specially)
  if (error) {
    const isAlreadyMember = error.includes("already a member") || error.includes("already member");
    const isExpired = error.includes("expired");

    if (isAlreadyMember) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <Card className="w-full max-w-md border-green-200">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
              <CardTitle>Already a Member</CardTitle>
              <CardDescription className="text-green-600">
                You're already part of this organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-sm text-muted-foreground">
                You have already accepted this invitation and are now a member of the organization.
              </p>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button onClick={() => router.push("/dashboard")}>
                Go to Dashboard
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    if (isExpired) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <Card className="w-full max-w-md border-orange-200">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertTriangle className="h-12 w-12 text-orange-500" />
              </div>
              <CardTitle>Invitation Expired</CardTitle>
              <CardDescription className="text-orange-600">
                This invitation link has expired
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-sm text-muted-foreground">
                The invitation you're trying to use has expired. Invitations are valid for 7 days from when they're sent.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <p className="text-sm text-green-800">
                  <strong>What to do next:</strong>
                </p>
                <p className="text-sm text-green-700 mt-2">
                  Contact the person who invited you and ask them to resend the invitation. They can do this from their organization settings page.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button onClick={() => router.push("/login")}>
                Go to Login
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

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
              The invitation may have been cancelled or is invalid. Please contact the person who invited you.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => router.push("/login")}>
              Go to Login
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
        <CardContent className="space-y-4">
          {invitation && (
            <>
              <div className="text-center space-y-4 py-4">
                <p className="text-gray-700 leading-relaxed">
                  You have been invited by <strong className="text-gray-900">{invitation.inviterName}</strong> to join{' '}
                  <strong className="text-gray-900">{invitation.organizationName}</strong> on Wansom AI as a{' '}
                  <strong className="text-gray-900 capitalize">{invitation.role}</strong>.
                </p>
                <p className="text-sm text-gray-500">
                  This invitation link expires on{' '}
                  <strong className="text-gray-700">
                    {new Date(invitation.expiresAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </strong>.
                </p>
              </div>

            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleDecline} disabled={isAccepting}>
            Decline
          </Button>
          <Button
            onClick={handleAccept}
            disabled={isAccepting}
          >
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

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Loading Invitation</CardTitle>
            <CardDescription>
              Please wait while we load the invitation details...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    }>
      <AcceptInvitationContent />
    </Suspense>
  )
}
