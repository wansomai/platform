
'use client'
import React, { useState } from 'react';
import { 
  FileText, 
  CheckCircle, 
  Play,
  ArrowRight,
  BookOpen,
  ArrowUpRight,
} from 'lucide-react';

// Import existing components
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import VaultSection from '@/components/home/vault';

const LegalDraftingPage = () => {
  const [formData, setFormData] = useState({
    jurisdiction: 'London, United Kingdom',
    customer: 'New customer',
    fees: '$1000',
    paymentTerms: 'Monthly'
  });


  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-24 md:pt-20 pl-5 lg:pl-20 bg-[#355e66] relative overflow-hidden">
        <div className="absolute "></div>
        <div className="container mx-auto px-4 z-10 relative flex flex-col lg:flex-row items-center lg:items-start justify-between space-y-5 lg:space-y-0">
          <div className=" text-white lg:basis-1/2">      
            <h1 className="text-heading-2 mb-4 text-white text-shadow-2xs max-w-2xl">
              Draft Correct Legally formatted Documents and Clauses
              quickly with AI
            </h1>
             <p className="text-lg md:text-xl max-w-3xl mx-auto mb-8  text-[#f3f4f4]">
                 Use Wansom's legally-trained AI to draft and redline faster than ever — Select from our professional template library or start from scratch and refine with AI.
                </p>
            
            <button className="bg-[#d47b0f] hover:bg-black text-white px-5 py-2 rounded-lg font-semibold transition-colors mb-12" onClick={() => window.location.href = '/login'}>
              Start Drafting Now <ArrowUpRight className="w-6 h-6 inline-block ml-2" />
            </button>
          </div>

          {/* Hero Demo Interface */}          
            <div className="bg-[#355e66]  rounded-lg pb-4 px-4 relative overflow-hidden  md:min-w-[500px] w-full lg:basis-1/2">
                 <div className="bg-white rounded-xl shadow-2xl overflow-hidden lg:w-[75%]">
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
          <div className="text-start lg:text-cneter mb-16 max-w-3xl mx-auto">
            <h2 className="text-heading-2 mb-4 text-center">
              Automate documents, save time, and make clients happy — all in a unified workspace
            </h2>
          </div>

         <div className="max-w-6xl mx-auto">
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-5 items-center'>
          
    <div className=''>

    <h3 className="text-lg font-semibold mb-6 text-gray-900 text-center">Generate Drafts Instantly</h3>
<p className='text-body text-center'>Wansom's legal template library of professional advocate reviewed documents allow you to accurately and reliably draft complex documents that are ready to go.</p>
            </div>
          
            <div className=''>

    <h3 className="text-lg font-semibold mb-6 text-gray-900 text-center">Smarter Redlining</h3>
<p className='text-body text-center'> Wansom learns from your writing style, prior documents and guidelines to instantly mark up entire agreements according to your set instructions.</p>
            </div>
        
  <div className=''>

    <h3 className="text-lg font-semibold mb-6 text-gray-900 text-center">Revise With Precision</h3>
<p className='text-body text-center'>Wansom AI helps you rewrite claues, format entire documents and insert rules all from a simple chat interface. Download in Word document format(.DOCX) once ready</p>
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
              <h2 className="text-heading-2 mb-6 text-white">
              Comprehensive Legal Template Library
              </h2>
              <p className="text-xl text-gray-100 mb-8">
              Start from a professionally drafted legal template and customize it to your needs with Wansom's AI-powered drafting tools.
              </p>
              
              <button className="bg-[#d47b0f] hover:bg-[#b8690c] text-white px-5 py-2 rounded-lg font-semibold transition-colors"  onClick={() => (window.location.href = "/login")}>
                Explore Legal templates <ArrowUpRight className="w-6 h-6 inline-block ml-2" />
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
  <VaultSection/>
      <Footer />
    </div>
  );
};

export default LegalDraftingPage;