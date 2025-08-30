
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { 
  Users, 
  BarChart3, 
  Settings, 
  Crown, 
  User as UserIcon,
  LogOut,
  Shield,
  Menu,
  X,
  Target,
  Home,
  TrendingUp,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Replace this with your actual logo URL from App Profile
const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/52424afaf_ChatGPTImageAug252025at10_54_47AM.png"; // TODO: Update this path

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
    } catch (error) {
      // User not logged in - this is fine
    }
    setIsLoading(false);
  };

  const handleLogout = async () => {
    await User.logout();
    window.location.reload();
  };

  // Don't show sidebar on home page
  const isHomePage = currentPageName === 'Home';
  
  if (isHomePage) {
    return children;
  }

  const navigation = [
    { name: 'Dashboard', href: createPageUrl('Dashboard'), icon: BarChart3 },
    { name: 'Upload', href: createPageUrl('Upload'), icon: Users },
    { name: 'Scan Status', href: createPageUrl('Scan'), icon: Activity },
    { name: 'Ghost Followers', href: createPageUrl('GhostFollowers'), icon: Target },
    { name: 'Analytics', href: createPageUrl('Analytics'), icon: TrendingUp },
    { name: 'Settings', href: createPageUrl('Settings'), icon: Settings },
    { name: 'Billing', href: createPageUrl('Billing'), icon: Crown },
  ];

  if (user?.role === 'admin') {
    navigation.push({ name: 'Admin', href: createPageUrl('Admin'), icon: Shield });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-400 mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
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
        }
        .chrome-button:hover {
          background: linear-gradient(135deg, #e5e7eb 0%, #c5c9ce 20%, #9ca3ab 50%, #c5c9ce 80%, #e5e7eb 100%);
        }
        .chrome-icon-bg {
          background: linear-gradient(135deg, #f5f7fa 0%, #d9dde1 20%, #b4bcc4 50%, #d9dde1 80%, #f5f7fa 100%);
        }
        .logo-container {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(8px);
          border-radius: 8px;
          padding: 4px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .sidebar-logo {
          height: 32px;
          width: auto;
          max-width: 120px;
          object-fit: contain;
        }
      `}</style>

      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="text-white"
        >
          {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-zinc-950/95 backdrop-blur-xl border-r border-zinc-800 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-6 border-b border-zinc-800">
            <Link to={createPageUrl('Home')} className="flex items-center">
              <div className="logo-container">
                <img 
                  src={LOGO_URL}
                  alt="The Social Cleanup Logo"
                  className="sidebar-logo"
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
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href || 
                             (item.href.includes(currentPageName) && currentPageName !== 'Home');
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'chrome-button text-gray-800'
                      : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User menu */}
          <div className="p-4 border-t border-zinc-800">
            {user ? (
              <div className="space-y-4">
                <div className="flex items-center px-4 py-3 bg-zinc-800 rounded-lg">
                  <div className="w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center mr-3">
                    <UserIcon className="w-4 h-4 text-zinc-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {user.full_name}
                    </p>
                    <p className="text-xs text-zinc-400 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
                {user.role === 'admin' && (
                  <Badge className="w-full justify-center bg-red-600">
                    <Shield className="w-4 h-4 mr-1" />
                    Admin
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  className="w-full justify-start text-zinc-300 hover:text-white hover:bg-zinc-800"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Button className="w-full chrome-button">
                  Sign In
                </Button>
                <p className="text-xs text-zinc-500 text-center">
                  Connect to access your dashboard
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        <main className="min-h-screen">
          {children}
        </main>
      </div>

      {/* Mobile overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </div>
  );
}
