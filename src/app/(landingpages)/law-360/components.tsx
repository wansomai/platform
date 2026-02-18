'use client';

import Image from "next/image";
import BrandLogos from "@/components/home/Partnerlogos";
import HerroPattern from "@/components/layout/HeroPattern";
import Navbar from "@/components/layout/Navbar";
import { SquareArrowOutUpRight, ArrowUpRight } from "lucide-react";

const Law360Components = () => {
    return (    <div className="overflow-x-hidden">
      <Navbar />

      <main>
        <HeroSection />
        <FeaturesSection />
      </main>
        </div> );
}
 
export default Law360Components;

function HeroSection() {
  return (
    <section className=" pt-20 md:pt-28  px-5 bg-white  relative overflow-hidden">
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
              onClick={() => (window.location.href = "/register")}
              aria-label="Try law 360 for free - Start your free trial"
            >
              TRY Law 360{" "}
              <SquareArrowOutUpRight
                className="w-5 h-5 text-white"
                aria-hidden="true"
              />
            </button>
              <button
              className="text-sm font-medium uppercase flex gap-1 items-center  text-black bg-transparent border-black border  rounded-md py-3 px-6 mb-10 w-fit min-w-[130px]"
              onClick={() => (window.location.href = "/demo")}
              aria-label="Try Wansom AI for free - Start your free trial"
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
      <BrandLogos />
    </section>
  );
}

const FeaturesSection = () => {
  const features = [
    {
      title: "Work Smarter",
      description:
        "Automate routine legal tasks with AI so your team can focus on high-value work.",
      href: "/login",
      image: "/drafting-feature.webp",
    },
    {
      title: "Collaborate Better",
      description:
        "Organize projects,files into shared team workspaces for seamless collaboration.",
      href: "/login",
      image: "/wansom-dashboard.webp",
    },
    {
      title: "Get More Billable Hours",
      description:
        "Create Specialised AI associates to do quality work faster so you can bill more.",
      href: "/login",
      image: "/contract-negotiation.webp",
    },
  ];

  return (
    <section className="section-container ">
      <div className=" section-spacing">
        <h2 className="text-heading-2 mb-12 text-center text-gray-900">
          Safe. Flexible. Built for Legal Work.
        </h2>
        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative rounded-lg py-6 px-3 transition-all duration-300 space-y-3"
              onClick={() => (window.location.href = "/login")}
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
              <a
                href={feature.href}
                className="inline-flex gap-2 items-center justify-center  group-hover:text-amber-500 transition-all duration-300"
                aria-label={`Learn more about ${feature.title}`}
              >
                Learn More
                <ArrowUpRight className="w-5 h-5" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};