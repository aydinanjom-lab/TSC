import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Download,
  Upload,
  FileSpreadsheet,
  Sparkles,
  Crown,
  CheckCircle,
  ArrowRight,
  Target
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

// Replace this with your actual logo URL from App Profile
const LOGO_URL = "/logo.svg";

// Smooth scrolling for anchor links
const smoothScrollTo = (id) => {
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({
      behavior: 'smooth'
    });
  }
};

const FeatureCard = ({ icon, title, description }) => (
  <div className="p-8 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
    <div className="w-12 h-12 chrome-icon-bg rounded-lg flex items-center justify-center text-gray-800 mb-6">
      {icon}
    </div>
    <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
    <p className="text-zinc-400">{description}</p>
  </div>
);

const PricingCard = ({ plan, isPopular = false }) => (
  <div className={`p-8 rounded-2xl ${isPopular ? 'border-2 chrome-gradient-border bg-zinc-900' : 'border border-zinc-800 bg-zinc-950'}`}>
    {isPopular && (
      <Badge className="mb-4 chrome-gradient text-gray-800 font-semibold border-0">Most Popular</Badge>
    )}
    <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
    <p className="text-zinc-400 mt-2 mb-6">{plan.description}</p>
    <div className="text-5xl font-bold text-white mb-6">
      ${plan.price}<span className="text-lg font-normal text-zinc-400">/mo</span>
    </div>
    <ul className="space-y-4 mb-8">
      {plan.features.map((feature, index) => (
        <li key={index} className="flex items-center gap-3 text-zinc-300">
          <CheckCircle className="w-5 h-5 text-zinc-400" />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
    <Link to={createPageUrl("Billing")}>
      <Button 
        className={`w-full ${isPopular ? 'chrome-button' : 'bg-white/10 hover:bg-white/20 text-white'}`}
      >
        Choose Plan
      </Button>
    </Link>
  </div>
);

export default function Home() {
  const pricingPlans = [
    {
      name: "Starter",
      description: "For creators getting started.",
      price: 9,
      features: ["1 scan per month", "Up to 10k followers", "CSV export"]
    },
    {
      name: "Pro",
      description: "For serious creators who want to grow.",
      price: 19,
      features: ["4 scans per month", "Up to 50k followers", "CSV export", "Adjustable ghost threshold"]
    }
  ];

  return (
    <div className="bg-black text-white antialiased">
      <style jsx>{`
        .chrome-gradient {
          background: linear-gradient(135deg, #f5f7fa 0%, #d9dde1 20%, #b4bcc4 50%, #d9dde1 80%, #f5f7fa 100%);
        }
        .chrome-gradient-border {
          border-image: linear-gradient(135deg, #f5f7fa 0%, #d9dde1 20%, #b4bcc4 50%, #d9dde1 80%, #f5f7fa 100%) 1;
        }
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
        .logo-container {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(8px);
          border-radius: 12px;
          padding: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .navbar-logo {
          height: 40px;
          width: auto;
          max-width: 160px;
          object-fit: contain;
        }
        .hero-logo {
          height: auto;
          width: 160px;
          max-width: 160px;
          object-fit: contain;
        }
        @media (max-width: 768px) {
          .navbar-logo {
            height: 32px;
            max-width: 120px;
          }
          .hero-logo {
            width: 120px;
            max-width: 120px;
          }
        }
        html { scroll-behavior: smooth; }
      `}</style>

      {/* Navigation */}
      <header className="border-b border-zinc-800 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to={createPageUrl("Home")} className="flex items-center">
              <div className="logo-container">
                <img 
                  src={LOGO_URL}
                  alt="The Social Cleanup Logo"
                  className="navbar-logo"
                  onError={(e) => {
                    // Fallback to icon if logo fails to load
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="w-8 h-8 chrome-icon-bg rounded-lg flex items-center justify-center" style={{ display: 'none' }}>
                  <Target className="w-5 h-5 text-gray-800" />
                </div>
              </div>
            </Link>
            <div className="flex items-center space-x-4">
               <Link to={createPageUrl("Dashboard")}>
                <Button variant="ghost" className="text-zinc-300 hover:text-white">
                  Log In
                </Button>
              </Link>
              <Link to={createPageUrl("Dashboard")}>
                <Button className="chrome-button">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      <main>
        {/* 1. Hero Section */}
        <section id="hero" className="py-24 md:py-32 px-6 sm:px-8 text-center">
          <div className="max-w-4xl mx-auto">
            {/* Hero Logo */}
            <div className="flex justify-center mb-8">
              <div className="logo-container">
                <img 
                  src={LOGO_URL}
                  alt="The Social Cleanup Logo"
                  className="hero-logo"
                  onError={(e) => {
                    // Fallback to text if logo fails to load
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <div style={{ display: 'none' }} className="text-3xl font-bold text-white">
                  The Social Cleanup
                </div>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent leading-tight">
              Clean up your audience.
              <br/>
              Boost your reach.
            </h1>
            <p className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
              Upload your Instagram Data Download and get a clean ghost follower report in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={createPageUrl("Dashboard")}>
                <Button size="lg" className="chrome-button px-8 w-full sm:w-auto">
                  Get Started
                </Button>
              </Link>
              <Button size="lg" variant="link" onClick={() => smoothScrollTo('how-it-works')} className="text-zinc-300">
                How it works <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </section>

        {/* 2. How It Works */}
        <section id="how-it-works" className="py-20 px-6 sm:px-8 bg-zinc-950">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              <div className="text-center md:text-left">
                <div className="p-4 chrome-icon-bg rounded-full inline-flex text-gray-800 font-bold text-xl mb-4">
                  1
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Download your Instagram data</h3>
                <p className="text-zinc-400">Request your data in JSON format from Instagram's account settings.</p>
              </div>
              <div className="text-center md:text-left">
                <div className="p-4 chrome-icon-bg rounded-full inline-flex text-gray-800 font-bold text-xl mb-4">
                  2
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Upload the ZIP to TSC</h3>
                <p className="text-zinc-400">Drag and drop the entire ZIP file you receive from Instagram.</p>
              </div>
              <div className="text-center md:text-left">
                <div className="p-4 chrome-icon-bg rounded-full inline-flex text-gray-800 font-bold text-xl mb-4">
                  3
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">See your ghost list</h3>
                <p className="text-zinc-400">Get a clear list of ghost followers and export it as a CSV.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Features Section */}
        <section id="features" className="py-24 px-6 sm:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 max-w-2xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Built for creators who want engagement that matters.
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FeatureCard 
                icon={<Sparkles className="w-6 h-6" />}
                title="Accurate ghost detection"
                description="Our algorithm analyzes activity to identify inactive and bot accounts."
              />
              <FeatureCard 
                icon={<FileSpreadsheet className="w-6 h-6" />}
                title="Easy CSV export"
                description="Download a list of ghost followers to manually remove them safely."
              />
              <FeatureCard 
                icon={<Crown className="w-6 h-6" />}
                title="Paid plans for serious creators"
                description="Upgrade for more scans, larger accounts, and advanced features."
              />
            </div>
          </div>
        </section>

        {/* 4. Pricing Section */}
        <section id="pricing" className="py-24 px-6 sm:px-8 bg-zinc-950">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 max-w-2xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Simple pricing for every creator.
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <PricingCard plan={pricingPlans[0]} />
              <PricingCard plan={pricingPlans[1]} isPopular={true} />
            </div>
          </div>
        </section>
        
        {/* 5. Call-to-action Footer */}
        <section id="cta-footer" className="py-20 px-6 sm:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Start your first scan today.
            </h2>
            <Link to={createPageUrl("Dashboard")}>
              <Button size="lg" className="chrome-button px-8">
                Get Started Free
              </Button>
            </Link>
            <p className="mt-6 text-zinc-400">
              Already have an account?{' '}
              <Link to={createPageUrl("Dashboard")} className="text-zinc-300 hover:text-white font-medium">
                Log in
              </Link>
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-12 px-6 sm:px-8">
        <div className="max-w-7xl mx-auto text-center text-sm text-zinc-500">
          © {new Date().getFullYear()} The Social Cleanup. All rights reserved.
        </div>
      </footer>
    </div>
  );
}