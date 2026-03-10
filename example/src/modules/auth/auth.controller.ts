import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  Injectable,
  BadRequestException,
  DTO,
  CommonDTO,
  type WynkRequest,
  type WynkResponse,
} from "wynkjs";
import { AuthService } from "./auth.service";
import { AuthGuard } from "./auth.guard";
import type { LoginResponse, AuthUser } from "./auth.types";

const LoginBodyDTO = DTO.Strict({
  email: CommonDTO.Email(),
  password: DTO.String({ minLength: 4 }),
});

const RegisterBodyDTO = DTO.Strict({
  email: CommonDTO.Email(),
  password: DTO.String({ minLength: 4 }),
  firstName: DTO.Optional(DTO.String()),
  lastName: DTO.Optional(DTO.String()),
  username: DTO.Optional(DTO.String()),
});

type AuthenticatedRequest = WynkRequest & { user?: AuthUser };

@Injectable()
@Controller("/auth")
export class AuthController {
  private readonly jwtSecret = "wynkjs-demo-secret";
  private readonly tokenExpiresIn = 3600;

  constructor(private authService: AuthService) {}

  @Post({ path: "/register", body: RegisterBodyDTO })
  async register(
    @Body() body: { email: string; password: string; firstName?: string; lastName?: string; username?: string },
    @Req() request: WynkRequest
  ) {
    const response = request.getResponse() as WynkResponse;

    try {
      const user = await this.authService.registerUser(
        body.email,
        body.password,
        body.firstName,
        body.lastName,
        body.username
      );

      const userWithRoles = await this.authService.getUserWithRoles(user.id);
      if (!userWithRoles) throw new Error("Failed to retrieve user after registration");

      const token = this.authService.createToken(
        {
          id: userWithRoles.id,
          email: userWithRoles.email,
          roles: userWithRoles.roles,
          username: userWithRoles.username,
          firstName: userWithRoles.firstName,
          lastName: userWithRoles.lastName,
        },
        this.jwtSecret,
        this.tokenExpiresIn
      );

      response.cookie("accessToken", token, {
        httpOnly: true,
        secure: false,
        maxAge: this.tokenExpiresIn,
        sameSite: "strict",
        path: "/",
      });

      const result: LoginResponse = {
        message: "User registered successfully",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roles: userWithRoles.roles,
        },
        accessToken: token,
        expiresIn: this.tokenExpiresIn,
      };

      return result;
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }

  @Post({ path: "/login", body: LoginBodyDTO })
  async login(
    @Body() body: { email: string; password: string },
    @Req() request: WynkRequest
  ): Promise<LoginResponse> {
    const response = request.getResponse() as WynkResponse;

    const authUser = await this.authService.validateUser(body.email, body.password);
    if (!authUser) throw new BadRequestException("Invalid email or password");

    const token = this.authService.createToken(
      {
        id: authUser.id,
        email: authUser.email,
        roles: authUser.roles,
        username: authUser.username,
        firstName: authUser.firstName,
        lastName: authUser.lastName,
      },
      this.jwtSecret,
      this.tokenExpiresIn
    );

    response.cookie("accessToken", token, {
      httpOnly: true,
      secure: false,
      maxAge: this.tokenExpiresIn,
      sameSite: "strict",
      path: "/",
    });

    return {
      message: "Login successful",
      user: {
        id: authUser.id,
        email: authUser.email,
        firstName: authUser.firstName,
        lastName: authUser.lastName,
        roles: authUser.roles,
      },
      accessToken: token,
      expiresIn: this.tokenExpiresIn,
    };
  }

  @Get("/me")
  @UseGuards(AuthGuard)
  async getCurrentUser(@Req() request: AuthenticatedRequest): Promise<{ user: AuthUser }> {
    const userPayload = request.user;
    if (!userPayload) throw new BadRequestException("Invalid or missing token");

    const currentUser = await this.authService.getUserWithRoles(userPayload.id);
    if (!currentUser) throw new BadRequestException("User not found");

    return { user: currentUser };
  }

  @Get("/whoami")
  @UseGuards(AuthGuard)
  async whoAmI(@Req() request: AuthenticatedRequest): Promise<{ user?: AuthUser }> {
    return { user: request.user };
  }

  @Post("/verify")
  async verifyToken(
    @Body() body: { token?: string },
    @Req() request: AuthenticatedRequest
  ): Promise<{ valid: boolean; user?: AuthUser }> {
    const token =
      body.token ||
      (typeof request.getBearerToken === "function" && request.getBearerToken()) ||
      (typeof request.getCookie === "function" && request.getCookie("accessToken"));

    if (!token) return { valid: false };

    const user = AuthGuard.verifyToken(`Bearer ${token}`);
    if (!user) return { valid: false };

    return { valid: true, user };
  }
}
