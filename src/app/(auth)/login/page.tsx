"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn, useSession } from "next-auth/react"
import { Eye, EyeOff, Loader2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import Head from "next/head"

// Create a separate component that uses useSearchParams
function LoginPageContent() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()
  const { status } = useSession()
  const searchParams = useSearchParams()
  
  const callbackUrl = searchParams?.get('callbackUrl') || '/dashboard'

  // If already authenticated, redirect to callback URL
  useEffect(() => {
    if (status === 'authenticated') {
      router.push(callbackUrl)
    }
  }, [status, router, callbackUrl])

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email || !password) {
      setError("Please enter both email and password")
      return
    }

    try {
      setIsLoading(true)

      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      })

      if (!result?.ok) {
        setError(result?.error || 'Invalid email or password')
      } else {
        router.push(callbackUrl)
      }
    } catch (err) {
      setError("An unexpected error occurred")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true)
      await signIn('google', { callbackUrl })
    } catch (err) {
      setError("Google authentication failed")
      console.error(err)
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
   

      {/* Form Side */}
      <div className="flex flex-1 flex-col justify-center bg-white px-4 py-12 md:px-12">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 text-center">Sign in to your account</h2>
      
          </div>

          {error && (
            <div className="mb-6 rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            </div>
          )}

          <div className="mt-6">
            <Button 
              type="button" 
              variant="outline" 
              className="w-full" 
              onClick={handleGoogleLogin} 
              disabled={isLoading}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
                <path d="M1 1h22v22H1z" fill="none" />
              </svg>
              Sign in with Google
            </Button>
          </div>

          <div className="relative mt-6">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">Or continue with</span>
            </div>
          </div>

          <form className="mt-6 space-y-6" onSubmit={handleEmailLogin}>
            <div>
              <Label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1"
                placeholder="you@example.com"
                disabled={isLoading}
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </Label>
                <Link href="/forgot-password" className="text-xs font-medium text-[#005c4d] hover:text-[#004a3d]">
                  Forgot your password?
                </Link>
              </div>
              <div className="relative mt-1">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#005c4d]" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
              <p className="text-gray-600 text-center mt-4">
                Don't have an account? <Link href="/register" className="text-[#005c4d] font-medium">Register</Link>
              </p>
            </div>
          </form>
        </div>
      </div>
         {/* Creative Side */}
      <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-primary px-4 py-12 text-white md:px-12">
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23ffffff' fillOpacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
            }}
          ></div>
        </div>

        <div className="relative z-10 max-w-md text-center">
       
          <h1 className="mb-4 text-4xl tracking-tight md:text-5xl">Welcome Back</h1>
          <p className="mb-8 text-lg text-white/80">
            Save time by automating routine legal processes with AI, so you can focus on high-impact work.
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
              <h3 className="mb-1 font-semibold">Legal Drafting</h3>
              <p className="text-sm text-white/70">Draft correct legal documents and clauses quickly</p>
            </div>
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
              <h3 className="mb-1 font-semibold">Deep Research</h3>
              <p className="text-sm text-white/70">Get instant answers to complex legal questions</p>
            </div>
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
              <h3 className="mb-1 font-semibold">Due Diligence</h3>
              <p className="text-sm text-white/70">Never be caught off guard during transactions</p>
            </div>
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
              <h3 className="mb-1 font-semibold">Contract Reviews</h3>
              <p className="text-sm text-white/70">Redline contracts and catch risks automatically</p>
            </div>
          </div>

          <div className="mt-12">
            <div className="flex items-center justify-center space-x-2">
              <span className="block h-2 w-2 rounded-full bg-white/60"></span>
              <span className="block h-2 w-2 rounded-full bg-white/60"></span>
              <span className="block h-2 w-2 rounded-full bg-white"></span>
              <span className="block h-2 w-2 rounded-full bg-white/60"></span>
            </div>
            <div className="mt-6 flex items-center justify-center">
              <div className="flex -space-x-2">
                <img
                  className="h-12 w-12 rounded-full border-2 border-primary bg-white object-contain"
                  src="/logos/1.png"
                  alt="User"
                />
                <img
                  className="h-12 w-12 rounded-full border-2 border-primary bg-white object-contain"
                  src="/logos/2.png"
                  alt="User"
                />
                <img
                  className="h-12 w-12 rounded-full border-2 border-primary bg-white object-contain"
                  src="/logos/4.png"
                  alt="User"
                />
              </div>
              <p className="ml-2 text-sm text-white/80">Join 3,000+ Advocates</p>
            </div>
          </div>
        </div>

        {/* Animated Elements */}
        <div className="absolute bottom-0 left-0 right-0 h-1/3 overflow-hidden">
          <div className="absolute -bottom-8 left-1/4 h-16 w-16 animate-float rounded-full bg-white/10 backdrop-blur-sm"></div>
          <div className="absolute -bottom-12 left-2/3 h-24 w-24 animate-float-delayed rounded-full bg-white/10 backdrop-blur-sm"></div>
          <div className="absolute -bottom-16 left-1/2 h-32 w-32 animate-float-slow rounded-full bg-white/10 backdrop-blur-sm"></div>
        </div>
      </div>
    </div>
  )
}

// Main component that wraps the content in Suspense
export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
              <Head>
            <title>Create Your Account | Wansom AI</title>
        <meta name="description" content="create you wansom.ai account and start automating your legal processes" />
        <meta name="keywords" content="login wansom.ai, legal ai,ai law,legal ai companies " />
        <meta property="og:title" content="Create Your Account | Wansom AI"/>
        <meta property="og:description" content="create you wansom.ai account and start automating your legal processes" />
        <meta property="og:image" content="/images/features-2.png" />
        <meta name="twitter:card" content="Legal AI Assistant pricing for wansom AI" />
        <meta name="twitter:title" content="Create Your Account | Wansom AI" />
        <meta name="twitter:description" content="create you wansom.ai account and start automating your legal processes" />
        <meta name="twitter:image"  content="/images/features-2.png"/>
            </Head>
      <LoginPageContent />
    </Suspense>
  )
}