import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Veda AI — Assessment review",
  description: "Extract, map, and review handwritten assessment answers.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
