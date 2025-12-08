#!/bin/bash

# Script para inicializar repositório na pasta existente

echo "=== Inicializando Repositório ==="

# 0. Adicionar diretório como seguro
echo "0. Configurando diretório como seguro..."
git config --global --add safe.directory /var/www/gasbutano

# 1. Inicializar git (se necessário)
echo "1. Inicializando git..."
git init

# 2. Adicionar remote
echo "2. Adicionando remote origin..."
git remote add origin https://github.com/Raz0rd/noar1.git

# 3. Fetch dos branches
echo "3. Buscando branches..."
git fetch origin

# 4. Checkout no branch correto
echo "4. Fazendo checkout no branch feature/upsell-cervejas..."
git checkout -b feature/upsell-cervejas origin/feature/upsell-cervejas

# 4.1 Se der erro, forçar reset
echo "4.1 Forçando reset para o branch remoto..."
git reset --hard origin/feature/upsell-cervejas

# 5. Pull das últimas alterações
echo "5. Fazendo pull..."
git pull origin feature/upsell-cervejas

# 6. Instalar dependências
echo "6. Instalando dependências..."
npm install

# 7. Build da aplicação
echo "7. Fazendo build..."
npm run build

# 8. Restart do PM2
echo "8. Reiniciando PM2..."
pm2 restart all

echo "=== Configuração Concluída ==="
echo "Branch: feature/upsell-cervejas"
