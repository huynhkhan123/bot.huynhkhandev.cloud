import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async listUsers(page: number, limit: number, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = { deletedAt: null };
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, email: true, username: true, role: true,
          isActive: true, isEmailVerified: true, lastLoginAt: true, createdAt: true,
          subscription: { include: { plan: { select: { name: true } } } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateUserStatus(userId: string, isActive: boolean) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: { id: true, email: true, isActive: true },
    });
    return { message: `User ${isActive ? 'activated' : 'suspended'}`, user };
  }

  async getStats() {
    const [totalUsers, activeUsers, totalConversations, totalMessages] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { deletedAt: null, isActive: true } }),
      this.prisma.conversation.count({ where: { deletedAt: null } }),
      this.prisma.message.count(),
    ]);

    return { totalUsers, activeUsers, totalConversations, totalMessages };
  }
}
