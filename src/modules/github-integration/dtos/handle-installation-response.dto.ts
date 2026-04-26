export class HandleInstallationResponseDto {
  success!: boolean;
  account!: {
    id: string;
    login: string;
    installationId: string;
  };
}
