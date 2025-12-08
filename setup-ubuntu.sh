#!/bin/bash

# Script de setup inicial para Ubuntu
# Execute este script APENAS na primeira vez

echo "=== Setup Inicial do Projeto ==="

# Defina o nome da pasta do projeto
PROJECT_DIR="unigas-2"

# 1. Clonar o repositório
echo "1. Clonando repositório..."
git clone https://github.com/Raz0rd/noar1.git $PROJECT_DIR

# 2. Entrar na pasta
cd $PROJECT_DIR

# 3. Checkout para o branch main
echo "2. Configurando branch main..."
git checkout main

# 4. Instalar dependências
echo "3. Instalando dependências..."
npm install

# 5. Build da aplicação
echo "4. Fazendo build..."
npm run build

# 6. Iniciar com PM2
echo "5. Iniciando aplicação com PM2..."
pm2 start npm --name "unigas-2" -- start
pm2 save

echo "=== Setup Concluído ==="
echo "Comandos úteis:"
echo "  pm2 status       - Ver status"
echo "  pm2 logs         - Ver logs"
echo "  pm2 restart all  - Reiniciar"
