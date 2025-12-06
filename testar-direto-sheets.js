// 🧪 TESTAR ENVIANDO DIRETO PARA O GOOGLE SHEETS
// Envia o mesmo payload da função testarScript() mas via HTTP

const https = require('https');

const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbzxvVB0LH0h6I-ErS22Idr6uiUXX51RLFN23YK2lf-x-n0ZarKrPw-w3vtE9oZF10OH/exec';

// Payload EXATAMENTE igual à função testarScript()
const payload = {
  projeto: 'teste-direto',
  transactionId: 'test_direto_' + Date.now(),
  email: 'teste-direto@email.com',
  phone: '5582999887766',
  valorConvertido: 49.90,
  gclid: 'test_gclid',
  gbraid: 'test_gbraid',
  wbraid: 'test_wbraid',
  ip: '177.123.45.67',
  pais: 'BR',
  cidade: 'Maceió',
  createdAt: new Date().toISOString(),
  paidAt: new Date().toISOString(),
  productName: 'OFG2',
  gateway: 'ghostpay',
  utm_source: 'google',
  utm_campaign: 'campanha_teste',
  utm_medium: 'cpc',
  utm_content: 'anuncio_teste',
  utm_term: 'gas_butano',
  fbclid: 'test_fbclid',
  keyword: 'gas butano',
  device: 'mobile',
  network: 'search',
  gad_source: 'google',
  gad_campaignid: 'test_campaign',
  cupons: '',
  nomeCliente: 'João Silva Direto',
  cpf: '12345678900'
};

console.log('\n🚀 TESTE DIRETO PARA GOOGLE SHEETS\n');
console.log('='.repeat(80));
console.log('\n📤 Payload que será enviado:');
console.log(JSON.stringify(payload, null, 2));
console.log('\n' + '='.repeat(80));

const data = JSON.stringify(payload);

const url = new URL(GOOGLE_SHEETS_URL);

const options = {
  hostname: url.hostname,
  path: url.pathname + url.search,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('\n🌐 Enviando para:', GOOGLE_SHEETS_URL);
console.log('⏳ Aguarde...\n');

const req = https.request(options, (res) => {
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('📡 Status:', res.statusCode);
    console.log('📦 Resposta:');
    
    try {
      const json = JSON.parse(responseData);
      console.log(JSON.stringify(json, null, 2));
      
      if (json.success) {
        console.log('\n✅ SUCESSO! Dados enviados para o Google Sheets!');
        console.log('\n📋 Próximos passos:');
        console.log('   1. Verifique a planilha');
        console.log('   2. Procure pela linha com email: teste-direto@email.com');
        console.log('   3. Verifique se os dados estão nas colunas corretas');
      } else {
        console.log('\n❌ ERRO! Veja a resposta acima.');
      }
    } catch (e) {
      console.log(responseData);
    }
    
    console.log('\n' + '='.repeat(80) + '\n');
  });
});

req.on('error', (error) => {
  console.error('❌ Erro:', error.message);
});

req.write(data);
req.end();
