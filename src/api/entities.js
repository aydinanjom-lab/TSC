// Simple in-browser storage-backed models used in place of vendor entities.

const PROFILE_KEY = 'profiles';
const SCAN_KEY = 'scans';

function read(key) {
  return JSON.parse(localStorage.getItem(key) || '[]');
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export const User = {
  async me() {
    return { email: 'demo@example.com' };
  },
  async logout() {
    return;
  },
  async list() {
    return [await this.me()];
  }
};

export const UserProfile = {
  async list() {
    return read(PROFILE_KEY);
  },
  async create(data) {
    const profiles = read(PROFILE_KEY);
    const profile = { id: Date.now().toString(), ...data };
    profiles.push(profile);
    write(PROFILE_KEY, profiles);
    return profile;
  },
  async filter({ created_by }) {
    const profiles = read(PROFILE_KEY);
    return profiles.filter(p => p.created_by === created_by);
  },
  async update(id, data) {
    const profiles = read(PROFILE_KEY);
    const idx = profiles.findIndex(p => p.id === id);
    if (idx !== -1) {
      profiles[idx] = { ...profiles[idx], ...data };
      write(PROFILE_KEY, profiles);
      return profiles[idx];
    }
    return null;
  }
};

export const ScanResult = {
  async create(data) {
    const scans = read(SCAN_KEY);
    const scan = { id: Date.now().toString(), ...data };
    scans.push(scan);
    write(SCAN_KEY, scans);
    return scan;
  },
  async filter({ id }) {
    const scans = read(SCAN_KEY);
    if (id) return scans.filter(s => s.id === id);
    return scans;
  },
  async update(id, data) {
    const scans = read(SCAN_KEY);
    const idx = scans.findIndex(s => s.id === id);
    if (idx !== -1) {
      scans[idx] = { ...scans[idx], ...data };
      write(SCAN_KEY, scans);
      return scans[idx];
    }
    return null;
  }
};

// Seed a default profile for demos
if (read(PROFILE_KEY).length === 0) {
  write(PROFILE_KEY, [{ id: 'demo-profile', created_by: 'demo@example.com', subscription_plan: 'starter', scans_this_month: 0 }]);
}
