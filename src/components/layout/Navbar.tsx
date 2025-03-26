'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Sparkles, Menu, X, ChevronDown, ChevronRight } from 'lucide-react'

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [lawFirmDropdownOpen, setLawFirmDropdownOpen] = useState(false)
  const router = useRouter()

  // Handle navbar transparency on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu when resizing to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
      isScrolled || isOpen ? 'bg-white shadow-sm' : 'bg-transparent'
    }`}>
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="md:hidden">
          <Image src="/images/logo.png" alt="wakilichat" width={140} height={52} />
        </Link>

        {/* Mobile menu button */}
        <button 
          className="md:hidden z-50 text-gray-800 focus:outline-none"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center justify-between flex-grow mx-auto">
        <Link href="/">
          <Image src="/images/logo.png" alt="wakilichat" width={140} height={52} />
        </Link>

          <nav className="flex space-x-6">
            
            <div className="relative group">
              <Link href="/register" className="font-semibold text-lg text-gray-800 hover:text-green-600 flex items-center">
                AI Assistant
                <Sparkles className="ml-1 w-4 h-4" />
              </Link>
            </div>
            <div className="relative group">
              <Link href="/register" className="font-semibold text-lg text-gray-800 hover:text-green-600 flex items-center">
                Document Vault
             
              </Link>
            </div>
            <div className="relative group">
              <Link href="/register" className="font-semibold text-lg text-gray-800 hover:text-green-600 flex items-center">
                Workflows
       
              </Link>
            </div>
            <div className="relative group">
              <Link href="/register" className="font-semibold text-lg text-gray-800 hover:text-green-600 flex items-center">
                Integrations
                
              </Link>
            </div>
            <div className="relative group">
              <Link href="/register" className="font-semibold text-lg text-gray-800 hover:text-green-600 flex items-center">
                Security
              </Link>
            </div>
            <Link href="/Pricing" className="font-semibold text-lg text-gray-800 hover:text-green-600 flex items-center border-b-solid border-b-2 border-yellow-400">
              Pricing
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <Link href="/login" className="font-medium text-gray-800 hover:text-green-600 border border-gray-300 rounded-md py-2 px-4">
              Sign in
            </Link>
            <Link
              href="/register"
              className="font-medium text-white bg-[#005c4d] hover:bg-yellow-600 rounded-md py-2 px-4"
            >
              Book A Demo
            </Link>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`fixed inset-0 bg-white z-40 transform transition-transform duration-300 ease-in-out ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          } md:hidden`}
        >
          <div className="container mx-auto px-4 pt-20 pb-6 h-full overflow-y-auto">
            <nav className="flex flex-col space-y-6">
            <Link
                href="/register"
                className="font-semibold text-lg text-gray-800 hover:text-green-600 py-2 flex items-center border-b border-gray-100"
                onClick={() => setIsOpen(false)}
              >
                AI Assistant
                <Sparkles className="ml-2 w-4 h-4" />
              </Link>
              <Link
                href="/register"
                className="font-semibold text-lg text-gray-800 hover:text-green-600 py-2 border-b border-gray-100"
                onClick={() => setIsOpen(false)}
              >
                Document Vault
              </Link>
              <Link
                href="/register"
                className="font-semibold text-lg text-gray-800 hover:text-green-600 py-2 border-b border-gray-100"
                onClick={() => setIsOpen(false)}
              >
                Workflows
              </Link>
              <Link
                href="/register"
                className="font-semibold text-lg text-gray-800 hover:text-green-600 py-2 border-b border-gray-100"
                onClick={() => setIsOpen(false)}
              >
                Integrations
              </Link>
              <Link
                href="/register"
                className="font-semibold text-lg text-gray-800 hover:text-green-600 py-2 border-b border-gray-100"
                onClick={() => setIsOpen(false)}
              >
                Security
              </Link>
              <Link
                href="/register"
                className="font-semibold text-lg text-gray-800 hover:text-green-600 py-2  border-gray-100 border-b-yellow-400 border-b-2"
                onClick={() => setIsOpen(false)}
              >
                Pricing
              </Link>
           

              <div className="pt-6 flex flex-col space-y-4">
                <Link
                  href="/login"
                  className="font-medium text-gray-800 hover:text-green-600 border border-gray-300 rounded-md py-3 px-4 text-center"
                  onClick={() => setIsOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="font-medium text-white bg-[#005c4d] hover:bg-yellow-600 rounded-md py-3 px-4 text-center"
                  onClick={() => setIsOpen(false)}
                >
                  Book a demo
                </Link>
              </div>
            </nav>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar