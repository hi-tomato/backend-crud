import { UserRole } from '../../users/const/userRole';

export type JwtPayload = {
  userId: number;
  email: string;
  role: UserRole;
};
