import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { BadgesRepository } from './badges.repository';
import { DomainEventPublisher } from '../events';
import { EventName } from '../events/event-names';
import { v4 as uuidv4 } from 'uuid';
import { BadgeResponseDto } from './dto/badge-response.dto';
import { UserBadgeResponseDto } from './dto/user-badge-response.dto';

@Injectable()
export class BadgesService {

  constructor(
    private readonly badgesRepository: BadgesRepository,
    private readonly eventPublisher: DomainEventPublisher,
  ) {}

  // Admin
  async createBadge(dto: any) {
    const existing = await this.badgesRepository.findBySlug(dto.slug);
    if (existing) throw new ConflictException('Badge slug already exists');

    const badge = await this.badgesRepository.create(dto);

    await this.eventPublisher.publish({
      eventId: uuidv4(),
      eventName: EventName.BADGE_CREATED,
      aggregateId: badge.id,
      aggregateType: 'badge',
      payload: { badgeId: badge.id, name: badge.name, slug: badge.slug, type: badge.type },
      occurredAt: new Date(),
    });

    return BadgeResponseDto.fromEntity(badge);
  }

  async updateBadge(id: string, dto: any) {
    const badge = await this.badgesRepository.findById(id);
    if (!badge) throw new NotFoundException('Badge not found');

    const updated = await this.badgesRepository.update(id, dto);
    return BadgeResponseDto.fromEntity(updated);
  }

  async archiveBadge(id: string) {
    const badge = await this.badgesRepository.findById(id);
    if (!badge) throw new NotFoundException('Badge not found');

    await this.badgesRepository.archive(id);
    return { archived: true };
  }

  async getAllBadges() {
    const badges = await this.badgesRepository.findAll();
    return badges.map((b: any) => BadgeResponseDto.fromEntity(b));
  }

  // User
  async getMyBadges(userId: string) {
    const userBadges = await this.badgesRepository.getUserBadges(userId);
    return userBadges.map((ub: any) => UserBadgeResponseDto.fromEntity(ub));
  }

  async getMyVisibleBadges(userId: string) {
    const userBadges = await this.badgesRepository.getUserVisibleBadges(userId);
    return userBadges.map((ub: any) => UserBadgeResponseDto.fromEntity(ub));
  }

  async setBadgeVisibility(userId: string, badgeId: string, isVisible: boolean) {
    const userBadge = await this.badgesRepository.findUserBadge(userId, badgeId);
    if (!userBadge) throw new NotFoundException('Badge not assigned to user');

    const updated = await this.badgesRepository.setBadgeVisibility(userId, badgeId, isVisible);

    await this.eventPublisher.publish({
      eventId: uuidv4(),
      eventName: EventName.BADGE_VISIBILITY_CHANGED,
      aggregateId: badgeId,
      aggregateType: 'badge',
      payload: { userId, badgeId, isVisible },
      occurredAt: new Date(),
    });

    return UserBadgeResponseDto.fromEntity(updated);
  }

  // Admin assignments
  async assignBadgeToUser(userId: string, badgeId: string) {
    const badge = await this.badgesRepository.findById(badgeId);
    if (!badge) throw new NotFoundException('Badge not found');

    const userBadge = await this.badgesRepository.assignBadge(userId, badgeId);

    await this.eventPublisher.publish({
      eventId: uuidv4(),
      eventName: EventName.BADGE_ASSIGNED,
      aggregateId: badgeId,
      aggregateType: 'badge',
      payload: { userId, badgeId, badgeName: badge.name },
      occurredAt: new Date(),
    });

    return UserBadgeResponseDto.fromEntity(userBadge);
  }

  async revokeBadgeFromUser(userId: string, badgeId: string) {
    const userBadge = await this.badgesRepository.findUserBadge(userId, badgeId);
    if (!userBadge) throw new NotFoundException('Badge not assigned to user');

    await this.badgesRepository.revokeBadge(userId, badgeId);

    await this.eventPublisher.publish({
      eventId: uuidv4(),
      eventName: EventName.BADGE_REVOKED,
      aggregateId: badgeId,
      aggregateType: 'badge',
      payload: { userId, badgeId },
      occurredAt: new Date(),
    });

    return { revoked: true };
  }

  async getUserBadges(userId: string) {
    const badges = await this.badgesRepository.getUserBadges(userId);
    return badges.map((ub: any) => UserBadgeResponseDto.fromEntity(ub));
  }

  async getStats() {
    return this.badgesRepository.getStats();
  }
}
