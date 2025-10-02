import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/components/providers/auth-provider"
import { LoadingProvider } from "@/components/providers/loading-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { ScrollRestoration } from "@/components/scroll-restoration"
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: 'swap',
  preload: true,
})

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: "Bharat Vanshavali - India's Premier Genealogy Platform",
    template: "%s | Bharat Vanshavali"
  },
  description: "India's first open genealogy platform for preserving heritage and building community. Create, manage, and share your family tree with verified records and document storage.",
  
  // SEO Keywords
  keywords: [
    "family tree", "genealogy", "heritage", "ancestry", "India", "family history", 
    "vanshavali", "family records", "document storage", "verified genealogy",
    "Indian genealogy", "family tree builder", "heritage preservation"
  ],
  
  // Open Graph / Social Media
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    siteName: "Bharat Vanshavali",
    title: "Bharat Vanshavali - India's Premier Genealogy Platform",
    description: "Create, manage, and share your family tree with verified records and document storage. India's trusted genealogy platform.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Bharat Vanshavali - Family Tree Platform"
      }
    ]
  },
  
  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "Bharat Vanshavali - India's Premier Genealogy Platform",
    description: "Create, manage, and share your family tree with verified records and document storage.",
    images: ["/twitter-image.jpg"],
    creator: "@bharatvanshavali"
  },
  
  // App metadata
  applicationName: "Bharat Vanshavali",
  authors: [{ name: "Bharat Vanshavali Team" }],
  creator: "Bharat Vanshavali",
  publisher: "Bharat Vanshavali",
  
  // Manifest
  manifest: "/manifest.json",
  
  // Icons
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/placeholder-logo.png", sizes: "192x192", type: "image/png" },
      { url: "/placeholder-logo.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [
      { url: "/placeholder-logo.png", sizes: "180x180" }
    ]
  },
  
  // Verification
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    yandex: process.env.YANDEX_VERIFICATION,
    other: {
      "msvalidate.01": process.env.BING_SITE_VERIFICATION || ""
    }
  },
  
  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  },
  
  // Category
  category: "genealogy"
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        
        {/* DNS prefetch */}
        <link rel="dns-prefetch" href="https://api.bharatvanshavali.com" />
        
        {/* Theme color */}
        <meta name="theme-color" content="#f97316" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        
        {/* Viewport */}
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <LoadingProvider>
            <AuthProvider>
              <ScrollRestoration />
              {children}
              <Toaster />
            </AuthProvider>
          </LoadingProvider>
        </ThemeProvider>
        
        {/* Analytics - Only in production */}
        {process.env.NODE_ENV === 'production' && (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        )}
      </body>
    </html>
  )
}