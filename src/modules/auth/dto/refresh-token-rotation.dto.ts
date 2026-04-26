import { User } from "../../user/entity/user.entity";
import { RefreshTokenIssueDto } from "./refresh-token-issue.dto";

export class RefreshTokenRotationDto {
    user!: User;
    refreshTokenIssue!: RefreshTokenIssueDto;
}