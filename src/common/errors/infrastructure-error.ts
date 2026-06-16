import { DomainError } from './domain-error';

export class InfrastructureError extends DomainError {
  constructor(
    message: string,
    code = 'INFRASTRUCTURE_ERROR',
    metadata?: Record<string, unknown>,
  ) {
    super(message, code, 500, metadata);
  }
}

export class DatabaseError extends InfrastructureError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, 'DATABASE_ERROR', metadata);
  }
}

export class ExternalServiceError extends InfrastructureError {
  constructor(
    serviceName: string,
    message: string,
    metadata?: Record<string, unknown>,
  ) {
    super(message, `${serviceName.toUpperCase()}_ERROR`, metadata);
  }
}
