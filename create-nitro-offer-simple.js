const https = require('https');

const NITRO_API_TOKEN = process.argv[2];

if (!NITRO_API_TOKEN) {
  console.error('❌ Uso: node create-nitro-offer-simple.js SEU_TOKEN_AQUI');
  process.exit(1);
}

function makeRequest(url, method, body) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Status ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

async function createProduct() {
  console.log("📦 Criando produto Bolsas no Nitropay...");
  
  const productPayload = {
    title: "Bolsas",
    cover: "https://via.placeholder.com/400x400?text=Bolsas",
    sale_page: "https://example.com/bolsas",
    payment_type: 1,
    product_type: "digital",
    delivery_type: 1,
    id_category: 1,
    amount: 10000
  };

  const url = `https://api.nitropagamentos.com/api/public/v1/products?api_token=${NITRO_API_TOKEN}`;
  const product = await makeRequest(url, 'POST', productPayload);
  
  console.log("✅ Produto criado:", JSON.stringify(product, null, 2));
  return product;
}

async function createOffer(productHash, amount) {
  console.log(`\n📦 Criando oferta para produto ${productHash}...`);
  
  const offerPayload = {
    title: "Oferta Bolsas",
    cover: "https://via.placeholder.com/400x400?text=Bolsas",
    amount: amount
  };

  const url = `https://api.nitropagamentos.com/api/public/v1/products/${productHash}/offers?api_token=${NITRO_API_TOKEN}`;
  const offer = await makeRequest(url, 'POST', offerPayload);
  
  console.log("✅ Oferta criada:", JSON.stringify(offer, null, 2));
  return offer;
}

async function main() {
  try {
    const product = await createProduct();
    const productHash = product.hash || product.id;
    
    console.log(`\n✅ Product Hash: ${productHash}\n`);
    
    const offer = await createOffer(productHash, 10000);
    const offerHash = offer.hash || offer.id;
    
    console.log("\n" + "=".repeat(60));
    console.log("✅ CONFIGURAÇÃO COMPLETA!");
    console.log("=".repeat(60));
    console.log(`Product Hash: ${productHash}`);
    console.log(`Offer Hash: ${offerHash}`);
    console.log("=".repeat(60));
    console.log("\nAdicione no seu .env:");
    console.log(`NITRO_OFFER_HASH=${offerHash}`);
    console.log("=".repeat(60));
    
  } catch (error) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  }
}

main();
