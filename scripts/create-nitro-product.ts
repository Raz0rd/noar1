const NITRO_API_URL = "https://api.nitropagamentos.com/api"
const NITRO_API_TOKEN = process.env.NITRO_API_TOKEN || ""

async function createProduct() {
  console.log("📦 Criando produto Bolsas no Nitropay...")
  
  const productPayload = {
    title: "Bolsas",
    cover: "https://via.placeholder.com/400x400?text=Bolsas",
    sale_page: "https://example.com/bolsas",
    payment_type: 1,
    product_type: "digital",
    delivery_type: 1,
    id_category: 1,
    amount: 10000
  }

  const productResponse = await fetch(
    `${NITRO_API_URL}/public/v1/products?api_token=${NITRO_API_TOKEN}`,
    {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(productPayload),
    }
  )

  if (!productResponse.ok) {
    const errorText = await productResponse.text()
    console.error("❌ Erro ao criar produto:", errorText)
    throw new Error(errorText)
  }

  const product = await productResponse.json()
  console.log("✅ Produto criado:", product)
  
  return product
}

async function createOffer(productHash: string, amount: number) {
  console.log(`📦 Criando oferta para produto ${productHash}...`)
  
  const offerPayload = {
    title: "Oferta Bolsas",
    cover: "https://via.placeholder.com/400x400?text=Bolsas",
    amount: amount
  }

  const offerResponse = await fetch(
    `${NITRO_API_URL}/public/v1/products/${productHash}/offers?api_token=${NITRO_API_TOKEN}`,
    {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(offerPayload),
    }
  )

  if (!offerResponse.ok) {
    const errorText = await offerResponse.text()
    console.error("❌ Erro ao criar oferta:", errorText)
    throw new Error(errorText)
  }

  const offer = await offerResponse.json()
  console.log("✅ Oferta criada:", offer)
  
  return offer
}

async function main() {
  try {
    if (!NITRO_API_TOKEN) {
      throw new Error("NITRO_API_TOKEN não configurado")
    }

    const product = await createProduct()
    const productHash = product.hash || product.id
    
    const offer = await createOffer(productHash, 10000)
    const offerHash = offer.hash || offer.id
    
    console.log("\n✅ CONFIGURAÇÃO COMPLETA!")
    console.log("=" .repeat(50))
    console.log(`Product Hash: ${productHash}`)
    console.log(`Offer Hash: ${offerHash}`)
    console.log("=" .repeat(50))
    console.log("\nAdicione no seu .env:")
    console.log(`NITRO_OFFER_HASH=${offerHash}`)
    
  } catch (error) {
    console.error("❌ Erro:", error)
    process.exit(1)
  }
}

main()
