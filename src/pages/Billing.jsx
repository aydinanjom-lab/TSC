import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { UserProfile } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Crown, 
  CreditCard, 
  Calendar, 
  Download,
  ArrowUpRight,
  CheckCircle,
  AlertTriangle,
  Zap,
  Users,
  Target,
  Settings
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, addMonths } from "date-fns";

const STRIPE_PUBLISHABLE_KEY = "pk_test_..."; // Replace with your Stripe publishable key
const STARTER_PRICE_ID = "price_starter_monthly"; // Replace with your Stripe price ID
const PRO_PRICE_ID = "price_pro_monthly"; // Replace with your Stripe price ID

const PLAN_FEATURES = {
  free: {
    name: "Free",
    price: 0,
    scans: 0,
    followers: 1000,
    features: ["Basic ghost detection", "View results"]
  },
  starter: {
    name: "Starter",
    price: 9,
    scans: 1,
    followers: 10000,
    features: ["1 scan per month", "Up to 10K followers", "CSV export", "Email support"]
  },
  pro: {
    name: "Pro",
    price: 19,
    scans: 4,
    followers: 50000,
    features: ["4 scans per month", "Up to 50K followers", "CSV export", "Custom ghost threshold", "Priority support"]
  }
};

export default function BillingPage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      
      const profiles = await UserProfile.filter({ created_by: currentUser.email });
      let userProfile = profiles[0];
      
      if (!userProfile) {
        userProfile = await UserProfile.create({
          subscription_plan: "free",
          subscription_status: "expired"
        });
      }
      setProfile(userProfile);
    } catch (error) {
      console.error("Error loading billing data:", error);
    }
    setIsLoading(false);
  };

  const handleStripeCheckout = async (planType) => {
    setIsProcessing(true);
    try {
      const priceId = planType === 'starter' ? STARTER_PRICE_ID : PRO_PRICE_ID;
      
      // Create checkout session via backend function
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price_id: priceId,
          customer_email: user.email,
          success_url: `${window.location.origin}${createPageUrl("Billing")}?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${window.location.origin}${createPageUrl("Billing")}`,
        }),
      });
      
      const { checkout_url } = await response.json();
      window.location.href = checkout_url;
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Failed to start checkout. Please try again.");
    }
    setIsProcessing(false);
  };

  const handleCustomerPortal = async () => {
    if (!profile?.stripe_customer_id) {
      alert("No subscription found. Please subscribe to a plan first.");
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: profile.stripe_customer_id,
          return_url: `${window.location.origin}${createPageUrl("Billing")}`,
        }),
      });
      
      const { portal_url } = await response.json();
      window.location.href = portal_url;
    } catch (error) {
      console.error("Portal error:", error);
      alert("Failed to open customer portal. Please try again.");
    }
    setIsProcessing(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-400 mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading billing information...</p>
        </div>
      </div>
    );
  }

  const currentPlan = PLAN_FEATURES[profile?.subscription_plan] || PLAN_FEATURES.free;
  const usagePercentage = profile?.scans_this_month ? 
    Math.min((profile.scans_this_month / currentPlan.scans) * 100, 100) : 0;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Billing & Subscription</h1>
          <p className="text-zinc-400">Manage your subscription and view usage</p>
        </div>
        {profile?.stripe_customer_id && (
          <Button 
            onClick={handleCustomerPortal}
            disabled={isProcessing}
            variant="outline"
            className="border-zinc-600"
          >
            <Settings className="w-4 h-4 mr-2" />
            Manage Subscription
          </Button>
        )}
      </div>

      {/* Current Plan */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Crown className="w-5 h-5" />
              Current Plan
            </CardTitle>
            <Badge className={
              profile?.subscription_plan === 'pro' ? 'bg-emerald-600' :
              profile?.subscription_plan === 'starter' ? 'bg-blue-600' :
              'bg-zinc-600'
            }>
              {currentPlan.name}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-zinc-800 rounded-lg">
              <div className="text-2xl font-bold text-white">
                ${currentPlan.price}
                {currentPlan.price > 0 && <span className="text-sm text-zinc-400">/month</span>}
              </div>
              <div className="text-sm text-zinc-400">Monthly Price</div>
            </div>
            <div className="text-center p-4 bg-zinc-800 rounded-lg">
              <div className="text-2xl font-bold text-emerald-400">
                {profile?.scans_this_month || 0} / {currentPlan.scans === 0 ? '∞' : currentPlan.scans}
              </div>
              <div className="text-sm text-zinc-400">Scans This Month</div>
            </div>
            <div className="text-center p-4 bg-zinc-800 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">
                {currentPlan.followers.toLocaleString()}
              </div>
              <div className="text-sm text-zinc-400">Max Followers</div>
            </div>
          </div>

          {currentPlan.scans > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Usage this month</span>
                <span className="text-white">{profile?.scans_this_month || 0} of {currentPlan.scans} scans</span>
              </div>
              <Progress value={usagePercentage} className="w-full" />
            </div>
          )}

          {profile?.current_period_end && (
            <div className="text-sm text-zinc-400">
              <Calendar className="w-4 h-4 inline mr-2" />
              Next billing date: {format(new Date(profile.current_period_end), 'MMM d, yyyy')}
            </div>
          )}

          <div className="space-y-2">
            <h4 className="font-semibold text-white">Plan Features:</h4>
            <ul className="space-y-1">
              {currentPlan.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-zinc-300">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Plans */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Subscription Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Starter Plan */}
          <Card className={`${profile?.subscription_plan === 'starter' ? 'border-blue-500 bg-blue-950/20' : 'bg-zinc-900 border-zinc-800'}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Starter</CardTitle>
                {profile?.subscription_plan === 'starter' && (
                  <Badge className="bg-blue-600">Current</Badge>
                )}
              </div>
              <div className="text-3xl font-bold text-white">
                $9<span className="text-lg text-zinc-400">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {PLAN_FEATURES.starter.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-zinc-300">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    {feature}
                  </li>
                ))}
              </ul>
              
              {profile?.subscription_plan !== 'starter' && (
                <Button 
                  onClick={() => handleStripeCheckout('starter')}
                  disabled={isProcessing}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isProcessing ? "Processing..." : "Choose Starter"}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className={`${profile?.subscription_plan === 'pro' ? 'border-emerald-500 bg-emerald-950/20' : 'bg-zinc-900 border-zinc-800'} relative`}>
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-gradient-to-r from-emerald-500 to-blue-600">
                Most Popular
              </Badge>
            </div>
            <CardHeader className="pt-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Pro</CardTitle>
                {profile?.subscription_plan === 'pro' && (
                  <Badge className="bg-emerald-600">Current</Badge>
                )}
              </div>
              <div className="text-3xl font-bold text-white">
                $19<span className="text-lg text-zinc-400">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {PLAN_FEATURES.pro.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-zinc-300">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    {feature}
                  </li>
                ))}
              </ul>
              
              {profile?.subscription_plan !== 'pro' && (
                <Button 
                  onClick={() => handleStripeCheckout('pro')}
                  disabled={isProcessing}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  {isProcessing ? "Processing..." : "Choose Pro"}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Usage Statistics */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Usage Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{profile?.scans_this_month || 0}</div>
                <div className="text-sm text-zinc-400">Scans This Month</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-600/20 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{profile?.total_followers || 0}</div>
                <div className="text-sm text-zinc-400">Total Followers Analyzed</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{profile?.ghost_followers || 0}</div>
                <div className="text-sm text-zinc-400">Ghost Followers Removed</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-white mb-2">Can I cancel anytime?</h4>
            <p className="text-zinc-400 text-sm">
              Yes, you can cancel your subscription anytime from the customer portal. You'll continue to have access until your current period ends.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-2">What happens if I exceed my follower limit?</h4>
            <p className="text-zinc-400 text-sm">
              If your Instagram account has more followers than your plan allows, you'll be prompted to upgrade before scanning.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-2">Do unused scans roll over?</h4>
            <p className="text-zinc-400 text-sm">
              No, scan allowances reset each billing period and don't carry over to the next month.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}