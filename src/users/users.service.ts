import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { PasswordService } from '../common/security';
import { ActivityService } from '../activity';
import { DomainEventPublisher } from '../events';
import { EventName } from '../events/event-names';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UsersService {
  constructor(
    private readonly repository: UsersRepository,
    private readonly passwordService: PasswordService,
    private readonly activity: ActivityService,
    private readonly eventPublisher: DomainEventPublisher,
  ) {}

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    const existing = await this.repository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await this.passwordService.hash(dto.password);
    const emailVerifyToken = uuidv4();

    const user = await this.repository.create({
      ...dto,
      email: dto.email.toLowerCase(),
      passwordHash,
      emailVerifyToken,
    });

    await this.activity.record({
      actorId: user.id,
      type: 'user.joined',
      resource: 'user',
      resourceId: user.id,
      context: { email: user.email },
      metadata: null,
    });

    await this.eventPublisher.publish({
      eventId: uuidv4(),
      eventName: EventName.USER_REGISTERED,
      aggregateId: user.id,
      aggregateType: 'user',
      payload: {
        userId: user.id,
        email: user.email,
        displayName: user.displayName,
        emailVerifyToken,
      },
      occurredAt: new Date(),
    });

    return UserResponseDto.fromEntity(user);
  }

  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.repository.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return UserResponseDto.fromEntity(user);
  }

  async findByEmail(email: string): Promise<UserResponseDto | null> {
    const user = await this.repository.findByEmail(email);
    return user ? UserResponseDto.fromEntity(user) : null;
  }

  async updateProfile(id: string, dto: UpdateProfileDto): Promise<UserResponseDto> {
    const user = await this.repository.updateProfile(id, dto);

    await this.activity.record({
      actorId: id,
      type: 'profile.updated',
      resource: 'user',
      resourceId: id,
      context: dto as any,
      metadata: null,
    });

    return UserResponseDto.fromEntity(user);
  }

  async verifyEmail(token: string): Promise<UserResponseDto> {
    const user = await this.repository.findByEmailVerifyToken(token);
    if (!user) throw new NotFoundException('Invalid verification token');

    const verified = await this.repository.markEmailVerified(user.id);
    return UserResponseDto.fromEntity(verified);
  }
}
