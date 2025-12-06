// 🧪 SCRIPT DE TESTE LOCAL - Validar payload antes de enviar para Google Sheets
// Execute: node test-sheets-payload.js

// Simular o payload que enviamos
const sheetsPayload = {
  projeto: 'localhost_3002',
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

// Converter para array (como o Google Apps Script faz)
const dataArray = [
  sheetsPayload.projeto || '',
  sheetsPayload.transactionId || '',
  sheetsPayload.email || '',
  sheetsPayload.phone || '',
  sheetsPayload.valorConvertido || 0,
  sheetsPayload.gclid || '',
  sheetsPayload.gbraid || '',
  sheetsPayload.wbraid || '',
  sheetsPayload.ip || '',
  sheetsPayload.pais || '',
  sheetsPayload.cidade || '',
  sheetsPayload.createdAt || '',
  sheetsPayload.paidAt || '',
  sheetsPayload.productName || '',
  sheetsPayload.gateway || '',
  sheetsPayload.utm_source || '',
  sheetsPayload.utm_campaign || '',
  sheetsPayload.utm_medium || '',
  sheetsPayload.utm_content || '',
  sheetsPayload.utm_term || '',
  sheetsPayload.fbclid || '',
  sheetsPayload.keyword || '',
  sheetsPayload.device || '',
  sheetsPayload.network || '',
  sheetsPayload.gad_source || '',
  sheetsPayload.gad_campaignid || '',
  sheetsPayload.cupons || '',
  sheetsPayload.nomeCliente || '',
  sheetsPayload.cpf || ''
];

// Cabeçalho esperado
const header = [
  'Projeto',
  'Transaction ID',
  'Email',
  'Telefone',
  'Valor (R$)',
  'GCLID',
  'GBraid',
  'WBraid',
  'IP',
  'País',
  'Cidade',
  'Data Criação',
  'Data Pagamento',
  'Produto',
  'Gateway',
  'UTM Source',
  'UTM Campaign',
  'UTM Medium',
  'UTM Content',
  'UTM Term',
  'FBCLID',
  'Keyword',
  'Device',
  'Network',
  'GAD Source',
  'GAD Campaign ID',
  'Cupons',
  'Nome Cliente',
  'CPF'
];

console.log('\n📊 TESTE DE PAYLOAD PARA GOOGLE SHEETS\n');
console.log('=' .repeat(80));

console.log('\n🔍 Verificando mapeamento:\n');

header.forEach((coluna, index) => {
  const valor = dataArray[index];
  const tipo = typeof valor;
  const vazio = valor === '' || valor === 0 || valor === null || valor === undefined;
  
  console.log(`${(index + 1).toString().padStart(2)}. ${coluna.padEnd(20)} = ${String(valor).padEnd(30)} ${vazio ? '⚠️ VAZIO' : '✅'}`);
});

console.log('\n' + '='.repeat(80));

// Verificar se todos os campos importantes estão preenchidos
const camposImportantes = {
  'Projeto': dataArray[0],
  'Transaction ID': dataArray[1],
  'Email': dataArray[2],
  'Telefone': dataArray[3],
  'Valor (R$)': dataArray[4],
  'Nome Cliente': dataArray[27]
};

console.log('\n✅ CAMPOS IMPORTANTES:\n');
let todosOk = true;

Object.entries(camposImportantes).forEach(([campo, valor]) => {
  const ok = valor && valor !== '';
  if (!ok) todosOk = false;
  console.log(`   ${ok ? '✅' : '❌'} ${campo}: ${valor || 'VAZIO!'}`);
});

console.log('\n' + '='.repeat(80));

if (todosOk) {
  console.log('\n✅ TODOS OS CAMPOS IMPORTANTES ESTÃO PREENCHIDOS!\n');
} else {
  console.log('\n❌ ALGUNS CAMPOS IMPORTANTES ESTÃO VAZIOS!\n');
}

// Mostrar JSON que será enviado
console.log('\n📤 JSON que será enviado para Google Sheets:\n');
console.log(JSON.stringify(sheetsPayload, null, 2));

console.log('\n' + '='.repeat(80) + '\n');
