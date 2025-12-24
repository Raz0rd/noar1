#!/bin/bash

# Cores e formatação
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Função para executar comando com spinner
run_with_spinner() {
    local cmd=$1
    local message=$2
    local pid
    
    echo -ne "${CYAN}${message}${NC} "
    
    # Executa comando em background
    eval "$cmd" > /tmp/cmd_output.log 2>&1 &
    pid=$!
    
    # Spinner
    local spin='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'
    local i=0
    while kill -0 $pid 2>/dev/null; do
        i=$(( (i+1) %10 ))
        printf "\r${CYAN}${message}${NC} ${YELLOW}${spin:$i:1}${NC}"
        sleep 0.1
    done
    
    wait $pid
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        printf "\r${CYAN}${message}${NC} ${GREEN}✓${NC}\n"
        return 0
    else
        printf "\r${CYAN}${message}${NC} ${RED}✗${NC}\n"
        cat /tmp/cmd_output.log
        return $exit_code
    fi
}

log_success() { echo -e "${GREEN}✓${NC} ${WHITE}$1${NC}"; }
log_error() { echo -e "${RED}✗${NC} ${WHITE}$1${NC}"; }
log_info() { echo -e "${BLUE}ℹ${NC} ${WHITE}$1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠${NC} ${WHITE}$1${NC}"; }

