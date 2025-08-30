
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Crown, CheckCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function UpgradeModal({ isOpen, onClose, limitType, currentPlan }) {
  if (!isOpen) return null;

  const limitations = {
    scans: {
      title: "Scan Limit Reached",
      description: "You've used all your scans for this month. Upgrade to get more scans and advanced features.",
      features: currentPlan === 'free' ? [
        "1 scan per month (Starter)",
        "4 scans per month (Pro)",
        "CSV export",
        "Email support"
      ] : [
        "4 scans per month",
        "Up to 50K followers",
        "Custom ghost threshold",
        "Priority support"
      ]
    },
    followers: {
      title: "Follower Limit Exceeded",
      description: "Your account has too many followers for your current plan. Upgrade to analyze larger accounts.",
      features: currentPlan === 'free' ? [
        "Up to 10K followers (Starter)",
        "Up to 50K followers (Pro)",
        "Advanced analytics",
        "CSV export"
      ] : [
        "Up to 50K followers",
        "Custom ghost threshold",
        "Priority support",
        "Advanced features"
      ]
    }
  };

  const limit = limitations[limitType] || limitations.scans;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
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
        .chrome-icon-bg {
          background: linear-gradient(135deg, #f5f7fa 0%, #d9dde1 20%, #b4bcc4 50%, #d9dde1 80%, #f5f7fa 100%);
        }
      `}</style>

      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </Button>
        
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 chrome-icon-bg rounded-full flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-gray-800" />
          </div>
          <CardTitle className="text-white text-xl">{limit.title}</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <p className="text-zinc-400 text-center">{limit.description}</p>
          
          <div className="space-y-2">
            <h4 className="font-semibold text-white text-sm">Upgrade to unlock:</h4>
            <ul className="space-y-1">
              {limit.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-zinc-300">
                  <CheckCircle className="w-4 h-4 text-zinc-400" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="space-y-3">
            <Link to={createPageUrl("Billing")}>
              <Button className="w-full chrome-button" onClick={onClose}>
                <Crown className="w-4 h-4 mr-2 text-gray-800" />
                Upgrade Now
                <ArrowRight className="w-4 h-4 ml-2 text-gray-800" />
              </Button>
            </Link>
            
            <Button
              variant="outline"
              className="w-full border-zinc-600 text-zinc-300"
              onClick={onClose}
            >
              Maybe Later
            </Button>
          </div>
          
          <div className="text-center">
            <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30">
              ✨ 7-day money-back guarantee
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
