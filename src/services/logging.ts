/**
 * ✅ SECURE: Centralized Logging & Monitoring Service
 * 
 * This service provides structured logging, error tracking, and monitoring
 * capabilities for production-ready applications.
 */

import { supabase } from '@/lib/supabase';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export enum LogCategory {
  AUTH = 'auth',
  ORDER = 'order',
  PAYMENT = 'payment',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  USER_ACTION = 'user_action',
  SYSTEM = 'system',
  API = 'api'
}

export interface LogEntry {
  level: LogLevel;
  category: LogCategory;
  message: string;
  details?: any;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  ipAddress?: string;
  timestamp?: string;
  stackTrace?: string;
  requestId?: string;
}

export interface PerformanceMetric {
  name: string;
  duration: number;
  category: string;
  details?: any;
  timestamp?: string;
}

class Logger {
  private static instance: Logger;
  private sessionId: string;
  private requestId: string;
  private isProduction: boolean;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.requestId = this.generateRequestId();
    this.isProduction = import.meta.env.PROD;
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getCurrentUser(): Promise<string | undefined> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id;
    } catch {
      return undefined;
    }
  }

  private sanitizeForLogging(data: any): any {
    if (typeof data === 'string') {
      // Remove potential sensitive information
      return data
        .replace(/password[=:]\s*[^\s&]+/gi, 'password=***')
        .replace(/token[=:]\s*[^\s&]+/gi, 'token=***')
        .replace(/key[=:]\s*[^\s&]+/gi, 'key=***')
        .replace(/secret[=:]\s*[^\s&]+/gi, 'secret=***');
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        if (['password', 'token', 'secret', 'key', 'authorization'].includes(key.toLowerCase())) {
          sanitized[key] = '***';
        } else {
          sanitized[key] = this.sanitizeForLogging(value);
        }
      }
      return sanitized;
    }
    
    return data;
  }

  async log(entry: LogEntry): Promise<void> {
    try {
      const userId = entry.userId || await this.getCurrentUser();
      
      const logEntry: LogEntry = {
        ...entry,
        userId,
        sessionId: this.sessionId,
        requestId: this.requestId,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        details: this.sanitizeForLogging(entry.details)
      };

      // Console logging for development
      if (!this.isProduction) {
        const consoleMethod = this.getConsoleMethod(entry.level);
        consoleMethod(`[${entry.level.toUpperCase()}] [${entry.category}] ${entry.message}`, entry.details);
      }

      // Send to database for persistence
      await this.persistLog(logEntry);

      // Send to external monitoring service (if configured)
      await this.sendToMonitoring(logEntry);

    } catch (error) {
      // Fallback to console if logging fails
      console.error('Logging failed:', error);
      console.log('Original log entry:', entry);
    }
  }

  private getConsoleMethod(level: LogLevel): (...args: any[]) => void {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug;
      case LogLevel.INFO:
        return console.info;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        return console.error;
      default:
        return console.log;
    }
  }

  private async persistLog(entry: LogEntry): Promise<void> {
    try {
      await supabase.rpc('log_application_event', {
        p_level: entry.level,
        p_category: entry.category,
        p_message: entry.message,
        p_details: entry.details ? JSON.stringify(entry.details) : null,
        p_user_id: entry.userId || null,
        p_session_id: entry.sessionId,
        p_request_id: entry.requestId,
        p_user_agent: entry.userAgent,
        p_stack_trace: entry.stackTrace
      });
    } catch (error) {
      console.warn('Failed to persist log to database:', error);
    }
  }

  private async sendToMonitoring(entry: LogEntry): Promise<void> {
    // Integration with external monitoring services (Sentry, LogRocket, etc.)
    try {
      // Example: Send to Sentry (if configured)
      if (window.Sentry && (entry.level === LogLevel.ERROR || entry.level === LogLevel.CRITICAL)) {
        window.Sentry.captureException(new Error(entry.message), {
          level: entry.level === LogLevel.CRITICAL ? 'fatal' : 'error',
          tags: {
            category: entry.category,
            sessionId: entry.sessionId,
            requestId: entry.requestId
          },
          extra: entry.details
        });
      }

      // Example: Send to custom analytics endpoint
      if (this.isProduction && entry.level !== LogLevel.DEBUG) {
        // Implement your analytics endpoint here
        // await fetch('/api/analytics/log', { ... });
      }
    } catch (error) {
      console.warn('Failed to send to monitoring service:', error);
    }
  }

  // Convenience methods for different log levels
  debug(category: LogCategory, message: string, details?: any): Promise<void> {
    return this.log({ level: LogLevel.DEBUG, category, message, details });
  }

  info(category: LogCategory, message: string, details?: any): Promise<void> {
    return this.log({ level: LogLevel.INFO, category, message, details });
  }

  warn(category: LogCategory, message: string, details?: any): Promise<void> {
    return this.log({ level: LogLevel.WARN, category, message, details });
  }

  error(category: LogCategory, message: string, details?: any, error?: Error): Promise<void> {
    return this.log({
      level: LogLevel.ERROR,
      category,
      message,
      details,
      stackTrace: error?.stack
    });
  }

  critical(category: LogCategory, message: string, details?: any, error?: Error): Promise<void> {
    return this.log({
      level: LogLevel.CRITICAL,
      category,
      message,
      details,
      stackTrace: error?.stack
    });
  }

  // Performance monitoring
  async logPerformance(metric: PerformanceMetric): Promise<void> {
    try {
      await supabase.rpc('log_performance_metric', {
        p_name: metric.name,
        p_duration: metric.duration,
        p_category: metric.category,
        p_details: metric.details ? JSON.stringify(metric.details) : null
      });

      if (!this.isProduction) {
        console.log(`[PERFORMANCE] ${metric.name}: ${metric.duration}ms`, metric.details);
      }
    } catch (error) {
      console.warn('Failed to log performance metric:', error);
    }
  }

  // User action tracking
  async trackUserAction(action: string, details?: any): Promise<void> {
    await this.info(LogCategory.USER_ACTION, `User action: ${action}`, {
      action,
      ...details,
      timestamp: new Date().toISOString()
    });
  }

  // Security event logging
  async logSecurityEvent(event: string, details?: any): Promise<void> {
    await this.warn(LogCategory.SECURITY, `Security event: ${event}`, {
      event,
      ...details,
      timestamp: new Date().toISOString()
    });
  }
}