section_title() {
    echo ""
    echo -e "${PURPLE}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${PURPLE}${BOLD}  $1${NC}"
    echo -e "${PURPLE}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# Verificar DNS no Cloudflare
check_cloudflare_dns() {
    local domain=$1
    log_info "Verificando DNS do domínio ${YELLOW}$domain${NC}..."
    
    # Pega o IP do servidor atual
    local server_ip=$(curl -s ifconfig.me)
    
    # Resolve o domínio
    local domain_ip=$(dig +short $domain A | tail -n1)
    
    if [ -z "$domain_ip" ]; then
        log_error "Domínio não possui registro DNS!"
        echo -e "${YELLOW}Configure o DNS no Cloudflare antes de continuar.${NC}"
        return 1
    fi
    
    log_success "DNS encontrado: ${CYAN}$domain_ip${NC}"
    log_info "IP do servidor: ${CYAN}$server_ip${NC}"
    
    if [ "$domain_ip" != "$server_ip" ]; then
        log_warning "O IP do DNS ($domain_ip) é diferente do IP do servidor ($server_ip)"
        log_warning "Isso pode ser normal se você usa proxy do Cloudflare"
    else
        log_success "DNS aponta diretamente para este servidor"
    fi
    
    return 0
}

# Listar portas em uso
list_used_ports() {
    echo -e "${CYAN}Portas em uso a partir de 3010:${NC}"
    netstat -tuln | grep -E ':(301[0-9]|302[0-9])' | awk '{print $4}' | sed 's/.*://' | sort -u | while read port; do
        echo -e "  ${RED}✗${NC} Porta $port (em uso)"
    done
}

# Encontrar portas livres
find_free_ports() {
    local start_port=3010
    local count=0
    echo -e "${GREEN}Portas disponíveis:${NC}"
    for port in $(seq $start_port $((start_port + 20))); do
        if ! netstat -tuln | grep -q ":$port "; then
            echo -e "  ${GREEN}✓${NC} Porta $port (livre)"
            count=$((count + 1))
            if [ $count -ge 5 ]; then
                break
            fi
        fi
    done
}

# Validar porta
validate_port() {
    local port=$1
    if ! [[ "$port" =~ ^[0-9]+$ ]]; then
        return 1
    fi
    if [ "$port" -lt 3010 ] || [ "$port" -gt 65535 ]; then
        return 1
    fi
    if netstat -tuln | grep -q ":$port "; then
        return 1
    fi
    return 0
}

clear
echo -e "${BOLD}${CYAN}"
echo "╔════════════════════════════════════════════════════════╗"
echo "║                                                        ║"
echo "║      🚀 INSTALADOR NEXT.JS PRO - MODO INTERATIVO       ║"
echo "║                                                        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# 1. PERGUNTAR DOMÍNIO
section_title "🌐 CONFIGURAÇÃO DO DOMÍNIO"
while true; do
    echo -ne "${CYAN}Digite o domínio (ex: meusite.com): ${NC}"
    read DOMINIO
    
    if [ -z "$DOMINIO" ]; then
        log_error "Domínio não pode ser vazio!"
        continue
    fi
    
    # Verificar DNS no Cloudflare
    if check_cloudflare_dns "$DOMINIO"; then
        break
    else
        echo -ne "${YELLOW}Deseja continuar mesmo assim? (s/N): ${NC}"
        read resposta
        if [[ "$resposta" =~ ^[Ss]$ ]]; then
            break
        fi
    fi
done

# 2. MOSTRAR PORTAS E PERGUNTAR QUAL USAR
section_title "🔌 SELEÇÃO DE PORTA"
list_used_ports
echo ""
find_free_ports
echo ""

while true; do
    echo -ne "${CYAN}Digite a porta desejada (a partir de 3010): ${NC}"
    read PORT
    
    if validate_port "$PORT"; then
        log_success "Porta $PORT selecionada!"
        break
    else
        if netstat -tuln | grep -q ":$PORT "; then
            log_error "Porta $PORT já está em uso!"
        else
            log_error "Porta inválida! Use uma porta entre 3010 e 65535."
        fi
    fi
done

# 3. PERGUNTAR REPOSITÓRIO GIT
section_title "📦 REPOSITÓRIO GIT"
echo -ne "${CYAN}Digite a URL do repositório Git: ${NC}"
read GIT_REPO

if [ -z "$GIT_REPO" ]; then
    log_error "URL do repositório não pode ser vazia!"
    exit 1
fi

# 4. PERGUNTAR BRANCH
echo -ne "${CYAN}Digite o branch (padrão: main): ${NC}"
read BRANCH
BRANCH=${BRANCH:-main}

# Configurações Iniciais
PASTA_PROJETO=$(echo $DOMINIO | cut -d'.' -f1) # pega primeira parte do dominio
BASE_DIR="/var/www/$DOMINIO"
SITE_DIR="$BASE_DIR/Frontend"
CONF_FILE="/etc/nginx/sites-available/$DOMINIO"
ENABLED_LINK="/etc/nginx/sites-enabled/$DOMINIO"

# Resumo da configuração
section_title "� RESUMO DA CONFIGURAÇÃO"
log_info "Domínio: ${YELLOW}$DOMINIO${NC}"
log_info "Porta: ${YELLOW}$PORT${NC}"
log_info "Repositório: ${YELLOW}$GIT_REPO${NC}"
log_info "Branch: ${YELLOW}$BRANCH${NC}"
log_info "Diretório: ${YELLOW}$SITE_DIR${NC}"
echo ""
echo -ne "${YELLOW}Confirma a instalação? (s/N): ${NC}"
read confirmacao
if [[ ! "$confirmacao" =~ ^[Ss]$ ]]; then
    log_error "Instalação cancelada pelo usuário"
    exit 0
fi

# Preparar Diretórios
section_title "📁 PREPARANDO ESTRUTURA"
if [ -d "$SITE_DIR" ]; then
    log_warning "Diretório já existe. Fazendo backup..."
    mv "$SITE_DIR" "${SITE_DIR}_backup_$(date +%s)"
fi

run_with_spinner "mkdir -p $SITE_DIR" "Criando diretório $SITE_DIR"

# Clonar Repositório
section_title "📥 CLONANDO PROJETO"
# Clona direto na pasta Frontend (o ponto final . faz clonar sem subpasta)
if git clone -b "$BRANCH" "$GIT_REPO" "$SITE_DIR"; then
    log_success "Repositório clonado com sucesso"
else
    log_error "Falha ao clonar repositório"
    exit 1
fi

# Configurar .env
section_title "⚙️ CONFIGURAÇÃO DE AMBIENTE"
cd "$SITE_DIR"
echo -e "${YELLOW}⚠️  ATENÇÃO: Vou abrir o editor para você colar o .env${NC}"
echo -e "Pressione ENTER para continuar..."
read
nano .env

# Instalar Dependências e Build
section_title "📦 INSTALAÇÃO E BUILD"
run_with_spinner "npm install" "Instalando dependências (npm install)"
run_with_spinner "npm run build" "Gerando build de produção (npm run build)"

# Configurar PM2
section_title "🚀 CONFIGURANDO PM2"
# Remove processo antigo se existir
pm2 delete "$PASTA_PROJETO" 2>/dev/null || true

# Inicia com a porta injetada
log_info "Iniciando processo PM2 na porta $PORT..."
run_with_spinner "PORT=$PORT pm2 start npm --name '$PASTA_PROJETO' -- start" "Iniciando aplicação"
pm2 save
pm2 startup | grep "sudo" | bash 2>/dev/null # Tenta rodar o comando de startup se necessário

# Configurar Nginx
section_title "🌐 CONFIGURANDO NGINX"

# Remove configs antigas para evitar conflito
rm -f "$CONF_FILE"
rm -f "$ENABLED_LINK"

cat > "$CONF_FILE" <<EOL
server {
    server_name $DOMINIO www.$DOMINIO;

    location / {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    listen 80;
}
EOL

# Link simbólico
ln -s "$CONF_FILE" "$ENABLED_LINK"

# Teste e Reload
if nginx -t; then
    systemctl reload nginx
    log_success "Nginx configurado e recarregado"
else
    log_error "Erro na configuração do Nginx"
    exit 1
fi

# SSL com Certbot
section_title "🔒 CONFIGURANDO SSL"
if certbot --nginx -d "$DOMINIO" -d "www.$DOMINIO" --non-interactive --agree-tos -m "admin@$DOMINIO" --redirect; then
    log_success "SSL instalado com sucesso!"
else
    log_error "Falha ao instalar SSL. Tente rodar 'certbot --nginx' manualmente depois."
fi

echo ""
echo -e "${GREEN}${BOLD}"
echo "╔════════════════════════════════════════════════════════╗"
echo "║          ✅ INSTALAÇÃO CONCLUÍDA!                      ║"
echo "╚════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo -e "🔗 URL:       ${CYAN}https://$DOMINIO${NC}"
echo -e "🔌 Porta:     ${CYAN}$PORT${NC}"
echo -e "📂 Pasta:     ${CYAN}$SITE_DIR${NC}"
echo -e "⚙️  Processo:  ${CYAN}$PASTA_PROJETO${NC}"
