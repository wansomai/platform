"use client";

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const TermsOfServiceContent = () => {
  return (
    <div className="">
      <Navbar darkmode />
      <div className="container mx-auto py-16 lg:py-24 ">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
        <p className="text-sm text-gray-600 mb-8">
          <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <div className="prose prose-lg max-w-none">
          {/* Introduction */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Agreement to Terms</h2>
            <p className="text-gray-700 mb-4">
              These Terms of Service ("Terms," "Agreement") constitute a legally binding agreement between you ("User," "you," or "your") and Wansom AI ("Company," "we," "us," or "our") governing your access to and use of the Wansom AI platform, website, and services (collectively, the "Services").
            </p>
            <p className="text-gray-700 mb-4">
              BY ACCESSING OR USING OUR SERVICES, YOU AGREE TO BE BOUND BY THESE TERMS. IF YOU DO NOT AGREE TO THESE TERMS, DO NOT USE OUR SERVICES.
            </p>
            <p className="text-gray-700">
              We reserve the right to modify these Terms at any time. Continued use of the Services after changes constitutes acceptance of the modified Terms.
            </p>
          </section>

          {/* Eligibility */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Eligibility</h2>
            <p className="text-gray-700 mb-4">
              To use our Services, you must:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Be at least 18 years of age</li>
              <li>Have the legal capacity to enter into binding contracts</li>
              <li>Not be prohibited from using the Services under applicable laws</li>
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the confidentiality of your account credentials</li>
            </ul>
            <p className="text-gray-700">
              By creating an account, you represent and warrant that you meet these eligibility requirements.
            </p>
          </section>

          {/* Account Registration */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Account Registration and Security</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">3.1 Account Creation</h3>
            <p className="text-gray-700 mb-4">
              You may register for an account using email/password or through third-party authentication providers (e.g., Google). You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate and current.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">3.2 Account Security</h3>
            <p className="text-gray-700 mb-4">
              You are responsible for:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized access or security breach</li>
              <li>Ensuring that you log out of your account at the end of each session</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">3.3 Account Termination</h3>
            <p className="text-gray-700 mb-4">
              We reserve the right to suspend or terminate your account at any time for violation of these Terms, suspected fraud, or other legitimate reasons. You may delete your account at any time through your account settings.
            </p>
          </section>

          {/* Services Description */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Description of Services</h2>
            <p className="text-gray-700 mb-4">
              Wansom AI provides an AI-powered legal assistance platform that includes, but is not limited to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Legal research and information retrieval</li>
              <li>Document drafting and review assistance</li>
              <li>Legal analysis and insights</li>
              <li>Case law research</li>
              <li>Integration with third-party services (Google Calendar, Gmail)</li>
              <li>Document management and collaboration tools</li>
              <li>Workspace and project management features</li>
            </ul>
            <p className="text-gray-700">
              We reserve the right to modify, suspend, or discontinue any aspect of the Services at any time, with or without notice.
            </p>
          </section>

          {/* Use of Services */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Acceptable Use Policy</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">5.1 Permitted Use</h3>
            <p className="text-gray-700 mb-4">
              You may use the Services for lawful purposes in accordance with these Terms. You agree to use the Services in a professional manner consistent with legal and ethical standards.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">5.2 Prohibited Activities</h3>
            <p className="text-gray-700 mb-3">You agree NOT to:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Violate any applicable laws, regulations, or third-party rights</li>
              <li>Use the Services for illegal, fraudulent, or malicious purposes</li>
              <li>Attempt to gain unauthorized access to our systems or other users' accounts</li>
              <li>Interfere with or disrupt the Services or servers</li>
              <li>Use automated systems (bots, scrapers) without our written permission</li>
              <li>Reverse engineer, decompile, or disassemble any part of the Services</li>
              <li>Upload malicious code, viruses, or harmful content</li>
              <li>Impersonate any person or entity or misrepresent your affiliation</li>
              <li>Collect or harvest information about other users without consent</li>
              <li>Use the Services to spam, solicit, or send unsolicited communications</li>
              <li>Resell or commercially exploit the Services without authorization</li>
              <li>Remove, obscure, or alter any proprietary notices</li>
            </ul>
          </section>

          {/* No Attorney-Client Relationship */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. No Attorney-Client Relationship</h2>
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded mb-4">
              <p className="text-gray-700 mb-4">
                <strong>IMPORTANT LEGAL DISCLAIMER:</strong>
              </p>
              <p className="text-gray-700 mb-4">
                THE SERVICES PROVIDED BY WANSOM AI ARE FOR INFORMATIONAL AND ASSISTANCE PURPOSES ONLY. USE OF OUR SERVICES DOES NOT CREATE AN ATTORNEY-CLIENT RELATIONSHIP BETWEEN YOU AND WANSOM AI OR ANY OF ITS EMPLOYEES, CONTRACTORS, OR AFFILIATES.
              </p>
              <p className="text-gray-700 mb-4">
                THE INFORMATION AND ASSISTANCE PROVIDED THROUGH OUR AI-POWERED PLATFORM:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>Is not legal advice and should not be relied upon as such</li>
                <li>May not be accurate, complete, or current</li>
                <li>Should not be used as a substitute for consultation with a qualified attorney</li>
                <li>May not be applicable to your specific legal situation</li>
              </ul>
              <p className="text-gray-700">
                YOU SHOULD ALWAYS CONSULT WITH A LICENSED ATTORNEY IN YOUR JURISDICTION FOR LEGAL ADVICE SPECIFIC TO YOUR SITUATION.
              </p>
            </div>
          </section>

          {/* User Content */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. User Content and Data</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">7.1 Your Content</h3>
            <p className="text-gray-700 mb-4">
              You retain all rights to the content, documents, and data you upload, create, or share through the Services ("User Content"). By using the Services, you grant us a limited, non-exclusive, worldwide license to use, store, process, and display your User Content solely to provide and improve the Services.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">7.2 Responsibility for Content</h3>
            <p className="text-gray-700 mb-4">You are solely responsible for:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>All User Content you submit or share</li>
              <li>Ensuring you have necessary rights and permissions</li>
              <li>Complying with confidentiality and privilege obligations</li>
              <li>Protecting sensitive and confidential information</li>
              <li>Not uploading content that infringes third-party rights</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">7.3 Confidentiality</h3>
            <p className="text-gray-700 mb-4">
              While we implement security measures to protect your data, you should not upload highly sensitive information unless you understand and accept the risks associated with cloud-based services.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">7.4 Backup Responsibility</h3>
            <p className="text-gray-700 mb-4">
              You are responsible for maintaining backup copies of your User Content. We are not liable for any loss, corruption, or deletion of User Content.
            </p>
          </section>

          {/* Intellectual Property */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Intellectual Property Rights</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">8.1 Our Intellectual Property</h3>
            <p className="text-gray-700 mb-4">
              The Services, including all software, algorithms, design, text, graphics, logos, and other content (excluding User Content), are owned by Wansom AI and protected by copyright, trademark, and other intellectual property laws.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">8.2 Limited License</h3>
            <p className="text-gray-700 mb-4">
              We grant you a limited, non-exclusive, non-transferable, revocable license to access and use the Services for your internal business purposes, subject to these Terms.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">8.3 Restrictions</h3>
            <p className="text-gray-700 mb-4">
              You may not copy, modify, distribute, sell, or lease any part of our Services or software without our express written permission.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">8.4 Feedback</h3>
            <p className="text-gray-700 mb-4">
              If you provide feedback, suggestions, or ideas about the Services, we may use them without any obligation to you.
            </p>
          </section>

          {/* Third-Party Services */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Third-Party Services and Integrations</h2>
            <p className="text-gray-700 mb-4">
              Our Services may integrate with third-party services (e.g., Google Calendar, Gmail). Your use of these integrations is subject to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>The third party's terms of service and privacy policies</li>
              <li>Your authorization for us to access your third-party accounts</li>
              <li>The understanding that we are not responsible for third-party services</li>
            </ul>
            <p className="text-gray-700">
              We may display links to third-party websites or services. We do not endorse and are not responsible for the content, privacy practices, or availability of third-party sites.
            </p>
          </section>

          {/* Payment Terms */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Payment and Subscription Terms</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">10.1 Subscription Plans</h3>
            <p className="text-gray-700 mb-4">
              We offer various subscription plans with different features and pricing. You agree to pay all fees associated with your selected plan.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">10.2 Payment Processing</h3>
            <p className="text-gray-700 mb-4">
              Payments are processed through secure third-party payment processors. You authorize us to charge your payment method for all fees.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">10.3 Automatic Renewal</h3>
            <p className="text-gray-700 mb-4">
              Subscriptions automatically renew unless you cancel before the renewal date. You will be charged at the then-current rate unless you cancel.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">10.4 Cancellation and Refunds</h3>
            <p className="text-gray-700 mb-4">
              You may cancel your subscription at any time through your account settings. Cancellation takes effect at the end of the current billing period. We generally do not provide refunds for partial months or unused features, except as required by law.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">10.5 Price Changes</h3>
            <p className="text-gray-700 mb-4">
              We reserve the right to change our pricing with 30 days' notice. Changes will apply to subsequent billing periods.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">10.6 Taxes</h3>
            <p className="text-gray-700 mb-4">
              All fees are exclusive of applicable taxes, which you are responsible for paying.
            </p>
          </section>

          {/* Disclaimers */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Disclaimers and Warranties</h2>
            <div className="bg-gray-50 border-l-4 border-gray-400 p-6 rounded mb-4">
              <p className="text-gray-700 mb-4">
                <strong>THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.</strong>
              </p>
              <p className="text-gray-700 mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>Warranties of merchantability, fitness for a particular purpose, and non-infringement</li>
                <li>Warranties regarding accuracy, reliability, completeness, or timeliness of content</li>
                <li>Warranties that the Services will be uninterrupted, secure, or error-free</li>
                <li>Warranties regarding the results or outcomes from using the Services</li>
              </ul>
              <p className="text-gray-700 mb-4">
                WE DO NOT WARRANT THAT:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>The Services will meet your specific requirements</li>
                <li>The Services will be available at all times</li>
                <li>Errors or defects will be corrected</li>
                <li>The Services are free from viruses or harmful components</li>
                <li>Information obtained through the Services will be accurate or reliable</li>
              </ul>
              <p className="text-gray-700">
                USE OF THE SERVICES IS AT YOUR OWN RISK. YOU ASSUME FULL RESPONSIBILITY FOR ANY DECISIONS MADE BASED ON INFORMATION OBTAINED THROUGH THE SERVICES.
              </p>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Limitation of Liability</h2>
            <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded mb-4">
              <p className="text-gray-700 mb-4">
                <strong>TO THE MAXIMUM EXTENT PERMITTED BY LAW:</strong>
              </p>
              <p className="text-gray-700 mb-4">
                IN NO EVENT SHALL WANSOM AI, ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, OR AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>Loss of profits, revenue, data, or business opportunities</li>
                <li>Legal fees or costs of litigation</li>
                <li>Damage to professional reputation</li>
                <li>Business interruption</li>
                <li>Loss of goodwill</li>
              </ul>
              <p className="text-gray-700 mb-4">
                WHETHER BASED ON WARRANTY, CONTRACT, TORT (INCLUDING NEGLIGENCE), OR ANY OTHER LEGAL THEORY, AND WHETHER OR NOT WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
              </p>
              <p className="text-gray-700 mb-4">
                OUR TOTAL AGGREGATE LIABILITY FOR ALL CLAIMS ARISING OUT OF OR RELATING TO THESE TERMS OR THE SERVICES SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM, OR $100, WHICHEVER IS GREATER.
              </p>
              <p className="text-gray-700">
                SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OR LIMITATION OF LIABILITY FOR CONSEQUENTIAL OR INCIDENTAL DAMAGES. IN SUCH JURISDICTIONS, OUR LIABILITY IS LIMITED TO THE GREATEST EXTENT PERMITTED BY LAW.
              </p>
            </div>
          </section>

          {/* Indemnification */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Indemnification</h2>
            <p className="text-gray-700 mb-4">
              You agree to indemnify, defend, and hold harmless Wansom AI and its officers, directors, employees, agents, and affiliates from and against any claims, liabilities, damages, losses, costs, or expenses (including reasonable attorneys' fees) arising out of or relating to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Your use or misuse of the Services</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any laws or third-party rights</li>
              <li>Your User Content</li>
              <li>Any actions taken using your account</li>
            </ul>
            <p className="text-gray-700">
              We reserve the right to assume exclusive defense and control of any matter subject to indemnification, at your expense.
            </p>
          </section>

          {/* Dispute Resolution */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Dispute Resolution and Arbitration</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">14.1 Governing Law</h3>
            <p className="text-gray-700 mb-4">
              These Terms shall be governed by and construed in accordance with the laws of Kenya, without regard to its conflict of law provisions.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">14.2 Dispute Resolution</h3>
            <p className="text-gray-700 mb-4">
              In the event of any dispute, claim, or controversy arising out of or relating to these Terms or the Services, you agree to first contact us at <a href="mailto:legal@wansom.ai" className="text-blue-600 hover:underline">legal@wansom.ai</a> to attempt to resolve the dispute informally.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">14.3 Arbitration</h3>
            <p className="text-gray-700 mb-4">
              If informal resolution is unsuccessful, disputes shall be resolved through binding arbitration in accordance with the Arbitration Act of Kenya. The arbitration shall take place in Nairobi, Kenya.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">14.4 Class Action Waiver</h3>
            <p className="text-gray-700 mb-4">
              You agree that any dispute resolution proceedings will be conducted only on an individual basis and not in a class, consolidated, or representative action.
            </p>
          </section>

          {/* General Provisions */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. General Provisions</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">15.1 Entire Agreement</h3>
            <p className="text-gray-700 mb-4">
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and Wansom AI regarding the Services.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">15.2 Severability</h3>
            <p className="text-gray-700 mb-4">
              If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall remain in full force and effect.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">15.3 Waiver</h3>
            <p className="text-gray-700 mb-4">
              Our failure to enforce any right or provision of these Terms shall not constitute a waiver of such right or provision.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">15.4 Assignment</h3>
            <p className="text-gray-700 mb-4">
              You may not assign or transfer these Terms or your account without our prior written consent. We may assign these Terms without restriction.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">15.5 Force Majeure</h3>
            <p className="text-gray-700 mb-4">
              We shall not be liable for any failure or delay in performance due to circumstances beyond our reasonable control.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">15.6 Survival</h3>
            <p className="text-gray-700 mb-4">
              Provisions that by their nature should survive termination shall survive, including but not limited to: ownership provisions, warranty disclaimers, indemnity, and limitations of liability.
            </p>
          </section>

          {/* Contact Information */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">16. Contact Information</h2>
            <p className="text-gray-700 mb-4">
              For questions about these Terms or the Services, please contact us:
            </p>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-700 mb-2"><strong>Wansom AI Limited</strong></p>
      
              <p className="text-gray-700 mb-2">Email: <a href="mailto:law@wansom.ai" className="text-blue-600 hover:underline">law@wansom.ai</a></p>

            </div>
          </section>

        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TermsOfServiceContent;
