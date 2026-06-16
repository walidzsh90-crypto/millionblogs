import { Injectable } from '@nestjs/common';
import { FounderRepository } from '../founder/founder.repository';
import { SubscriptionsRepository } from '../subscriptions/subscriptions.repository';
import { PlansRepository } from '../plans/plans.repository';

export interface FeatureAccess {
  userId: string;
  isFounder: boolean;
  founderBadge: string | null;
  founderProgram: string | null;
  hasActiveSubscription: boolean;
  activeSubscriptionId: string | null;
  activePlanId: string | null;
  activePlanSlug: string | null;
  effectivePlan: string;
  features: string[];
  limits: Record<string, unknown>;
}

@Injectable()
export class FeatureAccessService {
  constructor(
    private readonly founderRepository: FounderRepository,
    private readonly subscriptionsRepository: SubscriptionsRepository,
    private readonly plansRepository: PlansRepository,
  ) {}

  async resolve(userId: string): Promise<FeatureAccess> {
    const [founderSeat, activeSub, plans] = await Promise.all([
      this.founderRepository.getSeatByUserId(userId),
      this.subscriptionsRepository.findActiveByUserId(userId),
      this.plansRepository.findActive(),
    ]);

    const isFounder = !!founderSeat;
    const founderBadge = founderSeat?.program?.badgeLabel || null;
    const founderProgram = founderSeat?.program?.slug || null;

    const hasActiveSubscription = !!activeSub;
    const activeSubscriptionId = activeSub?.id || null;
    const activePlanId = activeSub?.planId || null;
    const activePlanSlug = activeSub?.plan?.slug || null;

    let effectivePlan: string;
    let features: string[];
    let limits: Record<string, unknown>;

    if (isFounder) {
      effectivePlan = `founder_${founderProgram?.replace('founder-', '') || 'pro'}`;
      const programBenefits = (founderSeat?.program?.benefits as Record<string, unknown>) || {};
      features = Object.keys(programBenefits).filter((k) => programBenefits[k] === true);
      limits = this.resolveFounderLimits(founderProgram || 'founder-pro', plans);
    } else if (hasActiveSubscription && activeSub) {
      effectivePlan = activePlanSlug || 'unknown';
      const planFeatures = (activeSub.plan?.features as string[]) || [];
      features = Array.isArray(planFeatures) ? planFeatures : [];
      limits = this.resolvePlanLimits(activeSub.plan, plans);
    } else {
      effectivePlan = 'free';
      features = this.getFreeFeatures();
      limits = this.getFreeLimits();
    }

    return {
      userId,
      isFounder,
      founderBadge,
      founderProgram,
      hasActiveSubscription,
      activeSubscriptionId,
      activePlanId,
      activePlanSlug,
      effectivePlan,
      features: [...new Set(features)],
      limits,
    };
  }

  async hasAccess(userId: string, feature: string): Promise<boolean> {
    const access = await this.resolve(userId);
    return access.features.includes(feature);
  }

  private getFreeFeatures(): string[] {
    return [
      'basic_blogging',
      'single_blog',
      'rss_import',
      'basic_search',
    ];
  }

  private getFreeLimits(): Record<string, unknown> {
    return {
      maxBlogs: 1,
      maxArticles: 100,
      maxFeeds: 5,
      storage: '1gb',
      teamMembers: 0,
    };
  }

  private resolveFounderLimits(
    slug: string,
    plans: any[],
  ): Record<string, unknown> {
    const planSlug = slug === 'founder-master' ? 'founder-master' : 'founder-pro';
    const plan = plans.find((p: any) => p.slug === planSlug);
    if (plan?.limits) return plan.limits as Record<string, unknown>;

    return slug === 'founder-master'
      ? { maxBlogs: 100, maxArticles: 100000, maxFeeds: 500, storage: '100gb', teamMembers: 10 }
      : { maxBlogs: 10, maxArticles: 10000, maxFeeds: 100, storage: '10gb', teamMembers: 3 };
  }

  private resolvePlanLimits(
    plan: any,
    _plans: any[],
  ): Record<string, unknown> {
    if (plan?.limits) return plan.limits as Record<string, unknown>;

    const slug = plan?.slug || 'unknown';
    if (slug.includes('master')) {
      return { maxBlogs: 100, maxArticles: 100000, maxFeeds: 500, storage: '100gb', teamMembers: 10 };
    }
    if (slug.includes('pro')) {
      return { maxBlogs: 10, maxArticles: 10000, maxFeeds: 100, storage: '10gb', teamMembers: 3 };
    }
    return this.getFreeLimits();
  }
}
