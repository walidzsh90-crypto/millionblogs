import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { VerificationService } from './verification.service';
import { OwnershipVerificationService } from './ownership-verification.service';

@Controller('verification')
@UseGuards(AuthGuard('jwt'))
export class VerificationController {
  constructor(
    private readonly verificationService: VerificationService,
    private readonly ownershipVerification: OwnershipVerificationService,
  ) {}

  // Quality/content verification
  @Post('start/:blogId')
  async startVerification(@Param('blogId') blogId: string) {
    return this.verificationService.verifyBlog(blogId);
  }

  @Get('history/:blogId')
  async getHistory(@Param('blogId') blogId: string) {
    return this.verificationService.getVerificationHistory(blogId);
  }

  @Get('latest/:blogId')
  async getLatest(@Param('blogId') blogId: string) {
    return this.verificationService.getLatestVerification(blogId);
  }

  // Ownership verification - Meta Tag
  @Post('ownership/:blogId/meta-tag')
  async initiateMetaTag(@Param('blogId') blogId: string) {
    return this.ownershipVerification.initiateMetaTag(blogId);
  }

  // Ownership verification - DNS TXT
  @Post('ownership/:blogId/dns-txt')
  async initiateDnsTxt(@Param('blogId') blogId: string) {
    return this.ownershipVerification.initiateDnsTxt(blogId);
  }

  // Ownership verification - HTML File
  @Post('ownership/:blogId/html-file')
  async initiateHtmlFile(@Param('blogId') blogId: string) {
    return this.ownershipVerification.initiateHtmlFile(blogId);
  }

  // Check ownership status
  @Post('ownership/:blogId/check/:method')
  async checkOwnership(
    @Param('blogId') blogId: string,
    @Param('method') method: string,
  ) {
    return this.ownershipVerification.checkOwnership(blogId, method);
  }

  // Get ownership verification status for all methods
  @Get('ownership/:blogId/status')
  async getOwnershipStatus(@Param('blogId') blogId: string) {
    return this.ownershipVerification.getOwnershipStatus(blogId);
  }
}
