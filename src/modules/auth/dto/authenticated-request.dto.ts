import { Request } from 'express';
import { RoleTypes } from '../../user/enums/role-types.enums';

export interface AuthenticatedRequest extends Request {
  user?: { userId: string; email: string; roles?: RoleTypes[] };
  session?: unknown;
  cookies: Record<string, string>;
}
