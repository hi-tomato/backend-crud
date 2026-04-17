import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ERROR_CODES } from '../../common/const/error-codes';
import { BusinessException } from '../../common/exception/business.exception';
import type { JwtPayload } from '../types/jwt-payload.type';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );

    if (!requiredRoles) return true;

    const req = context
      .switchToHttp()
      .getRequest<Request & { user: JwtPayload }>();

    if (requiredRoles.includes(req.user.role)) return true;

    throw new BusinessException(ERROR_CODES.COMMON.FORBIDDEN);
  }
}
