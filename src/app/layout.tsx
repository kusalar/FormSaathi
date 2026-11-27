import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import { AppShell } from "@/components/AppShell";
import { ToastContainer } from "@/components/ToastContainer";
import { ScholarshipModal } from "@/components/ScholarshipModal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FormSaathi — Voice-First Scholarship Assistant",
  description:
    "Helping Indian students discover scholarships, check indicative eligibility, and prepare documents using natural voice conversations in English, Hindi, and Bengali.",
  keywords: [
    "FormSaathi",
    "scholarship assistant",
    "voice-first EdTech",
    "Indian students",
    "Hindi Bengali English",
  ],
  openGraph: {
    title: "FormSaathi — Voice-First Scholarship Assistant",
    description:
      "Voice-first scholarship discovery, indicative eligibility matching, and document preparation for Indian students in English, Hindi, and Bengali.",
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "FormSaathi — Voice-First Scholarship Assistant",
    description:
      "Helping Indian students discover scholarships and prepare documents using natural voice conversations.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <AppProvider>
          <AppShell>{children}</AppShell>
          <ScholarshipModal />
          <ToastContainer />
        </AppProvider>
      </body>
    </html>
  );
}
