// ✅ CÓDIGO CORRETO DO GOOGLE APPS SCRIPT
// Cole este código no Google Apps Script e faça deploy

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    
    // Log para debug
    Logger.log('📦 Payload recebido: ' + JSON.stringify(payload));
    
    // ID da sua planilha
    const PLANILHA_ID = '19noK4HT3COT-r-dJU3ZE6WRZvZMmffdRo0DzJDr0cwI';
    const ss = SpreadsheetApp.openById(PLANILHA_ID);
    
    // Verificar se recebeu array ou objeto
    let data;
    let nomeAba;
    
    if (Array.isArray(payload)) {
      // Recebeu array - primeira posição é o projeto
      Logger.log('📋 Recebido como ARRAY');
      nomeAba = String(payload[0] || 'default').replace(/[:\/?*\[\]]/g, '_');
      data = payload;
    } else {
      // Recebeu objeto - converter para array na ordem correta
      Logger.log('📦 Recebido como OBJETO - convertendo para array');
      nomeAba = String(payload.projeto || 'default').replace(/[:\/?*\[\]]/g, '_');
      
      // Converter objeto para array NA ORDEM CORRETA
      data = [
        nomeAba,                         // 1. Projeto (usar nomeAba que já foi limpo)
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
    }
    
    Logger.log('📂 Nome da aba: ' + nomeAba);
    Logger.log('📊 Array de dados: ' + JSON.stringify(data));
    
    // IMPORTANTE: Usar sempre a aba principal, NÃO criar abas por projeto
    // A planilha principal já tem o cabeçalho correto
    let sheet = ss.getSheets()[0]; // Primeira aba (principal)
    
    Logger.log('📝 Salvando na aba principal: ' + sheet.getName());
    
    // Salvar dados (já está como array na ordem correta)
    sheet.appendRow(data);
    
    // Log para debug
    Logger.log('✅ Dados salvos na aba: ' + nomeAba);
    Logger.log('   - Email: ' + data[2]);
    Logger.log('   - Valor: R$ ' + data[4]);
    Logger.log('   - Linha: ' + sheet.getLastRow());
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Cliente salvo com sucesso',
      sheet: nomeAba,
      row: sheet.getLastRow(),
      email: data[2],
      valor: data[4]
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('❌ Erro: ' + error.message);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Função de teste (opcional)
function testarScript() {
  const mockData = {
    postData: {
      contents: JSON.stringify({
        projeto: 'teste',
        transactionId: 'test_123',
        email: 'teste@email.com',
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
        nomeCliente: 'João Silva',
        cpf: '12345678900'
      })
    }
  };
  
  const result = doPost(mockData);
  Logger.log(result.getContent());
}
