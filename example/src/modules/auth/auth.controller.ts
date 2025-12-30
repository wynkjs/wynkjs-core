import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  Injectable,
  BadRequestException,
  type WynkRequest,
  type WynkResponse,
} from "wynkjs";
import { AuthService } from "./auth.service";
import { AuthGuard } from "./auth.guard";
import { LoginDTO, RegisterDTO } from "./auth.dto";
import type { LoginResponse, AuthUser } from "./auth.types";

type AuthenticatedRequest = WynkRequest & { user?: AuthUser };

/**
 * Authentication Controller
 * Handles login, registration, and authentication endpoints
 */

@Injectable()
@Controller("/auth")
export class AuthController {
  private readonly jwtSecret =
    process.env.JWT_SECRET || "your-secret-key-change-in-prod";
  private readonly tokenExpiresIn = 3600; // 1 hour

  constructor(private authService: AuthService) {}

  /**
   * Register a new user
   * POST /auth/register
   * Now sets JWT token in both response body AND httpOnly cookie
   */
  @Post("/register")
  async register(
    @Body() body: InstanceType<typeof RegisterDTO>,
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

      // Create JWT token for the new user
      const userWithRoles = await this.authService.getUserWithRoles(user.id);
      if (!userWithRoles) {
        throw new Error("Failed to get user roles");
      }

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

      // Set token in httpOnly cookie for enhanced security
      response.cookie("accessToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: this.tokenExpiresIn,
        sameSite: "strict",
        path: "/",
      });

      const responseData: LoginResponse = {
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

      return responseData;
    } catch (error) {
      throw new BadRequestException((error as any).message);
    }
  }

  /**
   * Login user
   * POST /auth/login
   * Now sets JWT token in both response body AND httpOnly cookie
   */
  @Post("/login")
  async login(
    @Body() body: InstanceType<typeof LoginDTO>,
    @Req() request: WynkRequest
  ): Promise<LoginResponse> {
    const response = request.getResponse() as WynkResponse;

    // Validate user credentials
    const authUser = await this.authService.validateUser(
      body.email,
      body.password
    );

    if (!authUser) {
      throw new BadRequestException("Invalid email or password");
    }

    // Create JWT token
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

    // Set token in httpOnly cookie for enhanced security
    response.cookie("accessToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: this.tokenExpiresIn,
      sameSite: "strict",
      path: "/",
    });

    const loginResponse: LoginResponse = {
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

    return loginResponse;
  }

  /**
   * Get current user profile
   * GET /auth/me
   * Requires: Bearer token in Authorization header
   */
  @Get("/me")
  @UseGuards(AuthGuard)
  async getCurrentUser(
    @Req() request: AuthenticatedRequest
  ): Promise<{ user: AuthUser }> {
    const userPayload = request.user;

    if (!userPayload) {
      throw new BadRequestException("Invalid or missing token");
    }

    // Refresh user data from database
    const currentUser = await this.authService.getUserWithRoles(userPayload.id);

    if (!currentUser) {
      throw new BadRequestException("User not found");
    }

    return { user: currentUser };
  }

  /**
   * Quick runtime test to show request.user is populated by the guard
   */
  @Get("/whoami")
  @UseGuards(AuthGuard)
  async whoAmI(
    @Req() request: AuthenticatedRequest
  ): Promise<{ user?: AuthUser }> {
    return { user: request.user };
  }

  /**
   * Verify token validity
   * POST /auth/verify
   */
  @Post("/verify")
  async verifyToken(
    @Body() body: { token?: string },
    @Req() request: AuthenticatedRequest
  ): Promise<{ valid: boolean; user?: AuthUser }> {
    // Prefer explicit token in body, then Authorization header, then cookie
    const token =
      body.token ||
      (typeof request.getBearerToken === "function" &&
        request.getBearerToken()) ||
      (typeof request.getCookie === "function" &&
        request.getCookie("accessToken"));

    if (!token) {
      return { valid: false };
    }

    const user = AuthGuard.verifyToken(`Bearer ${token}`);

    if (!user) {
      return { valid: false };
    }

    return {
      valid: true,
      user: user,
    };
  }
}
