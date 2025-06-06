import React, { useState, useEffect } from "react";
import {
  FileText,
  ArrowRight,
  Eye,
  CheckCircle,
  Paperclip,
  Send,
  MessageSquare,
  Loader2,
} from "lucide-react";

const AnimatedLegalInterface = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [showAiResponse, setShowAiResponse] = useState(false);
  const [showGeneratedContent, setShowGeneratedContent] = useState(false);
  const [highlightedFile, setHighlightedFile] = useState<string | null>(null);
  const [contractContent, setContractContent] = useState("");

  const animationSteps = [
    { type: "initial", duration: 1000 },
    { type: "user_types", duration: 1500 },
    { type: "ai_responds", duration: 1000 },
    { type: "ai_types_contract", duration: 2000 },
    { type: "generate_content", duration: 1500 },
    { type: "file_interaction", duration: 1000 },
    { type: "reset", duration: 500 },
  ];

  const userMessage = "Update the contract to match our latest privacy policy";
  const contractText =
    "Employee data is collected and processed for legitimate business purposes (payroll, benefits, performance, etc.) in accordance with Company policy and applicable laws. Data types, storage, access, and retention are detailed in our Data Protection Policy. Employees have rights to access, rectify, or request erasure of their data under GDPR and applicable privacy regulations.";

  useEffect(() => {
    const runAnimation = () => {
      const step = animationSteps[currentStep];

      switch (step.type) {
        case "initial":
          // Reset all states
          setIsTyping(false);
          setUserInput("");
          setShowAiResponse(false);
          setShowGeneratedContent(false);
          setHighlightedFile(null);
          setContractContent("");
          break;

        case "user_types":
          setIsTyping(true);
          // Simulate typing - faster
          let i = 0;
          const typingInterval = setInterval(() => {
            if (i <= userMessage.length) {
              setUserInput(userMessage.slice(0, i));
              i++;
            } else {
              clearInterval(typingInterval);
              setIsTyping(false);
              // Auto-send message
              setTimeout(() => setShowAiResponse(true), 300);
            }
          }, 50); // Faster typing
          break;

        case "ai_responds":
          // AI response appears
          setShowAiResponse(true);
          break;

        case "ai_types_contract":
          // AI types the contract content - faster
          let j = 0;
          const contractTypingInterval = setInterval(() => {
            if (j <= contractText.length) {
              setContractContent(contractText.slice(0, j));
              j++;
            } else {
              clearInterval(contractTypingInterval);
            }
          }, 15); // Faster contract typing
          break;

        case "generate_content":
          setShowGeneratedContent(true);
          break;

        case "file_interaction":
          setHighlightedFile("contract");
          setTimeout(() => setHighlightedFile(null), 600);
          break;

        case "reset":
          // Prepare for next cycle
          break;
      }

      const timer = setTimeout(() => {
        setCurrentStep((prev) => (prev + 1) % animationSteps.length);
      }, step.duration);

      return () => clearTimeout(timer);
    };

    const cleanup = runAnimation();
    return cleanup;
  }, [currentStep]);

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden border">
        {/* Header without tabs */}
        <div className="bg-gray-50 border-b">
          <div className="flex items-center justify-between px-2 md:px-6 py-3">
            <div className="flex items-center space-x-4">
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              </div>
              {/* <span className="text-sm text-gray-600">Legal Workspace</span> */}
              <img src="/logo.png" />
            </div>
            <div className="w-8 h-8 bg-[#355e66] rounded-full text-center text-sm flex items-center justify-center text-white font-medium">
              WO
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 min-h-[580px]">
          {/* Main content area */}
          <div className="lg:col-span-2 p-6 bg-white">
            {/* AI Suggestion bubble */}
            <div
              className={`bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 relative transition-all duration-300 hidden md:block ${
                showAiResponse
                  ? "opacity-100 transform translate-y-0"
                  : "opacity-0 transform translate-y-4"
              }`}
            >
              <div className="absolute -top-2 left-4 bg-gray-50 w-4 h-4 rotate-45 border-l border-t border-gray-200"></div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-[#355e66] rounded-full flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-3 h-3 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-800 font-medium">
                    {showAiResponse && (
                      <span className="inline-block">
                        Yes, I'll update the contract to match the latest
                        privacy policy
                        {!showGeneratedContent && (
                          <span className="animate-pulse">...</span>
                        )}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Contract content */}
            <div
              className="space-y-4 text-sm leading-relaxed"
              style={{ fontFamily: "Times, serif" }}
            >
              <div>
                <h3 className="font-bold text-base mb-3">
                  9.1 Data Protection and Privacy:
                </h3>
                <div className="text-gray-700 mb-4 min-h-[120px]">
                  {contractContent}
                  {contractContent &&
                    contractContent.length < contractText.length && (
                      <span className="inline-block w-2 h-5 bg-[#355e66] ml-1 animate-pulse"></span>
                    )}
                  {!contractContent && (
                    <div className="flex items-center text-gray-400">
                      <div className="flex space-x-1 mr-2">
                        <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                      AI is updating the contract content...
                    </div>
                  )}
                </div>
              </div>

              {/* Generated content box - faster animation */}
              <div
                className={`bg-gray-100 border border-gray-300 rounded-lg p-4 mt-6 transition-all duration-400 ${
                  showGeneratedContent
                    ? "opacity-100 transform scale-100"
                    : "opacity-0 transform scale-95"
                }`}
              >
                <div className="flex items-start space-x-2 mb-2">
                  <Loader2
                    className={`w-4 h-4 text-[#355e66] ${
                      showGeneratedContent ? "animate-spin" : ""
                    }`}
                  />
                  <span className="text-xs text-gray-600 font-medium">
                    Generating updated documents...
                  </span>
                </div>
                <p className="text-gray-700 text-sm italic">
                  Create "Standard Employment Contract Template v4_Revised.docx"
                  with all these changes and a "Contract Compliance &
                  Improvement Report_May 2025.pdf"
                </p>
              </div>

              {/* File preview - faster highlight animation */}
              <div
                className={`flex items-center  space-x-3 mt-6 p-3 bg-gray-50 rounded-lg transition-all duration-200 ${
                  highlightedFile === "contract"
                    ? "ring-2 ring-[#355e66] bg-blue-50 justify-start"
                    : ""
                }`}
              >
                <FileText
                  className={`w-8 h-8 transition-colors duration-200 ${
                    highlightedFile === "contract"
                      ? "text-[#355e66]"
                      : "text-blue-600"
                  }`}
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    Standard Employment Contract v3.docx
                  </div>
                  <div className="text-xs text-gray-500">
                    {highlightedFile === "contract"
                      ? "Processing updates..."
                      : "Ready for review"}
                  </div>
                </div>
                <div className="ml-auto flex space-x-2">
                  <button className="p-2 hover:bg-gray-200 rounded transition-colors">
                    <ArrowRight className="w-4 h-4 transform rotate-90" />
                  </button>
                  <button className="p-2 hover:bg-gray-200 rounded transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Chat input - faster animation */}
            <div className="mt-6 flex items-center space-x-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={userInput}
                  onChange={() => {}} // Controlled by animation
                  placeholder="Ask Anything about this project"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#355e66] focus:border-transparent transition-all"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Paperclip className="h-4 w-4 text-gray-400" />
                </div>
                {isTyping && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-[#355e66] rounded-full animate-bounce"></div>
                      <div
                        className="w-1 h-1 bg-[#355e66] rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-1 h-1 bg-[#355e66] rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
              <button className="bg-[#355e66] text-white p-3 rounded-lg hover:bg-[#2a4d54] transition-colors">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sidebar with tabs */}
          <div className="bg-gray-50 border-l">
            {/* Navigation Tabs */}
            <div className="border-b bg-white">
              <div className="flex space-x-0">
                <button className="flex-1 text-gray-500 hover:text-gray-700 transition-colors py-3 px-4 text-sm border-r">
                  Context
                </button>
                <button className="flex-1 text-[#355e66] border-b-2 border-[#355e66] font-medium py-3 px-4 text-sm bg-blue-50 border-r">
                  Documents
                </button>
                <button className="flex-1 text-gray-500 hover:text-gray-700 transition-colors py-3 px-4 text-sm">
                  Associates
                </button>
              </div>
            </div>

            {/* Files section */}
            <div className="p-4 border-b">
              <div className="flex items-center space-x-2 mb-4">
                <button className="bg-[#355e66] text-white px-3 py-1.5 rounded text-sm flex items-center hover:bg-[#2a4d54] transition-colors">
                  <span className="mr-2">+</span> Files
                </button>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Search files..."
                    className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-[#355e66] focus:border-transparent"
                  />
                  <svg
                    className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 transform -translate-y-1/2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 p-2 hover:bg-white rounded transition-colors cursor-pointer justify-start">
                  <div
                    className={`w-8 h-8 bg-red-100 rounded flex items-center justify-center`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      aria-label="PDF"
                      role="img"
                      viewBox="0 0 512 512"
                      fill="#000000"
                    >
                      <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                      <g
                        id="SVGRepo_tracerCarrier"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      ></g>
                      <g id="SVGRepo_iconCarrier">
                        <rect
                          width="512"
                          height="512"
                          rx="15%"
                          fill="#c80a0a"
                        ></rect>
                        <path
                          fill="#ffffff"
                          d="M413 302c-9-10-29-15-56-15-16 0-33 2-53 5a252 252 0 0 1-52-69c10-30 17-59 17-81 0-17-6-44-30-44-7 0-13 4-17 10-10 18-6 58 13 100a898 898 0 0 1-50 117c-53 22-88 46-91 65-2 9 4 24 25 24 31 0 65-45 91-91a626 626 0 0 1 92-24c38 33 71 38 87 38 32 0 35-23 24-35zM227 111c8-12 26-8 26 16 0 16-5 42-15 72-18-42-18-75-11-88zM100 391c3-16 33-38 80-57-26 44-52 72-68 72-10 0-13-9-12-15zm197-98a574 574 0 0 0-83 22 453 453 0 0 0 36-84 327 327 0 0 0 47 62zm13 4c32-5 59-4 71-2 29 6 19 41-13 33-23-5-42-18-58-31z"
                        ></path>
                      </g>
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">
                      Employee Onboarding.PDF
                    </div>
                    <div className="text-xs text-gray-500 text-start">
                      "View File"
                    </div>
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-2 p-2 hover:bg-white rounded transition-colors cursor-pointer justify-start ">
                  <div
                    className={`w-8 h-8  rounded flex items-center justify-center`}
                  >
                    <svg
                      fill="#3373c7"
                      version="1.1"
                      id="Capa_1"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 548.29 548.291"
                    >
                      <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                      <g
                        id="SVGRepo_tracerCarrier"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      ></g>
                      <g id="SVGRepo_iconCarrier">
                        {" "}
                        <g>
                          {" "}
                          <path d="M486.2,196.124h-13.164V132.59c0-0.396-0.064-0.795-0.116-1.196c-0.021-2.523-0.824-5-2.551-6.963L364.656,3.677 c-0.031-0.031-0.064-0.042-0.085-0.075c-0.629-0.704-1.364-1.29-2.141-1.796c-0.231-0.154-0.462-0.283-0.704-0.418 c-0.672-0.366-1.386-0.671-2.121-0.892c-0.199-0.055-0.377-0.134-0.576-0.188C358.229,0.118,357.4,0,356.562,0H96.757 C84.893,0,75.256,9.649,75.256,21.502v174.616H62.093c-16.972,0-30.733,13.753-30.733,30.73v159.812 c0,16.961,13.761,30.731,30.733,30.731h13.163V526.79c0,11.854,9.637,21.501,21.501,21.501h354.777 c11.853,0,21.502-9.647,21.502-21.501V417.392H486.2c16.966,0,30.729-13.764,30.729-30.731V226.854 C516.93,209.872,503.166,196.124,486.2,196.124z M96.757,21.502h249.053v110.006c0,5.943,4.818,10.751,10.751,10.751h94.973v53.864 H96.757V21.502z M354.739,298.02c0,48.877-29.634,78.505-73.208,78.505c-44.229,0-70.106-33.392-70.106-75.849 c0-44.677,28.528-78.069,72.537-78.069C329.736,222.607,354.739,256.88,354.739,298.02z M64.345,373.432V227.037 c12.384-1.995,28.525-3.102,45.562-3.102c28.305,0,46.657,5.089,61.033,15.921c15.48,11.503,25.216,29.861,25.216,56.174 c0,28.53-10.392,48.21-24.764,60.373c-15.704,13.05-39.591,19.238-68.786,19.238C85.125,375.642,72.746,374.536,64.345,373.432z M451.534,520.962H96.757v-103.57h354.777V520.962z M453.16,348.447c10.174,0,21.455-2.223,28.085-4.867l5.093,26.315 c-6.196,3.108-20.127,6.409-38.258,6.409c-51.528,0-78.069-32.063-78.069-74.526c0-50.853,36.267-79.171,81.375-79.171 c17.47,0,30.751,3.538,36.726,6.638l-6.861,26.754c-6.851-2.872-16.362-5.531-28.309-5.531c-26.758,0-47.55,16.147-47.55,49.316 C405.387,329.642,423.082,348.447,453.16,348.447z"></path>{" "}
                          <path d="M160.322,297.137c0.221-30.968-17.917-47.331-46.88-47.331c-7.52,0-12.396,0.661-15.265,1.329v97.532 c2.868,0.665,7.52,0.665,11.724,0.665C140.417,349.548,160.322,332.739,160.322,297.137z"></path>{" "}
                          <path d="M247.032,300.004c0,29.202,13.714,49.765,36.269,49.765c22.782,0,35.827-21.68,35.827-50.646 c0-26.768-12.824-49.758-36.048-49.758C260.311,249.371,247.032,271.043,247.032,300.004z"></path>{" "}
                        </g>{" "}
                      </g>
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">
                      Standard Employment Contract v3.docx
                    </div>
                    <div className="text-xs text-start text-gray-500">
                      Start Editing
                    </div>
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-2 p-2 hover:bg-white rounded transition-colors cursor-pointer justify-start">
                  <div
                    className={`w-8 h-8  rounded flex items-center justify-center`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      aria-label="PDF"
                      role="img"
                      viewBox="0 0 512 512"
                      fill="#000000"
                    >
                      <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                      <g
                        id="SVGRepo_tracerCarrier"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      ></g>
                      <g id="SVGRepo_iconCarrier">
                        <rect
                          width="512"
                          height="512"
                          rx="15%"
                          fill="#c80a0a"
                        ></rect>
                        <path
                          fill="#ffffff"
                          d="M413 302c-9-10-29-15-56-15-16 0-33 2-53 5a252 252 0 0 1-52-69c10-30 17-59 17-81 0-17-6-44-30-44-7 0-13 4-17 10-10 18-6 58 13 100a898 898 0 0 1-50 117c-53 22-88 46-91 65-2 9 4 24 25 24 31 0 65-45 91-91a626 626 0 0 1 92-24c38 33 71 38 87 38 32 0 35-23 24-35zM227 111c8-12 26-8 26 16 0 16-5 42-15 72-18-42-18-75-11-88zM100 391c3-16 33-38 80-57-26 44-52 72-68 72-10 0-13-9-12-15zm197-98a574 574 0 0 0-83 22 453 453 0 0 0 36-84 327 327 0 0 0 47 62zm13 4c32-5 59-4 71-2 29 6 19 41-13 33-23-5-42-18-58-31z"
                        ></path>
                      </g>
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">
                      Group HR Policies.PDF
                    </div>
                    <div className="text-xs text-gray-500 text-start">
                      "View File"
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 hover:bg-white rounded transition-colors cursor-pointer justify-start">
                  <div
                    className={`w-8 h-8  rounded flex items-center justify-center`}
                  >
                    <svg
                      fill="#1d723b"
                      version="1.1"
                      id="Capa_1"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 58 58"
                      stroke="#1d723b"
                    >
                      <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                      <g
                        id="SVGRepo_tracerCarrier"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      ></g>
                      <g id="SVGRepo_iconCarrier">
                        {" "}
                        <g>
                          {" "}
                          <rect
                            x="14.5"
                            y="15"
                            width="8"
                            height="2"
                          ></rect>{" "}
                          <rect x="14.5" y="19" width="8" height="2"></rect>{" "}
                          <rect x="24.5" y="19" width="19" height="2"></rect>{" "}
                          <rect x="24.5" y="31" width="19" height="2"></rect>{" "}
                          <rect x="24.5" y="23" width="19" height="2"></rect>{" "}
                          <rect x="14.5" y="23" width="8" height="2"></rect>{" "}
                          <rect x="24.5" y="27" width="19" height="2"></rect>{" "}
                          <path d="M6.5,41v15c0,1.009,1.22,2,2.463,2h40.074c1.243,0,2.463-0.991,2.463-2V41H6.5z M23.936,54h-1.9l-1.6-3.801h-0.137 L18.576,54h-1.9l2.557-4.895l-2.721-5.182h1.873l1.777,4.102h0.137l1.928-4.102H24.1l-2.721,5.182L23.936,54z M32.672,54h-6.303 V43.924h1.668v8.832h4.635V54z M39.815,52.298c-0.15,0.342-0.362,0.643-0.636,0.902s-0.611,0.467-1.012,0.622 c-0.401,0.155-0.857,0.232-1.367,0.232c-0.219,0-0.444-0.012-0.677-0.034s-0.467-0.062-0.704-0.116 c-0.237-0.055-0.463-0.13-0.677-0.226c-0.214-0.096-0.399-0.212-0.554-0.349l0.287-1.176c0.127,0.073,0.289,0.144,0.485,0.212 c0.196,0.068,0.398,0.132,0.608,0.191c0.209,0.06,0.419,0.107,0.629,0.144c0.209,0.036,0.405,0.055,0.588,0.055 c0.556,0,0.982-0.13,1.278-0.39c0.296-0.26,0.444-0.645,0.444-1.155c0-0.31-0.105-0.574-0.314-0.793 c-0.21-0.219-0.472-0.417-0.786-0.595s-0.654-0.355-1.019-0.533c-0.365-0.178-0.707-0.388-1.025-0.629 c-0.319-0.241-0.583-0.526-0.793-0.854c-0.21-0.328-0.314-0.738-0.314-1.23c0-0.446,0.082-0.843,0.246-1.189 s0.385-0.641,0.663-0.882c0.278-0.241,0.602-0.426,0.971-0.554s0.759-0.191,1.169-0.191c0.419,0,0.843,0.039,1.271,0.116 c0.428,0.077,0.774,0.203,1.039,0.376c-0.055,0.118-0.119,0.248-0.191,0.39c-0.073,0.142-0.142,0.273-0.205,0.396 c-0.064,0.123-0.119,0.226-0.164,0.308c-0.046,0.082-0.073,0.128-0.082,0.137c-0.055-0.027-0.116-0.063-0.185-0.109 s-0.167-0.091-0.294-0.137c-0.128-0.046-0.296-0.077-0.506-0.096c-0.21-0.019-0.479-0.014-0.807,0.014 c-0.183,0.019-0.355,0.07-0.52,0.157s-0.31,0.193-0.438,0.321c-0.128,0.128-0.228,0.271-0.301,0.431 c-0.073,0.159-0.109,0.313-0.109,0.458c0,0.364,0.104,0.658,0.314,0.882c0.209,0.224,0.469,0.419,0.779,0.588 c0.31,0.169,0.647,0.333,1.012,0.492c0.364,0.159,0.704,0.354,1.019,0.581s0.576,0.513,0.786,0.854 c0.209,0.342,0.314,0.781,0.314,1.319C40.041,51.603,39.966,51.956,39.815,52.298z"></path>{" "}
                          <path d="M51.5,39V13.978c0-0.766-0.092-1.333-0.55-1.792L39.313,0.55C38.964,0.201,38.48,0,37.985,0H8.963 C7.777,0,6.5,0.916,6.5,2.926V39H51.5z M37.5,3.391c0-0.458,0.553-0.687,0.877-0.363l10.095,10.095 C48.796,13.447,48.567,14,48.109,14H37.5V3.391z M12.5,31v-2v-2v-2v-2v-2v-2v-2v-4h12v4h21v4v2v2v2v2v2v4h-21h-2h-10V31z"></path>{" "}
                          <rect x="14.5" y="27" width="8" height="2"></rect>{" "}
                          <rect x="14.5" y="31" width="8" height="2"></rect>{" "}
                        </g>{" "}
                      </g>
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">
                      Group HR Policies.PDF
                    </div>
                    <div className="text-xs text-gray-500 text-start">
                      "View File"
                    </div>
                  </div>
                </div>
             
              </div>
            </div>

            {/* Task completion - Static, always visible */}
            <div className="p-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="font-medium text-sm">1 Task Completed</div>
                  <div className="text-xs text-gray-500">
                    Document created successfully
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <button className="flex-1 bg-[#355e66] text-white py-2 px-3 rounded text-sm hover:bg-[#2a4d54] transition-colors">
                  View Task
                </button>
                <button className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors">
                  Restart
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimatedLegalInterface;
