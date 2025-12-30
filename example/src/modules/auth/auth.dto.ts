import { DTO, Type, Pattern, MinLength } from "wynkjs";

/**
 * Data Transfer Objects for Authentication
 */

export class LoginDTO {
  @Type(() => String)
  @Pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format")
  email: string;

  @Type(() => String)
  @MinLength(6, "Password must be at least 6 characters")
  password: string;
}

export class RegisterDTO {
  @Type(() => String)
  @Pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format")
  email: string;

  @Type(() => String)
  @MinLength(6, "Password must be at least 6 characters")
  password: string;

  @Type(() => String)
  firstName?: string;

  @Type(() => String)
  lastName?: string;

  @Type(() => String)
  username?: string;
}

export type LoginDTOType = typeof LoginDTO;
export type RegisterDTOType = typeof RegisterDTO;
