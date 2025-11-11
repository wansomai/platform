"use client";
import React, { useState } from "react";
import {
  FileText,
  ChevronDown,
  ArrowUpRight,
  BookOpen,
  Users,
  Brain,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import VaultSection from "@/components/home/vault";
import KnowledgeBase from "@/components/home/Knowledgebase";

const LawSchoolsPage = () => {

    const [openPanel, setOpenPanel] = useState<number | null>(0);

  const panels = [
    {
      icon: Users,
      title: "Free Student Access",
      description:
        "Students receive comprehensive access to Wansom AI platform throughout their academic journey, gaining practical experience with the same AI tools used in modern legal practice. The program builds both technical proficiency and ethical judgment around AI use, empowering students to conduct more efficient legal research, draft higher-quality documents, and prepare cases more effectively. This hands-on experience provides a significant advantage when entering the job market, as law firms increasingly seek graduates who can leverage AI to deliver better client outcomes.",
    },
    {
      icon: BookOpen,
      title: "For Faculty & Administration",
      description:
        "Law schools partnering with Wansom gain access to a dedicated education team that works collaboratively to integrate AI into existing curricula. Faculty receive comprehensive training, ready-made learning materials, and ongoing support for implementing AI across courses, clinics, and seminars. This partnership positions your institution at the forefront of legal education innovation, demonstrating a commitment to preparing students for the technology-enabled future of legal practice while maintaining academic rigor and ethical standards.",
    },
  ];

  const togglePanel = (index: number) => {
    setOpenPanel(openPanel === index ? null : index);
  };
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-24 md:pt-32 bg-primary relative overflow-hidden">
        <div className="container mx-auto px-5 z-10 relative">
          <div className="relative grid grid-cols-1 gap-12 items-center ">
            <div className="text-white lg:basis-1/2 text-center lg:text-left space-y-5">
              <p className="text-body mb-2">AI For Law Schools</p>
              <h1 className="text-heading-1 text-shadow font-serif max-w-4xl">
                Preparing Tomorrow's Lawyers with Skills that Matter Most
              </h1>
              <a href="/school-program" className="inline-flex items-center px-6 py-3 bg-secondary w-fit text-white font-semibold rounded-lg shadow hover:bg-primary transition">
                Join The Program
                <ArrowUpRight className="w-5 h-5 ml-2" />
              </a>
            </div>
            {/* Hero image */}
            <img
              src={"/images/students-studying.jpg"}
              alt="law school students"
              className="rounded-lg rounded-b-none "
            />
          </div>
        </div>
      </section>

      {/* Student Program Introduction */}
      <section className="section-spacing bg-white">
        <div className="section-container ">
          <div className="text-start">
            <h2 className="text-heading-2 text-gray-900 mb-6">
              The Wansom AI Student Program
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed max-w-4xl">
              Artificial intelligence is rapidly becoming integral to legal work. Law firms and organizations increasingly expect new attorneys to have expertise in AI tools. The Wansom AI Student Program empowers law students with leading generative AI technology, preparing them to utilize these tools effectively and ethically from day one of their legal careers.
            </p>

          </div>
           {/* benefits section */}
             <div className="space-y-4 my-4">
          {panels.map((panel, index) => (
            <div key={index} className="border rounded-xl overflow-hidden">
              <button
                onClick={() => togglePanel(index)}
                className="w-full flex items-center justify-between p-6 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center">
                 
                  <h3 className="text-xl font-semibold text-gray-900">{panel.title}</h3>
                </div>
                <ChevronDown
                  className={`w-6 h-6 text-gray-500 flex-shrink-0 transition-transform duration-200 ${
                    openPanel === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  openPanel === index ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="p-6 bg-white">
                  <p className="text-gray-700 leading-relaxed">
                    {panel.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        </div>
      </section>
      {/* Features Section */}
      <FeaturesSection />

      <KnowledgeBase />
      <VaultSection />

      {/* FAQ Section */}
      <FAQSection />

      <Footer />
    </div>
  );
};

const FeaturesSection = () => {
  const features = [
    {
      icon: BookOpen,
      title: "Leglal Research",
      description:
        "Students learn to craft effective prompts that improve case preparation, legal research, and document analysis, understanding how to guide AI to produce useful, accurate results.",
      href: "#",
    },
    {
      icon: FileText,
      title: "Document Preparation",
      description:
        "From legal memoranda to contracts, students discover how to leverage AI to reduce drafting time while maintaining high quality standards and proper citations.",
      href: "#",
    },
    {
      icon: Brain,
      title: "Case Analysis",
      description:
        "Interactive AI-guided analysis helps students develop critical thinking skills, understand complex legal principles, and identify winning arguments more efficiently.",
      href: "#",
    },
    {
      icon: Users,
      title: "Ethical AI Use",
      description:
        "Students explore the ethical dimensions of AI in legal practice, learning to balance efficiency gains with professional responsibility and judgment.",
      href: "#",
    },
  ];

  return (
    <section className="section-spacing bg-primary">
      <div className="section-container">
        {/* Header */}
        <div className="text-center lg:text-start mb-12">
          <h2 className="text-heading-2 text-white capitalize tracking-wider">
            How Wansom AI Boosts Learning
          </h2>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-white border border-gray-200 rounded-xl py-6 px-3 hover:shadow-lg transition-all duration-300"
            >
              {/* Icon */}
              <div className="mb-6">
                <feature.icon
                  className="w-12 h-12 text-primary"
                  strokeWidth={1.5}
                />
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed text-lg">
                {feature.description}
              </p>

              {/* Arrow Link */}
              <a
                href={'/school-program'}
                className="inline-flex items-center justify-center w-10 h-10 rounded-full border-2 border-primary text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300"
                aria-label={`Learn more about ${feature.title}`}
              >
                <ArrowUpRight className="w-5 h-5" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const FAQSection = () => {
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);

  const faqs = [
    {
      question: "How does Wansom AI benefit law school curriculum?",
      answer:
        "Wansom AI enhances legal education by providing students with real-world tools they'll use in practice. It supplements traditional legal education with AI-powered research, drafting, and analysis capabilities. Students learn both foundational legal principles and modern legal technology skills, preparing them for the evolving legal profession. Faculty can use Wansom to create interactive assignments, provide detailed feedback, and expose students to practice-ready tools.",
    },
    {
      question: "Is Wansom suitable for 1L students?",
      answer:
        "Yes, Wansom is designed to support students at all levels. For 1L students, we offer guided research tools that help them learn proper legal research methodology while developing critical thinking skills. The platform provides structured learning paths that align with core first-year courses like Contracts, Torts, Civil Procedure, and Legal Research & Writing. Our AI assists without replacing the fundamental learning process, ensuring students develop strong analytical skills.",
    },
    {
      question: "How does Wansom support academic integrity?",
      answer:
        "Wansom is designed as a learning aid, not a shortcut. The platform encourages critical thinking by prompting students to analyze and validate AI suggestions. Faculty have administrative controls to set usage parameters, monitor student work, and detect inappropriate reliance on AI. We provide transparency in how AI generates suggestions and emphasize that students must understand and take ownership of their work. Wansom complements instruction rather than replacing the learning process.",
    },
    {
      question: "Can Wansom integrate with our law school's existing systems?",
      answer:
        "Yes, Wansom offers flexible integration options with common law school platforms including learning management systems (Canvas, Blackboard, Moodle), legal research databases (Westlaw, LexisNexis), and single sign-on (SSO) systems. We can work with your IT team to implement seamless integration that fits your institution's technology infrastructure. Our API allows for custom integrations based on your specific needs.",
    },
    {
      question: "What is the pricing for law schools?",
      answer:
        "We offer special educational pricing for law schools with flexible plans based on institution size and needs. Pricing is typically structured per student or as an institutional license. We provide discounted rates for academic use, including free trials for faculty evaluation and pilot programs. Small clinics and legal aid organizations may qualify for additional discounts. Contact our education team for a customized quote and to discuss grant funding opportunities that may be available.",
    },
  ];

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <section className="section-spacing bg-gray-50">
      <div className="section-container max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-heading-2 text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600">
            Everything you need to know about Wansom AI for law schools
          </p>
        </div>

        <div>
          {faqs.map((faq, index) => (
            <div key={index} className="border-b border-gray-200">
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex items-center justify-between py-6 text-left"
              >
                <h3 className="text-lg font-semibold text-gray-900 pr-4">
                  {faq.question}
                </h3>
                <ChevronDown
                  className={`w-6 h-6 text-gray-500 flex-shrink-0 transition-transform duration-200 ${
                    openFAQ === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  openFAQ === index
                    ? "max-h-96 opacity-100"
                    : "max-h-0 opacity-0"
                }`}
              >
                <div className="pb-6">
                  <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LawSchoolsPage;
