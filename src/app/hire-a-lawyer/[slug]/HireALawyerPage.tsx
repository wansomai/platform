"use client";

import React, { useState } from "react";
import {
  MessageSquare,
  Phone,
  CheckCircle,
  Users,
  DollarSign,
  Shield,
  Clock
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FaqSection from "@/components/home/faqs";
import PractiseAreasComponent from "@/components/home/practiseareas";
interface Props {
  location?: string
  practiceArea?: string
  faq?: any
  areas?: any[]
}

const HireALawyerPage = ({
  location,
  practiceArea,
  faq,
  areas
}: Props) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({
    success: false,
    error: false,
    message: "",
  });

  const handleChange = (e: { target: { id: any; value: any } }) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [id]: value,
    }));
  };

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ success: false, error: false, message: "" });

    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to submit form");
      }

      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        message: "",
      });

      setSubmitStatus({
        success: true,
        error: false,
        message:
          "Your request has been sent successfully! An attorney will contact you shortly.",
      });
    } catch (error) {
      console.error("Form submission error:", error);
      setSubmitStatus({
        success: false,
        error: true,
        message:
          "There was an error submitting your request. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar/> 
      {/* Hero Section */}
      <section
      className=" pt-24 md:pt-20 pl-5 lg:pl-20 bg-[#355e66] relative overflow-hidden"
    >
     
        <div className="grid lg:grid-cols-2 gap-5 items-center">
          {/* Left Side - Content */}
          <div className="text-left space-y-8">
            <div className="space-y-6">
             <h1 className="text-4xl font-semibold text-white">
      Get expert advice from expert {practiceArea} lawyers in {location ?? "your area"}
  </h1>
  <p className="text-xl text-gray-200">
    {`Our ${practiceArea} attorneys in ${location} are ready to help. Receive personalized legal advice within 24 working hours.`} 
  </p>

            </div>

        
          </div>

          {/* Right Side - Form */}
          <div>
            <img src="/law-office.jpg"/>

          </div>
          
        
      </div>
    </section>
  {/* Statistics Section */}
      <section className="py-16 bg-white" >
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2
                className="text-4xl font-semibold mb-6"
                style={{ color: "#1f2937" }}
              >
                Over 300k legal questions answered...
              </h2>
              <p className="text-lg mb-8" style={{ color: "#6b7280" }}>
                Our network of experienced {practiceArea} attorneys has helped hundreds of
                thousands of people get the legal guidance they need. From
                simple questions to complex legal matters, we're here to help.
              </p>

              <div className=" flex flex-col md:flex-row items-start md:items-center gap-5">
            {[
          
              {
                icon: Clock,
                title: "Fast and easy",
                description:
                  "Get answers in as little as 15 minutes. Our streamlined process connects you with qualified attorneys quickly and efficiently.",
              },
              {
                icon: Shield,
                title: "Private and safe",
                description:
                  "Your information is protected with bank-level security. All communications with attorneys are confidential and secure.",
              },
              {
                icon: DollarSign,
                title: "Affordable and simple",
                description:
                  "Get flat-rate pricing with no hidden fees. Know exactly what you'll pay before you commit to getting legal help.",
              },
            ].map((feature, index) => (
              <div key={index} className="flex  items-start lg:items-center space-x-1">
                <div className="">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "#355e66" }}
                  >
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <h3
                    className="text-md font-semibold"
                    style={{ color: "#1f2937" }}
                  >
                    {feature.title}
                  </h3>
                  <p style={{ color: "#6b7280" }} className="block lg:hidden">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
             
            </div>
            <div id="ask-a-lawyer" className="lg:ml-20 lg:-mt-10 ">
              <div className="bg-primary rounded-t-2xl shadow-2xl p-4 max-w-3xl w-full "> 
                <h2 className="text-xl font-semibold text-white  text-center">
                 Ask a Lawyer
                </h2>
              
              
              </div>
             <div className="bg-white rounded-b-2xl shadow-2xl p-8 max-w-3xl w-full mx-auto ">
         
            {submitStatus.success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 text-sm">{submitStatus.message}</p>
              </div>
            )}

            {submitStatus.error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{submitStatus.message}</p>
              </div>
            )}

            <div className="space-y-4">
              
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Your Email*
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  placeholder="Enter your email address"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Legal Question*
                </label>
                <textarea
                  id="message"
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none"
                  required
                  rows={3}
                  placeholder="Describe your legal question or situation..."
                />
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !formData.email || !formData.message}
                className={`w-full font-semibold text-white rounded-lg py-4 px-6 transition-all duration-200 transform hover:scale-105 ${
                  isSubmitting || !formData.email || !formData.message
                    ? "bg-gray-400 cursor-not-allowed opacity-60"
                    : "bg-orange-500 hover:bg-orange-600 shadow-lg hover:shadow-xl"
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Sending...
                  </span>
                ) : (
                  "Get your answer"
                )}
              </button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500 leading-relaxed">
                By submitting this form, you agree to receive communications
                from our legal professionals. Your information is secure and
                confidential.
              </p>
            </div>
          </div>
            </div>
            
          </div>
        </div>
      </section>
      {/* How It Works Section */}
      <section className="py-16 bg-[#f3f4f4]">
        <div className="container mx-auto px-4 max-w-7xl">
          <h2
            className="text-4xl font-bold mb-5 text-center lg:max-w-4xl mx-auto"
            style={{ color: "#1f2937" }}
          >
            How it works
          </h2>
          <p className="text-lg text-center mb-10" style={{ color: "#6b7280" }}>
            Ask any legal or tax question, or have a network attorney review
            your document.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            <div className="flex flex-col items-center text-center">
              <div className="mb-6">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: "#355e66" }}
                >
                  <MessageSquare className="w-8 h-8 text-white" />
                </div>
              </div>
              <p className="text-lg" style={{ color: "#1f2937" }}>
                Ask your detailed legal or tax question to send to an attorney.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="mb-6">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: "#355e66" }}
                >
                  <Phone className="w-8 h-8 text-white" />
                </div>
              </div>
              <p className="text-lg" style={{ color: "#1f2937" }}>
                Get legal advice online or by phone from a lawyer that
                specializes in your issue.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="mb-6">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: "#355e66" }}
                >
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
              </div>
              <p className="text-lg" style={{ color: "#1f2937" }}>
                Resolve your issue and move forward with confidence.
              </p>
            </div>
          </div>
        </div>
      </section>

    
      {/* Why Choose Section */}
   <PractiseAreasComponent areas={areas ?? []}/>


      {/* Final CTA Section */}
      <FaqSection faqRichText={faq}/>
      {/* <section className="py-16" style={{ backgroundColor: "#d47b0f" }}>
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-4 text-white">
            Try Rocket Legal+ Free for 7 Days
          </h2>
          <p className="text-xl mb-8 text-white">
            Save on the legal services you need for you, your business, and your
            family all year long.
          </p>
          <button
            className="px-8 py-4 rounded-md font-bold text-lg transition-colors"
            style={{
              backgroundColor: "white",
              color: "#d47b0f",
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = "#f3f4f4";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = "white";
            }}
          >
            Start free trial today
          </button>
        </div>
      </section> */}
      <Footer/>
    </div>
  );
};


export default HireALawyerPage;
