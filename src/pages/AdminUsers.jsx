
import React, { useState, useEffect, useCallback } from "react";
import { User } from "@/api/entities";
import { UserProfile } from "@/api/entities";
import { ScanResult } from "@/api/entities";
import { GhostFollower } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ArrowLeft,
  User as UserIcon,
  Instagram,
  Calendar,
  Target,
  Users,
  BarChart3,
  Crown,
  Shield,
  Mail,
  Clock,
  CheckCircle,
  AlertTriangle,
  Copy,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, formatDistanceToNow } from "date-fns";
import ErrorBoundary from "../components/ErrorBoundary";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";

function AdminUsersPageContent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [targetUser, setTargetUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [userScans, setUserScans] = useState([]);
  const [ghostFollowersCount, setGhostFollowersCount] = useState(0);
  const [debugInfo, setDebugInfo] = useState({});
  const [showDebug, setShowDebug] = useState(false);

  // Bulletproof user ID parsing
  const getUserIdFromUrl = useCallback(() => {
    const pathParts = window.location.pathname.split('/');
    console.log("Full URL path:", window.location.pathname);
    console.log("Path parts:", pathParts);
    
    // Look for AdminUsers/{id} pattern
    const adminUsersIndex = pathParts.findIndex(part => part === 'AdminUsers');
    if (adminUsersIndex !== -1 && adminUsersIndex + 1 < pathParts.length) {
      const userId = pathParts[adminUsersIndex + 1];
      console.log("Found user ID in path:", userId);
      return userId;
    }
    
    // Fallback to query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const queryId = urlParams.get('id');
    console.log("Query ID:", queryId);
    
    return queryId;
  }, []);

  const loadUserData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const userId = getUserIdFromUrl();
      const isDebugMode = new URLSearchParams(window.location.search).has('debug');
      
      console.log("Loading user data...");
      console.log("User ID from URL:", userId);
      console.log("Debug mode:", isDebugMode);
      
      // Check admin access
      const admin = await User.me();
      if (admin.role !== 'admin') {
        setError('unauthorized');
        setLoading(false);
        return;
      }
      setCurrentUser(admin);

      if (!userId) {
        setError('no-user-id');
        setLoading(false);
        return;
      }

      // Find the target user - use admin scope (all users)
      const allUsers = await User.list();
      const user = allUsers.find(u => u.id === userId);
      
      console.log("All users count:", allUsers.length);
      console.log("Target user found:", !!user);
      
      if (!user) {
        setError('user-not-found');
        setLoading(false);
        return;
      }
      setTargetUser(user);

      // Get user's profile
      const profiles = await UserProfile.filter({ created_by: user.email });
      console.log("User profiles found:", profiles?.length || 0);
      
      let scansCount = 0;
      let ghostCount = 0;
      
      if (profiles && profiles.length > 0) {
        setUserProfile(profiles[0]);
        
        // Get user's scans
        const scans = await ScanResult.filter({ user_profile_id: profiles[0].id }, "-created_date");
        setUserScans(scans || []);
        scansCount = scans?.length || 0;
        
        // Get ghost followers count
        const ghostFollowers = await GhostFollower.filter({ user_profile_id: profiles[0].id });
        setGhostFollowersCount(ghostFollowers?.length || 0);
        ghostCount = ghostFollowers?.length || 0;
        
        console.log("User scans found:", scansCount);
        console.log("Ghost followers found:", ghostCount);
      }

      setDebugInfo({
        userId,
        userFound: !!user,
        profileFound: !!(profiles && profiles.length > 0),
        scansCount,
        ghostCount,
        isDebugMode
      });

    } catch (error) {
      console.error("Error loading user data:", error);
      setError('fetch-failed');
      setDebugInfo(prev => ({ ...prev, fetchError: error.message }));
    }
    setLoading(false);
  }, [getUserIdFromUrl]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'queued': return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'running': return <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />;
      case 'complete': return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'failed': return <AlertTriangle className="w-4 h-4 text-red-400" />;
      default: return <Clock className="w-4 h-4 text-zinc-400" />;
    }
  };

  const copyErrorDetails = () => {
    const details = `Debug Info: ${JSON.stringify(debugInfo, null, 2)}\nError: ${error}\nURL: ${window.location.href}`;
    navigator.clipboard.writeText(details).then(() => {
      alert('Error details copied to clipboard.');
    });
  };

  // Show debug info if in debug mode or if there's an error
  const showDebugInfo = debugInfo.isDebugMode || error;

  if (loading) {
    return <LoadingState message="Loading user details..." />;
  }

  if (error) {
    return (
      <ErrorBoundary>
        <div className="p-6 md:p-8 space-y-6">
          {error === 'unauthorized' ? (
            <EmptyState
              icon={Shield}
              title="Access Denied"
              description="You do not have permission to view this page."
              buttonText="Back to Admin"
              buttonLink={createPageUrl("Admin")}
            />
          ) : error === 'no-user-id' ? (
            <EmptyState
              icon={UserIcon}
              title="No User Selected"
              description="Please select a user to view their details."
              buttonText="Back to User List"
              buttonLink={createPageUrl("Admin")}
            />
          ) : error === 'user-not-found' ? (
            <EmptyState
              icon={UserIcon}
              title="User Not Found"
              description="The user you are looking for does not exist."
              buttonText="Back to User List"
              buttonLink={createPageUrl("Admin")}
            />
          ) : (
            <Card className="bg-zinc-900 border-zinc-800 max-w-2xl mx-auto">
              <CardContent className="p-8 text-center">
                <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Failed to Load User</h3>
                <p className="text-zinc-400 mb-6">
                  There was a problem loading the user data.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button onClick={() => window.location.reload()} className="bg-emerald-600 hover:bg-emerald-700">
                    Try Again
                  </Button>
                  <Button onClick={copyErrorDetails} variant="outline" className="border-zinc-600">
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Error Details
                  </Button>
                  <Link to={createPageUrl("Admin")}>
                    <Button variant="outline" className="border-zinc-600">
                      Back to User List
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Debug Panel */}
          {showDebugInfo && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <Button
                  variant="ghost"
                  onClick={() => setShowDebug(!showDebug)}
                  className="w-full justify-between text-white"
                >
                  Debug Information
                  {showDebug ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </CardHeader>
              {showDebug && (
                <CardContent className="text-xs text-zinc-300 font-mono space-y-1">
                  <p>User ID: {debugInfo.userId || 'null'}</p>
                  <p>User Found: {debugInfo.userFound ? 'true' : 'false'}</p>
                  <p>Profile Found: {debugInfo.profileFound ? 'true' : 'false'}</p>
                  <p>Scans Count: {debugInfo.scansCount || 0}</p>
                  <p>Ghost Count: {debugInfo.ghostCount || 0}</p>
                  <p>Error: {error || 'none'}</p>
                  <p>Fetch Error: {debugInfo.fetchError || 'none'}</p>
                  <p>Current URL: {window.location.href}</p>
                </CardContent>
              )}
            </Card>
          )}
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="p-6 md:p-8 space-y-8">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl("Admin")}>
            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to User List
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">User Details</h1>
            <p className="text-zinc-400">Detailed view of user account and activity</p>
          </div>
        </div>

        {/* User Profile Card */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <UserIcon className="w-5 h-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-zinc-700 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">
                  {targetUser?.full_name?.charAt(0) || targetUser?.email?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-white">{targetUser?.full_name || 'N/A'}</h2>
                <p className="text-zinc-400 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {targetUser?.email || 'N/A'}
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <Badge className={targetUser?.role === 'admin' ? 'bg-red-600' : 'bg-zinc-600'}>
                    {targetUser?.role === 'admin' ? 'Administrator' : 'User'}
                  </Badge>
                  {targetUser?.created_date && (
                    <span className="text-sm text-zinc-400">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Joined {format(new Date(targetUser.created_date), 'MMM d, yyyy')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-medium text-zinc-400">Subscription</CardTitle>
              <Crown className="h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white capitalize">
                {userProfile?.subscription_plan || 'free'}
              </div>
              <p className="text-xs text-zinc-500 mt-1 capitalize">
                {userProfile?.subscription_status || 'inactive'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-medium text-zinc-400">Total Scans</CardTitle>
              <BarChart3 className="h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{userScans?.length || 0}</div>
              <p className="text-xs text-zinc-500 mt-1">All time</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-medium text-zinc-400">Total Followers</CardTitle>
              <Users className="h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {userProfile?.total_followers?.toLocaleString() || '0'}
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
              <div className="text-2xl font-bold text-red-400">{ghostFollowersCount || 0}</div>
              <p className="text-xs text-zinc-500 mt-1">Identified</p>
            </CardContent>
          </Card>
        </div>

        {/* Instagram Connection */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Instagram className="w-5 h-5" />
              Instagram Connection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <Instagram className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Instagram</h3>
                  {userProfile?.instagram_connected ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400 text-sm">
                        Connected as @{userProfile.instagram_username || 'unknown'}
                      </span>
                    </div>
                  ) : (
                    <p className="text-zinc-400 text-sm">Not connected</p>
                  )}
                </div>
              </div>
              <Badge className={userProfile?.instagram_connected ? 'bg-emerald-600' : 'bg-zinc-600'}>
                {userProfile?.instagram_connected ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
            
            {userProfile?.last_scan_date && (
              <div className="mt-4 text-sm text-zinc-400">
                <Clock className="w-4 h-4 inline mr-2" />
                Last scan: {formatDistanceToNow(new Date(userProfile.last_scan_date), { addSuffix: true })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Scans */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Recent Scans</CardTitle>
          </CardHeader>
          <CardContent>
            {userScans && userScans.length > 0 ? (
              <div className="space-y-4">
                {userScans.slice(0, 5).map((scan) => (
                  <div key={scan.id} className="flex items-center justify-between p-4 rounded-lg bg-zinc-800">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(scan.status)}
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
                      <Link to={createPageUrl(`Scan/${scan.id}`)}>
                        <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
                <p className="text-zinc-400">No scans found for this user</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Admin Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button 
                variant="outline" 
                className="border-blue-600 text-blue-400 hover:bg-blue-950"
                onClick={() => alert(`Send email functionality would be implemented here for ${targetUser?.email}`)}
              >
                <Mail className="w-4 h-4 mr-2" />
                Send Email
              </Button>
              <Button 
                variant="outline" 
                className="border-zinc-600"
                onClick={() => alert(`Reset password functionality would be implemented here for ${targetUser?.email}`)}
              >
                <Shield className="w-4 h-4 mr-2" />
                Reset Password
              </Button>
              <Button 
                variant="outline" 
                className="border-red-600 text-red-400 hover:bg-red-950"
                onClick={() => {
                  if (confirm(`Are you sure you want to suspend ${targetUser?.email}?`)) {
                    alert('Suspend functionality would be implemented here');
                  }
                }}
              >
                Suspend Account
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Debug Panel */}
        {showDebugInfo && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <Button
                variant="ghost"
                onClick={() => setShowDebug(!showDebug)}
                className="w-full justify-between text-white"
              >
                Debug Information
                {showDebug ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </CardHeader>
            {showDebug && (
              <CardContent className="text-xs text-zinc-300 font-mono space-y-1">
                <p>User ID: {debugInfo.userId || 'null'}</p>
                <p>User Found: {debugInfo.userFound ? 'true' : 'false'}</p>
                <p>Profile Found: {debugInfo.profileFound ? 'true' : 'false'}</p>
                <p>Scans Count: {debugInfo.scansCount || 0}</p>
                <p>Ghost Count: {debugInfo.ghostCount || 0}</p>
                <p>Error: {error || 'none'}</p>
                <p>Fetch Error: {debugInfo.fetchError || 'none'}</p>
                <p>Current URL: {window.location.href}</p>
              </CardContent>
            )}
          </Card>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default function AdminUsersPage() {
  return (
    <ErrorBoundary>
      <AdminUsersPageContent />
    </ErrorBoundary>
  );
}
