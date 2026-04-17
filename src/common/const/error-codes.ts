import { HttpStatus } from '@nestjs/common';

export interface ErrorCode {
  code: string;
  message: string;
  statusCode: HttpStatus;
}

export const ERROR_CODES = {
  // 공통
  COMMON: {
    FORBIDDEN: {
      code: 'COMMON_FORBIDDEN',
      message: '권한이 없습니다',
      statusCode: HttpStatus.FORBIDDEN,
    },
    UNAUTHORIZED: {
      code: 'COMMON_UNAUTHORIZED',
      message: '인증이 필요합니다',
      statusCode: HttpStatus.UNAUTHORIZED,
    },
    INVALID_TOKEN: {
      code: 'COMMON_INVALID_TOKEN',
      message: '유효하지 않거나 만료된 토큰입니다',
      statusCode: HttpStatus.UNAUTHORIZED,
    },
    FILE_NOT_FOUND: {
      code: 'COMMON_FILE_NOT_FOUND',
      message: '파일이 필요합니다',
      statusCode: HttpStatus.BAD_REQUEST,
    },
    UNSUPPORTED_FILE_TYPE: {
      code: 'COMMON_UNSUPPORTED_FILE_TYPE',
      message: '지원하지 않는 파일 형식입니다',
      statusCode: HttpStatus.BAD_REQUEST,
    },
  },

  // 유저
  USER: {
    NOT_FOUND: {
      code: 'USER_NOT_FOUND',
      message: '사용자를 찾을 수 없습니다',
      statusCode: HttpStatus.NOT_FOUND,
    },
    EMAIL_EXISTS: {
      code: 'USER_EMAIL_EXISTS',
      message: '이미 사용 중인 이메일입니다',
      statusCode: HttpStatus.CONFLICT,
    },
    PASSWORD_MISMATCH: {
      code: 'USER_PASSWORD_MISMATCH',
      message: '비밀번호가 일치하지 않습니다',
      statusCode: HttpStatus.BAD_REQUEST,
    },
  },

  // 게시글
  POST: {
    NOT_FOUND: {
      code: 'POST_NOT_FOUND',
      message: '게시글을 찾을 수 없습니다',
      statusCode: HttpStatus.NOT_FOUND,
    },
    FORBIDDEN: {
      code: 'POST_FORBIDDEN',
      message: '게시글 작성자만 수정/삭제할 수 있습니다',
      statusCode: HttpStatus.FORBIDDEN,
    },
  },

  // 댓글
  COMMENT: {
    NOT_FOUND: {
      code: 'COMMENT_NOT_FOUND',
      message: '댓글을 찾을 수 없습니다',
      statusCode: HttpStatus.NOT_FOUND,
    },
    FORBIDDEN: {
      code: 'COMMENT_FORBIDDEN',
      message: '댓글 작성자만 수정/삭제할 수 있습니다',
      statusCode: HttpStatus.FORBIDDEN,
    },
  },
} as const;
