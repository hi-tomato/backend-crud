export const ERROR_MESSAGES = {
  // 공통
  COMMON: {
    FORBIDDEN: 'You do not have permission to perform this action',
    UNAUTHORIZED: 'Authentication is required',
    INVALID_TOKEN: 'Invalid or expired token',
    FILE_NOT_FOUND: 'File is required',
    UNSUPPORTED_FILE_TYPE: 'Unsupported file type',
  },

  // 유저
  USER: {
    NOT_FOUND: 'User not found',
    EMAIL_EXISTS: 'Email already exists',
    INVALID_PASSWORD: 'Invalid password',
    PASSWORD_MISMATCH: 'Passwords do not match',
  },

  // 게시글
  POST: {
    NOT_FOUND: 'Post not found',
    FORBIDDEN: 'You are not the author of this post',
  },

  // 댓글
  COMMENT: {
    NOT_FOUND: 'Comment not found',
    FORBIDDEN: 'You are not the author of this comment',
  },
};
