'use client';

import { useState, useEffect } from "react";
import Image from "next/image";
import BrandLogos from "@/components/home/Partnerlogos";
import HerroPattern from "@/components/layout/HeroPattern";
import Navbar from "@/components/layout/Navbar";
import { SquareArrowOutUpRight, ArrowUpRight, Radar, ShieldCheck, Scale } from "lucide-react";
import RotatingGlobe from "@/components/law360/RotatingGlobe";
import Footer from "@/components/layout/Footer";
import ActivationModal from "@/components/law360/ActivationModal";

const Law360Components = () => {
    const [modalOpen, setModalOpen] = useState(false);
    const handleActivate = () => setModalOpen(true);

    // Auto-open modal after Google OAuth redirect to complete activation
    useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      if (params.get('activate') === '1' || params.get('ga') === '1') {
        setModalOpen(true);
        // Clean up the URL param without a page reload
        const url = new URL(window.location.href);
        url.searchParams.delete('activate');
        // Keep 'ga' param — the modal reads it to restore Google preferences
        window.history.replaceState({}, '', url.toString());
      }
    }, []);

    return (    <div className="overflow-x-hidden">
      <Navbar />

      <main>
        <HeroSection onActivate={handleActivate} />
        <FeaturesSection onActivate={handleActivate} />
        <UseCasesSection onActivate={handleActivate} />
         <StatSection />
        <CTASection onActivate={handleActivate} />
       
      </main>
      <Footer/>
      <ActivationModal open={modalOpen} onOpenChange={setModalOpen} />
        </div> );
}

export default Law360Components;

