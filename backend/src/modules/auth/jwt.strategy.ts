import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';

export interface JwtPayload {
  sub: string;
  email: string;
  accountType: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET') || 'titan_super_secret_access_key',
    });
  }

  async validate(payload: JwtPayload) {
    const userProfile = await this.usersService.findById(payload.sub);

    if (!userProfile) {
      throw new UnauthorizedException('User no longer exists');
    }

    if (userProfile.status !== 'ACTIVE') {
      throw new UnauthorizedException(`Account is currently ${userProfile.status}`);
    }

    return userProfile;
  }
}
