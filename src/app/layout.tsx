import type { Metadata } from "next";
import "./globals.css";

const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function getMetadataBase() {
  try {
    return new URL(rawSiteUrl);
  } catch {
    return new URL("http://localhost:3000");
  }
}

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: "Canvas | Multi-Agent LaTeX Editor",
    template: "%s | Canvas",
  },
  description:
    "Canvas is a multi-agent LaTeX writing workspace with Gemini-powered writing, reviewing, formatting, and research flows.",
  applicationName: "Canvas",
  keywords: [
    "LaTeX editor",
    "AI writing assistant",
    "Gemini",
    "academic writing",
    "research workflow",
    "multi-agent editor",
  ],
  openGraph: {
    type: "website",
    title: "Canvas | Multi-Agent LaTeX Editor",
    description:
      "Draft, review, format, and research in one LaTeX workspace powered by coordinated AI agents.",
    siteName: "Canvas",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Canvas LaTeX editor workspace preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Canvas | Multi-Agent LaTeX Editor",
    description:
      "Create publication-ready LaTeX documents with AI writer, reviewer, formatter, and research agents.",
    images: ["/twitter-image"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Canvas",
    applicationCategory: "WritingApplication",
    operatingSystem: "Web",
    description:
      "Multi-agent LaTeX editor for drafting, reviewing, formatting, and researching academic documents.",
    url: getMetadataBase().toString(),
  };

  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {children}
      </body>
    </html>
  );
}
