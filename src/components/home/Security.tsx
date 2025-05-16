import { Activity, PieChart, FileText, Sparkles, Atom } from 'lucide-react';
 const SecuritySection = () => {
  return (
    <div className=" px-4 py-12 bg-primary ">
      {/* Main section with two columns on desktop, stacked on mobile */}
      <div className="flex flex-col lg:flex-row gap-8 container mx-auto ">
        {/* Left column - heading and ratings */}
        <div className="lg:w-1/2">
             <h2 className='text-2xl md:text-4xl font-bold mb-4 text-white max-w-5xl mx-auto text-start'>
           Protecting Client confidentiality. Built for collaboration 
          </h2>
          <p className='text-dim mb-6 text-lg'>
            AI is helping global legal teams achieve cost savings, increase productivity, and manage complex processes more effectively. Wansom AI  provides a secure, collaborative workspace powered by custom legal AI models that integrate directly into your firm’s workflows.<br/>
 Whether your goal is to streamline operations, improve legal outcomes, or handle complex matters, we ensure AI delivers measurable value for your practice and your clients
          </p>
          
        <img src='/wansom-features.png' alt="wansom AI Chat Interface" className="w-[140%] h-auto mx-auto rounded-lg  mb-8"/>
        </div>
        
        {/* Right column - feature cards */}
        <div className="lg:w-1/2">
          <div className="space-y-6">
            {/* Publishing Card */}
            <div className="flex gap-4 p-4">
              <div className="mt-1">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Sparkles className="w-6 h-6 text-secondary" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Custom AI Models</h3>
                <p className="text-gray-100 text-lg">
                 Domain specific AI models for the legal industry. Fine-tuned by jurisdiction, case types, and legal specific document formats
                </p>
              </div>
            </div>
            
            {/* Analytics Card */}
            <div className="flex gap-4 p-4 ">
              <div className="mt-1">
                <div className="p-2 bg-green-50 rounded-lg">
                  <PieChart className="w-6 h-6 text-secondary" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Collaborative Workspace</h3>
                <p className="text-gray-100 text-lg">
                  Enable real-time collaboration across teams handling shared legal matters.
                </p>
              </div>
            </div>
            
            {/* Engagement Card */}
            <div className="flex gap-4 p-4">
              <div className="mt-1">
                <div className="p-2 bg-green-50 rounded-lg">
                  <FileText className="w-6 h-6 text-secondary" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Document Intelligence</h3>
                <p className="text-gray-100 text-lg">
                  Extract insights, summarize, and review large documents in minutes with AI precision.
                </p>
              </div>
            </div>
            <div className="flex gap-4 p-4">
              <div className="mt-1">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Activity className="w-6 h-6 text-secondary" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Agentic Workflows</h3>
                <p className="text-gray-100 text-lg">
                  Streamline processes like, Drafting, compliance reporting, Research, onboarding, and more.
                </p>
              </div>
            </div>

              <div className="flex gap-4 p-4">
              <div className="mt-1">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Atom className="w-6 h-6 text-secondary" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Deep Research</h3>
                <p className="text-gray-100 text-lg">
                  Enable web search and supplement your enterprise data with real-time legal insights and recommendations to help you make more informed decisions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecuritySection;