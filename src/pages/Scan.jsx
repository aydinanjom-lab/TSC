
import React, { useState, useEffect, useCallback } from "react";
import { ScanResult } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Clock,
  Copy,
  BarChart3,
  Target,
  Users,
  Ghost
} from "lucide-react";
import { format } from "date-fns";
import LoadingState from "../components/LoadingState";

export default function ScanPage() {
  const [scanId, setScanId] = useState(null);
  const [fetchState, setFetchState] = useState("loading");
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (id) => {
    if (!id) return;
    try {
      const results = await ScanResult.filter({ id });
      if (!results || results.length === 0) {
        throw new Error(`Scan with ID ${id} not found.`);
      }
      const currentScan = results[0];
      setScanResult(currentScan);
      setFetchState("success");

      // Stop polling if the scan is complete or failed
      if (currentScan.status === 'complete' || currentScan.status === 'failed') {
        return false; // Signal to stop polling
      }
      return true; // Signal to continue polling
    } catch (e) {
      setError({ message: e.message });
      setFetchState("error");
      return false; // Stop polling on error
    }
  }, []);

  useEffect(() => {
    const pathParts = window.location.pathname.split("/");
    const scanIndex = pathParts.findIndex((part) => part.toLowerCase() === "scan");
    const resolvedScanId = scanIndex !== -1 && scanIndex + 1 < pathParts.length ? pathParts[scanIndex + 1] : null;

    if (!resolvedScanId) {
      setError({ message: "No scan ID provided in the URL." });
      setFetchState("error");
      return;
    }

    setScanId(resolvedScanId);
    setFetchState("loading");
    
    let isPolling = true;
    const poll = async () => {
      if (!isPolling) return;
      const shouldContinue = await fetchData(resolvedScanId);
      if (shouldContinue) {
        setTimeout(poll, 5000);
      } else {
        isPolling = false; // Ensure polling stops if fetchData signals not to continue
      }
    };
    
    poll();

    return () => {
      isPolling = false;
    };
  }, [fetchData]); // Removed window.location.pathname from dependency array

  const handleCopyError = (errorText) => {
    navigator.clipboard.writeText(errorText).then(
      () => alert("Error message copied to clipboard!"),
      (err) => console.error("Failed to copy text: ", err)
    );
  };
  
  const getStatusBadge = (status) => {
    switch (status) {
      case 'complete': return <Badge className="bg-emerald-600">Complete</Badge>;
      case 'running': return <Badge className="bg-blue-600">Running</Badge>;
      case 'queued': return <Badge className="bg-yellow-600">Queued</Badge>;
      case 'failed': return <Badge className="bg-red-600">Failed</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const renderContent = () => {
    if (fetchState === "loading") {
      return <LoadingState message="Fetching scan details..." />;
    }

    if (fetchState === "error") {
      return (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Error Fetching Scan</h3>
            <p className="text-zinc-400">{error?.message}</p>
          </CardContent>
        </Card>
      );
    }
    
    if (!scanResult) return null;

    switch (scanResult.status) {
      case 'queued':
      case 'running':
        return (
          <Card className="bg-gradient-to-r from-blue-950 to-purple-950 border-blue-800">
            <CardContent className="p-8 text-center">
              <RefreshCw className="w-16 h-16 text-blue-400 animate-spin mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Processing Your Scan</h3>
              <p className="text-zinc-300">
                Status: {scanResult.status}. This page will update automatically when complete.
              </p>
            </CardContent>
          </Card>
        );
      case 'complete':
        return (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                        <CheckCircle className="w-6 h-6 text-emerald-400" />
                        Scan Complete
                    </CardTitle>
                    <p className="text-zinc-400 mt-2">Finished on {format(new Date(scanResult.finished_at), 'MMM d, yyyy')}</p>
                  </div>
                  {getStatusBadge(scanResult.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-zinc-800 rounded-lg">
                        <Users className="w-6 h-6 mx-auto mb-2 text-zinc-400"/>
                        <div className="text-2xl font-bold text-white">{scanResult.total_followers?.toLocaleString()}</div>
                        <div className="text-sm text-zinc-400">Total Followers</div>
                    </div>
                     <div className="p-4 bg-zinc-800 rounded-lg">
                        <Ghost className="w-6 h-6 mx-auto mb-2 text-zinc-400"/>
                        <div className="text-2xl font-bold text-red-400">{scanResult.ghost_count?.toLocaleString()}</div>
                        <div className="text-sm text-zinc-400">Ghost Followers</div>
                    </div>
                     <div className="p-4 bg-zinc-800 rounded-lg">
                        <BarChart3 className="w-6 h-6 mx-auto mb-2 text-zinc-400"/>
                        <div className="text-2xl font-bold text-emerald-400">
                           {((scanResult.ghost_count / scanResult.total_followers) * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-zinc-400">Ghost Percentage</div>
                    </div>
                </div>
                 <Link to={createPageUrl("GhostFollowers")}>
                    <Button className="w-full chrome-button">
                        <Target className="w-4 h-4 mr-2" />
                        View Ghost Follower List
                    </Button>
                </Link>
            </CardContent>
          </Card>
        );
      case 'failed':
        const errorMessage = scanResult.last_error || "An unknown error occurred during processing.";
        const truncatedError = errorMessage.length > 300 ? `${errorMessage.substring(0, 300)}...` : errorMessage;
        
        const handleRetryProcessing = async () => {
          if (!confirm('Retry processing this scan?')) return;
          
          try {
            const r = await fetch("/api/process-upload", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ scanId: scanResult.id })
            });
            const j = await r.json();
            
            if (j.ok) {
              alert('Processing retry started successfully');
              // Refresh the page to show updated status
              window.location.reload();
            } else {
              alert(`Failed to retry processing: ${j.error} (${j.step || 'unknown'})`);
            }
          } catch (error) {
            alert(`Error retrying processing: ${error.message}`);
          }
        };
        
        return (
            <Card className="bg-zinc-900 border-red-800">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-white flex items-center gap-2">
                        <AlertTriangle className="w-6 h-6 text-red-400" />
                        Scan Failed
                    </CardTitle>
                    {getStatusBadge(scanResult.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert variant="destructive" className="bg-red-950/70 border-red-700/50">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-red-200">
                            {truncatedError}
                        </AlertDescription>
                    </Alert>
                    <div className="flex gap-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyError(errorMessage)}
                            className="border-zinc-600"
                        >
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Full Error
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRetryProcessing}
                            className="border-yellow-600 text-yellow-400 hover:bg-yellow-950"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Retry Processing
                        </Button>
                        <Link to={createPageUrl("Upload")}>
                          <Button variant="outline" size="sm" className="border-zinc-600">
                            Upload a New File
                          </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        );
      default:
        return <p>Unknown scan status: {scanResult.status}</p>;
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
       <div>
        <h1 className="text-3xl font-bold text-white mb-2">Scan Details</h1>
        <p className="text-zinc-400 truncate">Viewing analysis for scan ID: {scanId}</p>
      </div>
      {renderContent()}
    </div>
  );
}
