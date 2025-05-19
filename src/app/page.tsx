"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/hero";
import FeaturesSection from "@/components/home/features";
import VaultSection from "@/components/home/vault";
export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState("case");

  // Handle navbar transparency on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <VaultSection />

      {/* Security Section */}
      <section className="py-20 bg-white" id="security">
        <div className="container mx-auto px-4 max-w-8xl">
          <div className=" bg-[url(/meeting.jpg)] bg-blend-multiply bg-cover bg-center bg-[#355e66] rounded-lg p-8">
            <h2 className=" text-3xl md:text-4xl font-bold mb-4 text-center text-white">
              What your firm does best, amplified.
            </h2>
            <h3 className="text-xl font-normal mb-6 font-jost text-white text-center">
              {" "}
              We Provide Enterprise level security to ensure your firm and
              Clients' data remain safe.
            </h3>
            <div className="flex gap-4 justify-center items-center flex-wrap">
         
                <div className="flex  items-center gap-4 rounded-lg p-5 text-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    className="lucide lucide-folder-lock"
                  >
                    <rect width="8" height="5" x="14" y="17" rx="1" />
                    <path d="M10 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v2.5" />
                    <path d="M20 17v-2a2 2 0 1 0-4 0v2" />
                  </svg>
                  <span className="text-xl font-semibold text-center">
                    Data Encrypted in Transit and at rest
                  </span>
                </div>
                <div className="flex  items-center gap-4   rounded-lg p-5 text-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    className="lucide lucide-shield-user"
                  >
                    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                    <path d="M6.376 18.91a6 6 0 0 1 11.249.003" />
                    <circle cx="12" cy="11" r="4" />
                  </svg>
                  <span className=" text-xl font-semibold text-center">
                    No Training on User Data
                  </span>
                </div>
                <div className="flex  items-center gap-4   rounded-lg p-5 text-white ">
                  <ShieldCheck className="w-10 h-10" />
                  <span className=" text-xl font-semibold">
                   On-premise deployment available
                  </span>
                </div>

            </div>
            <Link href={'/demo'} className="font-medium uppercase flex gap-1 items-center mx-auto text-white bg-transparent border-2 border-solid border-white rounded-md py-3 px-6 w-fit">Book A Demo <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
</svg>
</Link>
          </div>
        </div>
      </section>
      {/* Integrations Section */}
      <section className="py-20 bg-gray-100" id="integrations">
        <div className="container mx-auto px-4 text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            Bring Your Favorite Tools with you
          </h2>
          <p className="text-lg max-w-3xl mx-auto mb-8">
            Integrate with your favorite tools to streamline your workflow and
            save time.
          </p>
        </div>

        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex flex-wrap justify-center items-center gap-12 mb-10">
            {/* Gmail */}
            <svg
              className="w-10 h-10 text-red-500 hover:text-gray-600 transition-colors"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
            </svg>

            {/* Slack */}
            <svg
              className="w-10 h-10 text-purple-500 hover:text-gray-600 transition-colors"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
            </svg>

            {/* Google Drive */}
            <svg
              className="w-10 h-10 text-blue-500 hover:text-gray-600 transition-colors"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M4.433 22.396l4-6.929H24l-4 6.929H4.433zm3.566-6.929l-3.998 6.929L0 15.467 7.785 1.98l3.999 6.931-3.785 6.556zm15.784-.375h-7.999L7.999 1.605h8.002l7.785 13.487h-.003z" />
            </svg>

            {/* Microsoft Office */}
            <img
              src="/icons/microsoft-teams.svg"
              alt="Microsoft Office"
              className="w-10 h-10 text-green-500 hover:text-gray-600 transition-colors"
            />

            {/* Zendesk */}
            <img
              src="/icons/linkedin.svg"
              alt="Microsoft Office"
              className="w-10 h-10 text-green-500 hover:text-gray-600 transition-colors"
            />

            {/* Dropbox */}
            <svg
              className="w-10 h-10 text-blue-700 hover:text-gray-600 transition-colors"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M6 1.807L0 5.629l6 3.822 6.001-3.822L6 1.807zm12 0l-6 3.822 6 3.822 6-3.822-6-3.822zM0 13.274l6 3.822 6.001-3.822L6 9.452l-6 3.822zm18.001 0L12 9.452l-6 3.822 6.001 3.822 6-3.822zM6 18.371l6.001 3.822 6-3.822-6-3.822-6.001 3.822z" />
            </svg>

            {/* salesforce */}
            <img
              src="/icons/salesforce.svg"
              alt="Microsoft Office"
              className="w-10 h-10 text-green-500 hover:text-gray-600 transition-colors"
            />

            {/* Workday */}
            <img
              src="/icons/microsoft-access.svg"
              alt="Microsoft Office"
              className="w-10 h-10 text-green-500 hover:text-gray-600 transition-colors"
            />
          </div>

          <div className="text-center">
            <Link
              href="/login"
              className="font-medium text-white bg-primary border border-gray-300 rounded-md py-2 px-4"
            >
              View all integrations
            </Link>
          </div>
        </div>
      </section>

      {/* <PricingSection/> */}
      {/* Footer */}
      <Footer />
    </>
  );
}
