import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id, deletedAt: null },
      select: {
        id: true, email: true, username: true, role: true,
        isActive: true, isEmailVerified: true, avatarUrl: true,
        lastLoginAt: true, createdAt: true,
      },
    });
  }
}
