export class Logger {
  static info(message: string, context?: Record<string, unknown>) {
    console.log(
      JSON.stringify({
        level: 'info',
        message,
        timestamp: new Date().toISOString(),
        ...context,
      }),
    );
  }

  static error(message: string, error?: unknown, context?: Record<string, unknown>) {
    console.error(
      JSON.stringify({
        level: 'error',
        message,
        error:
          error instanceof Error
            ? { name: error.name, message: error.message, stack: error.stack }
            : error,
        timestamp: new Date().toISOString(),
        ...context,
      }),
    );
  }

  static warn(message: string, context?: Record<string, unknown>) {
    console.warn(
      JSON.stringify({
        level: 'warn',
        message,
        timestamp: new Date().toISOString(),
        ...context,
      }),
    );
  }
}
