import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LeadOps — Admin Dashboard",
  description: "Real estate AI lead qualification dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
