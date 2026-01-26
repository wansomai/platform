"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ErrorAlert } from "@/components/ui/error-alert";

const DemoPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    accountType: "",
  });

  const { notify } = useNotifications();
  const router = useRouter();

  const partnerLogos = [
    { src: "/logos/1.png", alt: "CM Advocates" },
    { src: "/logos/2.png", alt: "Akoth Odipo Advocates" },
    { src: "/logos/7.png", alt: "Riskhouse International" },
    { src: "/logos/4.png", alt: "Netsheria" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name || !formData.email || !formData.accountType) {
      setError("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/submissions/demo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit demo request");
      }

      notify.success("Demo request submitted! We'll contact you within 24 hours.");

      // Reset form after successful submission
      setFormData({
        name: "",
        email: "",
        accountType: "",
      });

      // Optionally redirect to thank you page or calendly
      // router.push("/thank-you");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to submit demo request. Please try again.";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className=" min-h-screen bg-gray-100 flex items-center justify-center py-8">
      <div className="section-container">
      <div className="grid grid-cols-1 lg:grid-cols-2 rounded-3xl shadow-xl bg-white">
        {/* Left Side - Content */}
           <div
          className="relative bg-cover bg-center flex items-center justify-center"
          style={{
            backgroundImage: "url('/law-office.jpg')",
          }}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/20"></div>

          {/* Form Card */}
          <div className="relative z-10 w-full max-w-md bg-white lg:rounded-3xl lg:shadow-2xl p-8">
                {/* Logo */}
          <a href="/" className="mb-8 lg:mb-12 block lg:hidden">
           <Image src="/logo-lg.png" alt="wansom logo" width={200} height={100}  />
          </a>

            <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">
              Book a demo to join 9,000+ lawyers and growing.
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Fill out the form and we'll reach out in 24hrs or less
            </p>

            <ErrorAlert error={error} onDismiss={() => setError(null)} />

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name Field */}
              <div>
                <Label htmlFor="name" className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 block">
                  Your Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-12 rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
                  disabled={isSubmitting}
                  required
                />
              </div>

              {/* Email Field */}
              <div>
                <Label htmlFor="email" className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 block">
                  Your Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Your Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-12 rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
                  disabled={isSubmitting}
                  required
                />
              </div>

              {/* Account Type Field */}
              <div>
                <Label htmlFor="accountType" className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 block">
                  Select Account Type
                </Label>
                <Select
                  value={formData.accountType}
                  onValueChange={(value) => setFormData({ ...formData, accountType: value })}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="h-12 rounded-lg border-gray-300 focus:border-primary focus:ring-primary">
                    <SelectValue placeholder="Select Account Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="law-firm">Law Firm</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting || !formData.name || !formData.email || !formData.accountType}
                className="w-full h-12 bg-primary hover:bg-[#F18F01] text-white font-semibold rounded-lg text-base shadow-lg hover:shadow-xl transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Schedule Your Demo Today"
                )}
              </Button>
            </form>
          </div>
        </div>
      

        {/* Right Side - Form with Background Image */}
       <div className="flex flex-col justify-between px-8 pt-8 pb-16  bg-white">
          {/* Logo */}
          <a href="/" className="mb-8 lg:mb-12 hidden lg:block">
           <Image src="/logo-lg.png" alt="wansom logo" width={200} height={100}  />
          </a>

          {/* Main Content */}
          <div className="flex-1 flex flex-col justify-center max-w-2xl">
            <h1 className="text-heading-1 font-serif text-gray-900 mb-6 leading-tight">
              Better legal work <br/>starts here
            </h1>
            {/* <p className="text-2xl text-gray-600 mb-6">
              Work smarter. Waste Less. See how.
            </p> */}
            <p className="text-lg text-gray-600 leading-relaxed">
              Get a personalized walkthrough of the Wansom AI platform.
            </p>
          </div>

          {/* Stats Section */}
          <div className="mt-10 pt-8 border-t border-gray-200">      

            {/* Partner Logos */}
            <div className="mt-12">
              <PatnerLogoSection/>
            </div>
          </div>
        </div>
      </div></div>
    </div>
  );
};

export default DemoPage;

const PatnerLogoSection = () => {
  const partnerLogos = [
    { src: "/logos/1.png", alt: "CM Advocates" },
    { src: "/logos/2.png", alt: "Mbulo and Partners Legal Practisioners" },
    { src: "/logos/3.png", alt: "Cymbelle Attorneys" },
    { src: "/logos/4.png", alt: "Akoth Odipo Advocates" },
    { src: "/logos/5.png", alt: "Ooc Advocates" },
    { src: "/logos/6.png", alt: "Bellmac consulting" },
    { src: "/logos/7.png", alt: "Riskhouse International" },
    { src: "/logos/8.png", alt: "Netsheria International" },
    { src: "/logos/9.png", alt: "Barizi Data Privacy Services" }
  ];

  return (
    <section className="">
      <div className="relative overflow-hidden">
        <div className="flex animate-scroll whitespace-nowrap">
          {/* First set of logos */}
          <div className="flex items-center space-x-12 md:space-x-10 pr-12 md:pr-16">
            {partnerLogos.map((logo, index) => (
              <div key={index} className="flex-shrink-0 flex justify-center items-center min-w-[100px]">
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  width={100}
                  height={50}
                  className="h-12 md:h-12 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300 hover:scale-105"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
          
          {/* Duplicate set for seamless loop */}
                    <div className="flex items-center space-x-12 md:space-x-10 pr-12 md:pr-16">
            {partnerLogos.map((logo, index) => (
              <div key={index} className="flex-shrink-0 flex justify-center items-center min-w-[100px]">
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  width={100}
                  height={50}
                  className="h-12 md:h-12 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300 hover:scale-105"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        .animate-scroll {
          animation: scroll 35s linear infinite;
          width: max-content;
        }
        
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
};
