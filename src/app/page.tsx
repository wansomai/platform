'use client'
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Briefcase, 
  Search, 
  FileText, 
  ShieldCheck, 
  Users, 
  Clock,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState('case');


  // Handle navbar transparency on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
   
<Navbar/>
      {/* Hero Section */}
      <section className="pt-40 pb-20 bg-green-50">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-bold text-3xl md:text-6xl font-bold font-marcellus mb-4">AI Legal Worspace that Saves you time.</h1>
          <Sparkles className='w-10 h-10 text-green-600'/>
          <p className="text-lg md:text-xl max-w-3xl mx-auto mb-8 font-jost">
          Wakilichat automates routine legal tasks, so you can focus on high-impact work.
          </p>
          <button className="font-medium uppercase flex gap-1 items-center mx-auto text-white bg-[#005c4d] hover:bg-gray-800 rounded-md py-3 px-6 mb-10" onClick={() => window.location.href = '/login'}>
            Create a free account <Sparkles className='w-5 h-5 text-white'/>
          </button>
          <div className="flex justify-center items-center mb-8">
            <div className="flex items-center">
            <span className="uppercase tracking-wide font-semibold mr-6 text-gray-800 font-jost">TRUSTED BY</span>
              <div className="flex text-green-800 font-jost font-bold">
                +480 Law Firms 
              </div>
            </div>
            <div className="mx-6 h-6 border-r border-gray-300"></div>
            <div className="flex items-center">
              <span className="text-lg font-semibold mr-2">G2</span>
              <span className="text-lg font-semibold mr-2">4.8</span>
              <div className="flex text-yellow-400">
                {'★★★★★'}
              </div>
            </div>
          </div>
          
          {/* Contract Editor Preview */}
          <div className="relative max-w-7xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200">
       <img src='/images/dashboard.png'/>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center mb-12">
          <h2 className="text-2xl md:text-5xl font-bold mb-4 font-marcellus max-w-6xl mx-auto">Built By Leading Lawfirms and Advocates,<br/>Powering End to End Legal processes for teams</h2>
        </div>
        
        <div className="container mx-auto px-4 max-w-8xl">
          {/* features Tabs */}
          <div className="flex  justify-center mb-12">
            <div className="inline-flex flex-wrap space-x-4">
              <button 
                onClick={() => setActiveTab('case')}
                className={`px-4 py-2 text-sm font-medium flex items-center gap-2 ${activeTab === 'case' ? 'border-b-2 border-green-600' : 'text-gray-600'}`}
              >
                <Briefcase className="w-5 h-5" />
                Case Management
              </button>
              <button 
                onClick={() => setActiveTab('research')}
                className={`px-4 py-2 text-sm font-medium flex items-center gap-2 ${activeTab === 'research' ? 'border-b-2 border-green-600' : 'text-gray-600'}`}
              >
                <Search className="w-5 h-5" />
                Legal Research
              </button>
              <button 
                onClick={() => setActiveTab('documents')}
                className={`px-4 py-2 text-sm font-medium flex items-center gap-2 ${activeTab === 'documents' ? 'border-b-2 border-green-600' : 'text-gray-600'}`}
              >
                <FileText className="w-5 h-5" />
                Documents Drafting &amp; Review
              </button>
              <button 
                onClick={() => setActiveTab('compliance')}
                className={`px-4 py-2 text-sm font-medium flex items-center gap-2 ${activeTab === 'compliance' ? 'border-b-2 border-green-600' : 'text-gray-600'}`}
              >
                <ShieldCheck className="w-5 h-5" />
                Compliance Management
              </button>
              <button 
                onClick={() => setActiveTab('clients')}
                className={`px-4 py-2 text-sm font-medium flex items-center gap-2 ${activeTab === 'clients' ? 'border-b-2 border-green-600' : 'text-gray-600'}`}
              >
                <Users className="w-5 h-5" />
                Clients Management
              </button>
              <button 
                onClick={() => setActiveTab('billing')}
                className={`px-4 py-2 text-sm font-medium flex items-center gap-2 ${activeTab === 'billing' ? 'border-b-2 border-green-600' : 'text-gray-600'}`}
              >
                <Clock className="w-5 h-5" />
                Time &amp; Billing
              </button>
            </div>
          </div>
          
          {/* Team Content */}
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="md:basis-2/3">
              {activeTab === 'case' && (
                <img src="/case-management.png" alt="Case Management" className='w-full h-full object-contain rounded-lg shadow-lg' />
              )}
              {activeTab === 'research' && (
                <img src="/assistant.png" alt="Legal Research" className='w-full h-full object-contain rounded-lg shadow-lg' />
              )}
              {activeTab === 'documents' && (
                <img src="/documents.png" alt="Documents Management" className='w-full h-full object-contain rounded-lg shadow-lg' />
              )}
              {activeTab === 'compliance' && (
                <img src="/compliance-management.png" alt="Compliance Management" className='w-full h-full object-contain rounded-lg shadow-lg' />
              )}
              {activeTab === 'clients' && (
                <img src="/clients-management.png" alt="Client Management" className='w-full h-full object-contain rounded-lg shadow-lg' />
              )}
              {activeTab === 'billing' && (
                <img src="/time-billing.png" alt="Time and Billing" className='w-full h-full object-contain rounded-lg shadow-lg' />
              )}
            </div>
            <div className="text-left order-1 md:order-2">
              {activeTab === 'case' && (
                <>
                  <h3 className="text-2xl font-bold mb-4">Streamline Case Management</h3>
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-start">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 mr-3" />
                      <span>Centralize case information, documents, and communications in one secure platform</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 mr-3" />
                      <span>Track case progress, deadlines, and important milestones</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 mr-3" />
                      <span>Automate routine tasks and workflows to save time</span>
                    </li>
                  </ul>
                </>
              )}
              
              {activeTab === 'research' && (
                <>
                  <h3 className="text-2xl font-bold mb-4">AI-Powered Legal Research</h3>
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-start">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 mr-3" />
                      <span>Access comprehensive legal databases and precedents</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 mr-3" />
                      <span>Get AI-powered insights and recommendations</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 mr-3" />
                      <span>Stay updated with real-time legal updates and changes</span>
                    </li>
                  </ul>
                </>
              )}

              {activeTab === 'documents' && (
                <>
                  <h3 className="text-2xl font-bold mb-4">Smart and secure Document Management</h3>
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-start">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 mr-3" />
                      <span>Generate legal documents using AI-powered templates</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 mr-3" />
                      <span>Collaborate on documents in real-time with team members</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 mr-3" />
                      <span>Track document versions and maintain audit trails</span>
                    </li>
                  </ul>
                </>
              )}

              {activeTab === 'compliance' && (
                <>
                  <h3 className="text-2xl font-bold mb-4">Compliance Made Simple</h3>
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-start">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 mr-3" />
                      <span>Stay compliant with automated regulatory updates</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 mr-3" />
                      <span>Monitor and track compliance requirements</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 mr-3" />
                      <span>Generate compliance reports with one click</span>
                    </li>
                  </ul>
                </>
              )}

              {activeTab === 'clients' && (
                <>
                  <h3 className="text-2xl font-bold mb-4">Enhanced Client Management</h3>
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-start">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 mr-3" />
                      <span>Manage client information and communications in one place</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 mr-3" />
                      <span>Track client interactions and engagement history</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 mr-3" />
                      <span>Provide secure client portals for document sharing</span>
                    </li>
                  </ul>
                </>
              )}

              {activeTab === 'billing' && (
                <>
                  <h3 className="text-2xl font-bold mb-4">Efficient Time & Billing</h3>
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-start">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 mr-3" />
                      <span>Track billable hours with automated time tracking</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 mr-3" />
                      <span>Generate professional invoices automatically</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 mr-3" />
                      <span>Monitor financial performance with detailed reports</span>
                    </li>
                  </ul>
                </>
              )}

              <Link href="/learn-more" className="inline-flex items-center font-medium text-white bg-[#005c4d] hover:bg-green-900 rounded-md py-3 px-6">
                Get Started
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section className="py-20 bg-blue-50">
        <div className="container mx-auto px-4 text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Bring Your Favorite Tools with you</h2>
          <p className="text-lg max-w-3xl mx-auto mb-8">
            Integrate with your favorite tools to streamline your workflow and save time.
          </p>
        </div>
        
        <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex flex-wrap justify-center items-center gap-12 mb-10">
            {/* Gmail */}
            <svg className="w-10 h-10 text-red-500 hover:text-gray-600 transition-colors" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
            </svg>
            
            {/* Slack */}
            <svg className="w-10 h-10 text-purple-500 hover:text-gray-600 transition-colors" viewBox="0 0 24 24" fill="currentColor">
              <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
            </svg>
            
            {/* Google Drive */}
            <svg className="w-10 h-10 text-blue-500 hover:text-gray-600 transition-colors" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4.433 22.396l4-6.929H24l-4 6.929H4.433zm3.566-6.929l-3.998 6.929L0 15.467 7.785 1.98l3.999 6.931-3.785 6.556zm15.784-.375h-7.999L7.999 1.605h8.002l7.785 13.487h-.003z"/>
            </svg>
            
            {/* Microsoft Office */}
            <img src="/icons/microsoft-teams.svg" alt="Microsoft Office" className="w-10 h-10 text-green-500 hover:text-gray-600 transition-colors" />
            
            {/* Zendesk */}
            <img src="/icons/linkedin.svg" alt="Microsoft Office" className="w-10 h-10 text-green-500 hover:text-gray-600 transition-colors" />
            
            {/* Dropbox */}
            <svg className="w-10 h-10 text-blue-700 hover:text-gray-600 transition-colors" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 1.807L0 5.629l6 3.822 6.001-3.822L6 1.807zm12 0l-6 3.822 6 3.822 6-3.822-6-3.822zM0 13.274l6 3.822 6.001-3.822L6 9.452l-6 3.822zm18.001 0L12 9.452l-6 3.822 6.001 3.822 6-3.822zM6 18.371l6.001 3.822 6-3.822-6-3.822-6.001 3.822z"/>
            </svg>
            
            {/* salesforce */}
            <img src="/icons/salesforce.svg" alt="Microsoft Office" className="w-10 h-10 text-green-500 hover:text-gray-600 transition-colors" />
            
            {/* Workday */}
            <img src="/icons/microsoft-access.svg" alt="Microsoft Office" className="w-10 h-10 text-green-500 hover:text-gray-600 transition-colors" />
          </div>
          
          <div className="text-center">
            <Link href="/login" className="font-medium text-white bg-[#005c4d] border border-gray-300 rounded-md py-2 px-4">
              View all integrations
            </Link>
          </div>
        </div>
      </section>

      {/* Demo Booking Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-7xl">
        <h2 className=" text-3xl md:text-5xl font-bold mb-4 font-mercellius text-center">What your firm does<br/> best, amplified.</h2>
          <div className="">
            
            
            <div className=" rounded-lg">
              <h3 className="text-xl font-normal mb-6 font-jost text-gray-600 text-center">  We Provide Enterprise level security to ensure your firm and
                  Clients' data remain safe.On Premise installations are also
                  possible</h3>
              
              <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
              <div className="flex flex-col items-center gap-4 border-solid border-2 border-gray-200  rounded-lg p-10 ">
              <ShieldCheck className='w-10 h-10 text-green-500'/>
                <span className='text-gray-500 text-xl font-semibold'>SOC2 I</span>   

              </div>
              <div className="flex flex-col items-center gap-4 border-solid border-2 border-gray-200  rounded-lg p-10 text-green-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-lock-keyhole"><circle cx="12" cy="16" r="1"/><rect x="3" y="10" width="18" height="12" rx="2"/><path d="M7 10V7a5 5 0 0 1 10 0v3"/></svg>
                <span className='text-gray-500 text-xl font-semibold'>SOC2 II</span>   

              </div>
              <div className="flex flex-col items-center gap-4 border-solid border-2 border-gray-200  rounded-lg p-10 text-green-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-folder-lock"><rect width="8" height="5" x="14" y="17" rx="1"/><path d="M10 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v2.5"/><path d="M20 17v-2a2 2 0 1 0-4 0v2"/></svg>
                <span className='text-gray-500 text-xl font-semibold text-center'>Encrypted in Transit and at rest</span>   

              </div>
              <div className="flex flex-col items-center gap-4 border-solid border-2 border-gray-200  rounded-lg p-10 text-green-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-shield-user"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="M6.376 18.91a6 6 0 0 1 11.249.003"/><circle cx="12" cy="11" r="4"/></svg>
                <span className='text-gray-500 text-xl font-semibold text-center'>No Training on User Data</span>   

              </div>
              </div>
              
              
            </div>
          </div>
        </div>
      </section>


      {/* Footer */}
     <Footer/>  
    </>
  );
}
