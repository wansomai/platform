// components/onboarding/practise-info.tsx 
'use client'
import { useOnboardingStore } from "@/store/onboarding.store";
import { useSession } from "next-auth/react";
import { Building2, Globe, LinkedinIcon, Mail, Phone, FileText } from "lucide-react";
import { useEffect, useState } from "react";

export const PracticeInfoStep = () => {
  const { data: session } = useSession();
  const { formData, updateFormData, errors } = useOnboardingStore();
  const [hasPrefilledData, setHasPrefilledData] = useState(false);

  const firmSizeOptions = [
    { value: "solo", label: "Solo Practitioner" },
    { value: "small", label: "Small Firm (2-5 lawyers)" },
    { value: "medium", label: "Medium Firm (6-20 lawyers)" },
    { value: "large", label: "Large Firm (21+ lawyers)" },
  ];

  // Prefill form data from authenticated user
  useEffect(() => {
    if (session?.user && !hasPrefilledData) {
      // Only prefill if the fields are empty to avoid overriding user changes
      if (!formData.contactEmail && session.user.email) {
        updateFormData("contactEmail", session.user.email);
      }
      
      // Try to extract firm name from display name or use a default pattern
      if (!formData.firmName && session.user.name) {
        // If display name looks like "John Smith", convert to "Smith Law Firm"
        const nameParts = session.user.name.trim().split(' ');
        if (nameParts.length >= 2) {
          const lastName = nameParts[nameParts.length - 1];
          const suggestedFirmName = `${lastName} Law Firm`;
          updateFormData("firmName", suggestedFirmName);
        } else {
          // If only one name, use it as is with "Law Firm"
          updateFormData("firmName", `${session.user.name} Law Firm`);
        }
      }

      setHasPrefilledData(true);
    }
  }, [session?.user, formData.contactEmail, formData.firmName, updateFormData, hasPrefilledData]);

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">
          Tell Us About Your Practice
        </h2>
        <p className="text-gray-600 mt-2">
          Help us understand your firm to create the perfect AI profile
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Firm/Practice Name *
          </label>
          <input
            type="text"
            value={formData.firmName}
            onChange={(e) => updateFormData("firmName", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Enter your firm name"
          />
          {errors.firmName && (
            <p className="text-red-600 text-sm mt-1">{errors.firmName[0]}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contact Email *
          </label>
          <div className="relative">
            <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="email"
              value={formData.contactEmail}
              onChange={(e) => updateFormData("contactEmail", e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="your@email.com"
            />
            {session?.user?.email && formData.contactEmail === session.user.email && (
              <div className="absolute right-3 top-2.5">
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                  From account
                </span>
              </div>
            )}
          </div>
          {errors.contactEmail && (
            <p className="text-red-600 text-sm mt-1">{errors.contactEmail[0]}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <div className="relative">
            <Phone className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="tel"
              value={formData.contactPhone}
              onChange={(e) => updateFormData("contactPhone", e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="+1 XXX XXX XXXX"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Years in Practice
          </label>
          <input
            type="number"
            min="0"
            max="50"
            value={formData.yearsInPractice || ""}
            onChange={(e) =>
              updateFormData(
                "yearsInPractice",
                parseInt(e.target.value) || null
              )
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="e.g. 5"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Firm Size *
          </label>
          <select
            value={formData.firmSize}
            onChange={(e) => updateFormData("firmSize", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Select firm size</option>
            {firmSizeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.firmSize && (
            <p className="text-red-600 text-sm mt-1">{errors.firmSize[0]}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            LinkedIn Profile
          </label>
          <div className="relative">
            <LinkedinIcon className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="url"
              value={formData.linkedinUrl}
              onChange={(e) => updateFormData("linkedinUrl", e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="https://linkedin.com/in/yourprofile"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Website
          </label>
          <div className="relative">
            <Globe className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="url"
              value={formData.currentWebsite}
              onChange={(e) => updateFormData("currentWebsite", e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="https://yourfirm.com"
            />
          </div>
        </div>

        {/* Share Your Firm's Story - New field moved from Marketing step */}
        <div className="md:col-span-2 mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Share Your Firm's Story *
          </label>
          <div className="relative">
            <textarea
              value={formData.firmStory || ""}
              onChange={(e) => updateFormData("firmStory", e.target.value)}
              rows={6}
              className="w-full pl-4 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-vertical"
              placeholder="Describe your background, areas of expertise, notable cases, years of experience, team members, awards, community involvement, or anything else that makes your practice unique..."
            />
          </div>
          <div className="flex justify-between items-center mt-2">
            <div className="text-xs text-gray-500">
              Minimum 50 characters recommended
            </div>
            <div className="text-xs text-gray-500">
              {formData.firmStory?.length || 0} characters
            </div>
          </div>
          {errors.firmStory && (
            <p className="text-red-600 text-sm mt-1">{errors.firmStory[0]}</p>
          )}
        </div>
      </div>
    </div>
  );
};