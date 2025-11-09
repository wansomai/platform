'use client'

import Image from "next/image";
import Link from "next/link";

const Footer = () => {
    const aiPlatformItems = [
        { name: 'AI Assistant', href: '/ai-legal-research' },
        { name: 'Legal Drafting', href: '/ai-legal-drafting' },
        { name: 'Document Reviews', href: '/ai-contract-review' },
        { name: 'Document Vault', href: '/document-vault' },
        { name: 'Workflows', href: '/#workflows' },
        { name: 'Knowledge Base', href: '/#knowledge-base' },
    ]

    const solutions = [
        { name: 'In-house counsels', href: '/solutions/in-house-counsel' },
        { name: 'Litigation Lawyers', href: '/solutions/litigation-lawyers' },
        { name: 'M&A Lawyers', href: '/solutions/ma-lawyers' },
    ]

    const resources = [
        { name: 'Articles', href: '/blogs' },
        { name: 'Newsletters', href: 'https://www.linkedin.com/newsletters/beyond-chatbots-legal-ai-7336011285697904642/' },
    ]

    const programs = [
        { name: 'Law Schools', href: '/programs/law-schools' },
    ]

    const company = [
        { name: 'Security', href: '/#security' },
        { name: 'Book A Demo', href: '/demo' },
        { name: 'Privacy Policy', href: '/privacy-policy' },
        { name: 'Terms of Service', href: '/terms-of-service' },
    ]

    return (
        <footer className="bg-primary shadow">
            <div className="w-full container mx-auto p-6 md:py-12">
                {/* Main Footer Content */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-8">
                    {/* Logo and Description */}
                    <div className="col-span-2 md:col-span-3 lg:col-span-2">
                        <Link href="/" className="flex items-center mb-4" aria-label="Wansom AI Home">
                            <Image src="/images/logo-dark.png" height={60} width={210} alt="Wansom AI Logo" className="w-auto h-15 object-contain" />
                        </Link>
                        <p className="text-white/80 text-sm mb-4 max-w-xs">
                            AI-powered legal platform for modern law firms and in-house legal teams.
                        </p>

                        {/* Social Media Links */}
                        <div className="flex items-center gap-3">
                            <a href="https://www.linkedin.com/company/wansom-ai" target="_blank" rel="noopener noreferrer" aria-label="Visit our LinkedIn page" className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded hover:bg-white/10 transition-colors">
                                <svg className="w-6 h-6" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                    <g clipPath="url(#clip0_17_68)">
                                        <path d="M44.4469 0H3.54375C1.58437 0 0 1.54688 0 3.45938V44.5312C0 46.4437 1.58437 48 3.54375 48H44.4469C46.4062 48 48 46.4438 48 44.5406V3.45938C48 1.54688 46.4062 0 44.4469 0ZM14.2406 40.9031H7.11563V17.9906H14.2406V40.9031ZM10.6781 14.8688C8.39062 14.8688 6.54375 13.0219 6.54375 10.7437C6.54375 8.46562 8.39062 6.61875 10.6781 6.61875C12.9563 6.61875 14.8031 8.46562 14.8031 10.7437C14.8031 13.0125 12.9563 14.8688 10.6781 14.8688ZM40.9031 40.9031H33.7875V29.7656C33.7875 27.1125 33.7406 23.6906 30.0844 23.6906C26.3812 23.6906 25.8187 26.5875 25.8187 29.5781V40.9031H18.7125V17.9906H25.5375V21.1219H25.6312C26.5781 19.3219 28.9031 17.4188 32.3625 17.4188C39.5719 17.4188 40.9031 22.1625 40.9031 28.3313V40.9031Z" fill="white" />
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_17_68">
                                            <rect width="48" height="48" fill="white" />
                                        </clipPath>
                                    </defs>
                                </svg>
                            </a>

                            <a href="https://x.com/wansom_ai" target="_blank" rel="noopener noreferrer" aria-label="Visit our X (Twitter) page" className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded hover:bg-white/10 transition-colors">
                                <svg className="w-6 h-6" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                    <path d="M36.6526 3.8078H43.3995L28.6594 20.6548L46 43.5797H32.4225L21.7881 29.6759L9.61989 43.5797H2.86886L18.6349 25.56L2 3.8078H15.9222L25.5348 16.5165L36.6526 3.8078ZM34.2846 39.5414H38.0232L13.8908 7.63406H9.87892L34.2846 39.5414Z" fill="white" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    {/* AI Platform */}
                    <div className="col-span-1">
                        <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">AI Platform</h3>
                        <ul className="space-y-2">
                            {aiPlatformItems.map((item, index) => (
                                <li key={index}>
                                    <Link href={item.href} className="text-white/80 hover:text-white text-sm transition-colors">
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Solutions */}
                    <div className="col-span-1">
                        <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Solutions For</h3>
                        <ul className="space-y-2">
                            {solutions.map((item, index) => (
                                <li key={index}>
                                    <Link href={item.href} className="text-white/80 hover:text-white text-sm transition-colors">
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                                {programs.map((item, index) => (
                                <li key={index}>
                                    <Link href={item.href} className="text-white/80 hover:text-white text-sm transition-colors">
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Resources */}
                    <div className="col-span-1">
                        <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Resources</h3>
                        <ul className="space-y-2">
                            {resources.map((item, index) => (
                                <li key={index}>
                                    <Link href={item.href} className="text-white/80 hover:text-white text-sm transition-colors" target={item.href.startsWith('http') ? '_blank' : undefined} rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}>
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company (Programs + Legal) */}
                    <div className="col-span-1">
                        <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Company</h3>
                        <ul className="space-y-2">
                        
                            {company.map((item, index) => (
                                <li key={index}>
                                    <Link href={item.href} className="text-white/80 hover:text-white text-sm transition-colors">
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Contact Section */}
                <div className="mb-6">
                    <p className="text-white/80 text-sm">
                        Contact us: <a href="mailto:law@wansom.ai" className="text-white hover:underline">law@wansom.ai</a>
                    </p>
                </div>

                {/* Divider */}
                <hr className="my-6 border-white/20" />

                {/* Copyright */}
                <div className="text-center">
                    <span className="text-sm text-white/80">
                        © {new Date().getFullYear()} <Link href="/" className="hover:underline text-white" aria-label="visit our home page">Wansom AI</Link>. All Rights Reserved.
                    </span>
                </div>
            </div>
        </footer>
     );
}

export default Footer;