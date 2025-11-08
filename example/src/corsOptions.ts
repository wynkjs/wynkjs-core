import { CorsOptions } from "wynkjs";

const allowedOriginsForProd = [
  "https://yourdomain.com",
  "https://www.yourdomain.com",
  "https://app.yourdomain.com",
];
export const corsOptions: CorsOptions = {
  origin: (origin: string) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) {
      console.log("ℹ️  Request with no origin - allowing");
      return false;
    }

    // Check if origin is in allowed list
    const isAllowed = allowedOriginsForProd.includes(origin);

    if (isAllowed) {
      console.log(`✅ CORS: ${origin} - ALLOWED`);
    } else {
      console.log(`❌ CORS: ${origin} - BLOCKED`);
    }

    return isAllowed;
  },
  credentials: true, // Allow cookies
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "x-access-token"],
  exposedHeaders: ["Set-Cookie", "Date"],
  maxAge: 86400, // Cache preflight for 24 hours
};
