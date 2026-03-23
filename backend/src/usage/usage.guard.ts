import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { UsageService } from './usage.service';

@Injectable()
export class UsageGuard implements CanActivate {
  constructor(private usageService: UsageService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    await this.usageService.checkAndIncrementQuota(user.id);
    return true;
  }
}
