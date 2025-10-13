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
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [mobileDropdowns, setMobileDropdowns] = useState({
    aiPlatform: false,
    solutions: false,
    resources: false,
    programs: false
  })

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
        setActiveDropdown(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const aiPlatformItems = [
    { name: 'AI Assistant', href: '/ai-legal-research' },
    { name: 'Legal Drafting', href: '/ai-legal-drafting' },
    { name: 'Document Reviews', href: '/ai-contract-review' },
    { name: 'Document Vault', href: '/document-vault' },
     { name: 'Workflows', href: '/#workflows' },
    { name: 'Knowledge Base', href: '/#knowledge-base' },
  ]
    const solutions = [
    { name: 'In-house counsels ', href: '/solutions/in-house-counsel' },
    { name: 'Litigation Lawyers', href: '/solutions/litigation-lawyers' },
    { name: 'M&A Lawyers', href: '/solutions/ma-lawyers' },
    // { name: 'Judiciary & Courts', href: '/ai-due-diligence' },
 
  ]
      const resources = [
    { name: 'Articles ', href: '/blogs' },
    // { name: 'Legal Templates', href: '/legal-documents' },
    { name: 'Newsletters', href: 'https://www.linkedin.com/newsletters/beyond-chatbots-legal-ai-7336011285697904642/' },
    //  { name: 'Priduct Guides', href: '/ai-contract-review' },
    // { name: 'Events', href: '/ai-due-diligence' },
  ]
     const Programs = [
    { name: 'Student Program', href: '/programs/law-schools' },
    // { name: 'Research Program  ', href: '/ai-legal-research' },
    // { name: 'Wansom Ambassador', href: '/ai-contract-review' },
  ]

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
      isScrolled || isOpen||darkmode ? 'bg-primary shadow-sm backdrop-filter lg:backdrop-blur-lg  text-white bg-opacity-40' : 'bg-transparent text-white'
    }`}>
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="md:hidden">
          <Image src={darkmode ? `/logo-lg.png` : `/images/logo-dark.png`} alt="wansom ai" width={140} height={40} className="w-auto h-10 object-contain" />
        </Link>

        {/* Mobile menu button */}
        <button 
          className={`md:hidden z-50  focus:outline-none transition-transform duration-300 ${darkmode ? 'text-black' : 'text-white'}`}
          onClick={() => setIsOpen(!isOpen)}  aria-label="Mobile menu"
        >
          {isOpen ? <X className='text-black' size={24} /> : <Menu size={24} />}
        </button>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center justify-between flex-grow mx-auto">
        <Link href="/">
          <Image src={ `/images/logo-dark.png`} alt="wansom ai" width={140} height={40} className="w-auto h-10 object-contain" />
        </Link>

          <nav className="flex space-x-6">

            {/* AI Platform Dropdown */}
            <div className="relative dropdown-container">
              <button
                className="font-semibold text-lg flex items-center hover:text-[#F18F01] hover:underline hover:underline-offset-8 focus:outline-none"
                onClick={() => setActiveDropdown(activeDropdown === 'aiPlatform' ? null : 'aiPlatform')}
                onMouseEnter={() => setActiveDropdown('aiPlatform')}
              >
                AI Platform
                <ChevronDown className={`ml-1 w-5 h-5 transition-transform duration-200 ${activeDropdown === 'aiPlatform' ? 'rotate-180' : ''}`} />
              </button>

              <div
                className={`absolute top-full left-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 transition-all duration-200 ${
                  activeDropdown === 'aiPlatform' ? 'opacity-100 visible transform translate-y-0' : 'opacity-0 invisible transform -translate-y-2'
                }`}
                onMouseEnter={() => setActiveDropdown('aiPlatform')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                {aiPlatformItems.map((item, index) => (
                  <Link
                    key={index}
                    href={item.href}
                    className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#355e66] transition-colors duration-150 first:rounded-t-md last:rounded-b-md"
                    onClick={() => setActiveDropdown(null)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Solutions Dropdown */}
            <div className="relative dropdown-container">
              <button
                className="font-semibold text-lg flex items-center hover:text-[#F18F01] hover:underline hover:underline-offset-8 focus:outline-none"
                onClick={() => setActiveDropdown(activeDropdown === 'solutions' ? null : 'solutions')}
                onMouseEnter={() => setActiveDropdown('solutions')}
              >
                Solutions For
                <ChevronDown className={`ml-1 w-5 h-5 transition-transform duration-200 ${activeDropdown === 'solutions' ? 'rotate-180' : ''}`} />
              </button>

              <div
                className={`absolute top-full left-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 transition-all duration-200 ${
                  activeDropdown === 'solutions' ? 'opacity-100 visible transform translate-y-0' : 'opacity-0 invisible transform -translate-y-2'
                }`}
                onMouseEnter={() => setActiveDropdown('solutions')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                {solutions.map((item, index) => (
                  <Link
                    key={index}
                    href={item.href}
                    className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#355e66] transition-colors duration-150 first:rounded-t-md last:rounded-b-md"
                    onClick={() => setActiveDropdown(null)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Resources Dropdown */}
            <div className="relative dropdown-container">
              <button
                className="font-semibold text-lg flex items-center hover:text-[#F18F01] hover:underline hover:underline-offset-8 focus:outline-none"
                onClick={() => setActiveDropdown(activeDropdown === 'resources' ? null : 'resources')}
                onMouseEnter={() => setActiveDropdown('resources')}
              >
                Resources
                <ChevronDown className={`ml-1 w-5 h-5 transition-transform duration-200 ${activeDropdown === 'resources' ? 'rotate-180' : ''}`} />
              </button>

              <div
                className={`absolute top-full left-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 transition-all duration-200 ${
                  activeDropdown === 'resources' ? 'opacity-100 visible transform translate-y-0' : 'opacity-0 invisible transform -translate-y-2'
                }`}
                onMouseEnter={() => setActiveDropdown('resources')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                {resources.map((item, index) => (
                  <Link
                    key={index}
                    href={item.href}
                    className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#355e66] transition-colors duration-150 first:rounded-t-md last:rounded-b-md"
                    onClick={() => setActiveDropdown(null)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Programs Dropdown */}
            <div className="relative dropdown-container">
              <button
                className="font-semibold text-lg flex items-center hover:text-[#F18F01] hover:underline hover:underline-offset-8 focus:outline-none"
                onClick={() => setActiveDropdown(activeDropdown === 'programs' ? null : 'programs')}
                onMouseEnter={() => setActiveDropdown('programs')}
              >
                Programs
                <ChevronDown className={`ml-1 w-5 h-5 transition-transform duration-200 ${activeDropdown === 'programs' ? 'rotate-180' : ''}`} />
              </button>

              <div
                className={`absolute top-full left-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 transition-all duration-200 ${
                  activeDropdown === 'programs' ? 'opacity-100 visible transform translate-y-0' : 'opacity-0 invisible transform -translate-y-2'
                }`}
                onMouseEnter={() => setActiveDropdown('programs')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                {Programs.map((item, index) => (
                  <Link
                    key={index}
                    href={item.href}
                    className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#355e66] transition-colors duration-150 first:rounded-t-md last:rounded-b-md"
                    onClick={() => setActiveDropdown(null)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Security Link */}
            <Link href="/#security" className="font-semibold text-lg flex items-center hover:text-[#F18F01] hover:underline hover:underline-offset-8">
              Security
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <Link href="/demo" className="font-medium text-white hover:text-[#F18F01]  border border-gray-300 rounded-md py-2 px-4">
              Schedule a Demo
            </Link>
            <Link
              href="/login"
              className="font-medium text-white bg-black hover:bg-[#2a4d54] rounded-md py-2 px-4"
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
            <nav className="flex flex-col space-y-2">

              {/* Mobile AI Platform Dropdown */}
              <div className="border-b border-gray-100">
                <button
                  onClick={() => setMobileDropdowns(prev => ({ ...prev, aiPlatform: !prev.aiPlatform }))}
                  className="w-full font-semibold text-lg text-gray-800 py-3 flex items-center justify-between"
                >
                  <span className="flex items-center">
                    AI Platform
                    <Sparkles className="ml-2 w-4 h-4" />
                  </span>
                  <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${mobileDropdowns.aiPlatform ? 'rotate-180' : ''}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${mobileDropdowns.aiPlatform ? 'max-h-96 pb-2' : 'max-h-0'}`}>
                  <div className="ml-6">
                    {aiPlatformItems.map((item, index) => (
                      <Link
                        key={index}
                        href={item.href}
                        className="block py-2 text-sm text-gray-600 hover:text-[#355e66]"
                        onClick={() => setIsOpen(false)}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mobile Solutions Dropdown */}
              <div className="border-b border-gray-100">
                <button
                  onClick={() => setMobileDropdowns(prev => ({ ...prev, solutions: !prev.solutions }))}
                  className="w-full font-semibold text-lg text-gray-800 py-3 flex items-center justify-between"
                >
                  <span>Solutions For</span>
                  <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${mobileDropdowns.solutions ? 'rotate-180' : ''}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${mobileDropdowns.solutions ? 'max-h-96 pb-2' : 'max-h-0'}`}>
                  <div className="ml-6">
                    {solutions.map((item, index) => (
                      <Link
                        key={index}
                        href={item.href}
                        className="block py-2 text-sm text-gray-600 hover:text-[#355e66]"
                        onClick={() => setIsOpen(false)}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mobile Resources Dropdown */}
              <div className="border-b border-gray-100">
                <button
                  onClick={() => setMobileDropdowns(prev => ({ ...prev, resources: !prev.resources }))}
                  className="w-full font-semibold text-lg text-gray-800 py-3 flex items-center justify-between"
                >
                  <span>Resources</span>
                  <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${mobileDropdowns.resources ? 'rotate-180' : ''}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${mobileDropdowns.resources ? 'max-h-96 pb-2' : 'max-h-0'}`}>
                  <div className="ml-6">
                    {resources.map((item, index) => (
                      <Link
                        key={index}
                        href={item.href}
                        className="block py-2 text-sm text-gray-600 hover:text-[#355e66]"
                        onClick={() => setIsOpen(false)}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mobile Programs Dropdown */}
              <div className="border-b border-gray-100">
                <button
                  onClick={() => setMobileDropdowns(prev => ({ ...prev, programs: !prev.programs }))}
                  className="w-full font-semibold text-lg text-gray-800 py-3 flex items-center justify-between"
                >
                  <span>Programs</span>
                  <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${mobileDropdowns.programs ? 'rotate-180' : ''}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${mobileDropdowns.programs ? 'max-h-96 pb-2' : 'max-h-0'}`}>
                  <div className="ml-6">
                    {Programs.map((item, index) => (
                      <Link
                        key={index}
                        href={item.href}
                        className="block py-2 text-sm text-gray-600 hover:text-[#355e66]"
                        onClick={() => setIsOpen(false)}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Security Link */}
              <Link
                href="/#security"
                className="font-semibold text-lg text-gray-800 hover:text-[#355e66] py-3 border-b border-gray-100"
                onClick={() => setIsOpen(false)}
              >
                Security
              </Link>

              {/* CTA Buttons */}
              <div className="pt-6 flex flex-col space-y-4">
                <Link
                  href="/demo"
                  className="font-medium text-gray-800 hover:text-green-600 border border-gray-300 rounded-md py-3 px-4 text-center"
                  onClick={() => setIsOpen(false)}
                >
                  Schedule a Demo
                </Link>
                <Link
                  href="/login"
                  className="font-medium text-white bg-primary hover:bg-[#2a4d54] rounded-md py-3 px-4 text-center"
                  onClick={() => setIsOpen(false)}
                >
                  Start For Free
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