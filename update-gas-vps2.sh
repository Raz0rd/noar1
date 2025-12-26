#!/bin/bash

# Script para atualizar todos os domínios de gás no servidor VPS 2
# Executa: git fetch/reset, configura .env.local, npm install, npm run build, pm2 restart

echo "🚀 Iniciando atualização dos domínios de gás (VPS 2)..."
echo ""

# Key da API de CPF para este servidor (VPS 2)
CPF_API_KEY="3f06e4f5da44a9dc4faa2c94e4b0b6b68cd9d42766803b2e765784c138ec9e74"

# Lista de domínios de gás e seus diretórios
declare -A GAS_DOMAINS=(
    ["gasentregadomicilio-store"]="/var/www/gasentregadomicilio-store"
    ["gasentregaultra-store"]="/var/www/gasentregaultra-store"
    ["seugasprime-store"]="/var/www/seugasprime-store"
    ["teugasultra-shop"]="/var/www/teugasultra-shop"
    ["ultragasuniao-store"]="/var/www/ultragasuniao-store"
    ["ultrateugas-top"]="/var/www/ultrateugas-top"
)

# Contador de sucesso/erro
SUCCESS_COUNT=0
ERROR_COUNT=0
FAILED_DOMAINS=()

# Função para atualizar um domínio
update_domain() {
    local domain=$1
    local directory=$2
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📦 Atualizando: $domain"
    echo "📁 Diretório: $directory"
    echo ""
    
    # Verificar se o diretório existe
    if [ ! -d "$directory" ]; then
        echo "❌ ERRO: Diretório não encontrado: $directory"
        echo ""
        ERROR_COUNT=$((ERROR_COUNT + 1))
        FAILED_DOMAINS+=("$domain (diretório não encontrado)")
        return 1
    fi
    
    # Entrar no diretório
    cd "$directory" || {
        echo "❌ ERRO: Não foi possível acessar o diretório"
        echo ""
        ERROR_COUNT=$((ERROR_COUNT + 1))
        FAILED_DOMAINS+=("$domain (erro ao acessar diretório)")
        return 1
    }
    
    # Git fetch e reset hard para forçar atualização
    echo "🔄 Executando git fetch e reset..."
    git fetch origin
    if git reset --hard origin/feature/upsell-cervejas; then
        echo "✅ Git reset concluído"
    else
        echo "⚠️ Aviso: Git reset falhou, continuando..."
    fi
    echo ""
    
    # Adicionar/atualizar CPF_API_KEY no .env.local
    echo "🔑 Configurando CPF_API_KEY no .env.local..."
    if grep -q "^CPF_API_KEY=" .env.local 2>/dev/null; then
        # Atualizar key existente
        sed -i "s/^CPF_API_KEY=.*/CPF_API_KEY=$CPF_API_KEY/" .env.local
        echo "✅ CPF_API_KEY atualizada no .env.local"
    else
        # Adicionar nova key
        echo "CPF_API_KEY=$CPF_API_KEY" >> .env.local
        echo "✅ CPF_API_KEY adicionada ao .env.local"
    fi
    echo ""
    
    # npm install
    echo "📦 Executando npm install..."
    if npm install; then
        echo "✅ npm install concluído"
    else
        echo "❌ ERRO: npm install falhou"
        echo ""
        ERROR_COUNT=$((ERROR_COUNT + 1))
        FAILED_DOMAINS+=("$domain (npm install falhou)")
        return 1
    fi
    echo ""
    
    # npm run build
    echo "🔨 Executando npm run build..."
    if npm run build; then
        echo "✅ Build concluído"
    else
        echo "❌ ERRO: Build falhou"
        echo ""
        ERROR_COUNT=$((ERROR_COUNT + 1))
        FAILED_DOMAINS+=("$domain (build falhou)")
        return 1
    fi
    echo ""
    
    # pm2 restart
    echo "🔄 Executando pm2 restart $domain..."
    if pm2 restart "$domain"; then
        echo "✅ PM2 restart concluído"
    else
        echo "❌ ERRO: PM2 restart falhou"
        echo ""
        ERROR_COUNT=$((ERROR_COUNT + 1))
        FAILED_DOMAINS+=("$domain (pm2 restart falhou)")
        return 1
    fi
    echo ""
    
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    echo "✅ $domain atualizado com sucesso!"
    echo ""
}

# Atualizar cada domínio
for domain in "${!GAS_DOMAINS[@]}"; do
    update_domain "$domain" "${GAS_DOMAINS[$domain]}"
done

# Resumo final
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RESUMO DA ATUALIZAÇÃO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Sucesso: $SUCCESS_COUNT domínios"
echo "❌ Erros: $ERROR_COUNT domínios"
echo ""

if [ $ERROR_COUNT -gt 0 ]; then
    echo "⚠️ Domínios com erro:"
    for failed in "${FAILED_DOMAINS[@]}"; do
        echo "  - $failed"
    done
    echo ""
fi

# Mostrar status do PM2
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Status PM2 dos domínios de gás:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
pm2 list | grep -E "(gasentregadomicilio|gasentregaultra|seugasprime|teugasultra|ultragasuniao|ultrateugas)"

echo ""
echo "🎉 Atualização concluída!"
