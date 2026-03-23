import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(config: ConfigService) {
    const secret = config.get<string>('JWT_REFRESH_SECRET') as string;
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.['refresh_token'] ?? null,
      ]),
      secretOrKey: secret,
      passReqToCallback: true as true,
      ignoreExpiration: false,
    });
  }

  async validate(req: Request, payload: { sub: string; family: string }) {
    const refreshToken = req.cookies?.['refresh_token'];
    return { userId: payload.sub, family: payload.family, refreshToken };
  }
}
