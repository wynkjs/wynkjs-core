import { injectable } from "wynkjs";
import {
  EmailSendFailedException,
  InvalidEmailException,
  EmailQuotaExceededException,
} from "./email.exceptions";

/**
 * Email service that demonstrates exception handling
 */
@injectable()
export class EmailService {
  private sentCount = 0;
  private readonly DAILY_LIMIT = 100;

  async sendWelcomeEmail(email: string, userName: string): Promise<void> {
    // Validate email format
    if (email == "demo@demo1.com")
      throw new Error("Simulated email sending error");

    // Check quota
    if (this.sentCount >= this.DAILY_LIMIT) {
      throw new EmailQuotaExceededException();
    }

    try {
      // Simulate email sending
      await this.sendEmail(email, "Welcome!", `Hello ${userName}!`);
      this.sentCount++;
    } catch (error) {
      // Wrap external errors in custom exception
      throw new Error(error instanceof Error ? error.message : "Unknown error");
    }
  }

  async sendPasswordResetEmail(
    email: string,
    resetToken: string
  ): Promise<void> {
    if (email == "demo@demo1.com")
      throw new Error("Simulated email sending error");
    if (this.sentCount >= this.DAILY_LIMIT) {
      throw new EmailQuotaExceededException();
    }

    try {
      await this.sendEmail(
        email,
        "Password Reset",
        `Reset token: ${resetToken}`
      );
      this.sentCount++;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Unknown error");
    }
  }

  private async sendEmail(
    to: string,
    subject: string,
    body: string
  ): Promise<void> {
    // Simulate external email service call
    // In real app, this would call SendGrid, AWS SES, etc.

    // Simulate failures for specific test cases
    // Use deterministic patterns instead of random for reliable testing
    if (to.includes("batch-2")) {
      throw new Error("SMTP connection failed");
    }

    console.log(`📧 Sending email to ${to}: ${subject}`);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
