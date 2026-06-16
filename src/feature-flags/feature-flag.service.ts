import { Injectable, Logger } from '@nestjs/common';
import { FeatureFlagRepository } from './feature-flag.repository';
import { CreateFeatureFlagData } from './interfaces/feature-flag.interface';

@Injectable()
export class FeatureFlagService {
  private readonly logger = new Logger(FeatureFlagService.name);
  private readonly cache = new Map<string, boolean>();

  constructor(private readonly repository: FeatureFlagRepository) {}

  async isEnabled(key: string): Promise<boolean> {
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }
    const enabled = await this.repository.isEnabled(key);
    this.cache.set(key, enabled);
    return enabled;
  }

  async getAll(): Promise<Array<{ key: string; enabled: boolean; description: string | null }>> {
    const flags = await this.repository.findAll();
    return flags.map((f) => ({ key: f.key, enabled: f.isEnabled, description: f.description }));
  }

  async enable(key: string): Promise<void> {
    await this.repository.update(key, { isEnabled: true });
    this.cache.set(key, true);
    this.logger.log(`Feature flag "${key}" enabled`);
  }

  async disable(key: string): Promise<void> {
    await this.repository.update(key, { isEnabled: false });
    this.cache.set(key, false);
    this.logger.log(`Feature flag "${key}" disabled`);
  }

  async create(data: CreateFeatureFlagData): Promise<void> {
    await this.repository.create(data);
    this.cache.set(data.key, data.isEnabled ?? false);
    this.logger.log(`Feature flag "${data.key}" created`);
  }

  invalidateCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
}
