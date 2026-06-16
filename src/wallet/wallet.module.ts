import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma';
import { EventsModule } from '../events';
import { WalletService } from './wallet.service';
import { WalletRepository } from './wallet.repository';
import { WalletController, AdminWalletController } from './wallet.controller';

@Module({
  imports: [PrismaModule, EventsModule],
  controllers: [WalletController, AdminWalletController],
  providers: [WalletService, WalletRepository],
  exports: [WalletService, WalletRepository],
})
export class WalletModule {}
