# WynkJS Plugins

WynkJS provides a plugin system that allows you to extend your application with reusable middleware.

## Available Plugins

### Compression Plugin

Automatically compresses HTTP responses using Brotli, Gzip, or Deflate compression.

#### Installation

The compression plugin is built into WynkJS - no additional dependencies required!

```typescript
import { WynkFactory, compression } from "wynkjs";
```

#### Usage

```typescript
import { WynkFactory, compression } from "wynkjs";
import { UserController } from "./controllers/user.controller";

const app = WynkFactory.create({
  controllers: [UserController],
});

// Add compression middleware
app.use(
  compression({
    threshold: 1024, // Compress responses larger than 1KB
    encodings: ["br", "gzip", "deflate"], // Prefer brotli, then gzip, then deflate
  })
);

await app.listen(3000);
```

#### Options

```typescript
interface CompressionOptions {
  /**
   * Minimum byte size for compression
   * @default 1024
   */
  threshold?: number;

  /**
   * Preferred encoding order (first match will be used)
   * @default ["br", "gzip", "deflate"]
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
```

#### How It Works

1. **Client Support Detection**: Checks the client's `Accept-Encoding` header
2. **Encoding Selection**: Selects the best compression algorithm based on client support and your preference order
3. **Size Threshold**: Only compresses responses larger than the threshold (default: 1024 bytes)
4. **Smart Compression**: Skips compression if the compressed size is larger than the original
5. **Header Management**: Automatically sets `Content-Encoding` and `Vary` headers

#### Performance

Real-world compression ratios (from benchmark tests):

| Original Size | Brotli (br)    | Gzip           | Deflate       |
| ------------- | -------------- | -------------- | ------------- |
| 58 KB (JSON)  | 2.9 KB (95% ↓) | 7.7 KB (87% ↓) | ~8 KB (86% ↓) |

**Recommendation**: Use `["br", "gzip", "deflate"]` for best compression (default). Brotli provides the best compression but requires more CPU.

#### Examples

##### Basic Usage

```typescript
// Default options (threshold: 1024, all encodings)
app.use(compression());
```

##### Gzip Only

```typescript
// Only use gzip compression
app.use(
  compression({
    encodings: ["gzip"],
  })
);
```

##### High Compression Level

```typescript
// Maximum gzip compression
app.use(
  compression({
    encodings: ["gzip"],
    zlibOptions: {
      level: 9, // Maximum compression (slower)
    },
  })
);
```

##### Lower Threshold

```typescript
// Compress smaller responses
app.use(
  compression({
    threshold: 512, // Compress responses > 512 bytes
  })
);
```

#### Best Practices

1. **Threshold**: Keep the default 1KB threshold - smaller responses don't benefit much from compression
2. **Encoding Order**: Use `["br", "gzip", "deflate"]` (default) for best results
3. **Already Compressed**: The plugin automatically skips images, videos, and already-compressed content
4. **Error Handling**: On compression errors, the plugin falls back to the original uncompressed response

## Creating Custom Plugins

You can create your own plugins following this pattern:

```typescript
import { Elysia } from "elysia";

export function myPlugin(options = {}) {
  return (app: Elysia) => {
    return app
      .onBeforeHandle(async (context) => {
        // Before request handling
      })
      .onAfterHandle(async (context) => {
        // After request handling
        const { response, set } = context;
        // Modify response here
        return response; // Or return modified response
      });
  };
}
```

Then use it in your app:

```typescript
app.use(myPlugin({ option: "value" }));
```

## Plugin Ideas

Future plugins we're considering:

- **Rate Limiting**: Limit requests per IP/user
- **Caching**: Response caching with Redis/memory
- **CORS**: Advanced CORS configuration
- **Helmet**: Security headers
- **Logger**: Request/response logging
- **JWT**: JWT authentication middleware
- **Validation**: Request body validation

Want to contribute a plugin? See our [Contributing Guide](../../CONTRIBUTING.md)!
