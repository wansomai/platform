"use client"

import { useState } from "react"
import Link from "next/link"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import {
  Form,
  FormControl,
  FormDescription,
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
  email: z.string().email({ message: "Please enter a valid email address" }),
})

type FormValues = z.infer<typeof formSchema>

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  })
  
  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true)
    setError(null)
    
    try {
      // In a real app, you would call your API here
      const response = await fetch('/api/auth/reset-password-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: values.email }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to request password reset')
      }
      
      // Set success state
      setSuccess(true)
    } catch (error: any) {
      setError(error.message || 'An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Reset Your Password</h1>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email address and we'll send you a link to reset your password
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
              Check your email
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              We've sent a password reset link to <strong>{form.getValues().email}</strong>.
              Please check your inbox.
            </p>
            <Link 
              href="/login" 
              className="text-primary-600 hover:text-primary-500 font-medium"
            >
              Return to login
            </Link>
          </div>
        ) : (
          <div className="mt-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email address</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="you@example.com" 
                          type="email" 
                          autoComplete="email"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending reset link...
                    </>
                  ) : (
                    "Send reset link"
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