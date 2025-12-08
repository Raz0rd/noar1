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
  title: 'Configás - Gás e Água na sua Porta',
  description: 'Entrega rápida de gás e água mineral em até 30 minutos',
  generator: 'v0.app',
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
    <html lang="en">
      <head>
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
