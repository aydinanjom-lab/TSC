import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "68b23800dfef2ae64f09951c", 
  requiresAuth: true // Ensure authentication is required for all operations
});
