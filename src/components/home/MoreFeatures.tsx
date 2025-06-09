import { ArrowRight, FolderLock, Shield, ShieldCheck } from "lucide-react";

const MoreFeatures = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-heading-2 mb-4 text-gray-900">
         Built to the highest security standards
        </h2>
<p className="text-body-large text-gray-600 mb-12 max-w-3xl mx-auto">
         Wansom AI with enterprise-level security at its core, ensuring your firm's sensitive data remains confidential and protected.</p>
        <div className=" grid grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
              <FolderLock className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-bold mb-2 text-gray-900">Data Encrypted in Transit and at Rest</h3>
            <p className="text-gray-600 text-sm">
             End-to-end encryption protects your sensitive legal documents and communications.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-bold mb-2 text-gray-900">No AI Training on User Data</h3>
            <p className="text-gray-600 text-sm">
             Your confidential information stays private and is never used to train our AI models.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-bold mb-2 text-gray-900">On-premise Deployment Available</h3>
            <p className="text-gray-600 text-sm">
              Deploy Wansom AI within your own infrastructure for maximum security control.
            </p>
          </div>
        </div>
        <button
          className="mt-12 bg-[#d47b0f] hover:bg-[#355e66] text-white px-8 py-4 rounded-lg transition-colors"
          onClick={() => (window.location.href = "/login")}
        >
          Try Wansom AI For Free
          <ArrowRight className="inline-block ml-2 w-4 h-4" />
        </button>
      </div>
    </section>
  );
};

export default MoreFeatures;
