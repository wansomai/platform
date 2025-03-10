'use client'

import Image from "next/image";

const Footer = () => {
    return ( 
        <footer className="bg-primary rounded-lg shadow">
    <div className="w-full max-w-screen-xl mx-auto p-4 md:py-8">
        <div className="sm:flex sm:items-center sm:justify-between">
            <a href="/" className="flex items-center mb-4 sm:mb-0 space-x-3 rtl:space-x-reverse" aria-label="chat with a lawyer">
                <Image src="/images/logo-light.png" height={150} width={150} alt="Logo" />
            </a>
            <ul className="flex flex-wrap items-center mb-6 text-sm font-medium text-white sm:mb-0">
            <li>
                    <a href="/register" className="hover:underline me-4 md:me-6" aria-label=" try evacare for business">AI Assistant</a>
                </li>
                <li>
                    <a href="/hire-a-lawyer" className="hover:underline me-4 md:me-6" aria-label=" try evacare for business">Hire A lawyer</a>
                </li>
                {/* <li>
                    <a href="/legal-documents" className="hover:underline me-4 md:me-6" aria-label="try evacare for individuals">Legal Documents</a>
                </li> */}
                <li>
                    <a href="/register" className="hover:underline  me-4 md:me-6" aria-label="contact our support team">For Lawfirms</a>
                </li>
                <li>
                    <a href="/register" className="hover:underline  me-4 md:me-6" aria-label="contact our support team">For Lawyers</a>
                </li>
                <li>
                <div className=" ml-2 flex items-center gap-2">
          <a href="https://www.linkedin.com/company/wakili-chat" target="blank" aria-label="visit our linkedin page">
          <svg className="w-6 h-6" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clip-path="url(#clip0_17_68)">
              <path d="M44.4469 0H3.54375C1.58437 0 0 1.54688 0 3.45938V44.5312C0 46.4437 1.58437 48 3.54375 48H44.4469C46.4062 48 48 46.4438 48 44.5406V3.45938C48 1.54688 46.4062 0 44.4469 0ZM14.2406 40.9031H7.11563V17.9906H14.2406V40.9031ZM10.6781 14.8688C8.39062 14.8688 6.54375 13.0219 6.54375 10.7437C6.54375 8.46562 8.39062 6.61875 10.6781 6.61875C12.9563 6.61875 14.8031 8.46562 14.8031 10.7437C14.8031 13.0125 12.9563 14.8688 10.6781 14.8688ZM40.9031 40.9031H33.7875V29.7656C33.7875 27.1125 33.7406 23.6906 30.0844 23.6906C26.3812 23.6906 25.8187 26.5875 25.8187 29.5781V40.9031H18.7125V17.9906H25.5375V21.1219H25.6312C26.5781 19.3219 28.9031 17.4188 32.3625 17.4188C39.5719 17.4188 40.9031 22.1625 40.9031 28.3313V40.9031Z" fill="white" />
            </g>
            <defs>
              <clipPath id="clip0_17_68">
                <rect width="48" height="48" fill="white" />
              </clipPath>
            </defs>
          </svg>
          </a>

          <a href="https://x.com/wakilichat" target="blank" aria-label="visit our twitter page">   <svg className="w-6 h-6" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M36.6526 3.8078H43.3995L28.6594 20.6548L46 43.5797H32.4225L21.7881 29.6759L9.61989 43.5797H2.86886L18.6349 25.56L2 3.8078H15.9222L25.5348 16.5165L36.6526 3.8078ZM34.2846 39.5414H38.0232L13.8908 7.63406H9.87892L34.2846 39.5414Z" fill="white" />
          </svg></a>
          <a href="https://www.linkedin.com/company/wakili-chat" target="blank" aria-label="visit our instagram page">
            
          <svg className="w-6 h-6" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M34 4H14C8.47715 4 4 8.47715 4 14V34C4 39.5228 8.47715 44 14 44H34C39.5228 44 44 39.5228 44 34V14C44 8.47715 39.5228 4 34 4ZM40 34C40 37.3137 37.3137 40 34 40H14C10.6863 40 8 37.3137 8 34V14C8 10.6863 10.6863 8 14 8H34C37.3137 8 40 10.6863 40 14V34ZM24 15C19.0294 15 15 19.0294 15 24C15 28.9706 19.0294 33 24 33C28.9706 33 33 28.9706 33 24C33 19.0294 28.9706 15 24 15ZM24 29C21.2386 29 19 26.7614 19 24C19 21.2386 21.2386 19 24 19C26.7614 19 29 21.2386 29 24C29 26.7614 26.7614 29 24 29ZM35 11C34.4477 11 34 11.4477 34 12C34 12.5523 34.4477 13 35 13C35.5523 13 36 12.5523 36 12C36 11.4477 35.5523 11 35 11Z" fill="white"/>
          </svg>
          </a>
          
         
        
        
        </div>
                </li>
            </ul>
        </div>
        <hr className="my-6 border-gray-200 sm:mx-auto dark:border-gray-700 lg:my-8" />
        <span className="block text-sm text-white text-center">© {new Date().getFullYear()} <a href="/" className="hover:underline" aria-label="visit our home page">WakiliChat</a>. All Rights Reserved.</span>
    </div>
</footer>
     );
}
 
export default Footer;