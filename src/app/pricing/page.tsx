
import Navbar from "@/components/layout/Navbar";
import PricingSection from "@/components/home/pricing";
import Footer from "@/components/layout/Footer";
import Head from "next/head";

const PricingPage = () => {
    return (
        <div>
            <Head>
            <title>Pricing-Wansom AI</title>
        <meta name="description" content="Legal AI Assistant pricing for wansom AI" />
        <meta name="keywords" content="pricing, legal ai,ai law,legal ai companies " />
        <meta property="og:title" content="Pricing-Wansom AI"/>
        <meta property="og:description" content="Legal AI Assistant pricing for wansom AI" />
        <meta property="og:image" content="/images/features-2.png" />
        <meta name="twitter:card" content="Legal AI Assistant pricing for wansom AI" />
        <meta name="twitter:title" content="Pricing-Wansom AI" />
        <meta name="twitter:description" content="Legal AI Assistant pricing for wansom AI" />
        <meta name="twitter:image"  content="/images/features-2.png"/>
            </Head>
            <Navbar/>
              <section className="pt-24 md:pt-32 lg:pt-40 overflow-hidden bg-[#355e66] bg-[url(/1.png)] bg-blend-multiply bg-cover">
         <div className="container mx-auto px-4 lg:px-8 py-12  text-white">
    <h1 className=" text-5xl mb-6 text-white">Our Pricing</h1>
              <div className=" text-sm  mb-5 ">
                Home / Pricing
              </div>
         </div>
     </section>
            <PricingSection/>
            <Footer/>
        </div>
    );
};

export default PricingPage;