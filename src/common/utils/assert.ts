import { ForbiddenException, NotFoundException } from '@nestjs/common';

/** 존재 검증 */
export function assertFound<T>(entity: T | null, message: string): T {
  if (entity === null || entity === undefined) {
    throw new NotFoundException(message);
  } else {
    return entity;
  }
}

/** 소유자 검증 */
export function assertOwner(
  entityUserId: number,
  currentUserId: number,
  message: string,
): void {
  if (entityUserId !== currentUserId) {
    throw new ForbiddenException(message);
  }
}
