import { Metadata } from "next";
import FeedbackFormPage from "./FeedbackFormPage";

export const metadata: Metadata = {
  title: "Share Your Feedback | Wansom AI",
  description:
    "Help us improve Wansom AI. Share why you haven't subscribed yet and what would make the platform the right fit for you.",
  alternates: {
    canonical: "https://www.wansom.ai/feedback-form",
  },
  openGraph: {
    title: "Share Your Feedback | Wansom AI",
    description:
      "Help us improve Wansom AI. Your feedback takes less than 2 minutes.",
    type: "website",
    url: "https://www.wansom.ai/feedback-form",
    images: [
      {
        url: "/dashboard.jpg",
        width: 1200,
        height: 630,
        alt: "Wansom AI Feedback",
      },
    ],
    locale: "en_US",
    siteName: "wansom",
  },
  twitter: {
    card: "summary_large_image",
    title: "Share Your Feedback | Wansom AI",
    description: "Help us improve Wansom AI.",
    images: ["/dashboard.jpg"],
  },
};

export default function Page() {
  return <FeedbackFormPage />;
}
