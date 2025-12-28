'use client'

import { useEffect, useState } from 'react'
import { getSiteCategory, type SiteCategory } from '@/lib/domain-config'

// Componente que renderiza conteúdo específico por categoria
export function SiteContent() {
  const [category, setCategory] = useState<SiteCategory>('gas')

  useEffect(() => {
    // Pegar categoria do window.DOMAIN_CONFIG (disponibilizado pelo layout)
    if (typeof window !== 'undefined' && window.DOMAIN_CONFIG) {
      setCategory(window.DOMAIN_CONFIG.CATEGORY)
    }
  }, [])

  // Renderizar conteúdo específico por categoria
  switch (category) {
    case 'gas':
      return <GasContent />
    case 'sushi':
      return <SushiContent />
    case 'food':
      return <FoodContent />
    case 'delivery':
      return <DeliveryContent />
    default:
      return <GasContent />
  }
}

// Componente específico para sites de gás
function GasContent() {
  return (
    <div className="gas-content">
      <h1>🔥 Entrega de Gás de Cozinha</h1>
      <p>Botijões 13kg novos e lacrados</p>
      <p>Entrega rápida em até 30 minutos</p>
      {/* Conteúdo específico de gás */}
    </div>
  )
}

// Componente específico para sites de sushi
function SushiContent() {
  return (
    <div className="sushi-content">
      <h1>🍣 Delivery de Sushi</h1>
      <p>Sushi e temaki frescos</p>
      <p>Entrega rápida na sua região</p>
      {/* Conteúdo específico de sushi */}
    </div>
  )
}

// Componente específico para sites de comida
function FoodContent() {
  return (
    <div className="food-content">
      <h1>🍔 Delivery de Comida</h1>
      <p>Comida deliciosa na sua porta</p>
      {/* Conteúdo específico de comida */}
    </div>
  )
}

// Componente específico para sites de delivery genérico
function DeliveryContent() {
  return (
    <div className="delivery-content">
      <h1>🚚 Serviço de Delivery</h1>
      <p>Entrega rápida e segura</p>
      {/* Conteúdo específico de delivery */}
    </div>
  )
}

// Declaração global para TypeScript
declare global {
  interface Window {
    DOMAIN_CONFIG: {
      GOOGLE_ADS_TAG: string
      GOOGLE_ADS_CONVERSION: string
      GOOGLE_ADS_INITIATE_CHECKOUT?: string
      SITE_URL: string
      CATEGORY: SiteCategory
      SITE_NAME?: string
      SITE_DESCRIPTION?: string
    }
  }
}
