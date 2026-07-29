import "./globals.css";
import { Inter, Lora, Caveat } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const lora = Lora({ subsets: ["latin"], variable: "--font-lora", display: "swap" });
const caveat = Caveat({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-caveat", display: "swap" });

export const metadata = {
  title: "Syllabus Pacer",
  description: "Turn your chapters and deadline into topics a day.",
  // Tells Chrome / Google Translate to leave the page alone. Chapter and topic
  // names are the textbook's own wording — Malayalam, Hindi, Arabic, Urdu,
  // Sanskrit — and machine-translating them would hand students names they
  // cannot find in their book.
  other: { google: "notranslate" },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      translate="no"
      className={`notranslate ${inter.variable} ${lora.variable} ${caveat.variable}`}
    >
      <body className="notranslate">{children}</body>
    </html>
  );
}
