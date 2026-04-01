'use client';

import { useState, useEffect } from "react";
import Image from "next/image";
import BrandLogos from "@/components/home/Partnerlogos";
import HerroPattern from "@/components/layout/HeroPattern";
import Navbar from "@/components/layout/Navbar";
import { SquareArrowOutUpRight, ArrowUpRight } from "lucide-react";
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

        <CTASection onActivate={handleActivate} />
        <StatSection />
      </main>
      <Footer/>
      <ActivationModal open={modalOpen} onOpenChange={setModalOpen} />
        </div> );
}

export default Law360Components;

function HeroSection({ onActivate }: { onActivate: () => void }) {
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
            Legal intelligence in your inbox, <br/>all year round  powered by <br/> Wansom AI.
            </h1>

            <p className="text-lg md:text-xl max-w-3xl  mb-8  text-gray-600Book">
            Our AI sources,organizes and sends you with timely updates on the latest caselaw summaries,legal news, insights, and trends to keep you ahead in the ever-evolving legal landscape.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 md:gap-6">
            <button
              className="text-sm font-medium uppercase flex gap-1 items-center  text-white bg-black hover:bg-[#2a4d54] rounded-md py-3 px-6 md:mb-10 w-fit min-w-[130px]"
              onClick={onActivate}
              aria-label="Try Briefly by Wansom for free - Start your free trial"
            >
              TRY BRIEFLY{" "}
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
              <SquareArrowOutUpRight
                className="w-5 h-5 text-white"
                aria-hidden="true"
              />
            </button></div>
          </div>
        </div>
      </div>
      {/* <BrandLogos /> */}
    </section>
  );
}

const FeaturesSection = ({ onActivate }: { onActivate: () => void }) => {
  const features = [
    {
      title: "Laws & Monitoring",
      description:
        "Stay informed with real-time updates on legal news, caselaw summaries, and emerging trends tailored to your practice areas.",
      href: "/login",
      image: "/images/law-monitoring.jpg",
    },
    {
      title: "Legal Intelligence",
      description:
        "Make better decisions with AI-powered insights and expert analysis of legal developments, helping you stay ahead in the ever-evolving legal landscape.",
      href: "/login",
      image: "/images/legal-insights.jpg",
    },
    {
      title: "Compliance Tracking",
      description:
        "Never be caught off guard by regulatory changes. Our AI monitors and tracks compliance requirements for you",
      href: "/login",
      image: "/images/legal-intelligence.jpg",
    },
  ];

  return (
    <section className="section-container ">
      <div className=" section-spacing">
        <h2 className="text-heading-2 mb-12 text-center text-gray-900">
          Never Miss a Beat in the Legal World
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
                aria-label={`Get started with ${feature.title}`}
              >
                Get Started
                <ArrowUpRight className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const StatSection = () => {
    return (
        <section className="bg-gray-50 py-16">
        <div className="section-container mb-10">
            <h2 className="text-heading-2 mb-12 text-center text-gray-900">
            Trusted by Legal Professionals Worldwide
            </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                 {/* Stat 1 */}
            <div className="text-center">
              <h3 className="text-6xl lg:text-7xl font-serif text-gray-900 mb-4">
                3000+
              </h3>
              <p className="text-md text-gray-600">
                Daily Insights Delivered
              </p>
            </div>

            {/* Stat 2 */}
            <div className="text-center">
              <h3 className="text-6xl lg:text-7xl font-serif text-gray-900 mb-4">
                50+
              </h3>
              <p className="text-md text-gray-600">
                PARTNER FIRMS AND LEGAL ORGANIZATIONS
              </p>
            </div>

            {/* Stat 3 */}
            <div className="text-center">
              <h3 className="text-6xl lg:text-7xl font-serif text-gray-900 mb-4">
                97%
              </h3>
              <p className="text-md text-gray-600">
  Practice areas covered across multiple jurisdictions
              </p>
            </div>
          </div>
        </div>
        <BrandLogos />
      </section>
    );  
}

function CTASection({ onActivate }: { onActivate: () => void }) {
  return (
    <section className="section-spacing bg-white" id="legal-research">
      <div className="section-container flex flex-col-reverse lg:flex-row items-center">
        <div className=" lg:basis-1/2 mb-8 lg:mb-0 lg:pr-10">
          <h3 className="text-md font-light text-gray-600 mb-2">
            Your Legal AI companion
          </h3>
          <h2 className="text-heading-2 text-gray-900 mb-2">
           Ready to Start Receiving legal intelligence in your inbox?.
          </h2>
          <ul className="my-5">
            <li className="text-gray-600 mb-2 text-lg flex items-center gap-2">
              <SquareArrowOutUpRight className="w-5 h-5 text-gray-400" />
              Stay informed with real-time legal updates
            </li>
            <li className="text-gray-600 mb-2 text-lg flex items-center gap-2">
              <SquareArrowOutUpRight className="w-5 h-5 text-gray-400" />
                Make informed decisions with AI-powered insights
            </li>
            <li className="text-gray-600 mb-2 text-lg flex items-center gap-2">
              <SquareArrowOutUpRight className="w-5 h-5 text-gray-400" />
              Never miss critical legal developments again
            </li>
          </ul>
          <button
            className="text-sm font-medium uppercase flex gap-1 items-center  text-white bg-black hover:bg-[#2a4d54] rounded-md py-3 px-6 mb-10"
            onClick={onActivate}
            aria-label="Activate Briefly by Wansom - Start your subscription"
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