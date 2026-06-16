import {
  Injectable,
  Logger,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '../config';
import { UsersService } from '../users';
import { UsersRepository } from '../users';
import { SessionsRepository } from '../sessions';
import { PasswordService } from '../common/security';
import { BruteForceService } from '../common/security';
import { AuditService } from '../audit';
import { ActivityService } from '../activity';
import { DomainEventPublisher } from '../events';
import { EventName } from '../events/event-names';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthTokensDto } from './dto/auth-tokens.dto';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly usersRepository: UsersRepository,
    private readonly sessionsRepository: SessionsRepository,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly passwordService: PasswordService,
    private readonly bruteForce: BruteForceService,
    private readonly audit: AuditService,
    private readonly activity: ActivityService,
    private readonly eventPublisher: DomainEventPublisher,
  ) {}

  async register(
    dto: RegisterDto,
    deviceInfo?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthTokensDto> {
    const user = await this.usersService.create(dto);

    const tokens = await this.generateTokens(user.id, user.email as string, user.role as string);
    await this.createSession(user.id, tokens.refreshToken, deviceInfo, ipAddress, userAgent);

    await this.audit.record({
      actorId: user.id,
      action: 'user.registered',
      resourceType: 'user',
      resourceId: user.id,
      changeset: null,
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
      metadata: { email: dto.email },
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email as string,
        displayName: user.displayName,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  async login(
    dto: LoginDto,
    deviceInfo?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthTokensDto> {
    const identifier = `login:${dto.email.toLowerCase()}`;

    if (await this.bruteForce.isBlocked(identifier)) {
      throw new BadRequestException('Account temporarily locked. Try again later.');
    }

    const user = await this.usersRepository.findByEmail(dto.email);
    if (!user) {
      await this.bruteForce.recordAttempt(identifier);
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await this.passwordService.compare(dto.password, user.passwordHash);
    if (!valid) {
      await this.bruteForce.recordAttempt(identifier);
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.bruteForce.reset(identifier);

    await this.usersRepository.updateLastLogin(user.id);

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.createSession(user.id, tokens.refreshToken, deviceInfo, ipAddress, userAgent);

    await this.audit.record({
      actorId: user.id,
      action: 'user.logged_in',
      resourceType: 'user',
      resourceId: user.id,
      changeset: null,
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
      metadata: null,
    });

    await this.eventPublisher.publish({
      eventId: uuidv4(),
      eventName: EventName.USER_LOGGED_IN,
      aggregateId: user.id,
      aggregateType: 'user',
      payload: { userId: user.id, email: user.email },
      occurredAt: new Date(),
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  async refresh(dto: RefreshTokenDto): Promise<AuthTokensDto> {
    const session = await this.sessionsRepository.findByRefreshToken(dto.refreshToken);
    if (!session) {
      const revokedSession = await this.sessionsRepository.findByRefreshTokenIncludeRevoked(dto.refreshToken);
      if (revokedSession) {
        this.logger.warn(`Refresh token reuse detected for user ${revokedSession.userId}, revoking all sessions`);
        await this.sessionsRepository.revokeAllByUserId(revokedSession.userId);
        await this.audit.record({
          actorId: revokedSession.userId,
          action: 'security.token_reuse_detected',
          resourceType: 'session',
          resourceId: revokedSession.id,
          changeset: null,
          ipAddress: null,
          userAgent: null,
          metadata: { message: 'Stolen refresh token detected, all sessions revoked' },
        });
      }
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.usersRepository.findById(session.userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    await this.sessionsRepository.revoke(session.id);

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.createSession(user.id, tokens.refreshToken);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  async logout(refreshToken: string): Promise<void> {
    const session = await this.sessionsRepository.findByRefreshToken(refreshToken);
    if (session) {
      await this.sessionsRepository.revoke(session.id);

      await this.audit.record({
        actorId: session.userId,
        action: 'user.logged_out',
        resourceType: 'session',
        resourceId: session.id,
        changeset: null,
        ipAddress: null,
        userAgent: null,
        metadata: null,
      });

      await this.eventPublisher.publish({
        eventId: uuidv4(),
        eventName: EventName.USER_LOGGED_OUT,
        aggregateId: session.userId,
        aggregateType: 'user',
        payload: { userId: session.userId, sessionId: session.id },
        occurredAt: new Date(),
      });
    }
  }

  async logoutAll(userId: string, excludeSessionToken?: string): Promise<void> {
    let excludeSessionId: string | undefined;

    if (excludeSessionToken) {
      const currentSession = await this.sessionsRepository.findByRefreshToken(excludeSessionToken);
      excludeSessionId = currentSession?.id;
    }

    await this.sessionsRepository.revokeAllByUserId(userId, excludeSessionId);
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.usersRepository.findByEmail(email);
    if (!user) {
      return;
    }

    const recent = await this.sessionsRepository.findRecentPasswordReset(user.id, 5);
    if (recent) {
      return;
    }

    const rawToken = uuidv4();
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.sessionsRepository.createPasswordReset(user.id, tokenHash, expiresAt);

    await this.eventPublisher.publish({
      eventId: uuidv4(),
      eventName: EventName.PASSWORD_RESET_REQUESTED,
      aggregateId: user.id,
      aggregateType: 'user',
      payload: { userId: user.id, email: user.email, expiresAt },
      occurredAt: new Date(),
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const resetRecord = await this.sessionsRepository.findPasswordResetByToken(tokenHash);

    if (!resetRecord || resetRecord.usedAt || resetRecord.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await this.passwordService.hash(newPassword);
    await this.usersRepository.updatePassword(resetRecord.userId, passwordHash);

    await this.sessionsRepository.markPasswordResetAsUsed(resetRecord.id);

    await this.sessionsRepository.revokeAllByUserId(resetRecord.userId);

    await this.audit.record({
      actorId: resetRecord.userId,
      action: 'password.reset',
      resourceType: 'user',
      resourceId: resetRecord.userId,
      changeset: null,
      ipAddress: null,
      userAgent: null,
      metadata: null,
    });

    await this.activity.record({
      actorId: resetRecord.userId,
      type: 'password.changed',
      resource: 'user',
      resourceId: resetRecord.userId,
      context: null,
      metadata: null,
    });

    await this.eventPublisher.publish({
      eventId: uuidv4(),
      eventName: EventName.PASSWORD_CHANGED,
      aggregateId: resetRecord.userId,
      aggregateType: 'user',
      payload: { userId: resetRecord.userId },
      occurredAt: new Date(),
    });
  }

  async verifyEmail(token: string): Promise<void> {
    await this.usersService.verifyEmail(token);
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: string,
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    const accessToken = this.jwtService.sign(
      { sub: userId, email, role },
      {
        secret: this.config.get('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get('JWT_ACCESS_EXPIRY'),
      },
    );

    const refreshToken = uuidv4();
    const expiresIn = this.parseExpiry(this.config.get('JWT_ACCESS_EXPIRY'));

    return { accessToken, refreshToken, expiresIn };
  }

  private async createSession(
    userId: string,
    refreshToken: string,
    deviceInfo?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const refreshExpiry = this.config.get('JWT_REFRESH_EXPIRY');
    const expiresAt = this.parseExpiryDate(refreshExpiry);

    await this.sessionsRepository.create({
      userId,
      refreshToken,
      deviceInfo: deviceInfo ?? null,
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
      expiresAt,
    });
  }

  private parseExpiry(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 900;
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
    return value * (multipliers[unit] || 60);
  }

  private parseExpiryDate(expiry: string): Date {
    const ms = this.parseExpiry(expiry) * 1000;
    return new Date(Date.now() + ms);
  }
}
