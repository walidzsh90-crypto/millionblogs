export type AuthStatus = "unknown" | "authenticated" | "anonymous" | "expired";

export type CurrentUserSummary = {
  id: string;
  email: string;
  role: "blogger" | "admin" | "super_admin";
};

export type AuthState = {
  status: AuthStatus;
  user: CurrentUserSummary | null;
};
