"use client";

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const PrivacyPolicyContent = () => {
  return (
    <div className=" ">
      <Navbar darkmode/>
      <div className="container mx-auto max-w-8xl py-24 lg:px-24 px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
        <p className="text-sm text-gray-600 mb-8">
          <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <div className="prose prose-lg max-w-none">
          {/* Introduction */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 mb-4">
              Welcome to Wansom AI ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our legal AI platform and services (collectively, the "Services").
            </p>
            <p className="text-gray-700">
              By accessing or using our Services, you agree to the collection and use of information in accordance with this Privacy Policy. If you do not agree with our policies and practices, please do not use our Services.
            </p>
          </section>

          {/* Information We Collect */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">2.1 Personal Information You Provide</h3>
            <p className="text-gray-700 mb-3">We collect information that you voluntarily provide to us, including:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li><strong>Account Information:</strong> Name, email address, password, and organization details when you register for an account</li>
              <li><strong>Profile Information:</strong> Professional details, jurisdiction, practice areas, and other information you add to your profile</li>
              <li><strong>Communication Data:</strong> Information you provide when contacting our support team or communicating with us</li>
              <li><strong>Payment Information:</strong> Billing address and payment details (processed securely through third-party payment processors)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">2.2 Information Collected Automatically</h3>
            <p className="text-gray-700 mb-3">When you use our Services, we automatically collect:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li><strong>Usage Data:</strong> Your interactions with the Services, including AI queries, documents uploaded, features used, and time spent</li>
              <li><strong>Device Information:</strong> Device type, operating system, browser type, IP address, and unique device identifiers</li>
              <li><strong>Log Data:</strong> Server logs including access times, pages viewed, and referring URLs</li>
              <li><strong>Cookies and Similar Technologies:</strong> We use cookies, web beacons, and similar tracking technologies to collect information about your browsing activities</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">2.3 Content and Documents</h3>
            <p className="text-gray-700 mb-4">
              We collect and store the content you create, upload, or share through our Services, including:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Legal documents you upload or create</li>
              <li>Chat conversations with our AI assistant</li>
              <li>Projects and workspace data</li>
              <li>Annotations, notes, and comments</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">2.4 Third-Party Integrations</h3>
            <p className="text-gray-700 mb-4">
              When you connect third-party services to your account:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li><strong>Google Account:</strong> With your permission, we access your Google Calendar events, Gmail messages (read-only and draft composition), and basic profile information</li>
              <li><strong>OAuth Tokens:</strong> We securely store OAuth tokens to maintain these integrations</li>
              <li><strong>Third-Party Data:</strong> Information from integrated services as necessary to provide the requested functionality</li>
            </ul>
          </section>

          {/* How We Use Your Information */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 mb-3">We use the information we collect to:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li><strong>Provide Services:</strong> Operate, maintain, and improve our AI-powered legal platform</li>
              <li><strong>Process AI Requests:</strong> Analyze your queries and documents to provide AI-generated legal insights, drafts, and recommendations</li>
              <li><strong>Personalization:</strong> Customize your experience based on your jurisdiction, practice areas, and usage patterns</li>
              <li><strong>Communication:</strong> Send you service-related notifications, updates, security alerts, and support messages</li>
              <li><strong>Analytics:</strong> Understand how users interact with our Services to improve functionality and user experience</li>
              <li><strong>Security:</strong> Detect, prevent, and address technical issues, fraud, and unauthorized access</li>
              <li><strong>Legal Compliance:</strong> Comply with applicable laws, regulations, and legal processes</li>
              <li><strong>Marketing:</strong> Send promotional communications about new features, products, and offers (with your consent where required)</li>
            </ul>
          </section>

          {/* AI Processing and Data Usage */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. AI Processing and Data Usage</h2>
            <p className="text-gray-700 mb-4">
              Our Services utilize artificial intelligence to provide legal assistance. Here's how your data is processed:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li><strong>AI Model Processing:</strong> Your queries and documents are processed by AI models to generate responses and insights</li>
              <li><strong>Training Data:</strong> We do not use your personal documents or queries to train AI models without your explicit consent</li>
              <li><strong>Quality Improvement:</strong> We may use aggregated, anonymized data to improve our AI models and Services</li>
              <li><strong>Third-Party AI Providers:</strong> We work with trusted AI service providers who process data in accordance with strict confidentiality and security standards</li>
            </ul>
          </section>

          {/* Information Sharing and Disclosure */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Information Sharing and Disclosure</h2>
            <p className="text-gray-700 mb-3">We may share your information in the following circumstances:</p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">5.1 With Your Consent</h3>
            <p className="text-gray-700 mb-4">
              We share information when you explicitly authorize us to do so, such as when connecting third-party services.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">5.2 Service Providers</h3>
            <p className="text-gray-700 mb-4">
              We engage trusted third-party service providers to perform functions on our behalf, including:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Cloud hosting and storage providers</li>
              <li>AI and machine learning service providers</li>
              <li>Payment processors</li>
              <li>Email and communication services</li>
              <li>Analytics providers</li>
            </ul>
            <p className="text-gray-700 mb-4">
              These providers have access to your information only to perform specific tasks and are obligated to protect your data.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">5.3 Organization Members</h3>
            <p className="text-gray-700 mb-4">
              If you're part of an organization account, certain information may be visible to other members and administrators within your organization.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">5.4 Legal Requirements</h3>
            <p className="text-gray-700 mb-4">
              We may disclose your information if required by law or in response to valid legal processes, including:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Compliance with legal obligations</li>
              <li>Response to lawful requests from public authorities</li>
              <li>Protection of our rights, property, or safety</li>
              <li>Prevention of fraud or security threats</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">5.5 Business Transfers</h3>
            <p className="text-gray-700 mb-4">
              In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity, subject to the same privacy protections.
            </p>
          </section>

          {/* Data Security */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Security</h2>
            <p className="text-gray-700 mb-4">
              We implement industry-standard security measures to protect your information:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li><strong>Encryption:</strong> Data is encrypted in transit using TLS/SSL and at rest using industry-standard encryption algorithms</li>
              <li><strong>Access Controls:</strong> Strict access controls ensure only authorized personnel can access personal data</li>
              <li><strong>Security Monitoring:</strong> Continuous monitoring for security threats and vulnerabilities</li>
              <li><strong>Regular Audits:</strong> Periodic security audits and assessments</li>
              <li><strong>Secure Authentication:</strong> Multi-factor authentication options and secure password requirements</li>
            </ul>
            <p className="text-gray-700">
              However, no method of transmission or storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
            </p>
          </section>

          {/* Data Retention */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Data Retention</h2>
            <p className="text-gray-700 mb-4">
              We retain your information for as long as necessary to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Provide you with our Services</li>
              <li>Comply with legal obligations</li>
              <li>Resolve disputes and enforce agreements</li>
              <li>Maintain business records</li>
            </ul>
            <p className="text-gray-700">
              When you delete your account, we will delete or anonymize your personal information within 90 days, except where retention is required by law or for legitimate business purposes.
            </p>
          </section>

          {/* Your Privacy Rights */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Your Privacy Rights</h2>
            <p className="text-gray-700 mb-3">Depending on your location, you may have the following rights:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li><strong>Access:</strong> Request access to the personal information we hold about you</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information</li>
              <li><strong>Data Portability:</strong> Request a copy of your data in a structured, machine-readable format</li>
              <li><strong>Objection:</strong> Object to processing of your personal information</li>
              <li><strong>Restriction:</strong> Request restriction of processing in certain circumstances</li>
              <li><strong>Withdraw Consent:</strong> Withdraw consent where processing is based on consent</li>
              <li><strong>Opt-Out:</strong> Opt-out of marketing communications at any time</li>
            </ul>
            <p className="text-gray-700">
              To exercise these rights, please contact us at <a href="mailto:law@wansom.ai" className="text-blue-600 hover:underline">law@wansom.ai</a>. We will respond to your request within 30 days.
            </p>
          </section>

          {/* International Data Transfers */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. International Data Transfers</h2>
            <p className="text-gray-700 mb-4">
              Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy and applicable data protection laws.
            </p>
          </section>

          {/* Children's Privacy */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Children's Privacy</h2>
            <p className="text-gray-700">
              Our Services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
            </p>
          </section>

          {/* Third-Party Links */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Third-Party Links and Services</h2>
            <p className="text-gray-700">
              Our Services may contain links to third-party websites or integrate with third-party services. We are not responsible for the privacy practices of these third parties. We encourage you to review their privacy policies.
            </p>
          </section>

          {/* California Privacy Rights */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. California Privacy Rights (CCPA)</h2>
            <p className="text-gray-700 mb-4">
              If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Right to know what personal information is collected, used, shared, or sold</li>
              <li>Right to delete personal information</li>
              <li>Right to opt-out of the sale of personal information (we do not sell personal information)</li>
              <li>Right to non-discrimination for exercising your privacy rights</li>
            </ul>
          </section>

          {/* GDPR Rights */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. European Privacy Rights (GDPR)</h2>
            <p className="text-gray-700 mb-4">
              If you are located in the European Economic Area (EEA) or United Kingdom, you have rights under the General Data Protection Regulation (GDPR), including those outlined in Section 8 above. You also have the right to lodge a complaint with your local data protection authority.
            </p>
          </section>

          {/* Changes to Privacy Policy */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Changes to This Privacy Policy</h2>
            <p className="text-gray-700 mb-4">
              We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will notify you of material changes by:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Posting the updated policy on our website</li>
              <li>Updating the "Last Updated" date</li>
              <li>Sending you an email notification (for significant changes)</li>
            </ul>
            <p className="text-gray-700">
              Your continued use of the Services after changes are posted constitutes acceptance of the updated Privacy Policy.
            </p>
          </section>

          {/* Contact Information */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Contact Us</h2>
            <p className="text-gray-700 mb-4">
              If you have questions, concerns, or requests regarding this Privacy Policy or our privacy practices, please contact us:
            </p>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-700 mb-2"><strong>Wansom AI</strong></p>
              <p className="text-gray-700 mb-2">Email: <a href="mailto:law@wansom.ai" className="text-blue-600 hover:underline">law@wansom.ai</a></p>
            </div>
          </section>
        </div>
      </div>
      <Footer/>
    </div>
  );
};

export default PrivacyPolicyContent;
