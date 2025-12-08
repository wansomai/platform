'use client';
import { useState } from 'react';
import { Linkedin, X, ChevronRight } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Image from 'next/image';

const CareersPageClient = () => {
  const [opportunities] = useState([

      {
      id: 1,
      title: "Lead UI/UX Designer",
      location: "Hybrid",
      department: "Technology",
      date: "1st December, 2025",
      description: "We are looking for a talented Lead UI/UX Designer to join our product team. The ideal candidate will have a strong portfolio showcasing their expertise in creating user-centered designs for web and mobile applications, with a focus on usability and aesthetics. To apply,send a redesigned hero section of our current homepage to law@wansom.ai together with your resume and cover letter.",
    },
    {
      id: 2,
      title: "Software Engineer",
      location: "Hybrid",
      department: "Technology",
      date: "1st December, 2025",
      description: "We are looking for a talented Software Engineer to join our development team. The Ideal tech stack: NextJs, Typescript,Golang,PostregresQl,Tailwindcss. to Apply,send your Github link,resume and cover letter to law@wansom.ai",
    },
    {
      id: 3,
      title: "Digital Marketer",
      location: "Hybrid",
      department: "Marketing",
      date: "1st December, 2025",
      description: "We are seeking a creative and data-driven Digital Marketer to join our growing team. The ideal candidate will help develop and implement innovative marketing strategies to increase brand awareness and drive customer acquisition for our AI-powered legal solutions.To apply,send your resume and cover letter to law@wansom.ai",
    },
  ]);

  return (
    <div className="bg-gray-50 min-h-screen">
            <div className="fixed left-6 top-1/2 -translate-y-1/2 hidden md:flex flex-col gap-4 z-50">
                <a
                  href="https://x.com/wansom_ai"
                  className="text-slate-800 hover:text-slate-600 transition-colors"
                >
                  <div className="w-8 h-8 border border-yellow-600 rounded-full flex items-center justify-center ">
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
      {/* Header Section */}
      <section className='bg-primary'>
    <Navbar />
      <div className="container mx-auto px-6 pt-32 ">
                <div className="grid lg:grid-cols-2 gap-12">
                  {/* Left Column - Contact Form */}
                  <div>
                    <h1 className="font-serif text-5xl mb-6 text-white">Careers at Wansom AI</h1>
                    <div className="font-jost text-sm text-white mb-10">
                      Home / Careeers
                    </div>
                    <div className="flex items-center gap-3 text-white mb-4 ">
                    
                      <p>
                      At Wansom, we're building the future of legal AI solutions. Join our talented team and help shape the next generation of legal technology. We give equal opportunity to all applicants.
                      </p>
                    </div>

                  </div>
      
                  {/* Right Column - Map */}
                  <div className="">
                    <div>
                      <Image
                        src="/law-office.jpg"
                        alt="AI lawyer"
                        width={600}
                        height={400}
                        className="rounded-t-lg object-cover w-full"
                      />
                    </div>
                  
                  </div>
                </div>
              </div>
      </section>

      {/* Available Opportunities Section */}
      <div className="p-6 md:p-16">
        <h2 className="text-2xl font-bold mb-8">Available Opportunities</h2>
        
        <div className="space-y-6">
          {opportunities.map(job => (
            <div key={job.id} className="border border-gray-200 rounded-lg bg-white overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/3 p-6 border-r border-gray-200">
                  <a
                    href='mailto:law@wansom.ai'
                    className="text-xl font-semibold text-primary mb-2 hover:text-[#F18F01] hover:underline cursor-pointer transition-all block"
                  >
                    {job.title}
                  </a>
                </div>
                
                <div className="md:w-2/3 p-6">
                  <div className="flex items-center text-sm text-gray-500 mb-4 flex-wrap gap-6">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      </svg>
                      {job.location}
                    </div>
                    
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                      </svg>
                      {job.department}
                    </div>
                    
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                      {job.date}
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-4">{job.description}</p>
                  
                  <div className="flex justify-end">
                    <a
                      href='mailto:law@wansom.ai'
                      className="bg-primary hover:bg-[#F18F01] text-white px-6 py-3 rounded-md flex items-center gap-1 transition-all hover:shadow-lg transform hover:scale-105"
                    >
                      Apply Now
                      <ChevronRight className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CareersPageClient;