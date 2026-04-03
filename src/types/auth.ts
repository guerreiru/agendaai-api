export interface LoginBody {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  expiresIn: number;
}

export interface RefreshTokenBody {
  refreshToken?: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  userEmail?: string;
  userRole?: string;
  tokenId?: string;
}

export interface AuthenticatedRequest {
  userId: string;
  userEmail: string;
  userRole: string;
}
