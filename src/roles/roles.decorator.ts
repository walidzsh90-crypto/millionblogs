export const ROLES_KEY = 'roles';

import { SetMetadata } from '@nestjs/common';
import { Role } from './roles.constants';

export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
