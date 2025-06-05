import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Brain, CheckCircle, FileText, Search, Sparkles } from "lucide-react";

const MoreFeatures = () => {
    return (   
    
     <section className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-heading-2 mb-12 text-gray-900">More features to explore</h2>
          
          <div className=" grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto">
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
      </section>);
}
 
export default MoreFeatures;