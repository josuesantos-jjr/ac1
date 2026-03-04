import fs from 'node:fs';
import path from 'node:path';
import { syncManager } from '../../database/sync.ts';

// Interface para métricas de API
interface APIMetrics {
  service: string;
  timestamp: number;
  responseTime: number;
  success: boolean;
  errorType?: string;
  chatId?: string;
  requestType?: string;
  model?: string;
}

// Interface para alertas
interface AlertRule {
  id: string;
  name: string;
  condition: (metrics: SystemMetrics) => boolean;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
}

// Interface para métricas gerais do sistema
interface SystemMetrics {
  timestamp: number;
  uptime: number;
  totalRequests: number;
  successRate: number;
  averageResponseTime: number;
  errorRate: number;
  queueLength: number;
  cacheHitRate: number;
  apiUsage: {
    googleGemini: { usage: number; limit: number };
    groq: { usage: number; limit: number };
  };
  recentErrors: string[];
}

// Classe para monitoramento e alertas
export class MonitoringService {
  private metrics: APIMetrics[] = [];
  private systemStartTime: number = Date.now();
  private readonly MAX_METRICS_HISTORY = 10000;
  private readonly ALERT_CHECK_INTERVAL = 30000; // 30 segundos
  private alertRules: AlertRule[] = [];

  constructor() {
    this.initializeAlertRules();  // ativar depois
    this.startMonitoringTimer();  // ativar depois
    this.startMetricsCleanup();   // ativar depois
    console.log('✅ MonitoringService inicializado');
  }

  // Inicializa regras de alerta
  private initializeAlertRules() {
    this.alertRules = [
      {
        id: 'high_error_rate',
        name: 'Taxa de Erro Alta',
        condition: (metrics) => metrics.errorRate > 10, // Mais de 10% de erro
        message: '🚨 ALERTA: Taxa de erro acima de 10%',
        severity: 'high',
        enabled: true
      },
      {
        id: 'slow_response',
        name: 'Resposta Lenta',
        condition: (metrics) => metrics.averageResponseTime > 30000, // Mais de 30s
        message: '🐌 ALERTA: Tempo médio de resposta acima de 30s',
        severity: 'medium',
        enabled: true
      },
      {
        id: 'queue_buildup',
        name: 'Fila Crescente',
        condition: (metrics) => metrics.queueLength > 100,
        message: '📋 ALERTA: Fila com mais de 100 requisições',
        severity: 'medium',
        enabled: true
      },
      {
        id: 'cache_ineffective',
        name: 'Cache Ineficiente',
        condition: (metrics) => metrics.cacheHitRate < 20, // Menos de 20% de hit
        message: '💾 ALERTA: Taxa de cache abaixo de 20%',
        severity: 'low',
        enabled: true
      },
      {
        id: 'api_limit_critical',
        name: 'Limite API Crítico',
        condition: (metrics) => {
          const googleUsage = (metrics.apiUsage.googleGemini.usage / metrics.apiUsage.googleGemini.limit) * 100;
          const groqUsage = (metrics.apiUsage.groq.usage / metrics.apiUsage.groq.limit) * 100;
          return googleUsage > 90 || groqUsage > 90;
        },
        message: '🚨 ALERTA CRÍTICO: APIs próximas do limite (90%+)',
        severity: 'critical',
        enabled: true
      }
    ];
  }

