// app/login/page.tsx
'use client'

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"

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
import { Loader2 } from "lucide-react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

// Form validation schema
const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
})

type FormValues = z.infer<typeof formSchema>

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loginStatus, setLoginStatus] = useState<'idle' | 'success' | 'error'>('idle')
  
  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: ""
    },
  })
  
  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    try {
      // Clear any previous errors
      setError(null)
      setLoginStatus('idle')
      setIsLoading(true)
      
      console.log('Attempting login with:', values.email)
      
      // Attempt login
      const result = await login(values.email, values.password)
      
      if (result.success) {
        setLoginStatus('success')
        
        // Redirect to dashboard on successful login
        setTimeout(() => {
          router.push("/dashboard")
        }, 100)
      } else {
        setLoginStatus('error')
        setError(result.error || 'Invalid credentials. Please try again.')
      }
    } catch (err: any) {
      setLoginStatus('error')
      setError(err.message || 'Login failed. Please try again.')
      console.error('Login error:', err)
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Welcome Back</h1>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your account to continue
          </p>
        </div>
        
        {/* Success message */}
        {loginStatus === 'success' && (
          <Alert className="bg-green-50 border-green-200 text-green-800">
            <AlertDescription>Login successful! Redirecting you to the dashboard...</AlertDescription>
          </Alert>
        )}
        
        {/* Error message */}
        {(error || loginStatus === 'error') && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error || 'Login failed. Please try again.'}</AlertDescription>
          </Alert>
        )}
        
        <div className="mt-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
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
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Password</FormLabel>
                      <Link 
                        href="/forgot-password" 
                        className="text-sm text-primary-600 hover:text-primary-500"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <FormControl>
                      <Input 
                        placeholder="••••••••" 
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
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
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          </Form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}