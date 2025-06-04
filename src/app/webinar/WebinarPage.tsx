"use client";
import Image from "next/image";
import { Calendar, Linkedin, X } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import InquiryForm from "@/components/forms/InquiryForm";

export default function WebinarPageClient() {
  return (
    <main className=" relative bg-[#f3f4f4]">
      <div className="fixed left-6 top-1/2 -translate-y-1/2 hidden md:flex flex-col gap-4 z-50">
        <a
          href="https://x.com/wansom_ai"
          className="text-slate-800 hover:text-slate-600 transition-colors"
        >
          <div className="w-8 h-8 border rounded-full flex items-center justify-center border-yellow-600 ">
            <svg
              className="w-6 h-6"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M36.6526 3.8078H43.3995L28.6594 20.6548L46 43.5797H32.4225L21.7881 29.6759L9.61989 43.5797H2.86886L18.6349 25.56L2 3.8078H15.9222L25.5348 16.5165L36.6526 3.8078ZM34.2846 39.5414H38.0232L13.8908 7.63406H9.87892L34.2846 39.5414Z"
                fill="black"
              />
            </svg>
          </div>
        </a>
        <a
          href="https://www.linkedin.com/company/wansom-ai"
          className="text-slate-800 hover:text-slate-600 transition-colors"
        >
          <div className="w-8 h-8 border rounded-full border-yellow-600 flex items-center justify-center">
            <Linkedin className="w-4 h-4" />
          </div>
        </a>
      </div>
    <Navbar />
      {/* Hero Section with Two Columns */}
      <section className="pt-24 md:pt-32 lg:pt-40 overflow-hidden bg-[#355e66] bg-[url(/wansom-webinar.png)] bg-blend-multiply bg-cover">
         <div className="container mx-auto px-4 lg:px-8 py-12  text-white">
    <h1 className="font-marcellus text-5xl mb-6 text-white">Safeguarding Attorney-Client Privilege when using AI - Webinar</h1>
              <div className="font-jost text-sm  mb-5 ">
                Home / webinar
              </div>
              <div className="flex items-center gap-3 mb-4 ">
             <Calendar className=" text-white h-6 w-6" />
                <p>
                  19th<sup>th</sup>,
                    <span className="ml-1">June 2025</span>
                </p>
              </div>
              <div className="flex items-center gap-3  mb-4 ">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="size-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                  />
                </svg>
                <p>law@wansom.ai</p>
              </div>
         </div>
     </section>
        <div className="container mx-auto px-6 md:pl-0 py-10 pt-32 ">
          <div className="grid lg:grid-cols-2 gap-12 ">
            {/* Left Column - Contact Form */}
            <div>
          

              <h2 className="font-marcellus text-2xl mb-8">
                Send us a message
              </h2>
              <InquiryForm />
            </div>

            {/* Right Column - Map */}
            <div className="space-y-6">
            
              <div className="w-full h-auto rounded-lg overflow-hidden">
               <img
                  src="/wansom-webinar.png"/>
              </div>
              <p>
                Join us for an insightful webinar on "Safeguarding Attorney-Client Privilege when using AI." This session will explore the challenges and best practices for maintaining confidentiality in the age of artificial intelligence. Don't miss this opportunity to enhance your understanding of legal ethics in the digital era.
              </p>
            </div>
          </div>
        </div>
        <Footer />
     
    </main>
  );
}