export interface FeatureFlagEntity {
  id: string;
  key: string;
  description: string | null;
  isEnabled: boolean;
  rules: Record<string, unknown> | null;
  owner: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFeatureFlagData {
  key: string;
  description?: string;
  isEnabled?: boolean;
  rules?: Record<string, unknown>;
  owner?: string;
}

export interface UpdateFeatureFlagData {
  description?: string;
  isEnabled?: boolean;
  rules?: Record<string, unknown>;
  owner?: string;
}
