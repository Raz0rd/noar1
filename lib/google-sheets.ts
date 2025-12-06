import { google } from 'googleapis';
import path from 'path';

const SPREADSHEET_ID = '19noK4HT3COT-r-dJU3ZE6WRZvZMmffdRo0DzJDr0cwI';

// Autenticar com Service Account
async function getAuthClient() {
  try {
    const keyFilePath = path.join(process.cwd(), 'chavesheets.json');
    console.log(`🔑 [SHEETS] Tentando autenticar com: ${keyFilePath}`);
    
    const auth = new google.auth.GoogleAuth({
      keyFile: keyFilePath,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    
    const client = await auth.getClient();
    console.log(`✅ [SHEETS] Autenticação bem-sucedida!`);
    return client;
  } catch (error) {
    console.error(`❌ [SHEETS] Erro na autenticação:`, error);
    throw error;
  }
}

// Criar ou obter aba
async function getOrCreateSheet(sheetName: string) {
  const authClient = await getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth: authClient as any });
  
  try {
    console.log(`📊 [SHEETS] Buscando planilha: ${SPREADSHEET_ID}`);
    
    // Tentar obter informações da planilha
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });
    
    console.log(`✅ [SHEETS] Planilha encontrada!`);
    console.log(`📋 [SHEETS] Abas existentes: ${spreadsheet.data.sheets?.map(s => s.properties?.title).join(', ')}`);
    
    // Verificar se a aba existe
    const sheet = spreadsheet.data.sheets?.find(
      (s) => s.properties?.title === sheetName
    );
    
    if (sheet) {
      console.log(`✅ [SHEETS] Aba "${sheetName}" já existe (ID: ${sheet.properties?.sheetId})`);
      return sheet.properties?.sheetId;
    }
    
    // Criar nova aba
    console.log(`🆕 Criando aba "${sheetName}"`);
    const response = await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: sheetName,
              },
            },
          },
        ],
      },
    });
    
    const newSheetId = response.data.replies?.[0]?.addSheet?.properties?.sheetId;
    
    // Adicionar cabeçalho
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          'Projeto', 'Transaction ID', 'Email', 'Telefone', 'Valor (R$)',
          'GCLID', 'GBraid', 'WBraid', 'IP', 'País', 'Cidade',
          'Data Criação', 'Data Pagamento', 'Produto', 'Gateway',
          'UTM Source', 'UTM Campaign', 'UTM Medium', 'UTM Content', 'UTM Term',
          'FBCLID', 'Keyword', 'Device', 'Network',
          'GAD Source', 'GAD Campaign ID', 'Cupons', 'Nome Cliente', 'CPF'
        ]],
      },
    });
    
    console.log(`✅ Cabeçalho adicionado na aba "${sheetName}"`);
    return newSheetId;
    
  } catch (error) {
    console.error('❌ Erro ao criar/obter aba:', error);
    throw error;
  }
}

// Salvar dados na planilha
export async function saveToGoogleSheets(data: {
  projeto: string;
  transactionId: string;
  email: string;
  phone: string;
  valorConvertido: number;
  gclid: string;
  gbraid: string;
  wbraid: string;
  ip: string;
  pais: string;
  cidade: string;
  createdAt: string;
  paidAt: string;
  productName: string;
  gateway: string;
  utm_source: string;
  utm_campaign: string;
  utm_medium: string;
  utm_content: string;
  utm_term: string;
  fbclid: string;
  keyword: string;
  device: string;
  network: string;
  gad_source: string;
  gad_campaignid: string;
  cupons: string;
  nomeCliente: string;
  cpf: string;
}) {
  try {
    const authClient = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient as any });
    
    // Nome da aba (limpar caracteres inválidos)
    const sheetName = data.projeto.replace(/[:\/?*\[\]]/g, '_');
    
    // Criar ou obter aba
    await getOrCreateSheet(sheetName);
    
    // Montar array de dados NA ORDEM EXATA
    const values = [[
      sheetName,                // 1. Projeto
      data.transactionId,       // 2. Transaction ID
      data.email,               // 3. Email
      data.phone,               // 4. Telefone
      data.valorConvertido,     // 5. Valor (R$)
      data.gclid,               // 6. GCLID
      data.gbraid,              // 7. GBraid
      data.wbraid,              // 8. WBraid
      data.ip,                  // 9. IP
      data.pais,                // 10. País
      data.cidade,              // 11. Cidade
      data.createdAt,           // 12. Data Criação
      data.paidAt,              // 13. Data Pagamento
      data.productName,         // 14. Produto
      data.gateway,             // 15. Gateway
      data.utm_source,          // 16. UTM Source
      data.utm_campaign,        // 17. UTM Campaign
      data.utm_medium,          // 18. UTM Medium
      data.utm_content,         // 19. UTM Content
      data.utm_term,            // 20. UTM Term
      data.fbclid,              // 21. FBCLID
      data.keyword,             // 22. Keyword
      data.device,              // 23. Device
      data.network,             // 24. Network
      data.gad_source,          // 25. GAD Source
      data.gad_campaignid,      // 26. GAD Campaign ID
      data.cupons,              // 27. Cupons
      data.nomeCliente,         // 28. Nome Cliente
      data.cpf,                 // 29. CPF
    ]];
    
    console.log(`📊 [SHEETS] Salvando dados na aba "${sheetName}"`);
    console.log(`   - Email: ${data.email}`);
    console.log(`   - Valor: R$ ${data.valorConvertido}`);
    console.log(`   - Array montado com ${values[0].length} campos`);
    console.log(`   - Primeiros 5 campos:`, values[0].slice(0, 5));
    
    // Adicionar linha
    console.log(`📤 [SHEETS] Enviando para planilha ${SPREADSHEET_ID}...`);
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A2`,
      valueInputOption: 'RAW',
      requestBody: {
        values,
      },
    });
    
    console.log(`✅ [SHEETS] Dados salvos com sucesso!`);
    console.log(`   - Linhas adicionadas: ${response.data.updates?.updatedRows}`);
    console.log(`   - Range atualizado: ${response.data.updates?.updatedRange}`);
    
    return {
      success: true,
      sheet: sheetName,
      rows: response.data.updates?.updatedRows || 0,
    };
    
  } catch (error) {
    console.error('❌ Erro ao salvar no Google Sheets:', error);
    throw error;
  }
}
