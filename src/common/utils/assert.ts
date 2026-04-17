import type { ErrorCode } from '../const/error-codes';
import { BusinessException } from '../exception/business.exception';

/** 존재 검증 */
export function assertFound<T>(entity: T | null, errorCode: ErrorCode): T {
  if (entity === null || entity === undefined) {
    throw new BusinessException(errorCode);
  } else {
    return entity;
  }
}

/** 소유자 검증 */
export function assertOwner(
  entityUserId: number,
  currentUserId: number,
  errorCode: ErrorCode,
): void {
  if (entityUserId !== currentUserId) {
    throw new BusinessException(errorCode);
  }
}
