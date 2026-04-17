import type { Request } from 'express';

import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ERROR_CODES } from '../../common/const/error-codes';
import { BusinessException } from '../../common/exception/business.exception';
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
      throw new BusinessException(ERROR_CODES.COMMON.UNAUTHORIZED);
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);

      request.user = payload;
    } catch {
      throw new BusinessException(ERROR_CODES.COMMON.INVALID_TOKEN);
    }

    return true;
  }
}
