import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";

export const metadata: Metadata = {
  title: "サロン管理",
  description: "ネイルサロン顧客管理システム",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "サロン管理",
  },
  icons: {
    apple: "/icon.svg",
    icon: "/icon.svg",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full">
      <head>
<meta name="theme-color" content="#f472b6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="サロン管理" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-full bg-[#fff9fb]">
        <ServiceWorkerRegistration />
        <Navigation />
        <main className="max-w-3xl mx-auto px-4 pt-4 pb-24 md:pt-20 md:pb-8">
          {children}
        </main>
      </body>
    </html>
  );
}
