/**
 * MSW Server Setup
 * 
 * Creates the MSW server for Node.js environment (Vitest).
 */

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Create server with default handlers
export const server = setupServer(...handlers);

// Export for use in tests
export { handlers };
