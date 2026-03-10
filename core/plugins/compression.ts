import { Elysia } from "elysia";
import zlib from "node:zlib";
import { promisify } from "node:util";

// Pre-create promisified compression functions at module load time (not per-request)
const gzipAsync = promisify(zlib.gzip);
const brotliCompressAsync = promisify(zlib.brotliCompress);
const deflateAsync = promisify(zlib.deflate);

/**
 * Compression Plugin Options
 */
export interface CompressionOptions {
  /**
   * Minimum byte size for compression
   * @default 1024
   */
  threshold?: number;

  /**
   * Preferred encoding order (first match will be used)
   * @default ["gzip", "br", "deflate"]
   */
  encodings?: ("br" | "gzip" | "deflate")[];

  /**
   * Brotli compression options
   */
  brotliOptions?: {
    params?: Record<number, number>;
  };

  /**
   * Zlib (gzip/deflate) compression options
   */
  zlibOptions?: {
    level?: number;
    memLevel?: number;
    strategy?: number;
  };
}

/**
 * Compression Plugin for WynkJS
 *
 * @example
 * ```typescript
 * import { WynkFactory } from "wynkjs";
 * import { compression } from "wynkjs/plugins/compression";
 *
 * const app = WynkFactory.create({
 *   controllers: [UserController],
 * });
 *
 * // Add compression middleware
 * app.use(compression({
 *   threshold: 1024,
 *   encodings: ["br", "gzip", "deflate"]
 * }));
 *
 * await app.listen(3000);
 * ```
 */
/**
 * Compression Plugin for WynkJS
 *
 * Simple compression middleware using Elysia's onAfterHandle hook
 * Supports Brotli, Gzip, and Deflate compression
 *
 * @example
 * ```typescript
 * import { WynkFactory, compression } from "wynkjs";
 *
 * const app = WynkFactory.create({
 *   controllers: [UserController],
 * });
 *
 * // Add compression middleware
 * app.use(compression({
 *   threshold: 1024,
 *   encodings: ["gzip", "br"]
 * }));
 *
 * await app.listen(3000);
 * ```
 */
export function compression(
  options: CompressionOptions = {}
): (app: any) => any {
  const config: Required<CompressionOptions> = {
    threshold: options.threshold ?? 1024,
    encodings: options.encodings ?? ["gzip", "br", "deflate"],
    brotliOptions: options.brotliOptions ?? {},
    zlibOptions: options.zlibOptions ?? {},
  };

  return (app: Elysia) => {
    return app.onAfterHandle(async function compressionHandler(context) {
      const { response, request, set } = context;

      // Skip if no response
      if (!response) return;

      // Skip if already compressed
      if (set.headers?.["content-encoding"]) return;

      // Get client's accepted encodings
      const acceptEncoding = (
        request.headers.get("accept-encoding") || ""
      ).toLowerCase();

      // Find best compression match
      let encoding: "br" | "gzip" | "deflate" | null = null;
      for (const enc of config.encodings) {
        if (acceptEncoding.includes(enc)) {
          encoding = enc;
          break;
        }
      }

      if (!encoding) return; // No supported encoding

      // Convert response to buffer
      let body: Buffer;
      if (Buffer.isBuffer(response)) {
        body = response;
      } else if (typeof response === "string") {
        body = Buffer.from(response);
      } else if (typeof response === "object") {
        body = Buffer.from(JSON.stringify(response));
        set.headers["content-type"] =
          set.headers["content-type"] || "application/json";
      } else {
        body = Buffer.from(String(response));
      }

      // Check size threshold
      if (body.length < config.threshold) return;

      // Compress
      try {
        let compressed: Buffer;
        switch (encoding) {
          case "br":
            compressed = await brotliCompressAsync(body, config.brotliOptions);
            break;
          case "gzip":
            compressed = await gzipAsync(body, config.zlibOptions);
            break;
          case "deflate":
            compressed = await deflateAsync(body, config.zlibOptions);
            break;
          default:
            return;
        }

        // Only use if smaller
        if (compressed.length >= body.length) return;

        // Set headers and return compressed body
        set.headers["content-encoding"] = encoding;
        set.headers["vary"] = "Accept-Encoding";
        delete set.headers["content-length"]; // Let Elysia set this

        return compressed;
      } catch (error) {
        console.error("[Compression Error]:", error);
        return; // Return original on error
      }
    });
  };
}
