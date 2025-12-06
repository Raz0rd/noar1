'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Minus, Plus, ShoppingCart, ArrowLeft, Sparkles } from 'lucide-react'

interface Beer {
  id: string
  name: string
  image: string
  pricePerUnit: number
  minQuantity: number
  isPackage?: boolean
  packageSize?: number
}

const beers: Beer[] = [
  {
    id: 'budweiser',
    name: 'Budweiser Long Neck 330ML',
    image: '/cervejas/Budweiser Long Neck 330ML.webp',
    pricePerUnit: 4.00,
    minQuantity: 6,
  },
  {
    id: 'corona',
    name: 'Corona Pack 6 unidades 330ML',
    image: '/cervejas/Corona Pack 6unidades 330ML.webp',
    pricePerUnit: 27.40,
    minQuantity: 1,
    isPackage: true,
    packageSize: 6,
  },
  {
    id: 'heineken',
    name: 'Heineken 350ML Lata',
    image: '/cervejas/Heineken 350ML Lata.webp',
    pricePerUnit: 4.10,
    minQuantity: 6,
  },
  {
    id: 'original',
    name: 'Original 300ML',
    image: '/cervejas/Cerveja Original 300ML.webp',
    pricePerUnit: 3.10,
    minQuantity: 6,
  },
]

