export interface UserSession {
  id: string;
  name: string;
  email: string;
  token: string;
  accessToken?: string;
  refreshToken?: string;
  isAdmin: boolean;
}
