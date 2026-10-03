import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';
import ErrorBoundary from './components/common/ErrorBoundary';

const RouteTitleHandler = () => {
  const location = useLocation();
  useEffect(() => {
    const path = location.pathname;
    let title = 'DFSS | Distributed File Storage System';
    
    if (path.startsWith('/dashboard')) title = 'Dashboard | DFSS';
    else if (path.startsWith('/files')) title = 'My Files | DFSS';
    else if (path.startsWith('/storage')) title = 'Storage | DFSS';
    else if (path.startsWith('/activity')) title = 'Activity | DFSS';
    else if (path.startsWith('/settings')) title = 'Settings | DFSS';
    else if (path.startsWith('/profile')) title = 'Profile | DFSS';
    else if (path.startsWith('/shared')) title = 'Shared Files | DFSS';
    else if (path.startsWith('/favorites')) title = 'Favorites | DFSS';
    else if (path.startsWith('/recent')) title = 'Recent | DFSS';
    else if (path.startsWith('/login')) title = 'Sign In | DFSS';
    else if (path.startsWith('/register')) title = 'Create Account | DFSS';
    else if (path.startsWith('/admin')) title = 'Admin Dashboard | DFSS';
    
    document.title = title;
  }, [location.pathname]);
  
  return null;
};

// Standard Pages
import Dashboard from './pages/Dashboard';
import Files from './pages/Files';
import FileDetails from './pages/FileDetails';
import FileViewer from './pages/FileViewer';
import Shared from './pages/Shared';
import Storage from './pages/Storage';
import Activity from './pages/Activity';
import Favorites from './pages/Favorites';
import Recent from './pages/Recent';
import Expired from './pages/Expired';
import NodeDetails from './pages/NodeDetails';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import AuthPage from './pages/AuthPage';
import SharedView from './pages/SharedView';

import PublicLayout from './components/layout/PublicLayout';

// Public Pages
import LandingPage from './pages/public/LandingPage';
import FeaturesPage from './pages/public/FeaturesPage';
import SecurityPage from './pages/public/SecurityPage';
import HowItWorksPage from './pages/public/HowItWorksPage';
import FAQPage from './pages/public/FAQPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminNodes from './pages/admin/AdminNodes';
import AdminActivity from './pages/admin/AdminActivity';
import AdminUsers from './pages/admin/AdminUsers';
import AdminResearch from './pages/admin/AdminResearch';
import { AdminStorage, AdminExperiments, AdminAudit } from './pages/admin/AdminPlaceholders';

// Error Pages
import NotFound from './pages/errors/NotFound';
import Forbidden from './pages/errors/Forbidden';
import ServerError from './pages/errors/ServerError';

function App() {
  return (
    <BrowserRouter>
      <RouteTitleHandler />
      <ErrorBoundary>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/security" element={<SecurityPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/faq" element={<FAQPage />} />
          </Route>
          
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<AuthPage />} />
          <Route path="/shared/:token" element={<SharedView />} />
          
          {/* Error Routes */}
          <Route path="/404" element={<NotFound />} />
          <Route path="/403" element={<Forbidden />} />
          <Route path="/500" element={<ServerError />} />
          
          {/* Protected Application Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/shared" element={<Shared />} />
              <Route path="/files" element={<Files />} />
              <Route path="/files/:fileId" element={<FileDetails />} />
              <Route path="/files/:fileId/view" element={<FileViewer />} />
              <Route path="/storage" element={<Storage />} />
              <Route path="/storage/nodes/:nodeId" element={<NodeDetails />} />
              <Route path="/activity" element={<Activity />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/recent" element={<Recent />} />
              <Route path="/expired" element={<Expired />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/profile" element={<Profile />} />
              
              {/* Admin Only Routes */}
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/nodes" element={<AdminNodes />} />
                <Route path="/admin/activity" element={<AdminActivity />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/research" element={<AdminResearch />} />
                <Route path="/admin/storage" element={<AdminStorage />} />
                <Route path="/admin/experiments" element={<AdminExperiments />} />
                <Route path="/admin/audit" element={<AdminAudit />} />
              </Route>
            </Route>
          </Route>
          
          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
