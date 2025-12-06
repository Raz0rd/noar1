// 🧪 TESTE COMPLETO - Ler planilha ANTES e DEPOIS
// Execute: node testar-sheets-completo.js

const https = require('https');

const PLANILHA_ID = '19noK4HT3COT-r-dJU3ZE6WRZvZMmffdRo0DzJDr0cwI';
const ABA_ID = '211063050'; // ID da aba "teste"

async function lerPlanilha(titulo) {
  return new Promise((resolve, reject) => {
    const url = `https://docs.google.com/spreadsheets/d/${PLANILHA_ID}/gviz/tq?tqx=out:csv&gid=${ABA_ID}`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        const linhas = data.split('\n');
        console.log(`\n📊 ${titulo}`);
        console.log('='.repeat(80));
        console.log(`Total de linhas: ${linhas.length}`);
        
        if (linhas.length > 0) {
          console.log('\n📋 Cabeçalho:');
          console.log(linhas[0]);
          
          if (linhas.length > 1) {
            console.log(`\n📝 Últimas 3 linhas de dados:`);
            const ultimasLinhas = linhas.slice(-3);
            ultimasLinhas.forEach((linha, i) => {
              if (linha.trim()) {
                console.log(`\nLinha ${linhas.length - 3 + i}:`);
                const colunas = linha.split(',').map(c => c.replace(/^"|"$/g, ''));
                colunas.forEach((col, idx) => {
                  if (col) console.log(`  ${idx + 1}. ${col}`);
                });
              }
            });
          }
        }
        console.log('='.repeat(80));
        resolve(linhas);
      });
    }).on('error', reject);
  });
}

async function testarWebhook() {
  const http = require('http');
  
  return new Promise((resolve, reject) => {
    const email = encodeURIComponent('teste-completo@email.com');
    const name = encodeURIComponent('Teste Completo');
    const amount = '4990';
    
    const options = {
      hostname: 'localhost',
      port: 3002,
      path: `/api/test-webhook?email=${email}&name=${name}&amount=${amount}`,
      method: 'GET'
    };
    
    console.log('\n🚀 Enviando requisição para webhook...');
    console.log(`URL: http://${options.hostname}:${options.port}${options.path}`);
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log('\n✅ Resposta do webhook:');
        console.log(data);
        resolve(JSON.parse(data));
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  console.log('\n🔬 TESTE COMPLETO - GOOGLE SHEETS\n');
  
  try {
    // 1. Ler planilha ANTES
    const linhasAntes = await lerPlanilha('PLANILHA ANTES DO TESTE');
    const totalLinhasAntes = linhasAntes.length;
    
    // 2. Aguardar 2 segundos
    console.log('\n⏳ Aguardando 2 segundos...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 3. Fazer teste
    const resultado = await testarWebhook();
    
    // 4. Aguardar 3 segundos para o Google Sheets processar
    console.log('\n⏳ Aguardando 3 segundos para Google Sheets processar...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 5. Ler planilha DEPOIS
    const linhasDepois = await lerPlanilha('PLANILHA DEPOIS DO TESTE');
    const totalLinhasDepois = linhasDepois.length;
    
    // 6. Comparar
    console.log('\n📊 RESULTADO DA COMPARAÇÃO\n');
    console.log('='.repeat(80));
    console.log(`Linhas ANTES:  ${totalLinhasAntes}`);
    console.log(`Linhas DEPOIS: ${totalLinhasDepois}`);
    console.log(`Diferença:     ${totalLinhasDepois - totalLinhasAntes}`);
    
    if (totalLinhasDepois > totalLinhasAntes) {
      console.log('\n✅ SUCESSO! Nova linha foi adicionada!');
      
      // Mostrar a nova linha
      const novaLinha = linhasDepois[linhasDepois.length - 1];
      console.log('\n📝 Nova linha adicionada:');
      console.log(novaLinha);
      
      const colunas = novaLinha.split(',').map(c => c.replace(/^"|"$/g, ''));
      console.log('\n🔍 Dados salvos:');
      const headers = [
        'Projeto', 'Transaction ID', 'Email', 'Telefone', 'Valor (R$)',
        'GCLID', 'GBraid', 'WBraid', 'IP', 'País', 'Cidade',
        'Data Criação', 'Data Pagamento', 'Produto', 'Gateway',
        'UTM Source', 'UTM Campaign', 'UTM Medium', 'UTM Content', 'UTM Term',
        'FBCLID', 'Keyword', 'Device', 'Network',
        'GAD Source', 'GAD Campaign ID', 'Cupons', 'Nome Cliente', 'CPF'
      ];
      
      colunas.forEach((col, idx) => {
        if (headers[idx]) {
          const vazio = !col || col === '';
          console.log(`  ${(idx + 1).toString().padStart(2)}. ${headers[idx].padEnd(20)} = ${col.padEnd(30)} ${vazio ? '⚠️' : '✅'}`);
        }
      });
      
    } else {
      console.log('\n❌ ERRO! Nenhuma linha foi adicionada!');
      console.log('\n🔍 Possíveis causas:');
      console.log('   1. O Google Apps Script não está recebendo os dados');
      console.log('   2. Há um erro no código do Google Apps Script');
      console.log('   3. O deployment não foi atualizado');
      console.log('   4. A URL do webhook está errada');
    }
    
    console.log('\n' + '='.repeat(80) + '\n');
    
  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
  }
}

main();
