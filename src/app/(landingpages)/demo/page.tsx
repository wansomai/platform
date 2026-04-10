"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import Image from "next/image";
import { ErrorAlert } from "@/components/ui/error-alert";

type Step = "form" | "calendly" | "success";

const DemoPage = () => {
  const [step, setStep] = useState<Step>("form");
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    accountType: "",
    teamSize: "",
  });

  const submittedRef = useRef(false);

  // Load Calendly script and listen for booking confirmation
  useEffect(() => {
    if (step !== "calendly") return;

    const existingScript = document.getElementById("calendly-script");
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "calendly-script";
      script.src = "https://assets.calendly.com/assets/external/widget.js";
      script.async = true;
      document.head.appendChild(script);
    }

    const handleMessage = async (e: MessageEvent) => {
      if (
        e.origin === "https://calendly.com" &&
        e.data?.event === "calendly.event_scheduled" &&
        !submittedRef.current
      ) {
        submittedRef.current = true;
        setStep("success");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [step]);

  const handleFormNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name || !formData.email || !formData.accountType) {
      setError("Please fill in all fields");
      return;
    }
    if (formData.accountType === "law-firm" && !formData.teamSize) {
      setError("Please select the number of team members");
      return;
    }

    // Stage 1 — send inquiry email in the background, don't block the UI
    fetch("/api/submissions/demo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...formData, stage: "inquiry" }),
    }).catch(() => {/* non-blocking */});

    setStep("calendly");
  };


  const calendlyUrl = `https://calendly.com/wansomco/wansom-ai-for-teams?name=${encodeURIComponent(formData.name)}&email=${encodeURIComponent(formData.email)}&hide_gdpr_banner=1`;

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-8">
      <div className="section-container">
        <div className="grid grid-cols-1 lg:grid-cols-2 rounded-3xl shadow-xl bg-white">

          {/* Left Side */}
          <div
            className="relative bg-cover bg-center flex items-center justify-center"
            style={{ backgroundImage: "url('/law-office.jpg')" }}
          >
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/20 rounded-l-3xl" />

            {/* Card */}
            <div
              className={`relative z-10 w-full bg-white lg:rounded-3xl lg:shadow-2xl transition-all duration-300 ${
                step === "calendly" ? "max-w-2xl p-4" : "max-w-md p-8"
              }`}
            >
              {/* Logo (mobile only) */}
              <a href="/" className="mb-8 block lg:hidden">
                <Image src="/logo-lg.png" alt="wansom logo" width={200} height={100} />
              </a>

              {/* STEP 1 — Form */}
              {step === "form" && (
                <>
                  <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">
                    Book a demo to join 9,000+ lawyers and growing.
                  </h2>
                  <p className="text-sm text-gray-600 mb-6">
                    Fill out the form and pick a time that works for you.
                  </p>

                  <ErrorAlert error={error} onDismiss={() => setError(null)} />

                  <form onSubmit={handleFormNext} className="space-y-5">
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
                        required
                      />
                    </div>

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
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="accountType" className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 block">
                        Select Account Type
                      </Label>
                      <Select
                        value={formData.accountType}
                        onValueChange={(value) =>
                          setFormData({ ...formData, accountType: value, teamSize: value !== "law-firm" ? "" : formData.teamSize })
                        }
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

                    {formData.accountType === "law-firm" && (
                      <div>
                        <Label htmlFor="teamSize" className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 block">
                          Number of Team Members
                        </Label>
                        <Select
                          value={formData.teamSize}
                          onValueChange={(value) => setFormData({ ...formData, teamSize: value })}
                        >
                          <SelectTrigger className="h-12 rounded-lg border-gray-300 focus:border-primary focus:ring-primary">
                            <SelectValue placeholder="Select Team Size" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1-5">1-5 members</SelectItem>
                            <SelectItem value="6-10">6-10 members</SelectItem>
                            <SelectItem value="11-25">11-25 members</SelectItem>
                            <SelectItem value="26-50">26-50 members</SelectItem>
                            <SelectItem value="51-100">51-100 members</SelectItem>
                            <SelectItem value="100+">100+ members</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={
                        !formData.name ||
                        !formData.email ||
                        !formData.accountType ||
                        (formData.accountType === "law-firm" && !formData.teamSize)
                      }
                      className="w-full h-12 bg-primary hover:bg-[#F18F01] text-white font-semibold rounded-lg text-base shadow-lg hover:shadow-xl transition-all"
                    >
                      Next — Pick a Time
                    </Button>
                  </form>
                </>
              )}

              {/* STEP 2 — Calendly */}
              {step === "calendly" && (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <button
                      onClick={() => setStep("form")}
                      className="text-gray-500 hover:text-gray-800 transition-colors"
                      aria-label="Go back"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div>
                      <h2 className="text-xl font-serif font-bold text-gray-900">
                        Pick a time that works for you
                      </h2>
                      <p className="text-sm text-gray-500">
                        Booking as <span className="font-medium text-gray-700">{formData.email}</span>
                      </p>
                    </div>
                  </div>

                  <ErrorAlert error={error} onDismiss={() => setError(null)} />

                  <div
                    className="calendly-inline-widget"
                    data-url={calendlyUrl}
                    style={{ minWidth: "320px", height: "660px" }}
                  />
                </>
              )}

              {/* STEP 3 — Success */}
              {step === "success" && (
                <div className="flex flex-col items-center text-center py-8">
                  <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
                  <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">
                    You're all set!
                  </h2>
                  <p className="text-gray-600 mb-2">
                    Your demo is booked. A confirmation has been sent to{" "}
                    <span className="font-medium text-gray-800">{formData.email}</span>.
                  </p>
                  <p className="text-sm text-gray-500">
                    We look forward to showing you Wansom AI.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Side — Marketing content */}
          <div className="flex flex-col justify-between px-8 pt-8 pb-16 bg-white">
            <a href="/" className="mb-8 lg:mb-12 hidden lg:block">
              <Image src="/logo-lg.png" alt="wansom logo" width={200} height={100} />
            </a>

            <div className="flex-1 flex flex-col justify-center max-w-2xl">
              <h1 className="text-heading-1 font-serif text-gray-900 mb-6 leading-tight">
                Better legal work <br />starts here
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed">
                Get a personalized walkthrough of the Wansom AI platform.
              </p>
            </div>

            <div className="mt-10 pt-8 border-t border-gray-200">
              <div className="mt-12">
                <PatnerLogoSection />
              </div>
            </div>
          </div>

        </div>
      </div>
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
    { src: "/logos/9.png", alt: "Barizi Data Privacy Services" },
  ];

  return (
    <section>
      <div className="relative overflow-hidden">
        <div className="flex animate-scroll whitespace-nowrap">
          {[0, 1].map((set) => (
            <div key={set} className="flex items-center space-x-12 md:space-x-10 pr-12 md:pr-16">
              {partnerLogos.map((logo, index) => (
                <div key={index} className="flex-shrink-0 flex justify-center items-center min-w-[100px]">
                  <Image
                    src={logo.src}
                    alt={logo.alt}
                    width={100}
                    height={50}
                    className="h-12 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300 hover:scale-105"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
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
