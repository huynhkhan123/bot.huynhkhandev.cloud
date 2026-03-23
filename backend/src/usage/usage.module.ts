import { Module } from '@nestjs/common';
import { UsageService } from './usage.service';
import { UsageGuard } from './usage.guard';

@Module({
  providers: [UsageService, UsageGuard],
  exports: [UsageService, UsageGuard],
})
export class UsageModule {}
