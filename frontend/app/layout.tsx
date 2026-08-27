import type { Metadata } from "next";
import "@fontsource-variable/google-sans";
import "@fontsource-variable/google-sans/wght-italic.css";
import "./globals.css";
import { CapexProvider } from "./context/CapexContext";
import AuthGuard from "./components/AuthGuard";

export const metadata: Metadata = {
  title: "Capex System",
  description: "Sistem Manajemen Capital Expenditure (Capex) — PT MTM",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full">
      <body className="min-h-full bg-slate-900 text-slate-100 antialiased">
        <CapexProvider>
          <AuthGuard>
            {children}
          </AuthGuard>
        </CapexProvider>
      </body>
    </html>
  );
}
