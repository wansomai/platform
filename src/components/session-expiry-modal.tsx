"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { signOut, useSession } from "next-auth/react"
import { AlertTriangle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"

const COUNTDOWN_SECONDS = 30

export function SessionExpiryModal() {
  const [visible, setVisible] = useState(false)
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const callbackUrlRef = useRef('/dashboard')
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const { update } = useSession()

  const handleLogout = useCallback(async () => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    const loginUrl = `/login?callbackUrl=${encodeURIComponent(callbackUrlRef.current)}`
    await signOut({ redirect: true, callbackUrl: loginUrl })
  }, [])

  const handleContinue = useCallback(async () => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    setIsRefreshing(true)
    try {
      await update() // triggers JWT callback with trigger="update" to force-regenerate the access token
      setVisible(false)
    } catch {
      handleLogout()
    } finally {
      setIsRefreshing(false)
    }
  }, [update, handleLogout])

  // Listen for session-expired events dispatched by the API client (api.ts)
  useEffect(() => {
    const handleSessionExpired = (event: Event) => {
      const customEvent = event as CustomEvent
      callbackUrlRef.current =
        customEvent.detail?.callbackUrl ||
        (typeof window !== 'undefined'
          ? window.location.pathname + window.location.search
          : '/dashboard')
      setCountdown(COUNTDOWN_SECONDS)
      setVisible(true)
    }

    window.addEventListener('session-expired', handleSessionExpired)
    return () => window.removeEventListener('session-expired', handleSessionExpired)
  }, [])

  // Countdown timer — auto-logout when it hits zero
  useEffect(() => {
    if (!visible) return

    countdownIntervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current!)
          handleLogout()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    }
  }, [visible, handleLogout])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-amber-50 border-b border-amber-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 rounded-full bg-amber-100 p-2.5">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Session Expired</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Your session has timed out due to inactivity
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-sm text-gray-600">
            Would you like to continue your session or log out? You will be automatically logged
            out in:
          </p>

          {/* Countdown display */}
          <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-amber-50 border border-amber-100 py-4">
            <Clock className="h-5 w-5 text-amber-500" />
            <span className="text-3xl font-bold tabular-nums text-amber-600">
              {String(countdown).padStart(2, '0')}
            </span>
            <span className="text-sm text-amber-500">seconds</span>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-1.5 w-full rounded-full bg-gray-100">
            <div
              className="h-1.5 rounded-full bg-amber-400 transition-all duration-1000 ease-linear"
              style={{ width: `${(countdown / COUNTDOWN_SECONDS) * 100}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-6">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="flex-1"
            disabled={isRefreshing}
          >
            Logout
          </Button>
          <Button
            onClick={handleContinue}
            className="flex-1 bg-[#005c4d] hover:bg-[#004a3d]"
            disabled={isRefreshing}
          >
            {isRefreshing ? 'Refreshing...' : 'Continue Session'}
          </Button>
        </div>
      </div>
    </div>
  )
}
