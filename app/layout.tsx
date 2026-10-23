import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Skill Dunk — Learn something weird",
  description: "Discover small skills to practise and curious websites worth exploring.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}