import { SetMetadata } from '@nestjs/common';

import type     { RoleTypes } from '../../user/enums/role-types.enums';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: RoleTypes[]) => SetMetadata(ROLES_KEY, roles);
