'use client'
import React from 'react'

const VaultSection = () => {
  return (
    <section className="py-20 bg-[#005c4d]" id="document-vault">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-5xl font-bold mb-4 font-marcellus max-w-5xl mx-auto text-white text-center">Secure Document Vault</h2>
        <p className="text-gray-100 text-center max-w-5xl mx-auto mb-12">
          Store, manage, and access your legal documents in one secure location.
        </p> 
        <div className="relative max-w-7xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200">
          <img src='/images/vault.png' alt="Wakili Chat Interface" className="w-full"/>
        </div>

      </div>
    </section>
  )
}

export default VaultSection