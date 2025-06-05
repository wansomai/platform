'use client'
import React, { useState } from 'react';
import { 
  FileText, 
  Sparkles, 
  CheckCircle, 
  Play,
  ArrowRight,
  Brain,
  Zap,
  BookOpen,
  Shield,
  AlertTriangle,
  Eye,
  Search,
  Clock,
  Target,
  ThumbsUp,
  X
} from 'lucide-react';
import Image from 'next/image';
import Navbar from '@/components/layout/Navbar';

const ContractReviewPage = () => {
  const [selectedRisk, setSelectedRisk] = useState('critical');

   const partnerLogos = [
    { src: "/logos/1.png", alt: "CM Advocates" },
    { src: "/logos/2.png", alt: "Akoth Odipo Advocayes" },
    { src: "/logos/7.png", alt: "Riskhouse International" },
    { src: "/logos/4.png", alt: "Netsheria" },
 
  ];

  const riskCategories = [
    { id: 'critical', label: 'Critical', count: 3, color: 'text-red-600 bg-red-100' },
    { id: 'high', label: 'High', count: 7, color: 'text-orange-600 bg-orange-100' },
    { id: 'medium', label: 'Medium', count: 12, color: 'text-yellow-600 bg-yellow-100' },
    { id: 'low', label: 'Low', count: 5, color: 'text-green-600 bg-green-100' }
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Navbar placeholder */}
      <Navbar/>

      {/* Hero Section */}
     <section className="pt-32 pb-16 bg-[#355e66] relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/1.png')] bg-cover bg-center bg-blend-multiply opacity-30"></div>
        <div className="container mx-auto px-4 z-10 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-8">
                <Eye className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">AI-Powered Contract Analysis</span>
                <span className="ml-3 bg-white/20 text-xs px-2 py-1 rounded">Review</span>
              </div>
              
              <h1 className="text-4xl lg:text-6xl font-bold mb-6 text-shadow">
                #1 in AI<br />
                Contract Review
              </h1>
              
              <p className="text-xl mb-8 text-gray-100">
                Add precise redlines to your contracts—right in Microsoft Word. Catch risks, errors, and overlooked advantages instantly.
              </p>
              
              <button className="bg-[#d47b0f] hover:bg-[#355e66] text-white px-8 py-4 rounded-lg font-semibold transition-colors mb-12">
                Try Wansom Review Free
              </button>

              {/* Trusted by logos */}
              <div className="mb-8">
                <p className="text-gray-200 text-lg mb-4">Trusted by legal teams at:</p>
                   <div className="flex items-center space-x-2">
                                 {partnerLogos.map((logo, index) => (
                                       
                                          <div key={index} className="flex-shrink-0">
                                              <Image
                                                  src={logo.src}
                                                  alt={logo.alt}
                                                  width={160}
                                                  height={120}
                                                  className="h-10 md:h-14 w-auto object-contain transition-all duration-300 hover:scale-105 brightness-0 invert"
                                                  loading="lazy"
                                              />
                                          </div>
                                          
                                        ))}
                            </div>
              </div>
            </div>

            {/* Hero Demo Interface */}
            <div className="relative">
              <div className="bg-white rounded-xl shadow-2xl overflow-hidden border max-w-4xl">
                {/* Header with tabs */}
                <div className="bg-gray-50 border-b">
                  <div className="flex items-center justify-between px-6 py-3">
                    <div className="flex items-center space-x-6">
                      <div className="flex space-x-2">
                        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      </div>
                      <div className="flex space-x-6 text-sm">
                        <button className="text-gray-500">Context</button>
                        <button className="text-gray-500">Documents</button>
                        <button className="text-[#355e66] border-b-2 border-[#355e66] pb-1">Associates</button>
                      </div>
                    </div>
                    <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                  </div>
                </div>

                <div className="grid lg:grid-cols-3 h-[550px]">
                  {/* Main content area */}
                  <div className="lg:col-span-2 p-6 bg-white">
                    {/* AI Suggestion bubble */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 relative">
                      <div className="absolute -top-2 left-4 bg-gray-50 w-4 h-4 rotate-45 border-l border-t border-blue-200"></div>
                      <p className="text-sm text-gray-800 font-medium">
                        Yes, update the contract to match the policy
                      </p>
                    </div>

                    {/* Contract content */}
                    <div className="space-y-4 text-sm leading-relaxed" style={{fontFamily: 'Times, serif'}}>
                      <div>
                        <h3 className="font-bold text-base mb-3">9.1 Data Protection and Privacy:</h3>
                        <p className="text-gray-700 mb-4">
                          Employee data is collected and processed for legitimate business purposes (payroll, benefits, performance, etc.) in accordance with Company policy and applicable laws. Data types, storage, access, and retention are detailed in our Data Protection Policy. Employees have rights to access, rectify, or request erasure of their data.
                        </p>
                      </div>

          

                      {/* Generated content box */}
                      <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 mt-6">
                        <p className="text-gray-700 text-sm italic">
                          Create "Standard Employment Contract Template v4_Revised.docx" with all these changes and a "Contract Compliance & Improvement Report_May 2025.pdf"
                        </p> 
                      </div>

                      {/* File preview */}
                      <div className="flex items-center space-x-3 mt-6 p-3 bg-gray-50 rounded-lg">
                        <FileText className="w-8 h-8 text-blue-600" />
                        <div>
                          <div className="font-medium text-gray-900">Standard Employment Contract Template v3.docx</div>
                        </div>
                        <div className="ml-auto flex space-x-2">
                          <button className="p-2 hover:bg-gray-200 rounded">
                            <ArrowRight className="w-4 h-4 transform rotate-90" />
                          </button>
                          <button className="p-2 hover:bg-gray-200 rounded">
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Chat input */}
                    <div className="mt-6 flex items-center space-x-3">
                      <div className="flex-1 relative">
                        <input 
                          type="text" 
                          placeholder="Ask Anything about this project"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#355e66] focus:border-transparent"
                        />
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                          <div className="w-4 h-4 text-gray-400">📎</div>
                        </div>
                      </div>
                      <button className="bg-[#355e66] text-white p-3 rounded-lg hover:bg-[#2a4d54] transition-colors">
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Sidebar */}
                  <div className="bg-gray-50 border-l">
                    {/* Files section */}
                    <div className="p-4 border-b">
                      <div className="flex items-center justify-between mb-4">
                        <button className="bg-[#355e66] text-white px-3 py-1.5 rounded text-sm flex items-center">
                          <span className="mr-2">+</span> Files
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center space-x-3 p-2 hover:bg-white rounded">
                          <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                            <span className="text-red-600 text-xs font-bold">PDF</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">Employee Onboarding.PDF</div>
                            <div className="text-xs text-gray-500">View File</div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 p-2 hover:bg-white rounded">
                          <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                            <span className="text-blue-600 text-xs font-bold">DOC</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">Standard Employment Contract Template v3.docx</div>
                            <div className="text-xs text-gray-500">Start Editing</div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 p-2 hover:bg-white rounded">
                          <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                            <span className="text-red-600 text-xs font-bold">PDF</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">Group HR Policies.PDF</div>
                            <div className="text-xs text-gray-500">View File</div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 p-2 hover:bg-white rounded">
                          <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                            <span className="text-green-600 text-xs font-bold">XLS</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">New Employee List.XLS</div>
                            <div className="text-xs text-gray-500">View File</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Task completion */}
                    <div className="p-4">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">1 Task Completed</div>
                          <div className="text-xs text-gray-500">Document created successfully</div>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <button className="flex-1 bg-[#355e66] text-white py-2 px-3 rounded text-sm hover:bg-[#2a4d54] transition-colors">
                          View Task
                        </button>
                        <button className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors">
                          Restart
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Second set of eyes section */}
      <section className="section-spacing bg-white">
        <div className="section-container text-center">
          <h2 className="text-4xl lg:text-5xl font-bold mb-16 text-gray-900">
            A second set of eyes for any<br />
            agreement
          </h2>

          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-xl shadow-2xl border overflow-hidden">
              {/* Document viewer with sidebar */}
              <div className="grid lg:grid-cols-4 h-[600px]">
                {/* Document area */}
                <div className="lg:col-span-3 p-6 bg-gray-50">
                  <div className="bg-white rounded-lg border h-full p-6 overflow-y-auto" style={{fontFamily: 'Times, serif'}}>
                    <div className="mb-6">
                      <h3 className="font-bold text-lg mb-4">MASTER SERVICES AGREEMENT</h3>
                      <p className="text-sm text-gray-600 mb-4">Service Company will use commercially reasonable efforts to provide Customer Services...</p>
                    </div>

                    {/* Highlighted risks */}
                    <div className="space-y-4">
                      <div className="relative">
                        <div className="bg-red-100 border-l-4 border-red-500 p-3 rounded">
                          <p className="text-sm">
                            <span className="bg-red-200 px-1 rounded">Customer shall indemnify and hold harmless Service Company from any and all claims</span> arising out of Customer's use of the Services, including but not limited to claims for intellectual property infringement...
                          </p>
                        </div>
                        <div className="absolute -right-2 top-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                          1
                        </div>
                      </div>

                      <div className="relative">
                        <div className="bg-orange-100 border-l-4 border-orange-500 p-3 rounded">
                          <p className="text-sm">
                            Service Company makes no warranties, express or implied, <span className="bg-orange-200 px-1 rounded">including without limitation the warranties of merchantability and fitness for a particular purpose</span>...
                          </p>
                        </div>
                        <div className="absolute -right-2 top-2 bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                          2
                        </div>
                      </div>

                      <div className="relative">
                        <div className="bg-green-100 border-l-4 border-green-500 p-3 rounded">
                          <p className="text-sm">
                            Either party may terminate this Agreement upon thirty (30) days written notice to the other party. <span className="bg-green-200 px-1 rounded">Upon termination, all data will be returned within 30 days</span>...
                          </p>
                        </div>
                        <div className="absolute -right-2 top-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                          3
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="bg-white border-l">
                  <div className="p-4 border-b bg-gray-50">
                    <h3 className="font-semibold flex items-center">
                      <Target className="w-4 h-4 mr-2" />
                      Negotiate
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">Review findings and recommendations</p>
                  </div>

                  <div className="p-4">
                    <div className="space-y-3">
                      {/* Risk categories */}
                      {riskCategories.map((category) => (
                        <div 
                          key={category.id}
                          className={`p-3 rounded-lg cursor-pointer border transition-all ${
                            selectedRisk === category.id ? 'ring-2 ring-[#355e66]' : ''
                          }`}
                          onClick={() => setSelectedRisk(category.id)}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${category.color}`}>
                              {category.label}
                            </span>
                            <span className="text-sm font-medium">{category.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 pt-4 border-t">
                      <div className="text-center">
                        <div className="text-lg font-bold text-[#355e66]">95%</div>
                        <div className="text-sm text-gray-600">Agreement Score</div>
                      </div>
                    </div>

                    <button className="w-full mt-4 bg-[#355e66] text-white py-2 rounded hover:bg-[#2a4d54] transition-colors">
                      Apply Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Find risks and errors section */}
      <section className="section-spacing bg-gray-50">
        <div className="section-container">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-gray-900">
                Find risks and errors<br />
                buried in your docs
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Wansom meticulously scans for errors, client risks and overlooked advantages, providing you with instant redline suggestions.
              </p>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-[#355e66] rounded-lg flex items-center justify-center">
                    <Search className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Instant Risk Detection</h3>
                    <p className="text-gray-600">AI analyzes every clause to identify potential legal and business risks in real-time.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-[#d47b0f] rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Smart Redline Suggestions</h3>
                    <p className="text-gray-600">Get specific recommendations with alternative language to strengthen your position.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Review Time Cut by 80%</h3>
                    <p className="text-gray-600">Complete thorough contract reviews in minutes instead of hours.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white rounded-xl shadow-xl border p-6">
                <div className="mb-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <span className="font-semibold text-gray-900">Critical Risk Found</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    The contract currently states that the Company will own all data, including client improvements, enhancements, or modifications. This could potentially give ownership of modifications and enhancements to the Customer...
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="font-medium mb-2">Suggested Revision:</h4>
                  <p className="text-sm text-gray-700 italic">
                    "Company retains ownership of all improvements, enhancements, or modifications to ensure that any improvements or modifications specifically requested by the Customer do not become sole property of the Company."
                  </p>
                </div>

                <div className="flex space-x-2">
                  <button className="flex-1 bg-[#355e66] text-white py-2 px-4 rounded hover:bg-[#2a4d54] transition-colors">
                    Accept Suggestion
                  </button>
                  <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Breeze through reviews section */}
      <section className="section-spacing bg-[#355e66]">
        <div className="section-container">
          <h2 className="text-4xl lg:text-5xl font-bold text-center mb-16 text-white">
            Breeze through reviews like magic
          </h2>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-[#355e66] rounded-lg flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">Insightful comments in one click</h3>
              <p className="text-gray-600">
                Wansom reviews entire documents instantly and drafts comments. You choose which are approved and applied.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-[#d47b0f] rounded-lg flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">Bulk approve</h3>
              <p className="text-gray-600">
                Review, edit, and accept multiple changes in one go. Track changes and show additional items.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-6">
                <ThumbsUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">Redline in your name</h3>
              <p className="text-gray-600">
                Edits appear under your name, so you can forward redlined reviews to clients without extra work.
              </p>
            </div>
          </div>

          {/* Testimonial */}
          <div className="text-center">
            <blockquote className="text-2xl lg:text-3xl text-white mb-8 max-w-4xl mx-auto">
              "As part of your day-to-day productivity as an attorney, Wansom is invaluable. It can cut review time significantly."
            </blockquote>
            <div className="flex items-center justify-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-full"></div>
              <div className="text-left">
                <div className="text-white font-semibold">Sarah Thompson</div>
                <div className="text-gray-300 text-sm">Senior Partner, Thompson Legal</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* More features section */}
      <section className="section-spacing bg-white">
        <div className="section-container text-center">
          <h2 className="text-4xl font-bold mb-16 text-gray-900">More features to explore</h2>
          
          <div className="grid md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#355e66] rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold mb-2 text-gray-900">Legal Drafting</h3>
              <p className="text-gray-600 text-sm">Draft correct legally formatted documents with AI</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-[#355e66] rounded-lg flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold mb-2 text-gray-900">Deep Research</h3>
              <p className="text-gray-600 text-sm">Quick answers to complex legal questions</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-[#355e66] rounded-lg flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold mb-2 text-gray-900">Due Diligence</h3>
              <p className="text-gray-600 text-sm">Never be caught off-guard during transactions</p>
            </div>
            
            <div className="text-center relative">
              <div className="absolute -top-2 -right-2 bg-[#355e66] text-white text-xs px-2 py-1 rounded">Beta</div>
              <div className="w-16 h-16 bg-[#d47b0f] rounded-lg flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold mb-2 text-gray-900">Case Preparation</h3>
              <p className="text-gray-600 text-sm">Predict possible case outcomes with AI role play</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-spacing bg-gray-50">
        <div className="section-container text-center">
          <h2 className="text-4xl font-bold mb-6 text-gray-900">
            Start your free trial today
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join 3000+ legal teams using Wansom AI to review contracts faster and more accurately.
          </p>
          <button className="bg-[#355e66] hover:bg-[#2a4d54] text-white px-8 py-4 rounded-lg font-semibold transition-colors text-lg">
            Try Wansom Review Free
          </button>
        </div>
      </section>

      {/* Footer placeholder */}
      <div className="h-20 bg-[#355e66]"></div>
    </div>
  );
};

export default ContractReviewPage;