export interface BackupOptions {
  destination: string;
  tables?: string[];
  compress?: boolean;
  encrypt?: boolean;
}

export interface RestoreOptions {
  source: string;
  tables?: string[];
  overwrite?: boolean;
}

export interface BackupResult {
  success: boolean;
  path: string;
  sizeBytes: number;
  durationMs: number;
  tableCount: number;
  error?: string;
}

export interface RestoreResult {
  success: boolean;
  tables: string[];
  durationMs: number;
  error?: string;
}

export interface BackupProvider {
  createBackup(options: BackupOptions): Promise<BackupResult>;
  restoreBackup(options: RestoreOptions): Promise<RestoreResult>;
  listBackups(): Promise<Array<{ path: string; createdAt: Date; sizeBytes: number }>>;
}
