import Image from "next/image";

export const PatnerLogoSection = () => {
  const partnerLogos = [
    { src: "/logos/1.png", alt: "CM Advocates" },
    { src: "/logos/2.png", alt: "Akoth Odipo Advocates" },
    { src: "/logos/3.png", alt: "Cymelle Arttoneys" },
    { src: "/logos/4.png", alt: "Netsheria" },
    { src: "/logos/5.png", alt: "Partner Law Firm 5" },
    { src: "/logos/6.png", alt: "Bellmac consulting" },
    { src: "/logos/7.png", alt: "Riskhouse International" }
  ];

  return (
    <section className=" section-spacing">
           <div className="text-center">
          <h2 className="text-heading-2 mb-6 max-w-5xl mx-auto ">
            Powering Legal Success
          </h2>
          <p className="text-body-large text-gray-600 mb-8 max-w-3xl mx-auto capitalize">
           Join 3000+  lawyers buidling their digital presence with wansom AI search</p>
        </div>
      <div className="relative overflow-hidden">
        <div className="flex animate-scroll whitespace-nowrap">
          {/* First set of logos */}
          <div className="flex items-center space-x-12 md:space-x-16 lg:space-x-20 pr-12 md:pr-16 lg:pr-20">
            {partnerLogos.map((logo, index) => (
              <div key={index} className="flex-shrink-0 flex justify-center items-center min-w-[120px] md:min-w-[160px]">
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  width={160}
                  height={80}
                  className="h-12 md:h-16 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300 hover:scale-105"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
          
          {/* Duplicate set for seamless loop */}
          <div className="flex items-center space-x-12 md:space-x-16 lg:space-x-20 pr-12 md:pr-16 lg:pr-20">
            {partnerLogos.map((logo, index) => (
              <div key={`duplicate-${index}`} className="flex-shrink-0 flex justify-center items-center min-w-[120px] md:min-w-[160px]">
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  width={160}
                  height={80}
                  className="h-12 md:h-16 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300 hover:scale-105"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
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