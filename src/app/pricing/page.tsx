
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
            <PricingSection/>
            <Footer/>
        </div>
    );
};

export default PricingPage;