import { createClient } from '@base44/sdk';

const serverUrl = import.meta.env.VITE_BASE44_SERVER_URL || 'https://base44.app';
const appId = import.meta.env.VITE_BASE44_APP_ID || '';

export const base44 = createClient({
  serverUrl,
  appId,
});
