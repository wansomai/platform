"use client";

import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Send, CheckCircle } from "lucide-react";

const REASONS = [
  "It was too expensive",
  "I didn't fully understand what it does",
  "I had technical difficulties",
  "I found another solution",
  "I'm not ready yet — will come back",
  "Other",
];

const FEATURES = [
  "AI legal drafting",
  "Contract review",
  "Document management",
  "Legal research assistant",
  "Team collaboration",
];

export default function FeedbackFormPage() {
  const [formData, setFormData] = useState({
    email: "",
    reason: "",
    otherReason: "",
    features: [] as string[],
    suggestion: "",
    wouldReturn: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateField = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleFeature = (feature: string) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter((f) => f !== feature)
        : [...prev.features, feature],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/submissions/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to submit");

      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative bg-[#f3f4f4] min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="pt-24 md:pt-32 overflow-hidden bg-[#355e66] bg-[url(/1.jpg)] bg-blend-multiply bg-cover">
        <div className="container mx-auto px-4 lg:px-8 py-12 text-white">
          <h1 className="font-marcellus text-5xl mb-4 text-white">
            Share Your Feedback
          </h1>
          <p className="font-jost text-sm text-white/80 mb-5">
            Home / Feedback
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="container mx-auto px-4 lg:px-8 py-16 max-w-2xl">
        {submitted ? (
          <div className="bg-white rounded-lg p-10 flex flex-col items-center text-center gap-4 shadow-sm">
            <CheckCircle className="w-14 h-14 text-[#355e66]" />
            <h2 className="font-marcellus text-2xl text-slate-800">
              Thank you for your feedback
            </h2>
            <p className="font-jost text-slate-500 text-sm leading-relaxed max-w-sm">
              Your response helps us improve Wansom for everyone. We truly
              appreciate the time you took to share your thoughts.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg p-8 shadow-sm">
            <p className="font-jost text-slate-500 text-sm mb-8 leading-relaxed">
              We noticed you explored Wansom but haven&apos;t continued. Your
              honest feedback takes less than 2 minutes and helps us build
              something you&apos;d actually want to use.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <label className="block font-jost text-sm text-slate-700 mb-1.5">
                  Your email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded bg-slate-100 border-0 font-jost text-sm
                    focus:ring-1 focus:ring-[#355e66] placeholder:text-slate-400 outline-none"
                />
              </div>

              {/* Why didn't you continue */}
              <div>
                <label className="block font-jost text-sm text-slate-700 mb-2">
                  Why didn&apos;t you continue with Wansom?{" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {REASONS.map((r) => (
                    <label
                      key={r}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={r}
                        checked={formData.reason === r}
                        onChange={() => updateField("reason", r)}
                        className="accent-[#355e66] w-4 h-4"
                        required
                      />
                      <span className="font-jost text-sm text-slate-600 group-hover:text-slate-800 transition-colors">
                        {r}
                      </span>
                    </label>
                  ))}
                </div>

                {formData.reason === "Other" && (
                  <input
                    type="text"
                    name="otherReason"
                    placeholder="Please tell us more..."
                    value={formData.otherReason}
                    onChange={(e) => updateField("otherReason", e.target.value)}
                    required
                    className="mt-3 w-full px-4 py-3 rounded bg-slate-100 border-0 font-jost text-sm
                      focus:ring-1 focus:ring-[#355e66] placeholder:text-slate-400 outline-none"
                  />
                )}
              </div>

              {/* Features that interested them */}
              <div>
                <label className="block font-jost text-sm text-slate-700 mb-2">
                  Which features caught your attention? (select all that apply)
                </label>
                <div className="flex flex-wrap gap-2">
                  {FEATURES.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => toggleFeature(f)}
                      className={`px-3 py-1.5 rounded-full text-xs font-jost border transition-colors ${
                        formData.features.includes(f)
                          ? "bg-[#355e66] text-white border-[#355e66]"
                          : "bg-white text-slate-600 border-slate-300 hover:border-[#355e66]"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Would you return */}
              <div>
                <label className="block font-jost text-sm text-slate-700 mb-2">
                  Would you consider coming back to Wansom in the future?
                </label>
                <div className="flex gap-4">
                  {["Yes", "Maybe", "No"].map((opt) => (
                    <label
                      key={opt}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="wouldReturn"
                        value={opt}
                        checked={formData.wouldReturn === opt}
                        onChange={() => updateField("wouldReturn", opt)}
                        className="accent-[#355e66] w-4 h-4"
                      />
                      <span className="font-jost text-sm text-slate-600">
                        {opt}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Suggestion */}
              <div>
                <label className="block font-jost text-sm text-slate-700 mb-1.5">
                  What would make Wansom the right fit for you?
                </label>
                <textarea
                  name="suggestion"
                  placeholder="Lower price, specific feature, better onboarding..."
                  value={formData.suggestion}
                  onChange={(e) => updateField("suggestion", e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded bg-slate-100 border-0 font-jost text-sm
                    focus:ring-1 focus:ring-[#355e66] placeholder:text-slate-400 outline-none resize-none"
                />
              </div>

              {error && (
                <p className="text-sm font-jost text-red-500">{error}</p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#355e66] text-white px-6 py-3 rounded font-jost text-sm
                  flex items-center justify-center gap-2 hover:bg-[#2a4d54] transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Sending..." : "Submit Feedback"}
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