function HeroSection({ onActivate }: { onActivate: () => void }) {
  const signals = [
    { icon: Scale, label: "Court decisions" },
    { icon: ShieldCheck, label: "Regulatory risk" },
    { icon: Radar, label: "Market signals" },
  ];

  return (
    <section className=" pt-20 md:pt-28  px-5 bg-white  relative overflow-hidden  ">
      {/* SVG Background */}
     <HerroPattern />
      {/* Header positioned at top of hero container */}
      <div className="absolute top-0 left-0 right-0 z-20"></div>

      <div className="section-container mx-auto grid lg:grid-cols-1 gap-5 items-center my-10  relative z-10">
        {/* Left Side - Content */}
        <div className=" space-y-8">
          <div className="space-y-6 max-w-4xl">
            <h1 className=" text-heading-1 mb-4 text-black text-shadow-2xs font-bold font-serif">
             Legal intelligence <br/>for  businesses and legal teams.
            </h1>

            <p className="text-lg md:text-xl max-w-3xl  mb-8  text-gray-600Book">
            Briefly monitors courts, regulators, gazettes, legal news, and firm updates across your selected jurisdictions, then turns the signal into concise, cited intelligence your team can act on.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 md:gap-6">
            <button
              className="text-sm font-medium uppercase flex gap-1 items-center  text-white bg-black hover:bg-[#2a4d54] rounded-md py-3 px-6 md:mb-10 w-fit min-w-[130px]"
              onClick={onActivate}
              aria-label="Configure your Briefly legal intelligence monitor"
            >
              ACTIVATE BRIEFLY{" "}
              <SquareArrowOutUpRight
                className="w-5 h-5 text-white"
                aria-hidden="true"
              />
            </button>
              <button
              className="text-sm font-medium uppercase flex gap-1 items-center  text-black bg-transparent border-black border  rounded-md py-3 px-6 mb-10 w-fit min-w-[130px]"
              onClick={() => (window.location.href = "/demo")}
              aria-label="Schedule a demo with Briefly by Wansom"
            >
              SCHEDULE A DEMO{" "}
            
            </button></div>

            <div className="hidden lg:grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl pt-4 border-t border-gray-200">
          
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const FeaturesSection = ({ onActivate }: { onActivate: () => void }) => {
  const features = [
    {
      title: "Legal Monitoring",
      description:
        "Track courts, regulators, gazettes, legal news, and market-moving legal developments across the jurisdictions that matter to your team.",
      href: "/login",
      image: "/images/law-monitoring.jpg",
    },
    {
      title: "Risk Signals",
      description:
        "Spot developments that may affect contracts, employment, tax, litigation, data protection, finance, operations, or sector exposure.",
      href: "/login",
      image: "/images/legal-insights.jpg",
    },
    {
      title: "Executive Briefs",
      description:
        "Receive concise summaries with source links, business context, and the practical next question your legal or compliance team should ask.",
      href: "/login",
      image: "/images/legal-intelligence.jpg",
    },
  ];

  return (
    <section className="section-container ">
      <div className=" section-spacing">
        <h2 className="text-heading-2 mb-12 text-center text-gray-900">
          Turn Legal Noise Into Business Intelligence
        </h2>
        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative rounded-lg py-6 px-3 transition-all duration-300 space-y-3 cursor-pointer"
              onClick={onActivate}
            >
              <div className="mb-4">
                <Image
                  src={feature.image}
                  alt={feature.title}
                  width={600}
                  height={400}
                  className="rounded-lg object-cover "
                />
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-gray-900">
                {feature.title}
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed text-lg">
                {feature.description}
              </p>

              {/* Arrow Link */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onActivate(); }}
                className="inline-flex gap-2 items-center justify-center group-hover:text-amber-500 transition-all duration-300"
                aria-label={`Configure monitor for ${feature.title}`}
              >
                ACTIVATE BRIEFLY
                <ArrowUpRight className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const UseCasesSection = ({ onActivate }: { onActivate: () => void }) => {
  const [activeTab, setActiveTab] = useState(0);

  const useCases = [
    {
      title: "Law Firms",
      image: "/images/law-firm-boardroom.jpg",
      alt: "Law firm attorneys reviewing legal updates",
      description: "Give practice groups a shared view of new decisions, regulatory movement, and source-backed developments they can use in client alerts, advisory work, and matter strategy.",
    },
    {
      title: "Businesses & In-House Counsel",
      image: "/images/in-house-counsel.jpg",
      alt: "In-house counsel monitoring legal developments",
      description: "Monitor changes that could affect operations, contracts, employment, compliance, data, finance, or market entry before they become boardroom surprises.",
    },
    {
      title: "Legal Consultants",
      image: "/images/legal-insights.jpg",
      alt: "Legal consultant reviewing global legal intelligence",
      description: "Stay ready for cross-jurisdictional advisory work with concise legal intelligence organized by market, topic, and practical business relevance.",
    },
    {
      title: "Law Students & Academics",
      image: "/images/students-studying.jpg",
      alt: "Law students studying legal summaries",
      description: "Track landmark judgments, emerging policy issues, and comparative legal developments with summaries that make research faster to start.",
    },
  ];

  return (
    <section className="section-spacing bg-white" id="use-cases">
      <div className="section-container pb-12">
        <div className="text-center max-w-3xl mx-auto mb-4">
          <h2 className="text-heading-2 mb-4 text-gray-900">Who Benefits from Briefly?</h2>
          <p className="text-lg text-gray-600">
            Whether you are advising clients, managing compliance, or watching legal exposure across markets, Briefly gives your team a focused intelligence layer.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-12 pt-5">
          <div className="flex space-x-0 border-b border-gray-300">
            {useCases.map((tab, index) => (
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

        {/* Tab Content */}
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-10">
            <div className="text-left lg:basis-1/2 max-w-lg">
              <p className="text-lg text-gray-600 leading-relaxed">
                {useCases[activeTab].description}
              </p>
              <button
                className="text-sm font-medium uppercase flex gap-1 items-center text-white bg-black hover:bg-amber-500 rounded-md py-3 px-6 my-5"
                onClick={onActivate}
                aria-label={`Activate Briefly for ${useCases[activeTab].title}`}
              >
                Activate Briefly
                <ArrowUpRight className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="flex-1 lg:basis-1/2 order-1 lg:order-2">
              <Image
                src={useCases[activeTab].image}
                width={800}
                height={600}
                className="rounded-lg w-full h-auto"
                alt={useCases[activeTab].alt}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const StatSection = () => {
  const stats = [
    {
      label: "Sources monitored",
      description: "Briefly watches courts, regulators, gazettes, legal news, and law-firm updates so your team starts from signal instead of search.",
      value: "4+",
    },
    {
      label: "Business workflows",
      description: "Built for legal, compliance, leadership, and advisory teams that need practical context instead of another stream of headlines.",
      value: "3",
    },
    {
      label: "Watch areas",
      description: "Configure your monitor around the risks and practice areas that matter to your organization, from litigation to employment and finance.",
      value: "Custom",
    },
    {
      label: "Jurisdictions",
      description: "Receive jurisdiction-specific legal intelligence tailored to your markets, with coverage spanning East, West, and Southern Africa.",
      value: "20+",
    },
  ];

  return (
    <section className="bg-white py-16">
      <div className="section-container">
        <div className="mb-10">

          <h2 className="text-4xl md:text-5xl font-serif text-gray-900 leading-tight">
           A monitoring layer <br /> for legal and business risk
          </h2>
        </div>

        <div className="border-t border-gray-200">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="grid grid-cols-12 gap-6 md:gap-10 py-8 md:py-10 border-b border-gray-200 items-center"
            >
              <div className="col-span-12 md:col-span-3">
                <span className="text-sm md:text-base font-semibold text-gray-800">
                  {stat.label}
                </span>
              </div>
              <div className="col-span-12 md:col-span-5">
                <p className="text-sm md:text-base text-gray-500 leading-relaxed">
                  {stat.description}
                </p>
              </div>
              <div className="col-span-12 md:col-span-4 md:text-right">
                <span className="text-5xl md:text-6xl lg:text-7xl font-light text-secondary">
                  {stat.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-12">
        <BrandLogos />
      </div>
    </section>
  );
}

function CTASection({ onActivate }: { onActivate: () => void }) {
  return (
    <section className="section-spacing bg-white" id="legal-research">
      <div className="section-container flex flex-col-reverse lg:flex-row items-center">
        <div className=" lg:basis-1/2 mb-8 lg:mb-0 lg:pr-10">
          <h3 className="text-md font-light text-gray-600 mb-2">
            Your legal intelligence layer
          </h3>
          <h2 className="text-heading-2 text-gray-900 mb-2">
           Ready to turn legal change into a business advantage?
          </h2>
          <ul className="my-5">
            <li className="text-gray-600 mb-2 text-lg flex items-center gap-2">
              <SquareArrowOutUpRight className="w-5 h-5 text-gray-400" />
              Monitor legal and regulatory movement across your markets
            </li>
            <li className="text-gray-600 mb-2 text-lg flex items-center gap-2">
              <SquareArrowOutUpRight className="w-5 h-5 text-gray-400" />
              Give teams concise briefs with source links and business context
            </li>
            <li className="text-gray-600 mb-2 text-lg flex items-center gap-2">
              <SquareArrowOutUpRight className="w-5 h-5 text-gray-400" />
              Configure watch areas for legal, compliance, and leadership priorities
            </li>
          </ul>
          <button
            className="text-sm font-medium uppercase flex gap-1 items-center  text-white bg-black hover:bg-[#2a4d54] rounded-md py-3 px-6 mb-10"
            onClick={onActivate}
            aria-label="Activate Briefly by Wansom legal intelligence monitor"
          >
            Activate Briefly
            <SquareArrowOutUpRight
              className="w-5 h-5 text-white"
              aria-hidden="true"
            />
          </button>
        </div>
        {/* rotating globe section*/}
        <div className="lg:basis-1/2 flex items-center justify-center">
          <RotatingGlobe />
        </div>
      </div>
    </section>
  );
}
