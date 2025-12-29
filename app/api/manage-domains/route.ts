import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Token de autenticação para gerenciamento de domínios gas
const API_TOKEN = 'gas_domain_manager_2024';

// Caminho do arquivo de configuração
const CONFIG_FILE = path.join(process.cwd(), 'lib', 'domain-config.ts');

type SiteCategory = 'gas' | 'sushi' | 'food' | 'delivery';

interface DomainConfig {
  GOOGLE_ADS_TAG: string;
  GOOGLE_ADS_CONVERSION: string;
  GOOGLE_ADS_INITIATE_CHECKOUT?: string;
  SITE_URL: string;
  CATEGORY: SiteCategory;
  SITE_NAME?: string;
  SITE_DESCRIPTION?: string;
}

// GET - Listar todas as configurações de domínios
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  
  if (token !== API_TOKEN) {
    return NextResponse.json(
      { success: false, error: 'Token de autenticação inválido' },
      { status: 401 }
    );
  }
  
  try {
    // Importar dinamicamente o módulo de configuração
    const configModule = await import('@/lib/domain-config');
    const configs = configModule.domainConfigs;
    
    return NextResponse.json({
      success: true,
      domains: configs,
      total: Object.keys(configs).length
    });
    
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Adicionar ou atualizar domínio
export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  
  if (token !== API_TOKEN) {
    return NextResponse.json(
      { success: false, error: 'Token de autenticação inválido' },
      { status: 401 }
    );
  }
  
  try {
    const body = await request.json();
    const { domain, GOOGLE_ADS_TAG, GOOGLE_ADS_CONVERSION, GOOGLE_ADS_INITIATE_CHECKOUT, SITE_URL, CATEGORY = 'gas', SITE_NAME, SITE_DESCRIPTION } = body;
    
    if (!domain || !GOOGLE_ADS_TAG || !GOOGLE_ADS_CONVERSION || !SITE_URL) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatórios: domain, GOOGLE_ADS_TAG, GOOGLE_ADS_CONVERSION, SITE_URL' },
        { status: 400 }
      );
    }
    
    // Ler arquivo atual
    let fileContent = await fs.readFile(CONFIG_FILE, 'utf-8');
    
    // Verificar se domínio já existe
    const domainExists = fileContent.includes(`'${domain}':`);
    
    const newConfig = `  '${domain}': {
    GOOGLE_ADS_TAG: '${GOOGLE_ADS_TAG}',
    GOOGLE_ADS_CONVERSION: '${GOOGLE_ADS_CONVERSION}',${GOOGLE_ADS_INITIATE_CHECKOUT ? `\n    GOOGLE_ADS_INITIATE_CHECKOUT: '${GOOGLE_ADS_INITIATE_CHECKOUT}',` : ''}
    SITE_URL: '${SITE_URL}',
    CATEGORY: '${CATEGORY}'${SITE_NAME ? `,\n    SITE_NAME: '${SITE_NAME}'` : ''}${SITE_DESCRIPTION ? `,\n    SITE_DESCRIPTION: '${SITE_DESCRIPTION}'` : ''}
  },`;
    
    if (domainExists) {
      // Atualizar domínio existente
      const regex = new RegExp(`'${domain}':\\s*{[^}]*},?`, 'g');
      fileContent = fileContent.replace(regex, newConfig);
    } else {
      // Adicionar novo domínio antes do comentário "// Adicione mais domínios"
      const marker = '  // Adicione mais domínios aqui conforme necessário';
      if (fileContent.includes(marker)) {
        fileContent = fileContent.replace(marker, `${newConfig}\n\n${marker}`);
      } else {
        // Fallback: adicionar antes do fechamento do objeto
        fileContent = fileContent.replace(/^};/m, `${newConfig}\n};`);
      }
    }
    
    // Fazer backup
    const backupFile = CONFIG_FILE + '.backup.' + Date.now();
    await fs.copyFile(CONFIG_FILE, backupFile);
    
    // Salvar arquivo atualizado
    await fs.writeFile(CONFIG_FILE, fileContent, 'utf-8');
    
    return NextResponse.json({
      success: true,
      action: domainExists ? 'updated' : 'created',
      domain,
      message: `Domínio ${domainExists ? 'atualizado' : 'criado'} com sucesso`,
      rebuild_required: true
    });
    
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Remover domínio
export async function DELETE(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  
  if (token !== API_TOKEN) {
    return NextResponse.json(
      { success: false, error: 'Token de autenticação inválido' },
      { status: 401 }
    );
  }
  
  try {
    const body = await request.json();
    const { domain } = body;
    
    if (!domain) {
      return NextResponse.json(
        { success: false, error: 'Campo obrigatório: domain' },
        { status: 400 }
      );
    }
    
    // Ler arquivo atual
    let fileContent = await fs.readFile(CONFIG_FILE, 'utf-8');
    
    // Verificar se domínio existe
    if (!fileContent.includes(`'${domain}':`)) {
      return NextResponse.json(
        { success: false, error: 'Domínio não encontrado' },
        { status: 404 }
      );
    }
    
    // Fazer backup
    const backupFile = CONFIG_FILE + '.backup.' + Date.now();
    await fs.copyFile(CONFIG_FILE, backupFile);
    
    // Remover domínio
    const regex = new RegExp(`\\s*'${domain}':\\s*{[^}]*},?\\n?`, 'g');
    fileContent = fileContent.replace(regex, '');
    
    // Limpar vírgulas extras
    fileContent = fileContent.replace(/,(\s*),/g, ',$1');
    
    // Salvar arquivo atualizado
    await fs.writeFile(CONFIG_FILE, fileContent, 'utf-8');
    
    return NextResponse.json({
      success: true,
      action: 'deleted',
      domain,
      message: 'Domínio removido com sucesso',
      rebuild_required: true
    });
    
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Trigger rebuild e restart
export async function PUT(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  
  if (token !== API_TOKEN) {
    return NextResponse.json(
      { success: false, error: 'Token de autenticação inválido' },
      { status: 401 }
    );
  }
  
  try {
    const body = await request.json();
    const { action } = body;
    
    if (action !== 'rebuild') {
      return NextResponse.json(
        { success: false, error: 'Ação inválida. Use: rebuild' },
        { status: 400 }
      );
    }
    
    // Executar rebuild e restart
    console.log('🔄 Iniciando rebuild...');
    
    try {
      const { stdout: buildOutput, stderr: buildError } = await execAsync('npm run build', {
        cwd: process.cwd(),
        timeout: 300000 // 5 minutos
      });
      
      console.log('✅ Build concluído');
      console.log('🔄 Reiniciando PM2...');
      
      // Tentar com diferentes comandos PM2
      let pm2Output = '';
      try {
        const result = await execAsync('/usr/bin/pm2 restart gasbutano', {
          timeout: 30000
        });
        pm2Output = result.stdout;
      } catch (pm2Error: any) {
        // Se falhar com caminho completo, tentar sem
        try {
          const result = await execAsync('pm2 restart gasbutano', {
            timeout: 30000,
            env: { ...process.env, PATH: process.env.PATH + ':/usr/bin:/usr/local/bin' }
          });
          pm2Output = result.stdout;
        } catch (pm2Error2: any) {
          console.warn('⚠️ Não foi possível reiniciar PM2 automaticamente:', pm2Error2.message);
          pm2Output = 'PM2 restart falhou - reinicie manualmente com: pm2 restart gasbutano';
        }
      }
      
      console.log('✅ PM2 reiniciado');
      
      return NextResponse.json({
        success: true,
        message: 'Rebuild concluído com sucesso',
        build_output: buildOutput.substring(0, 500), // Primeiros 500 chars
        pm2_output: pm2Output,
        warning: pm2Output.includes('falhou') ? 'Reinicie o PM2 manualmente' : undefined
      });
    } catch (buildError: any) {
      throw new Error(`Build failed: ${buildError.message}`);
    }
    
  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        stderr: error.stderr?.substring(0, 500)
      },
      { status: 500 }
    );
  }
}
