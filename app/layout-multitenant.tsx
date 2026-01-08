import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { headers } from 'next/headers'
import { getDomainConfig } from '@/lib/domain-config'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
})

export const metadata: Metadata = {
  title: 'Entrega de Gás de Cozinha | Frete Grátis e Rápido',
  description: 'Gás de cozinha com entrega rápida. Botijões 13kg 100% novos, sem troca de vasilhame. Frete grátis e preço justo. Peça agora!',
  keywords: [
    'gás de cozinha',
    'botijão de gás',
    'entrega de gás',
    'comprar botijão de gás',
    'gás perto de mim',
    'gás 13kg',
    'gás na sua cidade',
    'frete grátis gás',
    'gás urgente',
    'entrega rápida de gás',
    'botijão novo lacrado',
    'gás barato',
    'sem troca de vasilhame'
  ],
  authors: [{ name: 'Delivery Gás' }],
  creator: 'Delivery Gás',
  publisher: 'Delivery Gás',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL) : undefined,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Entrega de Gás de Cozinha | Frete Grátis e Rápido',
    description: 'Gás de cozinha com entrega rápida, botijões novos e frete grátis. Peça agora!',
    url: '/',
    siteName: 'Delivery Gás',
    locale: 'pt_BR',
    type: 'website',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Entrega de Gás de Cozinha',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Entrega de Gás de Cozinha | Frete Grátis e Rápido',
    description: 'Gás de cozinha com entrega rápida, botijões novos e frete grátis. Peça agora!',
    images: ['/images/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Obter hostname do servidor
  const headersList = headers()
  let hostname = headersList.get('x-hostname') || headersList.get('host') || 'localhost'
  
  // Remover porta se existir (ex: deliverygazz.store:443 -> deliverygazz.store)
  hostname = hostname.split(':')[0]
  
  // Obter configuração do domínio
  const domainConfig = getDomainConfig(hostname)
  const googleAdsTag = domainConfig.GOOGLE_ADS_TAG
  const siteUrl = domainConfig.SITE_URL
  
  return (
    <html lang="pt-BR">
      <head>
        {/* Favicon - Múltiplos tamanhos */}
        <link rel="icon" type="image/x-icon" href="/images/favico.ico" sizes="any" />
        <link rel="shortcut icon" href="/images/favico.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/images/favico.ico" />
        <link rel="icon" type="image/png" sizes="16x16" href="/images/favico.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/images/favico.ico" />
        
        {/* Schema.org para SEO Local */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'LocalBusiness',
              name: 'Delivery Gás',
              description: 'Entrega expressa de gás de cozinha e água mineral em até 30 minutos',
              url: siteUrl,
              telephone: '+55-91-946532477',
              priceRange: '$$',
              image: '/images/og-image.png',
              address: {
                '@type': 'PostalAddress',
                addressCountry: 'BR',
                addressLocality: 'Sua Cidade',
                addressRegion: 'SP',
              },
              geo: {
                '@type': 'GeoCoordinates',
                latitude: 0,
                longitude: 0,
              },
              openingHoursSpecification: {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
                opens: '08:00',
                closes: '22:00',
              },
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.8',
                reviewCount: '127',
              },
            }),
          }}
        />
        
        {/* Google Ads - Tag Principal (dinâmica por domínio) */}
        {googleAdsTag && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${googleAdsTag}`}
            ></script>
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${googleAdsTag}');
                `,
              }}
            />
          </>
        )}
        
        {/* UTMify - Script de captura de UTMs (OBRIGATÓRIO) */}
        <script
          src="https://cdn.utmify.com.br/scripts/utms/latest.js"
          data-utmify-prevent-xcod-sck
          data-utmify-prevent-subids
          async
          defer
        ></script>
        
        {/* UTMify - Pixel do Google */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.googlePixelId = "6920b671786d74e4309d5c3b";
              var a = document.createElement("script");
              a.setAttribute("async", "");
              a.setAttribute("defer", "");
              a.setAttribute("src", "https://cdn.utmify.com.br/scripts/pixel/pixel-google.js");
              document.head.appendChild(a);
            `,
          }}
        />
      </head>
      <body className={`${inter.className} antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
