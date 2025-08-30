
import React, { useState, useEffect, useCallback } from "react";
import { User } from "@/api/entities";
import { UserProfile } from "@/api/entities";
import { ScanResult } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Users, 
  TrendingUp, 
  Zap, 
  Instagram, 
  AlertCircle,
  RefreshCw,
  BarChart3,
  Target,
  Clock,
  CheckCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [latestScan, setLatestScan] = useState(null);
  const [recentScans, setRecentScans] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      
      const profiles = await UserProfile.filter({ created_by: currentUser.email });
      let userProfile = profiles[0];
      
      if (!userProfile) {
        userProfile = await UserProfile.create({
          instagram_connected: false,
          subscription_plan: "free",
          subscription_status: "trial"
        });
      }
      setProfile(userProfile);
      
      // Get the most recent scan result
      const scans = await ScanResult.filter({ user_profile_id: userProfile.id }, "-created_date", 10);
      setRecentScans(scans || []);
      if (scans && scans.length > 0) {
        setLatestScan(scans[0]);
      }
      
    } catch (error) {
      console.error("Error loading dashboard:", error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Auto-refresh if there are running scans
  useEffect(() => {
    const hasRunningScans = recentScans.some(scan => 
      scan.status === 'queued' || scan.status === 'running'
    );
    
    if (hasRunningScans) {
      const interval = setInterval(loadDashboardData, 5000);
      return () => clearInterval(interval);
    }
  }, [recentScans, loadDashboardData]);

  const handleConnectInstagram = () => {
    alert("Instagram OAuth integration would be implemented here. For demo purposes, we'll simulate a connected account.");
    
    setTimeout(async () => {
      await UserProfile.update(profile.id, {
        instagram_connected: true,
        instagram_username: "demo_user",
        total_followers: 1250,
        ghost_followers: 320,
        engagement_rate: 3.2,
        last_scan_date: new Date().toISOString()
      });
      loadDashboardData();
    }, 1000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-400 mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const engagementColor = profile?.engagement_rate > 4 ? "text-emerald-400" : 
                         profile?.engagement_rate > 2 ? "text-yellow-400" : "text-red-400";

  return (
    <div className="p-6 md:p-8 space-y-8">
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

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {user?.full_name?.split(' ')[0] || 'User'}
          </h1>
          <p className="text-zinc-400">
            {profile?.instagram_connected ? 
              `Connected as @${profile.instagram_username}` : 
              "Connect your Instagram to get started"
            }
          </p>
        </div>
        
        <Link to={createPageUrl("Upload")}>
          <Button className="chrome-button text-gray-800">
            <Zap className="w-4 h-4 mr-2" />
            Start New Scan
          </Button>
        </Link>
      </div>

      {!profile?.instagram_connected && (
        <Alert className="border-blue-500 bg-blue-950/50">
          <Instagram className="h-4 w-4" />
          <AlertDescription className="text-blue-200">
            Upload your Instagram data export to start analyzing your followers and removing ghost accounts.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-zinc-400">Total Followers</CardTitle>
            <Users className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {latestScan?.total_followers?.toLocaleString() || "0"}
            </div>
            <p className="text-xs text-zinc-500 mt-1">From latest scan</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-zinc-400">Ghost Followers</CardTitle>
            <Target className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">
              {latestScan?.ghost_count?.toLocaleString() || "0"}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              {latestScan?.total_followers && latestScan?.ghost_count ? 
                `${((latestScan.ghost_count / latestScan.total_followers) * 100).toFixed(1)}% of total` : 
                "Upload data to scan"
              }
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-zinc-400">Real Followers</CardTitle>
            <TrendingUp className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">
              {latestScan?.total_followers && latestScan?.ghost_count ? 
                (latestScan.total_followers - latestScan.ghost_count).toLocaleString() : 
                "0"
              }
            </div>
            <p className="text-xs text-zinc-500 mt-1">Active engaged followers</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-zinc-400">Last Scan</CardTitle>
            <Clock className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {latestScan?.created_date ? format(new Date(latestScan.created_date), "MMM d") : "Never"}
            </div>
            <p className="text-xs text-zinc-500 mt-1">Most recent analysis</p>
          </CardContent>
        </Card>
      </div>

      {/* Check for running scans */}
      {recentScans.some(scan => scan.status === 'queued' || scan.status === 'running') && (
        <Card className="bg-gradient-to-r from-blue-950 to-purple-950 border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Analyzing Your Followers</h3>
              <Badge className="bg-blue-600 text-white">In Progress</Badge>
            </div>
            <Progress value={75} className="mb-2" />
            <p className="text-sm text-zinc-300">Processing your Instagram data export...</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Target className="w-5 h-5" />
              Ghost Followers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-zinc-400 mb-4">
              {latestScan?.ghost_count ? 
                `You have ${latestScan.ghost_count} ghost followers that aren't engaging with your content.` :
                "Upload your Instagram data to identify ghost followers."
              }
            </p>
            <Link to={createPageUrl("GhostFollowers")}>
              <Button className="w-full bg-red-600 hover:bg-red-700">
                View & Remove Ghosts
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Scan History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-zinc-400 mb-4">
              {recentScans.length > 0 ? 
                `You have run ${recentScans.length} scan${recentScans.length === 1 ? '' : 's'}.` :
                "No scans yet. Upload your data to get started."
              }
            </p>
            <Link to={createPageUrl("Scan")}>
              <Button variant="outline" className="w-full border-zinc-600 hover:bg-zinc-800">
                View Scan Status
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {recentScans.length > 0 && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Recent Scans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentScans.slice(0, 3).map((scan) => (
                <div key={scan.id} className="flex items-center justify-between p-4 rounded-lg bg-zinc-800">
                  <div className="flex items-center gap-3">
                    {scan.status === 'complete' ? (
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    ) : scan.status === 'running' ? (
                      <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
                    ) : scan.status === 'queued' ? (
                      <Clock className="w-5 h-5 text-yellow-400" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-400" />
                    )}
                    <div>
                      <p className="text-white font-medium">
                        {scan.status === 'complete' ? 
                          `Found ${scan.ghost_count || 0} ghost followers` :
                          `Scan ${scan.status}`
                        }
                      </p>
                      <p className="text-xs text-zinc-400">
                        {format(new Date(scan.created_date), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-zinc-600 text-zinc-300 capitalize">
                    {scan.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
