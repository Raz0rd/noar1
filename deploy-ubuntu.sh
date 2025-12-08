#!/bin/bash

# Script de deploy para Ubuntu
# Execute este script para atualizar o projeto (após o setup inicial)

echo "=== Iniciando Deploy ==="

# 1. Pull das últimas alterações
echo "1. Fazendo pull do repositório..."
git pull origin main

# 2. Instalar dependências
echo "2. Instalando dependências..."
npm install

# 3. Build da aplicação
echo "3. Fazendo build..."
npm run build

# 4. Restart do PM2
echo "4. Reiniciando PM2..."
pm2 restart all

echo "=== Deploy Concluído ==="
echo "Verifique o status com: pm2 status"
