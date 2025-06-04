"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ShieldCheck, FolderLock, Shield, ExternalLink } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/hero";
import FeaturesSection from "@/components/home/features";
import VaultSection from "@/components/home/vault";
import CookieConsent, { Cookies } from "react-cookie-consent";

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle navbar transparency on scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <VaultSection />
        <SecuritySection />
        <IntegrationsSection />
      </main>
             <CookieConsent
  location="bottom"
  buttonText="Accept Cookies"
  cookieName="wansomCookies"
  style={{ background: "#2B373B" }}
  buttonStyle={{ color: "#ffffff", fontSize: "13px",backgroundColor:"#005c4d" }}
  expires={150}
>
 We use essential cookies to make our site function effectively. We’d like to set additional cookies to better understand site usage, enhance site improvements, and remember your settings. We also use cookies set by other sites to assist in delivering content from their services. View our

</CookieConsent>
      <Footer />
    </>
  );
}

// Security Section Component
function SecuritySection() {
  const securityFeatures = [
    {
      icon: FolderLock,
      title: "Data Encrypted in Transit and at Rest",
      description: "End-to-end encryption protects your sensitive legal documents and communications."
    },
    {
      icon: Shield,
      title: "No AI Training on User Data",
      description: "Your confidential information stays private and is never used to train our AI models."
    },
    {
      icon: ShieldCheck,
      title: "On-premise Deployment Available",
      description: "Deploy Wansom AI within your own infrastructure for maximum security control."
    }
  ];

  return (
    <section className=" bg-white section-spacing" id="security">
      <div className="section-container">
        <div className="flex flex-col md:flex-row  justify-center gap-8">
          <div className="md:basis-1/2 text-center md:text-left mb-8 md:mb-0">
            <h2 className="text-heading-2 text-gray-900 mb-4">
             Built to the highest security standards
            </h2>
            <p className="text-body-large text-gray-600 max-w-3xl mx-auto md:mx-0">
              Wansom AI is built with  enterprise-level security at its core, ensuring your firm's sensitive data remains confidential and protected.We adhere to the highest security standards, including SOC 2 Type II and ISO 27001 certifications. Wansom AI does not train on your data, ensuring its privacy and security.
            </p></div>
             
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
              {securityFeatures.map((feature, index) => (
                <div 
                  key={index}
                  className="flex flex-col gap-4 p-4 bg-primary rounded-lg"
                >
                  <div className="flex-shrink-0 flex items-center justify-center gap-3">
                    <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm w-fit h-fit flex items-center justify-center">
                      <feature.icon className="w-8 h-8 text-white" />
                    </div>
                     <h3 className="text-lg text-white mb-2">
                      {feature.title}
                    </h3>
                  </div>
                  <div className="text-center md:text-left">
                   
                    <p className="text-sm text-dim">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
        </div>
      </div>
    </section>
  );
}

// Integrations Section Component
function IntegrationsSection() {
  const integrations = [
    {
      name: "Gmail",
      icon: "M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z",
      color: "text-red-500"
    },
    {
      name: "Slack",
      icon: "M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z",
      color: "text-purple-500"
    },
    {
      name: "Google Drive",
      icon: "M4.433 22.396l4-6.929H24l-4 6.929H4.433zm3.566-6.929l-3.998 6.929L0 15.467 7.785 1.98l3.999 6.931-3.785 6.556zm15.784-.375h-7.999L7.999 1.605h8.002l7.785 13.487h-.003z",
      color: "text-blue-500"
    },
    {
      name: "Microsoft Teams",
      image: "/icons/microsoft-teams.svg",
      color: "text-blue-600"
    },
    {
      name: "LinkedIn",
      image: "/icons/linkedin.svg",
      color: "text-blue-700"
    },
    {
      name: "Dropbox",
      icon: "M6 1.807L0 5.629l6 3.822 6.001-3.822L6 1.807zm12 0l-6 3.822 6 3.822 6-3.822-6-3.822zM0 13.274l6 3.822 6.001-3.822L6 9.452l-6 3.822zm18.001 0L12 9.452l-6 3.822 6.001 3.822 6-3.822zM6 18.371l6.001 3.822 6-3.822-6-3.822-6.001 3.822z",
      color: "text-blue-700"
    },
    {
      name: "Salesforce",
      image: "/icons/salesforce.svg",
      color: "text-sky-500"
    },
    {
      name: "Microsoft Access",
      image: "/icons/microsoft-access.svg",
      color: "text-red-600"
    }
  ];

  return (
    <section className="section-spacing bg-gray-50" id="integrations">
      <div className="section-container">
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-heading-2 mb-4">
            Bring Your Favorite Tools with You
          </h2>
          <p className="text-body-large text-muted max-w-3xl mx-auto">
            Integrate with your favorite tools to streamline your workflow and save time.
          </p>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-8 mb-12">
          {integrations.map((integration, index) => (
            <div 
              key={index}
              className="flex flex-col items-center p-4 bg-white rounded-xl hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
            >
              {integration.icon ? (
                <svg
                  className={`w-10 h-10 ${integration.color} transition-colors duration-200`}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-label={integration.name}
                >
                  <path d={integration.icon} />
                </svg>
              ) : (
                <img
                  src={integration.image}
                  alt={integration.name}
                  className="w-10 h-10 object-contain transition-transform duration-200 hover:scale-110"
                />
              )}
              <span className="mt-2 text-caption text-center font-medium">
                {integration.name}
              </span>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link href="/login" className="btn-primary">
            View All Integrations
          </Link>
        </div>
      </div>
    </section>
  );
}