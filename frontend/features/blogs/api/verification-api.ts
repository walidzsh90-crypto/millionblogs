import { apiClient } from "@/shared/api/client";

export type VerificationMethod = "meta_tag" | "dns_txt" | "html_file";

export type OwnershipVerification = {
  id: string;
  blogId: string;
  method: VerificationMethod;
  token: string;
  status: "pending" | "verified" | "failed" | "expired";
  expiresAt: string | null;
  attemptCount: number;
  lastCheckedAt: string | null;
  errorMessage: string | null;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InitiateVerificationInput = {
  method: VerificationMethod;
};

export const verificationApi = {
  initiate: (blogId: string, input: InitiateVerificationInput) =>
    apiClient.request<OwnershipVerification>(
      `/blogs/${blogId}/verifications`,
      { method: "POST", body: input }
    ),

  list: (blogId: string) =>
    apiClient.request<OwnershipVerification[]>(
      `/blogs/${blogId}/verifications`,
      { method: "GET" }
    ),

  check: (blogId: string, verificationId: string) =>
    apiClient.request<OwnershipVerification>(
      `/blogs/${blogId}/verifications/${verificationId}/check`,
      { method: "POST" }
    ),
};
