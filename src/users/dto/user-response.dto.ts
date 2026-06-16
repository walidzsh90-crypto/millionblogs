export class UserResponseDto {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: string;
  emailVerifiedAt: Date | null;
  language: string;
  timezone: string;
  badgeVisibility: boolean;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;

  static fromEntity(user: {
    id: string;
    email: string;
    displayName: string;
    avatarUrl: string | null;
    role: string;
    emailVerifiedAt: Date | null;
    language: string;
    timezone: string;
    badgeVisibility: boolean;
    isActive: boolean;
    lastLoginAt: Date | null;
    createdAt: Date;
  }): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      role: user.role,
      emailVerifiedAt: user.emailVerifiedAt,
      language: user.language,
      timezone: user.timezone,
      badgeVisibility: user.badgeVisibility,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };
  }
}
