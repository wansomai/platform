// components/VaultSection.tsx
'use client';
import React from 'react';

const VaultSection: React.FC = () => {
  return (
    <section className="pt-12 bg-primary overflow-hidden -mt-24" id="document-vault">
      <div className="section-container">
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-heading-2 text-white mb-6">
            Secure Document Vault
          </h2>
          <p className="text-body-large text-dim max-w-5xl mx-auto">
            Store, manage, and access your legal documents in one secure location with advanced organization and search capabilities.
          </p>
        </div>
        
        {/* Image Container with proper cropping */}
        <div className="vault-image-container max-w-6xl mx-auto">
          <img 
            src="/wansom-vault.png" 
            alt="Wansom AI Document Vault showing secure file management, folder organization, and document search capabilities for legal teams"
            className="w-full h-full object-cover object-top"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
        </div>
      </div>
    </section>
  );
};

export default VaultSection;