import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { UserProfile } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  User as UserIcon, 
  Instagram, 
  Bell, 
  Shield, 
  Trash2,
  CheckCircle,
  AlertTriangle,
  ExternalLink
} from "lucide-react";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Form states
  const [notifications, setNotifications] = useState({
    email_reports: true,
    scan_complete: true,
    weekly_summary: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      
      const profiles = await UserProfile.filter({ created_by: currentUser.email });
      if (profiles[0]) {
        setProfile(profiles[0]);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
    setIsLoading(false);
  };

  const handleDisconnectInstagram = async () => {
    if (!confirm("Are you sure you want to disconnect your Instagram account? This will remove all scan data.")) {
      return;
    }
    
    setIsSaving(true);
    await UserProfile.update(profile.id, {
      instagram_connected: false,
      instagram_username: null,
      instagram_access_token: null,
      total_followers: 0,
      ghost_followers: 0,
      engagement_rate: 0,
      last_scan_date: null
    });
    
    setTimeout(() => {
      setIsSaving(false);
      setShowSuccess(true);
      loadData();
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1000);
  };

  const handleSaveNotifications = async () => {
    setIsSaving(true);
    // In a real app, this would save notification preferences
    setTimeout(() => {
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-400 mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Account Settings</h1>
        <p className="text-zinc-400">Manage your account preferences and connected services</p>
      </div>

      {showSuccess && (
        <Alert className="border-emerald-500 bg-emerald-950/50">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="text-emerald-200">
            Settings updated successfully!
          </AlertDescription>
        </Alert>
      )}

      {/* Profile Information */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <UserIcon className="w-5 h-5" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-zinc-300">Full Name</Label>
              <Input
                id="name"
                value={user?.full_name || ''}
                disabled
                className="bg-zinc-800 border-zinc-700 text-white"
              />
              <p className="text-xs text-zinc-500">Name is managed by your login provider</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-300">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
                className="bg-zinc-800 border-zinc-700 text-white"
              />
              <p className="text-xs text-zinc-500">Email cannot be changed</p>
            </div>
          </div>
          
          <div className="pt-4">
            <Badge variant="outline" className="border-zinc-600 text-zinc-300">
              {user?.role === 'admin' ? 'Administrator' : 'User'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Connected Accounts */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Instagram className="w-5 h-5" />
            Connected Accounts
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
                {profile?.instagram_connected ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 text-sm">
                      Connected as @{profile.instagram_username}
                    </span>
                  </div>
                ) : (
                  <p className="text-zinc-400 text-sm">Not connected</p>
                )}
              </div>
            </div>
            
            {profile?.instagram_connected ? (
              <Button 
                variant="outline"
                onClick={handleDisconnectInstagram}
                disabled={isSaving}
                className="border-red-600 text-red-400 hover:bg-red-950"
              >
                {isSaving ? "Disconnecting..." : "Disconnect"}
              </Button>
            ) : (
              <Button className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700">
                Connect Instagram
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-medium">Email Reports</h4>
                <p className="text-zinc-400 text-sm">Receive detailed scan reports via email</p>
              </div>
              <Switch
                checked={notifications.email_reports}
                onCheckedChange={(checked) => 
                  setNotifications(prev => ({ ...prev, email_reports: checked }))
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-medium">Scan Complete</h4>
                <p className="text-zinc-400 text-sm">Get notified when follower scans finish</p>
              </div>
              <Switch
                checked={notifications.scan_complete}
                onCheckedChange={(checked) => 
                  setNotifications(prev => ({ ...prev, scan_complete: checked }))
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-medium">Weekly Summary</h4>
                <p className="text-zinc-400 text-sm">Weekly insights and growth reports</p>
              </div>
              <Switch
                checked={notifications.weekly_summary}
                onCheckedChange={(checked) => 
                  setNotifications(prev => ({ ...prev, weekly_summary: checked }))
                }
              />
            </div>
          </div>
          
          <Button 
            onClick={handleSaveNotifications}
            disabled={isSaving}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isSaving ? "Saving..." : "Save Preferences"}
          </Button>
        </CardContent>
      </Card>

      {/* Privacy & Security */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Privacy & Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="border-blue-500 bg-blue-950/50">
            <Shield className="h-4 w-4" />
            <AlertDescription className="text-blue-200">
              <div className="flex justify-between items-center">
                <span>Your data is encrypted and secure. We never store your Instagram password.</span>
                <Button variant="ghost" size="sm" className="text-blue-300 hover:text-blue-100 p-0 h-auto">
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </AlertDescription>
          </Alert>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-white font-medium">Data Retention</h4>
              <p className="text-zinc-400 text-sm">
                Scan data is kept for 90 days to track your progress. You can request data deletion at any time.
              </p>
              <Button variant="outline" className="border-zinc-600 hover:bg-zinc-800">
                Download My Data
              </Button>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-white font-medium">Account Deletion</h4>
              <p className="text-zinc-400 text-sm">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <Button variant="outline" className="border-red-600 text-red-400 hover:bg-red-950">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Info */}
      {profile && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-medium capitalize">
                  {profile.subscription_plan} Plan
                </h4>
                <p className="text-zinc-400 text-sm">
                  Status: <span className="capitalize">{profile.subscription_status}</span>
                </p>
              </div>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                Manage Billing
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}