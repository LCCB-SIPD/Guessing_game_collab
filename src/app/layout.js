import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import Providers from "@/app/providers";
import "@cordystackx/cordy_minikit/dist/css/UI_Comp/styles.module.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "World Scramble",
  description: "Develop By CordyStackX & ",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Providers>
        {children}
        </Providers>
      </body>
    </html>
  );
}
