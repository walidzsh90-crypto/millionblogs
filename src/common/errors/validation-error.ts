import { DomainError } from './domain-error';

export class ValidationError extends DomainError {
  public readonly errors: Array<{ field: string; constraints: string[] }>;

  constructor(
    errors: Array<{ field: string; constraints: string[] }>,
    message = 'Validation failed',
  ) {
    super(message, 'VALIDATION_ERROR', 422, { errors });
    this.errors = errors;
  }
}
