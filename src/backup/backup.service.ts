import { Injectable, Logger } from '@nestjs/common';
import {
  BackupOptions,
  RestoreOptions,
  BackupResult,
  RestoreResult,
  BackupProvider,
} from './interfaces/backup.interface';

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private provider: BackupProvider | null = null;

  registerProvider(provider: BackupProvider): void {
    this.provider = provider;
    this.logger.log('Backup provider registered');
  }

  async createBackup(options: BackupOptions): Promise<BackupResult> {
    if (!this.provider) {
      throw new Error('No backup provider registered');
    }
    this.logger.log({ destination: options.destination }, 'Starting backup');
    const start = Date.now();
    const result = await this.provider.createBackup(options);
    result.durationMs = Date.now() - start;
    if (result.success) {
      this.logger.log(result, 'Backup completed');
    } else {
      this.logger.error(result, 'Backup failed');
    }
    return result;
  }

  async restoreBackup(options: RestoreOptions): Promise<RestoreResult> {
    if (!this.provider) {
      throw new Error('No backup provider registered');
    }
    this.logger.warn({ source: options.source }, 'Starting restore');
    const start = Date.now();
    const result = await this.provider.restoreBackup(options);
    result.durationMs = Date.now() - start;
    this.logger.log(result, 'Restore completed');
    return result;
  }

  async listBackups() {
    if (!this.provider) {
      throw new Error('No backup provider registered');
    }
    return this.provider.listBackups();
  }
}
