import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../users/const/userRole';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
