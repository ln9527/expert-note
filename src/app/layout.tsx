import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";

export const metadata: Metadata = {
  title: "Expert Note - Annotation-based Knowledge Capture",
  description: "Capture and organize expert knowledge through structured annotations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="antialiased font-sans h-full">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