  // Registra métrica de uma chamada de API
  recordAPICall(
    service: string,
    responseTime: number,
    success: boolean,
    errorType?: string,
    chatId?: string,
    requestType?: string,
    model?: string
  ) {
    const metric: APIMetrics = {
      service,
      timestamp: Date.now(),
      responseTime,
      success,
      errorType,
      chatId,
      requestType,
      model
    };

    this.metrics.push(metric);

    // Mantém apenas as métricas mais recentes
    if (this.metrics.length > this.MAX_METRICS_HISTORY) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS_HISTORY);
    }

    // Log detalhado para métricas importantes
    if (!success) {
      console.error(`❌ FALHA: ${service} - ${errorType} (${responseTime}ms)`);
    } else if (responseTime > 10000) {
      console.warn(`🐌 LENTO: ${service} demorou ${responseTime}ms`);
    }
  }

  // Verifica regras de alerta
  private checkAlerts() {
    const systemMetrics = this.getSystemMetrics();

    for (const rule of this.alertRules) {
      if (!rule.enabled) continue;

      try {
        if (rule.condition(systemMetrics)) {
          this.triggerAlert(rule, systemMetrics);
        }
      } catch (error) {
        console.error(`❌ Erro ao verificar regra ${rule.id}:`, error);
      }
    }
  }

  // Dispara um alerta
  private async triggerAlert(rule: AlertRule, metrics: SystemMetrics) {
    // const alertMessage = `${rule.message}\n📊 Métricas atuais: ${JSON.stringify(metrics, null, 2)}`;

    // console.log(alertMessage);
    // Salva alerta em arquivo de log
    await this.saveAlertToFile(rule, metrics);

    // TODO: Integrar com sistema de notificações (Telegram, email, etc.)
  }

  // Salva alerta em arquivo
  private async saveAlertToFile(rule: AlertRule, metrics: SystemMetrics) {
    try {
      const logDir = path.join(process.cwd(), 'logs');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      const logFile = path.join(logDir, 'alerts.log');
      const alertEntry = {
        timestamp: new Date().toISOString(),
        rule: rule.id,
        severity: rule.severity,
        message: rule.message,
        metrics: metrics
      };

      // 🔄 SALVAR NO SQLITE (sincronização automática)
      try {
        await syncManager.saveClientData("monitoring", {
          monitoringAlerts: alertEntry
        });
        console.log(`[MonitoringService] Alerta salvo no SQLite`);
      } catch (sqliteError) {
        console.error(`[MonitoringService] Erro ao salvar alerta no SQLite:`, sqliteError);
        // Continua com o salvamento JSON mesmo se SQLite falhar
      }

      // 📄 SALVAR NO JSON (manter funcionalidade original)
      fs.appendFileSync(logFile, JSON.stringify(alertEntry) + '\n');
    } catch (error) {
      console.error('❌ Erro ao salvar alerta:', error);
    }
  }

  // Obtém métricas gerais do sistema
  getSystemMetrics(): SystemMetrics {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);

    // Filtra métricas da última hora
    const recentMetrics = this.metrics.filter(m => m.timestamp > oneHourAgo);

    // Calcula métricas
    const totalRequests = recentMetrics.length;
    const successfulRequests = recentMetrics.filter(m => m.success).length;
    const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;

    const totalResponseTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0);
    const averageResponseTime = totalRequests > 0 ? totalResponseTime / totalRequests : 0;

    const errorRate = 100 - successRate;

    // Conta erros recentes (últimos 10 minutos)
    const tenMinutesAgo = now - (10 * 60 * 1000);
    const recentErrors = recentMetrics
      .filter(m => !m.success && m.timestamp > tenMinutesAgo)
      .map(m => m.errorType || 'Erro desconhecido')
      .slice(0, 10); // Últimos 10 erros

    // Métricas de uso de API (simplificadas)
    const googleUsage = this.getCurrentAPIUsage('google');
    const groqUsage = this.getCurrentAPIUsage('groq');

    return {
      timestamp: now,
      uptime: now - this.systemStartTime,
      totalRequests,
      successRate,
      averageResponseTime,
      errorRate,
      queueLength: 0, // Será atualizado pelo rateLimitManager
      cacheHitRate: 0, // Será atualizado pelo smartCache
      apiUsage: {
        googleGemini: { usage: googleUsage.usage, limit: googleUsage.limit },
        groq: { usage: groqUsage.usage, limit: groqUsage.limit }
      },
      recentErrors
    };
  }

  // Obtém uso atual de uma API específica
  private getCurrentAPIUsage(service: string): { usage: number; limit: number } {
    // Esta é uma simplificação - na implementação real,
    // essas informações viriam do rateLimitManager
    if (service === 'google') {
      return { usage: 45, limit: 60 }; // Exemplo
    } else if (service === 'groq') {
      return { usage: 30, limit: 120 }; // Exemplo
    }
    return { usage: 0, limit: 60 };
  }

  // Obtém métricas detalhadas por serviço
  getServiceMetrics(service?: string): any {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);

    let filteredMetrics = this.metrics.filter(m => m.timestamp > oneHourAgo);

    if (service) {
      filteredMetrics = filteredMetrics.filter(m => m.service === service);
    }

    const totalRequests = filteredMetrics.length;
    const successfulRequests = filteredMetrics.filter(m => m.success).length;
    const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;

    const avgResponseTime = filteredMetrics.length > 0
      ? filteredMetrics.reduce((sum, m) => sum + m.responseTime, 0) / filteredMetrics.length
      : 0;

    const errorsByType = filteredMetrics
      .filter(m => !m.success)
      .reduce((acc, m) => {
        const errorType = m.errorType || 'Erro desconhecido';
        acc[errorType] = (acc[errorType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return {
      service,
      totalRequests,
      successRate,
      averageResponseTime: Math.round(avgResponseTime),
      errorsByType,
      recentActivity: filteredMetrics.slice(-10) // Últimas 10 requisições
    };
  }

  // Inicia timer para verificação periódica de alertas
  private startMonitoringTimer() {
    setInterval(() => {
      this.checkAlerts();
    }, this.ALERT_CHECK_INTERVAL);
  }

  // Inicia limpeza automática de métricas antigas
  private startMetricsCleanup() {
    // Remove métricas com mais de 24 horas a cada hora
    setInterval(() => {
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      const initialCount = this.metrics.length;
      this.metrics = this.metrics.filter(m => m.timestamp > oneDayAgo);
      const removedCount = initialCount - this.metrics.length;

      if (removedCount > 0) {
        console.log(`🧹 Métricas cleanup: ${removedCount} entradas antigas removidas`);
      }
    }, 60 * 60 * 1000); // A cada hora
  }

  // Método para gerar relatório de saúde do sistema
  generateHealthReport(): any {
    const systemMetrics = this.getSystemMetrics();
    const googleMetrics = this.getServiceMetrics('google');
    const groqMetrics = this.getServiceMetrics('groq');

    return {
      timestamp: new Date().toISOString(),
      system: systemMetrics,
      services: {
        google: googleMetrics,
        groq: groqMetrics
      },
      recommendations: this.generateRecommendations(systemMetrics)
    };
  }

  // Gera recomendações baseadas nas métricas
  private generateRecommendations(metrics: SystemMetrics): string[] {
    const recommendations: string[] = [];

    if (metrics.errorRate > 15) {
      recommendations.push('🔧 Alta taxa de erro detectada. Verifique logs de erro.');
    }

    if (metrics.averageResponseTime > 20000) {
      recommendations.push('🐌 Latência alta. Considere otimizar chamadas de API.');
    }

    if (metrics.cacheHitRate < 30) {
      recommendations.push('💾 Baixa taxa de cache. Reveja estratégia de cache.');
    }

    const googleUsage = (metrics.apiUsage.googleGemini.usage / metrics.apiUsage.googleGemini.limit) * 100;
    if (googleUsage > 80) {
      recommendations.push('⚡ Google Gemini próximo do limite. Sistema usando fallback.');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ Sistema operando normalmente.');
    }

    return recommendations;
  }

  // Exporta métricas para arquivo
  exportMetrics(filePath?: string): string {
    try {
      const targetPath = filePath || path.join(process.cwd(), 'logs', `metrics_${Date.now()}.json`);
      const logDir = path.dirname(targetPath);

      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      const exportData = {
        timestamp: new Date().toISOString(),
        metrics: this.metrics.slice(-1000), // Últimas 1000 métricas
        systemMetrics: this.getSystemMetrics(),
        serviceMetrics: {
          google: this.getServiceMetrics('google'),
          groq: this.getServiceMetrics('groq')
        }
      };

      fs.writeFileSync(targetPath, JSON.stringify(exportData, null, 2), 'utf-8');
      console.log(`📊 Métricas exportadas para: ${targetPath}`);

      return targetPath;
    } catch (error) {
      console.error('❌ Erro ao exportar métricas:', error);
      throw error;
    }
  }
}

// Exporta instância única
export const monitoringService = new MonitoringService();