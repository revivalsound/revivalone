import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { AuthProvider } from "./providers/AuthProvider";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "revival.one";
  const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;
  const title = "Revival One — One Movement. One Revival. One Generation.";
  const description = "The digital home for believers to connect, grow, build Kingdom businesses, fund Kingdom impact, and carry revival city by city.";

  return {
    title,
    description,
    icons: {
      icon: "/revival-flame.png",
      shortcut: "/revival-flame.png",
      apple: "/revival-flame.png",
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: baseUrl,
      images: [{ url: `${baseUrl}/og.png`, width: 1200, height: 630, alt: "Revival One — One movement. One revival. One generation." }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${baseUrl}/og.png`],
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#050505",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><AuthProvider>{children}</AuthProvider></body></html>;
}
