import type  { RefreshTokenIssueDto } from './refresh-token-issue.dto';

import    { type User } from '../../user/entity/user.entity';

export class RefreshTokenRotationDto {
  user!: User;
  refreshTokenIssue!: RefreshTokenIssueDto;
}
