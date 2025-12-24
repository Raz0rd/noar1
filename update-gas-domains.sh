#!/bin/bash

# Script para atualizar todos os domínios de gás no servidor
# Executa: git pull, npm install, npm run build, pm2 restart

echo "🚀 Iniciando atualização dos domínios de gás..."
echo ""

# Lista de domínios de gás e seus diretórios
# Nota: gasbutano não usa /Frontend, os outros sim
declare -A GAS_DOMAINS=(
    ["distribuidoraconfigas"]="/var/www/distribuidoraconfigas/Frontend"
    ["gasbutano"]="/var/www/gasbutano"
    ["gasdecozinhanasuaresidencia"]="/var/www/gasdecozinhanasuaresidencia/Frontend"
    ["gasexpress24h"]="/var/www/gasexpress24h/Frontend"
    ["meugascerto"]="/var/www/meugascerto/Frontend"
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
    
    # Git pull
    echo "🔄 Executando git pull..."
    if git pull; then
        echo "✅ Git pull concluído"
    else
        echo "⚠️ Aviso: Git pull falhou, continuando..."
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
pm2 list | grep -E "(distribuidoraconfigas|gasbutano|gasdecozinhanasuaresidencia|gasexpress24h|meugascerto)"

echo ""
echo "🎉 Atualização concluída!"
