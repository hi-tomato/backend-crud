import type { Request } from 'express';

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ERROR_MESSAGES } from '../../common/const/error-messages';
import type { JwtPayload } from '../types/jwt-payload.type';

type RequestWithUser = Request & { user: JwtPayload };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    // Bearer <token> = Bearer[0] <token>[1]
    const token = request.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new UnauthorizedException(ERROR_MESSAGES.COMMON.UNAUTHORIZED);
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);

      request.user = payload;
    } catch {
      throw new UnauthorizedException(ERROR_MESSAGES.COMMON.INVALID_TOKEN);
    }

    return true;
  }
}
