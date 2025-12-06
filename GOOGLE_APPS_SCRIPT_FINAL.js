// ✅ GOOGLE APPS SCRIPT - VERSÃO FINAL
// Funciona via HTTP e cria abas por projeto

function doPost(e) {
  try {
    // Parse do payload
    const payload = JSON.parse(e.postData.contents);
    
    Logger.log('📦 Payload recebido: ' + JSON.stringify(payload));
    
    // ID da planilha
    const PLANILHA_ID = '19noK4HT3COT-r-dJU3ZE6WRZvZMmffdRo0DzJDr0cwI';
    const ss = SpreadsheetApp.openById(PLANILHA_ID);
    
    // Nome da aba (limpar caracteres inválidos)
    const nomeAba = String(payload.projeto || 'default').replace(/[:\/?*\[\]]/g, '_');
    Logger.log('📂 Nome da aba: ' + nomeAba);
    
    // Buscar ou criar aba
    let sheet = ss.getSheetByName(nomeAba);
    if (!sheet) {
      Logger.log('🆕 Criando nova aba: ' + nomeAba);
      sheet = ss.insertSheet(nomeAba);
      
      // Criar cabeçalho
      sheet.appendRow([
        'Projeto', 'Transaction ID', 'Email', 'Telefone', 'Valor (R$)',
        'GCLID', 'GBraid', 'WBraid', 'IP', 'País', 'Cidade',
        'Data Criação', 'Data Pagamento', 'Produto', 'Gateway',
        'UTM Source', 'UTM Campaign', 'UTM Medium', 'UTM Content', 'UTM Term',
        'FBCLID', 'Keyword', 'Device', 'Network',
        'GAD Source', 'GAD Campaign ID', 'Cupons', 'Nome Cliente', 'CPF'
      ]);
    }
    
    // Montar array de dados NA ORDEM EXATA do cabeçalho
    const dados = [
      nomeAba,                         // 1. Projeto
      payload.transactionId || '',     // 2. Transaction ID
      payload.email || '',             // 3. Email
      payload.phone || '',             // 4. Telefone
      payload.valorConvertido || 0,    // 5. Valor (R$)
      payload.gclid || '',             // 6. GCLID
      payload.gbraid || '',            // 7. GBraid
      payload.wbraid || '',            // 8. WBraid
      payload.ip || '',                // 9. IP
      payload.pais || '',              // 10. País
      payload.cidade || '',            // 11. Cidade
      payload.createdAt || '',         // 12. Data Criação
      payload.paidAt || '',            // 13. Data Pagamento
      payload.productName || '',       // 14. Produto
      payload.gateway || '',           // 15. Gateway
      payload.utm_source || '',        // 16. UTM Source
      payload.utm_campaign || '',      // 17. UTM Campaign
      payload.utm_medium || '',        // 18. UTM Medium
      payload.utm_content || '',       // 19. UTM Content
      payload.utm_term || '',          // 20. UTM Term
      payload.fbclid || '',            // 21. FBCLID
      payload.keyword || '',           // 22. Keyword
      payload.device || '',            // 23. Device
      payload.network || '',           // 24. Network
      payload.gad_source || '',        // 25. GAD Source
      payload.gad_campaignid || '',    // 26. GAD Campaign ID
      payload.cupons || '',            // 27. Cupons
      payload.nomeCliente || '',       // 28. Nome Cliente
      payload.cpf || ''                // 29. CPF
    ];
    
    Logger.log('📊 Dados a salvar: ' + JSON.stringify(dados));
    
    // Salvar dados
    sheet.appendRow(dados);
    
    Logger.log('✅ Dados salvos na aba: ' + nomeAba);
    Logger.log('   - Linha: ' + sheet.getLastRow());
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Cliente salvo com sucesso',
      sheet: nomeAba,
      row: sheet.getLastRow(),
      email: payload.email,
      valor: payload.valorConvertido
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('❌ Erro: ' + error.message);
    Logger.log('   Stack: ' + error.stack);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Função de teste
function testarScript() {
  const mockData = {
    postData: {
      contents: JSON.stringify({
        projeto: 'teste-final',
        transactionId: 'test_final_' + Date.now(),
        email: 'teste-final@email.com',
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
        nomeCliente: 'João Silva Final',
        cpf: '12345678900'
      })
    }
  };
  
  const result = doPost(mockData);
  Logger.log('📤 Resultado: ' + result.getContent());
}
