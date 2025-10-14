'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, GraduationCap, BookOpen, Users, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RegisterFormData {
  email: string;
  password: string;
  fullName: string;
 organizationName: string;
}

export default function SchoolRegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    fullName: '',
    organizationName: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      
      // Registration successful, redirect to login
      router.push('/login?registered=true');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center bg-white container mx-auto">
        <div className='grid grid-cols-1 lg:grid-cols-2 h-fit bg-gray-100 shadow-lg rounded-lg mx-4 lg:mx-20 my-10'>
    {/* Left Panel - Form */}
      <div className="flex flex-1 flex-col justify-center bg-gray-50 px-6 py-12 lg:px-20">
        <div className="mx-auto w-full max-w-md">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-heading-2 font-serif font-bold text-gray-900">Wansom AI Student Program</h1>
          </div>

          {error && (
            <div className="mb-6 rounded-lg bg-red-50 p-4 border border-red-200">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {/* Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="fullName" className="block text-sm font-medium text-gray-900 mb-1">
                Full Name
              </Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                required
                value={formData.fullName}
                onChange={handleChange}
                className="w-full bg-white border-gray-300"
                placeholder="John Doe"
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-1">
                School Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-white border-gray-300"
                placeholder="student@university.edu"
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="schoolName" className="block text-sm font-medium text-gray-900 mb-1">
                Name of School
              </Label>
              <Input
                id="organizationName"
                name="organizationName"
                type="text"
                required
                value={formData.organizationName}
                onChange={handleChange}
                className="w-full bg-white border-gray-300"
                placeholder="Strathmore Law School"
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-1">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-white border-gray-300 pr-10"
                  placeholder=""
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-white py-6 text-base font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Joining...
                </>
              ) : (
                'Join Program'
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* Right Panel - Info */}
      <div className=" bg-primary relative overflow-hidden">
        <div className="flex flex-col justify-center items-center w-full p-4 lg:p-12 text-white">
          {/* Main Content Card */}
          <div className="max-w-lg w-full mb-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <GraduationCap className="w-16 h-16 mb-6" strokeWidth={1.5} />
              <h2 className="text-heading-2 font-bold mb-4">
                Prepare for the Future of Legal Practice
              </h2>
              <p className="text-md lg:text-lg text-white/90 leading-relaxed mb-6">
                Join law students from leading institutions who are gaining hands-on experience with AI tools used in modern legal practice.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-6 h-6 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">AI-Powered Research</h3>
                    <p className="text-sm text-white/80">Master legal research with cutting-edge AI tools</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <BookOpen className="w-6 h-6 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Document Drafting</h3>
                    <p className="text-sm text-white/80">Learn to draft professional legal documents efficiently</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
        </div>
  
    </div>
  );
}