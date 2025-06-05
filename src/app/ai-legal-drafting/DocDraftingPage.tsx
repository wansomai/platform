
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
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const LegalDraftingPage = () => {
  const [formData, setFormData] = useState({
    jurisdiction: 'London, United Kingdom',
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
      <section className="section-spacing bg-gray-100">
        <div className="section-container">
          <div className="text-center mb-16">
            <h2 className="text-heading-2 mb-4">
              Quickly draft relevant terms and clauses<br />
              across multiple documents
            </h2>
          </div>

         <div className="max-w-6xl mx-auto">
  <div className="bg-white rounded-xl shadow-2xl border overflow-hidden">
    {/* Header */}
    <div className="bg-gray-50 px-4 md:px-6 py-3 md:py-4 border-b">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 md:space-x-4">
          <div className="flex space-x-1 md:space-x-2">
            <div className="w-2 h-2 md:w-3 md:h-3 bg-red-400 rounded-full"></div>
            <div className="w-2 h-2 md:w-3 md:h-3 bg-yellow-400 rounded-full"></div>
            <div className="w-2 h-2 md:w-3 md:h-3 bg-green-400 rounded-full"></div>
          </div>
          <div className="text-xs md:text-sm text-gray-600 truncate">Employment Agreement - Final.pdf</div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="hidden md:inline text-xs bg-gray-200 px-2 py-1 rounded">Page 1 of 3</span>
          <span className="text-xs md:text-sm text-gray-500">Wansom</span>
        </div>
      </div>
    </div>
    
    <div className="p-4 md:p-8 bg-white">
      <div className="grid lg:grid-cols-2 gap-4 md:gap-8">
        {/* Document Section */}
        <div className="bg-white border border-gray-300 rounded-lg p-3 md:p-6 shadow-sm" style={{fontFamily: 'Times, serif'}}>
          {/* Document Header */}
          <div className="text-center mb-4 md:mb-6">
            <h1 className="text-sm md:text-lg font-bold text-gray-900 mb-1 md:mb-2">EMPLOYMENT AGREEMENT</h1>
            <p className="text-xs md:text-sm text-gray-600">Innovate Tech Solutions LLC</p>
            <hr className="mt-2 md:mt-4 border-gray-300" />
          </div>

          {/* Document Content */}
          <div className="space-y-2 md:space-y-4 text-xs md:text-sm leading-relaxed">
            <div className="mb-2 md:mb-4">
              <p className="font-semibold text-gray-900">3. COMPENSATION AND BENEFITS</p>
            </div>
            
            <div className="space-y-2 md:space-y-3">
              <p className="text-gray-700">
                <span className="font-medium">3.1</span> Base salary of $120,000 annually, payable in accordance with Company's standard payroll practices.
              </p>
              
              {/* Highlighted section */}
              <div className="bg-yellow-200 px-2 py-1 rounded border-l-2 md:border-l-4 border-yellow-400">
                <p className="text-gray-700">
                  <span className="font-medium">3.2</span> <span className="bg-yellow-300 px-1">Employee shall be eligible for annual performance bonuses at the sole discretion of the Company, with targets to be established quarterly.</span>
                </p>
              </div>
              
              <p className="text-gray-700">
                <span className="font-medium">3.3</span> Standard benefits package including health insurance, dental coverage, and 401(k) matching as outlined in the Employee Handbook.
              </p>
              
              <div className="mt-3 md:mt-6">
                <p className="font-semibold text-gray-900">4. CONFIDENTIALITY</p>
              </div>
              
              <p className="text-gray-700">
                <span className="font-medium">4.1</span> Employee acknowledges access to confidential information and agrees to maintain strict confidentiality during and after employment...
              </p>
            </div>
          </div>
          
          {/* Page footer - hidden on mobile */}
          <div className="hidden md:block mt-8 pt-4 border-t border-gray-300 text-center">
            <p className="text-xs text-gray-500">Page 1</p>
          </div>
        </div>
        
        {/* Chat Interface Section */}
        <div className="space-y-3 md:space-y-4 -mt-[70%] -mr-3 md:mt-0 w-[80%] md:w-full mx-auto md:max-w-md lg:max-w-lg">
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {/* Chat Header */}
            <div className="bg-[#355e66] px-3 md:px-4 py-2 md:py-3 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-400 rounded-full"></div>
                  <span className="text-xs md:text-sm font-medium">Wansom Assistant</span>
                </div>
                <span className="text-xs bg-white/20 px-1.5 md:px-2 py-0.5 md:py-1 rounded">Active</span>
              </div>
            </div>
            
            {/* Chat Messages */}
            <div className="p-3 md:p-4 h-48 md:h-64 overflow-y-auto bg-gray-50">
              <div className="space-y-3 md:space-y-4">
                {/* AI Message */}
                <div className="flex space-x-2">
                  <div className="w-5 h-5 md:w-6 md:h-6 bg-[#355e66] rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs text-white">AI</span>
                  </div>
                  <div className="bg-white p-2 md:p-3 rounded-lg shadow-sm max-w-xs">
                    <p className="text-xs md:text-sm text-gray-700">I notice you highlighted the bonus clause. Would you like me to suggest improvements?</p>
                  </div>
                </div>
                
                {/* User Message */}
                <div className="flex space-x-2 justify-end">
                  <div className="bg-[#355e66] text-white p-2 md:p-3 rounded-lg max-w-xs">
                    <p className="text-xs md:text-sm">Yes, make it more specific with clear criteria and timeline</p>
                  </div>
                  <div className="w-5 h-5 md:w-6 md:h-6 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs text-white">You</span>
                  </div>
                </div>
                
                {/* AI Response */}
                <div className="flex space-x-2">
                  <div className="w-5 h-5 md:w-6 md:h-6 bg-[#355e66] rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs text-white">AI</span>
                  </div>
                  <div className="bg-white p-2 md:p-3 rounded-lg shadow-sm max-w-xs">
                    <p className="text-xs md:text-sm text-gray-700 mb-2">Here's a clearer version:</p>
                    <div className="p-2 bg-green-50 border-l-2 border-green-400 text-xs">
                      "Annual bonuses of 10-25% of base salary based on: (a) individual performance metrics, (b) company revenue targets. Decisions made by March 31st following performance year."
                    </div>
                    <button className="mt-2 text-xs bg-[#355e66] text-white px-2 py-1 rounded hover:bg-[#2a4d54] transition-colors">
                      Apply Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Chat Input */}
            <div className="p-2 md:p-3  border-t bg-white">
              <div className="flex space-x-2">
                <input 
                  type="text" 
                  placeholder="Ask me to revise this section..."
                  className="flex-1 px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-lg text-xs md:text-sm focus:ring-1 focus:ring-[#355e66] focus:border-transparent"
                />
                <button className="bg-[#355e66] text-white px-2 md:px-3 py-1.5 md:py-2 rounded-lg hover:bg-[#2a4d54] transition-colors">
                  <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Quick Actions - Simplified for mobile */}
          <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4">
            <h3 className="text-xs md:text-sm font-medium text-gray-700 mb-2 md:mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
              <button className="text-left p-2 text-xs md:text-sm bg-gray-50 rounded hover:bg-gray-100 transition-colors">
                📝 Draft clause
              </button>
              <button className="text-left p-2 text-xs md:text-sm bg-gray-50 rounded hover:bg-gray-100 transition-colors">
                🔍 Review risks
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

      {/* Wansom adapts section */}
      <section className="section-spacing bg-gray-50">
        <div className="section-container">
          <div className="grid lg:grid-cols-2 gap-10 ">
            <div>
                <div className='bg-primary rounded-lg p-6 flex items-center justify-center'>
  <div className="bg-white rounded-xl p-8 shadow-lg border max-w-md w-full">
    <h3 className="text-lg font-semibold mb-6 text-gray-900">Jurisdiction</h3>
    <input 
      type="text" 
      value={formData.jurisdiction}
      onChange={(e) => setFormData({...formData, jurisdiction: e.target.value})}
      className="w-full p-3 border border-gray-300 rounded-lg mb-6 focus:ring-2 focus:ring-[#355e66] focus:border-transparent"
    />
    
    <h4 className="font-medium mb-4 text-gray-700">Drafting Settings</h4>
    <div className="space-y-3 text-sm text-gray-600">
      <div>Document Type: Employment Agreement</div>
      <div>Writing Style: Formal</div>
      <div>Clause Length: Standard</div>
    
    </div>
    
    <button className="w-full bg-[#355e66] text-white py-3 rounded-lg font-medium mt-6 hover:bg-[#2a4d54] transition-colors">
      Generate Document Outline
    </button>
  </div></div>
</div>

            <div>
              <h2 className="text-heading-2 mb-4 text-gray-900">
                Wansom adapts
                to your documents
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Wansom automatically detects the substance of your document to draft relevant, ready to use clauses. Collaborate with AI to achieve tasks faster.
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

      {/* Draft from scratch section */}
      <section className="section-spacing bg-[#355e66]">
        <div className="section-container">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                Draft from scratch or<br />
                existing templates
              </h2>
              <p className="text-xl text-gray-100 mb-8">
                Create new clauses and documents, or store your existing templates and Wansom will draft content to match.
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
                <div className="p-6 bg-gray-100">
                  <h3 className="font-bold text-gray-900 mb-4">
                    CONFIDENTIALITY AND USE OF
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
                      Continue Editing
                    </button>
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
              <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold mb-2 text-gray-900">Contract Review</h3>
              <p className="text-gray-600 text-sm">Redline contracts and catch risks</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold mb-2 text-gray-900">Deep Research</h3>
              <p className="text-gray-600 text-sm">Quick answers to complex legal questions</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                <MagnifyingGlassIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold mb-2 text-gray-900">Due Diligence</h3>
              <p className="text-gray-600 text-sm">Never be caught offguard during transactions</p>
            </div>
            
            <div className="text-center relative">
              <div className="absolute -top-2 -right-2 bg-[#355e66] text-white text-xs px-2 py-1 rounded">Beta</div>
              <div className="w-16 h-16 bg-[#d47b0f] rounded-lg flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold mb-2 text-gray-900">Case Preparation</h3>
              <p className="text-gray-600 text-sm">Predict possible case oucomes with AI role play</p>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default LegalDraftingPage;