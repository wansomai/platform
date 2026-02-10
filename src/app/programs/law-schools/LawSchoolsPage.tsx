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
      <section className="pt-24 md:pt-32 bg-white relative overflow-hidden ">
            {/* SVG Background */}
              <div className="absolute inset-0 z-0">
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 1220 810"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  preserveAspectRatio="xMidYMid slice"
                >
                  <g clipPath="url(#clip0_186_1134)">
                    <mask
                      id="mask0_186_1134"
                      style={{ maskType: "alpha" }}
                      maskUnits="userSpaceOnUse"
                      x="10"
                      y="-1"
                      width="1200"
                      height="812"
                    >
                      <rect x="10" y="-0.84668" width="1200" height="811.693" fill="url(#paint0_linear_186_1134)" />
                    </mask>
                    <g mask="url(#mask0_186_1134)">
                      {/* Grid Rectangles */}
                      {[...Array(35)].map((_, i) => (
                        <React.Fragment key={`row1-${i}`}>
                          <rect
                            x={-20.0891 + i * 36}
                            y="9.2"
                            width="35.6"
                            height="35.6"
                            stroke="hsl(var(--foreground))"
                            strokeOpacity="0.11"
                            strokeWidth="0.4"
                            strokeDasharray="2 2"
                          />
                          <rect
                            x={-20.0891 + i * 36}
                            y="45.2"
                            width="35.6"
                            height="35.6"
                            stroke="hsl(var(--foreground))"
                            strokeOpacity="0.11"
                            strokeWidth="0.4"
                            strokeDasharray="2 2"
                          />
                          <rect
                            x={-20.0891 + i * 36}
                            y="81.2"
                            width="35.6"
                            height="35.6"
                            stroke="hsl(var(--foreground))"
                            strokeOpacity="0.11"
                            strokeWidth="0.4"
                            strokeDasharray="2 2"
                          />
                          <rect
                            x={-20.0891 + i * 36}
                            y="117.2"
                            width="35.6"
                            height="35.6"
                            stroke="hsl(var(--foreground))"
                            strokeOpacity="0.11"
                            strokeWidth="0.4"
                            strokeDasharray="2 2"
                          />
                          <rect
                            x={-20.0891 + i * 36}
                            y="153.2"
                            width="35.6"
                            height="35.6"
                            stroke="hsl(var(--foreground))"
                            strokeOpacity="0.11"
                            strokeWidth="0.4"
                            strokeDasharray="2 2"
                          />
                          <rect
                            x={-20.0891 + i * 36}
                            y="189.2"
                            width="35.6"
                            height="35.6"
                            stroke="hsl(var(--foreground))"
                            strokeOpacity="0.11"
                            strokeWidth="0.4"
                            strokeDasharray="2 2"
                          />
                          <rect
                            x={-20.0891 + i * 36}
                            y="225.2"
                            width="35.6"
                            height="35.6"
                            stroke="hsl(var(--foreground))"
                            strokeOpacity="0.11"
                            strokeWidth="0.4"
                            strokeDasharray="2 2"
                          />
                          <rect
                            x={-20.0891 + i * 36}
                            y="261.2"
                            width="35.6"
                            height="35.6"
                            stroke="hsl(var(--foreground))"
                            strokeOpacity="0.11"
                            strokeWidth="0.4"
                            strokeDasharray="2 2"
                          />
                          <rect
                            x={-20.0891 + i * 36}
                            y="297.2"
                            width="35.6"
                            height="35.6"
                            stroke="hsl(var(--foreground))"
                            strokeOpacity="0.11"
                            strokeWidth="0.4"
                            strokeDasharray="2 2"
                          />
                          <rect
                            x={-20.0891 + i * 36}
                            y="333.2"
                            width="35.6"
                            height="35.6"
                            stroke="hsl(var(--foreground))"
                            strokeOpacity="0.11"
                            strokeWidth="0.4"
                            strokeDasharray="2 2"
                          />
                          <rect
                            x={-20.0891 + i * 36}
                            y="369.2"
                            width="35.6"
                            height="35.6"
                            stroke="hsl(var(--foreground))"
                            strokeOpacity="0.11"
                            strokeWidth="0.4"
                            strokeDasharray="2 2"
                          />
                          <rect
                            x={-20.0891 + i * 36}
                            y="405.2"
                            width="35.6"
                            height="35.6"
                            stroke="hsl(var(--foreground))"
                            strokeOpacity="0.11"
                            strokeWidth="0.4"
                            strokeDasharray="2 2"
                          />
                          <rect
                            x={-20.0891 + i * 36}
                            y="441.2"
                            width="35.6"
                            height="35.6"
                            stroke="hsl(var(--foreground))"
                            strokeOpacity="0.11"
                            strokeWidth="0.4"
                            strokeDasharray="2 2"
                          />
                          <rect
                            x={-20.0891 + i * 36}
                            y="477.2"
                            width="35.6"
                            height="35.6"
                            stroke="hsl(var(--foreground))"
                            strokeOpacity="0.11"
                            strokeWidth="0.4"
                            strokeDasharray="2 2"
                          />
                          <rect
                            x={-20.0891 + i * 36}
                            y="513.2"
                            width="35.6"
                            height="35.6"
                            stroke="hsl(var(--foreground))"
                            strokeOpacity="0.11"
                            strokeWidth="0.4"
                            strokeDasharray="2 2"
                          />
                          <rect
                            x={-20.0891 + i * 36}
                            y="549.2"
                            width="35.6"
                            height="35.6"
                            stroke="hsl(var(--foreground))"
                            strokeOpacity="0.11"
                            strokeWidth="0.4"
                            strokeDasharray="2 2"
                          />
                          <rect
                            x={-20.0891 + i * 36}
                            y="585.2"
                            width="35.6"
                            height="35.6"
                            stroke="hsl(var(--foreground))"
                            strokeOpacity="0.11"
                            strokeWidth="0.4"
                            strokeDasharray="2 2"
                          />
                          <rect
                            x={-20.0891 + i * 36}
                            y="621.2"
                            width="35.6"
                            height="35.6"
                            stroke="hsl(var(--foreground))"
                            strokeOpacity="0.11"
                            strokeWidth="0.4"
                            strokeDasharray="2 2"
                          />
                          <rect
                            x={-20.0891 + i * 36}
                            y="657.2"
                            width="35.6"
                            height="35.6"
                            stroke="hsl(var(--foreground))"
                            strokeOpacity="0.11"
                            strokeWidth="0.4"
                            strokeDasharray="2 2"
                          />
                          <rect
                            x={-20.0891 + i * 36}
                            y="693.2"
                            width="35.6"
                            height="35.6"
                            stroke="hsl(var(--foreground))"
                            strokeOpacity="0.11"
                            strokeWidth="0.4"
                            strokeDasharray="2 2"
                          />
                          <rect
                            x={-20.0891 + i * 36}
                            y="729.2"
                            width="35.6"
                            height="35.6"
                            stroke="hsl(var(--foreground))"
                            strokeOpacity="0.11"
                            strokeWidth="0.4"
                            strokeDasharray="2 2"
                          />
                          <rect
                            x={-20.0891 + i * 36}
                            y="765.2"
                            width="35.6"
                            height="35.6"
                            stroke="hsl(var(--foreground))"
                            strokeOpacity="0.11"
                            strokeWidth="0.4"
                            strokeDasharray="2 2"
                          />
                        </React.Fragment>
                      ))}
                      {/* Specific Rectangles with fill */}
                      <rect x="699.711" y="81" width="36" height="36" fill="hsl(var(--foreground))" fillOpacity="0.08" />
                      <rect x="195.711" y="153" width="36" height="36" fill="hsl(var(--foreground))" fillOpacity="0.09" />
                      <rect x="1023.71" y="153" width="36" height="36" fill="hsl(var(--foreground))" fillOpacity="0.09" />
                      <rect x="123.711" y="225" width="36" height="36" fill="hsl(var(--foreground))" fillOpacity="0.09" />
                      <rect x="1095.71" y="225" width="36" height="36" fill="hsl(var(--foreground))" fillOpacity="0.09" />
                      <rect x="951.711" y="297" width="36" height="36" fill="hsl(var(--foreground))" fillOpacity="0.09" />
                      <rect x="231.711" y="333" width="36" height="36" fill="hsl(var(--foreground))" fillOpacity="0.07" />
                      <rect x="303.711" y="405" width="36" height="36" fill="hsl(var(--foreground))" fillOpacity="0.07" />
                      <rect x="87.7109" y="405" width="36" height="36" fill="hsl(var(--foreground))" fillOpacity="0.09" />
                      <rect x="519.711" y="405" width="36" height="36" fill="hsl(var(--foreground))" fillOpacity="0.08" />
                      <rect x="771.711" y="405" width="36" height="36" fill="hsl(var(--foreground))" fillOpacity="0.09" />
                      <rect x="591.711" y="477" width="36" height="36" fill="hsl(var(--foreground))" fillOpacity="0.07" />
                    </g>
        
                    <g filter="url(#filter0_f_186_1134)">
                      <path
                        d="M1447.45 -87.0203V-149.03H1770V1248.85H466.158V894.269C1008.11 894.269 1447.45 454.931 1447.45 -87.0203Z"
                        fill="url(#paint1_linear_186_1134)"
                      />
                    </g>
        
                    <g filter="url(#filter1_f_186_1134)">
                      <path
                        d="M1383.45 -151.02V-213.03H1706V1184.85H402.158V830.269C944.109 830.269 1383.45 390.931 1383.45 -151.02Z"
                        fill="url(#paint2_linear_186_1134)"
                        fillOpacity="0.69"
                      />
                    </g>
        
                    <g style={{ mixBlendMode: "lighten" }} filter="url(#filter2_f_186_1134)">
                      <path
                        d="M1567.45 -231.02V-293.03H1890V1104.85H586.158V750.269C1128.11 750.269 1567.45 310.931 1567.45 -231.02Z"
                        fill="url(#paint3_linear_186_1134)"
                      />
                    </g>
        
                    <g style={{ mixBlendMode: "overlay" }} filter="url(#filter3_f_186_1134)">
                      <path
                        d="M65.625 750.269H284.007C860.205 750.269 1327.31 283.168 1327.31 -293.03H1650V1104.85H65.625V750.269Z"
                        fill="url(#paint4_radial_186_1134)"
                        fillOpacity="0.64"
                      />
                    </g>
                  </g>
        
                  <rect
                    x="0.5"
                    y="0.5"
                    width="1219"
                    height="809"
                    rx="15.5"
                    stroke="hsl(var(--foreground))"
                    strokeOpacity="0.06"
                  />
        
                  <defs>
                    <filter
                      id="filter0_f_186_1134"
                      x="147.369"
                      y="-467.818"
                      width="1941.42"
                      height="2035.46"
                      filterUnits="userSpaceOnUse"
                      colorInterpolationFilters="sRGB"
                    >
                      <feFlood floodOpacity="0" result="BackgroundImageFix" />
                      <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                      <feGaussianBlur stdDeviation="159.394" result="effect1_foregroundBlur_186_1134" />
                    </filter>
                    <filter
                      id="filter1_f_186_1134"
                      x="-554.207"
                      y="-1169.39"
                      width="3216.57"
                      height="3310.61"
                      filterUnits="userSpaceOnUse"
                      colorInterpolationFilters="sRGB"
                    >
                      <feFlood floodOpacity="0" result="BackgroundImageFix" />
                      <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                      <feGaussianBlur stdDeviation="478.182" result="effect1_foregroundBlur_186_1134" />
                    </filter>
                    <filter
                      id="filter2_f_186_1134"
                      x="426.762"
                      y="-452.424"
                      width="1622.63"
                      height="1716.67"
                      filterUnits="userSpaceOnUse"
                      colorInterpolationFilters="sRGB"
                    >
                      <feFlood floodOpacity="0" result="BackgroundImageFix" />
                      <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                      <feGaussianBlur stdDeviation="79.6969" result="effect1_foregroundBlur_186_1134" />
                    </filter>
                    <filter
                      id="filter3_f_186_1134"
                      x="-253.163"
                      y="-611.818"
                      width="2221.95"
                      height="2035.46"
                      filterUnits="userSpaceOnUse"
                      colorInterpolationFilters="sRGB"
                    >
                      <feFlood floodOpacity="0" result="BackgroundImageFix" />
                      <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                      <feGaussianBlur stdDeviation="159.394" result="effect1_foregroundBlur_186_1134" />
                    </filter>
                    <linearGradient
                      id="paint0_linear_186_1134"
                      x1="35.0676"
                      y1="23.6807"
                      x2="903.8"
                      y2="632.086"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stopColor="hsl(var(--foreground))" stopOpacity="0" />
                      <stop offset="1" stopColor="hsl(var(--muted-foreground))" />
                    </linearGradient>
                    <linearGradient
                      id="paint1_linear_186_1134"
                      x1="1118.08"
                      y1="-149.03"
                      x2="1118.08"
                      y2="1248.85"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stopColor="hsl(var(--foreground))" />
                      <stop offset="0.578125" stopColor="hsl(var(--primary-light))" />
                      <stop offset="1" stopColor="hsl(var(--primary))" />
                    </linearGradient>
                    <linearGradient
                      id="paint2_linear_186_1134"
                      x1="1054.08"
                      y1="-213.03"
                      x2="1054.08"
                      y2="1184.85"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stopColor="hsl(var(--foreground))" />
                      <stop offset="0.578125" stopColor="hsl(var(--primary-light))" />
                      <stop offset="1" stopColor="hsl(var(--primary))" />
                    </linearGradient>
                    <linearGradient
                      id="paint3_linear_186_1134"
                      x1="1238.08"
                      y1="-293.03"
                      x2="1238.08"
                      y2="1104.85"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stopColor="hsl(var(--foreground))" />
                      <stop offset="0.578125" stopColor="hsl(var(--primary-light))" />
                      <stop offset="1" stopColor="hsl(var(--primary))" />
                    </linearGradient>
                    <radialGradient
                      id="paint4_radial_186_1134"
                      cx="0"
                      cy="0"
                      r="1"
                      gradientUnits="userSpaceOnUse"
                      gradientTransform="translate(989.13 557.24) rotate(47.9516) scale(466.313 471.424)"
                    >
                      <stop stopColor="hsl(var(--foreground))" />
                      <stop offset="0.157789" stopColor="hsl(var(--primary-light))" />
                      <stop offset="1" stopColor="hsl(var(--primary))" />
                    </radialGradient>
                    <clipPath id="clip0_186_1134">
                      <rect width="1220" height="810" rx="16" fill="hsl(var(--foreground))" />
                    </clipPath>
                  </defs>
                </svg>
              </div>
        
        <div className="section-container mx-auto px-5 z-10 relative">
          <div className="relative grid grid-cols-1 gap-12 items-center ">
            <div className="text-black lg:basis-1/2 text-center lg:text-left space-y-5">
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
              className="rounded-lg rounded-b-none max-h-[500px] w-full object-cover lg:mx-0 mx-auto shadow-lg"
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
      question: "What is the pricing for law schools?",
      answer:
        "Wansom is free for students and faculty at partner law schools. We offer a comprehensive package that includes full access to the Wansom AI platform, training resources, and dedicated support. Our goal is to make cutting-edge AI technology accessible to all law students, regardless of their institution's budget. For more information on partnership opportunities and pricing for institutions, please contact our team.",
    },
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
