import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Puck Labs - JSONata Expressions Demo",
  description: "Demo of JSONata expression support for Puck editor",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
