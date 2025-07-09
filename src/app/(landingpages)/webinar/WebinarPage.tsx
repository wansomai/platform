"use client";
import Image from "next/image";
import { Calendar, Linkedin, X } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import InquiryForm from "@/components/forms/InquiryForm";
import PodCastForm from "@/components/forms/podcastForm";

export default function WebinarPageClient() {
  return (
    <main className=" relative bg-[#f3f4f4]">
     
      <Navbar />
      {/* Hero Section with Two Columns */}
      <section className="pt-24 md:pt-32 lg:pt-40 overflow-hidden bg-[url(/podcast-hero.jpg)] bg-cover bg-center">
        <div className="container mx-auto px-4 lg:px-8 py-12  text-white grid grid-cols-1 md:grid-cols-2 gap-10 min-h-screen">
          <div>
            <h1 className="font-marcellus text-5xl mb-6 text-white">
             BEYOND CHATBOTS-THE AI LAWYER PODCAST
            </h1>
            <p>Join us for AI lawyer podcast where we talk everything ai,law,data privcay,governance and policy</p>
            <div className="font-jost text-sm  mb-5 ">Home / podcast</div>
            <div className="flex items-center gap-3 mb-4 ">
              <Calendar className=" text-white h-6 w-6" />
              <p>
                8th<sup>th</sup>,<span className="ml-1">July 2025</span>
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
          <div className="max-w-xl">
            <PodCastForm />
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
