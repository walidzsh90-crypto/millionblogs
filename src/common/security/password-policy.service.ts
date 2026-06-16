import { Injectable } from '@nestjs/common';

export interface PasswordPolicy {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireDigit: boolean;
  requireSpecialChar: boolean;
  excludePasswords: string[];
}

@Injectable()
export class PasswordPolicyService {
  private readonly policy: PasswordPolicy = {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireDigit: true,
    requireSpecialChar: true,
    excludePasswords: ['password', '12345678', 'qwertyui'],
  };

  validate(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < this.policy.minLength) {
      errors.push(`Password must be at least ${this.policy.minLength} characters`);
    }
    if (password.length > this.policy.maxLength) {
      errors.push(`Password must be at most ${this.policy.maxLength} characters`);
    }
    if (this.policy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain an uppercase letter');
    }
    if (this.policy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain a lowercase letter');
    }
    if (this.policy.requireDigit && !/\d/.test(password)) {
      errors.push('Password must contain a digit');
    }
    if (this.policy.requireSpecialChar && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain a special character');
    }
    if (this.policy.excludePasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common');
    }

    return { valid: errors.length === 0, errors };
  }
}
