import { Controller, Get, Post, Body, Headers, Use, Req, type WynkRequest } from "wynkjs";
import { jwtGuard, rolesGuard } from "../auth/auth.guard";
import type { AuthUser } from "../auth/auth.types";

/**
 * Protected Routes Controller
 * Demonstrates RBAC using middleware guards as per WynkJS README
 * 
 * Pattern:
 * @Controller("/path")
 * @Use(jwtGuard, rolesGuard(["admin"]))
 * export class MyController { ... }
 */

@Controller("/protected")
@Use(jwtGuard)
export class ProtectedRoutesController {
  /**
   * GET /protected/dashboard
   * Accessible to all authenticated users
   * 
   * Uses: @Use(jwtGuard) from class level
   */
  @Get("/dashboard")
  async getDashboard(@Req() request: WynkRequest) {
    const user = request.user as AuthUser | undefined;

    return {
      message: "Welcome to dashboard",
      user: user ? {
        id: user.id,
        email: user.email,
        roles: user.roles,
      } : null,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /protected/admin
   * Only accessible to admin users
   * 
   * Uses: @Use(rolesGuard(["admin"])) + class level jwtGuard
   */
  @Get("/admin")
  @Use(rolesGuard(["admin"]))
  async adminPanel(@Req() request: WynkRequest) {
    const user = request.user as AuthUser | undefined;

    return {
      message: "Admin Panel",
      user: user ? {
        id: user.id,
        email: user.email,
        roles: user.roles,
      } : null,
      features: [
        "User Management",
        "Role Management",
        "System Configuration",
        "Analytics",
      ],
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /protected/moderator
   * Accessible to moderators and admins
   * 
   * Uses: @Use(rolesGuard(["moderator", "admin"])) + class level jwtGuard
   */
  @Get("/moderator")
  @Use(rolesGuard(["moderator", "admin"]))
  async moderatorPanel(@Req() request: WynkRequest) {
    const user = request.user as AuthUser | undefined;

    return {
      message: "Moderator Panel",
      user: user ? {
        id: user.id,
        email: user.email,
        roles: user.roles,
      } : null,
      features: [
        "Content Moderation",
        "User Reports",
        "Comment Management",
        "Ban Management",
      ],
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /protected/user-only
   * Accessible to regular users and admins
   * 
   * Uses: @Use(rolesGuard(["user", "admin"])) + class level jwtGuard
   */
  @Get("/user-only")
  @Use(rolesGuard(["user", "admin"]))
  async userOnly(@Req() request: WynkRequest) {
    const user = request.user as AuthUser | undefined;

    return {
      message: "User area accessed",
      user: user ? {
        id: user.id,
        email: user.email,
        roles: user.roles,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
      } : null,
      features: [
        "Profile management",
        "Settings",
        "My content",
        "Preferences",
      ],
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * POST /protected/system-config
   * Admin only - update system configuration
   * 
   * Uses: @Use(rolesGuard(["admin"])) + class level jwtGuard
   */
  @Post("/system-config")
  @Use(rolesGuard(["admin"]))
  async updateSystemConfig(
    @Req() request: WynkRequest,
    @Body() body: any
  ) {
    const user = request.user as AuthUser | undefined;

    return {
      message: "System configuration updated",
      updatedBy: user?.email,
      config: body || {},
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /protected/content
   * Accessible to all authenticated users
   * 
   * Uses: @Use(jwtGuard) from class level
   */
  @Get("/content")
  async getContent(@Req() request: WynkRequest) {
    const user = request.user as AuthUser | undefined;

    return {
      message: "Content retrieved",
      user: user ? {
        id: user.id,
        email: user.email,
        roles: user.roles,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
      } : null,
      content: {
        id: "content-123",
        title: "Example Content",
        body: "This content is accessible by authenticated users",
        accessLevel: "user",
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /protected/health
   * Public health check endpoint
   * This endpoint is NOT protected and should be accessed without guards
   * Note: Remove from this controller and create public version if needed
   */
  @Get("/health")
  async health(@Req() request: WynkRequest) {
    const user = request.user as AuthUser | undefined;

    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      authenticated: !!user,
      message: "System is operational",
    };
  }
}
