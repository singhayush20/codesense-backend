export enum GithubAccountType {
  USER = 'USER',
  ORGANIZATION = 'ORGANIZATION',
}

export function mapGithubAccountType(type: string): GithubAccountType {
  switch (type) {
    case 'User':
      return GithubAccountType.USER;
    case 'Organization':
      return GithubAccountType.ORGANIZATION;
    default:
      throw new Error(`Unsupported GitHub account type: ${type}`);
  }
}