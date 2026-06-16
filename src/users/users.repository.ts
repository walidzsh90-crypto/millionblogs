import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateUserDto & { passwordHash: string; emailVerifyToken?: string }) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        displayName: data.displayName,
        emailVerifyToken: data.emailVerifyToken,
        passwordChangedAt: new Date(),
      },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: { email: email.toLowerCase(), deletedAt: null },
    });
  }

  async findByEmailVerifyToken(token: string) {
    return this.prisma.user.findFirst({
      where: { emailVerifyToken: token, deletedAt: null },
    });
  }

  async update(id: string, data: Record<string, unknown>) {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async updateProfile(id: string, data: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id },
      data: {
        ...(data.displayName && { displayName: data.displayName }),
        ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
        ...(data.language && { language: data.language }),
        ...(data.timezone && { timezone: data.timezone }),
        ...(data.badgeVisibility !== undefined && { badgeVisibility: data.badgeVisibility }),
      },
    });
  }

  async updatePassword(id: string, passwordHash: string) {
    return this.prisma.user.update({
      where: { id },
      data: {
        passwordHash,
        passwordChangedAt: new Date(),
      },
    });
  }

  async markEmailVerified(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: {
        emailVerifiedAt: new Date(),
        emailVerifyToken: null,
      },
    });
  }

  async updateLastLogin(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  async softDelete(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async findMany(skip = 0, take = 50) {
    return this.prisma.user.findMany({
      where: { deletedAt: null },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }
}
