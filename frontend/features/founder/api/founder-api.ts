import { apiClient } from "@/shared/api/client";

export type FounderProgram = {
  id: string;
  slug: string;
  name: string;
  price: number;
  currency: string;
  totalSeats: number;
  usedSeats: number;
  remainingSeats: number;
  status: string;
  badgeLabel: string;
  benefits: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type FounderSeat = {
  id: string;
  userId: string;
  programId: string;
  programName: string;
  badgeLabel: string;
  claimedAt: string;
  createdAt: string;
};

export const founderApi = {
  programs: () =>
    apiClient.request<FounderProgram[]>("/founder/programs", { method: "GET" }),

  programBySlug: (slug: string) =>
    apiClient.request<FounderProgram>(`/founder/programs/${slug}`, { method: "GET" }),

  mySeat: () =>
    apiClient.request<FounderSeat | null>("/founder/my-seat", { method: "GET" }),

  claim: (programId: string) =>
    apiClient.request<FounderSeat>("/founder/claim", {
      method: "POST",
      body: { programId },
    }),

  upgrade: (targetProgramId: string) =>
    apiClient.request<FounderSeat>("/founder/upgrade", {
      method: "POST",
      body: { targetProgramId },
    }),
};
