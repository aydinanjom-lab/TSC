import React, { useState, useEffect, useCallback, useMemo } from "react";
import { User } from "@/api/entities";
import { UserProfile } from "@/api/entities";
import { GhostFollower } from "@/api/entities";
import { ScanResult } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  UserMinus, 
  Download, 
  ThumbsUp, 
  ThumbsDown, 
  UserX,
  Filter,
  Calendar,
  Activity,
  Target,
  RefreshCw,
  Upload as UploadIcon
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from '@/utils';
import { format, isAfter, subDays } from 'date-fns';
import ErrorBoundary from '../components/ErrorBoundary';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';

const PAGE_SIZE = 50;

function GhostFollowersPage() {
  const [loading, setLoading] = useState(true);
  const [followers, setFollowers] = useState([]);
  const [selectedFollowers, setSelectedFollowers] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [profile, setProfile] = useState(null);
  const [latestScan, setLatestScan] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  
  const [filters, setFilters] = useState({
    type: 'all', // 'all', 'ghosts', 'inactive_30', 'inactive_60', 'inactive_90'
  });

  const fetchFollowers = useCallback(async () => {
    setLoading(true);
    try {
      const currentUser = await User.me();
      const profiles = await UserProfile.filter({ created_by: currentUser.email });
      
      if (!profiles || profiles.length === 0) {
        setFollowers([]);
        setLoading(false);
        return;
      }
      
      setProfile(profiles[0]);
      
      // Get latest scan to check if processing
      const scans = await ScanResult.filter({ user_profile_id: profiles[0].id }, "-created_date", 1);
      if (scans && scans.length > 0) {
        setLatestScan(scans[0]);
      }
      
      const ghostFollowers = await GhostFollower.filter(
        { user_profile_id: profiles[0].id }, 
        '-ghost_score', 
        PAGE_SIZE * 5 // Load more to handle client-side filtering
      );
      setFollowers(ghostFollowers || []);
    } catch (e) {
      console.error("Failed to fetch followers:", e);
      throw e; // Let the error boundary catch it
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFollowers();
  }, [fetchFollowers]);

  // Auto-refresh if scan is processing
  useEffect(() => {
    if (latestScan?.status === 'queued' || latestScan?.status === 'running') {
      const interval = setInterval(fetchFollowers, 5000);
      return () => clearInterval(interval);
    }
  }, [latestScan, fetchFollowers]);

  const filteredFollowers = useMemo(() => {
    let result = followers;

    // Apply search filter
    if (searchTerm) {
      result = result.filter(f => 
        (f.handle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (f.full_name || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply type filter
    const now = new Date();
    switch (filters.type) {
      case 'ghosts':
        result = result.filter(f => (f.ghost_score || 0) >= 0.75);
        break;
      case 'inactive_30':
        result = result.filter(f => {
          if (!f.last_seen_interaction_at) return true;
          return isAfter(subDays(now, 30), new Date(f.last_seen_interaction_at));
        });
        break;
      case 'inactive_60':
        result = result.filter(f => {
          if (!f.last_seen_interaction_at) return true;
          return isAfter(subDays(now, 60), new Date(f.last_seen_interaction_at));
        });
        break;
      case 'inactive_90':
        result = result.filter(f => {
          if (!f.last_seen_interaction_at) return true;
          return isAfter(subDays(now, 90), new Date(f.last_seen_interaction_at));
        });
        break;
      default:
        // 'all' - no additional filtering
        break;
    }

    return result;
  }, [followers, searchTerm, filters]);

  const paginatedFollowers = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredFollowers.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredFollowers, currentPage]);

  const totalPages = Math.ceil(filteredFollowers.length / PAGE_SIZE);

  const handleAction = async (ids, newStatus) => {
    const actionVerb = newStatus === 'kept' ? 'Keep' : 'Remove';
    if (!confirm(`Are you sure you want to ${actionVerb.toLowerCase()} ${ids.length} follower(s)?`)) return;

    try {
      for (const id of ids) {
        await GhostFollower.update(id, { status: newStatus });
      }
      fetchFollowers();
      setSelectedFollowers(new Set());
    } catch (error) {
      alert(`Failed to ${actionVerb.toLowerCase()} followers. Please try again.`);
      console.error(error);
    }
  };

  const exportToCsv = useCallback(async () => {
    setIsExporting(true);
    try {
      const dataToExport = filteredFollowers;
      if (dataToExport.length === 0) {
        alert("No data to export.");
        return;
      }
      
      const headers = ["handle", "full_name", "ghost_score", "total_likes", "total_comments", "follower_since", "last_seen_interaction_at"];
      const csvRows = [headers.join(',')];
      
      for (const row of dataToExport) {
        const values = headers.map(header => {
          let val = row[header] ?? '';
          if (header === 'ghost_score') {
            val = ((val || 0) * 100).toFixed(1) + '%';
          } else if (header === 'follower_since' || header === 'last_seen_interaction_at') {
            val = val ? format(new Date(val), 'yyyy-MM-dd') : '';
          } else if (header === 'handle') {
            val = val ? `@${val}` : '(unknown)';
          }
          const escaped = ('' + val).replace(/"/g, '""');
          return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
      }
      
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('href', url);
      a.setAttribute('download', `ghost_followers_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert("Failed to export CSV. Please try again.");
      console.error("CSV Export Failed:", e);
    } finally {
      setIsExporting(false);
    }
  }, [filteredFollowers]);

  if (loading) {
    return <LoadingState message="Loading ghost followers..." />;
  }

  // Show processing state if scan is running and no followers yet
  if ((latestScan?.status === 'queued' || latestScan?.status === 'running') && followers.length === 0) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Ghost Followers</h1>
            <p className="text-zinc-400">Analyzing your Instagram data...</p>
          </div>
        </div>
        
        <Card className="bg-gradient-to-r from-blue-950 to-purple-950 border-blue-800">
          <CardContent className="p-8 text-center">
            <RefreshCw className="w-16 h-16 text-blue-400 animate-spin mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Processing Your Scan</h3>
            <p className="text-zinc-300 mb-4">
              We're analyzing your Instagram data export to identify ghost followers. This usually takes 2-5 minutes.
            </p>
            <Link to={createPageUrl(`Scan/${latestScan.id}`)}>
              <Button variant="outline" className="border-blue-400 text-blue-300">
                View Scan Progress
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (followers.length === 0) {
    return (
      <EmptyState 
        icon={UserX}
        title="No Followers Found"
        description={latestScan?.status === 'complete' 
          ? "Your scan completed but no followers were found. Check that your Instagram download includes follower data in JSON format."
          : "Upload your Instagram data export to start analyzing your followers for ghost accounts."
        }
        buttonText="Upload Instagram Data"
        buttonLink={createPageUrl("Upload")}
      />
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Ghost Followers</h1>
          <p className="text-zinc-400">Manage and remove inactive followers from your account</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-zinc-600 text-zinc-300">
            {filteredFollowers.length} found
          </Badge>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-4 h-4" />
              <Input
                placeholder="Search by handle or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <Select value={filters.type} onValueChange={(value) => setFilters({ type: value })}>
              <SelectTrigger className="w-48 bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="Filter followers" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                <SelectItem value="all">All Followers</SelectItem>
                <SelectItem value="ghosts">Ghost Followers (≥75%)</SelectItem>
                <SelectItem value="inactive_30">Inactive 30+ Days</SelectItem>
                <SelectItem value="inactive_60">Inactive 60+ Days</SelectItem>
                <SelectItem value="inactive_90">Inactive 90+ Days</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={exportToCsv}
              disabled={isExporting || filteredFollowers.length === 0}
              variant="outline" 
              className="border-zinc-600"
            >
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? "Exporting..." : "Export CSV"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedFollowers.size > 0 && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-white">
                {selectedFollowers.size} follower{selectedFollowers.size === 1 ? '' : 's'} selected
              </span>
              <div className="flex gap-2">
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={() => handleAction(Array.from(selectedFollowers), 'kept')}
                  className="border-emerald-600 text-emerald-400 hover:bg-emerald-950"
                >
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  Keep
                </Button>
                <Button 
                  size="sm"
                  variant="destructive"
                  onClick={() => handleAction(Array.from(selectedFollowers), 'removed')}
                >
                  <UserMinus className="w-4 h-4 mr-2" />
                  Remove
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Followers Table */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-full divide-y divide-zinc-800">
              {/* Table Header */}
              <div className="bg-zinc-950 px-6 py-3 grid grid-cols-12 gap-4 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                <div className="col-span-1">
                  <Checkbox 
                    checked={paginatedFollowers.length > 0 && paginatedFollowers.every(f => selectedFollowers.has(f.id))}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedFollowers(new Set(paginatedFollowers.map(f => f.id)));
                      } else {
                        setSelectedFollowers(new Set());
                      }
                    }}
                  />
                </div>
                <div className="col-span-3">Follower</div>
                <div className="col-span-2">Ghost Score</div>
                <div className="col-span-2">Engagement</div>
                <div className="col-span-2">Since / Last Seen</div>
                <div className="col-span-2">Actions</div>
              </div>

              {/* Table Body */}
              {paginatedFollowers.map((follower) => (
                <div key={follower.id} className="px-6 py-4 grid grid-cols-12 gap-4 items-center hover:bg-zinc-800/50">
                  {/* Checkbox */}
                  <div className="col-span-1">
                    <Checkbox 
                      checked={selectedFollowers.has(follower.id)}
                      onCheckedChange={(checked) => {
                        const newSelection = new Set(selectedFollowers);
                        if (checked) {
                          newSelection.add(follower.id);
                        } else {
                          newSelection.delete(follower.id);
                        }
                        setSelectedFollowers(newSelection);
                      }}
                    />
                  </div>

                  {/* Follower Info */}
                  <div className="col-span-3 flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={follower.profile_picture_url} />
                      <AvatarFallback className="bg-zinc-700 text-zinc-300">
                        {(follower.handle || '?').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium text-white truncate">
                        @{follower.handle || '(unknown)'}
                      </p>
                      <p className="text-sm text-zinc-400 truncate">{follower.full_name || '—'}</p>
                    </div>
                  </div>

                  {/* Ghost Score */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${
                        (follower.ghost_score || 0) >= 0.75 ? 'text-red-400' :
                        (follower.ghost_score || 0) >= 0.5 ? 'text-yellow-400' : 'text-emerald-400'
                      }`}>
                        {follower.ghost_score !== null ? `${((follower.ghost_score || 0) * 100).toFixed(0)}%` : '—'}
                      </span>
                      {(follower.ghost_score || 0) >= 0.75 && (
                        <Badge className="bg-red-600 text-white text-xs">Ghost</Badge>
                      )}
                    </div>
                  </div>

                  {/* Engagement */}
                  <div className="col-span-2">
                    <div className="text-sm text-zinc-300">
                      <div className="flex items-center gap-1">
                        <span>{follower.total_likes || 0}</span>
                        <span className="text-zinc-500">likes</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>{follower.total_comments || 0}</span>
                        <span className="text-zinc-500">comments</span>
                      </div>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="col-span-2">
                    <div className="text-sm text-zinc-400">
                      {follower.follower_since && (
                        <div className="flex items-center gap-1 mb-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(follower.follower_since), 'MMM yyyy')}
                        </div>
                      )}
                      {follower.last_seen_interaction_at ? (
                        <div className="flex items-center gap-1">
                          <Activity className="w-3 h-3" />
                          {format(new Date(follower.last_seen_interaction_at), 'MMM d')}
                        </div>
                      ) : (
                        <span className="text-zinc-500 text-xs">Never active</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAction([follower.id], 'kept')}
                      className="border-emerald-600 text-emerald-400 hover:bg-emerald-950"
                    >
                      <ThumbsUp className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAction([follower.id], 'removed')}
                      className="border-red-600 text-red-400 hover:bg-red-950"
                    >
                      <ThumbsDown className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-zinc-800 px-6 py-4 flex items-center justify-between">
              <div className="text-sm text-zinc-400">
                Showing {((currentPage - 1) * PAGE_SIZE) + 1} to {Math.min(currentPage * PAGE_SIZE, filteredFollowers.length)} of {filteredFollowers.length} followers
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className="border-zinc-600"
                >
                  Previous
                </Button>
                <span className="flex items-center px-3 text-sm text-zinc-400">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="border-zinc-600"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function GhostFollowersPageWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <GhostFollowersPage />
    </ErrorBoundary>
  );
}