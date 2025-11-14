"use client"

import { useEffect, useState } from "react"
import { getCurrentGatewayInfo, type GatewayType } from "@/lib/gateway-manager"

/**
 * Componente visual para indicar qual gateway está sendo usado
 * Útil para debug e transparência com o usuário
 */
export default function GatewayIndicator() {
  const [gatewayInfo, setGatewayInfo] = useState<{ id: GatewayType; name: string } | null>(null)
  const [showIndicator, setShowIndicator] = useState(false)

  useEffect(() => {
    const info = getCurrentGatewayInfo()
    setGatewayInfo(info)
    
    // Mostrar indicador apenas em localhost ou se houver parâmetro ?debug=1
    const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost'
    const hasDebug = typeof window !== 'undefined' && window.location.search.includes('debug=1')
    setShowIndicator(isLocalhost || hasDebug)
  }, [])

  if (!showIndicator || !gatewayInfo) {
    return null
  }

  const getGatewayColor = (id: GatewayType): string => {
    const colors: Record<GatewayType, string> = {
      ezzpag: 'bg-blue-500',
      blackcat: 'bg-purple-500',
      ativo: 'bg-green-500',
      ghost: 'bg-orange-500',
    }
    return colors[id] || 'bg-gray-500'
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`${getGatewayColor(gatewayInfo.id)} text-white px-3 py-2 rounded-lg shadow-lg text-xs font-mono flex items-center gap-2`}>
        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
        <span>Gateway: {gatewayInfo.name}</span>
      </div>
    </div>
  )
}
