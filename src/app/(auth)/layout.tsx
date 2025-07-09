import { ReactNode } from "react"
import Link from "next/link"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex flex-col min-h-screen">
       <Navbar darkmode/>
        
        <main className="flex-1 py-5 lg:py-0">
          {children}
        </main>
        
        <Footer/>
          
      </div>
    </div>
  )
}