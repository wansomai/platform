'use client'
import { Send } from "lucide-react";
import { useAsyncOperation, useFormState } from "@/hooks/useAsyncOperation";
import { ErrorAlert } from "@/components/ui/error-alert";

export default function InquiryForm() {
  const { isLoading, error, execute, setError } = useAsyncOperation();
  const { data: formData, updateField, reset } = useFormState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    service: "",
    consent: true,
    additionalInfo: ""
  });

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    updateField(name, value);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError(null);

    const result = await execute(async () => {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit form');
      }

      return response.json();
    });

    if (result) {
      reset();
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorAlert error={error} onDismiss={() => setError(null)} />

        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="First Name"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded bg-slate-100 border-0 font-jost
              focus:ring-1 focus:ring-[#2E1A47] placeholder:text-slate-500"
          />
          <input
            type="text"
            placeholder="Last Name"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded bg-slate-100 border-0 font-jost
              focus:ring-1 focus:ring-[#2E1A47] placeholder:text-slate-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <input
            type="email"
            placeholder="Email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded bg-slate-100 border-0 font-jost
              focus:ring-1 focus:ring-[#2E1A47] placeholder:text-slate-500"
          />
          <input
            type="tel"
            placeholder="Phone Number"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded bg-slate-100 border-0 font-jost
              focus:ring-1 focus:ring-[#2E1A47] placeholder:text-slate-500"
          />
        </div>

        <textarea
          name="additionalInfo"
          placeholder="Additional Information"
          value={formData.additionalInfo}
          onChange={handleChange}
          rows={4}
          required
          className="w-full px-4 py-3 rounded bg-slate-100 border-0 font-jost
            focus:ring-1 focus:ring-[#2E1A47] placeholder:text-slate-500"
        />

        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="consent"
            className="mt-1.5 h-4 w-4 rounded border-slate-300 text-[#2E1A47]
              focus:ring-teal-600"
            defaultChecked
          />
          <label htmlFor="consent" className="text-sm text-slate-600 font-jost">
            You consent to be contacted by wansom for matters related to the
            agreed purpose using the provided contact details.
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary text-white px-6 py-3 rounded font-jost
            flex items-center justify-center gap-2 hover:bg-primary transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Sending..." : "Send Message"}
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
