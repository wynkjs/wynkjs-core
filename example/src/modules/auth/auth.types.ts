/**
 * Authentication and Authorization Types
 */

export type UserRole = "admin" | "user" | "moderator" | "guest";

export interface JwtPayload {
  id: string;
  email: string;
  roles: UserRole[];
}

export interface AuthUser extends JwtPayload {
  username?: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  username?: string;
}

export interface LoginResponse {
  message: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    roles: UserRole[];
  };
  accessToken: string;
  expiresIn: number;
}

export interface AuthError {
  message: string;
  code: string;
}
