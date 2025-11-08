import { CorsOptions } from "wynkjs";

/**
 * CORS Configuration Examples for WynkJS
 * Demonstrates various CORS configurations supported by the framework
 */

// ============================================================================
// Example 1: Simple CORS - Allow All Origins (Development)
// ============================================================================
export const corsSimple: boolean = true;

// ============================================================================
// Example 2: Allow Specific Origins (Production)
// ============================================================================
export const corsSpecificOrigins: CorsOptions = {
  origin: ["https://yourdomain.com", "https://www.yourdomain.com"],
  credentials: true,
};

// ============================================================================
// Example 3: RegExp Pattern Matching
// ============================================================================
export const corsRegExpPattern: CorsOptions = {
  origin: /^https:\/\/(.+\.)?yourdomain\.com$/,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
};

// ============================================================================
// Example 4: Function-based Dynamic Origin Validation
// ============================================================================
export const corsDynamicValidation: CorsOptions = {
  origin: (origin: string) => {
    // Allow requests with no origin (mobile apps, Postman)
    if (!origin) {
      return true;
    }

    // Allow all subdomains of yourdomain.com
    if (origin.match(/^https:\/\/(.+\.)?yourdomain\.com$/)) {
      console.log(`✅ CORS: ${origin} - ALLOWED (subdomain match)`);
      return true;
    }

    // Allow localhost in development
    if (
      process.env.NODE_ENV === "development" &&
      origin.match(/^http:\/\/localhost:\d+$/)
    ) {
      console.log(`✅ CORS: ${origin} - ALLOWED (localhost dev)`);
      return true;
    }

    console.log(`❌ CORS: ${origin} - BLOCKED`);
    return false;
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["X-Total-Count", "X-Page-Number"],
  maxAge: 86400, // 24 hours
};

// ============================================================================
// Example 5: Environment-based Configuration
// ============================================================================
export const corsEnvironmentBased: CorsOptions = {
  origin: (origin: string) => {
    if (process.env.NODE_ENV === "production") {
      // Production: strict whitelist
      const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];
      return allowedOrigins.includes(origin);
    } else {
      // Development: allow all
      return true;
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// ============================================================================
// Example 6: Whitelist with Logging
// ============================================================================
export const corsWithLogging: CorsOptions = {
  origin: (origin: string) => {
    const whitelist = [
      "https://yourdomain.com",
      "https://www.yourdomain.com",
      "https://app.yourdomain.com",
      "https://admin.yourdomain.com",
    ];

    if (!origin) {
      console.log("ℹ️  CORS: No origin header - allowing");
      return true;
    }

    const isAllowed = whitelist.includes(origin);

    if (isAllowed) {
      console.log(`✅ CORS: ${origin} - ALLOWED`);
    } else {
      console.warn(`❌ CORS: ${origin} - BLOCKED (not in whitelist)`);
    }

    return isAllowed;
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
  exposedHeaders: ["X-Request-ID", "X-Rate-Limit"],
  maxAge: 3600, // 1 hour
};

// ============================================================================
// Example 7: API Gateway / Multi-tenant Configuration
// ============================================================================
export const corsMultiTenant: CorsOptions = {
  origin: (origin: string) => {
    if (!origin) return true;

    // Extract tenant from origin
    const tenantMatch = origin.match(/^https:\/\/([^.]+)\.yourdomain\.com$/);

    if (tenantMatch) {
      const tenant = tenantMatch[1];
      console.log(`✅ CORS: Tenant "${tenant}" from ${origin} - ALLOWED`);
      return true;
    }

    // Main domain
    if (origin === "https://yourdomain.com") {
      console.log(`✅ CORS: Main domain ${origin} - ALLOWED`);
      return true;
    }

    console.warn(`❌ CORS: ${origin} - BLOCKED (invalid tenant domain)`);
    return false;
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Tenant-ID"],
  exposedHeaders: ["X-Tenant-ID", "X-Request-ID"],
  maxAge: 7200, // 2 hours
};

// ============================================================================
// Example 8: Advanced Security Configuration
// ============================================================================
export const corsSecure: CorsOptions = {
  origin: (origin: string) => {
    // Only allow HTTPS origins in production
    if (process.env.NODE_ENV === "production" && origin) {
      if (!origin.startsWith("https://")) {
        console.warn(`❌ CORS: ${origin} - BLOCKED (not HTTPS)`);
        return false;
      }
    }

    const allowedDomains = [
      "yourdomain.com",
      "www.yourdomain.com",
      "app.yourdomain.com",
    ];

    if (!origin) return false; // Require origin in production

    const domain = origin.replace(/^https?:\/\//, "");
    const isAllowed = allowedDomains.includes(domain);

    if (isAllowed) {
      console.log(`✅ CORS: ${origin} - ALLOWED`);
    } else {
      console.warn(`❌ CORS: ${origin} - BLOCKED`);
    }

    return isAllowed;
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"], // No OPTIONS in methods
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-CSRF-Token",
    "X-Requested-With",
  ],
  exposedHeaders: ["X-Request-ID", "X-Total-Count"],
  maxAge: 600, // 10 minutes (shorter for security)
};

// ============================================================================
// Example 9: Development-friendly Configuration
// ============================================================================
export const corsDevelopment: CorsOptions = {
  origin: (origin: string) => {
    // Allow all in development
    if (process.env.NODE_ENV === "development") {
      console.log(`✅ CORS: ${origin || "no-origin"} - ALLOWED (dev mode)`);
      return true;
    }

    // Production whitelist
    const allowedOrigins = [
      "https://yourdomain.com",
      "https://www.yourdomain.com",
    ];

    return allowedOrigins.includes(origin);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: "*", // Allow all headers in development
};

// ============================================================================
// Example 10: Public API Configuration (No Credentials)
// ============================================================================
export const corsPublicAPI: CorsOptions = {
  origin: () => true, // Allow all origins
  credentials: false, // No credentials for public API
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
  maxAge: 86400, // 24 hours
};
