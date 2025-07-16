'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Sparkles, Menu, X, ChevronDown } from 'lucide-react'

type NavbarProps = {
  darkmode?: boolean
}

const Navbar = ({ darkmode = false }: NavbarProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.dropdown-container')) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const aiPlatformItems = [
    { name: 'AI Search Profiles', href: '/ai-search' },
    { name: 'Legal Drafting', href: '/ai-legal-drafting' },
    { name: 'Deep Research', href: '/ai-legal-research' },
    { name: 'Due Diligence', href: '/ai-due-diligence' },
    { name: 'Contract Reviews', href: '/ai-contract-review' },
    { name: 'Case Preparation', href: '/ai-case-prediction' },
  ]

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
      isScrolled || isOpen ? 'bg-[#355e66] shadow-sm backdrop-filter lg:backdrop-blur-lg  text-white bg-opacity-40' : 'bg-transparent text-gray-300'
    }`}>
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="md:hidden">
          <Image src={darkmode ? `/logo-lg.png` : `/images/logo-dark.png`} alt="wansom ai" width={140} height={52} />
        </Link>

        {/* Mobile menu button */}
        <button 
          className={`md:hidden z-50  focus:outline-none transition-transform duration-300 ${darkmode ? 'text-black' : 'text-white'}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className='text-black' size={24} /> : <Menu size={24} />}
        </button>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center justify-between flex-grow mx-auto">
        <Link href="/">
          <Image src={darkmode ? `/logo-lg.png` : `/images/logo-dark.png`} alt="wansom ai" width={140} height={52} />
        </Link>

          <nav className="flex space-x-6 ">
            
            <div className="relative group dropdown-container">
              <button 
                className="font-semibold text-lg flex items-center hover:text-[#355e66]  focus:outline-none"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                onMouseEnter={() => setIsDropdownOpen(true)}
              >
                AI Platform
                <ChevronDown className={`ml-1 w-6 h-6 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Dropdown Menu */}
              <div 
                className={`absolute top-full left-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 transition-all duration-200 ${
                  isDropdownOpen ? 'opacity-100 visible transform translate-y-0' : 'opacity-0 invisible transform -translate-y-2'
                }`}
                onMouseEnter={() => setIsDropdownOpen(true)}
                onMouseLeave={() => setIsDropdownOpen(false)}
              >
                {aiPlatformItems.map((item, index) => (
                  <Link
                    key={index}
                    href={item.href}
                    className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#355e66]  transition-colors duration-150 first:rounded-t-md last:rounded-b-md"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="relative group">
              <Link href="/document-vault" className="font-semibold text-lg  flex items-center">
                Vault
             
              </Link>
            </div>
            <div className="relative group">
              <Link href="/#workflows" className="font-semibold text-lg  flex items-center">
                Workflows
       
              </Link>
            </div>
            <div className="relative group">
              <Link href="/#integrations" className="font-semibold text-lg  flex items-center">
                Integrations
                
              </Link>
            </div>
            <div className="relative group">
              <Link href="/#security" className="font-semibold text-lg flex items-center">
                Security
              </Link>
            </div>
            {/* <Link href="/#pricing" className="font-semibold text-lg text-gray-800 hover:text-green-600 flex items-center border-b-solid border-b-2 border-yellow-400">
              Pricing
            </Link> */}
          </nav>

          <div className="flex items-center space-x-4">
            <Link href="/demo" className="font-medium text-white hover:text-green-600 border border-gray-300 rounded-md py-2 px-4">
              Schedule a Demo
            </Link>
            <Link
              href="/login"
              className="font-medium text-white bg-secondary hover:bg-yellow-600 rounded-md py-2 px-4"
            >
              Start For Free
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
              
              {/* Mobile AI Platform Section */}
              <div className="border-b border-gray-100">
                <div className="font-semibold text-lg text-gray-800 py-2 flex items-center">
                  AI Platform
                  <Sparkles className="ml-2 w-4 h-4" />
                </div>
                <div className="ml-6 pb-2">
                  {aiPlatformItems.map((item, index) => (
                    <Link
                      key={index}
                      href={item.href}
                      className="block py-2 text-sm text-gray-600 hover:text-green-600"
                      onClick={() => setIsOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>

              <Link
                href="/#document-vault"
                className="font-semibold text-lg text-gray-800 hover:text-green-600 py-2 border-b border-gray-100"
                onClick={() => setIsOpen(false)}
              >
               Vault
              </Link>
              <Link
                href="/#workflows"
                className="font-semibold text-lg text-gray-800 hover:text-green-600 py-2 border-b border-gray-100"
                onClick={() => setIsOpen(false)}
              >
                Workflows
              </Link>
              <Link
                href="/#integrations"
                className="font-semibold text-lg text-gray-800 hover:text-green-600 py-2 border-b border-gray-100"
                onClick={() => setIsOpen(false)}
              >
                Integrations
              </Link>
              <Link
                href="/#security"
                className="font-semibold text-lg text-gray-800 hover:text-green-600 py-2 border-b border-gray-100"
                onClick={() => setIsOpen(false)}
              >
                Security
              </Link>
              {/* <Link
                href="/#pricing"
                className="font-semibold text-lg text-gray-800 hover:text-green-600 py-2  border-gray-100 border-b-yellow-400 border-b-2"
                onClick={() => setIsOpen(false)}
              >
                Pricing
              </Link> */}
           

              <div className="pt-6 flex flex-col space-y-4">
                <Link
                  href="/login"
                  className="font-medium text-gray-800 hover:text-green-600 border border-gray-300 rounded-md py-3 px-4 text-center"
                  onClick={() => setIsOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  href="/demo"
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