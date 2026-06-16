import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { DomainEventPublisher } from '../events';
import { EventName } from '../events/event-names';
import {
  BaseVerificationStrategy,
  ContentCheckStrategy,
  RuleEnforcementStrategy,
  HistoricalDataStrategy,
  ReputationAnalysisStrategy,
} from './strategies';
import { v4 as uuidv4 } from 'uuid';

export interface VerificationReport {
  blogId: string;
  overallScore: number;
  passed: boolean;
  strategyResults: Array<{
    name: string;
    weight: number;
    score: number;
    passed: boolean;
    details: Record<string, unknown>;
  }>;
  summary: string;
}

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);
  private readonly strategies: BaseVerificationStrategy[];

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventPublisher: DomainEventPublisher,
    private readonly contentCheck: ContentCheckStrategy,
    private readonly ruleEnforcement: RuleEnforcementStrategy,
    private readonly historicalData: HistoricalDataStrategy,
    private readonly reputationAnalysis: ReputationAnalysisStrategy,
  ) {
    this.strategies = [
      this.contentCheck,
      this.ruleEnforcement,
      this.historicalData,
      this.reputationAnalysis,
    ];
  }

  async verifyBlog(blogId: string): Promise<VerificationReport> {
    this.logger.log(`Starting verification for blog ${blogId}`);

    const blog = await this.prisma.blog.findFirst({
      where: { id: blogId, deletedAt: null },
    });
    if (!blog) {
      throw new Error(`Blog ${blogId} not found`);
    }

    const strategyResults = await Promise.all(
      this.strategies.map(async (strategy) => {
        try {
          const result = await strategy.verify(blogId);
          return {
            name: strategy.name,
            weight: strategy.weight,
            score: result.score,
            passed: result.passed,
            details: result.details,
          };
        } catch (err) {
          this.logger.error(`Strategy ${strategy.name} failed for blog ${blogId}`, err);
          return {
            name: strategy.name,
            weight: strategy.weight,
            score: 0,
            passed: false,
            details: { error: (err as Error).message },
          };
        }
      }),
    );

    const overallScore = strategyResults.reduce(
      (acc, r) => acc + r.score * r.weight,
      0,
    );
    const passed = overallScore >= 0.6;

    const summary = passed
      ? 'Blog passed verification'
      : 'Blog did not pass verification. Please address the issues and resubmit.';

    await this.prisma.blogVerification.create({
      data: {
        blogId,
        status: passed ? 'approved' : 'rejected',
        score: Math.round(overallScore * 100),
        strategies: JSON.parse(JSON.stringify(strategyResults)),
        summary,
        decidedAt: new Date(),
      },
    });

    const newStatus = passed ? 'verified' : 'rejected';
    await this.prisma.blog.update({
      where: { id: blogId },
      data: {
        status: newStatus,
        trustStatus: passed ? 'verified' : 'new',
        verifiedAt: passed ? new Date() : null,
      },
    });

    await this.createVerificationEvent(blogId, passed, overallScore, strategyResults);

    if (passed) {
      await this.eventPublisher.publish({
        eventId: uuidv4(),
        eventName: EventName.BLOG_VERIFIED,
        aggregateId: blogId,
        aggregateType: 'blog',
        payload: {
          blogId,
          overallScore,
          strategyResults: strategyResults.map((r) => ({ name: r.name, score: r.score })),
        },
        occurredAt: new Date(),
      });
    } else {
      await this.eventPublisher.publish({
        eventId: uuidv4(),
        eventName: EventName.BLOG_REJECTED,
        aggregateId: blogId,
        aggregateType: 'blog',
        payload: {
          blogId,
          overallScore,
          strategyResults: strategyResults.map((r) => ({ name: r.name, score: r.score })),
        },
        occurredAt: new Date(),
      });
    }

    this.logger.log(`Verification complete for blog ${blogId}: passed=${passed}, score=${overallScore}`);
    return { blogId, overallScore, passed, strategyResults, summary };
  }

  async getVerificationHistory(blogId: string) {
    return this.prisma.blogVerification.findMany({
      where: { blogId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getLatestVerification(blogId: string) {
    return this.prisma.blogVerification.findFirst({
      where: { blogId },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async createVerificationEvent(
    blogId: string,
    passed: boolean,
    overallScore: number,
    strategyResults: Array<{ name: string; score: number; details: Record<string, unknown> }>,
  ) {
    const eventName = passed ? EventName.BLOG_VERIFIED : EventName.BLOG_REJECTED;
    await this.prisma.event.create({
      data: {
        eventId: uuidv4(),
        eventName,
        aggregateId: blogId,
        aggregateType: 'blog',
        payload: {
          blogId,
          overallScore,
          passed,
          strategyResults: strategyResults.map((r) => ({
            name: r.name,
            score: r.score,
          })),
        },
        occurredAt: new Date(),
      },
    });
  }
}
