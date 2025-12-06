// 🧪 SIMULADOR COMPLETO DO GOOGLE APPS SCRIPT
// Execute: node simular-google-sheets.js

console.log('\n🔧 SIMULANDO GOOGLE APPS SCRIPT\n');
console.log('='.repeat(80));

// Simular o payload que enviamos (igual ao nosso webhook)
const payload = {
  projeto: 'localhost:3002',
  createdAt: '2025-12-05T22:00:00.000Z',
  paidAt: '2025-12-05T22:05:00.000Z',
  transactionId: 'test_123456',
  email: 'teste@email.com',
  phone: '5582999887766',
  nomeCliente: 'João Silva',
  cpf: '12345678900',
  valorConvertido: 49.90,
  productName: 'OFG2',
  gateway: 'ghostpay',
  pais: 'BR',
  cidade: 'Maceió',
  ip: '177.123.45.67',
  gclid: 'Cj0KCQiA_test_gclid_12345',
  gbraid: '1BbKGqC_test_gbraid_67890',
  wbraid: 'EjkKCAjw_test_wbraid_11111',
  utm_source: 'google',
  utm_campaign: 'campanha_teste',
  utm_medium: 'cpc',
  utm_content: 'anuncio_teste',
  utm_term: 'gas_butano_teste',
  fbclid: 'IwAR_test_fbclid_22222',
  keyword: 'gas butano',
  device: 'mobile',
  network: 'search',
  gad_source: 'google',
  gad_campaignid: 'Cj0KCQiA_test_gclid_12345',
  cupons: ''
};

console.log('\n📦 PAYLOAD RECEBIDO:');
console.log(JSON.stringify(payload, null, 2));

// Simular o que o Google Apps Script faz
let data;
let nomeAba;

if (Array.isArray(payload)) {
  console.log('\n📋 Recebido como ARRAY');
  nomeAba = String(payload[0] || 'default').replace(/[:\/?*\[\]]/g, '_');
  data = payload;
} else {
  console.log('\n📦 Recebido como OBJETO - convertendo para array');
  nomeAba = String(payload.projeto || 'default').replace(/[:\/?*\[\]]/g, '_');
  
  // Converter objeto para array NA ORDEM CORRETA
  data = [
    payload.projeto || '',
    payload.transactionId || '',
    payload.email || '',
    payload.phone || '',
    payload.valorConvertido || 0,
    payload.gclid || '',
    payload.gbraid || '',
    payload.wbraid || '',
    payload.ip || '',
    payload.pais || '',
    payload.cidade || '',
    payload.createdAt || '',
    payload.paidAt || '',
    payload.productName || '',
    payload.gateway || '',
    payload.utm_source || '',
    payload.utm_campaign || '',
    payload.utm_medium || '',
    payload.utm_content || '',
    payload.utm_term || '',
    payload.fbclid || '',
    payload.keyword || '',
    payload.device || '',
    payload.network || '',
    payload.gad_source || '',
    payload.gad_campaignid || '',
    payload.cupons || '',
    payload.nomeCliente || '',
    payload.cpf || ''
  ];
}

console.log('\n📂 Nome da aba que será criada: ' + nomeAba);
console.log('\n📊 Array de dados que será salvo:');
console.log(JSON.stringify(data, null, 2));

// Cabeçalho
const header = [
  'Projeto', 'Transaction ID', 'Email', 'Telefone', 'Valor (R$)',
  'GCLID', 'GBraid', 'WBraid', 'IP', 'País', 'Cidade',
  'Data Criação', 'Data Pagamento', 'Produto', 'Gateway',
  'UTM Source', 'UTM Campaign', 'UTM Medium', 'UTM Content', 'UTM Term',
  'FBCLID', 'Keyword', 'Device', 'Network',
  'GAD Source', 'GAD Campaign ID', 'Cupons', 'Nome Cliente', 'CPF'
];

console.log('\n' + '='.repeat(80));
console.log('\n📋 COMO SERÁ SALVO NA PLANILHA:\n');
console.log('ABA: ' + nomeAba);
console.log('\nCABEÇALHO:');
console.log(header.join(' | '));
console.log('\nDADOS:');
console.log(data.join(' | '));

console.log('\n' + '='.repeat(80));
console.log('\n🔍 MAPEAMENTO DETALHADO:\n');

header.forEach((coluna, index) => {
  const valor = data[index];
  const vazio = valor === '' || valor === 0 || valor === null || valor === undefined;
  const status = vazio ? '⚠️ VAZIO' : '✅';
  
  console.log(`${(index + 1).toString().padStart(2)}. ${coluna.padEnd(20)} = ${String(valor).padEnd(35)} ${status}`);
});

console.log('\n' + '='.repeat(80));

// Verificar problemas
const problemas = [];

if (!data[0]) problemas.push('❌ Projeto está vazio!');
if (!data[1]) problemas.push('❌ Transaction ID está vazio!');
if (!data[2]) problemas.push('❌ Email está vazio!');
if (!data[3]) problemas.push('❌ Telefone está vazio!');
if (!data[4] || data[4] === 0) problemas.push('❌ Valor está vazio ou zero!');
if (!data[27]) problemas.push('❌ Nome Cliente está vazio!');

if (problemas.length > 0) {
  console.log('\n⚠️ PROBLEMAS ENCONTRADOS:\n');
  problemas.forEach(p => console.log('   ' + p));
} else {
  console.log('\n✅ TUDO CERTO! Todos os campos importantes estão preenchidos!');
}

console.log('\n' + '='.repeat(80));
console.log('\n💡 PRÓXIMOS PASSOS:\n');
console.log('1. Verifique se o mapeamento acima está correto');
console.log('2. Se estiver OK, copie o código do GOOGLE_APPS_SCRIPT_CORRETO.js');
console.log('3. Cole no Google Apps Script');
console.log('4. Faça deploy');
console.log('5. Teste novamente\n');
console.log('='.repeat(80) + '\n');
