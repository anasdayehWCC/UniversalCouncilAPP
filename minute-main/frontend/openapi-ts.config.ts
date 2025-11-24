import { defineConfig } from '@hey-api/openapi-ts'

const inputPath = process.env.OPENAPI_TS_INPUT ?? 'http://localhost:8080/api/openapi.json'

export default defineConfig({
  input: {
    path: inputPath,
    filters: { tags: { exclude: ['Healthcheck'] } },
  },
  output: { path: 'lib/client', format: 'prettier' },
  plugins: ['@hey-api/client-next', '@tanstack/react-query'],
})
