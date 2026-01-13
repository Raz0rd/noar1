"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Send, Upload, Loader2, MessageCircle, CheckCircle, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"

interface Message {
  id: string
  type: 'bot' | 'user'
  content: string
  timestamp: Date
  options?: string[]
  showUpload?: boolean
  showPixCode?: boolean
  pixData?: {
    qrcode: string
    amount: number
  }
  paymentStatus?: 'pending' | 'paid' | 'not_found' | null
}

type ChatState = 
  | 'welcome'
  | 'waiting_input'
  | 'checking_payment'
  | 'payment_pending'
  | 'payment_paid'
  | 'waiting_receipt'
  | 'receipt_sent'
  | 'general_help'
  | 'no_payment_found'
  | 'showing_pix'

interface StoredPayment {
  pixData?: {
    id: string
    status: string
    amount?: number
    pix?: {
      qrcode: string
      qrcodeUrl?: string
    }
  }
  customerData?: {
    name: string
    phone: string
  }
}

export default function SuportePage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [chatState, setChatState] = useState<ChatState>('welcome')
  const [isTyping, setIsTyping] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(null)
  const [storedPayment, setStoredPayment] = useState<StoredPayment | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadingReceipt, setUploadingReceipt] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const hasInitialized = useRef(false)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  // Função para simular digitação do bot
  const typeMessage = async (
    content: string, 
    options?: string[], 
    showUpload?: boolean,
    paymentStatus?: 'pending' | 'paid' | 'not_found',
    delay: number = 1000,
    showPixCode?: boolean,
    pixData?: { qrcode: string; amount: number }
  ) => {
    setIsTyping(true)
    await new Promise(resolve => setTimeout(resolve, delay))
    setIsTyping(false)
    
    const newMessage: Message = {
      id: `bot-${Date.now()}`,
      type: 'bot',
      content,
      timestamp: new Date(),
      options,
      showUpload,
      paymentStatus,
      showPixCode,
      pixData
    }
    setMessages(prev => [...prev, newMessage])
  }

  // Buscar dados do pagamento do localStorage ao carregar
  useEffect(() => {
    if (hasInitialized.current) return
    hasInitialized.current = true
    
    // Buscar PIX salvo no localStorage
    const savedPix = localStorage.getItem('current-pix-transaction')
    if (savedPix) {
      try {
        const parsed = JSON.parse(savedPix)
        setStoredPayment(parsed)
        if (parsed.pixData?.id) {
          setCurrentPaymentId(parsed.pixData.id)
        }
      } catch (e) {
        console.log('Erro ao parsear PIX salvo:', e)
      }
    }
    
    // Iniciar conversa com boas vindas
    startWelcomeFlow()
  }, [])

  // Fluxo de boas vindas
  const startWelcomeFlow = async () => {
    await typeMessage(
      'Oii! Tudo bem? 👋',
      undefined,
      false,
      undefined,
      3000
    )
    
    await typeMessage(
      'Seja bem-vindo ao suporte! Me conta, como posso te ajudar?',
      ['Problema com pagamento', 'Dúvidas sobre entrega', 'Outros assuntos'],
      false,
      undefined,
      4000
    )
    
    setChatState('waiting_input')
  }

  // Detectar intenção do usuário
  const detectIntent = (text: string): 'payment' | 'delivery' | 'other' => {
    const lowerText = text.toLowerCase()
    
    const paymentKeywords = [
      'pagamento', 'pagar', 'paguei', 'pix', 'pendente', 'não confirmou',
      'comprovante', 'problema', 'erro', 'não foi', 'caiu', 'debitou',
      'descontou', 'cobrou', 'valor', 'dinheiro', 'transferi', 'transferência',
      'qr code', 'qrcode', 'código', 'copia e cola', 'não apareceu'
    ]
    
    const deliveryKeywords = [
      'entrega', 'entregar', 'motoboy', 'chegou', 'demora', 'atrasou',
      'atraso', 'pedido', 'endereço', 'onde está', 'rastrear', 'rastreio'
    ]
    
    if (paymentKeywords.some(keyword => lowerText.includes(keyword))) {
      return 'payment'
    }
    
    if (deliveryKeywords.some(keyword => lowerText.includes(keyword))) {
      return 'delivery'
    }
    
    return 'other'
  }

  // Verificar status do pagamento
  const checkPaymentStatus = async (paymentId: string) => {
    setIsLoading(true)
    setChatState('checking_payment')
    
    await typeMessage('Aguarda só um pouquinho que vou dar uma olhada no seu pedido aqui... 🔍', undefined, false, undefined, 4000)
    
    // Esperar 40 segundos simulando verificação no sistema
    await new Promise(resolve => setTimeout(resolve, 40000))
    
    try {
      const response = await fetch(`/api/check-ghost-payment?id=${paymentId}&_t=${Date.now()}`)
      const data = await response.json()
      
      if (response.ok && data.id) {
        setCurrentPaymentId(paymentId)
        
        if (data.status === 'paid') {
          setChatState('payment_paid')
          await typeMessage(
            `Achei aqui! ✅`,
            undefined,
            false,
            undefined,
            3500
          )
          await typeMessage(
            `Que ótimo, seu pagamento tá certinho! O valor de R$ ${(data.amount / 100).toFixed(2)} já foi confirmado. Se ainda não recebeu a entrega, relaxa que o motoboy já tá a caminho! 🛵`,
            undefined,
            false,
            'paid',
            5000
          )
        } else if (data.status === 'waiting_payment') {
          setChatState('payment_pending')
          await typeMessage(
            `Então, achei seu pedido! O pagamento de R$ ${(data.amount / 100).toFixed(2)} tá aparecendo como pendente ainda. Você já fez o pagamento?`,
            ['Sim, já paguei', 'Ainda não paguei'],
            false,
            'pending',
            5500
          )
        } else {
          setChatState('general_help')
          await typeMessage(
            `Poxa, parece que esse pagamento foi recusado ou cancelado 😕 Tenta gerar um novo PIX lá na página de pagamento, tá?`,
            undefined,
            false,
            undefined,
            5000
          )
        }
      } else {
        setChatState('no_payment_found')
        await typeMessage(
          'Opa, não consegui encontrar nenhum pagamento recente aqui no sistema 🤔',
          undefined,
          false,
          undefined,
          4000
        )
        await typeMessage(
          'Tenta voltar lá na página de pagamento pra gente conseguir identificar direitinho, tá?',
          ['Voltar ao início'],
          false,
          undefined,
          4500
        )
      }
    } catch (error) {
      console.error('Erro ao verificar pagamento:', error)
      setChatState('general_help')
      await typeMessage(
        'Xiii, deu um probleminha aqui pra verificar 😅 Tenta de novo daqui a pouquinho?',
        ['Tentar novamente'],
        false,
        undefined,
        4000
      )
    } finally {
      setIsLoading(false)
    }
  }

  // Adicionar mensagem do bot
  const addBotMessage = (
    content: string, 
    options?: string[], 
    showUpload?: boolean,
    paymentStatus?: 'pending' | 'paid' | 'not_found'
  ) => {
    const newMessage: Message = {
      id: `bot-${Date.now()}`,
      type: 'bot',
      content,
      timestamp: new Date(),
      options,
      showUpload,
      paymentStatus
    }
    setMessages(prev => [...prev, newMessage])
  }

  // Adicionar mensagem do usuário
  const addUserMessage = (content: string) => {
    const newMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, newMessage])
  }

  // Processar mensagem do usuário
  const processUserMessage = async (text: string) => {
    addUserMessage(text)
    
    switch (chatState) {
      case 'waiting_input':
        const intent = detectIntent(text)
        
        if (intent === 'payment' || text === 'Problema com pagamento') {
          // Verificar automaticamente se tem ID salvo no localStorage
          if (currentPaymentId) {
            await typeMessage(
              'Entendi! Vou verificar aqui pra você, só um minutinho...',
              undefined,
              false,
              undefined,
              3500
            )
            checkPaymentStatus(currentPaymentId)
          } else {
            setChatState('no_payment_found')
            await typeMessage(
              'Hmm, não tô conseguindo encontrar seu pagamento aqui 🤔',
              undefined,
              false,
              undefined,
              4000
            )
            await typeMessage(
              'Tenta voltar lá na página do PIX e depois volta aqui, aí consigo te ajudar melhor!',
              ['Voltar ao início'],
              false,
              undefined,
              4500
            )
          }
        } else if (intent === 'delivery' || text === 'Dúvidas sobre entrega') {
          setChatState('general_help')
          await typeMessage(
            'Sobre a entrega, ó...',
            undefined,
            false,
            undefined,
            3000
          )
          await typeMessage(
            'Depois que o pagamento é confirmado, nosso motoboy entra em contato em até 10 minutinhos! E a entrega chega em até 30 min 🛵',
            ['Problema com pagamento', 'Voltar ao início'],
            false,
            undefined,
            5000
          )
        } else if (text === 'Tentar novamente' && currentPaymentId) {
          checkPaymentStatus(currentPaymentId)
        } else if (text === 'Voltar ao início') {
          router.push('/')
        } else {
          setChatState('general_help')
          await typeMessage(
            'Me conta mais, como posso te ajudar? 😊',
            ['Problema com pagamento', 'Dúvidas sobre entrega'],
            false,
            undefined,
            3500
          )
        }
        break
        
      case 'payment_pending':
        // IMPORTANTE: Verificar "Ainda não" ANTES de "paguei" pois "Ainda não paguei" contém ambos
        if (text.includes('Ainda não') || text === 'Ainda não paguei') {
          // Redirecionar direto para o checkout para ver o QR code
          await typeMessage(
            'Beleza! Vou te mandar de volta pra página de pagamento pra você finalizar o PIX. Qualquer probleminha, volta aqui que te ajudo! 😊',
            undefined,
            false,
            undefined,
            3000
          )
          // Redirecionar após a mensagem - usar window.location para forçar reload completo
          setTimeout(() => {
            // Recuperar UTM params salvos no localStorage
            const savedUtm = localStorage.getItem('utm-params')
            let utmString = '?return=support'
            if (savedUtm) {
              try {
                const utmParams = JSON.parse(savedUtm)
                const params = new URLSearchParams()
                params.set('return', 'support')
                if (utmParams.utm_source) params.set('utm_source', utmParams.utm_source)
                if (utmParams.utm_campaign) params.set('utm_campaign', utmParams.utm_campaign)
                if (utmParams.utm_medium) params.set('utm_medium', utmParams.utm_medium)
                if (utmParams.utm_content) params.set('utm_content', utmParams.utm_content)
                if (utmParams.utm_term) params.set('utm_term', utmParams.utm_term)
                utmString = '?' + params.toString()
              } catch (e) {
                console.log('Erro ao recuperar UTM params')
              }
            }
            window.location.href = '/checkout' + utmString
          }, 1500)
        } else if (text.includes('Sim') || text === 'Sim, já paguei' || text.toLowerCase().includes('sim')) {
          setChatState('waiting_receipt')
          await typeMessage(
            'Beleza! Então me manda o comprovante de pagamento aqui que eu já passo pro nosso time verificar e liberar seu pedido rapidinho! 📎',
            undefined,
            true,
            undefined,
            5000
          )
        } else if (text.toLowerCase().includes('não')) {
          // Redirecionar direto para o checkout para ver o QR code
          await typeMessage(
            'Beleza! Vou te mandar de volta pra página de pagamento pra você finalizar o PIX. Qualquer probleminha, volta aqui que te ajudo! 😊',
            undefined,
            false,
            undefined,
            3000
          )
          // Redirecionar após a mensagem - usar window.location para forçar reload completo
          setTimeout(() => {
            // Recuperar UTM params salvos no localStorage
            const savedUtm = localStorage.getItem('utm-params')
            let utmString = '?return=support'
            if (savedUtm) {
              try {
                const utmParams = JSON.parse(savedUtm)
                const params = new URLSearchParams()
                params.set('return', 'support')
                if (utmParams.utm_source) params.set('utm_source', utmParams.utm_source)
                if (utmParams.utm_campaign) params.set('utm_campaign', utmParams.utm_campaign)
                if (utmParams.utm_medium) params.set('utm_medium', utmParams.utm_medium)
                if (utmParams.utm_content) params.set('utm_content', utmParams.utm_content)
                if (utmParams.utm_term) params.set('utm_term', utmParams.utm_term)
                utmString = '?' + params.toString()
              } catch (e) {
                console.log('Erro ao recuperar UTM params')
              }
            }
            window.location.href = '/checkout' + utmString
          }, 1500)
        } else {
          await typeMessage(
            'Só pra eu entender melhor... você já fez o pagamento do PIX?',
            ['Sim, já paguei', 'Ainda não paguei'],
            false,
            undefined,
            3500
          )
        }
        break
        
      case 'waiting_receipt':
        await typeMessage(
          'É só clicar no botão aí embaixo pra enviar o comprovante! 📎',
          undefined,
          true,
          undefined,
          3000
        )
        break
        
      case 'no_payment_found':
        if (text === 'Voltar ao início') {
          router.push('/')
        } else {
          await typeMessage(
            'Mais alguma coisa que eu possa te ajudar? 😊',
            ['Problema com pagamento', 'Voltar ao início'],
            false,
            undefined,
            3500
          )
        }
        break
        
      case 'showing_pix':
        if (text === 'Já paguei!' || text.toLowerCase().includes('paguei')) {
          // Usuário disse que pagou, pedir comprovante
          setChatState('waiting_receipt')
          await typeMessage(
            'Boa! Me manda o comprovante aqui que eu verifico pra você! 📎',
            undefined,
            true,
            undefined,
            4000
          )
        } else if (text === 'Voltar ao início') {
          router.push('/')
        } else {
          await typeMessage(
            'Faz o PIX aí pelo QR code ou copia e cola! Quando pagar, clica em "Já paguei!" 😊',
            ['Já paguei!', 'Voltar ao início'],
            false,
            undefined,
            3500
          )
        }
        break
        
      case 'payment_paid':
      case 'receipt_sent':
      case 'general_help':
        if (text === 'Voltar ao início') {
          router.push('/')
          return
        }
        
        if (text === 'Voltar e pagar agora') {
          // Recuperar UTM params salvos no localStorage
          const savedUtm = localStorage.getItem('utm-params')
          let utmString = '?return=support'
          if (savedUtm) {
            try {
              const utmParams = JSON.parse(savedUtm)
              const params = new URLSearchParams()
              params.set('return', 'support')
              if (utmParams.utm_source) params.set('utm_source', utmParams.utm_source)
              if (utmParams.utm_campaign) params.set('utm_campaign', utmParams.utm_campaign)
              if (utmParams.utm_medium) params.set('utm_medium', utmParams.utm_medium)
              if (utmParams.utm_content) params.set('utm_content', utmParams.utm_content)
              if (utmParams.utm_term) params.set('utm_term', utmParams.utm_term)
              utmString = '?' + params.toString()
            } catch (e) {
              console.log('Erro ao recuperar UTM params')
            }
          }
          window.location.href = '/checkout' + utmString
          return
        }
        
        const newIntent = detectIntent(text)
        if (newIntent === 'payment' && currentPaymentId) {
          checkPaymentStatus(currentPaymentId)
        } else if (text === 'Tentar novamente' && currentPaymentId) {
          checkPaymentStatus(currentPaymentId)
        } else {
          await typeMessage(
            'Mais alguma coisa que posso te ajudar? 😊',
            ['Problema com pagamento', 'Dúvidas sobre entrega', 'Não, obrigado'],
            false,
            undefined,
            3500
          )
        }
        break
    }
  }

  // Enviar mensagem
  const handleSend = () => {
    if (!inputValue.trim() || isLoading || isTyping) return
    
    processUserMessage(inputValue.trim())
    setInputValue("")
  }

  // Selecionar opção rápida
  const handleOptionClick = async (option: string) => {
    if (isTyping || isLoading) return
    
    if (option === 'Não, obrigado') {
      addUserMessage(option)
      await typeMessage(
        'Obrigado por entrar em contato! Se precisar de ajuda novamente, estarei aqui. 😊',
        undefined,
        false,
        undefined,
        1000
      )
      return
    }
    
    processUserMessage(option)
  }

  // Selecionar arquivo
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  // Enviar comprovante
  const handleSendReceipt = async () => {
    if (!selectedFile || !currentPaymentId) return
    
    setUploadingReceipt(true)
    addUserMessage(`[Comprovante enviado: ${selectedFile.name}]`)
    
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('paymentId', currentPaymentId)
      formData.append('message', 'Pagamento pendente - cliente enviou comprovante')
      
      const response = await fetch('/api/support/receipt', { 
        method: 'POST', 
        body: formData 
      })
      
      const result = await response.json()
      
      if (result.success) {
        setChatState('receipt_sent')
        addBotMessage(
          `Comprovante recebido com sucesso! Estamos verificando o pagamento #${currentPaymentId}. Nosso time de suporte analisará em até 5 minutos e liberará seu pedido. Obrigado pela paciência!`
        )
      } else {
        addBotMessage(
          `Houve um problema ao enviar o comprovante: ${result.error}. Por favor, tente novamente.`,
          undefined,
          true
        )
      }
      
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Erro ao enviar comprovante:', error)
      addBotMessage(
        'Erro ao enviar o comprovante. Por favor, tente novamente.',
        undefined,
        true
      )
    } finally {
      setUploadingReceipt(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-800">Suporte</h1>
              <p className="text-xs text-green-600 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Online agora
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}
            >
              {/* Avatar do atendente */}
              {message.type === 'bot' && (
                <div className="flex-shrink-0 mb-1">
                  <img 
                    src="https://ui-avatars.com/api/?name=Ana&background=10b981&color=fff&size=32&rounded=true&bold=true"
                    alt="Ana - Atendente"
                    className="w-8 h-8 rounded-full"
                  />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white rounded-br-md'
                    : 'bg-white shadow-sm border rounded-bl-md'
                }`}
              >
                {/* Status indicator */}
                {message.paymentStatus && (
                  <div className={`flex items-center gap-2 mb-2 text-sm font-medium ${
                    message.paymentStatus === 'paid' ? 'text-green-600' : 
                    message.paymentStatus === 'pending' ? 'text-amber-600' : 'text-red-600'
                  }`}>
                    {message.paymentStatus === 'paid' ? (
                      <><CheckCircle className="h-4 w-4" /> Pagamento Confirmado</>
                    ) : message.paymentStatus === 'pending' ? (
                      <><AlertCircle className="h-4 w-4" /> Pagamento Pendente</>
                    ) : (
                      <><AlertCircle className="h-4 w-4" /> Não Encontrado</>
                    )}
                  </div>
                )}
                
                <p className={`text-sm ${message.type === 'user' ? 'text-white' : 'text-gray-700'}`}>
                  {message.content}
                </p>
                
                {/* Opções rápidas */}
                {message.options && message.options.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.options.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleOptionClick(option)}
                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-full transition-colors border"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
                
                {/* QR Code PIX */}
                {message.showPixCode && message.pixData && (
                  <div className="mt-3 p-4 bg-gradient-to-b from-green-50 to-white rounded-lg border border-green-200">
                    {/* QR Code */}
                    <div className="text-center mb-3">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(message.pixData.qrcode)}`}
                        alt="QR Code PIX"
                        className="mx-auto w-40 h-40 border rounded-lg bg-white p-2"
                      />
                    </div>
                    
                    {/* Código Copia e Cola */}
                    <div className="space-y-2">
                      <p className="text-xs text-gray-600 text-center font-medium">Ou copie o código PIX:</p>
                      <textarea 
                        value={message.pixData.qrcode} 
                        readOnly 
                        className="w-full font-mono text-xs p-2 border border-gray-300 rounded-md bg-gray-50 resize-none"
                        rows={2}
                        onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                      />
                      <Button
                        onClick={async () => {
                          await navigator.clipboard.writeText(message.pixData!.qrcode)
                          alert('Código PIX copiado!')
                        }}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        📋 Copiar código PIX
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Upload de comprovante */}
                {message.showUpload && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="receipt-upload"
                    />
                    
                    {!selectedFile ? (
                      <label
                        htmlFor="receipt-upload"
                        className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                      >
                        <Upload className="h-5 w-5 text-gray-400" />
                        <span className="text-sm text-gray-600">Clique para enviar comprovante</span>
                      </label>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="truncate">{selectedFile.name}</span>
                        </div>
                        <Button
                          onClick={handleSendReceipt}
                          disabled={uploadingReceipt}
                          className="w-full bg-green-600 hover:bg-green-700"
                          size="sm"
                        >
                          {uploadingReceipt ? (
                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando...</>
                          ) : (
                            <><Send className="h-4 w-4 mr-2" /> Enviar Comprovante</>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                
                <p className={`text-xs mt-1 ${message.type === 'user' ? 'text-blue-200' : 'text-gray-400'}`}>
                  {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          
          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start items-end gap-2">
              <div className="flex-shrink-0 mb-1">
                <img 
                  src="https://ui-avatars.com/api/?name=Ana&background=10b981&color=fff&size=32&rounded=true&bold=true"
                  alt="Ana - Atendente"
                  className="w-8 h-8 rounded-full"
                />
              </div>
              <div className="bg-white shadow-sm border rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="text-sm text-gray-500">Ana está digitando...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t sticky bottom-0">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Digite sua mensagem..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              className="bg-blue-600 hover:bg-blue-700 shrink-0"
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
