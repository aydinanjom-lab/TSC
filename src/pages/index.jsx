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
};

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

function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);

    return (
        <Layout currentPageName={currentPage}>
            <Routes>
                <Route path="/" element={<Admin />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/ghostfollowers" element={<GhostFollowers />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/billing" element={<Billing />} />
                <Route path="/home" element={<Home />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/upload" element={<Upload />} />
                <Route path="/scan/:id" element={<Scan />} />
                <Route path="/adminuserdetails" element={<AdminUserDetails />} />
                <Route path="/adminusers" element={<AdminUsers />} />
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
