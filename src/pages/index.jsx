import Layout from "./Layout.jsx";

import Admin from "./Admin";

import Dashboard from "./Dashboard";

import GhostFollowers from "./GhostFollowers";

import Settings from "./Settings";

import Billing from "./Billing";

import Home from "./Home";

import Analytics from "./Analytics";

import Upload from "./Upload";

import Scan from "./Scan";

import AdminUserDetails from "./AdminUserDetails";

import AdminUsers from "./AdminUsers";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Admin: Admin,
    
    Dashboard: Dashboard,
    
    GhostFollowers: GhostFollowers,
    
    Settings: Settings,
    
    Billing: Billing,
    
    Home: Home,
    
    Analytics: Analytics,
    
    Upload: Upload,
    
    Scan: Scan,
    
    AdminUserDetails: AdminUserDetails,
    
    AdminUsers: AdminUsers,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Admin />} />
                
                
                <Route path="/Admin" element={<Admin />} />
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/GhostFollowers" element={<GhostFollowers />} />
                
                <Route path="/Settings" element={<Settings />} />
                
                <Route path="/Billing" element={<Billing />} />
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/Analytics" element={<Analytics />} />
                
                <Route path="/Upload" element={<Upload />} />
                
                <Route path="/Scan" element={<Scan />} />
                
                <Route path="/AdminUserDetails" element={<AdminUserDetails />} />
                
                <Route path="/AdminUsers" element={<AdminUsers />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}