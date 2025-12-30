import { Injectable, Singleton } from "wynkjs";
import { DatabaseService } from "../../database";
import { roleTable } from "../../database/schema";
import { eq } from "drizzle-orm";

/**
 * Role Seeder
 * Initialize default roles in the database
 */
@Injectable()
@Singleton()
export class RoleSeeder {
  constructor(private databaseService: DatabaseService) {}

  async seedRoles() {
    try {
      const db = this.databaseService.getDb();

      // Check if roles already exist
      const existingRoles = await db.select().from(roleTable);

      if (existingRoles.length > 0) {
        console.log("✅ Roles already seeded");
        return;
      }

      // Define default roles
      const defaultRoles = [
        {
          name: "admin",
          description: "Administrator with full access",
        },
        {
          name: "moderator",
          description: "Moderator with content management access",
        },
        {
          name: "user",
          description: "Regular user with standard access",
        },
        {
          name: "guest",
          description: "Guest user with limited access",
        },
      ];

      // Insert roles
      await db.insert(roleTable).values(defaultRoles);

      console.log("✅ Roles seeded successfully");
    } catch (error) {
      console.error("❌ Failed to seed roles:", error);
    }
  }
}
