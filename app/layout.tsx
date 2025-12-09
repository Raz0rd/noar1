import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
})

export const metadata: Metadata = {
  title: 'Entrega de Gás de Cozinha em Caucaia | Frete Grátis e Rápido',
  description: 'Gás de cozinha com entrega rápida em Caucaia. Botijões 13kg 100% novos, sem troca de vasilhame. Frete grátis e preço justo. Peça agora!',
  keywords: [
    'gás de cozinha',
    'botijão de gás',
    'entrega de gás',
    'comprar botijão de gás',
    'gás perto de mim',
    'gás 13kg',
    'gás Caucaia',
    'frete grátis gás',
    'gás urgente',
    'entrega rápida de gás',
    'botijão novo lacrado',
    'gás barato',
    'sem troca de vasilhame'
  ],
  authors: [{ name: 'Configás' }],
  creator: 'Configás',
  publisher: 'Configás',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://distribuidoraconfigas.store'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Entrega de Gás de Cozinha em Caucaia | Frete Grátis e Rápido',
    description: 'Gás de cozinha com entrega rápida, botijões novos e frete grátis. Atendemos Caucaia e região. Peça agora!',
    url: '/',
    siteName: 'Configás',
    locale: 'pt_BR',
    type: 'website',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Entrega de Gás de Cozinha em Caucaia',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Entrega de Gás de Cozinha em Caucaia | Frete Grátis e Rápido',
    description: 'Gás de cozinha com entrega rápida, botijões novos e frete grátis. Atendemos Caucaia e região. Peça agora!',
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
  // Suporta múltiplas tags separadas por vírgula
  const googleAdsTags = (process.env.NEXT_PUBLIC_GOOGLE_ADS_TAGS || 'AW-17780793164')
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0)
  
  const primaryTag = googleAdsTags[0]
  
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
              name: 'Configás',
              description: 'Entrega expressa de gás de cozinha e água mineral em até 30 minutos',
              url: process.env.NEXT_PUBLIC_SITE_URL || 'https://distribuidoraconfigas.store',
              telephone: '+55-XX-XXXXX-XXXX',
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
                opens: '00:00',
                closes: '23:59',
              },
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.8',
                reviewCount: '150',
              },
            }),
          }}
        />
        
        {/* Google Ads - Tag Principal */}
        <script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${primaryTag}`}
        ></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              
              // Configurar todas as tags
              ${googleAdsTags.map(tag => `gtag('config', '${tag}');`).join('\n              ')}
            `,
          }}
        />
        
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
