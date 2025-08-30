
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { User } from "@/api/entities";
import { UserProfile } from "@/api/entities";
import { ScanResult } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw,
  Target,
  ArrowRight,
  Play,
  FileQuestion,
  Info
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, formatDistanceToNow } from "date-fns";
import ErrorBoundary from "../components/ErrorBoundary";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";

function ScanPageContent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // 'no-scans', 'not-found', 'fetch-failed', 'no-profile'
  const [scan, setScan] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [pollCount, setPollCount] = useState(0);

  const [debugInfo, setDebugInfo] = useState({});
  const isDebugMode = useMemo(() => new URLSearchParams(window.location.search).has('debug'), []);

  const getScanIdFromUrl = useCallback(() => {
    const pathParts = window.location.pathname.split('/');
    const scanIndex = pathParts.findIndex(part => part.toLowerCase() === 'scan');
    if (scanIndex !== -1 && scanIndex + 1 < pathParts.length) {
      const scanId = pathParts[scanIndex + 1];
      if (scanId && scanId.length > 5) return scanId; // Basic ID validation
    }
    return null;
  }, []);
  
  const loadData = useCallback(async (isInitialLoad = true) => {
    if (isInitialLoad) {
        setLoading(true);
    }

    let resolvedScanId = getScanIdFromUrl();
    setDebugInfo(prev => ({ ...prev, resolvedScanId, fetchState: 'loading' }));

    try {
      const currentUser = await User.me();
      const profiles = await UserProfile.filter({ created_by: currentUser.email });

      if (!profiles || profiles.length === 0) {
        throw new Error("User profile not found.");
      }
      const userProfile = profiles[0];

      if (!resolvedScanId) {
        const latestScans = await ScanResult.filter({ user_profile_id: userProfile.id }, "-created_date", 1);
        if (latestScans && latestScans.length > 0) {
          resolvedScanId = latestScans[0].id;
          window.history.replaceState(null, '', createPageUrl(`Scan/${resolvedScanId}`));
          setScan(latestScans[0]);
        } else {
          setError('no-scans');
          setDebugInfo(prev => ({ ...prev, fetchState: 'error', errorType: 'no-scans' }));
          setLoading(false);
          return;
        }
      } else {
         const foundScan = await ScanResult.get(resolvedScanId);
         if (foundScan && foundScan.created_by === currentUser.email) {
           setScan(foundScan);
         } else {
           setError('not-found');
           setDebugInfo(prev => ({ ...prev, fetchState: 'error', errorType: 'not-found' }));
           setLoading(false);
           return;
         }
      }
      setError(null);
      // Removed status from debugInfo update here, as it's not a dependency for loadData.
      // If we need current scan status for debugInfo, it should be derived from the scan state _after_ setScan.
      // For the purpose of this fix, only the dependency array for loadData is modified.
      setDebugInfo(prev => ({ ...prev, fetchState: 'success', status: scan?.status })); 

    } catch (e) {
      console.error("Error loading scan data:", e);
      if(e.message.includes("not found")) {
        setError('not-found');
      } else {
        setError('fetch-failed');
      }
      setDebugInfo(prev => ({ ...prev, fetchState: 'error', errorType: 'fetch-failed', errorMessage: e.message }));
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  }, [getScanIdFromUrl]); // Removed scan?.status from dependencies

  useEffect(() => {
    loadData(true);
  }, [loadData]); // Correctly depend on loadData

  // Polling for running scans
  useEffect(() => {
    if (scan && (scan.status === 'queued' || scan.status === 'running')) {
      const interval = setInterval(() => {
        setPollCount(prev => prev + 1);
        loadData(false); // Pass false to prevent main loader from showing
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [scan, loadData]); // This dependency is correct

  const handleRetry = async () => {
    if (!scan || scan.status !== 'failed') return;
    
    setIsRetrying(true);
    try {
      await ScanResult.update(scan.id, {
        status: "queued",
        last_error: null,
        started_at: new Date().toISOString()
      });
      await loadData(false);
    } catch (error) {
      console.error("Retry failed:", error);
      alert("Failed to retry scan. Please try again.");
    } finally {
      setIsRetrying(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'queued': return <Clock className="w-5 h-5 text-yellow-400" />;
      case 'running': return <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />;
      case 'complete': return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'failed': return <AlertTriangle className="w-5 h-5 text-red-400" />;
      default: return <Clock className="w-5 h-5 text-zinc-400" />;
    }
  };
  
  const getStatusColor = (status) => {
    switch (status) {
        case 'queued': return 'bg-yellow-600';
        case 'running': return 'bg-blue-600';
        case 'complete': return 'bg-emerald-600';
        case 'failed': return 'bg-red-600';
        default: return 'bg-zinc-600';
    }
  };

  const getProgressValue = (status) => {
    switch (status) {
      case 'queued': return 20;
      case 'running': return 60;
      case 'complete': return 100;
      case 'failed': return 100;
      default: return 0;
    }
  };
  
  const getProgressColor = (status) => {
    if (status === 'failed') return "bg-red-600";
    return "bg-emerald-600";
  };

  if (loading) {
    return <LoadingState message="Loading scan data..." />;
  }

  if (error) {
    return (
      <div className="p-6 md:p-8">
        {isDebugMode && <DebugBanner info={debugInfo} />}
        {error === 'no-scans' ? (
          <EmptyState 
            icon={Target}
            title="No Scans Yet"
            description="You haven't run any scans. Upload your Instagram data to get started."
            buttonText="Start First Scan"
            buttonLink={createPageUrl("Upload")}
          />
        ) : error === 'not-found' ? (
          <EmptyState 
            icon={FileQuestion}
            title="Scan Not Found"
            description="The scan you are looking for doesn't exist or you don't have permission to view it."
            buttonText="Back to Upload"
            buttonLink={createPageUrl("Upload")}
          />
        ) : (
          <Card className="bg-zinc-900 border-zinc-800 max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="w-5 h-5" />
                Error Loading Scan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 text-center space-y-4">
              <p className="text-zinc-400">
                There was a problem loading your scan data. Please try again.
              </p>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => loadData(true)} className="bg-emerald-600 hover:bg-emerald-700">
                  Try Again
                </Button>
                <Link to={createPageUrl("Upload")}>
                  <Button variant="outline" className="border-zinc-600">
                    Back to Upload
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  if (!scan) {
    return <LoadingState message="Initializing scan data..." />;
  }
  
  return (
    <div className="p-6 md:p-8 space-y-8">
      {isDebugMode && <DebugBanner info={debugInfo} />}
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Scan Details</h1>
          <p className="text-zinc-400">Monitor your follower analysis progress</p>
        </div>
        <Link to={createPageUrl("Upload")}>
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Play className="w-4 h-4 mr-2" />
            New Scan
          </Button>
        </Link>
      </div>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(scan.status)}
              <div>
                <CardTitle className="text-white">Scan #{scan.id.slice(-8)}</CardTitle>
                <p className="text-sm text-zinc-400">
                  Started {scan.started_at ? formatDistanceToNow(new Date(scan.started_at), { addSuffix: true }) : 'N/A'}
                </p>
              </div>
            </div>
            <Badge className={getStatusColor(scan.status)}>{scan.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Progress value={getProgressValue(scan.status)} className="w-full" indicatorClassName={getProgressColor(scan.status)} />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-zinc-800 rounded-lg">
              <div className="text-2xl font-bold text-white">{scan.total_followers ?? '—'}</div>
              <div className="text-sm text-zinc-400">Total Followers</div>
            </div>
            <div className="text-center p-4 bg-zinc-800 rounded-lg">
              <div className="text-2xl font-bold text-red-400">{scan.ghost_count ?? '—'}</div>
              <div className="text-sm text-zinc-400">Ghosts Found</div>
            </div>
            <div className="text-center p-4 bg-zinc-800 rounded-lg">
              <div className="text-2xl font-bold text-emerald-400">
                {(scan.total_followers && scan.ghost_count != null && scan.total_followers > 0) ? 
                  `${(((scan.total_followers - scan.ghost_count) / scan.total_followers) * 100).toFixed(1)}%` : 
                  '—'
                }
              </div>
              <div className="text-sm text-zinc-400">Real Followers</div>
            </div>
          </div>

          {scan.status === 'failed' && (
            <div className="p-4 bg-red-950/50 border border-red-800 rounded-lg">
              <p className="text-sm text-red-300">
                <strong className="text-red-400">Error:</strong> {scan.last_error || 'Unknown error occurred'}
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 text-sm text-zinc-400">
            <div><strong>Started:</strong> {scan.started_at ? format(new Date(scan.started_at), "MMM d, yyyy 'at' h:mm a") : '—'}</div>
            <div><strong>Finished:</strong> {scan.finished_at ? format(new Date(scan.finished_at), "MMM d, yyyy 'at' h:mm a") : '—'}</div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-end gap-4">
          {scan.status === 'failed' && (
            <Button 
              onClick={handleRetry} 
              variant="outline"
              disabled={isRetrying}
              className="border-zinc-600"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? 'Retrying...' : 'Retry Parse'}
            </Button>
          )}
          {scan.status === 'complete' && (
            <Link to={createPageUrl(`GhostFollowers?scan_id=${scan.id}`)}>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                View Ghost Followers
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

const DebugBanner = ({ info }) => (
  <div className="bg-yellow-950 border border-yellow-800 text-yellow-200 text-xs p-2 rounded-md font-mono mb-4">
    <div className="flex items-center gap-2">
      <Info className="w-4 h-4" />
      <span>[DEBUG]</span>
    </div>
    <pre className="mt-2 whitespace-pre-wrap">{JSON.stringify(info, null, 2)}</pre>
  </div>
);

export default function ScanPage() {
    return (
        <ErrorBoundary>
            <ScanPageContent />
        </ErrorBoundary>
    )
}
