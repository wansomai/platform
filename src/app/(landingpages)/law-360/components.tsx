'use client';

import BrandLogos from "@/components/home/Partnerlogos";
import HerroPattern from "@/components/layout/HeroPattern";
import Navbar from "@/components/layout/Navbar";
import { SquareArrowOutUpRight } from "lucide-react";

const Law360Components = () => {
    return (    <div className="overflow-x-hidden">
      <Navbar />

      <main>
        <HeroSection />
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