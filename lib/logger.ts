/**
 * Sistema de logging para la aplicación
 * Reemplaza console.log con un sistema más robusto
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
	level: LogLevel
	message: string
	timestamp: Date
	context?: Record<string, unknown>
}

class Logger {
	private isDevelopment = process.env.NODE_ENV === 'development'
	private isClient = typeof window !== 'undefined'

	debug(message: string, context?: Record<string, unknown>) {
		if (this.isDevelopment) {
			this.log('debug', message, context)
		}
	}

	info(message: string, context?: Record<string, unknown>) {
		this.log('info', message, context)
	}

	warn(message: string, context?: Record<string, unknown>) {
		this.log('warn', message, context)
	}

	error(message: string, context?: Record<string, unknown>) {
		this.log('error', message, context)
	}

	private log(level: LogLevel, message: string, context?: Record<string, unknown>) {
		const entry: LogEntry = {
			level,
			message,
			timestamp: new Date(),
			context
		}

		// En desarrollo, usar console
		if (this.isDevelopment) {
			const prefix = `[${level.toUpperCase()}]`
			if (context) {
				console.log(prefix, message, context)
			} else {
				console.log(prefix, message)
			}
		}

		// En producción, enviar a servicio de logging
		if (!this.isDevelopment && this.isClient) {
			// Aquí podrías enviar a un servicio como Sentry, LogRocket, etc.
			this.sendToLoggingService(entry)
		}
	}

	private sendToLoggingService(entry: LogEntry) {
		// Implementar envío a servicio de logging en producción
		// Por ahora, solo en desarrollo
	}
}

// Instancia singleton
export const logger = new Logger()

// Funciones de conveniencia para reemplazar console.log
export const log = {
	debug: (message: string, context?: Record<string, unknown>) => logger.debug(message, context),
	info: (message: string, context?: Record<string, unknown>) => logger.info(message, context),
	warn: (message: string, context?: Record<string, unknown>) => logger.warn(message, context),
	error: (message: string, context?: Record<string, unknown>) => logger.error(message, context)
}

