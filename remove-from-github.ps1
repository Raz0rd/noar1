# Script para remover chavesheets.json do GitHub
# Execute: .\remove-from-github.ps1

Write-Host "REMOVENDO CREDENCIAIS EXPOSTAS DO GITHUB" -ForegroundColor Red
Write-Host ""

# 1. Verificar se esta em um repositorio Git
if (-not (Test-Path ".git")) {
    Write-Host "Nao e um repositorio Git!" -ForegroundColor Red
    Write-Host "   Execute este script na raiz do repositorio" -ForegroundColor Yellow
    exit 1
}

Write-Host "Repositorio Git encontrado" -ForegroundColor Green
Write-Host ""

# 2. Verificar se o arquivo existe
if (Test-Path "api/chavesheets.json") {
    Write-Host "Arquivo chavesheets.json encontrado localmente" -ForegroundColor Yellow
} else {
    Write-Host "Arquivo nao existe localmente (ok)" -ForegroundColor Cyan
}
Write-Host ""

# 3. Remover do indice do Git (se estiver rastreado)
Write-Host "Removendo do indice do Git..." -ForegroundColor Cyan
git rm --cached api/chavesheets.json 2>$null
git rm --cached chavesheets.json 2>$null

# 4. Commit da remocao
Write-Host "Criando commit de remocao..." -ForegroundColor Cyan
git add .gitignore
git commit -m "Remove exposed credentials from repository" 2>$null

# 5. Remover do historico (IMPORTANTE!)
Write-Host ""
Write-Host "REMOVENDO DO HISTORICO DO GIT..." -ForegroundColor Red
Write-Host "   Isso pode demorar alguns minutos..." -ForegroundColor Yellow
Write-Host ""

# Usar git filter-repo (mais rápido) ou filter-branch
$hasFilterRepo = git filter-repo --version 2>$null

if ($hasFilterRepo) {
    Write-Host "Usando git-filter-repo (recomendado)" -ForegroundColor Green
    git filter-repo --path api/chavesheets.json --invert-paths --force
    git filter-repo --path chavesheets.json --invert-paths --force
} else {
    Write-Host "git-filter-repo nao encontrado, usando filter-branch" -ForegroundColor Yellow
    Write-Host "   Instale git-filter-repo para melhor performance:" -ForegroundColor Yellow
    Write-Host "   pip install git-filter-repo" -ForegroundColor Yellow
    Write-Host ""
    
    # Backup
    Write-Host "Criando backup..." -ForegroundColor Cyan
    git tag backup-before-filter -f
    
    # Remover do historico
    git filter-branch --force --index-filter `
        "git rm --cached --ignore-unmatch api/chavesheets.json chavesheets.json" `
        --prune-empty --tag-name-filter cat -- --all
}

# 6. Limpar referencias
Write-Host ""
Write-Host "Limpando referencias antigas..." -ForegroundColor Cyan
git reflog expire --expire=now --all
git gc --prune=now --aggressive

Write-Host ""
Write-Host "REMOCAO LOCAL CONCLUIDA!" -ForegroundColor Green
Write-Host ""

# 7. Instrucoes para push
Write-Host "ATENCAO: Agora voce precisa fazer FORCE PUSH!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Execute os seguintes comandos:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   git push origin --force --all" -ForegroundColor White
Write-Host "   git push origin --force --tags" -ForegroundColor White
Write-Host ""
Write-Host "IMPORTANTE:" -ForegroundColor Red
Write-Host "   - Force push vai reescrever o historico" -ForegroundColor Yellow
Write-Host "   - Outros desenvolvedores precisarao re-clonar o repositorio" -ForegroundColor Yellow
Write-Host "   - Faca backup antes se tiver duvidas" -ForegroundColor Yellow
Write-Host ""

# 8. Perguntar se quer fazer push automaticamente
$response = Read-Host "Deseja fazer o FORCE PUSH agora? (s/N)"
if ($response -eq "s" -or $response -eq "S") {
    Write-Host ""
    Write-Host "Fazendo force push..." -ForegroundColor Cyan
    
    git push origin --force --all
    git push origin --force --tags
    
    Write-Host ""
    Write-Host "PUSH CONCLUIDO!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Credenciais removidas do GitHub com sucesso!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Push cancelado. Execute manualmente quando estiver pronto:" -ForegroundColor Yellow
    Write-Host "   git push origin --force --all" -ForegroundColor White
    Write-Host "   git push origin --force --tags" -ForegroundColor White
}

Write-Host ""
Write-Host "PROXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "   1. Remover do GitHub (concluido ou pendente)" -ForegroundColor White
Write-Host "   2. Revogar chave no Google Cloud Console" -ForegroundColor Yellow
Write-Host "   3. Criar nova chave" -ForegroundColor Yellow
Write-Host "   4. Atualizar arquivo local" -ForegroundColor Yellow
Write-Host "   5. Testar: node test-google-sheets.js" -ForegroundColor Yellow
Write-Host ""
Write-Host "Google Cloud Console:" -ForegroundColor Cyan
Write-Host "   https://console.cloud.google.com/iam-admin/serviceaccounts?project=solar-bebop-469002-h1" -ForegroundColor White
Write-Host ""
