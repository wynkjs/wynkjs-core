import { HttpException } from "wynkjs";

/**
 * Custom exception for email-related errors
 */
export class EmailException extends HttpException {
  constructor(message: string, public readonly emailAddress?: string) {
    super(message, 500, "Email Service Error");
  }
}

/**
 * Specific email exceptions
 */
export class EmailSendFailedException extends EmailException {
  constructor(emailAddress: string, reason?: string) {
    super(reason || "Failed to send email", emailAddress);
  }
}

export class InvalidEmailException extends HttpException {
  constructor(emailAddress: string) {
    super(`Invalid email address: ${emailAddress}`, 400, "Invalid Email");
  }
}

export class EmailQuotaExceededException extends HttpException {
  constructor() {
    super(
      "Email quota exceeded. Please try again later.",
      429,
      "Quota Exceeded"
    );
  }
}
