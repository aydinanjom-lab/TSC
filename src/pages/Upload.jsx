
import React, { useState, useCallback } from "react";
import { User } from "@/api/entities";
import { UserProfile } from "@/api/entities";
import { ScanResult } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Upload as UploadIcon,
  FileUp,
  CheckCircle,
  AlertTriangle,
  Clock,
  Crown
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import UpgradeModal from "../components/UpgradeModal";

const PLAN_LIMITS = {
  free: { scans: 0, followers: 1000 },
  starter: { scans: 1, followers: 10000 },
  pro: { scans: 4, followers: 50000 }
};

// Helper function to call the processing endpoint
async function startProcessUpload(scanId) {
  const r = await fetch("/api/process-upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scanId })
  });
  const j = await r.json();
  if (!j.ok) throw new Error(j.error || "process-upload-failed");
  return j;
}

export default function UploadPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeType, setUpgradeType] = useState(null);
  const [profile, setProfile] = useState(null);

  const checkPlanLimits = useCallback(async (file) => {
    try {
      const currentUser = await User.me();
      const profiles = await UserProfile.filter({ created_by: currentUser.email });

      if (!profiles || profiles.length === 0) {
        throw new Error("Please complete your profile setup first.");
      }

      const userProfile = profiles[0];
      setProfile(userProfile);

      const currentPlan = userProfile.subscription_plan || 'free';
      const limits = PLAN_LIMITS[currentPlan];

      // Check scan limit
      if (limits.scans > 0 && (userProfile.scans_this_month || 0) >= limits.scans) {
        setUpgradeType('scans');
        setShowUpgradeModal(true);
        return false;
      }

      // For follower count, we'd need to parse the file first
      // For now, we'll do a rough estimate based on file size
      const estimatedFollowers = Math.floor(file.size / 100); // Rough estimate
      if (estimatedFollowers > limits.followers) {
        setUpgradeType('followers');
        setShowUpgradeModal(true);
        return false;
      }

      return userProfile;
    } catch (error) {
      setError(error.message);
      return false;
    }
  }, []);

  const handleFile = useCallback(async (file) => {
    setError(null);
    setUploadResult(null);

    // Validate file
    if (!file.name.endsWith('.zip')) {
      setError("Please upload a .zip file containing your Instagram follower data.");
      return;
    }

    if (file.size > 250 * 1024 * 1024) { // 250MB
      setError("File size must be under 250MB.");
      return;
    }

    // Check plan limits
    const userProfile = await checkPlanLimits(file);
    if (!userProfile) {
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 80));
      }, 200);

      // Upload file
      const { file_url } = await UploadFile({ file });

      clearInterval(progressInterval);
      setUploadProgress(90);

      const newScan = await ScanResult.create({
        user_profile_id: userProfile.id,
        status: "queued",
        upload_path: file_url,
        started_at: new Date().toISOString(),
        total_followers: 0,
        ghost_count: 0
      });

      setUploadProgress(95);

      // Start processing using the HTTP endpoint
      try {
        await startProcessUpload(newScan.id);
        console.log('Processing started successfully');
      } catch (apiError) {
        console.error("Failed to start processing:", apiError);
        // Show error but don't crash - user can still see scan details
        setError(`Failed to start processing: ${apiError.message}. You can still view scan details and retry if needed.`);
      }

      setUploadProgress(100);

      // Increment scan count
      await UserProfile.update(userProfile.id, {
        scans_this_month: (userProfile.scans_this_month || 0) + 1
      });

      // Set the result with the created scan - ALWAYS navigate to scan page
      setUploadResult(newScan);

    } catch (error) {
      console.error("Upload error:", error);
      setError(error.message || "Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [checkPlanLimits]);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      <style jsx>{`
        .chrome-button {
          background: linear-gradient(135deg, #f5f7fa 0%, #d9dde1 20%, #b4bcc4 50%, #d9dde1 80%, #f5f7fa 100%);
          color: #1f2937;
          font-weight: 600;
          text-shadow: 0 1px 2px rgba(255,255,255,0.8);
          border: none;
        }
        .chrome-button:hover {
          background: linear-gradient(135deg, #e5e7eb 0%, #c5c9ce 20%, #9ca3ab 50%, #c5c9ce 80%, #e5e7eb 100%);
          color: #1f2937;
        }
      `}</style>

      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Upload Follower Data</h1>
        <p className="text-zinc-400">Upload your Instagram follower export (.zip file) to analyze for ghost followers</p>
      </div>

      {error && (
        <Alert className="border-red-500 bg-red-950/50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-red-200">{error}</AlertDescription>
        </Alert>
      )}

      {uploadResult ? (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Upload Successful!</h3>
            <p className="text-zinc-400 mb-6">
              Your follower data has been uploaded and is now being processed.
            </p>
            <div className="flex gap-4 justify-center">
              {/* Ensure button links to the correct URL with the ID from the state */}
              <Link to={createPageUrl(`Scan/${uploadResult.id}`)}>
                <Button className="chrome-button">
                  <Clock className="w-4 h-4 mr-2" />
                  View Scan Details
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => setUploadResult(null)}
                className="border-zinc-600"
              >
                Upload Another File
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileUp className="w-5 h-5" />
              Upload Your Instagram Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                dragActive
                  ? 'border-zinc-400 bg-zinc-800/50'
                  : 'border-zinc-600 hover:border-zinc-500'
              } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {isUploading ? (
                <div className="space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-400 mx-auto"></div>
                  <div className="space-y-2">
                    <p className="text-white font-medium">Uploading and processing your file...</p>
                    <Progress value={uploadProgress} className="w-full max-w-xs mx-auto" />
                    <p className="text-sm text-zinc-400">{uploadProgress}% complete</p>
                  </div>
                </div>
              ) : (
                <>
                  <UploadIcon className="w-16 h-16 text-zinc-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Drop your Instagram export here
                  </h3>
                  <p className="text-zinc-400 mb-6">
                    Or click to browse and select your .zip file
                  </p>
                  <input
                    type="file"
                    accept=".zip"
                    onChange={handleFileInput}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Button className="chrome-button pointer-events-none">
                    Select File
                  </Button>
                </>
              )}
            </div>

            <div className="mt-6 space-y-3 text-sm text-zinc-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Supports .zip files up to 250MB</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Processing typically takes 2-5 minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Your data is processed securely and deleted after analysis</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plan Limits Warning */}
      {profile && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Crown className="w-5 h-5" />
              Your Plan Limits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
                <div>
                  <div className="text-sm text-zinc-400">Scans this month</div>
                  <div className="text-lg font-semibold text-white">
                    {profile.scans_this_month || 0} / {PLAN_LIMITS[profile.subscription_plan]?.scans || 0}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
                <div>
                  <div className="text-sm text-zinc-400">Max followers</div>
                  <div className="text-lg font-semibold text-white">
                    {PLAN_LIMITS[profile.subscription_plan]?.followers.toLocaleString() || 'Unlimited'}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* How to Export */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">How to Export Instagram Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-zinc-300">
          <div className="space-y-2">
            <h4 className="font-semibold text-white">Step 1: Request Your Data</h4>
            <p>Go to Instagram Settings → Privacy and Security → Download Your Information</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-white">Step 2: Select Data Type</h4>
            <p>Choose "Followers and Following" and select JSON format</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-white">Step 3: Wait for Email</h4>
            <p>Instagram will email you a download link (usually within 48 hours)</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-white">Step 4: Upload Here</h4>
            <p>Download the .zip file from Instagram and upload it using the form above</p>
          </div>
        </CardContent>
      </Card>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        limitType={upgradeType}
        currentPlan={profile?.subscription_plan}
      />
    </div>
  );
}
