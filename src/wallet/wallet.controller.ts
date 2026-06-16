import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WalletService } from './wallet.service';
import { CurrentUser } from '../users';
import { Roles, ROLES } from '../roles';

@Controller('wallet')
@UseGuards(AuthGuard('jwt'))
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  async getWallet(@CurrentUser() user: { id: string }) {
    return this.walletService.getOrCreateWallet(user.id);
  }

  @Get('balance')
  async getBalance(@CurrentUser() user: { id: string }) {
    return this.walletService.getBalance(user.id);
  }

  @Get('transactions')
  async getTransactions(
    @CurrentUser() user: { id: string },
    @Query('type') type?: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.walletService.getTransactions(user.id, {
      type,
      page: page || 1,
      pageSize: pageSize || 20,
    });
  }

}

@Controller('admin/wallet')
@UseGuards(AuthGuard('jwt'))
@Roles(ROLES.ADMIN, ROLES.SUPER_ADMIN)
export class AdminWalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post('adjust')
  async adjust(
    @CurrentUser() admin: { id: string },
    @Body() dto: { userId: string; amount: number; reason: string },
  ) {
    return this.walletService.adminAdjustment(admin.id, dto.userId, dto.amount, dto.reason);
  }
}
