// components/dashboard/welcome-banner.tsx
"use client";
import { useSession } from "next-auth/react";

export default function WelcomeBanner() {
  const { data: session } = useSession();
  return (
    <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg p-6">
    <div className="flex justify-between items-start">
      <div>
        <div className="flex items-centeer gap-2">
          <img src="/c.png" className="w-8 h- object-contain"/>
            <h1 className="text-2xl text-black">
          Welcome Back, {session?.user?.name?.split(" ")[0] || "Wakili"}
        </h1>

        </div>
      
        <p className="text-primary text-4xl mt-1 text-black">
          What are you working on today?
        </p>
      </div>
    </div>
  </div>
  );
}