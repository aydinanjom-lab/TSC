import { processUpload } from "../src/api/functions.js";
import { User, UserProfile } from "../src/api/entities.js";

const PLAN_LIMITS = {
  free: { scans: 0, followers: 1000 },
  starter: { scans: 1, followers: 10000 },
  pro: { scans: 4, followers: 50000 },
};

export default async function handler(req, res) {
  if (req.method && req.method !== "POST") {
    return res.status(200).json({ ok: false, error: "method-not-allowed" });
  }

  try {
    const body = req.body ?? {};
    const scanId = body.scanId;
    if (!scanId) {
      return res.status(200).json({ ok: false, error: "missing-scanId" });
    }

    // Fetch user profile and enforce plan limits
    const currentUser = await User.me();
    const profiles = await UserProfile.filter({ created_by: currentUser.email });
    if (!profiles || profiles.length === 0) {
      return res.status(200).json({ ok: false, error: "profile-not-found" });
    }

    const profile = profiles[0];
    const plan = profile.subscription_plan || "free";
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

    if (limits.scans > 0 && (profile.scans_this_month || 0) >= limits.scans) {
      return res.status(200).json({ ok: false, error: "scan-limit-exceeded" });
    }

    await processUpload({ scanId });
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(200).json({ ok: false, error: err.message });
  }
}
