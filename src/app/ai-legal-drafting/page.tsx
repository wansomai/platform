
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
  Shield
} from 'lucide-react';

// Import existing components
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Image from 'next/image';

const LegalDraftingPage = () => {
  const [formData, setFormData] = useState({
    jurisdiction: 'Queensland, Australia',
    customer: 'New customer',
    fees: '$1000',
    paymentTerms: 'Monthly'
  });

    const partnerLogos = [
    { src: "/logos/1.png", alt: "CM Advocates" },
    { src: "/logos/2.png", alt: "Akoth Odipo Advocayes" },
    { src: "/logos/7.png", alt: "Riskhouse International" },
    { src: "/logos/4.png", alt: "Netsheria" },
 
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-[#355e66] relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/1.png')] bg-cover bg-center bg-blend-multiply opacity-30"></div>
        <div className="container mx-auto px-4 z-10 relative flex flex-wrap">
          <div className="max-w-4xl text-white">
            <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-8">
              <FileText className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Never Start From scratch </span>
              <span  className="ml-3 bg-white/20 text-xs px-2 py-1 rounded">Wansom Draft</span>
            </div>
            
            <h1 className="text-heading-1 mb-4 text-white text-shadow-2xs">
              Draft Correct Legally formatted Documents and Clauses<br />
              quickly with AI
            </h1>
            
            <button className="bg-[#d47b0f] hover:bg-[#355e66] text-white px-8 py-4 rounded-lg font-semibold transition-colors mb-12">
              Start Drafting Now
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
          
            <div className="bg-[#355e66]  rounded-lg p-4 relative overflow-hidden  md:min-w-[500px]">
                 <div className="bg-white rounded-xl shadow-2xl overflow-hidden w-[75%]">
                  <div className="flex items-center bg-gray-50 px-4 py-3 border-b ">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    </div>
                    <div className="flex ml-auto space-x-4 text-sm">
                      <button className="flex items-center text-gray-600">
                        <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                        Chat
                      </button>
                      <button className="flex items-center text-[#355e66] font-medium">
                        <span className="w-2 h-2 bg-[#355e66] rounded-full mr-2"></span>
                        Draft
                      </button>
                      <button className="flex items-center text-gray-600">
                        <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                        Review
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6 text-gray-900">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-[#355e66] rounded-lg flex items-center justify-center">
                          <FileText className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h3 className="font-medium">New Clause</h3>
                          <p className="text-sm text-gray-600">Draft a new clause or article</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">New Document</h3>
                          <p className="text-sm text-gray-600">Draft a full document from scratch</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Play className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">Autocomplete</h3>
                          <p className="text-sm text-gray-600">Place your cursor and keep writing</p>
                        </div>
                      </div>
                      
                      <button className="text-sm text-gray-600 flex items-center">
                        2 More <ArrowRight className="w-4 h-4 ml-1" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="text-center lg:text-left w-[60%] absolute top-1/2 right-1 md:right-10">
                  <div className="bg-white rounded-lg shadow-xl p-6">
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="text-sm text-gray-600 mb-2">Preview Document</div>
                      <div className="space-y-2">
                        <div className="h-2 bg-gray-300 rounded w-full"></div>
                        <div className="h-2 bg-gray-300 rounded w-3/4"></div>
                        <div className="h-2 bg-gray-300 rounded w-5/6"></div>
                        <div className="h-2 bg-[#355e66] rounded w-1/2"></div>
                        <div className="h-2 bg-gray-300 rounded w-2/3"></div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 text-center">Legal Document Preview</div>
                  </div>
                </div>
            
            </div>
        
        </div>
      </section>

      {/* Quickly draft section */}
      <section className="section-spacing bg-white">
        <div className="section-container">
          <div className="text-center mb-16">
            <h2 className="text-heading-2 mb-4">
              Quickly draft relevant terms and clauses<br />
              across multiple documents
            </h2>
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-xl shadow-2xl border overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b">
                <div className="flex items-center space-x-4">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  </div>
                  <div className="text-sm text-gray-600">MSA - SaaS Software → J</div>
                  <div className="ml-auto text-sm text-gray-500">Wansom</div>
                </div>
              </div>
              
              <div className="p-8 bg-gray-100">
                <div className="grid lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="text-sm font-medium text-gray-700 mb-4">1.</div>
                    <div className="space-y-3 text-gray-700 leading-relaxed">
                      <p><strong>SAAS SERVICES AND SUPPORT</strong></p>
                      <p>1.1 Subject to the terms of this Agreement, Company will use commercially reasonable efforts to provide Customer the Services in accordance with the service level specifications set forth herein as they may be updated from time to time by Company. Company reserves the right to modify or cancel passwords, it deems inappropriate.</p>
                      <p>1.2 Subject to the terms hereof, Company will provide Customer with reasonable technical support services in accordance with the Company's practices set forth in Exhibit C.</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700">Wansom Assistant</span>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">Suggestions</span>
                      </div>
                      
                      <div className="space-y-3">
                        <button className="w-full text-left p-3 bg-[#355e66] text-white rounded-lg hover:bg-[#2a4d54] transition-colors">
                          <div className="font-medium text-sm mb-1">New Clause</div>
                          <div className="text-xs opacity-90">Describe the clause or article you want to draft</div>
                        </button>
                        
                        <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="font-medium text-sm mb-1 text-gray-700">Similar Length</div>
                          <div className="text-xs text-gray-500">Match the length and style</div>
                        </button>
                        
                        <div className="text-xs text-gray-500 flex items-center">
                          <ArrowRight className="w-3 h-3 mr-1" />
                          Previous Activity
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Wansom adapts section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="bg-white rounded-xl p-8 shadow-lg border max-w-md">
                <h3 className="text-lg font-semibold mb-6 text-gray-900">Jurisdiction (optional)</h3>
                <input 
                  type="text" 
                  value={formData.jurisdiction}
                  onChange={(e) => setFormData({...formData, jurisdiction: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg mb-6 focus:ring-2 focus:ring-[#355e66] focus:border-transparent"
                />
                
                <h4 className="font-medium mb-4 text-gray-700">Details</h4>
                <div className="space-y-3 text-sm text-gray-600">
                  <div>Customer: {formData.customer}</div>
                  <div>Fees: {formData.fees}</div>
                  <div>Payment Terms: {formData.paymentTerms}</div>
                </div>
                
                <button className="w-full bg-[#355e66] text-white py-3 rounded-lg font-medium mt-6 hover:bg-[#2a4d54] transition-colors">
                  Generate Document Outline
                </button>
              </div>
            </div>

            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
                Wansom adapts<br />
                to your documents
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Wansom automatically detects the substance of your document to draft relevant, ready to use language. You direct which content is approved and applied.
              </p>
              
              <div className="space-y-4">
                <p className="font-medium text-gray-900">Wansom instantly understands:</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-[#355e66] mr-3" />
                    <span className="text-gray-700">Contract Type</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-[#355e66] mr-3" />
                    <span className="text-gray-700">Jurisdiction</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-[#355e66] mr-3" />
                    <span className="text-gray-700">Party Details</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-[#355e66] mr-3" />
                    <span className="text-gray-700">Writing Style</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <blockquote className="text-3xl md:text-4xl font-medium mb-8 text-gray-900">
              "Rather than spending 30 to 40<br />
              minutes on a letter, I can draft it<br />
              using Wansom in 10 to 12 minutes."
            </blockquote>
            <div className="flex items-center justify-center space-x-4">
              <div className="w-12 h-12 bg-[#355e66] rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">TS</span>
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900">Todd Strang</div>
                <div className="text-gray-600">Partner, KMSC Law LLP</div>
              </div>
              <button className="ml-8 bg-[#355e66] hover:bg-[#2a4d54] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Read KMSC's Story
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Draft from scratch section */}
      <section className="py-20 bg-[#355e66]">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                Draft from scratch or<br />
                existing precedents
              </h2>
              <p className="text-xl text-gray-100 mb-8">
                Create new clauses and documents, or store your existing precedents and Wansom will draft content to match.
              </p>
              
              <button className="bg-[#d47b0f] hover:bg-[#b8690c] text-white px-8 py-4 rounded-lg font-semibold transition-colors">
                Try Wansom Free
              </button>
            </div>

            <div className="relative">
              <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
                <div className="p-4 border-b bg-gray-50">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">1 of 4</span>
                    <div className="flex space-x-2">
                      <button className="p-1 text-gray-400 hover:text-gray-600">←</button>
                      <button className="p-1 text-gray-400 hover:text-gray-600">→</button>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-gray-900 mb-4">
                    CONFIDENTIALITY AND USE OF<br />
                    SUBCONTRACTORS
                  </h3>
                  <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                    Each party (the "Receiving Party") understands that the other party (the "Disclosing Party") has disclosed or may disclose business, technical, or financial information relating to the Disclosing Party's business (hereinafter referred to as "Proprietary Information"). The Receiving Party agrees to: (i) take reasonable precautions to protect such Proprietary Information...
                  </p>
                  <div className="flex space-x-2">
                    <button className="p-2 border border-gray-200 rounded hover:bg-gray-50">
                      <FileText className="w-4 h-4 text-gray-600" />
                    </button>
                    <button className="p-2 border border-gray-200 rounded hover:bg-gray-50">
                      <BookOpen className="w-4 h-4 text-gray-600" />
                    </button>
                    <button className="bg-[#355e66] text-white px-4 py-2 rounded font-medium hover:bg-[#2a4d54] transition-colors">
                      Insert at Cursor
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-8 text-gray-900">
              Review, draft, and chat in<br />
              140+ languages
            </h2>
            <button className="bg-[#355e66] hover:bg-[#2a4d54] text-white px-8 py-4 rounded-lg font-semibold transition-colors">
              Try Wansom Free
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="text-center bg-white p-8 rounded-xl shadow-sm">
              <div className="w-16 h-16 bg-[#355e66] rounded-lg flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">Save favourite clauses</h3>
              <p className="text-gray-600">
                Store and access your favourite clauses and documents. Draft new language based on your preferred terms and past work.
              </p>
            </div>

            <div className="text-center bg-white p-8 rounded-xl shadow-sm">
              <div className="w-16 h-16 bg-[#355e66] rounded-lg flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">Insert directly without copy/paste</h3>
              <p className="text-gray-600 mb-4">
                No more copy and paste. Easily input your draft content in-line with a single click.
              </p>
              <div className="bg-[#355e66] text-white px-3 py-1 rounded text-sm inline-flex items-center">
                <Zap className="w-4 h-4 mr-2" />
                Insert at Cursor
              </div>
            </div>

            <div className="text-center bg-white p-8 rounded-xl shadow-sm">
              <div className="w-16 h-16 bg-[#355e66] rounded-lg flex items-center justify-center mx-auto mb-6">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">Pull from precedents</h3>
              <p className="text-gray-600">
                Upload documents to your Clause Library to reference key language you want to repurpose. Share documents for yourself, or make them accessible to your team.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Another testimonial */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <blockquote className="text-3xl md:text-4xl font-medium mb-8 text-gray-900">
              "If a clause needs to be rewritten<br />
              based on comments, I use Wansom<br />
              to provide a first pass of the rewrite."
            </blockquote>
            <div className="flex items-center justify-center space-x-4">
              <div className="w-12 h-12 bg-[#355e66] rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">AV</span>
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900">Abhishek Vaidyanathan</div>
                <div className="text-gray-600">NEAR Foundation</div>
              </div>
              <button className="ml-8 bg-[#355e66] hover:bg-[#2a4d54] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Read NEAR Foundation's Story
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* AI Agent section */}
      <section className="py-20 bg-[#355e66]">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center bg-[#b8690c] rounded-full px-4 py-2 mb-8">
              <span className="text-sm font-medium text-white">Legal work made magic</span>
              <span className="ml-3 bg-[#9d5608] text-xs px-2 py-1 rounded text-white">Associate</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold mb-8 text-white">
              The first AI agent that can<br />
              assemble multi-document<br />
              transactions
            </h2>
            
            <button className="text-white border border-white px-6 py-3 rounded-lg hover:bg-white hover:text-[#d47b0f] transition-colors">
              More on Wansom Associate →
            </button>
            
            <div className="mt-12">
              <div className="bg-white rounded-xl shadow-2xl overflow-hidden max-w-2xl mx-auto">
                <div className="bg-gray-50 p-4 border-b">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Review Term Sheet</span>
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded">TermSheet.docx</span>
                    <div className="ml-auto">
                      <button className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <Play className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-8">
                  <div className="text-gray-600 text-sm text-center">
                    AI Associate Demo Video Preview
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* More spells section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-16 text-gray-900">More features to explore</h2>
          
          <div className="grid md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold mb-2 text-gray-900">Review</h3>
              <p className="text-gray-600 text-sm">Redline contracts and catch risks</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold mb-2 text-gray-900">Ask</h3>
              <p className="text-gray-600 text-sm">Quick answers to complex questions</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold mb-2 text-gray-900">Benchmarks</h3>
              <p className="text-gray-600 text-sm">Compare contracts to industry standards</p>
            </div>
            
            <div className="text-center relative">
              <div className="absolute -top-2 -right-2 bg-[#355e66] text-white text-xs px-2 py-1 rounded">New</div>
              <div className="w-16 h-16 bg-[#d47b0f] rounded-lg flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold mb-2 text-gray-900">Associate</h3>
              <p className="text-gray-600 text-sm">Multi-step document workflows</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6 text-gray-900">Start your 7-day free trial</h2>
          <p className="text-xl text-gray-600 mb-8">Join 3000+ legal teams using Wansom</p>
          
          <div className="max-w-md mx-auto grid grid-cols-1 gap-4 mb-8">
            <input 
              type="email" 
              placeholder="e.g. joe@email.com"
              className="px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#355e66] focus:border-transparent"
            />
            <select className="px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#355e66] focus:border-transparent">
              <option>Are you a legal professional?</option>
              <option>Yes - Law Firm Partner</option>
              <option>Yes - Solo Practitioner</option>
              <option>Yes - In-House Counsel</option>
              <option>Yes - Legal Associate</option>
              <option>No - But interested in legal tech</option>
            </select>
          </div>
          
          <button className="bg-[#355e66] hover:bg-[#2a4d54] text-white px-8 py-4 rounded-lg font-semibold transition-colors">
            Try Wansom Free
          </button>
          
          <p className="text-gray-500 text-sm mt-4">*Required</p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LegalDraftingPage;