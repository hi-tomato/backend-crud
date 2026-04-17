import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ERROR_MESSAGES } from '../../common/const/error-messages';
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

    throw new ForbiddenException(ERROR_MESSAGES.COMMON.FORBIDDEN);
  }
}
