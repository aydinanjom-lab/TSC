import React, { useState, useEffect, useCallback, useRef } from "react";
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

const POLL_INTERVAL = 15000; // 15 seconds
const ACTIVE_SCAN_TIMEOUT = 2 * 60 * 1000; // 2 minutes

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [latestCompletedScan, setLatestCompletedScan] = useState(null);
  const [activeScan, setActiveScan] = useState(null);
  const [recentScans, setRecentScans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Refs for cleanup
  const pollIntervalRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Memoized data fetching function
  const loadDashboardData = useCallback(async (signal) => {
    setError(null);
    
    try {
      const currentUser = await User.me();
      if (signal?.aborted) return;
      
      setUser(currentUser);
      
      const profiles = await UserProfile.filter({ created_by: currentUser.email });
      if (signal?.aborted) return;
      
      let userProfile = profiles[0];
      
      if (!userProfile) {
        userProfile = await UserProfile.create({
          instagram_connected: false,
          subscription_plan: "free",
          subscription_status: "trial"
        });
      }
      setProfile(userProfile);
      
      // Get recent scans for display
      const allScans = await ScanResult.filter({ user_profile_id: userProfile.id }, "-created_date", 10);
      if (signal?.aborted) return;
      
      setRecentScans(allScans || []);
      
      // Find latest COMPLETED scan for dashboard stats
      const completedScans = (allScans || []).filter(scan => scan.status === 'complete');
      setLatestCompletedScan(completedScans.length > 0 ? completedScans[0] : null);
      
      // Find active scan (queued/running AND within last 2 minutes)
      const now = new Date();
      const activeScans = (allScans || []).filter(scan => {
        if (scan.status !== 'queued' && scan.status !== 'running') return false;
        
        const updatedAt = new Date(scan.updated_date);
        const timeSinceUpdate = now.getTime() - updatedAt.getTime();
        
        return timeSinceUpdate <= ACTIVE_SCAN_TIMEOUT;
      });
      
      setActiveScan(activeScans.length > 0 ? activeScans[0] : null);
      
    } catch (error) {
      if (signal?.aborted) return;
      console.error("Error loading dashboard:", error);
      setError(error.message || "Failed to load dashboard data");
    }
  }, []);

  // Manual refresh function
  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    try {
      await loadDashboardData(abortControllerRef.current.signal);
    } finally {
      setIsRefreshing(false);
    }
  }, [loadDashboardData]);

  // Initial load
  useEffect(() => {
    setIsLoading(true);
    
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    loadDashboardData(abortControllerRef.current.signal).finally(() => {
      setIsLoading(false);
    });

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadDashboardData]);

  // Conditional polling effect
  useEffect(() => {
    // Clear any existing interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    // Only poll if there's an active scan and tab is visible
    if (activeScan && !document.hidden) {
      pollIntervalRef.current = setInterval(() => {
        // Only poll if tab is still visible
        if (!document.hidden) {
          handleManualRefresh();
        }
      }, POLL_INTERVAL);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [activeScan, handleManualRefresh]);

  // Handle visibility changes (pause polling when tab hidden)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Pause polling when tab hidden
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      } else {
        // Resume polling when tab visible (if active scan exists)
        if (activeScan && !pollIntervalRef.current) {
          pollIntervalRef.current = setInterval(() => {
            if (!document.hidden) {
              handleManualRefresh();
            }
          }, POLL_INTERVAL);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [activeScan, handleManualRefresh]);

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
      handleManualRefresh();
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

  if (error) {
    return (
      <div className="p-6 md:p-8 space-y-8">
        <Card className="bg-zinc-900 border-red-800">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Error Loading Dashboard</h3>
            <p className="text-zinc-300 mb-6">{error}</p>
            <Button 
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
        
        <div className="flex items-center gap-4">
          <Button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="border-zinc-600 text-zinc-300 hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Link to={createPageUrl("Upload")}>
            <Button className="chrome-button text-gray-800">
              <Zap className="w-4 h-4 mr-2" />
              Start New Scan
            </Button>
          </Link>
        </div>
      </div>

      {!profile?.instagram_connected && (
        <Alert className="border-blue-500 bg-blue-950/50">
          <Instagram className="h-4 w-4" />
          <AlertDescription className="text-blue-200">
            Upload your Instagram data export to start analyzing your followers and removing ghost accounts.
          </AlertDescription>
        </Alert>
      )}

      {/* Active Scan Banner - only show if there's a recent active scan */}
      {activeScan && (
        <Card className="bg-gradient-to-r from-blue-950 to-purple-950 border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Analyzing Your Followers</h3>
              <Badge className="bg-blue-600 text-white">In Progress</Badge>
            </div>
            <Progress value={75} className="mb-2" />
            <p className="text-sm text-zinc-300">
              Processing your Instagram data export... 
              {activeScan.updated_date && (
                <span className="ml-2 text-zinc-400">
                  Last update: {format(new Date(activeScan.updated_date), 'h:mm a')}
                </span>
              )}
            </p>
            <Link to={`/scan/${activeScan.id}`}>
              <Button variant="outline" size="sm" className="border-blue-400 text-blue-300 mt-3">
                View Progress
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-zinc-400">Total Followers</CardTitle>
            <Users className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {latestCompletedScan?.total_followers?.toLocaleString() || "0"}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              {latestCompletedScan ? "From latest completed scan" : "No completed scans yet"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-zinc-400">Ghost Followers</CardTitle>
            <Target className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">
              {latestCompletedScan?.ghost_count?.toLocaleString() || "0"}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              {latestCompletedScan?.total_followers && latestCompletedScan?.ghost_count ? 
                `${((latestCompletedScan.ghost_count / latestCompletedScan.total_followers) * 100).toFixed(1)}% of total` : 
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
              {latestCompletedScan?.total_followers && latestCompletedScan?.ghost_count ? 
                (latestCompletedScan.total_followers - latestCompletedScan.ghost_count).toLocaleString() : 
                "0"
              }
            </div>
            <p className="text-xs text-zinc-500 mt-1">Active engaged followers</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-zinc-400">Last Completed Scan</CardTitle>
            <Clock className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {latestCompletedScan?.created_date ? format(new Date(latestCompletedScan.created_date), "MMM d") : "Never"}
            </div>
            <p className="text-xs text-zinc-500 mt-1">Most recent completed analysis</p>
          </CardContent>
        </Card>
      </div>

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
              {latestCompletedScan?.ghost_count ? 
                `You have ${latestCompletedScan.ghost_count} ghost followers that aren't engaging with your content.` :
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
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="border-zinc-600 text-zinc-300 capitalize">
                      {scan.status}
                    </Badge>
                    <Link to={`/scan/${scan.id}`}>
                      <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}