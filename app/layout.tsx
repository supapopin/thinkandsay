import "./globals.css";
import type { Metadata } from "next";
import AppHeader from "@/components/AppHeader";
import { AuthProvider } from "@/lib/auth-context";

export const metadata: Metadata = {
  title: "AI Writing App",
  description: "English essay practice web app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-slate-50 pt-16">
        <AuthProvider>
          <AppHeader />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