export default function UpsellPage() {
  const router = useRouter()
  const audioRef = useRef<HTMLAudioElement>(null)
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [audioPlayed, setAudioPlayed] = useState(false)

  // Função para tocar áudio
  const playAudio = async () => {
    if (audioRef.current && !audioPlayed) {
      try {
        await audioRef.current.play()
        setAudioPlayed(true)
        console.log('🎵 Áudio tocando!')
      } catch (error) {
        console.log('Erro ao tocar áudio:', error)
      }
    }
  }

  const handleQuantityChange = (beerId: string, delta: number) => {
    const beer = beers.find(b => b.id === beerId)
    if (!beer) return

    const currentQty = quantities[beerId] || 0
    const newQty = Math.max(0, currentQty + delta)

    // Validar quantidade mínima
    if (newQty > 0 && newQty < beer.minQuantity) {
      return
    }

    setQuantities(prev => ({
      ...prev,
      [beerId]: newQty
    }))

    // Tocar áudio quando adicionar Corona
    if (beerId === 'corona' && newQty > currentQty) {
      playAudio()
    }
  }

  const getTotalPrice = () => {
    return beers.reduce((total, beer) => {
      const qty = quantities[beer.id] || 0
      return total + (qty * beer.pricePerUnit)
    }, 0)
  }

  const getTotalItems = () => {
    return Object.values(quantities).reduce((sum, qty) => sum + qty, 0)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const handleCheckout = () => {
    const selectedBeers = beers
      .filter(beer => (quantities[beer.id] || 0) > 0)
      .map(beer => ({
        ...beer,
        quantity: quantities[beer.id]
      }))

    if (selectedBeers.length === 0) {
      alert('Selecione pelo menos uma cerveja!')
      return
    }

    // Salvar no localStorage e redirecionar
    localStorage.setItem('upsell-beers', JSON.stringify(selectedBeers))
    router.push('/checkout-cerveja')
  }

  const handleSkip = () => {
    router.push('/obrigado')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50">
      {/* Áudio de fundo */}
      <audio ref={audioRef} src="/cervejas/divo.m4a" />

      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white py-6 px-4 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 animate-pulse" />
            <h1 className="text-2xl sm:text-3xl font-bold">
              🍺 Oferta Exclusiva para Você!
            </h1>
          </div>
          <p className="text-amber-100 text-sm sm:text-base">
            Aproveite preços especiais em cervejas geladas! 🧊
          </p>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Banner Promocional */}
        <Card className="bg-gradient-to-r from-yellow-400 to-orange-400 border-none p-6 mb-8 text-center shadow-xl">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-6 h-6 text-white" />
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Promoção Exclusiva!
            </h2>
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <p className="text-white text-sm sm:text-base font-medium">
            Apenas para clientes selecionados • Entrega junto com seu pedido
          </p>
        </Card>

        {/* Grid de Cervejas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {beers.map((beer) => {
            const qty = quantities[beer.id] || 0
            const isMinQtyMet = qty === 0 || qty >= beer.minQuantity

            return (
              <Card key={beer.id} className="overflow-hidden hover:shadow-xl transition-shadow">
                {/* Imagem */}
                <div className="relative h-48 bg-gradient-to-br from-gray-50 to-gray-100">
                  <Image
                    src={beer.image}
                    alt={beer.name}
                    fill
                    className="object-contain p-4"
                  />
                  {beer.isPackage && (
                    <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      Pack {beer.packageSize}un
                    </div>
                  )}
                </div>

                {/* Informações */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-bold text-gray-800 text-sm mb-1">
                      {beer.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      Mínimo: {beer.minQuantity} {beer.isPackage ? 'pack' : 'unidades'}
                    </p>
                  </div>

                  {/* Preço */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-center">
                    <p className="text-2xl font-bold text-green-700">
                      {formatCurrency(beer.pricePerUnit)}
                    </p>
                    <p className="text-xs text-gray-600">
                      {beer.isPackage ? 'por pack' : 'por unidade'}
                    </p>
                  </div>

                  {/* Controles de Quantidade */}
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleQuantityChange(beer.id, -1)}
                      disabled={qty === 0}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    
                    <div className="flex-1 text-center">
                      <p className="text-2xl font-bold text-gray-800">{qty}</p>
                      {qty > 0 && (
                        <p className="text-xs text-gray-500">
                          {formatCurrency(qty * beer.pricePerUnit)}
                        </p>
                      )}
                    </div>
                    
                    <Button
                      onClick={() => handleQuantityChange(beer.id, beer.minQuantity)}
                      variant="default"
                      size="sm"
                      className="flex-1 bg-orange-600 hover:bg-orange-700"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Aviso de quantidade mínima */}
                  {!isMinQtyMet && (
                    <p className="text-xs text-red-600 text-center font-medium">
                      ⚠️ Mínimo {beer.minQuantity} unidades
                    </p>
                  )}
                </div>
              </Card>
            )
          })}
        </div>

        {/* Resumo e Ações */}
        <Card className="sticky bottom-4 p-6 shadow-2xl border-2 border-orange-300">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Total */}
            <div className="text-center sm:text-left">
              <p className="text-sm text-gray-600 mb-1">
                {getTotalItems()} {getTotalItems() === 1 ? 'item' : 'itens'} selecionado(s)
              </p>
              <p className="text-3xl font-bold text-orange-600">
                {formatCurrency(getTotalPrice())}
              </p>
            </div>

            {/* Botões */}
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button
                onClick={handleSkip}
                variant="outline"
                className="w-full sm:w-auto"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Não, obrigado
              </Button>
              
              <Button
                onClick={handleCheckout}
                disabled={getTotalItems() === 0}
                className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold px-8"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Adicionar ao Pedido
              </Button>
            </div>
          </div>
        </Card>

        {/* Benefícios */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="bg-white rounded-lg p-4 shadow">
            <p className="text-3xl mb-2">🚚</p>
            <p className="font-bold text-gray-800 text-sm">Entrega Junto</p>
            <p className="text-xs text-gray-600">Com seu pedido de gás</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <p className="text-3xl mb-2">🧊</p>
            <p className="font-bold text-gray-800 text-sm">Bem Gelada</p>
            <p className="text-xs text-gray-600">Direto da geladeira</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <p className="text-3xl mb-2">💰</p>
            <p className="font-bold text-gray-800 text-sm">Preço Especial</p>
            <p className="text-xs text-gray-600">Só para você</p>
          </div>
        </div>
      </div>
    </div>
  )
}
