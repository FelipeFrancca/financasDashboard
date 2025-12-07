/**
 * Classe customizada de erro para a aplicação
 * Permite criar erros com status HTTP e informações adicionais
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code?: string;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    code?: string,
    details?: any
  ) {
    super(message);

    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    this.details = details;

    // Mantém o stack trace correto
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Converte o erro para JSON (útil para logs e respostas)
   */
  toJSON() {
    return {
      error: {
        message: this.message,
        code: this.code,
        statusCode: this.statusCode,
        details: this.details,
      },
    };
  }
}

/**
 * Erros específicos por tipo
 */

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, true, 'VALIDATION_ERROR', details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Não autorizado') {
    super(message, 401, true, 'AUTHENTICATION_ERROR');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Acesso negado') {
    super(message, 403, true, 'FORBIDDEN_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Recurso') {
    super(`${resource} não encontrado`, 404, true, 'NOT_FOUND_ERROR');
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 409, true, 'CONFLICT_ERROR', details);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Muitas requisições. Tente novamente mais tarde.') {
    super(message, 429, true, 'RATE_LIMIT_ERROR');
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Erro interno do servidor', details?: any) {
    super(message, 500, false, 'INTERNAL_SERVER_ERROR', details);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Erro ao acessar banco de dados', details?: any) {
    super(message, 500, false, 'DATABASE_ERROR', details);
  }
}

/**
 * Erros específicos para extração via IA
 */

export class AIExtractionError extends AppError {
  constructor(message: string = 'Não foi possível extrair dados do documento', details?: any) {
    super(message, 422, true, 'AI_EXTRACTION_ERROR', details);
  }
}

export class AIServiceUnavailableError extends AppError {
  constructor(message: string = 'Serviço de IA temporariamente indisponível. Tente novamente em alguns minutos.') {
    super(message, 503, true, 'AI_SERVICE_UNAVAILABLE');
  }
}

export class DocumentParseError extends AppError {
  constructor(message: string = 'O documento não pôde ser lido', details?: any) {
    super(message, 400, true, 'DOCUMENT_PARSE_ERROR', details);
  }
}

export class AITimeoutError extends AppError {
  constructor(message: string = 'A análise do documento demorou muito. Tente com uma imagem menor ou mais simples.') {
    super(message, 504, true, 'AI_TIMEOUT');
  }
}

