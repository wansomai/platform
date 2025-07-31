// components/dashboard/welcome-banner.tsx
"use client";
import { useSession } from "next-auth/react";

export default function WelcomeBanner() {
  const { data: session } = useSession();
  return (
    <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg shadow-md p-6">
    <div className="flex justify-between items-start">
      <div>
        <h1 className="text-5xl text-black">
          Welcome Back, {session?.user?.name?.split(" ")[0] || "Wakili"}
        </h1>
        <p className="text-primary-100 mt-1 text-black">
          Here's what's happening across your legal workspace
        </p>
      </div>
    </div>
  </div>
  );
}