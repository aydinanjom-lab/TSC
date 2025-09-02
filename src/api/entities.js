import { base44 } from './base44Client';

// Explicitly expose individual entities used throughout the app
const { GhostFollower, UserProfile, ScanResult } = base44.entities;

// Authentication SDK
const { auth: User } = base44;

export { GhostFollower, UserProfile, ScanResult, User };

