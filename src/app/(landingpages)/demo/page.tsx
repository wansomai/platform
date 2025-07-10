import React from "react";
import dynamic from "next/dynamic";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const CalendlyWidget = dynamic(
  () => import("../../../components/home/CalendlyWidget")
);

const BookingPage = () => {
  return (
    <div className="bg-primary min-h-screen">
      <Navbar />
      <div className="w-full max-w-4xl mx-auto   rounded-lg p-6  ">
        <div className="flex justify-center h-fit rounded-lg">
          <CalendlyWidget />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default BookingPage;
