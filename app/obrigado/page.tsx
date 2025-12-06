'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Package, Clock, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function ObrigadoPage() {
  const router = useRouter()

  useEffect(() => {
    // Limpar dados do pedido após 5 segundos
    const timer = setTimeout(() => {
      localStorage.removeItem('paid-order')
      localStorage.removeItem('upsell-beers')
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8 shadow-2xl">
        {/* Ícone de Sucesso */}
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 rounded-full p-6">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>
        </div>

        {/* Título */}
        <h1 className="text-3xl sm:text-4xl font-bold text-center text-gray-800 mb-4">
          Pedido Confirmado! 🎉
        </h1>

        <p className="text-center text-gray-600 mb-8 text-lg">
          Obrigado pela sua compra! Seu pedido foi recebido com sucesso.
        </p>

        {/* Informações */}
        <div className="space-y-4 mb-8">
          <div className="flex items-start gap-4 bg-blue-50 rounded-lg p-4">
            <Package className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-gray-800 mb-1">Pedido em Preparação</h3>
              <p className="text-sm text-gray-600">
                Nosso motoboy já foi notificado e está preparando sua entrega.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 bg-orange-50 rounded-lg p-4">
            <Clock className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-gray-800 mb-1">Tempo de Entrega</h3>
              <p className="text-sm text-gray-600">
                Seu pedido chegará em aproximadamente 30-45 minutos.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 bg-green-50 rounded-lg p-4">
            <Phone className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-gray-800 mb-1">Acompanhamento</h3>
              <p className="text-sm text-gray-600">
                Você receberá atualizações por WhatsApp sobre o status da entrega.
              </p>
            </div>
          </div>
        </div>

        {/* Botão */}
        <Button
          onClick={() => router.push('/')}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3"
        >
          Voltar para Início
        </Button>

        {/* Mensagem Final */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Agradecemos pela preferência! 💙
        </p>
      </Card>
    </div>
  )
}
