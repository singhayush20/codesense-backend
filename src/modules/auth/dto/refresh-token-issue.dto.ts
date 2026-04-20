export class RefreshTokenIssueDto {
    token!: string;

    expiresAt!: Date;

    sessionId!: string;
}