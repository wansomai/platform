import { partnerLogos } from "@/lib/data";
import Image from "next/image";

export const PatnerLogoSection = () => {

  return (
    <section className=" section-spacing">
           <div className="text-center">
          <h2 className="text-heading-2 mb-6 max-w-5xl mx-auto ">
            Powering Legal Success
          </h2>
          <p className="text-body-large text-gray-600 mb-8 max-w-3xl mx-auto capitalize">
           Join Leading Legal Teams streamlining their legal processes with wansom AI</p>
        </div>
      <div className="relative overflow-hidden min-h-[80px]">
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
                  sizes="(max-width: 768px) 120px, 160px"
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
                  sizes="(max-width: 768px) 120px, 160px"
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


const BrandLogos = () => {
  return ( 
    <section>
                      <div className="relative overflow-hidden min-h-[80px] my-2">
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
                                      sizes="(max-width: 768px) 120px, 160px"
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
                                      sizes="(max-width: 768px) 120px, 160px"
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
}
 
export default BrandLogos;