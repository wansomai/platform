import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Zap, ArrowRight } from 'lucide-react';

const CreativeIntegrationsSection = () => {
  const [currentVariant, setCurrentVariant] = useState(0);
  const [floatingIndex, setFloatingIndex] = useState(0);

  const integrations = [
    {
      name: "Gmail",
      icon: "M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z",
      color: "text-red-500",
      category: "Communication"
    },
    {
      name: "Slack",
      icon: "M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z",
      color: "text-purple-500",
      category: "Communication"
    },
    {
      name: "Google Drive",
      icon: "M4.433 22.396l4-6.929H24l-4 6.929H4.433zm3.566-6.929l-3.998 6.929L0 15.467 7.785 1.98l3.999 6.931-3.785 6.556zm15.784-.375h-7.999L7.999 1.605h8.002l7.785 13.487h-.003z",
      color: "text-blue-500",
      category: "Storage"
    },
    {
      name: "Microsoft Teams",
      icon: "M24 12c0 6.627-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0s12 5.373 12 12zM12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 2c4.411 0 8 3.589 8 8s-3.589 8-8 8-8-3.589-8-8 3.589-8 8-8z",
      color: "text-blue-600",
      category: "Communication"
    },
    {
      name: "LinkedIn",
      icon: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
      color: "text-blue-700",
      category: "Business"
    },
    {
      name: "Dropbox",
      icon: "M6 1.807L0 5.629l6 3.822 6.001-3.822L6 1.807zm12 0l-6 3.822 6 3.822 6-3.822-6-3.822zM0 13.274l6 3.822 6.001-3.822L6 9.452l-6 3.822zm18.001 0L12 9.452l-6 3.822 6.001 3.822 6-3.822zM6 18.371l6.001 3.822 6-3.822-6-3.822-6.001 3.822z",
      color: "text-blue-700",
      category: "Storage"
    },

  ];


  // Floating animation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setFloatingIndex(prev => (prev + 1) % integrations.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Variant 3: Morphing Grid
  const MorphingGrid = () => (
    <div className="relative">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {integrations.map((integration, index) => {
          const delay = index * 100;
          return (
            <div
              key={index}
              className="group relative overflow-hidden"
              style={{ animationDelay: `${delay}ms` }}
            >
              <div className="w-full aspect-square bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 flex flex-col items-center justify-center p-4 hover:shadow-xl transition-all duration-500 hover:scale-105 hover:rotate-3 hover:border-[#355e66]">
                <div className="w-12 h-12 mb-3 relative">
                  <svg
                    className={`w-full h-full ${integration.color} transition-all duration-300 group-hover:scale-110`}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d={integration.icon} />
                  </svg>
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent to-[#355e66]/10 opacity-0 group-hover:opacity-30 transition-opacity duration-300 rounded-lg"></div>
                </div>
                <span className="text-xs font-medium text-gray-700 text-center leading-tight group-hover:text-[#355e66] transition-colors duration-300">
                  {integration.name}
                </span>
              </div>
              
              {/* Morphing background effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#355e66] to-[#005c4d] opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-2xl"></div>
            </div>
          );
        })}
      </div>
    </div>
  );

 

  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-heading-2 text-black font-bold mb-4">
            Bring Your Favorite Tools with You
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Integrate with your favorite tools to streamline your workflow and save time.
          </p>

        </div>

        <MorphingGrid />

      </div>
    </section>
  );
};

export default CreativeIntegrationsSection;