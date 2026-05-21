export interface GoogleTokenResponse {
  id_token: string;
  access_token?: string;
  expires_in?: number;
  token_type?: string;
}
