"use client";
import Image from "next/image";
import { Linkedin, X } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import InquiryForm from "@/components/forms/InquiryForm";

export default function ContactPageClient() {
  return (
    <main className="min-h-screen relative">
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

      {/* Hero Section with Two Columns */}
      <section className="">
        <Navbar />
        <div className="container mx-auto px-6 md:pl-20 py-10 pt-32">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Left Column - Contact Form */}
            <div>
              <h1 className="font-marcellus text-5xl mb-6">Contact Us</h1>
              <div className="font-jost text-sm text-slate-600 mb-10">
                Home / Contact Us
              </div>
              <div className="flex items-center gap-3 text-slate-600 mb-4 ">
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
                    d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
                  />
                </svg>{" "}
                <p>
                  5th<sup>th</sup> Floor, I&M House, 2Nd Ngong Avenue, Upper Hill,
                  Nairobi, Kenya
                </p>
              </div>
              <div className="flex items-center gap-3 text-slate-600 mb-4 ">
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
                <p>info@wansom.ai</p>
              </div>

              <h2 className="font-marcellus text-2xl mb-8">
                Send us a message
              </h2>
              <InquiryForm />
            </div>

            {/* Right Column - Map */}
            <div className="space-y-6">
              <div>
                <Image
                  src="/hero.png"
                  alt="AI lawyer"
                  width={600}
                  height={400}
                  className="rounded-lg object-cover w-full"
                />
              </div>
              <div className="w-full h-[400px] rounded-lg overflow-hidden">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3988.800665020861!2d36.808691074965616!3d-1.2941083986935926!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x182f11e9e9f172db%3A0xde236816f452452b!2sI%26M%20Bank%202nd%20Ngong%20Avenue%20Branch%2C%20Ngong%20Ave%2C%20Nairobi!5e0!3m2!1sen!2ske!4v1717142028581!5m2!1sen!2ske" width="600" height="450" loading="lazy" 
                  className="w-full h-full"
                  style={{ border: 0 }}
                  allowFullScreen
                  
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </section>
    </main>
  );
}