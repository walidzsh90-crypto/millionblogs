import { Injectable } from '@nestjs/common';

export interface VerificationResult {
  passed: boolean;
  score: number;
  details: Record<string, unknown>;
}

@Injectable()
export abstract class BaseVerificationStrategy {
  abstract name: string;
  abstract weight: number;
  abstract verify(blogId: string): Promise<VerificationResult>;
}
