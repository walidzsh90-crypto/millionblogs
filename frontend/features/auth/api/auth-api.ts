import { apiClient } from "@/shared/api/client";

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  user?: {
    id: string;
    email: string;
    role: "blogger" | "admin" | "super_admin";
  };
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = {
  email: string;
  password: string;
  name: string;
};

export type ForgotPasswordInput = {
  email: string;
};

export type ResetPasswordInput = {
  token: string;
  password: string;
};

export type VerifyEmailInput = {
  token: string;
};

export const authApi = {
  login: (input: LoginInput) =>
    apiClient.request<AuthTokens>("/auth/login", {
      method: "POST",
      body: input
    }),
  register: (input: RegisterInput) =>
    apiClient.request<AuthTokens>("/auth/register", {
      method: "POST",
      body: input
    }),
  forgotPassword: (input: ForgotPasswordInput) =>
    apiClient.request<{ message?: string }>("/auth/forgot-password", {
      method: "POST",
      body: input
    }),
  resetPassword: (input: ResetPasswordInput) =>
    apiClient.request<{ message?: string }>("/auth/reset-password", {
      method: "POST",
      body: input
    }),
  verifyEmail: (input: VerifyEmailInput) =>
    apiClient.request<{ message?: string }>("/auth/verify-email", {
      method: "POST",
      body: input
    })
};
