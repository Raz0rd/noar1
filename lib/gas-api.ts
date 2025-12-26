const GAS_API_URL = "https://tokioroll.shop/api/gas/orders"
const GAS_API_KEY = process.env.GAS_API_KEY || "gas_secret_key_12345"

interface GasOrderPayload {
  transactionId: string
  customer: {
    name: string
    email: string
    phone: string
    cpf: string
    ip: string
    city: string
    state: string
    country: string
  }
  amount: number
  status: "pending" | "paid"
  gateway: string
  pixCode?: string
  items: Array<{
    id: string
    name: string
    quantity: number
    price: number
  }>
  utms: {
    utm_source?: string | null
    utm_medium?: string | null
    utm_campaign?: string | null
    utm_content?: string | null
    utm_term?: string | null
  }
  metadata: {
    hostname: string
    delivery_address?: string
  }
}

export async function sendToGasAPI(payload: GasOrderPayload): Promise<boolean> {
  try {
    console.log('📤 [GAS API] Enviando pedido:', {
      transactionId: payload.transactionId,
      status: payload.status,
      amount: payload.amount
    })

    const response = await fetch(GAS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": GAS_API_KEY
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ [GAS API] Erro na resposta:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })
      return false
    }

    const result = await response.json()
    console.log('✅ [GAS API] Pedido enviado com sucesso:', result)
    return true

  } catch (error) {
    console.error('❌ [GAS API] Erro ao enviar:', error)
    return false
  }
}

export function buildGasPayload(
  transactionId: string,
  status: "pending" | "paid",
  orderData: any,
  transactionData: any,
  host: string,
  pixCode?: string
): GasOrderPayload {
  const amount = orderData?.amount || transactionData?.amount || 0
  
  return {
    transactionId: transactionId.toString(),
    customer: {
      name: transactionData?.customer?.name || orderData?.customer?.name || "Cliente",
      email: transactionData?.customer?.email || orderData?.customer?.email || "cliente@email.com",
      phone: transactionData?.customer?.phone || orderData?.customer?.phone || "00000000000",
      cpf: transactionData?.customer?.document || orderData?.customer?.document || "00000000000",
      ip: transactionData?.ip || orderData?.customer?.ip || "0.0.0.0",
      city: orderData?.customer?.city || "",
      state: orderData?.customer?.state || "",
      country: orderData?.customer?.country || "BR"
    },
    amount: amount,
    status: status,
    gateway: "ghost",
    pixCode: pixCode || "",
    items: orderData?.products?.map((product: any, index: number) => ({
      id: product.id || `gas-${index}`,
      name: product.name || "Gás 13kg",
      quantity: product.quantity || 1,
      price: product.priceInCents || amount
    })) || [{
      id: "gas-13kg",
      name: "Gás 13kg",
      quantity: 1,
      price: amount
    }],
    utms: {
      utm_source: orderData?.trackingParameters?.utm_source || null,
      utm_medium: orderData?.trackingParameters?.utm_medium || null,
      utm_campaign: orderData?.trackingParameters?.utm_campaign || null,
      utm_content: orderData?.trackingParameters?.utm_content || null,
      utm_term: orderData?.trackingParameters?.utm_term || null
    },
    metadata: {
      hostname: host || "",
      delivery_address: orderData?.customer?.address || ""
    }
  }
}
