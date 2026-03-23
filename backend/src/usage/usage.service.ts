import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class UsageService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async checkAndIncrementQuota(userId: string): Promise<void> {
    const subscription = await this.prisma.userSubscription.findUnique({
      where: { userId },
      include: { plan: true },
    });

    if (!subscription || !subscription.isActive) {
      throw new ForbiddenException('No active subscription found');
    }

    const plan = subscription.plan;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Daily quota check via Redis
    const dailyKey = `quota:daily:${userId}:${today}`;
    const dailyCount = parseInt((await this.redis.get(dailyKey)) || '0', 10);

    if (dailyCount >= plan.dailyMessageLimit) {
      throw new ForbiddenException('Daily message limit reached. Please try again tomorrow.');
    }

    // Monthly quota check via DB
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const monthlyCount = await this.prisma.usageLog.count({
      where: { userId, createdAt: { gte: monthStart } },
    });

    if (monthlyCount >= plan.monthlyMessageLimit) {
      throw new ForbiddenException('Monthly message limit reached. Please upgrade your plan.');
    }

    // Increment daily counter (TTL until end of day)
    const newCount = await this.redis.incr(dailyKey);
    if (newCount === 1) {
      const secondsUntilMidnight = Math.floor(
        (new Date(today).setDate(new Date(today).getDate() + 1) - Date.now()) / 1000,
      );
      await this.redis.expire(dailyKey, Math.max(secondsUntilMidnight, 3600));
    }
  }

  async getUserUsage(userId: string) {
    const today = new Date().toISOString().split('T')[0];
    const dailyKey = `quota:daily:${userId}:${today}`;
    const dailyUsed = parseInt((await this.redis.get(dailyKey)) || '0', 10);

    const subscription = await this.prisma.userSubscription.findUnique({
      where: { userId },
      include: { plan: true },
    });

    return {
      dailyUsed,
      dailyLimit: subscription?.plan?.dailyMessageLimit || 0,
      monthlyLimit: subscription?.plan?.monthlyMessageLimit || 0,
    };
  }
}
