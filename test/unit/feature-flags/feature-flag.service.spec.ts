import { Test, TestingModule } from '@nestjs/testing';
import { FeatureFlagService } from '../../../src/feature-flags';
import { FeatureFlagRepository } from '../../../src/feature-flags';
import { PrismaService } from '../../../src/prisma';

describe('FeatureFlagService', () => {
  let service: FeatureFlagService;
  let repository: FeatureFlagRepository;

  const mockPrisma = {
    featureFlag: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeatureFlagService,
        FeatureFlagRepository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<FeatureFlagService>(FeatureFlagService);
    repository = module.get<FeatureFlagRepository>(FeatureFlagRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
    service.invalidateCache();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return false for unknown flags', async () => {
    mockPrisma.featureFlag.findFirst.mockResolvedValue(null);
    const enabled = await service.isEnabled('unknown_flag');
    expect(enabled).toBe(false);
  });

  it('should return true for enabled flags', async () => {
    mockPrisma.featureFlag.findFirst.mockResolvedValue({ isEnabled: true });
    const enabled = await service.isEnabled('test_flag');
    expect(enabled).toBe(true);
  });
});
