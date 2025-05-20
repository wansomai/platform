"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useState } from "react";

const HireALawyerPage = () => {
  // State for form data
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    message: ""
  });

  // State for form submission status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({
    success: false,
    error: false,
    message: ""
  });

  // Handle input changes
  const handleChange = (e:any) => {
    const { id, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [id]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e:any) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ success: false, error: false, message: "" });

    try {
      // Replace with your actual API endpoint
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

      // Reset form after successful submission
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        message: ""
      });

      setSubmitStatus({
        success: true,
        error: false,
        message: "Your request has been sent successfully! An attorney will contact you shortly."
      });
    } catch (error) {
      console.error("Form submission error:", error);
      setSubmitStatus({
        success: false,
        error: true,
        message: "There was an error submitting your request. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <Navbar/>
      <main className="min-h-screen flex-col items-center justify-between">
        <section className="pt-24 md:pt-32 lg:pt-40 overflow-hidden bg-[#355e66] bg-[url(/1.png)] bg-blend-multiply bg-cover">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="grid md:grid-cols-2 gap-12 mt-10">
              <div className="text-left">
                <img src="/hero.png" alt="Legal consultation" />
              </div>

              <div className="bg-white-50 p-8 rounded-lg bg-gray-300 shadow-sm">
                <h3 className="text-xl font-bold mb-6">
                  Talk To A Lawyer
                </h3>

                {submitStatus.success && (
                  <div className="mb-6 p-4 bg-green-100 text-green-800 rounded-md">
                    {submitStatus.message}
                  </div>
                )}

                {submitStatus.error && (
                  <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-md">
                    {submitStatus.message}
                  </div>
                )}

                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="firstName"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        First Name*
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="lastName"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Last Name*
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Your Email*
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="phone"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Phone Number*
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="message"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Legal Question*
                    </label>
                    <textarea
                      id="message"
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                      rows={4}
                      placeholder="Enter your legal question here"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full font-medium text-white bg-[#005c4d] hover:bg-yellow-600 rounded-md py-3 px-4 transition-colors ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {isSubmitting ? 'Sending...' : 'Send Request'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
        <section className="py-10 section-container" id="about">
          <h1 className="section-title text-dark text-4xl mb-5 text-center lg:max-w-[80%] mx-auto">
            Get quick answers from real lawyers, easily.
          </h1>
          <p className="font-jose text-gray-700 text-lg text-center">Ask any legal or tax question, or have a network attorney review your document.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-10 py-10">
            <div className="flex flex-col items-center gap-4">
              <img src="/icons/5.svg" alt="Ask question icon" />
              <p className="text-lg text-dark text-center">
                Ask your detailed legal or tax question to send to an attorney.
              </p>
            </div>
            <div className="flex flex-col items-center gap-4">
              <img src="/icons/2.svg" alt="Legal advice icon" />
              <p className="text-lg text-dark text-center">
                Get legal advice online or by phone from a lawyer that specializes in your issue.
              </p>
            </div>
            <div className="flex flex-col items-center gap-4">
              <img src="/icons/1.svg" alt="Resolution icon" />
              <p className="text-lg text-dark text-center">
                Resolve your issue and move forward with confidence.
              </p>
            </div>
          </div>
        </section>
      </main>
        <Footer/>
    </div>
  );
};

export default HireALawyerPage;