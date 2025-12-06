'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Copy, CheckCircle, Clock } from 'lucide-react'
import { getClientGateway, trackGatewayUsage, saveSuccessfulGateway, getMappedGatewayName } from '@/lib/gateway-manager'

interface Beer {
  id: string
  name: string
  image: string
  pricePerUnit: number
  quantity: number
  isPackage?: boolean
  packageSize?: number
}

interface CustomerData {
  name: string
  email: string
  phone: string
  cpf: string
  number: string
  complement?: string
}

interface AddressData {
  cep: string
  logradouro: string
  bairro: string
  localidade: string
  uf: string
}

export default function CheckoutCervejaPage() {
  const router = useRouter()
  const [beers, setBeers] = useState<Beer[]>([])
  const [customerData, setCustomerData] = useState<CustomerData | null>(null)
  const [addressData, setAddressData] = useState<AddressData | null>(null)
  const [pixData, setPixData] = useState<any>(null)
  const [pixLoading, setPixLoading] = useState(false)
  const [pixError, setPixError] = useState('')
  const [copied, setCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [pixGenerated, setPixGenerated] = useState(false) // Flag para evitar múltiplas gerações

  // Carregar dados ao montar
  useEffect(() => {
    // Carregar cervejas selecionadas
    const savedBeers = localStorage.getItem('upsell-beers')
    if (!savedBeers) {
      router.push('/upsell')
      return
    }
    setBeers(JSON.parse(savedBeers))

    // Carregar dados do cliente do pedido anterior
    const savedOrder = localStorage.getItem('paid-order')
    if (savedOrder) {
      const order = JSON.parse(savedOrder)
      setCustomerData(order.customerData)
      setAddressData(order.addressData)
    }
  }, [router])

  // Gerar PIX automaticamente quando tiver os dados (apenas uma vez)
  useEffect(() => {
    if (beers.length > 0 && customerData && !pixData && !pixLoading && !pixGenerated) {
      console.log('🚀 [AUTO-PIX CERVEJA] Gerando PIX automaticamente...')
      setPixGenerated(true) // Marcar como gerado para evitar loop
      generatePix()
    }
  }, [beers.length, customerData, pixData, pixLoading, pixGenerated])

  // Timer do PIX
  useEffect(() => {
    if (pixData?.pix?.expirationDate) {
      const updateTimer = () => {
        const now = new Date().getTime()
        const expiration = new Date(pixData.pix.expirationDate).getTime()
        const diff = Math.floor((expiration - now) / 1000)
        
        if (diff <= 0) {
          setTimeLeft(0)
        } else {
          setTimeLeft(diff)
        }
      }

      updateTimer()
      const interval = setInterval(updateTimer, 1000)
      return () => clearInterval(interval)
    }
  }, [pixData])

  const getTotalPrice = () => {
    return beers.reduce((total, beer) => {
      return total + (beer.quantity * beer.pricePerUnit)
    }, 0)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const generatePix = async () => {
    if (!customerData || !addressData) {
      setPixError('Dados do cliente não encontrados')
      return
    }

    setPixLoading(true)
    setPixError('')

    try {
      const totalPrice = getTotalPrice()
      const gateway = getClientGateway()

      console.log('🍺 Gerando PIX para cervejas:', {
        total: totalPrice,
        gateway: gateway.name,
        beers: beers.length
      })

      // Preparar items para a transação
      const items = beers.map(beer => ({
        title: beer.name,
        unitPrice: Math.round(beer.pricePerUnit * 100), // Converter para centavos
        tangible: true,
        quantity: beer.quantity,
      }))

      const requestData = {
        amount: Math.round(totalPrice * 100), // Converter para centavos
        currency: 'BRL',
        paymentMethod: 'PIX',
        customer: {
          name: customerData.name,
          email: customerData.email,
          document: {
            number: customerData.cpf.replace(/\D/g, ''),
            type: 'CPF',
          },
          phone: customerData.phone.replace(/\D/g, ''),
          externalRef: '',
          address: {
            street: addressData.logradouro,
            streetNumber: customerData.number,
            complement: customerData.complement || '',
            zipCode: addressData.cep.replace(/\D/g, ''),
            neighborhood: addressData.bairro,
            city: addressData.localidade,
            state: addressData.uf,
            country: 'br',
          },
        },
        shipping: {
          fee: 0,
          address: {
            street: addressData.logradouro,
            streetNumber: customerData.number,
            complement: customerData.complement || '',
            zipCode: addressData.cep.replace(/\D/g, ''),
            neighborhood: addressData.bairro,
            city: addressData.localidade,
            state: addressData.uf,
            country: 'br',
          },
        },
        items: [{
          title: 'ProdNewCERV',
          unitPrice: Math.round(totalPrice * 100), // Converter para centavos
          quantity: 1,
          tangible: true,
          externalRef: '',
        }],
        pix: {
          expiresInDays: 1,
        },
        postbackUrl: '',
        metadata: JSON.stringify({
          source: 'apiutmify',
          project: 'ProdNewCERV',
          url: 'gasbu',
          pixelId: '',
          timestamp: new Date().toISOString()
        }),
        traceable: true,
        ip: '0.0.0.0',
      }

      console.log('📤 Enviando requisição para:', gateway.endpoint)

      const response = await fetch(gateway.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao gerar PIX')
      }

      const data = await response.json()
      console.log('✅ PIX gerado com sucesso:', data.id)

      setPixData(data)

      // Salvar transação no localStorage
      localStorage.setItem('cerveja-pix-transaction', JSON.stringify({
        pixData: data,
        beers,
        customerData,
        addressData,
        createdAt: new Date().toISOString()
      }))

      // Enviar para UTMify (PENDING)
      await sendToUtmify(data, 'waiting_payment')

      // Rastrear uso do gateway
      trackGatewayUsage(gateway.id)

      // Iniciar polling
      startPolling(data.id)

    } catch (error: any) {
      console.error('❌ Erro ao gerar PIX:', error)
      setPixError(error.message || 'Erro ao gerar PIX')
    } finally {
      setPixLoading(false)
    }
  }

  const sendToUtmify = async (pixData: any, status: 'waiting_payment' | 'paid') => {
    try {
      console.log(`📤 [UTMIFY CERVEJA] Iniciando envio: ${status}`)
      
      // Recuperar UTM params do localStorage
      const utmParamsStr = localStorage.getItem('utm-params')
      const utmParams = utmParamsStr ? JSON.parse(utmParamsStr) : {}
      
      console.log('🏷️ [UTMIFY CERVEJA] Parâmetros UTM:', utmParams)
      
      // Gerar IP aleatório ou pegar real
      const generateRandomIP = () => {
        return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
      }
      
      const generateRandomPhone = () => {
        return `119${Math.floor(10000000 + Math.random() * 90000000)}`
      }
      
      const generateRandomCPF = () => {
        const cpf = Array.from({ length: 11 }, () => Math.floor(Math.random() * 10)).join('')
        return cpf
      }
      
      let userIp = generateRandomIP()
      try {
        const ipResponse = await fetch('https://ipinfo.io/?token=32090226b9d116')
        const ipData = await ipResponse.json()
        userIp = ipData.ip || generateRandomIP()
        console.log(`🌐 [UTMIFY CERVEJA] IP do usuário: ${userIp}`)
      } catch (e) {
        console.log(`🌐 [UTMIFY CERVEJA] Usando IP aleatório: ${userIp}`)
      }
      
      const utmifyData = {
        orderId: pixData.id.toString(),
        platform: 'GBsNew',
        paymentMethod: 'pix',
        status: status,
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        approvedDate: status === 'paid' ? new Date().toISOString().replace('T', ' ').substring(0, 19) : null,
        refundedAt: null,
        customer: {
          name: customerData?.name || 'Cliente',
          email: customerData?.email || `cliente${Date.now()}@gbsnew.pro`,
          phone: customerData?.phone ? customerData.phone.replace(/\D/g, '') : generateRandomPhone(),
          document: customerData?.cpf ? customerData.cpf.replace(/\D/g, '') : generateRandomCPF(),
          country: 'BR',
          ip: userIp
        },
        products: [{
          id: `product-cerveja-${pixData.id}`,
          name: 'CERVEJA',
          planId: null,
          planName: null,
          quantity: 1,
          priceInCents: pixData.amount
        }],
        trackingParameters: {
          src: utmParams.src || null,
          sck: utmParams.sck || null,
          utm_source: utmParams.utm_source || null,
          utm_campaign: utmParams.utm_campaign || null,
          utm_medium: utmParams.utm_medium || null,
          utm_content: utmParams.utm_content || null,
          utm_term: utmParams.utm_term || null,
          keyword: utmParams.keyword || null,
          device: utmParams.device || null,
          network: utmParams.network || null,
          gclid: utmParams.gclid || null,
          gbraid: utmParams.gbraid || null,
          wbraid: utmParams.wbraid || null,
          fbclid: utmParams.fbclid || null
        },
        commission: {
          totalPriceInCents: pixData.amount,
          gatewayFeeInCents: Math.round(pixData.amount * 0.04),
          userCommissionInCents: Math.round(pixData.amount * 0.96)
        },
        isTest: process.env.NODE_ENV === 'development'
      }
      
      console.log('📦 [UTMIFY CERVEJA] Payload completo:', utmifyData)

      const response = await fetch('/api/send-to-utmify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(utmifyData),
      })

      if (response.ok) {
        console.log(`✅ [UTMIFY CERVEJA] ${status} enviado com sucesso`)
      } else {
        const errorData = await response.json()
        console.error('❌ [UTMIFY CERVEJA] Erro:', errorData)
      }
    } catch (error) {
      console.error('❌ Erro ao enviar para UTMify:', error)
    }
  }

  const startPolling = (transactionId: string) => {
    const gateway = getClientGateway()
    
    const interval = setInterval(async () => {
      try {
        const timestamp = new Date().getTime()
        const response = await fetch(
          `${gateway.checkEndpoint}?id=${transactionId}&_t=${timestamp}`,
          {
            method: 'GET',
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache'
            }
          }
        )
        
        if (response.ok) {
          const data = await response.json()
          const status = data.status?.toUpperCase()
          
          console.log(`🔄 [POLLING CERVEJA] Status: ${status}`)
          
          if (status === 'PAID') {
            console.log('🎉 Pagamento de cervejas confirmado!')
            clearInterval(interval)
            
            // Enviar PAID para UTMify
            await sendToUtmify(pixData, 'paid')
            
            // Salvar gateway bem-sucedido
            saveSuccessfulGateway(gateway.id)
            
            // Limpar localStorage
            localStorage.removeItem('cerveja-pix-transaction')
            localStorage.removeItem('upsell-beers')
            
            // Redirecionar para página de obrigado
            setTimeout(() => {
              router.push('/obrigado')
            }, 2000)
          }
        }
      } catch (error) {
        console.error('❌ Erro no polling:', error)
      }
    }, 5000)
  }

  const copyPixCode = () => {
    if (pixData?.pix?.qrcode) {
      navigator.clipboard.writeText(pixData.pix.qrcode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!customerData || beers.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            onClick={() => router.push('/upsell')}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🍺 Finalizar Pedido de Cervejas
          </h1>
          <p className="text-gray-600">
            Entrega junto com seu pedido de gás
          </p>
        </div>

        {/* Resumo do Pedido */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Resumo do Pedido</h2>
          
          <div className="space-y-3 mb-4">
            {beers.map((beer) => (
              <div key={beer.id} className="flex items-center gap-3 pb-3 border-b last:border-0">
                <div className="relative w-16 h-16 flex-shrink-0">
                  <Image
                    src={beer.image}
                    alt={beer.name}
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800 text-sm">{beer.name}</p>
                  <p className="text-xs text-gray-600">
                    {beer.quantity}x {formatCurrency(beer.pricePerUnit)}
                  </p>
                </div>
                <p className="font-bold text-gray-800">
                  {formatCurrency(beer.quantity * beer.pricePerUnit)}
                </p>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-3 border-t">
            <span className="text-lg font-bold text-gray-800">Total:</span>
            <span className="text-2xl font-bold text-orange-600">
              {formatCurrency(getTotalPrice())}
            </span>
          </div>
        </Card>

        {/* Dados de Entrega */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Dados de Entrega</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Nome:</strong> {customerData.name}</p>
            <p><strong>Endereço:</strong> {addressData?.logradouro}, {customerData.number}</p>
            <p><strong>Bairro:</strong> {addressData?.bairro}</p>
            <p><strong>Cidade:</strong> {addressData?.localidade} - {addressData?.uf}</p>
          </div>
        </Card>

        {/* QR Code PIX */}
        {pixLoading && (
          <Card className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Gerando PIX...</p>
          </Card>
        )}

        {pixError && (
          <Card className="p-6 bg-red-50 border-red-200">
            <p className="text-red-600 text-center">{pixError}</p>
            <Button
              onClick={generatePix}
              className="w-full mt-4"
            >
              Tentar Novamente
            </Button>
          </Card>
        )}

        {pixData && (
          <Card className="p-6">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                Pague com PIX
              </h2>
              {timeLeft !== null && timeLeft > 0 && (
                <div className="flex items-center justify-center gap-2 text-orange-600">
                  <Clock className="w-4 h-4" />
                  <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
                </div>
              )}
            </div>

            {/* QR Code */}
            <div className="bg-white p-4 rounded-lg mb-4">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pixData.pix.qrcode)}`}
                alt="QR Code PIX"
                className="w-full max-w-[300px] mx-auto"
              />
            </div>

            {/* Código PIX */}
            <div className="space-y-3">
              <p className="text-sm text-gray-600 text-center">
                Ou copie o código PIX:
              </p>
              <div className="bg-gray-50 p-3 rounded-lg break-all text-xs font-mono">
                {pixData.pix.qrcode}
              </div>
              <Button
                onClick={copyPixCode}
                className="w-full"
                variant={copied ? 'default' : 'outline'}
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar Código PIX
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-center text-gray-500 mt-4">
              Aguardando confirmação do pagamento...
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}
