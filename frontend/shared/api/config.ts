export const API_BASE_PATH = "/api/v1";

export type ApiClientConfig = {
  baseUrl?: string;
  getAccessToken?: () => string | null | Promise<string | null>;
  onUnauthorized?: () => void | Promise<void>;
};
