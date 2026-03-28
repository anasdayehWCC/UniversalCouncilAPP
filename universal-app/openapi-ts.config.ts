import { defineConfig } from '@hey-api/openapi-ts'

/**
 * OpenAPI TypeScript Client Generation Configuration
 * 
 * Generates a typed API client from the minute-main backend OpenAPI spec.
 * 
 * Usage:
 *   pnpm --filter universal-app openapi-ts
 *   OPENAPI_TS_INPUT=./minute-main/openapi-temp.json pnpm --filter universal-app openapi-ts
 * 
 * @see https://heyapi.dev/openapi-ts/
 */

const inputPath = process.env.OPENAPI_TS_INPUT ?? '../minute-main/openapi-temp.json'

export default defineConfig({
  input: inputPath,
  output: {
    path: 'src/lib/api/generated',
    format: 'prettier',
  },
  plugins: [
    // Generate the base HTTP client
    '@hey-api/client-next',
    // Generate TypeScript types from OpenAPI schemas
    '@hey-api/typescript',
    // Generate SDK functions for each endpoint
    '@hey-api/sdk',
    // Generate TanStack React Query hooks
    '@tanstack/react-query',
  ],
})
