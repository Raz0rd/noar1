import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Arquivo para armazenar logs de acesso
const LOGS_FILE = path.join(process.cwd(), 'data', 'access-logs.json');

// Token de autenticação
const API_TOKEN = 'gas_domain_manager_2024';

interface AccessLog {
  id: string;
  timestamp: string;
  domain: string;
  ip: string;
  userAgent: string;
  path: string;
  utms: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
    gclid?: string;
    fbclid?: string;
    gbraid?: string;
    wbraid?: string;
  };
  referrer?: string;
}

// Garantir que o diretório existe
async function ensureDataDirectory() {
  const dataDir = path.join(process.cwd(), 'data');
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// GET - Listar logs de acesso
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  
  if (token !== API_TOKEN) {
    return NextResponse.json(
      { success: false, error: 'Token de autenticação inválido' },
      { status: 401 }
    );
  }

  try {
    await ensureDataDirectory();
    
    // Ler arquivo de logs
    let logs: AccessLog[] = [];
    try {
      const fileContent = await fs.readFile(LOGS_FILE, 'utf-8');
      logs = JSON.parse(fileContent);
    } catch (error) {
      // Arquivo não existe ainda, retornar array vazio
      logs = [];
    }

    // Filtros opcionais
    const domain = request.nextUrl.searchParams.get('domain');
    const startDate = request.nextUrl.searchParams.get('start_date');
    const endDate = request.nextUrl.searchParams.get('end_date');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '100');

    let filteredLogs = logs;

    if (domain) {
      filteredLogs = filteredLogs.filter(log => log.domain === domain);
    }

    if (startDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= startDate);
    }

    if (endDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= endDate);
    }

    // Limitar resultados
    filteredLogs = filteredLogs.slice(0, limit);

    return NextResponse.json({
      success: true,
      total: filteredLogs.length,
      logs: filteredLogs
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Adicionar log de acesso
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domain, ip, userAgent, path, utms, referrer } = body;

    if (!domain || !ip) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatórios: domain, ip' },
        { status: 400 }
      );
    }

    await ensureDataDirectory();

    // Ler logs existentes
    let logs: AccessLog[] = [];
    try {
      const fileContent = await fs.readFile(LOGS_FILE, 'utf-8');
      logs = JSON.parse(fileContent);
    } catch (error) {
      // Arquivo não existe, criar novo array
      logs = [];
    }

    // Verificar se já existe log para este IP + domínio (primeiro acesso)
    const existingLog = logs.find(log => log.ip === ip && log.domain === domain);
    
    if (existingLog) {
      return NextResponse.json({
        success: true,
        message: 'Acesso já registrado (não é primeiro acesso)',
        isFirstAccess: false,
        existingLog
      });
    }

    // Criar novo log
    const newLog: AccessLog = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      domain,
      ip,
      userAgent: userAgent || '',
      path: path || '/',
      utms: utms || {},
      referrer: referrer || ''
    };

    // Adicionar ao array
    logs.unshift(newLog); // Adiciona no início

    // Limitar a 10000 logs para não crescer infinitamente
    if (logs.length > 10000) {
      logs = logs.slice(0, 10000);
    }

    // Salvar arquivo
    await fs.writeFile(LOGS_FILE, JSON.stringify(logs, null, 2), 'utf-8');

    console.log(`✅ [ACCESS-LOG] Primeiro acesso registrado: ${domain} | IP: ${ip}`);

    return NextResponse.json({
      success: true,
      message: 'Primeiro acesso registrado com sucesso',
      isFirstAccess: true,
      log: newLog
    });

  } catch (error: any) {
    console.error('❌ [ACCESS-LOG] Erro:', error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Limpar logs antigos
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
    const { days } = body;

    if (!days || days < 1) {
      return NextResponse.json(
        { success: false, error: 'Informe quantos dias de logs manter (mínimo 1)' },
        { status: 400 }
      );
    }

    await ensureDataDirectory();

    // Ler logs existentes
    let logs: AccessLog[] = [];
    try {
      const fileContent = await fs.readFile(LOGS_FILE, 'utf-8');
      logs = JSON.parse(fileContent);
    } catch (error) {
      return NextResponse.json({
        success: true,
        message: 'Nenhum log para limpar'
      });
    }

    // Calcular data limite
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() - days);
    const limitDateISO = limitDate.toISOString();

    // Filtrar logs recentes
    const recentLogs = logs.filter(log => log.timestamp >= limitDateISO);
    const removedCount = logs.length - recentLogs.length;

    // Salvar logs filtrados
    await fs.writeFile(LOGS_FILE, JSON.stringify(recentLogs, null, 2), 'utf-8');

    return NextResponse.json({
      success: true,
      message: `${removedCount} logs removidos`,
      remaining: recentLogs.length
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
