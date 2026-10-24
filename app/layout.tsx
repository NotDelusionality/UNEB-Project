import type { Metadata } from "next";
import { Libre_Baskerville, Manrope, Roboto_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-libre-baskerville",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-roboto-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Light Academy · Community Desk",
    template: "%s · Light Academy Community Desk",
  },
  description:
    "Report local problems to the administration of Light Academy Secondary School and track them until they are resolved.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${libreBaskerville.variable} ${robotoMono.variable} h-full`}
    >
      {/* Browser extensions (e.g. Grammarly) inject attributes into <body>
          before React hydrates; suppress the resulting dev-only warning. */}
      <body className="min-h-full font-sans text-sm" suppressHydrationWarning>
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
