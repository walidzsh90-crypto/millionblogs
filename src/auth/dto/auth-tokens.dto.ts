export class AuthTokensDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    displayName: string;
    role: string;
    avatarUrl: string | null;
  };
}
