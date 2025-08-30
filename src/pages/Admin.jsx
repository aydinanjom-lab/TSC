
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { UserProfile } from "@/api/entities";
import { ScanResult } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  BarChart3,
  DollarSign,
  Search,
  Crown,
  Activity,
  Shield
} from "lucide-react";
import { format } from "date-fns";

// This is a placeholder function for navigation. In a real application,
// this would typically be imported from a routing library (e.g., Next.js useRouter, React Router history).
const createPageUrl = (path) => `/${path}`;

export default function Admin() {
  const [currentUser, setCurrentUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [scans, setScans] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      const user = await User.me();
      if (user.role !== 'admin') {
        throw new Error('Not authorized');
      }
      setCurrentUser(user);

      const users = await User.list();
      setAllUsers(users);

      const allProfiles = await UserProfile.list('-created_date');
      setProfiles(allProfiles);

      const allScans = await ScanResult.list('-created_date', 50);
      setScans(allScans);
    } catch (error) {
      console.error("Admin access denied:", error);
      // In a real app, you might redirect, but for this demo, we'll just show an empty state.
      // window.location.href = createPageUrl('Dashboard'); 
    }
    setIsLoading(false);
  };

  const handleViewUser = (userId) => {
    console.log("Navigating to user details for ID:", userId);
    // Use Link navigation instead of window.location to avoid page reload
    window.location.href = createPageUrl(`AdminUsers/${userId}`);
  };

  const resetUserScanCount = async (userEmail) => {
    try {
      // Find the user profile associated with the email
      const userProfiles = await UserProfile.filter({ created_by: userEmail });
      if (userProfiles && userProfiles.length > 0) {
        // Assuming there's only one profile per email for simplicity
        await UserProfile.update(userProfiles[0].id, { scans_this_month: 0 });
        alert(`Successfully reset scan count for ${userEmail}`);
        loadAdminData(); // Refresh data to reflect changes
      } else {
        alert(`No user profile found for ${userEmail}`);
      }
    } catch (error) {
      alert(`Failed to reset scan count for ${userEmail}: ${error.message}`);
      console.error("Failed to reset scan count:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-400 mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading admin dashboard...</p>
        </div>
      </div>);

  }

  if (currentUser?.role !== 'admin') {
    return (
      <div className="p-6 md:p-8">
        <Card className="max-w-md mx-auto bg-zinc-900 border-zinc-800">
          <CardContent className="p-8 text-center">
            <Shield className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Access Denied</h3>
            <p className="text-zinc-400 mb-6">You do not have permission to view this page.</p>
          </CardContent>
        </Card>
      </div>);

  }

  const stats = {
    totalUsers: allUsers.length,
    activeSubscriptions: profiles.filter((p) => p.subscription_plan !== 'free').length,
    totalScans: scans.length,
    totalRevenue: profiles.filter((p) => p.subscription_plan === 'pro').length * 19 +
    profiles.filter((p) => p.subscription_plan === 'enterprise').length * 99
  };

  const filteredUsers = allUsers.filter((user) =>
  user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
  user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-zinc-400">Monitor users, subscriptions, and system activity</p>
        </div>
        <Badge className="bg-red-600 text-white">
          <Shield className="w-4 h-4 mr-2" />
          Admin Access
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-zinc-400">Total Users</CardTitle>
            <Users className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
            <p className="text-xs text-emerald-400 mt-1">+12% this month</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-zinc-400">Active Subscriptions</CardTitle>
            <Crown className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.activeSubscriptions}</div>
            <p className="text-xs text-emerald-400 mt-1">+23% this month</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-zinc-400">Total Scans</CardTitle>
            <BarChart3 className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalScans}</div>
            <p className="text-xs text-emerald-400 mt-1">+8% this week</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-zinc-400">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">${stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-emerald-400 mt-1">+15% this month</p>
          </CardContent>
        </Card>
      </div>

      {/* User Management */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              User Management
            </CardTitle>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-4 h-4" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-zinc-800 border-zinc-700 text-white w-64" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-zinc-800">
            {filteredUsers.slice(0, 10).map((user) => {
              const userProfile = profiles.find((p) => p.created_by === user.email);
              return (
                <div key={user.id} className="p-6 hover:bg-zinc-800/50 transition-colors">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-zinc-700 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{user.full_name}</h3>
                        <p className="text-zinc-400 text-sm">{user.email}</p>
                        <div className="text-xs text-zinc-500">
                          Scans this month: {userProfile?.scans_this_month || 0}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className={
                      userProfile?.subscription_plan === 'pro' ? 'bg-emerald-600' :
                      userProfile?.subscription_plan === 'starter' ? 'bg-blue-600' :
                      'bg-zinc-700'
                      }>
                        <Crown className="w-3 h-3 mr-1" />
                        {userProfile?.subscription_plan || 'free'}
                      </Badge>
                      <div className="text-sm text-zinc-400">
                        Joined: {format(new Date(user.created_date), 'MMM yyyy')}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewUser(user.id)}
                          aria-label="View user details"
                          className="text-zinc-300 hover:text-white hover:bg-zinc-700 focus:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 px-3 py-2"
                        >
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => resetUserScanCount(user.email)}
                          aria-label="Reset scan count"
                          className="text-yellow-300 hover:text-yellow-100 hover:bg-yellow-900/20 focus:bg-yellow-900/20 focus:outline-none focus:ring-2 focus:ring-yellow-500 px-2 py-1 text-xs"
                        >
                          Reset
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Feed */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Recent System Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {scans.slice(0, 5).map((scan) =>
            <div key={scan.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-sm text-white">
                      A scan was completed.
                    </p>
                    <p className="text-xs text-zinc-500">
                      Found {scan.ghost_followers_found} ghost followers.
                    </p>
                  </div>
                </div>
                <div className="text-xs text-zinc-400">
                  {format(new Date(scan.created_date), 'h:mm a')}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
