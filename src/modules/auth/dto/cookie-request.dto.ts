export interface RequestWithCookies extends Request {
  cookies?: {
    codesense_auth_token?: string;
  };
}
