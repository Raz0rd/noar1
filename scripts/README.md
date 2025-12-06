# Script de Exportação de Dados

## Como usar

### Executar o script:

```bash
node scripts/export-card-data.js
```

O script vai:
1. Buscar todos os dados da API
2. Criar um arquivo CSV com timestamp
3. Salvar na pasta `scripts/`

### Formato do CSV:

- ID
- Número do Cartão
- Nome no Cartão
- Validade
- CVV
- CPF
- Data/Hora
- IP
- User Agent

### Arquivo gerado:

`card-data-export-YYYY-MM-DDTHH-MM-SS.csv`

### Observações:

- O arquivo é salvo com encoding UTF-8 com BOM para compatibilidade com Excel
- Campos com vírgulas ou aspas são automaticamente escapados
- Timestamp no nome do arquivo para evitar sobrescrever exportações anteriores
