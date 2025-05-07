import React from "react";
import dynamic from "next/dynamic";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const CalendlyWidget = dynamic(
  () => import("../../components/home/CalendlyWidget")
);

const BookingPage = () => {
  return (
    <div className="">
      <Navbar />
      <div className="w-full max-w-4xl mx-auto   rounded-lg p-6 mt-10 ">
        <div className="flex justify-center h-fit bg-green-50 rounded-lg">
          <CalendlyWidget />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default BookingPage;
