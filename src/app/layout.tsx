import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
