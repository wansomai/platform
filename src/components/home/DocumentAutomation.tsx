"use client";
import React, { useState } from "react";
import { ArrowUpRight } from "lucide-react";

const DocumentAutomation = () => {
  const [activeTab, setActiveTab] = useState(2);

  const tabs = [
    {
      title: "Upload & Tag Documents",
      image: "/images/upload-document.png",
      alt: "document vault",
      description: "Select and upload documents,AI automaitcally analyses and tags them for easy organization and retrieval."
    },
    {
      title: "Review & Redline Contracts",
      image: "/images/redline-contract.png",
      alt: "redline contracts",
      description: "Get Deep insights from your documents in a unified chat interface and redline contracts with AI-powered suggestions."
    },
    {
      title: "Compare and Share Documents",
      image: "/images/legal-document-review.png",
      alt: "review legal documents",
      description: "Compare different versions of documents side by side and share securely with clients and colleagues."
    }
  ];

  return (
    <section className="section-spacing bg-white" id="document-automation">
      <div className="section-container pb-12">
        <h2 className="text-heading-2 mb-4 text-gray-900 text-center max-w-3xl mx-auto">
          Upload, Review and Redline Contracts with Automated Document Workflows
        </h2>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-12 pt-5">
          <div className="flex space-x-0 border-b border-gray-300">
            {tabs.map((tab, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={`px-8 py-4 font-medium transition-all relative ${
                  activeTab === index
                    ? "text-[#355e66] border-b-2 border-[#355e66]"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.title}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content - Flex Layout */}
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-12">
            <div className="flex-1 text-left order-2 lg:order-1">
              <h3 className="font-semibold text-2xl mb-4 text-gray-900">
                {tabs[activeTab].title}
              </h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                {tabs[activeTab].description}
              </p>
                   <button
                  className="text-sm font-medium uppercase flex gap-1 items-center  text-white bg-[#355e66] hover:bg-[#2a4d54] rounded-md py-3 px-6 my-5"
                  onClick={() => (window.location.href = "/login")}
                >
                  Get Started{" "}
                  <ArrowUpRight className="w-5 h-5 text-white" />
                </button>
            </div>
            <div className="flex-1 lg:basis-1/3 order-1 lg:order-2">
              <img
                src={tabs[activeTab].image}
                className="rounded-lg w-full h-auto"
                alt={tabs[activeTab].alt}
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DocumentAutomation;