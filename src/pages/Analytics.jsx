
import React, { useState, useEffect, useCallback } from "react";
import { User } from "@/api/entities";
import { UserProfile } from "@/api/entities";
import { ScanResult } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  TrendingUp,
  Target,
  Users,
  MessageCircle,
  Heart,
  Activity
} from "lucide-react";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  Bar,
  BarChart
} from 'recharts';
import { format } from "date-fns";

export default function AnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);

  const loadPageData = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      const profiles = await UserProfile.filter({ created_by: currentUser.email });
      let userProfile = null;
      if (profiles && profiles.length > 0) {
        userProfile = profiles[0];
        setProfile(userProfile);
      }
      
      const allScans = await ScanResult.list('-created_date');
      const formattedScans = allScans.map(scan => ({
        ...scan,
        name: format(new Date(scan.created_date), 'MMM d'),
        // NOTE: engagement_rate is now on UserProfile, not ScanResult. 
        // This chart will need a different data source in a real implementation.
        // For demo, we'll use a static value.
        engagementRate: userProfile?.engagement_rate || 3.5, 
        ghostsFound: scan.ghost_count
      }));
      setScanHistory(formattedScans);

    } catch (error) {
      console.error("Error loading analytics data:", error);
    }
    setIsLoading(false);
  }, []); // Empty dependency array means this function is stable and won't recreate

  useEffect(() => {
    loadPageData();
  }, [loadPageData]); // Now correctly depends on the stable loadPageData function
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-400 mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const latestScan = scanHistory[0];

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Engagement Analytics</h1>
          <p className="text-zinc-400">Deep dive into your account's performance</p>
        </div>
        <Badge className="bg-emerald-600 text-white">
          @{profile?.instagram_username || 'demo_user'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-zinc-400">Engagement Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">{profile?.engagement_rate?.toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-zinc-400">Active Followers</CardTitle>
            <Users className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{profile?.total_followers - profile?.ghost_followers}</div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-zinc-400">Ghost Followers</CardTitle>
            <Target className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{profile?.ghost_followers}</div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-zinc-400">Total Scans</CardTitle>
            <BarChart3 className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{scanHistory.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-zinc-900/80 border-zinc-800 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              Engagement Rate Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={scanHistory.slice().reverse()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                <XAxis dataKey="name" stroke="#a1a1aa" />
                <YAxis stroke="#a1a1aa" unit="%" domain={[0, 'dataMax + 2']}/>
                <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }} />
                <Legend />
                <Line type="monotone" dataKey="engagementRate" name="Engagement Rate" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/80 border-zinc-800 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-red-400" />
              Ghost Followers Found Per Scan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={scanHistory.slice().reverse()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                <XAxis dataKey="name" stroke="#a1a1aa" />
                <YAxis stroke="#a1a1aa" />
                <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }} />
                <Legend />
                <Bar dataKey="ghostsFound" name="Ghosts Found" fill="#f87171" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

       <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Scan History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-800">
              <thead className="bg-zinc-950">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Ghosts Found</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Total Followers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {scanHistory.map(scan => (
                  <tr key={scan.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{scan.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300">
                      <Badge variant="outline" className="border-zinc-600 capitalize">{scan.status}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-400">{scan.ghostsFound}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{scan.total_followers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
