import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import * as argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    private redis: RedisService,
  ) {}

  // ─── REGISTER ─────────────────────────────────
  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { username: dto.username }], deletedAt: null },
    });
    if (existing) {
      throw new ConflictException('Email or username already taken');
    }

    const passwordHash = await argon2.hash(dto.password);

    // Assign free plan
    const freePlan = await this.prisma.plan.findFirst({ where: { name: 'free' } });

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        passwordHash,
        ...(freePlan && {
          subscription: {
            create: { planId: freePlan.id },
          },
        }),
      },
      select: { id: true, email: true, username: true, role: true },
    });

    return { message: 'Registration successful', user };
  }

  // ─── LOGIN ─────────────────────────────────────
  async login(dto: LoginDto, ip: string) {
    // Rate limit: 5 attempts per 15 min per IP+email
    const rateLimitKey = `login_attempts:${ip}:${dto.email}`;
    const attempts = await this.redis.incr(rateLimitKey);
    if (attempts === 1) await this.redis.expire(rateLimitKey, 900);
    if (attempts > 5) {
      throw new ForbiddenException('Too many login attempts. Please try again in 15 minutes.');
    }

    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null },
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (!user.isActive) throw new ForbiddenException('Account is suspended');

    // Brute force check via lockout key
    const lockKey = `login_lock:${user.id}`;
    const locked = await this.redis.exists(lockKey);
    if (locked) throw new ForbiddenException('Account temporarily locked due to too many failed attempts');

    const isValid = await argon2.verify(user.passwordHash, dto.password);
    if (!isValid) {
      // Track per-user failures for lockout (10 attempts → 30min lock)
      const failKey = `login_fail:${user.id}`;
      const fails = await this.redis.incr(failKey);
      if (fails === 1) await this.redis.expire(failKey, 1800);
      if (fails >= 10) {
        await this.redis.set(lockKey, '1', 1800);
        await this.redis.del(failKey);
      }
      throw new UnauthorizedException('Invalid credentials');
    }

    // Clear fail counter on success
    await this.redis.del(`login_fail:${user.id}`);
    await this.redis.del(rateLimitKey);

    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user: {
      id: user.id, email: user.email, username: user.username, role: user.role,
    }};
  }

  // ─── LOGOUT ────────────────────────────────────
  async logout(userId: string, refreshToken: string) {
    const tokenHash = await argon2.hash(refreshToken);
    // Find and revoke the specific token
    const stored = await this.prisma.refreshToken.findFirst({
      where: { userId, revokedAt: null },
    });
    if (stored) {
      await this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    return { message: 'Logged out successfully' };
  }

  // ─── REFRESH TOKEN ─────────────────────────────
  async refreshTokens(userId: string, family: string, rawRefreshToken: string) {
    // Find non-revoked tokens in this family
    const storedTokens = await this.prisma.refreshToken.findMany({
      where: { userId, family, revokedAt: null },
    });

    // Verify token hash matches one of the stored tokens
    type StoredToken = (typeof storedTokens)[number];
    let matchedToken: StoredToken | null = null;
    for (const t of storedTokens) {
      const matches = await argon2.verify(t.tokenHash, rawRefreshToken);
      if (matches) { matchedToken = t; break; }
    }

    if (!matchedToken) {
      // Token reuse detected — revoke entire family
      await this.prisma.refreshToken.updateMany({
        where: { family },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Invalid refresh token — all sessions revoked');
    }

    if (matchedToken.expiresAt < new Date()) {
      await this.prisma.refreshToken.update({
        where: { id: matchedToken.id },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Refresh token expired');
    }

    // Revoke old token in family
    await this.prisma.refreshToken.update({
      where: { id: matchedToken.id },
      data: { revokedAt: new Date() },
    });

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) throw new UnauthorizedException('User not found or inactive');

    return this.generateTokens(user.id, user.email, user.role, family);
  }

  // ─── GET ME ────────────────────────────────────
  async getMe(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, username: true, role: true,
        isEmailVerified: true, avatarUrl: true, lastLoginAt: true, createdAt: true,
        subscription: { include: { plan: true } },
      },
    });
  }

  // ─── FORGOT PASSWORD ───────────────────────────
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findFirst({ where: { email, deletedAt: null } });
    // Always return success to prevent email enumeration
    if (!user) return { message: 'If that email exists, a reset link has been sent' };

    const token = uuidv4();
    const tokenHash = await argon2.hash(token);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await this.prisma.passwordReset.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    // TODO Phase 2: send email with reset link containing plain token
    console.log(`[DEV] Password reset token for ${email}: ${token}`);

    return { message: 'If that email exists, a reset link has been sent' };
  }

  // ─── RESET PASSWORD ────────────────────────────
  async resetPassword(token: string, newPassword: string) {
    const resets = await this.prisma.passwordReset.findMany({
      where: { usedAt: null, expiresAt: { gt: new Date() } },
    });

    type PasswordResetRow = (typeof resets)[number];
    let matched: PasswordResetRow | null = null;
    for (const r of resets) {
      if (await argon2.verify(r.tokenHash, token)) { matched = r; break; }
    }
    if (!matched) throw new BadRequestException('Invalid or expired reset token');

    const passwordHash = await argon2.hash(newPassword);
    await this.prisma.user.update({ where: { id: matched.userId }, data: { passwordHash } });
    await this.prisma.passwordReset.update({ where: { id: matched.id }, data: { usedAt: new Date() } });

    // Revoke all sessions
    await this.prisma.refreshToken.updateMany({
      where: { userId: matched.userId },
      data: { revokedAt: new Date() },
    });

    return { message: 'Password reset successfully. Please log in again.' };
  }

  // ─── HELPERS ───────────────────────────────────
  private async generateTokens(userId: string, email: string, role: string, existingFamily?: string) {
    const family = existingFamily || uuidv4();

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email, role },
        { secret: this.config.get('JWT_ACCESS_SECRET'), expiresIn: this.config.get('JWT_ACCESS_EXPIRES_IN', '15m') },
      ),
      this.jwtService.signAsync(
        { sub: userId, family },
        { secret: this.config.get('JWT_REFRESH_SECRET'), expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d') },
      ),
    ]);

    const tokenHash = await argon2.hash(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, family, expiresAt },
    });

    return { accessToken, refreshToken };
  }
}
