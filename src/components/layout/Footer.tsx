'use client'

import Image from "next/image";

const Footer = () => {
    return ( 
        <footer className="bg-primary shadow">
    <div className="w-full max-w-screen-xl mx-auto p-4 md:py-8">
        <div className="sm:flex sm:items-center sm:justify-between">
            <a href="/" className="flex items-center mb-4 sm:mb-0 space-x-3 rtl:space-x-reverse" aria-label="chat with a lawyer">
                <Image src="/images/logo-dark.png" height={60} width={210} alt="Logo" className="w-auto h-15 object-contain" />
            </a>
            <ul className="flex flex-wrap items-center mb-6 text-sm font-medium text-white sm:mb-0 gap-2">
            <li>
                    <a href="/ai-legal-research" className="hover:underline px-3 py-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded" aria-label="Navigate to AI Assistant section">AI Assistant</a>
                </li>
                <li>
                    <a href="/#document-vault" className="hover:underline px-3 py-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded" aria-label="Navigate to Document Vault section">Document Vault</a>
                </li>
              
                <li>
                    <a href="/#workflows" className="hover:underline px-3 py-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded" aria-label="Navigate to Workflows section">Workflows</a>
                </li>
                <li>
                    <a href="/blogs" className="hover:underline px-3 py-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded" aria-label="Navigate to Integrations section">Blogs</a>
                </li>
                <li>
                    <a href="mailto:law@wansom.ai" className="hover:underline px-3 py-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded" aria-label="Contact us via email at law@wansom.ai">law@wansom.ai</a>
                </li>
                <li>
                <div className="ml-2 flex items-center gap-3">
          <a href="https://www.linkedin.com/company/wansom-ai" target="_blank" aria-label="Visit our LinkedIn page" className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded hover:bg-white/10 transition-colors">
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

          <a href="https://x.com/wansom_ai" target="_blank" aria-label="Visit our X (Twitter) page" className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded hover:bg-white/10 transition-colors">
          <svg className="w-6 h-6" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M36.6526 3.8078H43.3995L28.6594 20.6548L46 43.5797H32.4225L21.7881 29.6759L9.61989 43.5797H2.86886L18.6349 25.56L2 3.8078H15.9222L25.5348 16.5165L36.6526 3.8078ZM34.2846 39.5414H38.0232L13.8908 7.63406H9.87892L34.2846 39.5414Z" fill="white" />
          </svg></a>
        </div>
                </li>
            </ul>
        </div>
        <hr className="my-6 border-gray-200 sm:mx-auto dark:border-gray-700 lg:my-8" />
        <span className="block text-sm text-white text-center">© {new Date().getFullYear()} <a href="/" className="hover:underline" aria-label="visit our home page">wansom</a>. All Rights Reserved.</span>
    </div>
</footer>
     );
}
 
export default Footer;