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
    default: "LaTeX Labs | Multi-Agent LaTeX Editor",
    template: "%s | LaTeX Labs",
  },
  description:
    "LaTeX Labs is a multi-agent LaTeX writing workspace with Gemini-powered writing, reviewing, formatting, and research flows.",
  applicationName: "LaTeX Labs",
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
    title: "LaTeX Labs | Multi-Agent LaTeX Editor",
    description:
      "Draft, review, format, and research in one LaTeX workspace powered by coordinated AI agents.",
    siteName: "LaTeX Labs",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "LaTeX Labs LaTeX editor workspace preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LaTeX Labs | Multi-Agent LaTeX Editor",
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
    name: "LaTeX Labs",
    applicationCategory: "WritingApplication",
    operatingSystem: "Web",
    description:
      "Multi-agent LaTeX editor for drafting, reviewing, formatting, and researching academic documents.",
    url: getMetadataBase().toString(),
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        <script
          type="application/ld+json"
        >
          {JSON.stringify(structuredData)}
        </script>
        {children}
      </body>
    </html>
  );
}