// Performance monitoring utilities
export class PerformanceMonitor {
  private startTime: number;
  private name: string;
  private category: string;
  private details?: any;

  constructor(name: string, category: string = 'general', details?: any) {
    this.name = name;
    this.category = category;
    this.details = details;
    this.startTime = performance.now();
  }

  async end(): Promise<void> {
    const duration = performance.now() - this.startTime;
    await logger.logPerformance({
      name: this.name,
      duration: Math.round(duration),
      category: this.category,
      details: this.details
    });
  }
}

// Error boundary integration
export function logError(error: Error, errorInfo?: any): void {
  logger.error(LogCategory.SYSTEM, `Unhandled error: ${error.message}`, {
    error: error.message,
    stack: error.stack,
    errorInfo
  }, error);
}

// Global error handler
export function setupGlobalErrorHandling(): void {
  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logger.error(LogCategory.SYSTEM, 'Unhandled promise rejection', {
      reason: event.reason,
      promise: event.promise
    });
  });

  // Global errors
  window.addEventListener('error', (event) => {
    logger.error(LogCategory.SYSTEM, 'Global error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    });
  });

  // Resource loading errors
  window.addEventListener('error', (event) => {
    if (event.target !== window) {
      logger.error(LogCategory.SYSTEM, 'Resource loading error', {
        tagName: (event.target as any)?.tagName,
        source: (event.target as any)?.src || (event.target as any)?.href,
        message: event.message
      });
    }
  }, true);
}

// Export singleton instance
export const logger = Logger.getInstance();

// Utility functions for common logging patterns
export const logUserLogin = (userId: string, method: string) =>
  logger.info(LogCategory.AUTH, 'User logged in', { userId, method });

export const logUserLogout = (userId: string) =>
  logger.info(LogCategory.AUTH, 'User logged out', { userId });

export const logOrderCreated = (orderId: string, amount: number, userId: string) =>
  logger.info(LogCategory.ORDER, 'Order created', { orderId, amount, userId });

export const logPaymentProcessed = (orderId: string, amount: number, method: string) =>
  logger.info(LogCategory.PAYMENT, 'Payment processed', { orderId, amount, method });

export const logSecurityViolation = (violation: string, details?: any) =>
  logger.critical(LogCategory.SECURITY, `Security violation: ${violation}`, details);

// Performance monitoring decorators
export function monitorPerformance(name: string, category: string = 'function') {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const monitor = new PerformanceMonitor(`${name || propertyKey}`, category);
      try {
        const result = await originalMethod.apply(this, args);
        await monitor.end();
        return result;
      } catch (error) {
        await monitor.end();
        throw error;
      }
    };

    return descriptor;
  };
}
