"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle2 } from "lucide-react"

// Form validation schema
const formSchema = z.object({
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  confirmPassword: z.string().min(1, { message: "Please confirm your password" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

type FormValues = z.infer<typeof formSchema>

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })
  
  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    if (!token) {
      setError("Missing reset token. Please request a new password reset link.")
      return
    }
    
    setIsSubmitting(true)
    setError(null)
    
    try {
      // In a real app, you would call your API here
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token,
          password: values.password 
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password')
      }
      
      // Set success state
      setSuccess(true)
    } catch (error: any) {
      setError(error.message || 'An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // If no token was provided, show an error
  if (!token) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <Alert variant="destructive">
            <AlertDescription>
              Invalid or missing reset token. Please request a new password reset link.
            </AlertDescription>
          </Alert>
          <div className="mt-6 text-center">
            <Link
              href="/auth/forgot-password"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Request new link
            </Link>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Reset Your Password</h1>
          <p className="mt-2 text-sm text-gray-600">
            Create a new password for your account
          </p>
        </div>
        
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success ? (
          <div className="mt-8 p-6 bg-green-50 rounded-lg text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              Password reset successful
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Your password has been reset successfully. You can now sign in with your new password.
            </p>
            <Button
              onClick={() => router.push('/login')}
              className="w-full"
            >
              Sign in
            </Button>
          </div>
        ) : (
          <div className="mt-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="••••••••" 
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="••••••••" 
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex items-center">
                  <input
                    id="show-password"
                    name="show-password"
                    type="checkbox"
                    checked={showPassword}
                    onChange={() => setShowPassword(!showPassword)}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="show-password" className="ml-2 block text-sm text-gray-900">
                    Show password
                  </label>
                </div>
                
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting password...
                    </>
                  ) : (
                    "Reset password"
                  )}
                </Button>
              </form>
            </Form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Remember your password?{" "}
                <Link
                  href="/login"
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}